### Add UserLambdaStack to CDK APP

Please make sure you have the complete code.

Open up the `group_chat.ts` file in the `bin` folder and add the `user_lambda_stack.ts` stack.

```typescript
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { GroupChatStack } from "../lib/group_chat_stack";
import { UserLamdaStacks } from "../lib/user_lambda_stack";
import { GroupLamdaStacks } from "../lib/group_lambda_stack";
import { MessageLamdaStacks } from "../lib/message_lambda_stack";

const app = new cdk.App();
const groupChatStack = new GroupChatStack(app, "GroupChatStack", {
  env: { account: "13xxxxxxxxxx", region: "us-east-2" },
});

new UserLamdaStacks(app, "UserLambdaStacks", {
  env: { account: "13xxxxxxxxxx", region: "us-east-2" },
  groupChatTable: groupChatStack.groupChatTable,
  apiSchema: groupChatStack.apiSchema,
  groupChatGraphqlApi: groupChatStack.groupChatGraphqlApi,
});
```

Now that we have the user stack setup, let's move on to the group stack.
