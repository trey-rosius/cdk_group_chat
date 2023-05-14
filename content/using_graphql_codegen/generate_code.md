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
