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
