# Bigger Applications

As your Cerces application grows, you'll want to organize your code into logical modules rather than keeping everything in a single file. **Routers** allow you to split your application into smaller, manageable pieces while maintaining type safety and automatic OpenAPI documentation.

## Why Use Routers?

Routers help you:
- **Organize code** by feature or domain (users, products, admin, etc.)
- **Maintain type safety** across modules with TypeScript
- **Generate consistent OpenAPI docs** automatically
- **Reuse route groups** across different applications
- **Apply scoped middleware** to specific route groups
- **Share parameters and dependencies** within route groups

## Basic Router Structure

Consider this common application structure:

```
src/
├── index.ts          # Main app
├── routers/
│   ├── users.ts      # User-related routes
│   ├── products.ts   # Product management
│   └── admin.ts      # Admin functionality
└── shared/
    ├── middleware.ts # Shared middleware
    └── dependencies.ts # Shared dependencies
```

## Creating Routers

Routers are created using the `Router` class and must specify a `base` that references the parent app type:

```ts
import { Router, Base } from "cerces"
import type { app } from "../index.ts" // Import your main app type

const userRouter = new Router({
    base: Base<typeof app>() // Type-safe reference to parent app
})
```

::: tip Type-Only Imports
Using `import type` avoids circular import issues and provides several benefits:

- **Prevents circular imports** between your main app and router files
- **Enables type safety** - all parent app parameters become available in router route handlers
- **Prevents accidental inclusion** - the router can only be mounted on apps with the correct type
- **Zero runtime overhead** - type imports are removed during compilation
:::

### Configuration Options

```ts
const router = new Router({
    base: Base<typeof app>(),
    tags: ["users"],                    // OpenAPI tags for this router
    parameters: { /* shared parameters */ }, // Parameters available to all routes
    middleware: [ /* router middleware */ ], // Middleware for all routes in this router
    defaultResponseClass: JSONResponse, // Default response type
})
```

## Router Parameters

Routers can define parameters and dependencies that are automatically available to all routes within that router:

```ts
import { Router, Base, Depends, Query } from "cerces"
import { z } from "zod"

const requireAuth = new Dependency({
    parameters: { token: Header(z.string()) },
    handle: ({ token }) => ({ userId: decodeToken(token) })
})

const apiRouter = new Router({
    base: Base<typeof app>(),
    parameters: {
        // Available to ALL routes in this router
        apiVersion: Query(z.string().default("v1")),
        user: Depends(requireAuth)
    }
})

// These routes automatically get apiVersion and user parameters
apiRouter.get("/profile", {
    handle: ({ apiVersion, user }) => ({ version: apiVersion, profile: user })
})

apiRouter.get("/settings", {
    handle: ({ apiVersion, user }) => {
        return { version: apiVersion, settings: user.settings }
    }
})
```

## Router Middleware

Apply middleware to all routes in a router:

```ts
import { createCORSMiddleware } from "cerces"

const apiRouter = new Router({
    base: Base<typeof app>(),
    middleware: [
        createCORSMiddleware({ origin: ["https://myapp.com"] }),
        loggingMiddleware
    ]
})
```

## Defining Routes

Routers support all the same route definition features as the main app:

```ts
const productRouter = new Router({
    base: Base<typeof app>(),
    tags: ["products"]
})

// All route types supported
productRouter.get("/products", { /* ... */ })
productRouter.post("/products", { /* ... */ })
productRouter.put("/products/{id}", { /* ... */ })
productRouter.delete("/products/{id}", { /* ... */ })

// Full feature support
productRouter.get("/search", {
    parameters: {
        q: Query(z.string()),
        limit: Query(z.number().max(100).default(20))
    },
    responses: {
        200: Responds(z.array(z.object({ id: z.number(), name: z.string() })))
    },
    handle: ({ q, limit }) => {
        return searchProducts(q, limit)
    }
})
```

## Including Routers

Use `app.include()` to mount routers at specific paths:

```ts
import { App } from "cerces"
import userRouter from "./routers/users.ts"
import productRouter from "./routers/products.ts"
import adminRouter from "./routers/admin.ts"

const app = new App({
    // Global middleware and config
})

// Mount routers with path prefixes
app.include("/api/users", userRouter)      // Routes: /api/users/*
app.include("/api/products", productRouter) // Routes: /api/products/*
app.include("/admin", adminRouter)         // Routes: /admin/*

// You can still add routes directly to the main app
app.get("/health", {
    handle: () => ({ status: "ok" })
})
```

::: tip Path Parameter Type Safety
When a router declares parameters that include path parameters, the prefix path used in `include()` must also include those path parameters in curly braces. For example, if a router has a `projectId` path parameter, the prefix must be `"/projects/{projectId}"`, otherwise TypeScript will throw a type error preventing inclusion.

```ts
// ✅ Correct: Router with projectId param requires {projectId} in prefix
const projectRouter = new Router({
    base: Base<typeof app>(),
    parameters: {
        projectId: Path(z.string()) // Router declares projectId parameter
    }
})
app.include("/projects/{projectId}", projectRouter) // ✅ Type-safe

// ❌ Wrong: Missing {projectId} would cause type error
// app.include("/projects", projectRouter) // ❌ TypeScript error
```
:::

### Mounting at Root Level

Mount routers at the root path or mix with main app routes:

```ts
// Mount at root - router routes become top-level
app.include("/", apiRouter)

// Mix router and app routes
app.include("/api/v1", v1Router)
app.include("/api/v2", v2Router)

// Direct app routes alongside mounted routers
app.get("/status", { /* ... */ })
```

## Nested Routers

Create hierarchical route structures with nested routers:

```ts
// Parent router
const apiRouter = new Router({
    base: Base<typeof app>(),
    tags: ["api"]
})

// Child router
const userRouter = new Router({
    base: Base<typeof apiRouter>(), // Base on parent router for type safety
    tags: ["users"]
})

// Mount child router on parent
apiRouter.include("/users", userRouter)

// Final routes: /api/users/* (from apiRouter.include("/users", userRouter))
```

::: tip Nested Router Types
For nested routers, use `Base<typeof parentRouter>` to ensure type safety. This makes all parameters from parent routers available to child router routes, maintaining the parameter inheritance chain.
:::

## Response Classes

Set default response types for all routes in a router:

```ts
const adminRouter = new Router({
    base: Base<typeof app>(),
    defaultResponseClass: JSONResponse, // All routes default to JSON
    statusCode: 200                    // Default status for implicit responses
})

// Override per route if needed
adminRouter.get("/dashboard", {
    responseClass: HTMLResponse, // Override for specific route
    handle: () => "<h1>Admin Dashboard</h1>"
})
```

## OpenAPI Documentation

Routers automatically contribute to your OpenAPI documentation:

### Router Tags
Group related routes in the documentation:

```ts
const userRouter = new Router({
    base: Base<typeof app>(),
    tags: ["Users", "Authentication"] // Multiple tags supported
})
```

### Route Tags
Override or add tags per route:

```ts
userRouter.get("/profile", {
    tags: ["Users", "Profile"], // Additional tags for this route
    handle: () => ({ /* ... */ })
})
```

### Documentation Structure
The generated OpenAPI will show:
- Routes organized by tags
- Proper path prefixes from `app.include()`
- Parameter inheritance from router to routes
- Middleware and dependencies documented where applicable

## Best Practices

### 1. Logical Grouping
Group routes by feature or domain:

```ts
// ✅ Good: Feature-based grouping
app.include("/users", userRouter)
app.include("/products", productRouter)
app.include("/orders", orderRouter)

// ❌ Avoid: Technical grouping
app.include("/api", apiRouter)
app.include("/web", webRouter)
```

### 2. Consistent Naming
Use consistent router naming and path conventions:

```ts
// ✅ Consistent patterns
const userManagementRouter = new Router({ /* ... */ })
const productCatalogRouter = new Router({ /* ... */ })

app.include("/users", userManagementRouter)
app.include("/products", productCatalogRouter)
```

### 3. Parameter Sharing
Use router parameters for common requirements:

```ts
const authenticatedRouter = new Router({
    base: Base<typeof app>(),
    parameters: {
        user: Depends(requireAuth), // All routes get authenticated user
        tenant: Depends(getTenant)  // All routes get tenant context
    }
})
```

### 4. Middleware Scoping
Apply middleware at the appropriate level:

```ts
// App-level: Global concerns (CORS, logging, security headers)
const app = new App({
    middleware: [corsMiddleware, securityHeaders, requestLogger]
})

// Router-level: Feature-specific concerns (auth, rate limiting)
const apiRouter = new Router({
    base: Base<typeof app>(),
    middleware: [authMiddleware, rateLimiter]
})
```

This structure keeps your code organized, type-safe, and maintainable as your application grows.
