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
interface GroupLambdaStackProps extends StackProps {
  groupChatGraphqlApi: CfnGraphQLApi;
  apiSchema: CfnGraphQLSchema;
  groupChatTable: Table;
  groupChatDatasource: CfnDataSource;
}

export class GroupLambdaStacks extends Stack {
  constructor(scope: Construct, id: string, props: GroupLambdaStackProps) {
    super(scope, id, props);

    const {
      groupChatTable,
      groupChatGraphqlApi,
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
      },
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
        "service-role/AWSAppSyncPushToCloudWatchLogs",
      ),
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
          "AddUserToGroupHandler.ts",
        ),

        memorySize: 1024,
      },
    );
    addUserToGroupLambda.role?.addManagedPolicy(
      ManagedPolicy.fromAwsManagedPolicyName(
        "service-role/AWSAppSyncPushToCloudWatchLogs",
      ),
    );

    const appsyncLambdaRole = new Role(this, "LambdaRole", {
      assumedBy: new ServicePrincipal("appsync.amazonaws.com"),
    });
    appsyncLambdaRole.addManagedPolicy(
      ManagedPolicy.fromAwsManagedPolicyName("AWSLambda_FullAccess"),
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
      },
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
      },
    );

    const createGroupResolver: CfnResolver = new CfnResolver(
      this,
      "createGroupResolver",
      {
        apiId: groupChatGraphqlApi.attrApiId,
        typeName: "Mutation",
        fieldName: "createGroup",
        dataSourceName: lambdaDataSources.attrName,
      },
    );

    const addUserToGroupResolver: CfnResolver = new CfnResolver(
      this,
      "addUserToGroupResolver",
      {
        apiId: groupChatGraphqlApi.attrApiId,
        typeName: "Mutation",
        fieldName: "addUserToGroup",
        dataSourceName: addUserToGroupDataSources.attrName,
      },
    );

    const getGroupsCreatedByUserResolver: CfnResolver = new CfnResolver(
      this,
      "getGroupsCreatedByUserResolver",
      {
        apiId: groupChatGraphqlApi.attrApiId,
        typeName: "Query",
        fieldName: "getAllGroupsCreatedByUser",
        dataSourceName: groupChatDatasource.name,
        requestMappingTemplate: readFileSync(
          "./lib/vtl/get_groups_created_by_user_request.vtl",
        ).toString(),

        responseMappingTemplate: readFileSync(
          "./lib/vtl/get_groups_created_by_user_response.vtl",
        ).toString(),
      },
    );

    const getGroupsUserBelongsToResolver: CfnResolver = new CfnResolver(
      this,
      "getAllGroupsUserBelongsTo",
      {
        apiId: groupChatGraphqlApi.attrApiId,
        typeName: "Query",
        fieldName: "getGroupsUserBelongsTo",
        dataSourceName: groupChatDatasource.name,
        requestMappingTemplate: readFileSync(
          "./lib/vtl/get_groups_user_belongs_to_request.vtl",
        ).toString(),

        responseMappingTemplate: readFileSync(
          "./lib/vtl/get_groups_user_belongs_to_response.vtl",
        ).toString(),
      },
    );

    const getGroupResolver: CfnResolver = new CfnResolver(
      this,
      "getGroupResolver",
      {
        apiId: groupChatGraphqlApi.attrApiId,
        typeName: "UserGroup",
        fieldName: "group",
        dataSourceName: groupChatDatasource.name,
        requestMappingTemplate: readFileSync(
          "./lib/vtl/get_group_request.vtl",
        ).toString(),

        responseMappingTemplate: readFileSync(
          "./lib/vtl/get_group_response.vtl",
        ).toString(),
      },
    );
    createGroupResolver.addDependsOn(apiSchema);
    addUserToGroupResolver.addDependsOn(apiSchema);
    getGroupsCreatedByUserResolver.addDependsOn(apiSchema);
    getGroupsUserBelongsToResolver.addDependsOn(apiSchema);
    getGroupResolver.addDependsOn(getGroupsUserBelongsToResolver);
    groupChatTable.grantFullAccess(createGroupLambda);
    groupChatTable.grantFullAccess(addUserToGroupLambda);
    createGroupLambda.addEnvironment("GroupChat_DB", groupChatTable.tableName);
  }
}
