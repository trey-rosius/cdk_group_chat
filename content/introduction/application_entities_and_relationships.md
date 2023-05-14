## Application Entities

- Users
- Groups
- Messages
- Typing(typing indicator)

## Relationship Between Entities

#### Users and Groups

- Users and Groups have 2 different type of relationships, based on different scenarios.

#### Scenario 1(Create Group)

- A user can create multiple groups. A group can be created by 1 user.

- So there's a one to many relationship between user and group here.

#### Scenario 2 (Belong to)

- A user can belong to many groups and a group can have many users.

- Therefore there's a many to many relationship between user and group.

#### Groups And Messages

- Groups and Messages share a one to many relationship.

- A group can have many messages. But a message can belong only to one group.

#### Users and Messages

- Users and Messages share a one to many relationship.

- A user can have many messages. A message belongs to one user.

#### Users and Typing

- Users and typing share a one to one relationship.
