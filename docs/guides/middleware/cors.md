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
