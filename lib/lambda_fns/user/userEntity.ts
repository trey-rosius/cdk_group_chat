interface UserParameters {
  id: string;
  username: string;
  email: string;
  profilePicUrl: string;
  createdOn: string;
}
class UserEntity {
  id: string;
  username: string;
  profilePicUrl: string;
  email: string;
  createdOn: string;

  constructor({
    id,
    username,
    email,
    profilePicUrl,

    createdOn,
  }: UserParameters) {
    this.id = id;

    this.username = username;
    this.email = email;
    this.profilePicUrl = profilePicUrl;

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
      profilePicUrl: this.profilePicUrl,

      createdOn: this.createdOn,
    };
  }

  graphQlReturn() {
    return {
      id: this.id,
      ENTITY: "USER",
      username: this.username,
      email: this.email,
      profilePicUrl: this.profilePicUrl,

      createdOn: this.createdOn,
    };
  }
}

export default UserEntity;
