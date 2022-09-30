interface UserParameters {
  id: string;
  username: string;
  email: string;

  createdOn: string;
}
class UserEntity {
  id: string;
  username: string;
  email: string;
  createdOn: string;

  constructor({
    id,
    username,
    email,

    createdOn,
  }: UserParameters) {
    this.id = id;

    this.username = username;
    this.email = email;

    this.createdOn = createdOn;
  }

  key(): {
    PK: string;
    SK: string;
  } {
    return {
      PK: `USER#${this.email}`,
      SK: `USER#${this.email}`,
    };
  }

  toItem() {
    return {
      ...this.key(),
      id: this.id,
      ENTITY: "USER",

      username: this.username,
      email: this.email,

      createdOn: this.createdOn,
    };
  }

  graphQlReturn() {
    return {
      id: this.id,
      ENTITY: "USER",
      username: this.username,
      email: this.email,

      createdOn: this.createdOn,
    };
  }
}

export default UserEntity;
