# Route Parameters

You can declare "parameters" or "variables" under the `parameters` key on route declaration. Parameter declaration involves parameter constructors and Zod schemas for validation and type safety.

## Path Parameters

Path parameters are extracted from the URL path and are required for routes that use dynamic segments. They must match the route pattern exactly.

```ts
import { Path } from "cerces" // [!code focus]
import { z } from "zod"

app.get("/items/{itemId}", { // [!code focus:5]
    parameters: {
        itemId: Path(z.string()),
    },
    handle: ({ itemId }) => {
        return { itemId }
    },
})
```

Path parameters require matching route path using `{}` annotation. If your path does not satisfy the declaration, **it will throw a type error**.

```ts
"/items/{itemId}" // ✅ Valid
"/items/itemId"   // ❌ Missing braces
```

## Query Parameters

Query parameters are extracted from the URL query string and are commonly used for optional filtering, pagination, and search functionality.

```ts
import { Query } from "cerces" // [!code focus]
import { z } from "zod"

app.get("/items", {
    parameters: {   // [!code focus:6]
        page: Query(z.number().default(1)),
        limit: Query(z.number().default(10)),
        search: Query(z.string().optional()),
    },
    handle: ({ page, limit, search }) => {
        return { page, limit, search }
    },
})
```

Query parameters can be declared with array schemas, which accept multiple query values for the same key and return them in an array.

```ts
selectedItems: Query(z.array(z.number())) // or
selectedItems: Query(z.number().array())
```

## Header Parameters

Header parameters are extracted from HTTP request headers and are useful for authentication, content negotiation, and custom metadata.

```ts
import { Header } from "cerces" // [!code focus]
import { z } from "zod"

app.get("/protected", {
    parameters: { // [!code focus:5]
        authorization: Header(z.string()),
        contentType: Header(z.string().optional()),
    },
    handle: ({ authorization, contentType }) => {
        return { authorized: true, contentType }
    },
})
```

Header parameters automatically replace the `_` character with `-`, preventing syntax errors when accessing headers such as `X-Rate-Limit` in the handler.

```ts
X_Rate_Limit: Header(z.string())
```

This will register a header parameter using the key `X-Rate-Limit` both in the OpenAPI document and request validation.

:::info Schema Exclusion for Browser Enforced Headers
Some headers are ignored, and not sent by the browser due to security or protocol enforcement. These headers under normal circumstances should be excluded from the OpenAPI parameters schema, **this does not affect route implementations**. By default, Cerces sets `includeInSchema: false` to the following list of headers:
```ts
[
    "accept-encoding",
    "accept-language",
    "accept",
    "authorization",
    "connection",
    "content-length",
    "content-type",
    "cookie",
    "host",
    "if-modified-since",
    "if-none-match",
    "keep-alive",
    "origin",
    "proxy-authenticate",
    "proxy-authorization",
    "referer",
    "set-cookie",
    "transfer-encoding",
    "upgrade",
    "user-agent",
    "cf-connecting-ip",
    "cf-ipcountry",
    "cf-ray",
    "cf-visitor",
    "x-forwarded-for",
    "x-real-ip",
    "cf-pseudo-ipv4",
    "cf-connecting-ipv6",
    "cdn-loop",
    "cf-worker",
]
```
You may force these headers into the OpenAPI schema by manually setting `includeInSchema: true`.

Some of these headers may cause conflict in Swagger, as they are controlled by a different UI in Swagger (e.g. `Accept` is controlled by a dropdown menu in the response part of the UI), therefore, they are recommended to be excluded.
:::

## Cookie Parameters

Cookie parameters are extracted from the request's `Cookie` header and are useful for session management and user preferences.

```ts
import { Cookie } from "cerces" // [!code focus]
import { z } from "zod"

app.get("/dashboard", {
    parameters: { // [!code focus:5]
        sessionId: Cookie(z.string()),
        theme: Cookie(z.enum(["light", "dark"]).default("light")),
    },
    handle: ({ sessionId, theme }) => {
        return { sessionId, theme }
    },
})
```

:::warning Cookies in Swagger
At the moment, sending cookies in Swagger is [not possible](https://swagger.io/docs/specification/v3_0/authentication/cookie-authentication/). Making requests to the example above in the interactive docs, cookie parameters will always return `undefined`.
:::

## Body Parameters

Body parameters are extracted from the request body and are commonly used for `POST`, `PUT`, `PATCH`, and `DELETE` requests. For detailed information about body parameters, see [Request Body](./request-body.md).

## Depends Parameters

Dependency parameters allow you to inject reusable logic and shared parameters into your routes. They are declared using the `Depends` parameter constructor and reference a `Dependency` instance.

```ts
import { Dependency, Query, Depends } from "cerces" // [!code focus]
import { z } from "zod"

const paginationDep = new Dependency({ // [!code focus:7]
    parameters: {
        page: Query(z.number().default(1)),
        limit: Query(z.number().default(10)),
    },
    handle: ({ page, limit }) => ({ page, limit }),
})

app.get("/items", {
    parameters: {
        pagination: Depends(paginationDep), // [!code focus]
    },
    handle: ({ pagination }) => { // [!code focus]
        return { items: [], ...pagination }
    },
})
```

Dependencies can handle authentication, data validation, database connections, and other cross-cutting concerns. For comprehensive information about dependencies, see [Dependencies](./dependencies.md).

## App-Level Parameters

You can declare parameters at the App level that will be available to all routes under that app. This is useful for global parameters like authentication tokens or API versions.

```ts
import { App, Header } from "cerces"
import { z } from "zod"

const app = new App({ // [!code focus:5]
    parameters: {
        apiVersion: Header(z.string().default("v1")),
        authorization: Header(z.string().optional()),
    },
})

app.get("/users", {
    parameters: {
        userId: Path(z.string()),
    },
    handle: ({ apiVersion, authorization, userId }) => { // [!code focus]
        return { userId, apiVersion, authorized: !!authorization }
    },
})
```

:::info Router Organization
For larger applications, you may want to organize routes into smaller routers, router-level parameters are also supported. This provides better separation of concerns and modularity. See [Bigger Apps](./bigger-apps.md) for information on using routers.
:::

## Complex Schemas

Sometimes, you may want schemas that are more complex than simple data types, here are some examples:

```ts
z.string().regex(/^\S*$/g) // regex no spaces
z.number().int().min(0) // positive integer
z.enum(["apple", "orange", "blueberry"]) // enums
z.nativeEnum({ a: 2, b: 3 }) // native enums
```

Optional and nullable schemas are different:

```ts
z.string().optional() // not required, can be undefined
z.string().nullable() // required! can be null
```

You can also provide a default value:

```ts
z.string().default("default") // returns "default" if not provided
```

For even more complex schemas, to the point that refinement or transformation is needed, you are required to manually declare the OpenAPI type if this is the case:

```ts
z.string().refine(/* ... */).openapi({ type: 'number' })

const prefix = "user_"
z.templateLiteral([z.literal(prefix), z.string()])
    .openapi({ type: "string", pattern: `^${prefix}[a-zA-Z0-9]+$` })
```

## Alternative Name

You can declare parameters that are registered on an alternative name different from your parameter key in code.

```ts
page: Query(z.number(), { altName: "pageNum" })
```

This declares a `pageNum` query parameter and the value is assigned to the `page` argument on your handler.

::: warning Path Parameters
Path parameters do not support `altName` because the name has to match the delimited route path exactly.
:::

## Data Coercion

Data coercion is the process of automatic or implicit conversion of values from one data type to another. This is required for basic parameters because all incoming values are strings, these have to be converted to the correct data type before validation.

By default, a coercion `preprocessor` function is used if it detects that the schema meets coercion requirements, examples of qualified schemas include but not limited to:
-   `ZodNumber`
-   `ZodBoolean`
-   `ZodNativeEnum`
-   `ZodArray<ZodNumber>`
-   `ZodArray<ZodBoolean>`
-   `ZodArray<ZodNativeEnum>`
-   `ZodOptional<ZodNumber>`
-   `ZodOptional<ZodBoolean>`
-   `ZodOptional<ZodNativeEnum>`
-   `ZodDefault<ZodNumber>`
-   `ZodDefault<ZodBoolean>`
-   `ZodDefault<ZodNativeEnum>`

The coercion is determined using `isJsonCoercible(schema)` function from the `cerces` module.

You can manually set a data `preprocessor` for a parameter:

```ts
Query(z.any(), { preprocessor: /*...*/ })
```

## Other Options

You can provide a parameter description for the OpenAPI schemas:

```ts
page: Query(z.number(), { description: "Page Number" })
```

Or exclude it from the OpenAPI schemas:

```ts
page: Query(z.number(), { includeInSchema: false })
```

:::warning Schema Exclusion
Excluding parameters from OpenAPI schemas will also remove it from the Swagger interactive docs, which may cause issues with interactive requests made via Swagger.
:::

## Type Safety

All handler arguments are typed. In your editor, on your handler function you will get type resolution and code completion with their inferred schema type.

```ts
app.get("/items/{itemId}", { // [!code focus]
    parameters: {
        itemId: Path(z.string()), // [!code focus]
    },
    handle: ({ itemId }) => { // [!code focus:2]
        // itemId: string
        return { itemId }
    },
})
```

Type safety is also applied when using `Depends` with dependencies that declare parameters:

```ts
import { Dependency, Query, Depends } from "cerces" // [!code focus]
import { z } from "zod"

const requireHelloQ = new Dependency({ // [!code focus:8]
    parameters: {
        q: Query(z.string()),
    },
    handle: ({ q }) => {
        return "Hello " + q
    },
})

app.get("/foo", {
    parameters: {
        helloQ: Depends(requireHelloQ), // [!code focus]
    },
    handle: ({ helloQ, q }) => { // [!code focus:2]
        // helloQ: string; q: string;
        return { message: helloQ }
    },
})
```

For more information on dependencies, see [Dependencies](./dependencies.md).

## Zod OpenAPI

In rare cases, you may need to manually modify the generated OpenAPI schemas from zod schemas. Thanks to the `"@asteasolutions/zod-to-openapi"` package, a method called `openapi` is injected to all zod types. Available `.openapi()` options:

```ts
{
    discriminator?: DiscriminatorObject;
    readOnly?: boolean;
    writeOnly?: boolean;
    xml?: XmlObject;
    externalDocs?: ExternalDocumentationObject;
    example?: any;
    examples?: any[];
    deprecated?: boolean;
    type?: SchemaObjectType | SchemaObjectType[];
    format?: 'int32' | 'int64' | 'float' | 'double' | 'byte' | 'binary' | 'date' | 'date-time' | 'password' | string;
    allOf?: (SchemaObject | ReferenceObject)[];
    oneOf?: (SchemaObject | ReferenceObject)[];
    anyOf?: (SchemaObject | ReferenceObject)[];
    not?: SchemaObject | ReferenceObject;
    items?: SchemaObject | ReferenceObject;
    properties?: {
        [propertyName: string]: SchemaObject | ReferenceObject;
    };
    additionalProperties?: SchemaObject | ReferenceObject | boolean;
    propertyNames?: SchemaObject | ReferenceObject;
    description?: string;
    default?: any;
    title?: string;
    multipleOf?: number;
    maximum?: number;
    const?: any;
    exclusiveMaximum?: number;
    minimum?: number;
    exclusiveMinimum?: number;
    maxLength?: number;
    minLength?: number;
    pattern?: string;
    maxItems?: number;
    minItems?: number;
    uniqueItems?: boolean;
    maxProperties?: number;
    minProperties?: number;
    required?: string[];
    enum?: any[];
    prefixItems?: (SchemaObject | ReferenceObject)[];
    contentMediaType?: string;
    contentEncoding?: string;
}
```
