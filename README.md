# Cerces

Documentation: https://cerces.dev/

Cerces is a type-safe, modern, and intuitive web framework built on Web Standards and OpenAPI, designed with a developer-first approach to streamline API development across various JavaScript runtimes and deployment platforms.

## Features

- 👨‍💻 **Developer-first and intuitive.** Designed for ease of use, enabling rapid development with a focus on developer experience.
- ⚙️ **OpenAPI and Zod integrated seamlessly.** Built-in integration of Zod validators and OpenAPI schema generators.
- 🏷️ **Type-safe routes and parameters.** All parameters and schemas are typed when implementing route handlers.
- 📖 **Interactive API documentation.** Swagger and Redoc pages are available by default at `/docs` and `/redoc`.
- 🪝 **Dependency injection mechanism.** Prepare variables, enforce authentication, and run other tasks before processing a request.
- 🌐 **Runtime agnostic and portable.** Easily adaptable to any JavaScript runtime or deployment platform.

## Setup

Starter templates are available for supported platforms. Get started quickly with:

```sh
bun create cerces@latest
```

You will be prompted to select a template:

```md
? Which template do you want to use?
❯ bun
cf-workers
aws-lambda
docker
```

Once dependencies are installed, start the development server:

```sh
bun dev
```

## Example

Below is a simple example demonstrating how to create a GET endpoint with path and query parameters using Cerces and Zod for validation, along with the interactive API documentation.

```ts
import { App, Path, Query } from "cerces"
import { z } from "zod"

const app = new App({})

app.get("/items/{itemId}", {
    parameters: {
        itemId: Path(z.number().int().min(0)),
        q: Query(z.string().optional()),
    },
    handle: ({ itemId, q }) => {
        return { itemId, q }
    },
})

export default app
```

![Swagger Docs](https://cerces.dev/swaggerdocs.jpg)

---

Join other developers in **starring ⭐** this repository to show your support!
