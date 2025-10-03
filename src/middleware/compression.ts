import { Middleware } from "src/core"

type CompressionFormat = "deflate" | "deflate-raw" | "gzip"

export type { CompressionFormat }

let streamMod: any
let zlibMod: any

function getStream() {
    if (!streamMod) {
        streamMod = require("stream")
    }
    return streamMod
}

function getZlib() {
    if (!zlibMod) {
        zlibMod = require("zlib")
    }
    return zlibMod
}

/** Polyfill for CompressionStream using zlib if runtime does not have built-in support */
export class CompressionStream implements ReadableWritablePair<Uint8Array, BufferSource> {
    readable: ReadableStream<Uint8Array>
    writable: WritableStream<BufferSource>
    constructor(format: CompressionFormat) {
        if (typeof globalThis.CompressionStream !== "undefined") {
            const stream = new globalThis.CompressionStream(format)
            this.readable = stream.readable
            this.writable = stream.writable
        } else {
            const { Readable, Writable } = getStream()
            const zlib = getZlib()
            const compression = {
                deflate: zlib.createDeflate,
                "deflate-raw": zlib.createDeflateRaw,
                gzip: zlib.createGzip,
            }
            const handle = compression[format]()
            this.readable = Readable.toWeb(handle) as ReadableStream<Uint8Array>
            this.writable = Writable.toWeb(handle) as WritableStream<BufferSource>
        }
    }
}

/** Polyfill for DecompressionStream using zlib if runtime does not have built-in support */
export class DecompressionStream implements ReadableWritablePair<Uint8Array, BufferSource> {
    readable: ReadableStream<Uint8Array>
    writable: WritableStream<BufferSource>
    constructor(format: CompressionFormat) {
        if (typeof globalThis.DecompressionStream !== "undefined") {
            const stream = new globalThis.DecompressionStream(format)
            this.readable = stream.readable
            this.writable = stream.writable
        } else {
            const { Readable, Writable } = getStream()
            const zlib = getZlib()
            const decompression = {
                deflate: zlib.createInflate,
                "deflate-raw": zlib.createInflateRaw,
                gzip: zlib.createGunzip,
            }
            const handle = decompression[format]()
            this.readable = Readable.toWeb(handle) as ReadableStream<Uint8Array>
            this.writable = Writable.toWeb(handle) as WritableStream<BufferSource>
        }
    }
}

/**
 * Creates a middleware that compresses HTTP responses using the specified format.
 * It checks the "Accept-Encoding" header of the incoming request to determine
 * if the client supports the specified compression format.
 *
 * @param format The compression format to use. Supported values are 'deflate', 'deflate-raw', and 'gzip'.
 * @returns A Middleware instance that applies the specified compression to responses.
 */
export const createCompressionMiddleware = (format: CompressionFormat) => {
    return new Middleware({
        name: "CompressionMiddleware",
        handle: async ({ req }, next) => {
            let response = await next()
            const accepted = req.headers.get("Accept-Encoding")
            if (!accepted?.includes(format) || !response.body) {
                return response
            }
            const stream = new CompressionStream(format)
            response = new Response(response.body.pipeThrough(stream), response)
            response.headers.delete("Content-Length")
            response.headers.set("Content-Encoding", format)
            return response
        },
    })
}
