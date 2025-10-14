import { z } from "zod"

/**
 * Creates a promise that can be resolved later.
 *
 * @returns A tuple containing a resolve function and a later function.
 * The resolve function can be called to resolve the promise,
 * and the later function can be used to register a callback chaining off the promise.
 */
export function createResolveLater<T = Response>(): [
    (res: T) => void,
    (fn: (v: T) => void) => void,
] {
    let resolve!: (res: T) => void
    const promise = new Promise<T>((r) => (resolve = r))
    const later = (fn: (v: T) => void) => {
        promise.then(fn)
        return
    }
    return [resolve, later]
}

/**
 * Creates a partial object by merging the base object with the final object.
 * @param base The base object to merge with.
 * @returns The partial merger function.
 */
export function createObjectPartial<T1 extends Record<any, any>>(base: T1) {
    return <T2 extends Record<any, any>>(final: T2): T1 & T2 => ({ ...base, ...final })
}

/**
 * Fixes the slashes in a path string.
 * Cases handled:
 * - Ensures the path starts with a single leading slash.
 * - Removes any trailing slashes (unless the path is just `"/"`).
 * - Collapses multiple leading slashes into a single slash.
 *
 * @param path The path to fix slashes for.
 * @returns The fixed path with consistent slashes.
 */
export function fixPathSlashes(path: string): string {
    if (path.length == 0 || path == "/") return "/"
    if (path[0] !== "/") path = "/" + path
    if (path.startsWith("//")) path = path.slice(1)
    if (path[path.length - 1] === "/") path = path.slice(0, -1)
    return path
}

/**
 * Converts URL search parameters to a record of query parameters.
 * @param searchParams The URL search parameters to convert.
 * @returns A record of query parameters.
 */
export function searchParamsToQueries(searchParams: URLSearchParams): Record<string, string[]> {
    const queries: Record<string, string[]> = {}
    for (const [key, value] of searchParams.entries()) {
        queries[key] ||= []
        queries[key].push(value)
    }
    return queries
}

/**
 * Unwraps a Zod type if it has an `unwrap` method.
 * This is useful for extracting the inner type from wrapper types like `ZodOptional` or `ZodNullable`.
 *
 * @param type The Zod type to unwrap.
 * @returns The unwrapped Zod type, or `undefined` if it cannot be unwrapped.
 */
export function unsafeZodUnwrap<T extends z.ZodType>(type: T): z.ZodType | undefined {
    if ("unwrap" in type && typeof (type as any).unwrap === "function") {
        return (type as any).unwrap()
    }
    return undefined
}
