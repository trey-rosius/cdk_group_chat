#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { GroupChatStack } from "../lib/group_chat-stack";

const app = new cdk.App();
const groupChatStack = new GroupChatStack(app, "GroupChatStack", {
  env: { account: "132260253285", region: "us-east-2" },
});
