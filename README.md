# Modern Serverless Application Development with AWS Amplify,Flutter, GraphQL,CDK and Typescript

Serverless computing is the most recent and recommended approach to building modern cloud applications.
Serverless enables developers to focuse on the business logic and how their application brings value to end users, rather than on configuration and operations of the servers running their applications.

By not focusing on operations or infrastructure provisioning, the time it takes for an application to move from prototype to production is cut in half. Iteration is rapid, user feedback is quick, leading to significant app improvements.
Let's take a look at a step by step guide on how to build a fullstack serverless mobile group chat application.
Here's a list of frameworks and languages we would be using in-order to accomplish this task.

- [AWS AppSync](https://aws.amazon.com/appsync/)
- [GraphQl](https://graphql.org/)
- [Cloud Development Kit(CDK)](https://aws.amazon.com/cdk/)
- [Typescript](https://www.typescriptlang.org/)
- [AWS Amplify](https://docs.amplify.aws/start/q/integration/flutter/)
- [Flutter](https://flutter.dev/)

## AWS AppSync

AWS AppSync allows developers to easily implement engaging real-time application experiences by automatically publishing data updates to subscribed API clients via serverless WebSockets connections.
With AWS AppSync, you can build APIs that support real-time data via WebSockets, so that your applications always have the most up-to-date information. AppSync also integrates well with core application features, such as authentication and authorization, so that you can focus on building the core functionality of your application.

Developers using AppSync can leverage

- AppSync real-time capabilities.
- Offline data synchronization.
- Built-in server-side caching.
- Fine-grained access control.
- Security.
- Support for business logic in the API layer using GraphQL resolvers, and more.

## GraphQl

GraphQL is a query language for APIs and a runtime for fulfilling those queries with your existing data. GraphQL provides a complete and understandable description of the data in your API, giving clients the power to ask for exactly what they need and nothing more.

## Cloud Development Kit(CDK)

CDK is an infrastructure as Code framework that helps you rapidly define your cloud resources using modern languages such as TypeScript, JavaScript, Python, Java, C#/. Net, and Go.

## AWS Amplify

Learn how to use Amplify to develop and deploy cloud-powered mobile and web apps.

## Flutter

Flutter is an open source framework by Google for building beautiful, natively compiled, multi-platform applications from a single codebase.

Flutter transforms the app development process. Build, test, and deploy beautiful mobile, web, desktop, and embedded apps from a single codebase

## What you'll learn

### Backend

- How to create a nested stack architecture using CDK.
- How to create a graphql API using AWS Appsync and CDK.
- How to secure(Authenticate and Authorize) the API using AWS Cognito.
- How to design a single table DynamoDB.
- How to implement Nested and pipeline resolvers using VTL.
- How to implement Direct Lambda resolvers.
- How to properly log events flowing through your application.
- How to implement a CI/CD pipeline to deploy your cdk application.

### Frontend

- How to create a full fledged flutter application to consume a GraphQL Api using AWS Amplify.
  This would involve
- Implementing Authentication mechanisms such as Sign in with Google, Sign in with username and password.
- Implementing Image uploads
- Implementing several screens to show case the complete group chat
- Implementing State Management using Provider.

## Application Entities

- Users
- Groups
- Messages
- Typing(typing indicator)

## Relationship Between Entities

#### Users and Groups

- Users and Groups have 2 different type of relationships, based on different scenarios.

#### Scenario 1(Create Group)

- A user can create multiple groups. A group can be created by 1 user.

- So there's a one to many relationship between user and group here.

#### Scenario 2 (Belong to)

- A user can belong to many groups and a group can have many users.

- Therefore there's a many to many relationship between user and group.

#### Groups And Messages

- Groups and Messages share a one to many relationship.

- A group can have many messages. But a message can belong only to one group.

#### Users and Messages

- Users and Messages share a one to many relationship.

- A user can have many messages. A message belongs to one user.

#### Users and Typing

- Users and typing share a one to one relationship.

## Access Patterns

- Create/Update/Delete User Accounts.
- Create/Update/Delete groups.
- Add a users to a group.
- Send Message in group.
- Typing Indicator when a group member is typing.
- Get all messages per group.
- Get Groups a user belongs to.
- Get all groups created by user.

## Solutions Architecture

![alt text](https://github.com/trey-rosius/cdk_group_chat/raw/master/images/groupChat_transparent.png)

## Database Model

We can model the application's entities by defining seperate tables as shown below

- Users
- Groups
- Messages
- Typing

This is good, no doubt. But this would require that we write 2 or more queries to get specific data from the database.
For example, getting users for a particular group involves making 2 queries.

First query gets the list of user ids from `groups` table, second query involves getting user information for each specific `userId` from `users` table.

So i'll prefer we use single table design for this application.

Meaning that, we would use one single table for all our entities. By having all entities in a single table, we can construct queries that return all the needed data with a single interaction with DynamoDB, speeding up the performance of the application for specific access patterns.

But, the improved performance for specific access patterns comes at the cost of potentially reduced performance for other access patterns and increased application and query complexity.

That's a design decision i'm confortable with. Let's proceed.

![alt text](https://github.com/trey-rosius/cdk_group_chat/raw/master/images/single_table.png)

Here's the database model. Feel free to downlaod it and use in the NoSQL Workbench.

[NoSQL Workbench JSON Model](https://github.com/trey-rosius/cdk_group_chat/raw/master/json/group_chat.json)

![alt text](https://github.com/trey-rosius/cdk_group_chat/raw/master/images/no_sql_workbench.png)

## Create CDK Project

From the command line interface(Terminal), create and change directory into the newly created folder using

`mkdir cdkGroupChatApp && cd $_`

Within the newly created folder, initialize a typescript cdk project using the command

`cdk init --language=typescript`

Once created, open up the app your IDE and lets proceed.

### Dependencies

With your project opened up in the IDE, click on the `package.json` file and add these dependencies to the `devDependencies` section.

```json
    "@aws-lambda-powertools/logger": "^1.2.1",
    "@aws-lambda-powertools/tracer": "^1.2.1",
    "@graphql-codegen/cli": "^2.13.1",
    "@graphql-codegen/typescript": "^2.7.3",
    "@types/aws-lambda": "^8.10.106",
    "aws-sdk": "^2.1153.0",
    "ksuid": "^2.0.0",
```

We’ll be using lambda-powertools for typescript library for structured logging and tracing.

Feel free to read more about the library here [https://awslabs.github.io/aws-lambda-powertools-typescript/latest/](https://awslabs.github.io/aws-lambda-powertools-typescript/latest/)

We'll be using both lambda and vtl as our Appsync resolvers. When using lambda(with Typescript),we want our typescript types to correspond with the graphql schema. Doing this manually is tedious, prone to error and is basically doing the same job twice!.

These 3 libraries would help us generate GraphQl types into our code automatically.

```json
    "@graphql-codegen/cli": "^2.13.1",
    "@graphql-codegen/typescript": "^2.7.3",
    "@types/aws-lambda": "^8.10.106",
```

The first two packages belong to the graphql-code-generator suite. The first one is the base CLI, while the second one is the plugin that generates TypeScript code from a GraphQL schema.

`@types/aws-lambda` is a collection of TypeScript types for AWS Lambda. It includes all sorts of Lambda event type definitions (API gateway, S3, SNS, etc.), including one for AppSync resolvers (AppSyncResolverHandler). We'll use that last one later when we build our resolvers.

`ksuid` stands for K-Sortable Unique Identifier. Its an efficient, comprehensive, battle-tested Go library for generating and parsing a specific kind of globally unique identifier called a *KSUID.*

KSUID are naturally ordered by generation time, meaning they can be sorted.

Learn more about the library here [https://github.com/segmentio/ksuid](https://github.com/segmentio/ksuid)

Don't forget to run `npm i` to install all the dependencies.

### Create and configure graphql-codegen

Create a file in the root directory of your project called `codegen.yml` and type in the following code.

```yaml
overwrite: true
schema:
  - schema/schema.graphql #your schema file

generates:
  appsync.d.ts:
    plugins:
      - typescript
```

This tells `graphql-codegen` which schema file(s) it should use (in the example: schema.graphql), what plugin (typescript) and where the output should be placed (appsync.d.ts).

### Support for AWS Scalars

Since we are using AWS Appsync to build out the GraphQL API, we'll be making use of [AWS Appsync Scalars](https://docs.aws.amazon.com/appsync/latest/devguide/scalars.html) which aren't available in the default GraphQL Language.

Therefore we need to tell `graphql-codegen` how to handle them.

Create another file in your project's root directory called `appsync.graphql` and add these scalars to it.

```graphql
scalar AWSDate
scalar AWSTime
scalar AWSDateTime
scalar AWSTimestamp
scalar AWSEmail
scalar AWSJSON
scalar AWSURL
scalar AWSPhone
scalar AWSIPAddress
```

## N.B

> ⚠️ Don't place these types in the same file as your main schema. You only need them for code generation and they should not get into your deployment package to AWS AppSync

We also need to tell `graphql-codegen` how to map these scalars to TypeScript. For that, we will modify the `codegen.yml` file and the following sections.

```yaml
schema:
  - schema/schema.graphql
  - appsync.graphql # 👈 add this

# and this 👇
config:
  scalars:
    AWSJSON: string
    AWSDate: string
    AWSTime: string
    AWSDateTime: string
    AWSTimestamp: number
    AWSEmail: string
    AWSURL: string
    AWSPhone: string
    AWSIPAddress: string
```

### Generate the Code

In-order to generate the code, create a folder called `schema` and then, create a file called `schema.graphql` within that folder.

Type in the following code. This is the graphql schema for our api. I'll explain each line as we move along.

```graphql
schema {
  query: Query
  mutation: Mutation
  subscription: Subscription
}

type Subscription {
  typingIndicator: TypingIndicator
    @aws_subscribe(mutations: ["typingIndicator"])
  newMessage: Message @aws_subscribe(mutations: ["sendMessage"])
}

type Mutation {
  createUserAccount(input: UserInput!): User! @aws_cognito_user_pools
  updateUserAccount(input: UpdateUserInput!): User! @aws_cognito_user_pools

  createGroup(input: GroupInput!): Group! @aws_cognito_user_pools
  addUserToGroup(userId: String!, groupId: String!): Boolean!
    @aws_cognito_user_pools
  sendMessage(input: MessageInput!): Message! @aws_cognito_user_pools

  typingIndicator(
    userId: String!
    groupId: String!
    typing: Boolean!
  ): TypingIndicator! @aws_cognito_user_pools
}

type TypingIndicator @aws_cognito_user_pools {
  userId: String!
  groupId: String!
  typing: Boolean!
}
type Query {
  getAllGroupsCreatedByUser(
    userId: String!
    limit: Int
    nextToken: String
  ): GroupResult! @aws_cognito_user_pools
  getAllMessagesPerGroup(
    groupId: String!
    limit: Int
    nextToken: String
  ): MessageResult! @aws_cognito_user_pools
  getGroupsUserBelongsTo(
    userId: String!
    limit: Int
    nextToken: String
  ): UserGroupResult! @aws_cognito_user_pools
}

type User @aws_cognito_user_pools {
  id: ID!
  username: String!
  email: String!
  profilePicUrl: String!
  updatedOn: AWSDateTime
  createdOn: AWSDateTime
}

input UserInput @aws_cognito_user_pools {
  username: String!
  email: String!
  profilePicUrl: String!
}

input UpdateUserInput @aws_cognito_user_pools {
  id: ID!
  username: String!
  profilePicUrl: String!
}

type Message @aws_cognito_user_pools {
  id: ID!
  userId: String!
  user: User
  groupId: String!
  messageText: String!
  createdOn: AWSTimestamp!
}

type MessageResult @aws_cognito_user_pools {
  items: [Message!]!
  nextToken: String
}
input MessageInput @aws_cognito_user_pools {
  userId: String!
  groupId: String!
  messageText: String!
}

type UserGroup @aws_cognito_user_pools {
  userId: String!
  group: Group!
  createdOn: AWSTimestamp!
}

type Group @aws_cognito_user_pools {
  id: ID!
  userId: String!
  name: String!
  description: String!
  createdOn: AWSTimestamp!
}

input GroupInput {
  userId: String!
  name: String!
  description: String!
}
type GroupResult @aws_cognito_user_pools {
  items: [Group!]! @aws_cognito_user_pools
  nextToken: String
}
type UserGroupResult @aws_cognito_user_pools {
  items: [UserGroup!]! @aws_cognito_user_pools
  nextToken: String
}
```

Save the file and run the following command in your cli

`graphql-codegen`

Add `"codegen": "graphql-codegen"` to your package.json under the "scripts" section, and use `npm run codegen` command.

```json
  "scripts": {
    "build": "tsc",
    "watch": "tsc -w",
    "test": "jest",
    "cdk": "cdk",
    "codegen": "graphql-codegen"  👈 --- Add this
  },
```

If you look in your working directory, you should now see an appsync.d.ts file that contains your generated types.
We will go indepth on the file contents as we progress along.

### Application Stacks

We are going to have a total of 4 stacks. Let me apologize in advance for the stack names. Please feel free to give yours better stack names.

- The main application Stack(group_chat_stack). Defines the Appsync API, Database, Datasource etc for the complete app
- User Lambda Stack (For User Resources)
- Group Lambda Stack (For Group Resources)
- Message Lambda Stack (For Message Resources)

To provision infrastructure resources, all constructs that represent AWS resources must be defined, directly or indirectly, within the scope of a Stack construct.

An App is a container for one or more stacks: it serves as each stack’s scope. Stacks within a single App can easily refer to each others’ resources (and attributes of those resources).

The AWS CDK infers dependencies between stacks so that they can be deployed in the correct order. You can deploy any or all of the stacks defined within an app at with a single `cdk deploy` or `cdk deploy --all` command.

Our app is defined in the `bin` folder, while stacks are in the `lib` folder.

Add your `account` and `region` to the `env` object in the cdk app file located in the `bin` folder.

```typescript
const app = new cdk.App();
const groupChatStack = new GroupChatStack(app, "GroupChatStack", {
  env: { account: "13xxxxxxxxxx", region: "us-east-2" },
});
```

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

Your users can sign in directly with a user name and password, or through a third party such as Facebook, Amazon, Google or Apple.

The two main components of Amazon Cognito are user pools and identity pools. User pools are user directories that provide sign-up and sign-in options for your app users. Identity pools enable you to grant your users access to other AWS services. You can use identity pools and user pools separately or together.

An app is an entity within a user pool that has permission to call unauthenticated API operations. Unauthenticated API operations are those that do not have an authenticated user. Examples include operations to register, sign in, and handle forgotten passwords. To call these API operations, you need an app client ID and an optional client secret. It is your responsibility to secure any app client IDs or secrets so that only authorized client apps can call these unauthenticated operations.

You can create multiple apps for a user pool. Typically, an app corresponds to the platform of an app. For example, you might create an app for a server-side application and a different Android app. Each app has its own app client ID.

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

## User Stack

In this stack, we’ll define all infrastructure related to the user entity.

For this tutorial, we have 2 user related endpoints defined in the `schema.graphql` file located in the `schema` folder.

But we will implement the `createUserAccount` endpoint only.

```graphql
createUserAccount(input: UserInput!): User! @aws_cognito_user_pools
updateUserAccount(input: UpdateUserInput!): User! @aws_cognito_user_pools
```

Create a file called `user-lambda-stack.ts` in the `lib` folder. When we created the main stack(`group_chat_stack`) above, we made a couple of resources public. Meaning they could be shared and used within the other stacks.

```typescript
  public readonly groupChatTable: Table;
  public readonly groupChatGraphqlApi: CfnGraphQLApi;
  public readonly apiSchema: CfnGraphQLSchema;
  public readonly groupChatTableDatasource: CfnDataSource;
```

At the top of the `user-lambda-stack.ts` file, create an interface which extends `StackProps` and define the 3 resources we intend importing from the main stack.

```typescript
interface UserLambdaStackProps extends StackProps {
  groupChatGraphqlApi: CfnGraphQLApi;
  apiSchema: CfnGraphQLSchema;
  groupChatTable: Table;
}
```

Then, in the constructor for class `UserLambdaStacks`, change `StackProps` to `UserLambdaStackProps`.

So now, here’s how the `user-lambda-stack` looks like

```typescript
interface UserLambdaStackProps extends StackProps {
  groupChatGraphqlApi: CfnGraphQLApi;
  apiSchema: CfnGraphQLSchema;
  groupChatTable: Table;
}
export class UserLamdaStacks extends Stack {
  constructor(scope: Construct, id: string, props: UserLambdaStackProps) {
    super(scope, id, props);

    const { groupChatGraphqlApi, groupChatTable, apiSchema } = props;
  }
}
```

Notice that we’ve also de-structured the `props` to get all the resources defined in the interface.

We are going to be using a lambda resolver to resolve all endpoints for this user entity.

Let’s continue

### User Lambda Resolver

Inside the `lib` folder, create a folder called `lambda-fns`. This folder would contain code files for all our lambda functions and entities.

Inside the `lambda-fns` folder, create another folder called `user`.
Create a file called `CreateUserAccountsLambda.ts`, which would serves as the lambda handler for the `createUserAccount` endpoint.

Inside the `user_lambda_stack.ts` file, defined your lambda resource as follows

```typescript
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
  entry: path.join(__dirname, "lambda_fns/user", "CreateUserAccountsLambda.ts"),

  memorySize: 1024,
});
```

The first endpoint we are going to implement is the `createUserAccount` endpoint, which takes input.

```graphql
input UserInput @aws_cognito_user_pools {
  username: String!
  email: String!
  profilePicUrl: String!
}
```

It outputs

```graphql
type User @aws_cognito_user_pools {
  id: ID!
  username: String!
  email: String!
  profilePicUrl: String!
  updatedOn: AWSDateTime
  createdOn: AWSDateTime
}
```

`@aws_cognito_user_pools ` is an appsync directive that enforces security, by making sure only authorized users can access that resource.

Also define the lambda datasource and resolver resources as follows inside the user stack.

```typescript
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
//Grant permissions and add dependsOn

createUserAccountResolver.addDependsOn(apiSchema);
groupChatTable.grantFullAccess(userLambda);
//set the database table name as an environment variable for the lambda function
userLambda.addEnvironment("GroupChat_DB", groupChatTable.tableName);
```

Here's the [complete code](lib/user_lambda_stack.ts) for this file.

Now, let's go ahead and look at the code to create a user account in the `CreateUserAccountsLambda.ts` file.

Remember we had used `npm run codegen` to generate types for our graphql schema into the `appsync.d.ts` file.

Within this file, different types are being generated.

Scalars contain all the basic and AWS Custom Scalars.

Full `Query` and `Mutation` types are being defined for `User`, `Message`,`Group` etc.

`MutationCreateUserAccountArgs ` type describes the input arguments of the `createUserAccount` endpoint.
`QueryGetAllGroupsCreatedByUserArgs ` type describes the output arguments of the `getAllGroupsCreatedByUser` endpoint.

> 💡Did you notice the name pattern here? Argument types are always named Query[NameOfTheEndpoint]Args and Mutation[NameOfTheEndpoint]Args in PascalCase. This is useful to know when you want to auto-complete types in your IDE.

We are going to be using the `AppSyncResolverHandler` type, which takes two arguments. The first one is the type for the `event.arguments`(`MutationCreateUserAccountArgs`) object, and the second one is the return value of the resolver(`User`).

Back to the `CreateUserAccountsLambda.ts` file, let' start building the handler.

Firstly, we'll import a couple of functions

- Logger(For capturing key fields from the Lambda context, cold starts, and structure logging output as JSON)
- `AppSyncResolverHandler` from the aws lambda package.
- `DynamoDB` object from aws sdk
- `User` and `MutationCreateUserAccountArgs` from the generated `appsync.d.ts` file
- `uuid` and `executeTransactWrite` from a custom utils file, created by us.

```typescript
import { Logger } from "@aws-lambda-powertools/logger";

import { AppSyncResolverHandler } from "aws-lambda";
import { DynamoDB } from "aws-sdk";

//imported generated types
import { User, MutationCreateUserAccountArgs } from "../../../appsync";
// utility functions to generate ksuid's and execute dynamodb transactions
import { uuid, executeTransactWrite } from "../../utils";
/*
The Logger utility must always be instantiated outside the Lambda handler.
By doing this, subsequent invocations processed by the same instance of your function can reuse these resources. This saves cost by reducing function run time. In addition, Logger can keep track of a cold start and inject the appropriate fields into logs.
*/
const logger = new Logger({ serviceName: "CreateUserAccountsHandler" });

export const handler: AppSyncResolverHandler<
  MutationCreateUserAccountArgs,
  User
> = async (event) => {
  logger.debug(`appsync event arguments ${JSON.stringify(event)}`);

  // Get an instance of the the DynamoDB DocumentClient
  const documentClient = new DynamoDB.DocumentClient();
  // Get the dynamodb table name of the environment variable.
  let tableName = process.env.GroupChat_DB;

  const createdOn: number = Date.now();
  // get a unique ksuid
  const id: string = uuid();
  if (tableName === undefined) {
    logger.error(`Couldn't get the table name`);
    tableName = "groupChatDynamoDBTable";
  }

  logger.info(`message input info", ${JSON.stringify(event.arguments)}`);

  // grab user submitted input from the input arguments
  const { username, email, profilePicUrl } = event.arguments.input;
};
```

We'll use user attributes to maintain uniqueness of a user entity.

- username
- email

So when a user attempts to create an account, we'll make sure there isn't already a user in the database with that same username and email.

We'll use a dynamodb transaction to accomplish this task.

```typescript
const params = {
  TransactItems: [
    {
      Put: {
        Item: {
          id: id,

          ENTITY: "USER",

          PK: `USER#${username}`,

          SK: `USER#${username}`,

          username: username,

          email: email,

          profilePicUrl: profilePicUrl,

          createdOn: createdOn,
        },
        TableName: tableName,
        ConditionExpression: "attribute_not_exists(PK)",
      },
    },
    {
      Put: {
        Item: {
          id: id,

          ENTITY: "USER",

          PK: `USEREMAIL#${email}`,

          SK: `USEREMAIL#${email}`,

          email: email,

          createdOn: createdOn,
        },
        TableName: tableName,
        ConditionExpression: "attribute_not_exists(PK)",
      },
    },
  ],
};

try {
  await executeTransactWrite(params, documentClient);
  return {
    id,
    username,
    email,
    profilePicUrl,
  };
} catch (error: any) {
  logger.error(`an error occured while sending message ${error}`);
  logger.error("Error creating user account");

  let errorMessage = "Could not create user account";

  if (error.code === "TransactionCanceledException") {
    if (error.cancellationReasons[0].Code === "ConditionalCheckFailed") {
      errorMessage = "User with this username already exists.";
    } else if (error.cancellationReasons[1].Code === "ConditionalCheckFailed") {
      errorMessage = "User with this email already exists.";
    }
  }
  throw new Error(errorMessage);
}
```

Notice that we maintain uniqueness by adding a conditional expression `"ConditionExpression:attribute_not_exists(PK)"`,in each of the `put` requests in the transactWrite function.

Also, we are using a transactWrite because of it's atomic feature. Either all the requests succeed, or all fail.

Incase of a failure, we catch the exception and return a user friendly message back through the graphql api.

### Add UserLambdaStack to CDK APP

Please make sure you have the complete code.

Open up the `group_chat.ts` file in the `bin` folder and add the `user_lambda_stack.ts` stack.

```typescript
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { GroupChatStack } from "../lib/group_chat_stack";
import { UserLamdaStacks } from "../lib/user_lambda_stack";
import { GroupLamdaStacks } from "../lib/group_lambda_stack";
import { MessageLamdaStacks } from "../lib/message_lambda_stack";

const app = new cdk.App();
const groupChatStack = new GroupChatStack(app, "GroupChatStack", {
  env: { account: "13xxxxxxxxxx", region: "us-east-2" },
});

new UserLamdaStacks(app, "UserLambdaStacks", {
  env: { account: "13xxxxxxxxxx", region: "us-east-2" },
  groupChatTable: groupChatStack.groupChatTable,
  apiSchema: groupChatStack.apiSchema,
  groupChatGraphqlApi: groupChatStack.groupChatGraphqlApi,
});
```

Now that we have the user stack setup, let's move on to the group stack.

## Group Stack

This stack would contain all resources related to the group.

Here are the endpoints related to the group stack.

#### Mutation

```graphql

 createGroup(input: GroupInput!): Group! @aws_cognito_user_pools

 addUserToGroup(userId: String!, groupId: String!): Boolean! @aws_cognito_user_pools

```

#### Query

```graphql
 getAllGroupsCreatedByUser(userId: String! limit: Int nextToken: String): GroupResult! @aws_cognito_user_pools

 getGroupsUserBelongsTo(userId: String! limit: Int nextToken: String): UserGroupResult! @aws_cognito_user_pools
```

2 Mutations and 2 queries.

Let's begin by creating the resources for the Group Stack.

Create a file called `group_lambda_stack.ts` in the `lib` folder.

We'll need to get the shared resources we declared in the main stack, same as we did in the user lambda stack.

```typescript
interface GroupLambdaStackProps extends StackProps {
  groupChatGraphqlApi: CfnGraphQLApi;
  apiSchema: CfnGraphQLSchema;
  groupChatTable: Table;
  groupChatDatasource: CfnDataSource;
}
```

Then we replace `StackProps` with `GroupLambdaStackProps` in the GroupLambdaStack constructor.

We'll then get all shared resources(from the interface) by destructuring the `props` object.

```typescript
export class GroupLamdaStacks extends Stack {
  constructor(scope: Construct, id: string, props: GroupLambdaStackProps) {
    super(scope, id, props);

    const {
      groupChatTable,
      groupChatGraphqlApi,
      apiSchema,
      groupChatDatasource,
    } = props;
  }
}
```

We'll use lambda resolvers for the `Mutations` and VTL templates for `Queries`.

I do this for 2 reasons

- VTL templates are fast. Zero cold starts.
- The lesser the lambda functions the lesser the cold starts and the faster the application.
- I just love retrieving data using VTL templates.

Let's create 2 lambda functions handler in the `lib/lambda_fns/group` folder.

- `CreateGroupHandler.ts`
- `AddUserToGroupHandler.ts`

### Create Group Handler

This function takes an input made up of the userId for the user creating the group, the group name and description and saves them to the database.

The function bears a similar structure to the `CreateUserAccountsHandler.ts` handler. The only difference here is that, we get to use a dynamodb put request, instead of a transact write.

It has these composite keys

```typescript
PK: `GROUP#${this.id}`;
SK: `GROUP#${this.id}`;
```

Which we can use to get the group. And also, we save a GSI for getting all groups for a particular user.

```typescript
 GSI1PK: `USER#${this.userId}`,
 GSI1SK: `GROUP#${this.id}`,
```

```typescript
const logger = new Logger({ serviceName: "CreateGroupLambda" });

export const handler: AppSyncResolverHandler<
  MutationCreateGroupArgs,
  Group
> = async (event) => {
  const groupInput: GroupEntity = new GroupEntity({
    id: id,
    ...event.arguments.input,
    createdOn,
  });

  logger.info(`group input info", ${JSON.stringify(groupInput)}`);
  const params = {
    TableName: tableName,
    Item: groupInput.toItem(),
  };

  try {
    await documentClient.put(params).promise();
    return groupInput.graphQlReturn();
  } catch (error: any) {
    logger.error(`an error occured while creating user ${error}`);
    throw error;
  }
};
```

We've also used a `GroupEntity` class that contains helper functions to assign the keys and construct a return type.

```typescript
  toItem() {
    return {
      ...this.key(),
      ...this.gsi1Key(),
      id: this.id,
      ENTITY: "GROUP",

      userId: this.userId,
      name: this.name,
      description: this.description,

      createdOn: this.createdOn,
    };
  }

  graphQlReturn() {
    return {
      id: this.id,
      userId: this.userId,
      name: this.name,
      description: this.description,
      createdOn: this.createdOn,
    };
  }
}

export default GroupEntity;
```

Get the complete code for [GroupEntity](lib/lambda_fns/group/GroupEntity.ts) here.

### Add User To Group

When a group is created, the next logical step is to add your friends.

This handler adds a user to a group, and also adds the group to the user's groups.

The composite key for adding a user to a group is

```typescript
PK: `GROUP#${groupId}`;
SK: `USER#${userId}`;
```

There's also another composite key for adding a group to the user's groups.

```typescript
      GSI3PK: `USER#${userId}`,
      GSI3SK: `GROUP#${groupId}`,

```

```typescript
const logger = new Logger({ serviceName: "AddUserToGroupLambda" });
export const handler: AppSyncResolverHandler<
  MutationAddUserToGroupArgs,
  Boolean
> = async (event) => {
  const documentClient = new DynamoDB.DocumentClient();
  let tableName = process.env.GroupChat_DB;
  const createdOn = Date.now().toString();
  const id: string = uuid();
  if (tableName === undefined) {
    logger.error(`Couldn't get the table name`);
    tableName = "groupChatDynamoDBTable";
  }

  logger.info(`"group input info", ${JSON.stringify(event.arguments)}`);
  const { userId, groupId } = event.arguments;
  const params = {
    TableName: tableName,
    Item: {
      id: id,
      PK: `GROUP#${groupId}`,
      SK: `USER#${userId}`,
      GSI3PK: `USER#${userId}`,
      GSI3SK: `GROUP#${groupId}`,
      userId: userId,
      groupId: groupId,
      createdOn: createdOn,
    },
  };

  try {
    await documentClient.put(params).promise();
    return true;
  } catch (error: any) {
    logger.error(`an error occured while creating user ${error}`);
    return false;
  }
};
```

Now, back to the `group_lambda_stack.ts` stack file. Here are a couple steps we are about to perform.

- Create Lambda Handler
- Create and Assign Lambda Appsync role
- Assign Lambda Cloudwatch service role
- Create Lambda Datasource
- Create lambda resolver and attach to Datasource
- Attach Lambda resolver to api schema.
- Grant DynamoDB full access to lambda function

Here's how we define the `CreateGroupHandler.ts` lambda function, which outputs logs to cloudwatch.

```typescript
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
```

Next, we need to create and assign an `appsynclambdarole`. This role would give appsync full access to our lambda function.

```typescript
const appsyncLambdaRole = new Role(this, "LambdaRole", {
  assumedBy: new ServicePrincipal("appsync.amazonaws.com"),
});
appsyncLambdaRole.addManagedPolicy(
  ManagedPolicy.fromAwsManagedPolicyName("AWSLambda_FullAccess")
);
```

We've assigned a `AWSLambda_FullAccess` policy role which goes against the principle of `least privilege`. In a production app, you want to grant only the permissions required for the lambda to run effectively.Maybe a READ/WRITE access policy only, in-order to avoid unforseen circumstancies.

Now, we need to create our datasource and assign the role which we created above.

```typescript
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
```

Then, we create a resolver and attach the datasource to it.

```typescript
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
```

Notice the `typeName`, `fieldName` and the `dataSourceName`.

The resolver depends on our graphql schema

`createGroupResolver.addDependsOn(apiSchema);`

Grant dynamodb full access to lambda function
` groupChatTable.grantFullAccess(createGroupLambda);`

Remember we accessed the dynamodb name in our lambda function through an environment variable. Here's how we assigned the environment variable to the lambda function.

`createGroupLambda.addEnvironment("GroupChat_DB", groupChatTable.tableName);`

Now, i would love for you to do these same process, for the `addUserToGroup` mutation endpoint. It's very similar to what we've just done. Here's the [complete code](lib/group_lambda_stack.ts).

### getAllGroupsCreatedByUser

This is a Query request, which would either return an empty list or a list of groups the requesting user created.
This request suppports pagination, so we will be using `limit`, to limit the amount of data we demand per request, and also `nextToken` to provide a string to the next position our request should start demanding from.

Hope that makes sense.

We would be using AWS VTL(Velocity Template Language) templates. AWS AppSync uses VTL to translate GraphQL requests from clients into a request to your data source.

Then it reverses the process to translate the data source response back into a GraphQL response.

Here's the endpoint schema

```graphql
  getAllGroupsCreatedByUser(
    userId: String!
    limit: Int
    nextToken: String
  ): GroupResult! @aws_cognito_user_pools

```

It's an authenticated `@aws_cognito_user_pools` request. It takes the `userId`, `limit`and `nextToken` to and returns a group result.The group result is made up of a list of Group objects and the `nextToken`.

```graphql
type GroupResult @aws_cognito_user_pools {
  items: [Group!]! @aws_cognito_user_pools
  nextToken: String
}
```

Create a folder in your main project called `vtl`. This folder would contain all the vtl templates for our project.

Within the `vtl` folder, create a file called `get_groups_created_by_user_request.vtl` and type in the following code.

```bash

#set($limit=$util.defaultIfNull($ctx.args.limit, 10))
#if($limit>10)
  #set($limit=10)
#end
 #set($gsi1pk = $util.dynamodb.toStringJson("USER#${ctx.args.userId}"))
 #set($gsi1sk = $util.dynamodb.toStringJson("GROUP#"))
{
    "version" : "2018-05-29",

    "operation" : "Query",
    "limit": $util.toJson($limit),
    "nextToken":$util.toJson($util.defaultIfNull($ctx.args.nextToken, null)),
    "query" : {
        "expression": "#GSI1PK = :GSI1PK and begins_with(#GSI1SK,:GSI1SK)",
        "expressionNames":{
        "#GSI1PK":"GSI1PK",
        "#GSI1SK":"GSI1SK"
        },

        "expressionValues" : {
            ":GSI1PK" : $gsi1pk,
            ":GSI1SK" :$gsi1sk
        },

    },
    "index":"groupsCreatedByUser",
    "scanIndexForward" : true


}

```

The first line gets the limit from the request and sets it to a variable called `$limit`. If no limit was sent, a default of 10 is applied.
If a limit of more than 10(> 10) was sent, we default to 10(`#set($limit=10)`), before proceeding.

This limit represents the amount of data objects we want back with every request.

We also get the `nextToken` from the request and if none was sent, this implies it's the first request. So we default the `nextToken` variable to `null` since it's a string.

For the `nextToken` variable, `$util.toJson($util.defaultIfNull($ctx.args.nextToken, null))`.

Getting the groups created by a user involves using our first Global Secondary index(GSI1), which was
` indexName: "groupsCreatedByUser"`.

We would use `begins_with (a, substr)` function in our query operation to carryout this request. We want all groups for a particular user that begins with `GROUP#`.

`"expression": "#GSI1PK = :GSI1PK and begins_with(#GSI1SK,:GSI1SK)",`

Now for the response, create a file called `get_groups_created_by_user_response.vtl` in the `vtl` folder and type in the following code.

```bash

## Raise a GraphQL field error in case of a datasource invocation error
#if($ctx.error)
    $util.error($ctx.error.message, $ctx.error.type)
#end
## Pass back the result from DynamoDB. **
$util.toJson({
  "nextToken": $ctx.result.nextToken,
  "items": $ctx.result.items
})

```

Notice that we pass back a list of items and a string for the `nextToken`.

Let's go back the `group_lambda_stack.ts` stack file and connect these vtl mapping templates to a resolver.

Our datasource for these resolver, is created from the dynamoDB table in the main stack file(`group_chat_stack.ts`).

```typescript
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
```

Attach mapping templates and dataSource to resolver.

```typescript
const getGroupsCreatedByUserResolver: CfnResolver = new CfnResolver(
  this,
  "getGroupsCreatedByUserResolver",
  {
    apiId: groupChatGraphqlApi.attrApiId,
    typeName: "Query",
    fieldName: "getAllGroupsCreatedByUser",
    dataSourceName: groupChatDatasource.name,
    requestMappingTemplate: readFileSync(
      "./lib/vtl/get_groups_created_by_user_request.vtl"
    ).toString(),

    responseMappingTemplate: readFileSync(
      "./lib/vtl/get_groups_created_by_user_response.vtl"
    ).toString(),
  }
);
```

Attach resolver to graphql schema

`getGroupsCreatedByUserResolver.addDependsOn(apiSchema);`

### getGroupsUserBelongsTo

The next query is `getGroupsUserBelongsTo`.

The graphql schema for this endpoint is

```graphql
  getGroupsUserBelongsTo(
    userId: String!
    limit: Int
    nextToken: String
  ): UserGroupResult! @aws_cognito_user_pools

```

It's similar the `getAllGroupsCreatedByUser` with one main difference. `UserGroupResult` returns a list of `UserGroup` objects and a `nextToken` string.

```graphql
type UserGroupResult @aws_cognito_user_pools {
  items: [UserGroup!]! @aws_cognito_user_pools
  nextToken: String
}
```

A `UserGroup` object has the following structure

```graphql
type UserGroup @aws_cognito_user_pools {
  userId: String!
  group: Group!
  createdOn: AWSTimestamp!
}
```

As you can see, there is a nested group object within the `UserGroup` object, and this field would need to be resolved.

So you are about to learn something new now.

## How to resolve nested fields in Graphql with CDK, Appsync and VTL.

Within the `vtl` folder, create a vtl file called `get_groups_user_belongs_to_request.vtl` for the request and another one called `get_groups_user_belongs_to_response.vtl` for the response.

For `get_groups_user_belongs_to_request.vtl`, type this code. It's very similar to the request template file for `getAllGroupsCreatedByUser`.

Getting the groups a user belongs to, involves using the third Global Secondary index(GSI3), which was
` "index":"groupsUserBelongTo"`.

```bash

#set($limit=$util.defaultIfNull($ctx.args.limit, 10))
#if($limit>100)
  #set($limit=100)
#end
 #set($gsi3pk = $util.dynamodb.toStringJson("USER#${ctx.args.userId}"))
 #set($gsi3sk = $util.dynamodb.toStringJson("GROUP#"))

{
    "version" : "2018-05-29",

    "operation" : "Query",
    "limit": $util.toJson($limit),
    "nextToken":$util.toJson($util.defaultIfNull($ctx.args.nextToken, null)),
    "query" : {
        "expression": "#GSI3PK = :GSI3PK and begins_with(#GSI3SK,:GSI3SK)",
        "expressionNames":{
        "#GSI3PK":"GSI3PK",
        "#GSI3SK":"GSI3SK"
        },

        "expressionValues" : {
            ":GSI3PK" : $gsi3pk,
            ":GSI3SK" :$gsi3sk
        },

    },
    "index":"groupsUserBelongTo",
    "scanIndexForward" : true


}
```

For the response file(`get_groups_user_belongs_to_response.vtl`), type this in

```bash
## Raise a GraphQL field error in case of a datasource invocation error
#if($ctx.error)
    $util.error($ctx.error.message, $ctx.error.type)
#end
## Pass back the result from DynamoDB. **
$util.toJson({
  "nextToken": $ctx.result.nextToken,
  "items": $ctx.result.items
})

```

But wait a min, how do we resolve the nested field we spoke about. How do we get a group object for each item in the `UserGroup` list.

Before we proceed, let's take a look at how the `$context` variable map looks like. This map holds all of the contextual information for your resolver invocation and has the following structure

```json
{
   "arguments" : { ... },
   "source" : { ... },
   "result" : { ... },
   "identity" : { ... },
   "request" : { ... },
   "info": { ... }
}

```

The `source` map contains the resolution of the parent field. We'll get the `groupId` from this map and pass it into the get group request template.

Let's go ahead and create 2 more vtl mapping template files.

- `get_group_request.vtl`
- `get_group_response.vtl`

For every `UserGroup` item, we'll get the `groupId` from the `source` variable map and pass it as input to the `get_group_request.vtl`.

The `get_group_request.vtl` would then get the group using a `GetItem` dynamodb operation and pass it back to the `get_groups_user_belongs_to_response.vtl`

Let's talk code now. The `get_group_request.vtl` looks like this

````bash

{
    "version": "2018-05-29",
    "operation": "GetItem",
    "key" : {
        "PK": $util.dynamodb.toStringJson("GROUP#${ctx.source.groupId}"),
        "SK": $util.dynamodb.toStringJson("GROUP#${ctx.source.groupId}")


    },
    "consistentRead": true
}

and the `get_group_response.vtl` vtl mapping response is

```bash

## Raise a GraphQL field error in case of a datasource invocation error
#if($ctx.error)
    $util.error($ctx.error.message, $ctx.error.type)
#end
## Pass back the result from DynamoDB. **
$util.toJson($ctx.result)
````

And that's all. Now we have to attach these templates to resolvers and resolvers to the datasource.

##### `getGroupsUserBelongsTo` resolver.

```bash
   const getGroupsUserBelongsToResolver: CfnResolver = new CfnResolver(
      this,
      "getAllGroupsUserBelongsTo",
      {
        apiId: groupChatGraphqlApi.attrApiId,
        typeName: "Query",
        fieldName: "getGroupsUserBelongsTo",
        dataSourceName: groupChatDatasource.name,
        requestMappingTemplate: readFileSync(
          "./lib/vtl/get_groups_user_belongs_to_request.vtl"
        ).toString(),

        responseMappingTemplate: readFileSync(
          "./lib/vtl/get_groups_user_belongs_to_response.vtl"
        ).toString(),
      }
    );

```

For this next resolver, take note of the `typeName` and `fieldName`.Since we are resolver a nested field, the typeName is the field type from the api schema, and the fieldName is the attribute.

```graphql
type UserGroup @aws_cognito_user_pools {
  userId: String!
  group: Group!
  createdOn: AWSTimestamp!
}
```

```bash

    const getGroupResolver: CfnResolver = new CfnResolver(
      this,
      "getGroupResolver",
      {
        apiId: groupChatGraphqlApi.attrApiId,
        typeName: "UserGroup",
        fieldName: "group",
        dataSourceName: groupChatDatasource.name,
        requestMappingTemplate: readFileSync(
          "./lib/vtl/get_group_request.vtl"
        ).toString(),

        responseMappingTemplate: readFileSync(
          "./lib/vtl/get_group_response.vtl"
        ).toString(),
      }
    );

```

The `getGroupResolver` depends on `getGroupsUserBelongsToResolver`, so we need to add this line

```typescript
getGroupResolver.addDependsOn(getGroupsUserBelongsToResolver);
```

The `getGroupsUserBelongsToResolver` depends on the api schema.

```typescript
getGroupsUserBelongsToResolver.addDependsOn(apiSchema);
```

## Message Stack

This stack contains all resources for the messages and it's very similar to the group stack. It has 2 mutations and a single query.

### Mutations

```graphql
 sendMessage(input: MessageInput!): Message! @aws_cognito_user_pools

  typingIndicator(
    userId: String!
    groupId: String!
    typing: Boolean!
  ): TypingIndicator! @aws_cognito_user_pools
```

Displaying a typing indicator when a user is typing a message is an essential feature for every chat system.

That's why we have a mutation called `typingIndicator` and we would use a subscription provide real time updates, when somebody in a group is typing.

### Query

```graphql
  getAllMessagesPerGroup(
    groupId: String!
    limit: Int
    nextToken: String
  ): MessageResult! @aws_cognito_user_pools
```

This query returns a MessageResult that has a list of `Messages` and a string as `nextToken`.

The `Message` object has a `User` object as one of its attributes.

```graphql
type Message @aws_cognito_user_pools {
  id: ID!
  userId: String!
  user: User
  groupId: String!
  messageText: String!
  createdOn: AWSTimestamp!
}
```

We have to use a nested resolver to resolve the `user` field. Luckily, we already saw this in the `getGroupsUserBelongsTo` function.

As a challenge, i urge you to attempt to write this stack, alongside the resolvers and datasources.

Here's the complete code for the [message stack](lib/message_stack.ts). You can find the lambda resolvers and vtl templates in their respective folders. The code is mainly a repetition for code we've already written, so it shouldn't be hard to comprehend.

But incase you've got any questions, please create an issue on the github repo and i'll get to it as soon as possible.

## Subscription

AWS AppSync allows you to utilize subscriptions to implement live application updates, push notifications, etc. When clients invoke the GraphQL subscription operations, a secure WebSocket connection is automatically established and maintained by AWS AppSync.

Subscriptions in AWS AppSync are invoked as a response to a mutation.

If you've noticed, these subscriptions are connected to Mutations. We use the `@aws_subscribe` directives to add real time capabilities to Mutations.

So a secure web socket connection would be created when a user sends a message and also when they are typing.

```graphql
type Subscription {
  typingIndicator: TypingIndicator
    @aws_subscribe(mutations: ["typingIndicator"])
  newMessage: Message @aws_subscribe(mutations: ["sendMessage"])
}
```

Let's update the imports in the `group_chat` app in the `bin` folder to reflect the newly added stacks.

```typescript
const app = new cdk.App();
const groupChatStack = new GroupChatStack(app, "GroupChatStack", {
  env: { account: "13xxxxxxxxxx", region: "us-east-2" },
});

new UserLamdaStacks(app, "UserLambdaStacks", {
  env: { account: "13xxxxxxxxxx", region: "us-east-2" },
  groupChatTable: groupChatStack.groupChatTable,
  apiSchema: groupChatStack.apiSchema,
  groupChatGraphqlApi: groupChatStack.groupChatGraphqlApi,
});

new GroupLamdaStacks(app, "GroupLambdaStacks", {
  env: { account: "13xxxxxxxxxx", region: "us-east-2" },
  groupChatTable: groupChatStack.groupChatTable,
  apiSchema: groupChatStack.apiSchema,
  groupChatGraphqlApi: groupChatStack.groupChatGraphqlApi,
  groupChatDatasource: groupChatStack.groupChatTableDatasource,
});

new MessageStack(app, "MessageLambdaStacks", {
  env: { account: "13xxxxxxxx", region: "us-east-2" },
  groupChatTable: groupChatStack.groupChatTable,
  apiSchema: groupChatStack.apiSchema,
  groupChatGraphqlApi: groupChatStack.groupChatGraphqlApi,
  groupChatDatasource: groupChatStack.groupChatTableDatasource,
});
```

## Deploy

When it's all said and done, we have to deploy and test the application.Since our app has multiple stacks and we intend on deploying all of them, we'll use the `--all` flag.

`cdk synth --all`

`cdk bootstrap`

`cdk deploy --all`

Once deployed successfully, you should be able to see the graphql endpoint in your terminal.

## Endpoint Testing

We are going to be using the AWS appsync console for testing our graphql api's. You can also use postman or any other api platform of your choice.

Sign into your aws account, search and open up appsync.
![alt text](https://github.com/trey-rosius/cdk_group_chat/raw/master/images/search_appsync.png)

Once in the appsync console, click and open up your project.

![alt text](https://github.com/trey-rosius/cdk_group_chat/raw/master/images/appsync_project.png)

From the left side menu, click on `Queries`.
We are going to be testing out all the `Query`, `Mutation` and `Subscription` we created for our app.
![alt text](https://github.com/trey-rosius/cdk_group_chat/raw/master/images/search_queries.png)
