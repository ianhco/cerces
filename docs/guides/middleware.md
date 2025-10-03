# Middleware

**Middleware** in Cerces allows you to run code on every request and response, enabling cross-cutting concerns like logging, authentication, CORS handling, compression, and more.

Middleware functions act as interceptors that can:
- **Inspect requests** before they reach your route handlers
- **Process responses** before they're sent to clients
- **Handle errors** and edge cases consistently across all routes
- **Add common functionality** without duplicating code in individual routes

This is perfect for tasks like request logging, setting response headers, integrity checks, rate limiting, and response compression.

## Creating Middleware

Create middleware using the `Middleware` class. The `handle` function receives two parameters:
- **Context object**: Contains `req` (Request), along with other [runtime arguments](./runtime-args.md).
- **`next` function**: Calls the next middleware or route handler in the chain.

```ts
import { Middleware } from "cerces"

const requestLogger = new Middleware({
    name: "requestLogger", // optional name for debugging
    handle: async ({ req }, next) => {
        console.log(`${req.method} ${req.url}`)
        const start = Date.now()

        const response = await next() // call next middleware/route handler

        const duration = Date.now() - start
        console.log(`Response: ${response.status} (${duration}ms)`)

        return response
    },
})
```

Apply middleware to your app:

```ts
import { App } from "cerces"

const app = new App({
    middleware: [requestLogger] // [!code focus]
})
```

::: tip Middleware Execution Order
Middleware executes in the order you define it. The first middleware in your array runs first on requests and last on responses (like an onion - outer layers first, then inner layers).
:::

## Processing Order

Middleware can run code **before** the request reaches route handlers and **after** responses are generated:

```ts
const timingMiddleware = new Middleware({
    handle: async ({ req }, next) => {
        // BEFORE: Request processing // [!code focus:3]
        const startTime = Date.now()
        console.log(`Processing ${req.method} ${req.url}`)

        const response = await next() // Route handler executes here

        // AFTER: Response processing // [!code focus:4]
        const duration = Date.now() - startTime
        response.headers.set("X-Response-Time", `${duration}ms`)
        console.log(`Completed in ${duration}ms`)

        return response
    },
})
```

**Before request processing**: Perfect for logging, authentication, request modification, or early validation.

**After response processing**: Ideal for adding headers, logging response metrics, compression, or cleanup tasks.

## Maybe Dependencies?

While middleware can intercept and process requests/responses, it **cannot provide additional data to route handlers**. For that, use [dependencies](./dependencies.md):

**Use middleware for:**
- Request/response logging and monitoring
- Adding headers to responses
- CORS handling
- Compression
- Error handling and recovery

**Use dependencies for:**
- Providing processed data to route handlers (user objects, database connections, etc.)
- Parameter validation and transformation
- Business logic that handlers need access to
- Reusable data fetching and processing

```ts
// ❌ Middleware cannot provide data to handlers
const authMiddleware = new Middleware({
    handle: async ({ req }, next) => {
        const user = await authenticateUser(req)
        // This user data is NOT available in route handlers!
        return next()
    },
})
```
```ts
// ✅ Dependencies CAN provide data to handlers
const requireAuth = new Dependency({
    parameters: { authorization: Header(z.string()) },
    handle: async ({ authorization }) => {
        const user = await authenticateUser(authorization)
        return user // This IS available in route handlers!
    }
})

app.get("/profile", {
    parameters: {
        user: Depends(requireAuth), // user data available here
    },
    handle: ({ user }) => ({ profile: user.profile })
})
```

::: tip Choose Wisely
If your route handlers need access to processed data (user objects, parsed tokens, database results), use dependencies. Use middleware for cross-cutting concerns that don't need to pass data to handlers.
:::
::: warning Runtime Nuances
In some runtimes, `Request` objects may be immutable. Always check your runtime's documentation for request/response handling limitations.
:::

## Scoped Middleware

Apply middleware to specific routes or [routers](./bigger-apps.md) instead of globally:

**Router-level middleware** (affects all routes in that router):

```ts
import { Router, Base } from "cerces"
import type app from "src/index"

const apiRouter = new Router({
    base: Base<typeof app>(),
    middleware: [authMiddleware] // applies to all routes in this router
})

apiRouter.get("/users", { /* ... */ })
apiRouter.post("/posts", { /* ... */ })
```
```ts
app.include("/api", apiRouter) // /api/users and /api/posts get auth middleware
```

**Route-level middleware** (affects only specific routes):

```ts
app.get("/admin", {
    middleware: [adminAuthMiddleware], // only this route
    parameters: {},
    handle: () => ({ message: "Admin area" })
})
```

**Middleware merging**: When middleware is defined at multiple levels, they're combined in this order:
1. App-level middleware
2. Router-level middleware
3. Route-level middleware

Each level's middleware wraps the next, maintaining proper execution order.

## Built-in Middleware

Cerces provides ready-to-use middleware for common web development needs:

- [CORS](cors.md): Handle Cross-Origin Resource Sharing with flexible configuration.
- [Trusted Host](trusted-host.md): Restrict requests to specified hostnames for security.
- [Compress](compress.md): Automatically compress responses to save bandwidth.
