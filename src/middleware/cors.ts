import { Middleware } from "../core"

/**
 * Creates a middleware that handles CORS (Cross-Origin Resource Sharing) for incoming requests.
 * It sets appropriate CORS headers based on the provided options and handles preflight requests.
 *
 * @param options Configuration options for CORS handling.
 * @returns A Middleware instance that manages CORS for incoming requests.
 */
export const createCORSMiddleware = (options?: {
    origin: string | string[] | ((origin: string) => string | undefined | null)
    allowMethods?: string[]
    allowHeaders?: string[]
    maxAge?: number
    credentials?: boolean
    exposeHeaders?: string[]
}) => {
    const defaults: typeof options = {
        origin: "*",
        allowMethods: ["GET", "HEAD", "PUT", "POST", "DELETE", "PATCH"],
        allowHeaders: [],
        exposeHeaders: [],
    }
    const opts = {
        ...defaults,
        ...options,
    }

    const findAllowOrigin = ((optsOrigin) => {
        if (typeof optsOrigin === "string") {
            return () => optsOrigin
        } else if (typeof optsOrigin === "function") {
            return optsOrigin
        } else {
            return (origin: string) => (optsOrigin.includes(origin) ? origin : optsOrigin[0])
        }
    })(opts.origin)

    return new Middleware({
        name: "CORSMiddleware",
        handle: async ({ req }, next) => {
            const resHeaders = new Headers()

            const allowOrigin = findAllowOrigin(req.headers.get("origin") ?? "")
            if (allowOrigin) {
                resHeaders.set("Access-Control-Allow-Origin", allowOrigin)
            }

            // Suppose the server sends a response with an Access-Control-Allow-Origin value with an explicit origin (rather than the "*" wildcard).
            // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Allow-Origin
            if (opts.origin !== "*") {
                resHeaders.set("Vary", "Origin")
            }

            if (opts.credentials) {
                resHeaders.set("Access-Control-Allow-Credentials", "true")
            }

            if (opts.exposeHeaders?.length) {
                resHeaders.set("Access-Control-Expose-Headers", opts.exposeHeaders.join(", "))
            }

            let isCorsPreflightRequest = false
            if (req.method === "OPTIONS" && req.headers.has("Access-Control-Request-Method")) {
                isCorsPreflightRequest = true
                if (opts.maxAge != null) {
                    resHeaders.set("Access-Control-Max-Age", opts.maxAge.toString())
                }
            }

            const response = await next()

            if (isCorsPreflightRequest) {
                const availableMethods = (
                    response.headers.get("Allow")?.split(/\s*,\s*/) || []
                ).filter((method) => opts.allowMethods?.includes(method))
                if (opts.allowMethods?.length) {
                    resHeaders.set("Access-Control-Allow-Methods", availableMethods.join(", "))
                }

                if (opts.allowHeaders?.length) {
                    resHeaders.set("Access-Control-Allow-Headers", opts.allowHeaders.join(", "))
                    resHeaders.append("Vary", "Access-Control-Request-Headers")
                }

                resHeaders.delete("Content-Length")
                resHeaders.delete("Content-Type")

                return new Response(null, {
                    headers: resHeaders,
                    status: 204,
                })
            }

            for (const [key, value] of resHeaders.entries()) response.headers.set(key, value)
            return response
        },
    })
}
