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
import { readFileSync } from "fs";

interface UserLambdaStackProps extends StackProps {
  groupChatGraphqlApi: CfnGraphQLApi;
  apiSchema: CfnGraphQLSchema;
  groupChatDatasource: CfnDataSource;
  groupChatTable: Table;
}
export class UserLambdaStacks extends Stack {
  constructor(scope: Construct, id: string, props: UserLambdaStackProps) {
    super(scope, id, props);

    const {
      groupChatGraphqlApi,
      groupChatTable,
      apiSchema,
      groupChatDatasource,
    } = props;
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
    const userLambda = new NodejsFunction(this, "GroupChatUserHandler", {
      tracing: Tracing.ACTIVE,
      codeSigningConfig,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "handler",
      entry: path.join(
        __dirname,
        "lambda_fns/user",
        "createUserAccountsLambda.ts"
      ),

      memorySize: 1024,
    });
    userLambda.role?.addManagedPolicy(
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
      "UserLambdaDatasource",
      {
        apiId: groupChatGraphqlApi.attrApiId,
        name: "UserLambdaDatasource",
        type: "AWS_LAMBDA",

        lambdaConfig: {
          lambdaFunctionArn: userLambda.functionArn,
        },
        serviceRoleArn: appsyncLambdaRole.roleArn,
      }
    );

    const createUserAccountResolver: CfnResolver = new CfnResolver(
      this,
      "createUserAccountResolver",
      {
        apiId: groupChatGraphqlApi.attrApiId,
        typeName: "Mutation",
        fieldName: "createUserAccount",
        dataSourceName: lambdaDataSources.attrName,
      }
    );
    const getUserResolver: CfnResolver = new CfnResolver(
      this,
      "getUserResolver",
      {
        apiId: groupChatGraphqlApi.attrApiId,
        typeName: "Query",
        fieldName: "getUserAccount",
        dataSourceName: groupChatDatasource.name,
        requestMappingTemplate: readFileSync(
          "./lib/vtl/get_user_request.vtl"
        ).toString(),

        responseMappingTemplate: readFileSync(
          "./lib/vtl/get_user_response.vtl"
        ).toString(),
      }
    );
    const getAllUsersResolver: CfnResolver = new CfnResolver(
      this,
      "getAllUsersResolver",
      {
        apiId: groupChatGraphqlApi.attrApiId,
        typeName: "Query",
        fieldName: "getAllUserAccounts",
        dataSourceName: groupChatDatasource.name,
        requestMappingTemplate: readFileSync(
          "./lib/vtl/get_all_users_request.vtl"
        ).toString(),

        responseMappingTemplate: readFileSync(
          "./lib/vtl/get_all_users_response.vtl"
        ).toString(),
      }
    );
    createUserAccountResolver.addDependsOn(apiSchema);
    getAllUsersResolver.addDependsOn(apiSchema);
    getUserResolver.addDependsOn(apiSchema);
    groupChatTable.grantFullAccess(userLambda);

    userLambda.addEnvironment("GroupChat_DB", groupChatTable.tableName);
  }
}
