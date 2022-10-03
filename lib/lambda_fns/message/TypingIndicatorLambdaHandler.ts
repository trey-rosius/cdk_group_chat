import { Logger } from "@aws-lambda-powertools/logger";

import { AppSyncResolverHandler } from "aws-lambda";
import { DynamoDB } from "aws-sdk";

import { MutationTypingIndicatorArgs } from "../../../appsync";
import { uuid } from "../../utils";

const logger = new Logger({ serviceName: "TypingIndicatorLambda" });

export const handler: AppSyncResolverHandler<
  MutationTypingIndicatorArgs,
  Boolean
> = async (event) => {
  const documentClient = new DynamoDB.DocumentClient();
  let tableName = process.env.GroupChat_DB;
  const createdOn = Date.now();
  const id: string = uuid();
  if (tableName === undefined) {
    logger.error(`Couldn't get the table name`);
    tableName = "groupChatDynamoDBTable";
  }

  logger.info(`typing input info", ${JSON.stringify(event.arguments)}`);
  const { userId, groupId, typing } = event.arguments;
  const params = {
    TableName: tableName,
    Item: {
      id: id,
      ENTITY: "TYPING",
      PK: `USER#${userId}`,
      SK: `GROUP#${groupId}#TYPING`,
      userId: userId,
      groupId: groupId,
      typing: typing,
      createdOn: createdOn,
    },
  };

  try {
    await documentClient.put(params).promise();
    return typing;
  } catch (error: any) {
    logger.error(`an error occured while adding typing indicator ${error}`);
    throw new Error(`${error}`);
  }
};
