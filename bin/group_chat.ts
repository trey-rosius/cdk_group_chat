#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { GroupChatStack } from "../lib/grouChatStack";
import { UserLambdaStacks } from "../lib/userLambdaStack";
import { GroupLambdaStacks } from "../lib/groupLambdaStack";
import { MessageStack } from "../lib/messageStack";

const app = new cdk.App();
const groupChatStack = new GroupChatStack(app, "GroupChatStack", {
  env: { account: "132260253285", region: "us-east-2" },
});

new UserLambdaStacks(app, "UserLambdaStacks", {
  env: { account: "132260253285", region: "us-east-2" },
  groupChatTable: groupChatStack.groupChatTable,
  apiSchema: groupChatStack.apiSchema,
  groupChatDatasource: groupChatStack.groupChatTableDatasource,
  groupChatGraphqlApi: groupChatStack.groupChatGraphqlApi,
});

new GroupLambdaStacks(app, "GroupLambdaStacks", {
  env: { account: "132260253285", region: "us-east-2" },
  groupChatTable: groupChatStack.groupChatTable,
  apiSchema: groupChatStack.apiSchema,
  groupChatGraphqlApi: groupChatStack.groupChatGraphqlApi,
  groupChatDatasource: groupChatStack.groupChatTableDatasource,
});

new MessageStack(app, "MessageLambdaStacks", {
  env: { account: "132260253285", region: "us-east-2" },
  groupChatTable: groupChatStack.groupChatTable,
  apiSchema: groupChatStack.apiSchema,
  groupChatGraphqlApi: groupChatStack.groupChatGraphqlApi,
  groupChatDatasource: groupChatStack.groupChatTableDatasource,
});
