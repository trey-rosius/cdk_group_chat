## Endpoint Testing

We are going to be using the AWS appsync console for testing our graphql app's. You can also use postman or any other api platform of your choice.

Sign in to your aws account, search and open up appsync.
![alt text](https://github.com/trey-rosius/cdk_group_chat/raw/master/images/search_appsync.png)

Once in the appsync console, click and open up your project.

![alt text](https://github.com/trey-rosius/cdk_group_chat/raw/master/images/appsync_project.png)

From the left side menu, click on `Queries`.
We are going to be testing out all the `Query`, `Mutation` and `Subscription` we created for our app.

![alt text](https://github.com/trey-rosius/cdk_group_chat/raw/master/images/appsync_queries.png)

If we attempt to create a user account, using the `createUserAccount` mutation and an `apikey`,we'll be hit with the error `Not Authorized to access createUserAccount on type Mutation`.

![alt text](https://github.com/trey-rosius/cdk_group_chat/raw/master/images/unauth.png)

That’s because we added the directive `@aws_cognito_user_pool` , which requires a user to be signed in, before accessing that endpoint.

```graphql
createUserAccount(input: UserInput!): User! @aws_cognito_user_pools
```

Therefore, we need to create a new user in Cognito and then use that user to access the endpoints in our API.

From the aws console search bar, type cognito and open up the cognito user pools page.

![alt text](https://github.com/trey-rosius/cdk_group_chat/raw/master/images/cognito.png)

Navigate to your project and create a new user.Take note of the username(email) and password you used.

![alt text](https://github.com/trey-rosius/cdk_group_chat/raw/master/images/create_user.png)

Once created, go back to your project on Appsync and sign in with the username and password you just created.

![alt text](https://github.com/trey-rosius/cdk_group_chat/raw/master/images/auth.png)

![alt text](https://github.com/trey-rosius/cdk_group_chat/raw/master/images/auth1.png)

Once logged in, run the endpoint again. If everything goes smoothly, you’ll see a result similar to this, based on the inputs you gave.
