# Compression

The **Compression Middleware** automatically compresses HTTP responses to reduce bandwidth usage and improve performance. It supports gzip, deflate, and raw deflate compression formats, automatically detecting client support via the `Accept-Encoding` header.

Response compression can significantly reduce data transfer sizes (often 70-90% for text-based content), leading to faster page loads and reduced server bandwidth costs.

## Basic Usage

```ts
import { createCompressionMiddleware } from "cerces/compression" // [!code focus]

const app = new App({
	middleware: [ // [!code focus:3]
		createCompressionMiddleware("gzip"),
	]
})
```

## Compression Formats

The middleware supports three compression formats:

| Format | Description | Use Case |
| :------ | :---------- | :------- |
| `"gzip"` | Gzip compression (most common) | General web content, best compression ratio |
| `"deflate"` | DEFLATE compression | Legacy support, slightly faster than gzip |
| `"deflate-raw"` | Raw DEFLATE (no headers) | Specialized use cases requiring raw compressed data |

## Configuration

The `createCompressionMiddleware` function accepts a single parameter:

```ts
createCompressionMiddleware(format: "gzip" | "deflate" | "deflate-raw")
```

## Performance Considerations

- **CPU Usage**: Compression adds server processing overhead
- **Memory**: Minimal memory impact with streaming compression
- **Cache Compatibility**: Works with HTTP caching (ETags, Last-Modified)
- **Content Types**: Most effective for text-based content (HTML, JSON, CSS, JS)

## Browser Support

Modern browsers automatically send `Accept-Encoding: gzip, deflate` and decompress responses transparently. The middleware ensures compatibility across all HTTP clients.

## Debugging

To verify compression is working:
- Check response headers for `Content-Encoding: gzip`
- Monitor network tab in browser dev tools
- Compare response sizes with/without middleware

The middleware includes built-in polyfills for environments without native `CompressionStream` support (e.g. Bun, older Node.js versions), ensuring consistent behavior across runtimes.
