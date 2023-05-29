### Create and configure graphql-codegen
GraphQL Code Generator is a tool that generates code out of your GraphQL schema. 

Graphql's main value proposition is in Types. It ensures you give types(str) to your fields and also shapes endpoints input/outputs.

For example, this graphql endpoint has 2 input fields with a `String` type and one `Boolean` type output.

`addUserToGroup(userId: String!, groupId: String!): Boolean!`

Since we are using typescript for this project, it's a fact that we'll use TS types that correspond to the GraphQl Schema.

This is where `graphql-codegen` comes to play. 

It helps us to automatically generate these TS types that correspond to the graphql schema, thereby reducing the margin for bugs 
and increasing developer productivity.

Create a file in the root directory of your project called `codegen.yml` and type in the following code.

```yaml
overwrite: true
schema:
  - schema/schema.graphql #your schema file

generates:
  appsync.d.ts:
    plugins:
      - typescript
```

This tells `graphql-codegen` which schema file(s) it should use (in the example: schema.graphql), what plugin (typescript) and where the output should be placed (appsync.d.ts).

### Support for AWS Scalars

Since we are using AWS Appsync to build out the GraphQL API, we'll be making use of [AWS Appsync Scalars](https://docs.aws.amazon.com/appsync/latest/devguide/scalars.html) which aren't available in the default GraphQL Language.

Therefore we need to tell `graphql-codegen` how to handle them.

Create another file in your project's root directory called `appsync.graphql` and add these scalars to it.

```graphql
scalar AWSDate
scalar AWSTime
scalar AWSDateTime
scalar AWSTimestamp
scalar AWSEmail
scalar AWSJSON
scalar AWSURL
scalar AWSPhone
scalar AWSIPAddress
```

## N.B

> ⚠️ Don't place these types in the same file as your main schema. You only need them for code generation, and they should not get into your deployment package to AWS AppSync

We also need to tell `graphql-codegen` how to map these scalars to TypeScript. For that, we will modify the `codegen.yml` file and the following sections.

```yaml
schema:
  - schema/schema.graphql
  - appsync.graphql # 👈 add this

# and this 👇
config:
  scalars:
    AWSJSON: string
    AWSDate: string
    AWSTime: string
    AWSDateTime: string
    AWSTimestamp: number
    AWSEmail: string
    AWSURL: string
    AWSPhone: string
    AWSIPAddress: string
```
