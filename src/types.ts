import type { z } from "zod"
import type { LinksObject } from "openapi3-ts/oas31"
import type { Dependency } from "./core"
import type { Route } from "./routing"

/** Runtime arguments for the request to be declared in `.d.ts`. */
export interface RuntimeArgs {}

/** Simplifies a type by resolving intersections and mapped types. */
export type Simplify<T> = T extends infer O ? { [K in keyof O]: O[K] } : never

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
export type RouteParameterOptions = {
    altName?: string
    mediaType?: string
    description?: string
    includeInSchema?: boolean
    preprocessor?: Preprocessor
}

/** Options for the response schema in `Responds`. */
export type RespondsOptions = {
    mediaType?: string
    description?: string
    headers?: Record<string, z.ZodType>
    links?: LinksObject
}

/** Types that can be used to declare `BodyParameter`s. */
export type ZodBodyable = z.ZodType | typeof String | typeof Blob | typeof ReadableStream

export type RouteParameterLocation = "path" | "query" | "header" | "cookie" | "body" | "@depends"

/** Base type for route parameters. */
export type RouteParameter<S extends z.ZodType> = {
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
    dependency: Dependency<Ps, z.infer<S>>
}

/** Overwrite map values with template literal strings. */
export type MapValueOverwriteLiteral<
    M,
    F extends [string, string] = ["", ""],
> = string extends keyof M ? {} : { [K in keyof M]?: `${F[0]}\`${K & string}\`${F[1]}` }

/** Base type for route parameters dictionary. */
export type RouteParameters = { [k: string]: RouteParameter<z.ZodType> }

export type DisallowRuntimeParameters<M> = string extends keyof M
    ? {}
    : {
          req?: "Parameter key `req` is already taken by the `Request` object."
      } & MapValueOverwriteLiteral<
          RuntimeArgs,
          ["Parameter key ", " is already taken by a declared runtime argument."]
      >

export type DisallowDependencyParameters<M> = MapValueOverwriteLiteral<
    M,
    ["Parameter key ", " is already taken by an implicit parameter on a declared dependency."]
>
export type DisallowBaseDependencyParameters<M> = MapValueOverwriteLiteral<
    M,
    [
        "Parameter key ",
        " is already taken by an implicit parameter on a declared dependency from the base router.",
    ]
>
export type DisallowBaseParameters<M> = MapValueOverwriteLiteral<
    M,
    ["Parameter key ", " is already taken by a declared parameter on the base router."]
>

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
        [K in keyof Ps]: Ps[K] extends DependsParameter<any, infer PsDepend>
            ? FlattenParameters<PsDepend> & { [P in K]: Ps[K] } // Preserve Dependency + flattened inner
            : { [P in K]: Ps[K] } // Leaf as singleton
    }[keyof Ps]
>

/** Infer implicit parameters from dependencies. */
export type ImplicitParameters<Ps extends RouteParameters> = UnionToIntersection<
    | {
          [K in keyof Ps]: Ps[K] extends DependsParameter<any, infer PsDepend>
              ? FlattenParameters<PsDepend>
              : never
      }[keyof Ps]
    | {}
>

/** Infer the arguments of a handler based on provided route parameters. */
export type ArgsOf<Ps extends RouteParameters> = Simplify<
    RuntimeArgs & { req: Request } & {
        [K in keyof FlattenParameters<Ps>]: TypeOf<FlattenParameters<Ps>[K]>
    }
>

/** Infer the `init` type of a class constructor. */
export type InitOf<C extends abstract new (...args: any) => any> = C extends new (
    init: infer I extends { [k: string]: any }
) => InstanceType<C>
    ? I
    : never

export type Awaitable<T> = T | Promise<T>

/** Shape for error handler. */
export type ErrorHandler = (args: ArgsOf<{}>, e: any) => Awaitable<Response>

/** Shape for route handler. */
export type RouteHandler<Args, R> = Args extends any ? (args: Args) => Awaitable<R> : never

/** Shape for dependency handler. */
export type DependencyHandler<Args, R> = Args extends any
    ? (args: Args, later: Later) => Awaitable<R>
    : never

/** Shape for middleware. */
export type MiddlewareHandler = (args: ArgsOf<{}>, next: Next) => Awaitable<Response>

/** Type for an unbound route that is not connected to method and path. */
export type UnboundRoute<PsBase extends RouteParameters, Ps extends RouteParameters, R> = Omit<
    InitOf<typeof Route<PsBase, Ps, R>>,
    "method" | "path"
> & { method?: never; path?: never }

/** Error information for a single route parameter during `resolveArgs` */
export type ResolveArgsError = {
    location: RouteParameterLocation
    name: string
    issues: z.core.$ZodIssue[]
}

/** Return type for `resolveArgs` */
export type ResolveArgsInfo<Ps extends RouteParameters> = {
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
