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

interface MessageStackProps extends StackProps {
  groupChatGraphqlApi: CfnGraphQLApi;
  apiSchema: CfnGraphQLSchema;
  groupChatTable: Table;
  groupChatDatasource: CfnDataSource;
}

export class MessageStack extends Stack {
  constructor(scope: Construct, id: string, props: MessageStackProps) {
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
      }
    );

    const sendMessageLambda = new NodejsFunction(this, "MessageLambdaHandler", {
      tracing: Tracing.ACTIVE,
      codeSigningConfig,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "handler",
      entry: path.join(
        __dirname,
        "lambda_fns/message",
        "sendMessageHandler.ts"
      ),

      memorySize: 1024,
    });

    const typingIndicatorLambda = new NodejsFunction(
      this,
      "TypingIndicatorLambdaHandler",
      {
        tracing: Tracing.ACTIVE,
        codeSigningConfig,
        runtime: lambda.Runtime.NODEJS_16_X,
        handler: "handler",
        entry: path.join(
          __dirname,
          "lambda_fns/message",
          "typingIndicatorLambdaHandler.ts"
        ),

        memorySize: 1024,
      }
    );
    sendMessageLambda.role?.addManagedPolicy(
      ManagedPolicy.fromAwsManagedPolicyName(
        "service-role/AWSAppSyncPushToCloudWatchLogs"
      )
    );
    typingIndicatorLambda.role?.addManagedPolicy(
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
      "MessageLambdaDatasource",
      {
        apiId: groupChatGraphqlApi.attrApiId,
        name: "MessageLambdaDatasource",
        type: "AWS_LAMBDA",

        lambdaConfig: {
          lambdaFunctionArn: sendMessageLambda.functionArn,
        },
        serviceRoleArn: appsyncLambdaRole.roleArn,
      }
    );

    const typingIndicatorDataSources: CfnDataSource = new CfnDataSource(
      this,
      "TypingIndicatorDataSources",
      {
        apiId: groupChatGraphqlApi.attrApiId,
        name: "TypingIndicatorDataSources",
        type: "AWS_LAMBDA",

        lambdaConfig: {
          lambdaFunctionArn: typingIndicatorLambda.functionArn,
        },
        serviceRoleArn: appsyncLambdaRole.roleArn,
      }
    );

    const sendMessageResolver: CfnResolver = new CfnResolver(
      this,
      "sendMessageResolver",
      {
        apiId: groupChatGraphqlApi.attrApiId,
        typeName: "Mutation",
        fieldName: "sendMessage",
        dataSourceName: lambdaDataSources.attrName,
      }
    );
    const typingIndicatorResolver: CfnResolver = new CfnResolver(
      this,
      "typingIndicatorResolver",
      {
        apiId: groupChatGraphqlApi.attrApiId,
        typeName: "Mutation",
        fieldName: "typingIndicator",
        dataSourceName: typingIndicatorDataSources.attrName,
      }
    );

    const getResultMessagesPerGroupResolver: CfnResolver = new CfnResolver(
      this,
      "getResultMessagesPerGroupResolver",
      {
        apiId: groupChatGraphqlApi.attrApiId,
        typeName: "Query",
        fieldName: "getAllMessagesPerGroup",
        dataSourceName: groupChatDatasource.name,
        requestMappingTemplate: readFileSync(
          "./lib/vtl/get_all_messages_per_group_request.vtl"
        ).toString(),

        responseMappingTemplate: readFileSync(
          "./lib/vtl/get_all_messages_per_group_response.vtl"
        ).toString(),
      }
    );

    const getUserPerMessageResolver: CfnResolver = new CfnResolver(
      this,
      "getUserPerMessageResolver",
      {
        apiId: groupChatGraphqlApi.attrApiId,
        typeName: "Message",
        fieldName: "user",
        dataSourceName: groupChatDatasource.name,
        requestMappingTemplate: readFileSync(
          "./lib/vtl/get_user_per_message_request.vtl"
        ).toString(),

        responseMappingTemplate: readFileSync(
          "./lib/vtl/get_user_per_message_response.vtl"
        ).toString(),
      }
    );
    sendMessageResolver.addDependsOn(apiSchema);
    typingIndicatorResolver.addDependsOn(apiSchema);
    getResultMessagesPerGroupResolver.addDependsOn(apiSchema);

    getUserPerMessageResolver.addDependsOn(getResultMessagesPerGroupResolver);

    groupChatTable.grantFullAccess(sendMessageLambda);
    groupChatTable.grantFullAccess(typingIndicatorLambda);

    sendMessageLambda.addEnvironment("GroupChat_DB", groupChatTable.tableName);
    typingIndicatorLambda.addEnvironment(
      "GroupChat_DB",
      groupChatTable.tableName
    );
  }
}
