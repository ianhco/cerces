# Runtime Arguments

Cerces implements **Web Standards** and provides a unified interface for handling HTTP requests across different JavaScript runtimes. Cerces' `App.handle` method forwards runtime-specific arguments and handles routing, parameter validation, middleware execution, and response generation.

## Web Standards Compliance

Cerces follows Web Standards, providing a **global argument** `req: Request` on all handlers (routes, dependencies, middleware). This ensures compatibility with the Web Fetch API and allows seamless integration with any runtime that supports standard Request/Response objects.

```ts
app.get("/", {
    parameters: {},
    handle: ({ req }) => { // [!code focus:2]
        // req: Request
        return { message: "Hello World" }
    },
})
```

## Runtime-Specific Arguments

Additional arguments beyond `req` vary depending on the runtime environment. These are provided by the platform and can include environment variables, execution contexts, or other runtime-specific data.

Runtime arguments are typed through the `RuntimeArgs` interface, which should be extended in a `runtime.d.ts` (or similar `.d.ts`) file. This file is typically created when initializing a project using Cerces templates.

To provide TypeScript support for runtime-specific arguments, extend the `RuntimeArgs` interface in a declaration file. These are typically **already set up** if you used a Cerces template to create your project. For example, if you used the `bun` or `cf-workers` templates, you would have:

::: code-group
```ts [bun]
import { Server } from "bun"

declare module "cerces/types" {
    interface RuntimeArgs {
        ctx: Server
    }
}
```
```ts [cf-workers]
declare module "cerces/types" {
    interface RuntimeArgs {
        env: Env
        ctx: ExecutionContext
    }
}
```
:::

This provides types for additional runtime arguments in handlers:

::: code-group
```ts [bun]
app.get("/", {
    parameters: {},
    handle: ({ req, ctx }) => { // [!code focus:2]
        // req: Request; ctx: Server
        return { message: "Hello World" }
    },
})
```
```ts [cf-workers]
app.get("/", {
    parameters: {},
    handle: ({ req, env, ctx }) => { // [!code focus:2]
        // req: Request; env: Env; ctx: ExecutionContext;
        return { message: "Hello World" }
    },
})
```
:::

With this setup, handlers automatically receive properly typed runtime arguments without additional configuration.
