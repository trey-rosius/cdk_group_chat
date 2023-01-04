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

Our dynamoDB has a composite key and 3 Global Secondary Indexes(GSI)
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

## User Lambda Stack

In this stack, we’ll define all infrastructure related to the user entity.

For this tutorial, we have 2 user related endpoints defined in the `schema.graphql` file located in the `schema` folder.

But we will implement the `createUserAccount` endpoint only.

```graphql
createUserAccount(input: UserInput!): User! @aws_cognito_user_pools
updateUserAccount(input: UpdateUserInput!): User! @aws_cognito_user_pools
```

Create a file called `user-lambda-stack.ts` in the `lib` folder. When we created the main stack(`group_chat_stack`) above, we made a couple of resources public.Meaning they could be shared and used within the other stacks.

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

Let's look at the complete code.

```typescript
import { Logger } from "@aws-lambda-powertools/logger";

import { AppSyncResolverHandler } from "aws-lambda";
import { DynamoDB } from "aws-sdk";

//imported generated types
import { User, MutationCreateUserAccountArgs } from "../../../appsync";
// utility functions to generate ksuid's and execute dynamodb transactions
import { uuid, executeTransactWrite } from "../../utils";

const logger = new Logger({ serviceName: "CreateUserAccountsHandler" });

export const handler: AppSyncResolverHandler<
  MutationCreateUserAccountArgs,
  User
> = async (event) => {
  logger.debug(`appsync event arguments ${JSON.stringify(event)}`);

  const documentClient = new DynamoDB.DocumentClient();
  let tableName = process.env.GroupChat_DB;

  const createdOn: number = Date.now();
  const id: string = uuid();
  if (tableName === undefined) {
    logger.error(`Couldn't get the table name`);
    tableName = "groupChatDynamoDBTable";
  }

  logger.info(`message input info", ${JSON.stringify(event.arguments)}`);
  const { username, email, profilePicUrl } = event.arguments.input;
};
```
