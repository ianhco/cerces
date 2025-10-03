# Responses

**Responses** are what your Cerces application sends back to clients after processing HTTP requests. Every route handler must return a response containing a status code, headers, and body content.

Cerces provides built-in response classes for common content types: **JSON**, **HTML**, and **plain text**. All extend from the base `Response` class.

```ts
import { HTMLResponse, JSONResponse, PlainTextResponse } from "cerces"
```

## Implicit Response

You don't always need to explicitly create response objects. When your route handler returns a plain JavaScript value (object, string, etc.), Cerces **automatically wraps it** in a `JSONResponse` with status code `200`.

```ts
app.get("/", {
    parameters: {},
    handle: () => {
        return { message: "Hello World" } // [!code focus]
    },
})
```

This is equivalent to manually creating:

```ts{4}
app.get("/", {
    parameters: {},
    handle: () => {
        return new JSONResponse({ message: "Hello World" }) // [!code focus]
    },
})
```

### Customizing Default Response Types

You can change the automatic response type at different levels:

**App-wide default:**

```ts
const app = new App({
	defaultResponseClass: PlainTextResponse // [!code focus]
})
```

**Per-route override:**

```ts
app.get("/", {
	responseClass: PlainTextResponse, // [!code focus]
    parameters: {},
    handle: () => {
        return { message: "Hello World" } // returns "[object Object]" // [!code focus]
    },
})
```

### Setting Default Status Codes

You can also specify a default status code for automatic responses:

```ts
app.get("/", {
    statusCode: 204, // [!code focus]
	responseClass: PlainTextResponse,
    parameters: {},
    handle: () => {
        return ""
    },
})
```

## Status and Headers

All response classes accept an optional second parameter for status code and headers:

**Setting status code:**

```ts
new JSONResponse({ message: "Hello World" }, { status: 200 })
```

**Adding custom headers:**

```ts
new JSONResponse({ message: "Hello World" }, {
    headers: {
        "Header-Key": "headerValue"
    }
})
```

## Custom Responses

When the built-in response classes don't meet your needs, you have two options:

### Option 1: Use Base Response Class
Return a `Response` instance directly and manually set headers like `Content-Type`:

```ts
return new Response(customBody, {
    headers: { "Content-Type": "application/xml" }
})
```

### Option 2: Extend Response Classes
Create your own response class by extending `Response` and pre-configuring headers:

```ts
export class HTMLResponse extends Response {
    constructor(body: any, init?: ResponseInit) {
        super(String(body), init)
        this.headers.set("Content-Type", "text/html;charset=utf-8")
    }
}
```

This approach encapsulates the content-type logic and makes your custom response reusable across routes.

## Content Negotiation

For APIs that support multiple response formats, you can check the client's `Accept` header to return different content types:

```ts
import { Header } from "cerces"
import { z } from "zod"

accept: Header(z.enum(["application/json", /* ... */]))
```

::: tip Accept Header in OpenAPI
The `accept` header is excluded by default from the generated OpenAPI schemas because response formats are controlled by the response schemas (covered in the next section).
:::

## OpenAPI Schemas

By default, Cerces generates OpenAPI documentation without response schemas. Response schemas are for **documentation only** - they don't validate or modify your actual response data.
To document your API responses, add response schemas to your routes:

Use the `Responds` helper for simple cases:

```ts
import { Responds } from "cerces"

app.get("/", {
	responses: { // [!code focus:3]
		200: Responds(z.object({ message: z.string() }))
	},
    parameters: {},
    handle: () => {
        return { message: "Hello World" }
    },
})
```

### Advanced Response Configuration

For more control, specify media type, description, and response headers:

```ts
Responds(z.object({ message: z.string() }), {
    mediaType: "application/json",
    description: "Sample description",
    headers: { Date: z.string() }
})
```

::: warning Single Media Type Limitation
`Responds` supports **only one** media type per status code. For multiple media types (content negotiation purposes) per status code, use the full OAS3.1 `ResponseConfig` object directly.

```ts
import type { ResponseConfig } from "@asteasolutions/zod-to-openapi" // [!code focus]

app.get("/", {
	responses: { // [!code focus:10]
		200: {
            description: "Successful response",
            content: {
                "application/json": { schema: z.object({ message: z.string() }) },
                "text/html": { schema: z.string() }
            },
            headers: { Date: z.string() }
        } as ResponseConfig
	},
    parameters: {
        accept: Header(z.enum(["application/json", "text/html"])), // [!code focus]
    },
    handle: () => { /* ... */ },
})
```
:::
