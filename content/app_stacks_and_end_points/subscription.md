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
