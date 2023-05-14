### Application Stacks

We are going to have a total of 4 stacks. Let me apologize in advance for the stack names. Please feel free to give yours better stack names.

- The main application Stack(group_chat_stack). Defines the Appsync API, Database, Datasource etc for the complete app
- User Lambda Stack (For User Resources)
- Group Lambda Stack (For Group Resources)
- Message Lambda Stack (For Message Resources)

To provision infrastructure resources, all constructs that represent AWS resources must be defined, directly or indirectly, within the scope of a Stack construct.

An App is a container for one or more stacks: it serves as each stack’s scope. Stacks within a single App can easily refer to each others’ resources (and attributes of those resources).

The AWS CDK infers dependencies between stacks so that they can be deployed in the correct order. You can deploy any or all of the stacks defined within an app at with a single `cdk deploy` or `cdk deploy --all` command.

Our app is defined in the `bin` folder, while stacks are in the `lib` folder.

Add your `account` and `region` to the `env` object in the cdk app file located in the `bin` folder.

```typescript
const app = new cdk.App();
const groupChatStack = new GroupChatStack(app, "GroupChatStack", {
  env: { account: "13xxxxxxxxxx", region: "us-east-2" },
});
```
