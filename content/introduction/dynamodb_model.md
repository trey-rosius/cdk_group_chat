## Database Model

We can model the application's entities by defining separate tables as shown below

- Users
- Groups
- Messages
- Typing

This is good, no doubt. But this would require that we write 2 or more queries to get specific data from the database.

For example, getting users for a particular group involves making 2 queries.

First query gets the list of user ids from `groups` table, second query involves getting user information for each specific `userId` from `users` table.

So I'll prefer we use single table design for this application.

Meaning that, we would use one single table for all our entities. 

By having all entities in a single table, we can construct queries that return all the needed data with a single interaction with DynamoDB, speeding up the performance of the application for specific access patterns.

But, the improved performance for specific access patterns comes at the cost of potentially reduced performance for other access patterns and increased application and query complexity.

That's a design decision I'm conformable with. 

Let's proceed.

![alt text](https://github.com/trey-rosius/cdk_group_chat/raw/master/images/single_table.png)

Here's the database model. Feel free to download it and use in the NoSQL Workbench application.

[NoSQL Workbench JSON Model](https://github.com/trey-rosius/cdk_group_chat/raw/master/json/group_chat.json)

![alt text](https://github.com/trey-rosius/cdk_group_chat/raw/master/images/no_sql_workbench.png)
