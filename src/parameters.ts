import { z } from "zod"
import type { ResponseConfig } from "@asteasolutions/zod-to-openapi"

import { Dependency } from "./core"
import { unsafeZodUnwrap } from "./helpers"
import type {
    ArgsOf,
    BodyParameter,
    CookieParameter,
    DependsParameter,
    HeaderParameter,
    Later,
    ResolveArgsError,
    ResolveArgsInfo,
    PathParameter,
    QueryParameter,
    RespondsOptions,
    RouteParameter,
    RouteParameterOptions,
    RouteParameters,
    ZodBodyable,
} from "./types"

export function Path(): PathParameter<z.ZodString>
export function Path<S extends z.ZodType>(
    schema: S,
    options?: Omit<RouteParameterOptions, "mediaType" | "altName">
): PathParameter<S>
export function Path(
    schema: z.ZodType = z.string(),
    options?: Omit<RouteParameterOptions, "mediaType" | "altName">
): PathParameter<z.ZodType> {
    return {
        location: "path",
        schema: schema,
        options: {
            preprocessor: isJsonCoercible(schema) ? jsonCoerce : undefined,
            ...options,
        },
    }
}

export function Query(): QueryParameter<z.ZodString>
export function Query<S extends z.ZodType>(
    schema: S,
    options?: Omit<RouteParameterOptions, "mediaType">
): QueryParameter<S>
export function Query(
    schema: z.ZodType = z.string(),
    options?: Omit<RouteParameterOptions, "mediaType">
): QueryParameter<z.ZodType> {
    return {
        location: "query",
        schema: schema,
        options: {
            preprocessor: isJsonCoercible(schema) ? jsonCoerce : undefined,
            ...options,
        },
    }
}

export function Header(): HeaderParameter<z.ZodString>
export function Header<S extends z.ZodType>(
    schema: S,
    options?: Omit<RouteParameterOptions, "mediaType">
): HeaderParameter<S>
export function Header(
    schema: z.ZodType = z.string(),
    options?: Omit<RouteParameterOptions, "mediaType">
): HeaderParameter<z.ZodType> {
    return {
        location: "header",
        schema: schema,
        options: {
            preprocessor: isJsonCoercible(schema) ? jsonCoerce : undefined,
            ...options,
        },
    }
}

export function Cookie(): CookieParameter<z.ZodString>
export function Cookie<S extends z.ZodType>(
    schema: S,
    options?: Omit<RouteParameterOptions, "mediaType">
): CookieParameter<S>
export function Cookie(
    schema: z.ZodType = z.string(),
    options?: Omit<RouteParameterOptions, "mediaType">
): CookieParameter<z.ZodType> {
    return {
        location: "cookie",
        schema: schema,
        options: {
            preprocessor: isJsonCoercible(schema) ? jsonCoerce : undefined,
            ...options,
        },
    }
}

export function Body(): BodyParameter<z.ZodString>
export function Body(
    schema: typeof String,
    options?: Omit<RouteParameterOptions, "altName">
): BodyParameter<z.ZodString>
export function Body(
    schema: typeof Blob,
    options?: Omit<RouteParameterOptions, "altName">
): BodyParameter<z.ZodType<Blob>>
export function Body(
    schema: typeof ReadableStream,
    options?: Omit<RouteParameterOptions, "altName">
): BodyParameter<z.ZodType<ReadableStream>>
export function Body<S extends z.ZodType>(
    schema: S,
    options?: Omit<RouteParameterOptions, "altName">
): BodyParameter<S>
export function Body(
    schema: ZodBodyable = String,
    options?: Omit<RouteParameterOptions, "altName">
): BodyParameter<z.ZodType> {
    return {
        location: "body",
        schema: schema instanceof z.ZodType ? schema : z.any(),
        schemaOr: schema instanceof z.ZodType ? undefined : schema,
        options: {
            mediaType: "application/json",
            ...options,
        },
    }
}

export function Depends<R, Ps extends RouteParameters>(
    dependency: Dependency<R, Ps>
): DependsParameter<z.ZodType<R>, Ps> {
    return {
        location: "@depends",
        dependency: dependency,
        options: { includeInSchema: true },
    }
}

export function jsonCoerce<Out = unknown>(value: string): Out | string
export function jsonCoerce<Out = unknown>(value: string[]): Out[] | string[]
export function jsonCoerce<Out = unknown>(
    value: string | string[]
): Out | Out[] | string | string[] {
    try {
        if (value instanceof Array) {
            return value.map((item: string) => JSON.parse(item))
        }
        return JSON.parse(value)
    } catch (e) {
        return value
    }
}

export function isJsonCoercible(schema: z.ZodType): boolean {
    return (
        schema instanceof z.ZodNumber ||
        schema instanceof z.ZodBoolean ||
        (schema instanceof z.ZodArray && isJsonCoercible(schema.unwrap() as z.ZodType)) ||
        (schema instanceof z.ZodOptional && isJsonCoercible(schema.unwrap() as z.ZodType)) ||
        (schema instanceof z.ZodDefault && isJsonCoercible(schema.unwrap() as z.ZodType)) ||
        (schema instanceof z.ZodEnum && !!Object.values(schema.enum).find((v) => String(v) !== v))
    )
}

export function Responds(): ResponseConfig
export function Responds(schema: typeof String, options?: RespondsOptions): ResponseConfig
export function Responds(schema: typeof Blob, options?: RespondsOptions): ResponseConfig
export function Responds(schema: typeof ReadableStream, options?: RespondsOptions): ResponseConfig
export function Responds(schema: z.ZodType, options?: RespondsOptions): ResponseConfig
export function Responds(schema: ZodBodyable = String, options?: RespondsOptions): ResponseConfig {
    if (schema instanceof z.ZodType) {
        return {
            description: options?.description ?? "",
            headers: z.object(options?.headers ?? {}),
            content: {
                [options?.mediaType ?? "application/json"]: {
                    schema: schema,
                },
            },
        }
    }
    return {
        description: options?.description ?? "",
        headers: z.object(options?.headers ?? {}),
        content: {
            [options?.mediaType ?? "application/json"]: {
                schema:
                    schema === String ? { type: "string" } : { type: "string", format: "binary" },
            },
        },
    }
}

export function parseCookie(cookieHeader?: string | null): Record<string, string> {
    if (!cookieHeader) {
        return {}
    }
    const cookies: Record<string, string> = {}
    const pairs = cookieHeader.split(";")
    for (let pair of pairs.map((p) => p.trim())) {
        if (!pair) continue
        const eqIndex = pair.indexOf("=")
        if (eqIndex < 0) continue // Skip flags (e.g., HttpOnly)
        const name = pair.slice(0, eqIndex).trim()
        let value = pair.slice(eqIndex + 1).trim()
        if (value.startsWith('"') && value.endsWith('"')) {
            value = value.slice(1, -1)
        }
        try {
            value = decodeURIComponent(value)
        } catch {
            // Fallback to raw if decode fails
        }
        cookies[name] = value
    }
    return cookies
}

export async function resolveArgs<Ps extends RouteParameters>(
    parameters: Ps,
    input: {
        baseArgs: ArgsOf<{}>
        rawParameters?: {
            params?: Record<string, string>
            queries?: Record<string, string[]>
            cookies?: Record<string, string | undefined>
        }
        later: Later
    },
    cache?: WeakMap<Dependency<any, any>, { args: any; value: any }>
): Promise<ResolveArgsInfo<Ps>> {
    const { req } = input.baseArgs
    const { params, queries, cookies } = input.rawParameters ?? {}
    cache = cache ?? new WeakMap()

    let success = true
    const args: Record<string, any> = {}
    const errors: ResolveArgsError[] = []

    const parsers = {
        path: (name: string, _parameter: RouteParameter<z.ZodType>) => {
            const parameter = _parameter as PathParameter<z.ZodType>
            let input = (params ?? {})[name]
            return parameter.schema.safeParse(
                input !== undefined && parameter.options.preprocessor
                    ? parameter.options.preprocessor(input)
                    : input
            )
        },
        query: (name: string, _parameter: RouteParameter<z.ZodType>) => {
            const parameter = _parameter as QueryParameter<z.ZodType>
            let input: string[] | string | undefined =
                (queries ?? {})[parameter.options.altName ?? name] ?? undefined
            if (
                input &&
                !(
                    parameter.schema instanceof z.ZodArray ||
                    unsafeZodUnwrap(parameter.schema) instanceof z.ZodArray
                )
            )
                input = input[0]
            return parameter.schema.safeParse(
                parameter.options.preprocessor ? parameter.options.preprocessor(input) : input
            )
        },
        header: (name: string, _parameter: RouteParameter<z.ZodType>) => {
            const parameter = _parameter as HeaderParameter<z.ZodType>
            let input =
                req.headers.get(parameter.options.altName ?? name.replace(/_/g, "-")) ?? undefined
            return parameter.schema.safeParse(
                input !== undefined && parameter.options.preprocessor
                    ? parameter.options.preprocessor(input)
                    : input
            )
        },
        cookie: (name: string, _parameter: RouteParameter<z.ZodType>) => {
            const parameter = _parameter as CookieParameter<z.ZodType>
            let input = (cookies ?? {})[parameter.options.altName ?? name]
            return parameter.schema.safeParse(
                input !== undefined && parameter.options.preprocessor
                    ? parameter.options.preprocessor(input)
                    : input
            )
        },
        body: async (name: string, _parameter: RouteParameter<z.ZodType>) => {
            const parameter = _parameter as BodyParameter<z.ZodType>
            if (parameter.schemaOr) {
                let input: unknown
                if (parameter.schemaOr === String) input = await req.text()
                else if (parameter.schemaOr === Blob) input = await req.blob()
                else input = req.body // typeof ReadableStream
                return { success: true as const, data: input }
            } else {
                let input
                try {
                    input = await req.json()
                } catch (e) {
                    return {
                        success: false as const,
                        error: new z.ZodError([
                            { message: "Invalid JSON.", path: [], code: z.ZodIssueCode.custom },
                        ]),
                    }
                }
                return parameter.schema.safeParse(input)
            }
        },
    }

    for (const [name, _parameter] of Object.entries(parameters)) {
        let parseOut!: z.ZodSafeParseSuccess<unknown> | z.ZodSafeParseError<unknown>
        if (_parameter.location == "@depends") {
            const parameter = _parameter as DependsParameter<any, any>
            const dependency = parameter.dependency
            if (dependency.useCache) {
                const cached = cache.get(dependency)
                if (cached) {
                    args[name] = cached.value
                    for (const [depArgName, depArgValue] of Object.entries(cached.args)) {
                        if (args[depArgName] === undefined) args[depArgName] = depArgValue
                    }
                    continue
                }
            }
            const dependencyParseInfo = await resolveArgs(dependency.parameters, input, cache)
            success &&= dependencyParseInfo.success
            if (dependencyParseInfo.success) {
                args[name] = await dependency.handle(
                    { ...input.baseArgs, ...dependencyParseInfo.args },
                    input.later
                )
                for (const [depArgName, depArgValue] of Object.entries(dependencyParseInfo.args)) {
                    if (args[depArgName] === undefined) args[depArgName] = depArgValue
                }
                if (dependency.useCache)
                    cache.set(dependency, { value: args[name], args: dependencyParseInfo.args })
            } else {
                errors.push(...dependencyParseInfo.errors)
            }
        } else {
            parseOut = await parsers[_parameter.location](name, _parameter)
            success &&= parseOut.success
            if (parseOut.success) {
                args[name] = parseOut.data
            } else {
                errors.push({
                    location: _parameter.location,
                    name: name,
                    issues: parseOut.error.issues,
                })
            }
        }
    }
    return { success, errors, args: args as ArgsOf<Ps> }
}
