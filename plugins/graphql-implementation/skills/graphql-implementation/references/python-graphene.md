# Python Graphene Implementation

GraphQL API implementation using Graphene with Flask.

```python
import graphene
from graphene import ObjectType, String, Int, List, Field, Mutation, InputObjectType
from flask import Flask
from flask_graphql import GraphQLView

# Domain Models
class UserModel:
    def __init__(self, id, name, email, role="user"):
        self.id = id
        self.name = name
        self.email = email
        self.role = role

class PostModel:
    def __init__(self, id, title, content, author_id, published=False):
        self.id = id
        self.title = title
        self.content = content
        self.author_id = author_id
        self.published = published


# Mock database
users_db = {
    "1": UserModel("1", "John Doe", "john@example.com", "admin"),
    "2": UserModel("2", "Jane Smith", "jane@example.com", "user"),
}

posts_db = {
    "1": PostModel("1", "First Post", "Hello World!", "1", True),
    "2": PostModel("2", "Draft Post", "Work in progress", "1", False),
}


# GraphQL Types
class UserType(ObjectType):
    id = String(required=True)
    name = String(required=True)
    email = String(required=True)
    role = String()
    posts = List(lambda: PostType)

    def resolve_posts(self, info):
        return [p for p in posts_db.values() if p.author_id == self.id]


class PostType(ObjectType):
    id = String(required=True)
    title = String(required=True)
    content = String(required=True)
    published = graphene.Boolean()
    author = Field(UserType)

    def resolve_author(self, info):
        return users_db.get(self.author_id)


# Input Types
class CreateUserInput(InputObjectType):
    name = String(required=True)
    email = String(required=True)
    role = String()


class CreatePostInput(InputObjectType):
    title = String(required=True)
    content = String(required=True)
    author_id = String(required=True)


# Queries
class Query(ObjectType):
    user = Field(UserType, id=String(required=True))
    users = List(UserType, limit=Int(), offset=Int())
    post = Field(PostType, id=String(required=True))
    posts = List(PostType, published=graphene.Boolean())

    def resolve_user(self, info, id):
        return users_db.get(id)

    def resolve_users(self, info, limit=10, offset=0):
        users = list(users_db.values())
        return users[offset:offset + limit]

    def resolve_post(self, info, id):
        return posts_db.get(id)

    def resolve_posts(self, info, published=None):
        posts = list(posts_db.values())
        if published is not None:
            posts = [p for p in posts if p.published == published]
        return posts


# Mutations
class CreateUser(Mutation):
    class Arguments:
        input = CreateUserInput(required=True)

    user = Field(UserType)
    success = graphene.Boolean()

    def mutate(self, info, input):
        new_id = str(len(users_db) + 1)
        user = UserModel(
            id=new_id,
            name=input.name,
            email=input.email,
            role=input.role or "user"
        )
        users_db[new_id] = user
        return CreateUser(user=user, success=True)


class CreatePost(Mutation):
    class Arguments:
        input = CreatePostInput(required=True)

    post = Field(PostType)
    success = graphene.Boolean()

    def mutate(self, info, input):
        new_id = str(len(posts_db) + 1)
        post = PostModel(
            id=new_id,
            title=input.title,
            content=input.content,
            author_id=input.author_id
        )
        posts_db[new_id] = post
        return CreatePost(post=post, success=True)


class PublishPost(Mutation):
    class Arguments:
        id = String(required=True)

    post = Field(PostType)
    success = graphene.Boolean()

    def mutate(self, info, id):
        post = posts_db.get(id)
        if not post:
            return PublishPost(post=None, success=False)
        post.published = True
        return PublishPost(post=post, success=True)


class Mutations(ObjectType):
    create_user = CreateUser.Field()
    create_post = CreatePost.Field()
    publish_post = PublishPost.Field()


# Schema
schema = graphene.Schema(query=Query, mutation=Mutations)


# Flask App
app = Flask(__name__)
app.add_url_rule(
    '/graphql',
    view_func=GraphQLView.as_view('graphql', schema=schema, graphiql=True)
)

if __name__ == '__main__':
    app.run(debug=True)
```

## Query Examples

```graphql
# Get user with posts
query {
  user(id: "1") {
    id
    name
    email
    posts {
      title
      published
    }
  }
}

# List users with pagination
query {
  users(limit: 10, offset: 0) {
    id
    name
    role
  }
}

# Create user
mutation {
  createUser(input: {name: "Bob", email: "bob@example.com"}) {
    success
    user {
      id
      name
    }
  }
}
```

## Dependencies

```txt
graphene>=3.0
flask>=2.0
flask-graphql>=2.0
```
