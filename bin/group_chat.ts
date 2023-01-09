#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { GroupChatStack } from "../lib/group_chat_stack";
import { UserLamdaStacks } from "../lib/user_lambda_stack";
import { GroupLamdaStacks } from "../lib/group_lambda_stack";
import { MessageStack } from "../lib/message_stack";

const app = new cdk.App();
const groupChatStack = new GroupChatStack(app, "GroupChatStack", {
  env: { account: "132260253285", region: "us-east-2" },
});

new UserLamdaStacks(app, "UserLambdaStacks", {
  env: { account: "132260253285", region: "us-east-2" },
  groupChatTable: groupChatStack.groupChatTable,
  apiSchema: groupChatStack.apiSchema,
  groupChatGraphqlApi: groupChatStack.groupChatGraphqlApi,
});

new GroupLamdaStacks(app, "GroupLambdaStacks", {
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
