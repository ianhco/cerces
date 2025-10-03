# Handling Errors

When building APIs, you need to communicate errors to clients effectively. Cerces provides flexible ways to return error responses using standard HTTP status codes and response bodies.

HTTP error responses typically use status codes in the **4xx** (client errors) or **5xx** (server errors) ranges. Cerces supports all standard response classes for different content types.

Error responses are formatted like regular responses, using the same response classes:

```ts
import { JSONResponse } from "cerces"

new JSONResponse({ detail: "Not found" }, { status: 404 })
```

## Throwing vs Returning

Cerces allows you to either **throw** or **return** error responses. Both approaches work, but have different use cases.

### Throwing Responses

Throwing immediately exits the current execution context and returns the response. Use this for:
- **Early validation failures** in dependencies
- **Authentication/authorization errors**
- **Resource not found** scenarios
- **Any error that should stop processing**

```ts
import { JSONResponse } from "cerces" // [!code focus]

// In route handlers // [!code focus]
app.get("/items/{id}", {
    parameters: { id: Path(z.number()) },
    handle: ({ id }) => {
        const item = findItem(id)
        if (!item) {
            throw new JSONResponse({ detail: "Item not found" }, { status: 404 }) // [!code focus]
        }
        return item
    }
})

// In dependencies // [!code focus]
const requireAuth = new Dependency({
    parameters: { authorization: Header(z.string()) },
    handle: ({ authorization }) => {
        const user = validateToken(authorization)
        if (!user) {
            throw new JSONResponse({ detail: "Unauthorized" }, { status: 401 }) // [!code focus]
        }
        return user
    }
})
```

::: warning Middleware Limitations
You **cannot** throw responses in middleware handlers. Instead, return the response directly:

```ts
// ❌ Wrong - can't throw in middleware
const badMiddleware = new Middleware({
    handle: async ({}, next) => {
        throw new JSONResponse({ detail: "Forbidden" }, { status: 403 })
    }
})

// ✅ Correct - return response in middleware
const goodMiddleware = new Middleware({
    handle: async ({}, next) => {
        // Check some condition
        if (someCondition) {
            return new JSONResponse({ detail: "Forbidden" }, { status: 403 })
        }
        return next()
    }
})
```
:::

### Returning Responses

Returning responses is appropriate when:
- **The error is the expected result** of the operation
- **You want to continue processing** after the error
- **You're in middleware** (required)

```ts
// Returning error responses // [!code focus]
app.post("/users", {
    parameters: {
        userData: Body(z.object({
            email: z.string().email(),
            name: z.string()
        }))
    },
    handle: ({ userData }) => {
        // Check if user already exists
        const existingUser = findUserByEmail(userData.email)
        if (existingUser) {
            return new JSONResponse( // [!code focus:7]
                {
                    error: "User already exists",
                    email: userData.email
                },
                { status: 409 }
            )
        }

        // Create user and return success
        const newUser = createUser(userData)
        return newUser
    }
})
```

::: warning Dependency Constraints
Dependency handlers should **never return responses** unless that's actually the intended data. Dependencies provide parameters to route handlers - returning a response would make that response available as a parameter, which is almost never what you want.

If you need to return an error from a dependency, **throw** it instead.
:::

## Error Response Format

Cerces recommends using a simple, consistent JSON format for error responses:

```ts
{ detail: "Error description text" }
```

This format is:
- **Simple and predictable** for API consumers
- **Easy to parse** in any programming language
- **Extensible** - you can add additional fields when needed
- **Consistent** with many REST API conventions

### Basic Usage

```ts
// Recommended format
throw new JSONResponse(
    { detail: "User not found" },
    { status: 404 }
)

// For validation errors
throw new JSONResponse(
    { detail: "Invalid email format" },
    { status: 400 }
)

// With additional context (optional)
throw new JSONResponse(
    {
        detail: "Project name already exists",
        projectName: "my-project"
    },
    { status: 409 }
)
```

### Examples Throughout the Guide

```ts
// Authentication error
throw new JSONResponse(
    { detail: "Authentication required" },
    { status: 401 }
)

// Authorization error
throw new JSONResponse(
    { detail: "Admin access required" },
    { status: 403 }
)

// Not found error
throw new JSONResponse(
    { detail: "User not found" },
    { status: 404 }
)
```

::: tip Extensibility
While `{ detail: "text" }` is recommended for consistency, you can extend it with additional fields when more context is helpful:

```ts
{
    detail: "Validation failed",
    field: "email",
    code: "INVALID_FORMAT"
}
```
:::

## OpenAPI Documentation

Error responses are automatically included in your OpenAPI documentation when you define them in route responses:

```ts
app.get("/users/{id}", {
    parameters: { id: Path(z.number()) },
    responses: {
        200: Responds(z.object({ id: z.number(), name: z.string() })),
        404: Responds(z.object({ // [!code focus:4]
            detail: z.string(),
            userId: z.number()
        }), { description: "User not found" })
    },
    handle: ({ id }) => {
        const user = findUser(id)
        if (!user) {
            throw new JSONResponse( // [!code focus:4]
                { detail: "User not found", userId: id },
                { status: 404 }
            )
        }
        return user
    }
})
```

## Best Practices

1. **Use appropriate HTTP status codes** - 400 for bad requests, 401 for authentication, 403 for permissions, 404 for not found, 409 for conflicts, 500 for server errors.

2. **Be consistent** with error response formats across your API.

3. **Don't expose sensitive information** in error messages to clients.

4. **Log detailed errors** server-side for debugging while returning generic messages to clients.

5. **Use throwing for exceptional cases** and returning for expected business logic errors.

6. **Document error responses** in your OpenAPI spec for better API discoverability.
