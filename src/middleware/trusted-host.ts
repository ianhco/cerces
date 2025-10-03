import { Middleware } from "../core"
import { JSONResponse } from "../responses"

/** Creates a host matcher function based on the provided pattern. */
export function createHostMatcher(pattern: string): (host: string) => boolean {
    if (pattern === "*") {
        return () => true // Allows all hosts
    }
    let regexString = pattern.replace(/\./g, "\\.") // Escape dots
    regexString = regexString.replace(/\*/g, ".*") // Replace * with .*
    const regex = new RegExp(`^${regexString}$`) // Anchor and create RegExp
    return (host: string) => regex.test(host)
}

/**
 * Creates a middleware that restricts access based on the "Host" header of incoming requests.
 * It checks if the host matches any of the allowed host patterns.
 * @param allowedHosts An array of allowed host patterns. Patterns can include wildcards (*).
 * @returns A Middleware instance that enforces the trusted host policy.
 */
export function createTrustedHostMiddleware(allowedHosts: [string, ...string[]]): Middleware {
    const matchers = allowedHosts.map((pattern) => {
        const matcher = createHostMatcher(pattern)
        return (host: string) => matcher(host)
    })

    return new Middleware({
        name: "TrustedHostMiddleware",
        handle: async ({ req }, next) => {
            const hostHeader = req.headers.get("host") || ""
            const host = hostHeader.split(":")[0] // Strip port if present
            if (!host) {
                return new JSONResponse({ detail: "Host header is missing" }, { status: 400 })
            }

            const isAllowed = matchers.some((matcher) => matcher(host))
            if (isAllowed) {
                return await next()
            } else {
                return new JSONResponse({ detail: "Forbidden: Host not allowed" }, { status: 403 })
            }
        },
    })
}
