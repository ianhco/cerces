# CORS (Cross-Origin Resource Sharing)

[CORS or "Cross-Origin Resource Sharing"](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS) refers to the situations when a frontend running in a browser has JavaScript code that communicates with a backend, and the backend is in a different "origin" than the frontend.

::: tip Same-Domain Deployment
If your project consists of frontend and backend parts, you can deploy both under the same domain to avoid CORS entirely. Here's how:

1. Deploy your frontend on `example.com`
2. Deploy your backend API on `example.com/api/*` 
3. Configure your Cerces app with `rootPath: "/api"`

Now frontend and backend communicate under the same domain. If you still need CORS for development or third-party access, continue reading.
:::

## CORS Middleware

**Cerces** provides built-in middleware for CORS.

```ts
import { createCORSMiddleware } from "cerces/cors" // [!code focus]

const app = new App({
	middleware: [ // [!code focus:5]
		createCORSMiddleware({
            origin: ["http://localhost:8080", "https://example.com"]
        }),
	]
})
```

## Configuration Options

| Name | Type | Description |
| :------ | :------ | :------ |
| `origin` | `string` \| `string[]` \| `Function` | Allowed origins for CORS requests |
| `allowMethods` | `string[]` | HTTP methods to allow (defaults to common methods) |
| `allowHeaders` | `string[]` | Headers that can be included in requests |
| `maxAge` | `number` | How long browsers can cache preflight responses |
| `credentials` | `boolean` | Whether to include credentials in CORS requests |
| `exposeHeaders` | `string[]` | Headers that browsers can access from responses |

## How the Middleware Works

The CORS middleware intercepts incoming requests and automatically adds the necessary CORS headers to responses. It handles both simple requests and preflight requests (OPTIONS requests sent by browsers before certain cross-origin requests).

### Key Features

- **Origin Validation**: Checks if the request's origin is allowed based on the `origin` configuration. Supports wildcards (`*`), specific origins, or custom functions for dynamic validation.
- **Header Management**: Sets `Access-Control-Allow-Origin`, `Access-Control-Allow-Methods`, `Access-Control-Allow-Headers`, and other headers as needed.
- **Preflight Handling**: Automatically responds to OPTIONS requests with appropriate headers, allowing browsers to proceed with the actual request.
- **Credentials Support**: When enabled, includes `Access-Control-Allow-Credentials` header for requests that include cookies or authorization headers.
- **Caching**: Uses `Access-Control-Max-Age` to let browsers cache preflight responses, reducing unnecessary OPTIONS requests.

## Handling Preflight Requests

Browsers send preflight OPTIONS requests for complex cross-origin requests (e.g., those with custom headers or methods beyond GET/POST/HEAD). The middleware:

1. Detects preflight requests by checking for the `Access-Control-Request-Method` header.
2. Validates the requested method against `allowMethods`.
3. Validates requested headers against `allowHeaders`.
4. Returns a 204 No Content response with appropriate CORS headers.
5. Allows the browser to proceed with the actual request.

## Examples

### Allowing All Origins (Development Only)

```ts
const app = new App({
    middleware: [
        createCORSMiddleware({
            origin: "*", // Allow any origin - use with caution in production
        }),
    ]
})
```

### Dynamic Origin Validation

```ts
const app = new App({
    middleware: [
        createCORSMiddleware({
            origin: (origin: string) => {
                // Allow localhost in development, specific domains in production
                if (origin.includes("localhost")) return origin;
                if (origin === "https://myapp.com") return origin;
                return null; // Reject
            },
            credentials: true,
        }),
    ]
})
```

### Restrictive Configuration for Production

```ts
const app = new App({
    middleware: [
        createCORSMiddleware({
            origin: ["https://myapp.com", "https://admin.myapp.com"],
            allowMethods: ["GET", "POST", "PUT", "DELETE"],
            allowHeaders: ["Content-Type", "Authorization"],
            credentials: true,
            maxAge: 86400, // Cache preflight for 24 hours
        }),
    ]
})
```

### Exposing Custom Headers

```ts
const app = new App({
    middleware: [
        createCORSMiddleware({
            origin: "https://myapp.com",
            exposeHeaders: ["X-Custom-Header", "X-Rate-Limit"],
        }),
    ]
})
```

## Common Pitfalls

- **Wildcard Origin with Credentials**: Using `origin: "*"` with `credentials: true` is invalid and will cause browser errors. Choose specific origins when credentials are needed.
- **Missing Vary Header**: The middleware automatically adds `Vary: Origin` when origins are restricted, ensuring proper caching behavior.
- **Preflight Failures**: Ensure `allowMethods` and `allowHeaders` include all methods and headers your API uses. Missing ones will cause preflight requests to fail.
- **Case Sensitivity**: HTTP headers are case-insensitive, but ensure consistency in your configuration.
- **Browser Caching**: Use `maxAge` to control how long browsers cache preflight responses, but be aware that clearing browser cache may be needed during development.

## Testing CORS

The middleware includes comprehensive tests covering:

- Origin validation for allowed and disallowed origins
- Preflight request handling
- Header setting for various configurations
- Edge cases like missing origins or invalid requests

To test CORS in your application:

1. Use browser developer tools to inspect CORS headers in responses.
2. Test with tools like `curl` for simple requests:
   ```bash
   curl -H "Origin: https://example.com" -v https://your-api.com/endpoint
   ```
3. For preflight testing:
   ```bash
   curl -X OPTIONS -H "Origin: https://example.com" -H "Access-Control-Request-Method: POST" -v https://your-api.com/endpoint
   ```
4. Verify that credentials work by including cookies or authorization headers in requests.

Remember to test both allowed and disallowed origins to ensure proper security.
