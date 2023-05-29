## Group Chat Stack

In this stack construct, we are going to provision the following infrastructure resources

- Cognito UserPool
- AppSync GraphQL Api
- DynamoDb Table
- CloudWatch and DynamoDB role managed Policies.

Inside `group-chat-stack.ts` file located in `lib` folder, we’ll defined constructs for the above resources. And because we’ll be using the resources in other stacks, we have to expose the resources somehow. We’ll see that in a bit.

### Security and Data Protection

Security and data protection for your applications is of utmost importance. AWS Appsync provides five different ways to authorize/authenticate a GraphQL api.

We will be using 2.

- `API_KEY`
- `AMAZON_COGNITO_USER_POOLS`

Amazon Cognito provides authentication, authorization, and user management for your web and mobile apps.

Your users can sign in directly with a username and password, or through a third party such as Facebook, Amazon, Google or Apple.

The two main components of Amazon Cognito are 

- user pools 
- identity pools. 

User pools are user directories that provide sign-up and sign-in options for your app users. 

Identity pools enable you to grant your users access to other AWS services. You can use identity pools and user pools separately or together.

An app is an entity within a user pool that has permission to call unauthenticated API operations.

Unauthenticated API operations are those that do not have an authenticated user. Examples include operations to register, sign in, and handle forgotten passwords. 

To call these API operations, you need an app client ID and an optional client secret. 

It is your responsibility to secure any app client IDs or secrets so that only authorized client apps can call these unauthenticated operations.

You can create multiple apps for a user pool. Typically, an app corresponds to the platform of an app.

For example, you might create an app for a server-side application and a different Android app. Each app has its own app client ID.

Let’s define the userpool and the userpool client

```typescript
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

const userPoolClient: UserPoolClient = new cognito.UserPoolClient(
  this,
  "GroupChatUserPoolClient",
  {
    userPool,
  }
);
```

Let’s go ahead to define the

- GraphQL API
- GraphQL Schema

Since we’ll be needing the graphql api and datasource construct definitions in other stacks, we need to expose them.

Here’s how it’s done. Firstly, initialize your construct like so

```typescript
export class GroupChatStack extends Stack {
  public readonly groupChatGraphqlApi: CfnGraphQLApi;
  public readonly apiSchema: CfnGraphQLSchema;

```

Then define them like so

```typescript
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
```

From the code above, we define the `API_KEY` as the default authorizer and `AMAZON_COGNITO_USER_POOLS` for more controlled access.

### DynamoDB for Data Storage

Our dynamoDB has a composite key(PK and SK) and 3 Global Secondary Indexes(GSI)
At the top of the `group-chat-stack.ts` file, add these

```typescript
  public readonly groupChatTable: Table; 👈---Add this line
  public readonly groupChatGraphqlApi: CfnGraphQLApi;
  public readonly apiSchema: CfnGraphQLSchema;
  public readonly groupChatTableDatasource: CfnDataSource; 👈---Add this line
```

Let's go ahead and define those

```typescript
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
  indexName: "groupsCreatedByUser",
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

this.groupChatTable.addGlobalSecondaryIndex({
  indexName: "groupsUserBelongTo",
  partitionKey: {
    name: "GSI3PK",
    type: AttributeType.STRING,
  },
  sortKey: {
    name: "GSI3SK",
    type: AttributeType.STRING,
  },

  projectionType: ProjectionType.ALL,
});
```

### Outputs

```typescript
new CfnOutput(this, "UserPoolId", {
  value: userPool.userPoolId,
});
new CfnOutput(this, "UserPoolClientId", {
  value: userPoolClient.userPoolClientId,
});

new CfnOutput(this, "GraphQLAPI ID", {
  value: this.acmsGraphqlApi.attrApiId,
});

new CfnOutput(this, "GraphQLAPI URL", {
  value: this.acmsGraphqlApi.attrGraphQlUrl,
});
```

Checkout the complete code here [group_chat-stack.ts](lib/group_chat-stack.ts)
