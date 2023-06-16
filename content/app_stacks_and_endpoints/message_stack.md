## Message Stack

This stack contains all resources for the messages, and it's very similar to the group stack.

It has 2 mutations and one query.

### Mutations

```graphql
 sendMessage(input: MessageInput!): Message! @aws_cognito_user_pools

  typingIndicator(
    userId: String!
    groupId: String!
    typing: Boolean!
  ): TypingIndicator! @aws_cognito_user_pools
```

As the name suggests, the `sendMessage` mutation is used for sending messages in the group.

Displaying a typing indicator when a user is typing a message is an essential feature for every chat system.

That's why we have a mutation called `typingIndicator` and we would use a subscription to provide real time updates, when somebody in a group is typing.

### Query

```graphql
  getAllMessagesPerGroup(
    groupId: String!
    limit: Int
    nextToken: String
  ): MessageResult! @aws_cognito_user_pools
```

This query returns a MessageResult that has a list of `Messages` and a string as `nextToken`.

The `nextToken` is used for pagination purposes.

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

We have to use a nested resolver to resolve the `user` field. Luckily, we already saw how to do that in the `getGroupsUserBelongsTo` function.

As a little challenge, I urge you to attempt to write this stack, alongside the resolvers and Data Sources.

Here's the complete code for the [message stack](https://github.com/trey-rosius/cdk_group_chat/blob/master/lib/message_stack.ts). You can find the lambda resolvers and vtl templates in their respective folders.

The code is mainly a repetition of what we've already written, so it shouldn't be hard to comprehend.

But incase you've got any questions, please leave a message in the QA section at the bottom.
