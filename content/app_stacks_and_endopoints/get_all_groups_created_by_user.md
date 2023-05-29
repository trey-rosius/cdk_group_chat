### getAllGroupsCreatedByUser

This is a Query request, which would either return an empty list or a list of groups the requesting user created.
This request supports pagination, so we will be using `limit`, to limit the amount of data we demand per request, and also `nextToken` to provide a string to the next position our request should start demanding from.

Hope that makes sense.

We would be using AWS VTL(Velocity Template Language) templates. AWS AppSync uses VTL to translate GraphQL requests from clients into a request to your data source.

Then it reverses the process to translate the data source response back into a GraphQL response.

Here's the endpoint schema

```graphql
  getAllGroupsCreatedByUser(
    userId: String!
    limit: Int
    nextToken: String
  ): GroupResult! @aws_cognito_user_pools

```

It's an authenticated `@aws_cognito_user_pools` request. It takes the `userId`, `limit`and `nextToken` to and returns a group result.The group result is made up of a list of Group objects and the `nextToken`.

```graphql
type GroupResult @aws_cognito_user_pools {
  items: [Group!]! @aws_cognito_user_pools
  nextToken: String
}
```

Create a folder in your main project called `vtl`. This folder would contain all the vtl templates for our project.

Within the `vtl` folder, create a file called `get_groups_created_by_user_request.vtl` and type in the following code.

```bash

#set($limit=$util.defaultIfNull($ctx.args.limit, 10))
#if($limit>10)
  #set($limit=10)
#end
 #set($gsi1pk = $util.dynamodb.toStringJson("USER#${ctx.args.userId}"))
 #set($gsi1sk = $util.dynamodb.toStringJson("GROUP#"))
{
    "version" : "2018-05-29",

    "operation" : "Query",
    "limit": $util.toJson($limit),
    "nextToken":$util.toJson($util.defaultIfNull($ctx.args.nextToken, null)),
    "query" : {
        "expression": "#GSI1PK = :GSI1PK and begins_with(#GSI1SK,:GSI1SK)",
        "expressionNames":{
        "#GSI1PK":"GSI1PK",
        "#GSI1SK":"GSI1SK"
        },

        "expressionValues" : {
            ":GSI1PK" : $gsi1pk,
            ":GSI1SK" :$gsi1sk
        },

    },
    "index":"groupsCreatedByUser",
    "scanIndexForward" : true


}

```

The first line gets the limit from the request and sets it to a variable called `$limit`. If no limit was sent, a default of 10 is applied.
If a limit of more than 10(> 10) was sent, we default to 10(`#set($limit=10)`), before proceeding.

This limit represents the amount of data objects we want back with every request.

We also get the `nextToken` from the request and if none was sent, this implies it's the first request. So we default the `nextToken` variable to `null` since it's a string.

For the `nextToken` variable, `$util.toJson($util.defaultIfNull($ctx.args.nextToken, null))`.

Getting the groups created by a user involves using our first Global Secondary index(GSI1), which was
` indexName: "groupsCreatedByUser"`.

We would use `begins_with (a, substr)` function in our query operation to carry out this request. We want all groups for a particular user that begins with `GROUP#`.

`"expression": "#GSI1PK = :GSI1PK and begins_with(#GSI1SK,:GSI1SK)",`

Now for the response, create a file called `get_groups_created_by_user_response.vtl` in the `vtl` folder and type in the following code.

```bash

## Raise a GraphQL field error in case of a datasource invocation error
#if($ctx.error)
    $util.error($ctx.error.message, $ctx.error.type)
#end
## Pass back the result from DynamoDB. **
$util.toJson({
  "nextToken": $ctx.result.nextToken,
  "items": $ctx.result.items
})

```

Notice that we pass back a list of items and a string for the `nextToken`.

Let's go back the `group_lambda_stack.ts` stack file and connect these vtl mapping templates to a resolver.

Our datasource for this resolver, is created from the dynamoDB table in the main stack file(`group_chat_stack.ts`).

```typescript
this.groupChatTableDatasource = new CfnDataSource(
  this,
  "groupChatDynamoDBTableDataSource",
  {
    apiId: this.groupChatGraphqlApi.attrApiId,
    name: "AcmsDynamoDBTableDataSource",
    type: "AMAZON_DYNAMODB",
    dynamoDbConfig: {
      tableName: this.groupChatTable.tableName,
      awsRegion: this.region,
    },
    serviceRoleArn: dynamoDBRole.roleArn,
  }
);
```

Attach mapping templates and dataSource to resolver.

```typescript
const getGroupsCreatedByUserResolver: CfnResolver = new CfnResolver(
  this,
  "getGroupsCreatedByUserResolver",
  {
    apiId: groupChatGraphqlApi.attrApiId,
    typeName: "Query",
    fieldName: "getAllGroupsCreatedByUser",
    dataSourceName: groupChatDatasource.name,
    requestMappingTemplate: readFileSync(
      "./lib/vtl/get_groups_created_by_user_request.vtl"
    ).toString(),

    responseMappingTemplate: readFileSync(
      "./lib/vtl/get_groups_created_by_user_response.vtl"
    ).toString(),
  }
);
```

Attach resolver to graphql schema

`getGroupsCreatedByUserResolver.addDependsOn(apiSchema);`
