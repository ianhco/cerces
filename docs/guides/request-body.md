# Request Body

When sending data from a client to your API, it is commonly included in the **request body**. This is typically used with `POST`, `PUT`, `PATCH`, or `DELETE` requests.

## Declaration

To declare a **request body**, use the `Body` parameter constructor with Zod schemas:

```ts
import { Body } from "cerces" // [!code focus]
import { z } from "zod"

app.post("/items", {
    parameters: {
        item: Body(z.object({ // [!code focus:5]
			name: z.string(),
			price: z.number().min(0),
			description: z.string(),
		})),
    },
    handle: ({ item }) => { // [!code focus]
        return item
    },
})
```

With this body parameter declaration, **Cerces** will:

- Read the request body as JSON
- Validate the data against your schema
- Return formatted validation errors if the data is invalid
- Provide the validated data as a fully typed argument
- Include the schema in the generated OpenAPI documentation

## Non-JSON Body

Sometimes you may want to access the request body without JSON parsing or validation. Cerces supports this by accepting special constructor types in the `Body` parameter:

### Text Body

```ts
import { Body } from "cerces"

app.post("/upload-text", {
    parameters: {
        content: Body(String, { mediaType: "text/plain" }), // [!code focus]
    },
    handle: ({ content }) => { // [!code focus:2]
        return { received: content.length + " characters" }
    },
})
```

Receives the request body as plain text, equivalent to `await req.text()`.

### Binary File Body

```ts
import { Body } from "cerces"

app.post("/upload-file", {
    parameters: {
        file: Body(Blob, { mediaType: "application/octet-stream" }), // [!code focus]
    },
    handle: ({ file }) => { // [!code focus:2]
        return { size: file.size, type: file.type }
    },
})
```

Receives the request body as a binary blob, equivalent to `await req.blob()`.

### Stream Body

```ts
import { Body } from "cerces"

app.post("/upload-stream", {
    parameters: {
        stream: Body(ReadableStream, { mediaType: "application/octet-stream" }), // [!code focus]
    },
    handle: ({ stream }) => { // [!code focus:2]
        // Process stream without loading it entirely into memory
        return { isStream: true }
    },
})
```

Receives the request body as a readable stream, equivalent to `req.body`.

## Error Handling

When body validation fails, Cerces returns detailed error information. For example, sending invalid data to the `/items` endpoint above might return:

```json
{
  "detail": [
    {
      "location": "body",
      "name": "item",
      "issues": [
        {
          "code": "invalid_type",
          "expected": "string",
          "received": "number",
          "path": ["name"],
          "message": "Expected string, received number"
        },
        {
          "code": "too_small",
          "minimum": 0,
          "type": "number",
          "inclusive": true,
          "path": ["price"],
          "message": "Number must be greater than or equal to 0"
        }
      ]
    }
  ]
}
```

The error response includes the parameter location, name, and an array of Zod validation issues with detailed error information for each validation failure.

## Interactive Docs

The body schema will be included in your OpenAPI specification and displayed in the interactive API documentation:

![Docs Post Request](/docspostreq.jpg)

## Type Safety

Body arguments are typed. In your editor, on your handler function you will get type resolution and completion with their inferred schema type.

```ts
import { Body } from "cerces" // [!code focus]
import { z } from "zod"

app.post("/items", {
    parameters: {
        item: Body(z.object({ // [!code focus:5]
			name: z.string(),
			price: z.number().min(0),
			description: z.string(),
		})),
    },
    handle: ({ item }) => { // [!code focus:3]
        // item: { name: string; price: number; description: string }
        item.name // autocompletes
        return item
    },
})
```
