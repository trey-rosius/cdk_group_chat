# Modern Serverless Application Development with AWS Amplify,Flutter, GraphQL,CDK and Typescript

Focusing on the business logic and how your application brings value to end users, with little to no attention as to how the servers are running your application is the new and recommended way by which developers are building serverless applications.
By not focusing on operations or infrastructure provisioning, the time it takes for an application to move from prototype to production is cut in half. Iteration is rapid, user feedback is quick, leading to significant app improvements.
In this workshop, we would be building a fullstack serverless mobile group chat application using

- (AWS AppSync)[https://aws.amazon.com/appsync/]
- GraphQl
- Cloud Development Kit(CDK)
- Typescript
- Amplify Flutter.

## AWS AppSync

Aws AppSync allows developers to easily implement engaging real-time application experiences by automatically publishing data updates to subscribed API clients via serverless WebSockets connections

Cloud providers

- defined all frameworks and services used to create this app
- why building modern cloud apps are essential
- Design Decisions. For Example, why multiple stacks
- why CDK as IaC

## Access Patterns

### USER

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
