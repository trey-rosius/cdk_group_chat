### getGroupsUserBelongsTo

The next query is `getGroupsUserBelongsTo`.

The graphql schema for this endpoint is

```graphql
  getGroupsUserBelongsTo(
    userId: String!
    limit: Int
    nextToken: String
  ): UserGroupResult! @aws_cognito_user_pools

```

It's similar the `getAllGroupsCreatedByUser` with one main difference. `UserGroupResult` returns a list of `UserGroup` objects and a `nextToken` string.

```graphql
type UserGroupResult @aws_cognito_user_pools {
  items: [UserGroup!]! @aws_cognito_user_pools
  nextToken: String
}
```

A `UserGroup` object has the following structure

```graphql
type UserGroup @aws_cognito_user_pools {
  userId: String!
  group: Group!
  createdOn: AWSTimestamp!
}
```

As you can see, there is a nested group object within the `UserGroup` object, and this field would need to be resolved.

So you are about to learn something new now.

## How to resolve nested fields in Graphql with CDK, Appsync and VTL.

Within the `vtl` folder, create a vtl file called `get_groups_user_belongs_to_request.vtl` for the request and another one called `get_groups_user_belongs_to_response.vtl` for the response.

For `get_groups_user_belongs_to_request.vtl`, type this code. It's very similar to the request template file for `getAllGroupsCreatedByUser`.

Getting the groups a user belongs to, involves using the third Global Secondary index(GSI3), which was
` "index":"groupsUserBelongTo"`.

```bash

#set($limit=$util.defaultIfNull($ctx.args.limit, 10))
#if($limit>100)
  #set($limit=100)
#end
 #set($gsi3pk = $util.dynamodb.toStringJson("USER#${ctx.args.userId}"))
 #set($gsi3sk = $util.dynamodb.toStringJson("GROUP#"))

{
    "version" : "2018-05-29",

    "operation" : "Query",
    "limit": $util.toJson($limit),
    "nextToken":$util.toJson($util.defaultIfNull($ctx.args.nextToken, null)),
    "query" : {
        "expression": "#GSI3PK = :GSI3PK and begins_with(#GSI3SK,:GSI3SK)",
        "expressionNames":{
        "#GSI3PK":"GSI3PK",
        "#GSI3SK":"GSI3SK"
        },

        "expressionValues" : {
            ":GSI3PK" : $gsi3pk,
            ":GSI3SK" :$gsi3sk
        },

    },
    "index":"groupsUserBelongTo",
    "scanIndexForward" : true


}
```

For the response file(`get_groups_user_belongs_to_response.vtl`), type this in

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

But wait a min, how do we resolve the nested field we spoke about. How do we get a group object for each item in the `UserGroup` list.

Before we proceed, let's take a look at how the `$context` variable map looks like. This map holds all of the contextual information for your resolver invocation and has the following structure

```json
{
   "arguments" : { ... },
   "source" : { ... },
   "result" : { ... },
   "identity" : { ... },
   "request" : { ... },
   "info": { ... }
}

```

The `source` map contains the resolution of the parent field. We'll get the `groupId` from this map and pass it into the get group request template.

Let's go ahead and create 2 more vtl mapping template files.

- `get_group_request.vtl`
- `get_group_response.vtl`

For every `UserGroup` item, we'll get the `groupId` from the `source` variable map and pass it as input to the `get_group_request.vtl`.

The `get_group_request.vtl` would then get the group using a `GetItem` dynamodb operation and pass it back to the `get_groups_user_belongs_to_response.vtl`

Let's talk code now. The `get_group_request.vtl` looks like this

````bash

{
    "version": "2018-05-29",
    "operation": "GetItem",
    "key" : {
        "PK": $util.dynamodb.toStringJson("GROUP#${ctx.source.groupId}"),
        "SK": $util.dynamodb.toStringJson("GROUP#${ctx.source.groupId}")


    },
    "consistentRead": true
}

and the `get_group_response.vtl` vtl mapping response is

```bash

## Raise a GraphQL field error in case of a datasource invocation error
#if($ctx.error)
    $util.error($ctx.error.message, $ctx.error.type)
#end
## Pass back the result from DynamoDB. **
$util.toJson($ctx.result)
````

And that's all. Now we have to attach these templates to resolvers and resolvers to the datasource.

##### `getGroupsUserBelongsTo` resolver.

```bash
   const getGroupsUserBelongsToResolver: CfnResolver = new CfnResolver(
      this,
      "getAllGroupsUserBelongsTo",
      {
        apiId: groupChatGraphqlApi.attrApiId,
        typeName: "Query",
        fieldName: "getGroupsUserBelongsTo",
        dataSourceName: groupChatDatasource.name,
        requestMappingTemplate: readFileSync(
          "./lib/vtl/get_groups_user_belongs_to_request.vtl"
        ).toString(),

        responseMappingTemplate: readFileSync(
          "./lib/vtl/get_groups_user_belongs_to_response.vtl"
        ).toString(),
      }
    );

```

For this next resolver, take note of the `typeName` and `fieldName`.Since we are resolver a nested field, the typeName is the field type from the api schema, and the fieldName is the attribute.

```graphql
type UserGroup @aws_cognito_user_pools {
  userId: String!
  group: Group!
  createdOn: AWSTimestamp!
}
```

```bash

    const getGroupResolver: CfnResolver = new CfnResolver(
      this,
      "getGroupResolver",
      {
        apiId: groupChatGraphqlApi.attrApiId,
        typeName: "UserGroup",
        fieldName: "group",
        dataSourceName: groupChatDatasource.name,
        requestMappingTemplate: readFileSync(
          "./lib/vtl/get_group_request.vtl"
        ).toString(),

        responseMappingTemplate: readFileSync(
          "./lib/vtl/get_group_response.vtl"
        ).toString(),
      }
    );

```

The `getGroupResolver` depends on `getGroupsUserBelongsToResolver`, so we need to add this line

```typescript
getGroupResolver.addDependsOn(getGroupsUserBelongsToResolver);
```

The `getGroupsUserBelongsToResolver` depends on the api schema.

```typescript
getGroupsUserBelongsToResolver.addDependsOn(apiSchema);
```
