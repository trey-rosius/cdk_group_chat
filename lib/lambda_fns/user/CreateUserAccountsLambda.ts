import { Logger } from "@aws-lambda-powertools/logger";

import { AppSyncResolverHandler } from "aws-lambda";
import { DynamoDB } from "aws-sdk";

import { User, MutationCreateUserAccountArgs } from "../../../appsync";
import { uuid, executeTransactWrite } from "../../utils";

const logger = new Logger({ serviceName: "CreateUserAccountsHandler" });

export const handler: AppSyncResolverHandler<
  MutationCreateUserAccountArgs,
  User
> = async (event) => {
  logger.debug(`appsync event arguments ${JSON.stringify(event)}`);

  const documentClient = new DynamoDB.DocumentClient();
  let tableName = process.env.GroupChat_DB;

  const createdOn: number = Date.now();
  const id: string = uuid();
  if (tableName === undefined) {
    logger.error(`Couldn't get the table name`);
    tableName = "groupChatDynamoDBTable";
  }

  logger.info(`message input info", ${JSON.stringify(event.arguments)}`);
  const { username, email, profilePicKey } = event.arguments.input;
  const params = {
    TransactItems: [
      {
        Put: {
          Item: {
            id: id,

            ENTITY: "USER",

            PK: `USER#${username}`,

            SK: `USER#${username}`,

            username: username,

            email: email,

            profilePicKey: profilePicKey,

            createdOn: createdOn,
          },
          TableName: tableName,
          ConditionExpression: "attribute_not_exists(PK)",
        },
      },
      {
        Put: {
          Item: {
            id: id,

            ENTITY: "USER",

            PK: `USEREMAIL#${email}`,

            SK: `USEREMAIL#${email}`,

            email: email,

            createdOn: createdOn,
          },
          TableName: tableName,
          ConditionExpression: "attribute_not_exists(PK)",
        },
      },
    ],
  };

  try {
    await executeTransactWrite(params, documentClient);
    return {
      id,
      username,
      email,
      profilePicKey,
    };
  } catch (error: any) {
    logger.error(
      `an error occured while sending message ${JSON.stringify(error)}`,
    );
    logger.error("Error creating user account");

    const jsonError = JSON.parse(JSON.stringify(error));

    let errorMessage = "Could not create user account";

    if (jsonError.err.code === "TransactionCanceledException") {
      if (jsonError.cancellationReasons[0].Code === "ConditionalCheckFailed") {
        errorMessage = "User with this username already exists.";
      } else if (
        jsonError.cancellationReasons[1].Code === "ConditionalCheckFailed"
      ) {
        errorMessage = "User with this email already exists.";
      }
    }
    throw new Error(`${errorMessage}`);
  }
};
