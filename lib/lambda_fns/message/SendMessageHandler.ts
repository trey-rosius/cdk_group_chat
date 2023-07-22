import { Logger } from "@aws-lambda-powertools/logger";

import { AppSyncResolverHandler } from "aws-lambda";
import { DynamoDB } from "aws-sdk";

import { Message, MutationSendMessageArgs } from "../../../appsync";
import { uuid } from "../../utils";

const logger = new Logger({ serviceName: "SendMessageLambda" });

export const handler: AppSyncResolverHandler<
  MutationSendMessageArgs,
  Message
> = async (event) => {
  const documentClient = new DynamoDB.DocumentClient();
  let tableName = process.env.GroupChat_DB;
  const createdOn = Date.now();
  const id: string = uuid();
  if (tableName === undefined) {
    logger.error(`Couldn't get the table name`);
    tableName = "groupChatDynamoDBTable";
  }

  logger.info(`message input info", ${JSON.stringify(event.arguments)}`);
  const { userId, messageText, groupId } = event.arguments.input;
  const params = {
    TableName: tableName,
    Item: {
      id: id,
      ENTITY: "MESSAGE",
      PK: `MESSAGE#${id}`,
      SK: `MESSAGE#${id}`,
      GSI2PK: `GROUP#${groupId}`,
      GSI2SK: `MESSAGE#${id}`,
      userId: userId,
      groupId: groupId,
      messageText: messageText,
      createdOn: createdOn,
    },
  };

  try {
    await documentClient.put(params).promise();
    return {
      id,
      userId,
      groupId,
      messageText,
      createdOn,
    };
  } catch (error: any) {
    logger.error(`an error occured while sending message ${error}`);
    throw new Error(`${error}`);
  }
};
