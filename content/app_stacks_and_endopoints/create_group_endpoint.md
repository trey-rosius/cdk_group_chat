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
