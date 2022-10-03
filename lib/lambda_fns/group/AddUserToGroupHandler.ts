import { Logger } from "@aws-lambda-powertools/logger";
import { AppSyncResolverHandler } from "aws-lambda";
import { DynamoDB } from "aws-sdk";
import { MutationAddUserToGroupArgs } from "../../../appsync";
import { uuid } from "../../utils";
const logger = new Logger({ serviceName: "AddUserToGroupLambda" });
export const handler: AppSyncResolverHandler<
  MutationAddUserToGroupArgs,
  Boolean
> = async (event) => {
  const documentClient = new DynamoDB.DocumentClient();
  let tableName = process.env.GroupChat_DB;
  const createdOn = Date.now().toString();
  const id: string = uuid();
  if (tableName === undefined) {
    logger.error(`Couldn't get the table name`);
    tableName = "groupChatDynamoDBTable";
  }

  logger.info(`group input info", ${JSON.stringify(event.arguments)}`);
  const { userId, groupId } = event.arguments;
  const params = {
    TableName: tableName,
    Item: {
      id: id,
      PK: `GROUP#${groupId}`,
      SK: `USER#${userId}`,
      userId: userId,
      groupId: groupId,
      createdOn: createdOn,
    },
  };

  try {
    await documentClient.put(params).promise();
    return true;
  } catch (error: any) {
    logger.error(`an error occured while creating user ${error}`);
    return false;
  }
};
