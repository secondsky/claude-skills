# Java REST Assured Contract Testing

Contract testing with REST Assured and JSON Schema validation.

```java
package com.example.contracts;

import io.restassured.RestAssured;
import io.restassured.module.jsv.JsonSchemaValidator;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;

import static io.restassured.RestAssured.*;
import static org.hamcrest.Matchers.*;

public class UserAPIContractTest {

    @BeforeAll
    static void setup() {
        RestAssured.baseURI = "http://localhost:3000";
        RestAssured.basePath = "/api";
    }

    @Test
    @DisplayName("GET /users/{id} should match user schema")
    void getUserMatchesSchema() {
        given()
            .pathParam("id", "123")
        .when()
            .get("/users/{id}")
        .then()
            .statusCode(200)
            .body(JsonSchemaValidator.matchesJsonSchemaInClasspath("schemas/user.json"))
            .body("id", notNullValue())
            .body("email", matchesPattern("^[\\w.+-]+@[\\w.-]+\\.[a-zA-Z]{2,}$"))
            .body("name", not(emptyString()));
    }

    @Test
    @DisplayName("GET /users should return paginated response")
    void listUsersMatchesPaginatedSchema() {
        given()
            .queryParam("page", 1)
            .queryParam("limit", 10)
        .when()
            .get("/users")
        .then()
            .statusCode(200)
            .body(JsonSchemaValidator.matchesJsonSchemaInClasspath("schemas/paginated-users.json"))
            .body("data", hasSize(lessThanOrEqualTo(10)))
            .body("pagination.page", equalTo(1))
            .body("pagination.limit", equalTo(10))
            .body("pagination.total", greaterThanOrEqualTo(0));
    }

    @Test
    @DisplayName("POST /users should create user matching schema")
    void createUserMatchesSchema() {
        String newUser = """
            {
                "email": "newuser@example.com",
                "name": "New User"
            }
            """;

        given()
            .contentType("application/json")
            .body(newUser)
        .when()
            .post("/users")
        .then()
            .statusCode(201)
            .body(JsonSchemaValidator.matchesJsonSchemaInClasspath("schemas/user.json"))
            .body("email", equalTo("newuser@example.com"))
            .body("createdAt", notNullValue());
    }

    @Test
    @DisplayName("GET /users/{id} should return 404 for non-existent user")
    void nonExistentUserReturns404() {
        given()
            .pathParam("id", "non-existent-id")
        .when()
            .get("/users/{id}")
        .then()
            .statusCode(404)
            .body(JsonSchemaValidator.matchesJsonSchemaInClasspath("schemas/error.json"))
            .body("error.code", equalTo("NOT_FOUND"));
    }
}
```

## JSON Schema Files

### schemas/user.json
```json
{
    "$schema": "http://json-schema.org/draft-07/schema#",
    "type": "object",
    "required": ["id", "email", "name", "createdAt"],
    "properties": {
        "id": {
            "type": "string",
            "pattern": "^[a-f0-9-]{36}$"
        },
        "email": {
            "type": "string",
            "format": "email"
        },
        "name": {
            "type": "string",
            "minLength": 1
        },
        "createdAt": {
            "type": "string",
            "format": "date-time"
        },
        "role": {
            "type": "string",
            "enum": ["user", "admin", "moderator"]
        }
    }
}
```

### schemas/error.json
```json
{
    "$schema": "http://json-schema.org/draft-07/schema#",
    "type": "object",
    "required": ["error"],
    "properties": {
        "error": {
            "type": "object",
            "required": ["code", "message"],
            "properties": {
                "code": {"type": "string"},
                "message": {"type": "string"},
                "details": {"type": "array"}
            }
        }
    }
}
```

## Maven Dependencies

```xml
<dependencies>
    <dependency>
        <groupId>io.rest-assured</groupId>
        <artifactId>rest-assured</artifactId>
        <version>5.4.0</version>
        <scope>test</scope>
    </dependency>
    <dependency>
        <groupId>io.rest-assured</groupId>
        <artifactId>json-schema-validator</artifactId>
        <version>5.4.0</version>
        <scope>test</scope>
    </dependency>
    <dependency>
        <groupId>org.junit.jupiter</groupId>
        <artifactId>junit-jupiter</artifactId>
        <version>5.10.0</version>
        <scope>test</scope>
    </dependency>
</dependencies>
```
