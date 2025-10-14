import { z } from "zod"

import {
    App,
    Base,
    Body,
    Cookie,
    Dependency,
    Depends,
    Header,
    JSONResponse,
    Middleware,
    Path,
    PlainTextResponse,
    Query,
    Responds,
    Router,
} from "../src"
import { createCORSMiddleware } from "../src/middleware/cors"

// Sample dependency

export const requireAuthSession = new Dependency({
    name: "requireAuthSession",
    parameters: {
        authorization: Header(z.string()),
    },
    handle: async ({ authorization }) => {
        if (authorization == "iminvalid")
            throw new JSONResponse({ detail: "Invalid Authentication" }, { status: 403 })
        // Type checks
        const _0: string = authorization
        return { id: 123, token: authorization }
    },
})

export const requireItemId = new Dependency({
    name: "requireItemId",
    parameters: {
        itemId: Path(z.number().int().min(0)),
    },
    handle: async ({ itemId }) => {
        // Type checks
        const _0: number = itemId
        return { id: itemId }
    },
})

// Sample Nested Dependency

const testNestedDependencyNested = new Dependency({
    parameters: {
        one: Query(z.string()),
        two: Query(z.string()),
    },
    handle: ({ one, two }) => {
        // Type checks
        const _0: string = one
        const _1: string = two
        return { one, two }
    },
})
export const testNestedDependency = new Dependency({
    parameters: {
        three: Depends(testNestedDependencyNested),
        zero: Query(z.number()),
    },
    handle: ({ three, zero, one, two }) => {
        // Type checks
        const _0: { one: string; two: string } = three
        const _1: number = zero
        const _2: string = one
        const _3: string = two
        return { three, zero }
    },
})

// Sample Apps

export const app = new App({
    middleware: [createCORSMiddleware({ origin: ["http://a.co"] })],
})
export const appAlt = new App({
    rootPath: "/alt",
    middleware: [createCORSMiddleware({ origin: ["http://a.co"] })],
})
export const appWithParams = new App({
    parameters: {
        depends: Depends(testNestedDependency),
        TEST_APP_LEVEL_PARAMETER: Query(z.boolean().default(false)),
    },
})
export const appRootPath = new App({
    rootPath: "/api/{version}",
    parameters: {
        version: Path(z.string()),
    },
})
export const appRootPath1 = new App({
    // @ts-expect-error Testing invalid rootPath
    rootPath: "/api/v1",
    parameters: {
        id: Path(z.string()),
    },
})
// @ts-expect-error Testing missing rootPath
export const appRootPath2 = new App({
    parameters: {
        id: Path(z.string()),
    },
})

// Sample route definitions

app.get("/hello-world", {
    responseClass: PlainTextResponse,
    parameters: {
        testOpenAPI: Query(z.number().array()),
    },
    handle: () => "Hello World!",
})
app.get("/cookie-yummy", {
    responseClass: PlainTextResponse,
    parameters: {
        yummy: Cookie(z.string()),
    },
    handle: ({ yummy }) => {
        const _0: string = yummy
        return yummy
    },
})
app.get("/nonexistent", {
    // @ts-expect-error Testing nonexistent param
    handle: ({ nonexistent }) => {
        return { nonexistent: String(nonexistent) }
    },
})
app.get("/test-nested-dependencies", {
    parameters: {
        depends: Depends(testNestedDependency),
    },
    handle: ({ depends }) => {
        // Type checks
        const _0: { three: { one: string; two: string }; zero: number } = depends
        return depends
    },
})
app.get("/test-dependencies-flatten-params", {
    parameters: {
        another: Query(z.string()),
        depends: Depends(testNestedDependency),
    },
    handle: ({ another, depends, three, zero, one, two }) => {
        // Type checks
        const _0: { three: { one: string; two: string }; zero: number } = depends
        const _1: number = zero
        const _2: string = one
        const _3: string = two
        const _4: { one: string; two: string } = three
        const _5: string = another
        return { depends, three, zero, one, two, another }
    },
})

app.get("/", {
    parameters: {},
    handle() {
        return { message: "Hello World" }
    },
})

app.get("/fetch-runtime-args", {
    parameters: {},
    handle({ req, ...args }) {
        return args
    },
})

app.get("/items/{itemId}", {
    parameters: {
        itemId: Path(z.number().int().min(0)),
        q: Query(z.string().optional()),
    },
    handle: ({ itemId, q }) => {
        // Type checks
        const _0: number = itemId
        const _1: string | undefined = q
        return { itemId, q }
    },
})

// @ts-expect-error Testing missing path param
app.get("/items/missing-itemId", {
    parameters: {
        itemId: Path(z.number().int().min(0)),
        q: Query(z.string().optional()),
    },
    handle: () => null,
})

// @ts-expect-error Testing missing multiple path param
app.get("/items/missing-multiple-id", {
    parameters: {
        itemId: Path(z.number().int().min(0)),
        itemId2: Path(z.number().int().min(0)),
        q: Query(z.string().optional()),
    },
    handle: () => null,
})

// @ts-expect-error Testing missing one of the path param
app.get("/items/{itemId}/missing-oneof-id", {
    parameters: {
        itemId: Path(z.number().int().min(0)),
        itemId2: Path(z.number().int().min(0)),
        q: Query(z.string().optional()),
    },
    handle: () => null,
})

// @ts-expect-error Testing missing dependency path param
app.get("/items/missing-dependency-id", {
    parameters: {
        item: Depends(requireItemId),
    },
    handle: ({ item }) => {
        // Type checks
        const _0: { id: number } = item
        return item
    },
})

export const todoRoute = app.post("/projects/{projectId}/todos", {
    tags: ["Todos"],
    summary: "Create project todos",
    description: "Create a todo for a project",
    deprecated: false,
    includeInSchema: true,
    statusCode: 200,
    responseClass: JSONResponse,
    responses: {
        200: Responds(z.object({ params: z.any() }), {
            description: "Returns received params",
        }),
        403: Responds(z.object({ detail: z.string() })),
        409: Responds(z.object({ detail: z.string() })),
    },
    parameters: {
        projectId: Path(z.number()),
        trackId: Query(z.string()),
        X_Rate_Limit: Header(z.string()),
        todoItem: Body(
            z.object({
                id: z.string(),
                title: z.string(),
                description: z.string(),
            })
        ),
        session: Depends(requireAuthSession),
    },
    handle: ({ projectId, trackId, X_Rate_Limit, todoItem, session }) => {
        if (trackId == "throwme")
            throw new JSONResponse({ detail: "Thrown trackId" }, { status: 409 })
        // Type checks
        const _0: number = projectId
        const _1: string = trackId
        const _2: string = X_Rate_Limit
        const _3: { id: string; title: string; description: string } = todoItem
        const _4: { id: number; token: string } = session
        return {
            params: { projectId, trackId, X_Rate_Limit, todoItem, session },
        }
    },
})
const { method: _0, path: _1, ...altTodoRoute } = todoRoute
export { altTodoRoute }
appAlt.post("/projects/{projectId}/todos", altTodoRoute)
app.put("/hello-world", {
    responseClass: PlainTextResponse,
    parameters: {
        testOpenAPI: Query(z.boolean().array()),
        blobBody: Body(Blob),
    },
    handle: () => "Hello World!",
})
app.delete("/hello-world", {
    responseClass: PlainTextResponse,
    parameters: {
        testOpenAPI: Query(z.enum(["blue", "green", "red", "black", "white"]).array()),
        textBody: Body(String),
    },
    handle: () => "Hello World!",
})
app.patch("/hello-world", {
    responseClass: PlainTextResponse,
    parameters: {
        testOpenAPI: Query(
            z.nativeEnum({ blue: 10, green: 20, red: 30, black: 40, white: 50 }).array()
        ),
        streamBody: Body(ReadableStream),
    },
    handle: () => "Hello World!",
})
app.trace("/hello-world", {
    responseClass: PlainTextResponse,
    parameters: {},
    handle: () => "Hello World!",
})
app.options("/hello-world", {
    responseClass: PlainTextResponse,
    parameters: {},
    handle: () => "Hello World!",
})

// App level parameters

appWithParams.get("/test-params", {
    parameters: {
        testOpenAPI: Query(z.number().array()),
    },
    handle: ({ TEST_APP_LEVEL_PARAMETER, testOpenAPI, depends }) => {
        // Type checks
        const _0: boolean = TEST_APP_LEVEL_PARAMETER
        const _1: { three: { one: string; two: string }; zero: number } = depends
        const _2: number[] = testOpenAPI
        return { TEST_APP_LEVEL_PARAMETER, testOpenAPI, depends }
    },
})

appWithParams.get("/test-nonexistent-params", {
    parameters: {
        testOpenAPI: Query(z.number().array()),
    },
    // @ts-expect-error Testing nonexistent param
    handle: ({ TEST_APP_LEVEL_PARAMETER, testOpenAPI, depends, nonexistent }) => {
        // Type checks
        const _0: boolean = TEST_APP_LEVEL_PARAMETER
        const _1: { three: { one: string; two: string }; zero: number } = depends
        const _2: number[] = testOpenAPI
        const _3: string | undefined = nonexistent
        return { nonexistent: String(nonexistent) }
    },
})

// Sample sub apps

export const subapp = new Router({
    base: Base<typeof app>(),
})
subapp.get("/hello-world", {
    responseClass: PlainTextResponse,
    parameters: {
        testOpenAPI: Query(z.number().array().default([])),
    },
    handle: () => "Hello World!",
})

app.include("/subpath", subapp)
appAlt.include("/subpath", subapp)

export const subappParams = new Router({
    base: Base<typeof appRootPath>(),
    parameters: {
        depends: Depends(testNestedDependency),
    },
})
subappParams.get("/", {
    handle: ({ depends, three, zero, one, two, version }) => {
        // Type checks
        const _0: { three: { one: string; two: string }; zero: number } = depends
        const _1: number = zero
        const _2: string = one
        const _3: string = two
        const _4: { one: string; two: string } = three
        const _5: string = version
        return { depends, three, zero, one, two, version }
    },
})

export const subappItems = new Router({
    base: Base<typeof appRootPath>(),
    parameters: {
        item: Depends(requireItemId),
        someQuery: Query(z.string()),
    },
})
subappItems.get("/", {
    handle: ({ item, itemId, version, someQuery }) => {
        // Type checks
        const _0: { id: number } = item
        const _1: number = itemId
        const _2: string = version
        const _3: string = someQuery
        return { item, itemId, version, someQuery }
    },
})

export const subappSubItems = new Router({
    base: Base<typeof subappItems>(),
    parameters: {
        subItemId: Path(z.number().int().min(0)),
    },
})
subappSubItems.get("/", {
    handle: ({ item, itemId, version, subItemId, someQuery }) => {
        // Type checks
        const _0: { id: number } = item
        const _1: number = itemId
        const _2: string = version
        const _3: number = subItemId
        const _4: string = someQuery
        return { item, itemId, version, subItemId, someQuery }
    },
})

subappItems.include("/subitems/{subItemId}", subappSubItems)
// @ts-expect-error Testing include missing dependency path param
subappItems.include("/subitems/missing-subItemId", subappSubItems)

appRootPath.include("/params", subappParams)
appRootPath.include("/items/{itemId}", subappItems)
// @ts-expect-error Testing include missing dependency path param
appRootPath.include("/items/missing-itemId", subappItems)

// Sample middleware

export const m1 = new Middleware({
    name: "m1",
    handle: async ({}, next) => {
        const res = await next()
        res.headers.set("X-M", (res.headers.get("X-M") || "") + "1")
        return res
    },
})

export const m2 = new Middleware({
    name: "m2",
    handle: async ({}, next) => {
        const res = await next()
        res.headers.set("X-M", (res.headers.get("X-M") || "") + "2")
        return res
    },
})

export const m3 = new Middleware({
    name: "m3",
    handle: async ({}, next) => {
        const res = await next()
        res.headers.set("X-M", (res.headers.get("X-M") || "") + "3")
        return res
    },
})

// Sample app using middleware merge

export const appMMerge = new App({
    middleware: [m1],
})
const subAppMMerge = new Router({
    base: Base<typeof appMMerge>(),
    middleware: [m2],
})
export const subAppMMerge2 = new Router({
    base: Base<typeof appMMerge>(),
    middleware: [m2, m3],
})
appMMerge.get("/1", {
    parameters: {},
    handle: () => null,
})
appMMerge.get("/13", {
    middleware: [m3],
    parameters: {},
    handle: () => null,
})
subAppMMerge.get("/", {
    parameters: {},
    handle: () => null,
})
subAppMMerge2.get("/", {
    parameters: {},
    handle: () => null,
})
subAppMMerge.get("/3", {
    middleware: [m3],
    parameters: {},
    handle: () => null,
})
appMMerge.include("/2", subAppMMerge)
appMMerge.include("/23", subAppMMerge2)

// Dependency Caching

export let depCacheCounter = 0
export let depCacheCounter2 = 0
export let depNoCacheCounter = 0
export const cacheTestDep = new Dependency({
    parameters: {},
    handle: () => ++depCacheCounter,
})
export const cacheTestDep2 = new Dependency({
    parameters: {
        counter: Depends(cacheTestDep),
    },
    handle: () => ++depCacheCounter2,
})
export const noCacheTestDep = new Dependency({
    useCache: false,
    parameters: {
        counter: Depends(cacheTestDep),
    },
    handle: () => ++depNoCacheCounter,
})

export const appDepCache = new App({})

appDepCache.get("/cache-counter", {
    parameters: {
        counter: Depends(cacheTestDep),
        counter2: Depends(cacheTestDep),
    },
    handle: ({ counter, counter2 }) => {
        return { counter, counter2 }
    },
})

appDepCache.get("/cache-counter-deep", {
    parameters: {
        counter3: Depends(cacheTestDep2),
        counter: Depends(cacheTestDep),
    },
    handle: ({ counter, counter3 }) => {
        return { counter, counter3 }
    },
})

appDepCache.get("/cache-counter-no-cache", {
    parameters: {
        counter: Depends(noCacheTestDep),
        counter2: Depends(noCacheTestDep),
    },
    handle: ({ counter, counter2 }) => {
        return { counter, counter2 }
    },
})

export const resetDepCounters = () => {
    depCacheCounter = 0
    depCacheCounter2 = 0
    depNoCacheCounter = 0
}
