import type { z } from "zod"
import type { LinksObject } from "openapi3-ts/oas31"
import type { Dependency } from "./core"
import type { Route } from "./routing"

/** Runtime arguments for the request to be declared in `.d.ts`. */
export interface RuntimeArgs {}

export type HTTPMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS" | "TRACE"
export type HTTPMethodLower =
    | "get"
    | "post"
    | "put"
    | "patch"
    | "delete"
    | "head"
    | "options"
    | "trace"

export type ResponseClass = new (body: any, init?: ResponseInit) => Response

export type Next = () => Promise<Response>

export type Later = (fn: (res: Response) => void) => void

export type Preprocessor = <Out = any, In = any>(value: In) => Out | In

/** Options for route parameters declaration. */
export interface RouteParameterOptions {
    altName?: string
    mediaType?: string
    description?: string
    includeInSchema?: boolean
    preprocessor?: Preprocessor
}

/** Options for the response schema in `Responds`. */
export interface RespondsOptions {
    mediaType?: string
    description?: string
    headers?: Record<string, z.ZodType>
    links?: LinksObject
}

/** Types that can be used to declare `BodyParameter`s. */
export type ZodBodyable = z.ZodType | typeof String | typeof Blob | typeof ReadableStream

export type RouteParameterLocation = "path" | "query" | "header" | "cookie" | "body" | "@depends"

/** Base type for route parameters. */
export interface RouteParameter<S extends z.ZodType> {
    location: RouteParameterLocation
    schema?: S
    schemaOr?: any
    options: RouteParameterOptions
}

export type PathParameter<S extends z.ZodType> = RouteParameter<S> & {
    location: "path"
    schema: S
}
export type QueryParameter<S extends z.ZodType> = RouteParameter<S> & {
    location: "query"
    schema: S
}
export type HeaderParameter<S extends z.ZodType> = RouteParameter<S> & {
    location: "header"
    schema: S
}
export type CookieParameter<S extends z.ZodType> = RouteParameter<S> & {
    location: "cookie"
    schema: S
}
export type BodyParameter<S extends z.ZodType> = RouteParameter<S> & {
    location: "body"
    schema: S
    options: { mediaType: string }
}
export type DependsParameter<
    S extends z.ZodType,
    Ps extends RouteParameters,
> = RouteParameter<S> & {
    location: "@depends"
    dependency: Dependency<z.infer<S>, Ps>
}

/** Map all properties to `never`. */
export type NeverMap<T> = RouteParameters extends T ? {} : { [K in keyof T]?: never }

/** Base type for route parameters dictionary. */
export type RouteParameters = { [k: string]: RouteParameter<z.ZodType> } & {
    req?: never
} & { [K in keyof RuntimeArgs]?: never }

/** Generic route parameters enforcing dual extension to allow optional default values. */
export type GenericRouteParameters<Ps0 extends RouteParameters> = RouteParameters extends Ps0
    ? {}
    : RouteParameters

/** Infer the type of a route parameter. */
export type TypeOf<T> =
    T extends DependsParameter<infer S extends z.ZodType, any>
        ? z.TypeOf<S>
        : T extends RouteParameter<infer S extends z.ZodType>
          ? z.TypeOf<S>
          : T extends z.ZodType
            ? z.TypeOf<T>
            : T extends Dependency<infer R, any>
              ? R
              : unknown

/** Convert a union type to an intersection type. */
export type UnionToIntersection<U> = (U extends any ? (arg: U) => void : never) extends (
    arg: infer I
) => void
    ? I
    : never

/** Flatten all parameters, including dependencies. */
export type FlattenParameters<Ps extends RouteParameters> = UnionToIntersection<
    {
        [K in keyof Ps]: Ps[K] extends DependsParameter<any, infer SubPs>
            ? FlattenParameters<SubPs> & { [P in K]: Ps[K] } // Preserve Dependency + flattened inner
            : { [P in K]: Ps[K] } // Leaf as singleton
    }[keyof Ps]
>

/** Flatten second level base parameters only, excluding root base parameters. */
type ImplicitParametersHelper<Ps extends RouteParameters> = UnionToIntersection<
    {
        [K in keyof Ps]: Ps[K] extends DependsParameter<any, infer SubPs>
            ? ImplicitParametersHelper<SubPs>
            : { [P in K]: Ps[K] }
    }[keyof Ps]
>
export type ImplicitParameters<Ps extends RouteParameters> = UnionToIntersection<
    | {
          [K in keyof Ps]: Ps[K] extends DependsParameter<any, infer SubPs>
              ? ImplicitParametersHelper<SubPs>
              : never
      }[keyof Ps]
    | {}
>

/** Infer the arguments of a handler based on provided route parameters. */
export type ArgsOf<Ps extends RouteParameters> = RuntimeArgs & { req: Request } & {
    [K in keyof FlattenParameters<Ps>]: TypeOf<FlattenParameters<Ps>[K]>
}

/** Infer the `init` type of a class constructor. */
export type InitOf<C extends abstract new (...args: any) => any> = C extends new (
    init: infer I extends { [k: string]: any }
) => InstanceType<C>
    ? I
    : never

/** Shape for error handler. */
export type ErrorHandler =
    | ((args: ArgsOf<{}>, e: any) => Promise<Response>)
    | ((args: ArgsOf<{}>, e: any) => Response)

/** Shape for route handler. */
export type RouteHandler<R, Ps extends RouteParameters> =
    | ((args: ArgsOf<Ps>) => Promise<R>)
    | ((args: ArgsOf<Ps>) => R)

/** Shape for dependency handler. */
export type DependencyHandler<R, Ps extends RouteParameters> =
    | ((args: ArgsOf<Ps>, later: Later) => Promise<R>)
    | ((args: ArgsOf<Ps>, later: Later) => R)

/** Shape for middleware. */
export type MiddlewareHandler =
    | ((args: ArgsOf<{}>, next: Next) => Promise<Response>)
    | ((args: ArgsOf<{}>, next: Next) => Response)

/** Type for an unbound route that is not connected to method and path. */
export type UnboundRoute<R, Ps extends RouteParameters, Ps0 extends RouteParameters> = Omit<
    InitOf<typeof Route<R, Ps, Ps0>>,
    "method" | "path"
> & { method?: never; path?: never }

/** Error information for a single route parameter during `resolveArgs` */
export interface ResolveArgsError {
    location: RouteParameterLocation
    name: string
    issues: z.core.$ZodIssue[]
}

/** Return type for `resolveArgs` */
export interface ResolveArgsInfo<Ps extends RouteParameters> {
    success: boolean
    errors: ResolveArgsError[]
    args: ArgsOf<Ps>
}

/** Permutation of a union type. */
export type Permutation<T, K = T> = [T] extends [never]
    ? []
    : T extends unknown
      ? [T, ...Permutation<Exclude<K, T>>]
      : never

type PathJoinHelper<T extends string[]> = T extends [
    infer H extends string,
    ...infer R extends string[],
]
    ? `{${H}}${R["length"] extends 0 ? "" : `${string}${PathJoinHelper<R>}`}`
    : never
type PathJoin<T extends string[]> = T["length"] extends 0
    ? `/${string}`
    : `/${string}${PathJoinHelper<T>}${string}`
export type PathString<T extends string> =
    Permutation<T> extends infer U extends string[] ? PathJoin<U> : never

/** Infer the path string literal template of route parameters. */
export type PathStringOf<Ps> = PathString<
    keyof {
        [K in keyof Ps as Ps[K] extends PathParameter<infer Schema>
            ? Schema extends z.ZodOptional<z.ZodTypeAny>
                ? never
                : K
            : never]: Ps[K]
    }
>

/** Exclude parameters of one route parameters dictionary from another. */
export type ExcludeParameters<PsA, PsB> = {
    [K in keyof PsA as K extends keyof PsB ? never : K]: PsA[K]
}
