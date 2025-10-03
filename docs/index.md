---
layout: home

hero:
    name: Cerces
    text: Type-Safe, Modern, and Intuitive.
    image:
        src: /icon.svg
        alt: Cerces Logo
    tagline: Built on Web Standards and OpenAPI.
    actions:
        -   theme: brand
            text: Get Started
            link: /guides/first-steps.md
        -   theme: alt
            text: Legacy Docs
            link: https://workery.iann838.com
        -   theme: alt
            text: Source Code
            link: https://github.com/ianhco/cerces

features:
    -   icon: 👨‍💻
        title: Developer-first and intuitive.
        details: Designed for ease of use, enabling rapid development with a focus on developer experience.
    -   icon: ⚙️
        title: OpenAPI and Zod integrated seamlessly.
        details: Built-in integration of Zod validators and OpenAPI schema generators.
    -   icon: 🏷️
        title: Type-safe routes and parameters.
        details: All parameters and schemas are typed when implementing route handlers.
    -   icon: 📖
        title: Interactive API documentation.
        details: Swagger and Redoc pages are available by default at `/docs` and `/redoc`.
    -   icon: 🪝
        title: Dependency injection mechanism.
        details: Prepare variables, enforce authentication, and run other tasks before processing a request.
    -   icon: 🌐
        title: Runtime agnostic and portable.
        details: Easily adaptable to any JavaScript runtime or deployment platform.
---

<br>

---

# Why Cerces?

**Cerces** reimagines web framework development by embracing modern **TypeScript patterns** and **web standards**. Built from the ground up with **type safety** as a first-class citizen, Cerces **eliminates** entire categories of runtime errors while maintaining the **flexibility** and **performance** you expect from a **modern** framework.

## The Philosophy of Cerces

Cerces embraces a philosophy where **type safety is paramount**, **simplicity guides design**, **clean code is non-negotiable**, and **intuitive APIs** make development a joy. Every feature is crafted to eliminate complexity while maximizing expressiveness and reliability.

- **Type Safety First**: End-to-end type checking prevents runtime errors
- **Simplicity**: Complex problems solved with elegant, minimal APIs
- **Clean Architecture**: Separation of concerns with reusable, composable components
- **Intuitive Design**: APIs that feel natural and predictable to TypeScript developers

## The Power of Type Safety

Traditional web frameworks leave type safety at the door. Cerces brings it center stage with comprehensive type checking that prevents runtime errors and accelerates development through intelligent IDE autocompletion.

**Accelerated Development**: Full TypeScript integration provides rich autocompletion for route parameters, dependency results, and API responses. Your IDE becomes a powerful assistant, suggesting valid options and catching errors before you run your code.

```ts
// Route parameters are fully typed
app.get("/users/{id}", {
    parameters: {
        id: Path(z.string().uuid()), // Zod validation + TypeScript types
    },
    handle: ({ id }) => {
        // id is typed as string (UUID validated)
        return { userId: id }
    }
})
```

<div style="display: flex; justify-content: center; margin-top: 1rem;">
    <img src="/editorparamtypehint.jpg" alt="Typed Route Parameters" style="max-width: 50%; height: auto; border: 1px solid #282828ff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); padding: 2.3rem 1rem;">
    <img src="/editorbodyparam.png" alt="Typed Route Parameters" style="max-width: 50%; height: auto; border: 1px solid #282828ff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); padding: 1rem;">
</div>

## Seamless OpenAPI Integration

API documentation shouldn't be an afterthought. Cerces generates OpenAPI schemas automatically from your Zod validators, providing:

- **Interactive Documentation**: Swagger UI at `/docs`, ReDoc at `/redoc`
- **Type-Driven Schemas**: Your TypeScript types become API documentation
- **Validation**: Request/response validation using the same schemas

![Swagger UI Docs](/docspostreq.jpg)

## Powerful Dependency System

Cerces dependencies enable clean, reusable logic that can be shared across routes:

```ts
const requireAuth = new Dependency({
    parameters: {
        authorization: Header(z.string()),
    },
    handle: async ({ authorization }) => {
        const user = await authenticateUser(authorization)
        if (!user) throw new JSONResponse({ detail: "Unauthorized" }, { status: 401 })
        return user
    }
})

app.get("/profile", {
    parameters: {
        user: Depends(requireAuth), // Authentication logic reused cleanly
    },
    handle: ({ user }) => {
        return { profile: user.profile }
    }
})
```

## Why Choose Cerces?

**For Startups**: Rapid development with built-in type safety and documentation
**For Enterprises**: Scalable architecture with clean, maintainable code
**For Developers**: Intuitive APIs that leverage TypeScript's full power
**For Teams**: Shared understanding through type-safe contracts and auto-generated docs

Cerces isn't just another framework—it's a commitment to **type-safe**, **modern**, and **intuitive** web development. Whether you're building APIs, microservices, or full-stack applications, Cerces provides the foundation to build with confidence and clarity.


