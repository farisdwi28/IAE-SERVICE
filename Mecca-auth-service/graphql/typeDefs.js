const { gql } = require('apollo-server-express');

const typeDefs = gql`
  type Admin {
    id: ID!
    username: String!
    name: String!
    createdAt: String!
  }

  type Student {
    id: ID!
    nis: String!
    name: String!
    isActive: Boolean!
    createdAt: String!
  }

  type Teacher {
    id: ID!
    nip: String!
    name: String!
    createdAt: String!
  }

  union User = Admin | Student | Teacher

  type AuthPayload {
    token: String!
    user: UserInfo!
  }

  type UserInfo {
    id: ID!
    username: String!
    name: String!
    role: String!
  }

  type Query {
    me: User
    hello: String!
  }

  type Mutation {
    login(
      username: String!
      password: String!
      role: String!
    ): AuthPayload!
    
    registerAdmin(
      username: String!
      password: String!
      name: String!
    ): Admin!
  }
`;

module.exports = typeDefs;
