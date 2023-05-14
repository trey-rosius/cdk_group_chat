## Deploy

When it's all said and done, we have to deploy and test the application.Since our app has multiple stacks and we intend on deploying all of them, we'll use the `--all` flag.

`cdk synth --all`

`cdk bootstrap`

`cdk deploy --all`

Once deployed successfully, you should be able to see the graphql endpoint in your terminal.
