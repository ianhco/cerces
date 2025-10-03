# Dependencies

**Dependencies** in Cerces provide a powerful way to **reuse parameter validation and processing logic** across multiple routes. They allow you to define reusable pieces of functionality that can validate request data, authenticate users, connect to databases, or perform any other common operations.

When you declare a dependency in a route, Cerces automatically handles:
- Parameter validation and parsing
- Execution of dependency logic
- [Parameter flattening](#parameter-flattening) - making all dependency parameters available in your handlers
- [Caching](#dependency-caching) to avoid redundant computations
- OpenAPI documentation generation

This approach helps you:
- **Avoid code duplication** by centralizing common logic
- **Enforce consistency** across routes (authentication, validation, etc.)
- **Keep route handlers focused** on their specific business logic
- **Generate accurate OpenAPI docs** automatically

## Definition

To create a dependency you use the `Dependency` class to create a dependency instance.

The dependency init receives:

- `name`: (optional) name of the middleware, this does not have any functional effect.
- `useCache`: (optional) allow dependency handler responses to be cached and reused during parameter resolution on requests (details below). Default: `true`  
- `parameters`: the usual parameters declaration, these parameters will also be part of the generated OpenAPI document for the routes that use this dependency.
- `handle`: the usual handler function, but with a **second optional positional argument**:
    - `later`: after-request hook, void function receiving a response, [see details below](#after-request-hook).

Example:

```ts
import { App, Dependency, Header, JSONResponse } from "cerces" // [!code focus]
import { z } from "zod"

const app = new App({})

const requireAuth = new Dependency({ // [!code focus:5]
    parameters: {
        authorization: Header(z.string()),
    },
    handle: async ({ authorization }) => {
        const user = /* authenticate user with header content */
        if (!user)
            throw new JSONResponse({ detail: "Unauthenticated" }, { status: 401 })
        return user // [!code focus:3]
    },
})
```

This example creates a dependency that requires an `authorization` header, that is then used for authenticating the user, returning the user object if it was successfully authenticated, otherwise throw an HTTP 401 response.

## Route Usage

To use a dependency in a route, declare it as a `Depends` parameter. The dependency's return value will be available in your handler, and all parameters from the dependency (including nested ones) will be automatically validated and made available.

```ts
import { App, Dependency, Header, JSONResponse, Depends } from "cerces" // [!code focus]
import { z } from "zod"

/** requireAuth dependency declaration (refer section above) */

app.get("/protected", {
    parameters: { // [!code focus:5]
        user: Depends(requireAuth), // dependency result available as 'user'
        // Note: 'authorization' header is automatically handled by the dependency
    },
    handle: ({ user }) => {
        return { message: `Hello ${user.name}!` }
    },
})
```

In this example, the `authorization` header is validated and processed by the `requireAuth` dependency. Your route handler only needs to declare `user: Depends(requireAuth)` to get the authenticated user object.

## Nested Dependencies

Dependencies can depend on other dependencies, creating a tree of reusable validation and processing logic. Cerces handles the complexity of resolving these nested dependencies automatically.

```ts
import { Dependency, Query, Header, Depends } from "cerces" // [!code focus]
import { z } from "zod"

// Base dependency for user preferences
const userPrefs = new Dependency({ // [!code focus:9]
    parameters: {
        theme: Query(z.enum(["light", "dark"]).default("light")),
        lang: Query(z.string().default("en"))
    },
    handle: ({ theme, lang }) => {
        return { theme, lang }
    }
})

// Authentication dependency that uses user preferences
const requireAuth = new Dependency({ // [!code focus]
    parameters: {
        authorization: Header(z.string()),
        preferences: Depends(userPrefs) // depends on userPrefs // [!code focus]
    },
    handle: async ({ authorization, preferences }) => { // [!code focus:4]
        const user = /* authenticate user */
        return { ...user, preferences }
    }
})

// Route using nested dependencies
app.get("/dashboard", {
    parameters: {
        user: Depends(requireAuth), // gets auth + preferences // [!code focus]
    },
    handle: ({ user, theme, lang }) => { // flattened parameters also available // [!code focus]
        return {
            user: user,
            display: { theme, lang }
        }
    },
})
```

In this example:
- `requireAuth` depends on `userPrefs`
- The route only declares `user: Depends(requireAuth)`
- But the handler can access `theme` and `lang` directly due to parameter flattening
- The final parameter structure is: `{ user: {...}, theme: "light", lang: "en" }`

## Parameter Flattening

**Cerces** automatically **flattens** all parameters from dependencies, making them directly available in your route handlers without needing to declare them again in the route's `parameters`.

This means you can access parameters from dependencies (and their nested dependencies) directly in your handler function, regardless of how deep the nesting goes.

```ts
import { Dependency, Query, Depends } from "cerces" // [!code focus]
import { z } from "zod"

const userPrefs = new Dependency({ // [!code focus]
    parameters: { // [!code focus:4]
        theme: Query(z.enum(["light", "dark"])),
        lang: Query(z.string())
    },
    handle: ({ theme, lang }) => {
        return { theme, lang }
    }
})

const requireAuth = new Dependency({ // [!code focus]
    parameters: { // [!code focus:4]
        authorization: Header(z.string()),
        userPrefs: Depends(userPrefs) // nested dependency
    },
    handle: async ({ authorization, userPrefs }) => { // [!code focus:3]
        const user = /* authenticate user */
        return { ...user, preferences: userPrefs }
    }
})

app.get("/profile", {
    parameters: {
        user: Depends(requireAuth), // only declare the top-level dependency // [!code focus]
    },
    handle: ({ user, theme, lang, authorization }) => { // [!code focus:3]
        // `theme`, `lang`, `authorization` are available
        // without declaring them in route parameters!
        return {
            user: user,
            theme: theme,
            lang: lang
        }
    },
})
```

In this example, even though `theme` and `lang` are defined deep in the nested `userPrefs` dependency, they're automatically available in the route handler. This eliminates the need to manually destructure nested dependency results.

Dependency handlers have a second optional argument, this argument is an after-request promise hook named `later`, this hook performs follow-up actions after the request has been resolved and a response has been returned.

Example:

```ts
import { Dependency, Header, JSONResponse } from "cerces"
import { z } from "zod"

const requireAuth = new Dependency({
    parameters: {
        authorization: Header(z.string()),
    },
    handle: async ({ authorization, env }, later) => { // [!code focus]
        const user = /* authenticate user with header content */
        if (!user)
            throw new JSONResponse({ detail: "Unauthenticated" }, { status: 401 })
        later(async (res) => { // [!code focus:3]
            // do something to user
        })
        return user
    },
})
```

## Dependency Caching

By default, Cerces **caches** dependency results during parameter resolution. If the same dependency is used multiple times in a request (directly or through nesting), it's only executed once and the result is reused.

This is especially useful for expensive operations like database connections or authentication checks.

```ts
const dbConnection = new Dependency({
    parameters: {},
    handle: async () => {
        // Expensive database connection
        return await createDatabaseConnection()
    }
})

const requireUser = new Dependency({
    parameters: {
        authorization: Header(z.string()),
        db: Depends(dbConnection) // uses db connection
    },
    handle: async ({ authorization, db }) => {
        return await db.findUserByToken(authorization)
    }
})

const requirePermissions = new Dependency({
    parameters: {
        user: Depends(requireUser), // also uses requireUser
        db: Depends(dbConnection)   // also uses db connection
    },
    handle: async ({ user, db }) => {
        return await db.getUserPermissions(user.id)
    }
})

app.get("/protected-resource", {
    parameters: {
        user: Depends(requireUser),        // executes requireUser + dbConnection
        perms: Depends(requirePermissions), // reuses requireUser + dbConnection results
    },
    handle: ({ user, perms }) => {
        return { user, permissions: perms }
    },
})
```

In this example:
- `dbConnection` executes only once, even though it's used by both dependencies
- `requireUser` executes only once, even though it's a dependency of `requirePermissions`
- This prevents redundant database connections and authentication checks

```ts
const requireAuth = new Dependency({
    useCache: false, // disable caching // [!code focus]
    parameters: {
        authorization: Header(z.string()),
    },
    handle: async ({ authorization }) => {
        const user = /* authenticate user with header content */
        if (!user)
            throw new JSONResponse({ detail: "Unauthenticated" }, { status: 401 })
        return user
    },
})
