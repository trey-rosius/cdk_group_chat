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

Here's the database design. Feel free to downlaod it and use in the NoSQL Workbench.
[NoSQL Workbench JSON Model](https://github.com/trey-rosius/cdk_group_chat/raw/master/json/group_chat.json)

![alt text](https://github.com/trey-rosius/cdk_group_chat/raw/master/images/no_sql_workbench.png)

- Create User Account

```
PK: USER#USERID
SK: USER#USERID
```

- Update User Account

```
PK: USER#USERID
SK: USER#USERID
```

### GROUP

- Create Group(anyone can create a group)

```
PK: GROUP#GROUPID
SK: GROUP#GROUPID
GSI1PK: USER#USERID
GSI1SK: GROUP#GROUPID

```

- Add Users to Group

```
PK:GROUP#GROUPID
SK:USER#USERID

```

- Get all groups created by user
  We'll use a GSI here
  GSI => getAllGroupsCreatedByUser
  use `begins_with`

```
GSI1PK:USER#USERID
GSI1SK:GROUP#
```

### MESSAGE

- Send message

```
PK:MESSAGE#MESSAGEID
SK:MESSAGE#MESSAGEID
GSI2PK:GROUP#GROUPID
GSI2SK: MESSAGE#MESSAGEID
```

- Get messages per group
  We'll use a GSI to get these
  GSI => getMessagesPerGroup
  Use `begins_with`

```
GSI2PK: GROUP#GROUPID
GSI2SK: MESSAGE#

```

### Typing indicator

PK:USER#USERID
SK:GROUP#GROUPID#TYPING

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful commands

- `npm run build` compile typescript to js
- `npm run watch` watch for changes and compile
- `npm run test` perform the jest unit tests
- `cdk deploy` deploy this stack to your default AWS account/region
- `cdk diff` compare deployed stack with current state
- `cdk synth` emits the synthesized CloudFormation template
