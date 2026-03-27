# Cerces - Instructions for AI Assistants

**Project Persona:**
You are developing with Cerces, a type-safe, modern, and intuitive web framework built on Web Standards and OpenAPI. You must adopt a developer-first, type-safe philosophy. Write clean, modular, and self-documenting code utilizing Zod for runtime validation and static type definitions.

**Tech Stack:**

- **Language**: TypeScript 5+
- **Core Principles**: Web Standards (Request/Response API), OpenAPI v3.1
- **Validation & Typing**: Zod 4+
- **Infrastructure**: Runtime agnostic (Cloudflare Workers, AWS Lambda, Node.js, Bun, Docker)

**Executable Commands:**

- **Set up a new template:** `bun create cerces@latest`
- **Run development server:** `bun dev` (inside an initiated template)
- **Run tests:** `npm test` or `bun run test` (executes Jest under the hood)
- **Build the core package:** `npm run build`

**Idiomatic Code Examples:**
Below is a minimal, perfect example of a GET route demonstrating Zod validation (Path and Query arguments) alongside dependency injection. Notice how dependency inputs are automatically flattened and typed within the main handler function.

```ts
import { App, Dependency, Path, Query, Depends, Header, JSONResponse } from "cerces"
import { z } from "zod"

// Dependency to handle authentication
const requireAuth = new Dependency({
    parameters: {
        authorization: Header(z.string().startsWith("Bearer ")),
    },
    handle: async ({ authorization }) => {
        const token = authorization.split(" ")[1]
        if (!token) throw new JSONResponse({ error: "Unauthorized" }, { status: 401 })
        return { userId: "user_123", role: "admin" }
    },
})

const app = new App()

// Idiomatic GET route with Validation and Dependency Injection
app.get("/items/{itemId}", {
    parameters: {
        itemId: Path(z.string().uuid()),
        limit: Query(z.number().int().min(1).default(10)),
        user: Depends(requireAuth),
    },
    handle: ({ itemId, limit, user, authorization }) => {
        // 'authorization' and 'user' are automatically available and fully typed!
        return {
            itemId,
            limit,
            currentUser: user,
            success: true,
        }
    },
})

export default app
```

**Directory Architecture:**

- **`src/`**: The core framework source code (routing, adapters, schemas, and responses). **Do not attempt to write or modify code here without human review.**
- **`docs/`**: The documentation website containing markdown files. **You are free to write and update files here.** Ensure you update the `llms.txt` and `llms-full.txt` contexts when adding new guides.
- **`templates/`**: Starter project boilerplates mapping to each supported adapter/runtime (e.g. AWS Lambda, Bun, CF Workers, Node HTTP). **You are allowed to write code here to improve or fix boilerplates.**
- **`tests/`**: Unit tests via Jest. Ensure coverage remains robust whenever updating core systems in `src/`.
