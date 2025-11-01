import {
    OpenAPIRegistry,
    OpenApiGeneratorV31,
    type ResponseConfig,
} from "@asteasolutions/zod-to-openapi"
import type {
    ContactObject,
    LicenseObject,
    OpenAPIObject,
    SecurityRequirementObject,
    SecuritySchemeObject,
    ServerObject,
    TagObject,
} from "openapi3-ts/oas31"
import { z } from "zod"

import { createSwaggerHTML, createRedocHTML } from "./docs"
import { createResolveLater, fixPathSlashes, searchParamsToQueries } from "./helpers"
import { parseCookie, resolveArgs, Responds } from "./parameters"
import { JSONResponse, HTMLResponse } from "./responses"
import { Route, RouteMatcher } from "./routing"
import type {
    ArgsOf,
    DependencyHandler,
    DisallowBaseDependencyParameters,
    DisallowBaseParameters,
    DisallowDependencyParameters,
    DisallowRuntimeParameters,
    ErrorHandler,
    FlattenParameters,
    GenericRouteParameters,
    HTTPMethod,
    ImplicitParameters,
    MiddlewareHandler,
    PathStringOf,
    ResponseClass,
    RouteParameters,
    UnboundRoute,
} from "./types"

/**
 * Type extractor for the base route parameters of a `Router` or `App`.
 *
 * @template B The `Router` or `App` type to extract base route parameters from.
 * @returns An empty value carrying the extracted base route parameters types.
 */
export function Base<B extends Router>(): B extends Router<infer PsBase, infer PsThis>
    ? PsBase & PsThis
    : never {
    return {} as B extends Router<infer PsBase, infer PsThis> ? PsBase & PsThis : never
}

export class Dependency<Ps extends GenericRouteParameters<Ps> = {}, R = unknown> {
    name?: string
    useCache: boolean
    parameters: Ps
    handle: DependencyHandler<ArgsOf<Ps>, R>

    constructor(init: {
        name?: string
        useCache?: boolean
        parameters?: Ps &
            DisallowDependencyParameters<ImplicitParameters<Ps>> &
            DisallowRuntimeParameters<Ps>
        handle: DependencyHandler<ArgsOf<Ps>, R>
    }) {
        this.name = init.name
        this.useCache = init.useCache ?? true
        this.parameters = init.parameters ?? ({} as Ps)
        this.handle = init.handle
    }
}

export class Middleware {
    name?: string
    handle: MiddlewareHandler

    constructor(init: { name?: string; handle: MiddlewareHandler }) {
        this.name = init.name
        this.handle = init.handle
    }
}

export class Router<
    PsBase extends GenericRouteParameters<PsBase> = {},
    PsThis extends GenericRouteParameters<PsThis> = {},
> {
    private _base: PsBase
    readonly rootPath: string = "/"
    tags: string[]
    deprecated: boolean
    includeInSchema: boolean
    responses: Record<number, ResponseConfig>
    security?: SecurityRequirementObject[]
    defaultResponseClass: ResponseClass
    parameters: PsThis
    middleware: Middleware[]
    routeMatcher: RouteMatcher

    constructor(init: {
        base: PsBase
        tags?: string[]
        deprecated?: boolean
        includeInSchema?: boolean
        security?: SecurityRequirementObject[]
        responses?: Record<number, ResponseConfig>
        defaultResponseClass?: ResponseClass
        middleware?: Middleware[]
        parameters?: PsThis &
            DisallowDependencyParameters<ImplicitParameters<PsThis>> &
            DisallowBaseDependencyParameters<ImplicitParameters<PsBase>> &
            DisallowBaseParameters<PsBase> &
            DisallowRuntimeParameters<PsThis>
    }) {
        this._base = init.base
        this.tags = init.tags ?? []
        this.deprecated = init.deprecated ?? false
        this.includeInSchema = init.includeInSchema ?? true
        this.defaultResponseClass = init.defaultResponseClass ?? JSONResponse
        this.parameters = init.parameters ?? ({} as PsThis)
        this.middleware = init.middleware ?? []
        this.responses = init.responses ?? {
            422: Responds(
                z.object({
                    detail: z.array(
                        z.object({
                            location: z.string(),
                            name: z.string(),
                            issues: z.array(z.any()),
                        })
                    ),
                }),
                { description: "Validation Error", mediaType: "application/json" }
            ),
        }
        this.security = init.security
        this.routeMatcher = new RouteMatcher()
    }

    get<Ps extends RouteParameters = {}, R = unknown>(
        path: PathStringOf<Omit<FlattenParameters<Ps>, keyof FlattenParameters<PsThis & PsBase>>>,
        unboundRoute: UnboundRoute<PsThis & PsBase, Ps, R>
    ): Route<PsThis & PsBase, Ps, R> {
        return this.route("GET", path, unboundRoute)
    }
    post<Ps extends RouteParameters = {}, R = unknown>(
        path: PathStringOf<Omit<FlattenParameters<Ps>, keyof FlattenParameters<PsThis & PsBase>>>,
        unboundRoute: UnboundRoute<PsThis & PsBase, Ps, R>
    ): Route<PsThis & PsBase, Ps, R> {
        return this.route("POST", path, unboundRoute)
    }
    put<Ps extends RouteParameters = {}, R = unknown>(
        path: PathStringOf<Omit<FlattenParameters<Ps>, keyof FlattenParameters<PsThis & PsBase>>>,
        unboundRoute: UnboundRoute<PsThis & PsBase, Ps, R>
    ): Route<PsThis & PsBase, Ps, R> {
        return this.route("PUT", path, unboundRoute)
    }
    delete<Ps extends RouteParameters = {}, R = unknown>(
        path: PathStringOf<Omit<FlattenParameters<Ps>, keyof FlattenParameters<PsThis & PsBase>>>,
        unboundRoute: UnboundRoute<PsThis & PsBase, Ps, R>
    ): Route<PsThis & PsBase, Ps, R> {
        return this.route("DELETE", path, unboundRoute)
    }
    patch<Ps extends RouteParameters = {}, R = unknown>(
        path: PathStringOf<Omit<FlattenParameters<Ps>, keyof FlattenParameters<PsThis & PsBase>>>,
        unboundRoute: UnboundRoute<PsThis & PsBase, Ps, R>
    ): Route<PsThis & PsBase, Ps, R> {
        return this.route("PATCH", path, unboundRoute)
    }
    head<Ps extends RouteParameters = {}, R = unknown>(
        path: PathStringOf<Omit<FlattenParameters<Ps>, keyof FlattenParameters<PsThis & PsBase>>>,
        unboundRoute: UnboundRoute<PsThis & PsBase, Ps, R>
    ): Route<PsThis & PsBase, Ps, R> {
        return this.route("HEAD", path, unboundRoute)
    }
    trace<Ps extends RouteParameters = {}, R = unknown>(
        path: PathStringOf<Omit<FlattenParameters<Ps>, keyof FlattenParameters<PsThis & PsBase>>>,
        unboundRoute: UnboundRoute<PsThis & PsBase, Ps, R>
    ): Route<PsThis & PsBase, Ps, R> {
        return this.route("TRACE", path, unboundRoute)
    }
    options<Ps extends RouteParameters = {}, R = unknown>(
        path: PathStringOf<Omit<FlattenParameters<Ps>, keyof FlattenParameters<PsThis & PsBase>>>,
        unboundRoute: UnboundRoute<PsThis & PsBase, Ps, R>
    ): Route<PsThis & PsBase, Ps, R> {
        return this.route("OPTIONS", path, unboundRoute)
    }

    route<Ps extends RouteParameters = {}, R = unknown>(
        method: HTTPMethod,
        path: PathStringOf<Omit<FlattenParameters<Ps>, keyof FlattenParameters<PsThis & PsBase>>>,
        unboundRoute: UnboundRoute<PsThis & PsBase, Ps, R>
    ): Route<PsThis & PsBase, Ps, R> {
        const route = new Route<PsThis & PsBase, Ps, R>({
            method: method,
            path: this.rootPath + path,
            deprecated: this.deprecated,
            includeInSchema: this.includeInSchema,
            responseClass: this.defaultResponseClass,
            security: this.security,
            ...unboundRoute,
            tags: [...this.tags, ...(unboundRoute.tags ?? [])],
            responses: {
                ...this.responses,
                ...unboundRoute.responses,
            },
            parameters: {
                ...this.parameters,
                ...unboundRoute.parameters,
            } as any,
        })
        this.routeMatcher.push(route)
        return route
    }

    include<Ps extends RouteParameters>(
        prefix: PathStringOf<Omit<FlattenParameters<Ps>, keyof FlattenParameters<PsThis & PsBase>>>,
        router: Router<PsThis & PsBase, Ps>
    ) {
        for (const route of router.routeMatcher) {
            const includeRoute = new Route({
                ...route,
                parameters: {
                    ...this.parameters,
                    ...route.parameters,
                },
                path: this.rootPath + prefix + route.path,
                security: route.security ?? this.security,
            })
            this.routeMatcher.push(includeRoute)
            this.routeMatcher.set(prefix, { middleware: router.middleware })
        }
    }
}

export class App<PsThis extends GenericRouteParameters<PsThis> = {}> extends Router<{}, PsThis> {
    rootPath: string
    title: string
    description: string
    version: string
    tagsInfo: TagObject[]
    servers: ServerObject[]
    contact?: ContactObject
    license?: LicenseObject
    termsOfService?: string
    securitySchemes: Record<string, SecuritySchemeObject>
    security: SecurityRequirementObject[]
    openapiUrl: `/${string}` | null
    swaggerUrl: `/${string}` | null
    redocUrl: `/${string}` | null
    errorHandler: ErrorHandler
    private _openapi?: OpenAPIObject

    constructor(
        init: (`/${string}` extends PathStringOf<PsThis>
            ? { rootPath?: string }
            : { rootPath: PathStringOf<PsThis> }) & {
            title?: string
            description?: string
            version?: string
            tagsInfo?: TagObject[]
            servers?: ServerObject[]
            contact?: ContactObject
            license?: LicenseObject
            termsOfService?: string
            securitySchemes?: Record<string, SecuritySchemeObject>
            security?: SecurityRequirementObject[]
            tags?: string[]
            deprecated?: boolean
            includeInSchema?: boolean
            responses?: Record<number, ResponseConfig>
            openapiUrl?: `/${string}` | null
            swaggerUrl?: `/${string}` | null
            redocUrl?: `/${string}` | null
            defaultResponseClass?: ResponseClass
            errorHandler?: ErrorHandler
            middleware?: Middleware[]
            parameters?: PsThis &
                DisallowDependencyParameters<ImplicitParameters<PsThis>> &
                DisallowRuntimeParameters<PsThis>
        }
    ) {
        super({ base: {}, ...init })
        this.rootPath = init.rootPath ?? "/"
        this.title = init.title ?? "Cerces API"
        this.description = init.description ?? ""
        this.version = init.version ?? "0.1.0"
        this.tagsInfo = init.tagsInfo ?? []
        this.servers = [{ url: this.rootPath }, ...(init.servers ?? [])]
        this.contact = init.contact
        this.license = init.license
        this.termsOfService = init.termsOfService
        this.securitySchemes = init.securitySchemes ?? {}
        this.security =
            init.security ??
            Object.keys(this.securitySchemes).map((key) => ({
                [key]: [],
            }))
        this.openapiUrl = init.openapiUrl === null ? null : (init.openapiUrl ?? "/openapi.json")
        this.swaggerUrl = init.swaggerUrl === null ? null : (init.swaggerUrl ?? "/docs")
        this.redocUrl = init.redocUrl === null ? null : (init.redocUrl ?? "/redoc")
        this.routeMatcher.set(null, { middleware: this.middleware })
        this.errorHandler =
            init.errorHandler ??
            ((_: ArgsOf<{}>, e: any) => {
                console.error(e)
                return new Response("Internal Server Error", { status: 500 })
            })

        if (this.openapiUrl) {
            this.get(this.openapiUrl, {
                includeInSchema: false,
                responseClass: JSONResponse,
                handle: (() => this.openapi()) as any,
            })
            if (this.swaggerUrl)
                this.get(this.swaggerUrl, {
                    includeInSchema: false,
                    responseClass: HTMLResponse,
                    handle: (() =>
                        createSwaggerHTML(fixPathSlashes(this.rootPath + this.openapiUrl!), {
                            title: this.title,
                        })) as any,
                })
            if (this.redocUrl)
                this.get(this.redocUrl, {
                    includeInSchema: false,
                    responseClass: HTMLResponse,
                    handle: (() =>
                        createRedocHTML(fixPathSlashes(this.rootPath + this.openapiUrl!), {
                            title: this.title,
                        })) as any,
                })
        }
    }

    openapi(): OpenAPIObject {
        const rootPathRegex = new RegExp(`^${this.rootPath}`)
        if (this._openapi) return this._openapi
        const registry = new OpenAPIRegistry()
        for (const route of this.routeMatcher) {
            const routeOpenAPI = route.openapi()
            routeOpenAPI.path = fixPathSlashes(routeOpenAPI.path.replace(rootPathRegex, ""))
            if (route.includeInSchema) registry.registerPath(routeOpenAPI)
        }
        const generator = new OpenApiGeneratorV31(registry.definitions)
        this._openapi = generator.generateDocument({
            openapi: "3.1.0",
            info: {
                title: this.title,
                version: this.version,
                description: this.description,
                contact: this.contact,
                license: this.license,
                termsOfService: this.termsOfService,
            },
            servers: this.servers,
            tags: this.tagsInfo,
        })
        this._openapi.components = this._openapi.components || {}
        this._openapi.components.securitySchemes = this.securitySchemes
        return this._openapi
    }

    async handle(baseArgs: ArgsOf<{}>): Promise<Response> {
        const { req } = baseArgs
        try {
            const url = new URL(req.url)
            const [route, params, middleware] = this.routeMatcher.match(req.method, url.pathname)
            const cookies = parseCookie(req.headers.get("Cookie") ?? "")
            const queries = searchParamsToQueries(url.searchParams)
            const nextMap: Record<string, () => Promise<Response>> = {}

            let next: () => Promise<Response>
            if (route === undefined) {
                next = async () => new JSONResponse({ detail: "Not Found" }, { status: 404 })
            } else if (route === null) {
                next = async () =>
                    new JSONResponse(
                        { detail: "Method Not Allowed" },
                        { status: 405, headers: params }
                    )
            } else {
                next = async () => {
                    const [resolve, later] = createResolveLater()
                    try {
                        const parseInfo = await resolveArgs<RouteParameters>(route.parameters, {
                            baseArgs: baseArgs,
                            later: later,
                            rawParameters: {
                                params,
                                queries,
                                cookies,
                            },
                        })
                        let res: Response
                        if (parseInfo.success) {
                            res = await route.handle({ ...baseArgs, ...parseInfo.args })
                            if (!(res instanceof Response))
                                res = new route.responseClass(res, { status: route.statusCode })
                        } else {
                            res = new JSONResponse({ detail: parseInfo.errors }, { status: 422 })
                        }
                        resolve(res)
                        return res
                    } catch (e: any) {
                        if (e instanceof Response) {
                            resolve(e)
                            return e
                        }
                        throw e
                    }
                }
            }
            nextMap[middleware.length - 1] = next
            for (let i = middleware.length - 1; i >= 0; i--) {
                next = async () => await middleware[i].handle(baseArgs, nextMap[i])
                nextMap[i - 1] = next
            }
            return await next()
        } catch (e) {
            if (e instanceof Response) return e
            return await this.errorHandler(baseArgs, e)
        }
    }

    fetch = (req: Request, ...args: any[]) => {
        if (args.length === 2)
            // cf-workers
            return this.handle({ req, env: args[0], ctx: args[1] } as ArgsOf<{}>)
        if (args.length === 1)
            // bun, deno
            return this.handle({ req, ctx: args[0] } as ArgsOf<{}>)
        // fallback
        return this.handle({ req } as ArgsOf<{}>)
    }
}
