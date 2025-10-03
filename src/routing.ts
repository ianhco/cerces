import { z } from "zod"
import type { ResponseConfig, RouteConfig, ZodRequestBody } from "@asteasolutions/zod-to-openapi"
import type { SecurityRequirementObject } from "openapi3-ts/oas31"
import type {
    BodyParameter,
    GenericRouteParameters,
    DependsParameter,
    HTTPMethod,
    HTTPMethodLower,
    ResponseClass,
    RouteHandler,
    RouteParameters,
    NeverMap,
    ImplicitParameters,
} from "./types"
import { Middleware } from "./core"
import { JSONResponse } from "./responses"
import { fixPathSlashes } from "./helpers"

/** Headers excluded from OpenAPI schema by default. */
const DEFAULT_SCHEMA_EXCLUDED_HEADERS = new Set([
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
])

/** Generate a default summary string for a route based on its method and path. */
export function generateRouteSummary(method: HTTPMethod, path: string): string {
    const methodToAction = {
        GET: "Read",
        POST: "Create",
        PUT: "Update",
        PATCH: "Modify",
        DELETE: "Delete",
        HEAD: "Head",
        OPTIONS: "Check",
        TRACE: "Trace",
    }
    return [
        methodToAction[method],
        ...path
            .split("/")
            .map((s) => s && s[0].toUpperCase() + s.slice(1))
            .filter((s) => s && !(s.startsWith("{") && s.endsWith("}"))),
    ].join(" ")
}

/**
 * Represents a route declaration in the routing system.
 *
 * This class encapsulates all the configuration and metadata for a single HTTP route,
 * including its method, path, handler, parameters, responses, and OpenAPI schema information.
 *
 * @template R The response type returned by the route handler.
 * @template Ps The route parameters type specific to this route.
 * @template Ps0 The route parameters type inherited from parent routers or apps.
 */
export class Route<
    R,
    Ps extends GenericRouteParameters<Ps> = {},
    Ps0 extends GenericRouteParameters<Ps0> = {},
> {
    method: HTTPMethod
    path: string
    name?: string
    tags: string[]
    summary: string
    description: string
    deprecated: boolean
    responses: Record<number, ResponseConfig>
    security?: SecurityRequirementObject[]
    statusCode: number
    includeInSchema: boolean
    responseClass: ResponseClass
    middleware: Middleware[]
    parameters: Ps
    handle: RouteHandler<R, Ps & Ps0>

    constructor(init: {
        method: HTTPMethod
        path: string
        name?: string
        tags?: string[]
        summary?: string
        description?: string
        deprecated?: boolean
        responses?: Record<number, ResponseConfig>
        security?: SecurityRequirementObject[]
        includeInSchema?: boolean
        statusCode?: number
        responseClass?: ResponseClass
        middleware?: Middleware[]
        parameters?: Ps & NeverMap<ImplicitParameters<Ps & Ps0>> & NeverMap<Ps0>
        handle: RouteHandler<R, Ps & Ps0>
    }) {
        this.method = init.method
        this.path = fixPathSlashes(init.path)
        this.name = init.name
        this.tags = init.tags ?? []
        this.summary = init.summary ?? generateRouteSummary(this.method, this.path)
        this.description = init.description ?? ""
        this.deprecated = init.deprecated ?? false
        this.responses = init.responses ?? {}
        this.security = init.security
        this.includeInSchema = init.includeInSchema ?? true
        this.statusCode = init.statusCode ?? 200
        this.responseClass = init.responseClass ?? JSONResponse
        this.middleware = init.middleware ?? []
        this.parameters = init.parameters ?? ({} as Ps)
        this.handle = init.handle
    }

    openapi(): RouteConfig {
        const rawParameters: RouteParameters = {}
        const extractRawParameters = (parameters: RouteParameters) => {
            for (const [name, parameter] of Object.entries(parameters)) {
                if (parameter.location == "@depends") {
                    extractRawParameters(
                        (parameter as DependsParameter<any, any>).dependency.parameters
                    )
                } else {
                    rawParameters[name] = parameter
                }
            }
        }
        extractRawParameters(this.parameters)

        let bodyParameter: BodyParameter<z.ZodType> | undefined = undefined
        const paramSchemas: Record<string, Record<string, z.ZodType>> = {
            path: {},
            query: {},
            header: {},
            cookie: {},
        }
        for (const [name, parameter] of Object.entries(rawParameters)) {
            if (parameter.options.includeInSchema === undefined) {
                if (
                    parameter.location == "header" &&
                    DEFAULT_SCHEMA_EXCLUDED_HEADERS.has(name.replace(/_/g, "-").toLowerCase())
                ) {
                    parameter.options.includeInSchema = false
                } else {
                    parameter.options.includeInSchema = true
                }
            }
            if (!parameter.options.includeInSchema) {
                continue
            } else if (parameter.location == "body") {
                bodyParameter = parameter as BodyParameter<z.ZodType>
            } else if (parameter.location == "header") {
                paramSchemas[parameter.location][
                    parameter.options.altName ?? name.replace(/_/g, "-")
                ] = parameter.schema!
            } else {
                paramSchemas[parameter.location][parameter.options.altName ?? name] =
                    parameter.schema!
            }
        }
        let body: ZodRequestBody | undefined = undefined
        if (bodyParameter) {
            if (bodyParameter.schemaOr) {
                body = {
                    description: bodyParameter.options.description,
                    content: {
                        [bodyParameter.options?.mediaType]: {
                            schema:
                                bodyParameter.schemaOr === String
                                    ? { type: "string" }
                                    : { type: "string", format: "binary" },
                        },
                    },
                }
            } else {
                body = {
                    description: bodyParameter.options.description,
                    content: {
                        [bodyParameter.options?.mediaType]: {
                            schema: bodyParameter.schema as z.ZodType<unknown>,
                        },
                    },
                }
            }
        }
        return {
            method: this.method.toLowerCase() as HTTPMethodLower,
            path: this.path,
            tags: this.tags,
            summary: this.summary,
            description: this.description,
            security: this.security,
            deprecated: this.deprecated,
            request: {
                body: body,
                params: z.object(paramSchemas.path),
                query: z.object(paramSchemas.query),
                headers: z.object(paramSchemas.header),
                cookies: z.object(paramSchemas.cookie),
            },
            responses: this.responses,
        }
    }
}

/**
 * Represents a node in the routing tree structure.
 *
 * Each node corresponds to a segment of the URL path and can contain child nodes,
 * associated routes for different HTTP methods, middleware, and parameter names for dynamic segments.
 */
export class RouteNode {
    private inner: Record<string, RouteNode>
    name: string
    routes: Record<string, Route<any, any, any>>
    middleware: Middleware[]
    paramNames: string[]

    constructor(name: string) {
        this.inner = {}
        this.name = name
        this.routes = {}
        this.paramNames = []
        this.middleware = []
    }

    touch(node: string): RouteNode {
        this.inner[node] ||= new RouteNode(node)
        return this.inner[node]!
    }

    match(node: string): RouteNode | undefined {
        return this.inner[node] ?? this.inner["{}"]
    }
}

/**
 * Manages a collection of routes and provides functionality to match incoming HTTP requests to routes.
 *
 * This class builds a tree structure for efficient route matching and supports middleware inheritance.
 */
export class RouteMatcher {
    routes: Route<any, any, any>[]
    tree: RouteNode

    constructor() {
        this.routes = []
        this.tree = new RouteNode("")
    }

    *[Symbol.iterator](): IterableIterator<Route<any, any, any>> {
        for (const route of this.routes) {
            yield route
        }
    }

    get length(): number {
        return this.routes.length
    }

    get(path: string): RouteNode {
        const nodes = fixPathSlashes(path).split("/").slice(1)
        let tree = this.tree
        const paramNames: string[] = []
        for (let [index, node] of nodes.entries()) {
            if (node[0] == "{" && node[node.length - 1] == "}") {
                paramNames.push(node.slice(1, -1))
                node = "{}"
            }
            tree = tree.touch(node)
            if (index == nodes.length - 1) {
                tree.paramNames = paramNames
                return tree
            }
        }
        return tree
    }

    set(path: string | null, values: { middleware?: Middleware[] }): RouteNode {
        let node: RouteNode
        if (path === null) node = this.tree
        else node = this.get(path)
        if (values.middleware) node.middleware = values.middleware
        return node
    }

    push(...routes: Route<any, any, any>[]): number {
        this.routes.push(...routes)
        for (const route of routes) {
            const node = this.get(route.path)
            node.routes[route.method] = route
        }
        return this.length
    }

    match(
        method: string,
        path: string
    ): [Route<any, any, any> | undefined | null, Record<string, string>, Middleware[]] {
        const nodes = fixPathSlashes(path).split("/").slice(1)
        const paramValues: string[] = []
        const middleware: Middleware[] = [...this.tree.middleware]
        let tree = this.tree
        for (const [index, node] of nodes.entries()) {
            let nextMatcher = tree.match(node)
            if (!nextMatcher) return [undefined, {}, middleware]
            tree = nextMatcher
            // push middleware attached to this node
            middleware.push(...tree.middleware)
            if (tree.name == "{}") paramValues.push(node)
            if (index == nodes.length - 1) {
                if (!tree.routes[method]) {
                    if (Object.keys(tree.routes).length == 0) return [undefined, {}, middleware]
                    return [null, { allow: Object.keys(tree.routes).join(", ") }, middleware]
                }
                const params: Record<string, string> = {}
                for (let i = 0; i < tree.paramNames.length; i++) {
                    params[tree.paramNames[i]] = paramValues[i]
                }
                // push middleware attached to this route
                middleware.push(...tree.routes[method].middleware)
                return [tree.routes[method], params, middleware]
            }
        }
        return [undefined, {}, middleware]
    }
}
