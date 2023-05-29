## Create CDK Project

From the command line interface(Terminal), create and change directory into the newly created folder using

`mkdir cdkGroupChatApp && cd $_`

Within the newly created folder, initialize a typescript cdk project using the command

`cdk init --language=typescript`

Once created, open up the app in your IDE and let's proceed.

### Dependencies

With your project opened up in the IDE, click on the `package.json` file and add these dependencies to the `devDependencies` section.

```json
    "@aws-lambda-powertools/logger": "^1.2.1",
    "@aws-lambda-powertools/tracer": "^1.2.1",
    "@graphql-codegen/cli": "^2.13.1",
    "@graphql-codegen/typescript": "^2.7.3",
    "@types/aws-lambda": "^8.10.106",
    "aws-sdk": "^2.1153.0",
    "ksuid": "^2.0.0",
```

We’ll be using lambda-powertools for typescript library for structured logging and tracing.

Feel free to read more about the library here [https://awslabs.github.io/aws-lambda-powertools-typescript/latest/](https://awslabs.github.io/aws-lambda-powertools-typescript/latest/)

We'll be using both lambda and vtl as our Appsync resolvers. When using lambda(with Typescript),we want our typescript types to correspond with the graphql schema. 

Doing this manually is tedious, prone to error and is basically doing the same job twice!.

These 3 libraries would help us generate GraphQl types into our code automatically.

```json
    "@graphql-codegen/cli": "^2.13.1",
    "@graphql-codegen/typescript": "^2.7.3",
    "@types/aws-lambda": "^8.10.106",
```

The first two packages belong to the graphql-code-generator suite. The first one is the base CLI, while the second one is the plugin that generates TypeScript codes from a GraphQL schema.

`@types/aws-lambda` is a collection of TypeScript types for AWS Lambda. It includes all sorts of Lambda event type definitions (API gateway, S3, SNS, etc.), including one for AppSync resolvers (AppSyncResolverHandler). We'll use that last one later when we build our resolvers.

`ksuid` stands for K-Sortable Unique Identifier. Its an efficient, comprehensive, battle-tested Go library for generating and parsing a specific kind of globally unique identifier called a *KSUID.*

KSUID are naturally ordered by generation time, meaning they can be sorted.

Learn more about the library here [https://github.com/segmentio/ksuid](https://github.com/segmentio/ksuid)

Don't forget to run `npm i` to install all the dependencies.
