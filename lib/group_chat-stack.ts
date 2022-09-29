import { CfnOutput, RemovalPolicy, Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as cognito from "aws-cdk-lib/aws-cognito";
import { UserPool, UserPoolClient } from "aws-cdk-lib/aws-cognito";

import {
  CfnDataSource,
  CfnGraphQLApi,
  CfnGraphQLSchema,
} from "aws-cdk-lib/aws-appsync";
import * as iam from "aws-cdk-lib/aws-iam";
import {
  AttributeType,
  BillingMode,
  ProjectionType,
  StreamViewType,
  Table,
} from "aws-cdk-lib/aws-dynamodb";
import { readFileSync } from "fs";
import { ManagedPolicy, Role, ServicePrincipal } from "aws-cdk-lib/aws-iam";

export class GroupChatStack extends Stack {
  public readonly groupChatTable: Table;
  public readonly groupChatGraphqlApi: CfnGraphQLApi;
  public readonly apiSchema: CfnGraphQLSchema;
  public readonly groupChatTableDatasource: CfnDataSource;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    /**
     * UserPool and UserPool Client
     */
    const userPool: UserPool = new cognito.UserPool(
      this,
      "GroupChatCognitoUserPool",
      {
        selfSignUpEnabled: true,
        accountRecovery: cognito.AccountRecovery.PHONE_AND_EMAIL,
        userVerification: {
          emailStyle: cognito.VerificationEmailStyle.CODE,
        },
        autoVerify: {
          email: true,
        },
        standardAttributes: {
          email: {
            required: true,
            mutable: true,
          },
        },
      }
    );
    const dynamoDBRole = new Role(this, "DynamoDBRole", {
      assumedBy: new ServicePrincipal("appsync.amazonaws.com"),
    });

    dynamoDBRole.addManagedPolicy(
      ManagedPolicy.fromAwsManagedPolicyName("AmazonDynamoDBFullAccess")
    );

    const userPoolClient: UserPoolClient = new cognito.UserPoolClient(
      this,
      "GroupChatUserPoolClient",
      {
        userPool,
      }
    );

    /**
     * CloudWatch Role
     */
    // give appsync permission to log to cloudwatch by assigning a role

    const cloudWatchRole = new iam.Role(this, "appSyncCloudWatchLogs", {
      assumedBy: new iam.ServicePrincipal("appsync.amazonaws.com"),
    });

    cloudWatchRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName(
        "service-role/AWSAppSyncPushToCloudWatchLogs"
      )
    );

    /**
     * GraphQL API
     */
    this.groupChatGraphqlApi = new CfnGraphQLApi(this, "groupChatGraphqlApi", {
      name: "groupChat",
      authenticationType: "API_KEY",

      additionalAuthenticationProviders: [
        {
          authenticationType: "AMAZON_COGNITO_USER_POOLS",

          userPoolConfig: {
            userPoolId: userPool.userPoolId,
            awsRegion: "us-east-2",
          },
        },
      ],
      userPoolConfig: {
        userPoolId: userPool.userPoolId,
        defaultAction: "ALLOW",
        awsRegion: "us-east-2",
      },

      logConfig: {
        fieldLogLevel: "ALL",
        cloudWatchLogsRoleArn: cloudWatchRole.roleArn,
      },
      xrayEnabled: true,
    });

    /**
     * Graphql Schema
     */

    this.apiSchema = new CfnGraphQLSchema(this, "GroupChatGraphqlApiSchema", {
      apiId: this.groupChatGraphqlApi.attrApiId,
      definition: readFileSync("./schema/schema.graphql").toString(),
    });

    /**
     * Database
     */

    this.groupChatTable = new Table(this, "groupChatDynamoDbTable", {
      tableName: "groupChatDynamoDBTable",

      partitionKey: {
        name: "PK",
        type: AttributeType.STRING,
      },
      sortKey: {
        name: "SK",
        type: AttributeType.STRING,
      },

      billingMode: BillingMode.PAY_PER_REQUEST,
      stream: StreamViewType.NEW_IMAGE,

      removalPolicy: RemovalPolicy.DESTROY,
    });

    this.groupChatTable.addGlobalSecondaryIndex({
      indexName: "getAllGroupsCreatedByUser",
      partitionKey: {
        name: "GSI1PK",
        type: AttributeType.STRING,
      },
      sortKey: {
        name: "GSI1SK",
        type: AttributeType.STRING,
      },

      projectionType: ProjectionType.ALL,
    });
    this.groupChatTable.addGlobalSecondaryIndex({
      indexName: "getMessagesPerGroup",
      partitionKey: {
        name: "GSI2PK",
        type: AttributeType.STRING,
      },
      sortKey: {
        name: "GSI2SK",
        type: AttributeType.STRING,
      },

      projectionType: ProjectionType.ALL,
    });

    this.groupChatTableDatasource = new CfnDataSource(
      this,
      "groupChatDynamoDBTableDataSource",
      {
        apiId: this.groupChatGraphqlApi.attrApiId,
        name: "AcmsDynamoDBTableDataSource",
        type: "AMAZON_DYNAMODB",
        dynamoDbConfig: {
          tableName: this.groupChatTable.tableName,
          awsRegion: this.region,
        },
        serviceRoleArn: dynamoDBRole.roleArn,
      }
    );

    /**
     * Outputs
     */

    new CfnOutput(this, "UserPoolId", {
      value: userPool.userPoolId,
    });
    new CfnOutput(this, "UserPoolClientId", {
      value: userPoolClient.userPoolClientId,
    });

    new CfnOutput(this, "GraphQLAPI ID", {
      value: this.groupChatGraphqlApi.attrApiId,
    });

    new CfnOutput(this, "GraphQLAPI URL", {
      value: this.groupChatGraphqlApi.attrGraphQlUrl,
    });
  }
}
