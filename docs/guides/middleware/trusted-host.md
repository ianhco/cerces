# Trusted Host

The **Trusted Host Middleware** protects your application against [HTTP Host Header attacks](https://www.acunetix.com/vulnerabilities/web/http-host-header-attack) by ensuring that incoming requests have a valid and expected `Host` header.

HTTP Host Header attacks occur when an attacker manipulates the `Host` header to bypass security controls, perform cache poisoning, or access internal services. This middleware validates that the `Host` header matches a list of allowed host patterns before processing the request.

## Basic Usage

```ts
import { createTrustedHostMiddleware } from "cerces/trusted-host" // [!code focus]

const app = new App({
	middleware: [ // [!code focus:6]
		createTrustedHostMiddleware([
            "example.com",
            "*.example.com"
        ]),
	]
})
```

## Host Pattern Matching

The middleware supports flexible host pattern matching:

- **Exact match**: `"example.com"` matches only `example.com`
- **Wildcard subdomains**: `"*.example.com"` matches `sub.example.com`, `api.example.com`, etc.
- **Multi-level wildcards**: `"*.example.com"` also matches `a.b.example.com`
- **Allow all**: `"*"` allows any host (not recommended for production)

::: warning About Ports
Ports are automatically stripped from the `Host` header during validation to comply with the HTTP specification. For example, `example.com:8080` is treated as `example.com`. Therefore, **do not include port numbers** in your allowed host patterns (as they will **never** match any requests).
:::

## Configuration

The `createTrustedHostMiddleware` function accepts an array of allowed host patterns:

```ts
createTrustedHostMiddleware([
    "example.com",           // Exact domain
    "*.example.com",         // Any subdomain
    "api.external.com",      // Specific subdomain
    "localhost",             // For development
])
```

## Example Scenarios

### Production Setup
```ts
createTrustedHostMiddleware([
    "myapp.com",
    "*.myapp.com",
    "api.myapp.com"
])
```

### Development Setup
```ts
createTrustedHostMiddleware([
    "localhost",
    "127.0.0.1",
    "*.local"
])
```

### Multi-tenant Application
```ts
createTrustedHostMiddleware([
    "tenant1.myapp.com",
    "tenant2.myapp.com",
    "*.customer-domain.com"
])
```