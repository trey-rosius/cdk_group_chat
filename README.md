# A GraphQl Group Chat Api built with CDK, TypeScript,Appsync and Single Table Design

I'll approach this project in a branch based manner.

## Branches

- schema
-

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
