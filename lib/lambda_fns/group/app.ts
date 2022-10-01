import { Logger } from "@aws-lambda-powertools/logger";

import { AppSyncResolverEvent, Context } from "aws-lambda";
import CreateGroupInput from "./CreateGroupInput";
import createGroup from "./CreateGroup";

const logger = new Logger({ serviceName: "GroupChat" });

exports.handler = async (
  event: AppSyncResolverEvent<CreateGroupInput>,
  context: Context
) => {
  logger.addContext(context);
  logger.info(
    `appsync event arguments ${JSON.stringify(event.arguments.input)}`
  );

  switch (event.info.fieldName) {
    case "createGroup":
      return await createGroup(event.arguments, logger);

    default:
      return null;
  }
};
