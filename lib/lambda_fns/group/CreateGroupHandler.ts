import { Logger } from "@aws-lambda-powertools/logger";

import { AppSyncResolverHandler } from "aws-lambda";
import { DynamoDB } from "aws-sdk";

import { Group, MutationCreateGroupArgs } from "../../../appsync";
import { uuid } from "../../utils";
import GroupEntity from "./groupEntity";

const logger = new Logger({ serviceName: "CreateGroupLambda" });

export const handler: AppSyncResolverHandler<
  MutationCreateGroupArgs,
  Group
> = async (event) => {
  const documentClient = new DynamoDB.DocumentClient();
  let tableName = process.env.GroupChat_DB;
  const createdOn = Date.now();
  const id: string = uuid();
  if (tableName === undefined) {
    logger.error(`Couldn't get the table name`);
    tableName = "groupChatDynamoDBTable";
  }

  const groupInput: GroupEntity = new GroupEntity({
    id: id,
    ...event.arguments.input,
    createdOn,
  });

  logger.info(`group input info", ${JSON.stringify(groupInput)}`);
  const params = {
    TableName: tableName,
    Item: groupInput.toItem(),
  };

  try {
    await documentClient.put(params).promise();
    return groupInput.graphQlReturn();
  } catch (error: any) {
    logger.error(`an error occured while creating user ${error}`);
    throw error;
  }
};
