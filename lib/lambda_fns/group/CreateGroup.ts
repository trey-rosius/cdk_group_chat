import { Logger } from "@aws-lambda-powertools/logger";
import GroupEntity from "./GroupEntity";
import { DynamoDB } from "aws-sdk";
import { uuid } from "../../utils";
import CreateGroupInput from "./CreateGroupInput";

type GroupReturnParameters = {
  id: string;
  ENTITY: string;
  userId: string;
  name: string;
  description: string;

  createdOn: string;
};

async function createGroup(
  appsyncInput: CreateGroupInput,
  logger: Logger
): Promise<GroupReturnParameters> {
  const documentClient = new DynamoDB.DocumentClient();
  let tableName = process.env.GroupChat_DB;
  const createdOn = Date.now().toString();
  const id: string = uuid();
  if (tableName === undefined) {
    logger.error(`Couldn't get the table name`);
    tableName = "groupChatDynamoDBTable";
  }

  const groupInput: GroupEntity = new GroupEntity({
    id: id,
    ...appsyncInput.input,
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
}
export default createGroup;
