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

Don't forget to run `npm i` to install all the dependencies.

### Create and configure graphql-codegen

Create a file in the root directory of your project called `codegen.yml` and type in the following code.

```yaml
overwrite: true
schema:
  - schema.graphql #your schema file

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

> Don't place these types in the same file as your main schema. You only need them for code generation and they should not get into your deployment package to AWS AppSync

Learn more about the library here [https://github.com/segmentio/ksuid](https://github.com/segmentio/ksuid)

### Create User Account

The User entity is unique on 2 attributes( username + email address).

In-order to maintain this uniqueness, we'll assign 2 composite keys to the User Entity.
`PK`: `USER#username`
`SK`: `USER#username`

`PK`:`USEREMAIL#email`
`SK`:`USEREMAIL#email`
