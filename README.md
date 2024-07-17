# NestJS GraphQL Book CMS API

![Test Genesis Logo](test_genesis/logo.png)

A progressive Node.js framework for building efficient and scalable server-side applications. This repository houses a NestJS GraphQL Book CMS API with authentication, authorization, and various entities like Book, Genre, User, User-details for TypeOrm PostgreSQL. It also utilizes UserActivityLog, Review, and BookStats stored in DynamoDB. The project includes microservice architecture with two main components: `api` and `test_genesis_consumer`, handling messages from SQS related to user activity and storing them in DynamoDb.

## Getting Started

### Prerequisites

Make sure you have Docker and Docker Compose installed on your machine.

## Installation

```bash
$ git clone <repository-url>
$ cd <repository-directory>
```
Copy the .env.example file to .env and set the necessary environment variables, including ROOT_ADMIN_USERNAME.
## Starting with Docker Compose

To start the application, run Docker Compose:

```bash
$ docker-compose up --build
```
## GraphQL Mutations necessary
```bash
    mutation{
    signUp(createUserInput: {
        username: "ROOT_ADMIN_USERNAME from .env",
        email: "test5@gmail.com",
        password: "passwordA123*",
        confirm: "passwordA123*",
    }){
        id
        role
        details{
            username
            email
        }
       }
    }

 }
```
```bash
   
mutation {
  signIn(
    email: "test5@gmail.com",
    password: "passwordA123*"
  ) {
    access_token
  }
}
```

```bash
   
 mutation{
  createGenre(createGenreInput: {
      name: "Fantasy",
   }){
     id
     name
      }
 }
```
## Documentation

You can access the API documentation, including queries and mutations, by navigating to:

[http://localhost:3000/docs](http://localhost:3000/docs)
This URL provides a dynamically generated documentation page powered by SpectaQL. You can use it to explore the available GraphQL schema, execute queries, and understand the structure of your API endpoints.

## Test

```bash
# unit tests
docker-compose up test
```



## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Yuriy Stanishevskiy]

## License

Nest is [MIT licensed](LICENSE).
