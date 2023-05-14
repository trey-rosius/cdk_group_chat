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
