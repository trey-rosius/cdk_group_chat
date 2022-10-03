import { Stack, StackProps } from "aws-cdk-lib";
import {
  CfnDataSource,
  CfnGraphQLApi,
  CfnGraphQLSchema,
  CfnResolver,
} from "aws-cdk-lib/aws-appsync";
import * as signer from "aws-cdk-lib/aws-signer";
import { Table } from "aws-cdk-lib/aws-dynamodb";
import { ManagedPolicy, Role, ServicePrincipal } from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";
import * as path from "path";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Tracing } from "aws-cdk-lib/aws-lambda";

interface GroupLambdaStackProps extends StackProps {
  groupChatGraphqlApi: CfnGraphQLApi;
  apiSchema: CfnGraphQLSchema;
  groupChatTable: Table;
}

export class GroupLamdaStacks extends Stack {
  constructor(scope: Construct, id: string, props: GroupLambdaStackProps) {
    super(scope, id, props);

    const { groupChatTable, groupChatGraphqlApi, apiSchema } = props;
    const signingProfile = new signer.SigningProfile(this, "SigningProfile", {
      platform: signer.Platform.AWS_LAMBDA_SHA384_ECDSA,
    });

    const codeSigningConfig = new lambda.CodeSigningConfig(
      this,
      "CodeSigningConfig",
      {
        signingProfiles: [signingProfile],
      }
    );

    const createGroupLambda = new NodejsFunction(this, "GroupLambdaHandler", {
      tracing: Tracing.ACTIVE,
      codeSigningConfig,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "handler",
      entry: path.join(__dirname, "lambda_fns/group", "CreateGroupHandler.ts"),

      memorySize: 1024,
    });
    createGroupLambda.role?.addManagedPolicy(
      ManagedPolicy.fromAwsManagedPolicyName(
        "service-role/AWSAppSyncPushToCloudWatchLogs"
      )
    );

    const addUserToGroupLambda = new NodejsFunction(
      this,
      "addUserToGroupLambdaHandler",
      {
        tracing: Tracing.ACTIVE,
        codeSigningConfig,
        runtime: lambda.Runtime.NODEJS_16_X,
        handler: "handler",
        entry: path.join(
          __dirname,
          "lambda_fns/group",
          "AddUserToGroupHandler.ts"
        ),

        memorySize: 1024,
      }
    );
    addUserToGroupLambda.role?.addManagedPolicy(
      ManagedPolicy.fromAwsManagedPolicyName(
        "service-role/AWSAppSyncPushToCloudWatchLogs"
      )
    );

    const appsyncLambdaRole = new Role(this, "LambdaRole", {
      assumedBy: new ServicePrincipal("appsync.amazonaws.com"),
    });
    appsyncLambdaRole.addManagedPolicy(
      ManagedPolicy.fromAwsManagedPolicyName("AWSLambda_FullAccess")
    );
    const lambdaDataSources: CfnDataSource = new CfnDataSource(
      this,
      "GroupLambdaDatasource",
      {
        apiId: groupChatGraphqlApi.attrApiId,
        name: "GroupLambdaDatasource",
        type: "AWS_LAMBDA",

        lambdaConfig: {
          lambdaFunctionArn: createGroupLambda.functionArn,
        },
        serviceRoleArn: appsyncLambdaRole.roleArn,
      }
    );

    const addUserToGroupDataSources: CfnDataSource = new CfnDataSource(
      this,
      "AddUserToGroupLambdaDatasource",
      {
        apiId: groupChatGraphqlApi.attrApiId,
        name: "AddUserToGroupLambdaDatasource",
        type: "AWS_LAMBDA",

        lambdaConfig: {
          lambdaFunctionArn: addUserToGroupLambda.functionArn,
        },
        serviceRoleArn: appsyncLambdaRole.roleArn,
      }
    );

    const createGroupResolver: CfnResolver = new CfnResolver(
      this,
      "createGroupResolver",
      {
        apiId: groupChatGraphqlApi.attrApiId,
        typeName: "Mutation",
        fieldName: "createGroup",
        dataSourceName: lambdaDataSources.attrName,
      }
    );

    const addUserToGroupResolver: CfnResolver = new CfnResolver(
      this,
      "addUserToGroupResolver",
      {
        apiId: groupChatGraphqlApi.attrApiId,
        typeName: "Mutation",
        fieldName: "addUserToGroup",
        dataSourceName: addUserToGroupDataSources.attrName,
      }
    );
    createGroupResolver.addDependsOn(apiSchema);
    addUserToGroupResolver.addDependsOn(apiSchema);
    groupChatTable.grantFullAccess(createGroupLambda);
    groupChatTable.grantFullAccess(addUserToGroupLambda);
    createGroupLambda.addEnvironment("GroupChat_DB", groupChatTable.tableName);
  }
}
