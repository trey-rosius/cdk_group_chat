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

Here's the [complete code](https://github.com/trey-rosius/cdk_group_chat/blob/master/lib/user_lambda_stack.ts) for this file.

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

Also, we are using a transactWrite because of its atomic feature. Either all the requests succeed, or all fail.

In case of a failure, we catch the exception and return a user-friendly message back through the graphql api.
