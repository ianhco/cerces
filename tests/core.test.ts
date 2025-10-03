import { z } from "zod"

import { App, Router, Dependency, Middleware, Query, Base } from "../src"
import { createResolveLater } from "../src/helpers"
import { Next } from "../src/types"

import {
    altTodoRoute,
    app,
    appAlt,
    appDepCache,
    appMMerge,
    appRootPath,
    appWithParams,
    resetDepCounters,
} from "./core.setup"

// Tests

describe("class App", () => {
    test("[method] handle: success", async () => {
        const res1 = await app.handle({
            req: new Request("http://a.co/projects/123/todos?trackId=abc", {
                method: "POST",
                body: JSON.stringify({
                    id: "iid",
                    title: "ititle",
                    description: "idesc",
                }),
                headers: {
                    "X-Rate-Limit": "20:100",
                    authorization: "Bearer myauthtoken",
                },
            }),
        })
        expect(res1).toBeTruthy()
        expect(res1.status).toBe(200)
        expect(await res1.json()).toEqual({
            params: {
                projectId: 123,
                trackId: "abc",
                X_Rate_Limit: "20:100",
                todoItem: {
                    id: "iid",
                    title: "ititle",
                    description: "idesc",
                },
                session: {
                    id: 123,
                    token: "Bearer myauthtoken",
                },
            },
        })
        expect(res1.headers.get("Access-Control-Allow-Origin")).toBe("http://a.co")
    })

    test("[method] handle: success cors reject", async () => {
        const res1 = await app.handle({
            req: new Request("http://b.co/projects/123/todos?trackId=abc", {
                method: "POST",
                body: JSON.stringify({
                    id: "iid",
                    title: "ititle",
                    description: "idesc",
                }),
                headers: {
                    "X-Rate-Limit": "20:100",
                    authorization: "Bearer myauthtoken",
                },
            }),
        })
        expect(res1).toBeTruthy()
        expect(res1.status).toBe(200)
        expect(await res1.json()).toEqual({
            params: {
                projectId: 123,
                trackId: "abc",
                X_Rate_Limit: "20:100",
                todoItem: {
                    id: "iid",
                    title: "ititle",
                    description: "idesc",
                },
                session: {
                    id: 123,
                    token: "Bearer myauthtoken",
                },
            },
        })
        expect(res1.headers.get("Access-Control-Allow-Origin")).not.toBe("http://b.co")

        const res2 = await app.handle({
            req: new Request("http://b.co/projects/123/todos?trackId=abc", {
                method: "OPTIONS",
                body: JSON.stringify({
                    id: "iid",
                    title: "ititle",
                    description: "idesc",
                }),
                headers: {
                    "X-Rate-Limit": "20:100",
                    authorization: "Bearer myauthtoken",
                    "Access-Control-Request-Method": "POST",
                },
            }),
        })
        expect(res2).toBeTruthy()
        expect(res2.status).toBe(204)
        expect(res2.headers.get("Access-Control-Allow-Methods")).toEqual("POST")
        expect(res2.headers.get("Access-Control-Allow-Origin")).not.toBe("http://b.co")

        const res3 = await app.handle({
            req: new Request("http://b.co/projects/123/todos?trackId=abc", {
                method: "OPTIONS",
                body: JSON.stringify({
                    id: "iid",
                    title: "ititle",
                    description: "idesc",
                }),
                headers: {
                    "X-Rate-Limit": "20:100",
                    authorization: "Bearer myauthtoken",
                },
            }),
        })
        expect(res3).toBeTruthy()
        expect(res3.status).toBe(405)
        expect(res3.headers.get("Access-Control-Allow-Origin")).not.toBe("http://b.co")
    })

    test("[method] handle: slash path success", async () => {
        const res1 = await app.handle({ req: new Request("http://a.co/") })
        expect(res1).toBeTruthy()
        expect(res1.status).toBe(200)
        expect(await res1.json()).toEqual({ message: "Hello World" })
    })

    test("[method] handle: fail path not found", async () => {
        const res2 = await app.handle({ req: new Request("http://a.co/nopath") })
        expect(res2).toBeTruthy()
        expect(res2.status).toBe(404)
        expect(await res2.json()).toEqual({ detail: "Not Found" })
    })

    test("[method] handle: fail route throw", async () => {
        const res1 = await app.handle({
            req: new Request("http://a.co/projects/123/todos?trackId=throwme", {
                method: "POST",
                body: JSON.stringify({
                    id: "iid",
                    title: "ititle",
                    description: "idesc",
                }),
                headers: {
                    "X-Rate-Limit": "20:100",
                    authorization: "Bearer myauthtoken",
                },
            }),
        })
        expect(res1).toBeTruthy()
        expect(res1.status).toBe(409)
        expect(await res1.json()).toEqual({ detail: "Thrown trackId" })
    })

    test("[method] handle: fail dependency throw", async () => {
        const res1 = await app.handle({
            req: new Request("http://a.co/projects/123/todos?trackId=abc", {
                method: "POST",
                body: JSON.stringify({
                    id: "iid",
                    title: "ititle",
                    description: "idesc",
                }),
                headers: {
                    "X-Rate-Limit": "20:100",
                    authorization: "iminvalid",
                },
            }),
        })
        expect(res1).toBeTruthy()
        expect(res1.status).toBe(403)
        expect(await res1.json()).toEqual({ detail: "Invalid Authentication" })
    })

    test("[method] openapi: return value simple", () => {
        const openapi = app.openapi()
        expect(openapi).toBeTruthy()
        expect(Object.entries(openapi.paths!).length).toBeTruthy()
    })

    test("[method] openapi: auto security requirement", () => {
        const tempApp = new App({
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                },
            },
        })
        const tempAppSub = new Router({
            base: Base<typeof tempApp>(),
            security: [],
        })
        const tempAppSub2 = new Router({
            base: Base<typeof tempApp>(),
        })
        delete altTodoRoute.security
        tempApp.get("/todo/{projectId}", altTodoRoute)
        tempAppSub.get("/todo/{projectId}", altTodoRoute)
        tempAppSub2.get("/todo/{projectId}", altTodoRoute)
        tempApp.include("/sub", tempAppSub)
        tempApp.include("/sub2", tempAppSub2)
        const openapi = tempApp.openapi()
        expect(openapi).toBeTruthy()
        expect(openapi.components!.securitySchemes).toEqual({
            bearerAuth: {
                type: "http",
                scheme: "bearer",
            },
        })
        for (const route of tempApp.routeMatcher.routes) {
            if (route.path.startsWith("/sub/")) expect(route.openapi().security).toEqual([])
            else expect(route.openapi().security).toEqual([{ bearerAuth: [] }])
        }
    })

    test("[method] handle: include success", async () => {
        const res1 = await app.handle({ req: new Request("http://a.co/subpath/hello-world") })
        expect(res1).toBeTruthy()
        expect(res1.status).toBe(200)
        expect(await res1.text()).toEqual("Hello World!")
    })

    test("[method] handle: root path with prefix success", async () => {
        const res1 = await appAlt.handle({
            req: new Request("http://a.co/alt/projects/123/todos?trackId=abc", {
                method: "POST",
                body: JSON.stringify({
                    id: "iid",
                    title: "ititle",
                    description: "idesc",
                }),
                headers: {
                    "X-Rate-Limit": "20:100",
                    authorization: "Bearer myauthtoken",
                },
            }),
        })
        expect(res1).toBeTruthy()
        expect(res1.status).toBe(200)
        expect(await res1.json()).toEqual({
            params: {
                projectId: 123,
                trackId: "abc",
                X_Rate_Limit: "20:100",
                todoItem: {
                    id: "iid",
                    title: "ititle",
                    description: "idesc",
                },
                session: {
                    id: 123,
                    token: "Bearer myauthtoken",
                },
            },
        })
        expect(res1.headers.get("Access-Control-Allow-Origin")).toBe("http://a.co")
    })

    test("[method] handle: root path without prefix success", async () => {
        const res1 = await appAlt.handle({
            req: new Request("http://a.co/alt/projects/123/todos?trackId=abc", {
                method: "POST",
                body: JSON.stringify({
                    id: "iid",
                    title: "ititle",
                    description: "idesc",
                }),
                headers: {
                    "X-Rate-Limit": "20:100",
                    authorization: "Bearer myauthtoken",
                },
            }),
        })
        expect(res1).toBeTruthy()
        expect(res1.status).toBe(200)
    })

    test("[method] handle: root path without prefix fail", async () => {
        const res1 = await appAlt.handle({
            req: new Request("http://a.co/dirgh/123/todos?trackId=abc", {
                method: "POST",
                body: JSON.stringify({
                    id: "iid",
                    title: "ititle",
                    description: "idesc",
                }),
                headers: {
                    "X-Rate-Limit": "20:100",
                    authorization: "Bearer myauthtoken",
                },
            }),
        })
        expect(res1).toBeTruthy()
        expect(res1.status).toBe(404)
        expect(await res1.json()).toEqual({ detail: "Not Found" })
    })

    test("[method] handle: root path with prefix fail", async () => {
        const res1 = await appAlt.handle({
            req: new Request("http://a.co/alt/dirgh/123/todos?trackId=abc", {
                method: "POST",
                body: JSON.stringify({
                    id: "iid",
                    title: "ititle",
                    description: "idesc",
                }),
                headers: {
                    "X-Rate-Limit": "20:100",
                    authorization: "Bearer myauthtoken",
                },
            }),
        })
        expect(res1).toBeTruthy()
        expect(res1.status).toBe(404)
        expect(await res1.json()).toEqual({ detail: "Not Found" })
    })

    test("[method] handle: root path include success", async () => {
        const res1 = await appAlt.handle({
            req: new Request("http://a.co/alt/subpath/hello-world"),
        })
        expect(res1).toBeTruthy()
        expect(res1.status).toBe(200)
        expect(await res1.text()).toEqual("Hello World!")
    })

    test("[method] handle: nested dependency success", async () => {
        const res1 = await app.handle({
            req: new Request("http://a.co/test-nested-dependencies?zero=1&one=a&two=b"),
        })
        expect(res1).toBeTruthy()
        expect(res1.status).toBe(200)
        expect(await res1.json()).toEqual({ zero: 1, three: { one: "a", two: "b" } })
    })

    test("[method] handle: nested dependency fail", async () => {
        const res1 = await app.handle({
            req: new Request("http://a.co/test-nested-dependencies?zero=1"),
        })
        expect(res1).toBeTruthy()
        expect(res1.status).toBe(422)
    })

    test("[method] handle: dependency flatten params success", async () => {
        const res1 = await app.handle({
            req: new Request(
                "http://a.co/test-dependencies-flatten-params?zero=1&one=a&two=b&another=hello"
            ),
        })
        expect(res1).toBeTruthy()
        expect(res1.status).toBe(200)
        expect(await res1.json()).toEqual({
            depends: { three: { one: "a", two: "b" }, zero: 1 },
            zero: 1,
            three: { one: "a", two: "b" },
            another: "hello",
            one: "a",
            two: "b",
        })
    })

    test("[method] handle: cookie yummy", async () => {
        const res1 = await app.handle({
            req: new Request("http://a.co/cookie-yummy", { headers: { Cookie: "yummy=oreo" } }),
        })
        expect(res1).toBeTruthy()
        expect(res1.status).toBe(200)
        expect(await res1.text()).toBe("oreo")
    })

    test("[method] handle: middleware merge", async () => {
        const res1 = await appMMerge.handle({ req: new Request("http://a.co/1") })
        expect(res1.headers.get("X-M")).toBe("1")
        const res2 = await appMMerge.handle({ req: new Request("http://a.co/13") })
        expect(res2.headers.get("X-M")).toBe("31")
        const res3 = await appMMerge.handle({ req: new Request("http://a.co/2") })
        expect(res3.headers.get("X-M")).toBe("21")
        const res4 = await appMMerge.handle({ req: new Request("http://a.co/2/3") })
        expect(res4.headers.get("X-M")).toBe("321")
        const res5 = await appMMerge.handle({ req: new Request("http://a.co/23") })
        expect(res5.headers.get("X-M")).toBe("321")
    })

    test("[method] handle: middleware undefined route", async () => {
        const res1 = await appMMerge.handle({ req: new Request("http://a.co/0") })
        expect(res1).toBeTruthy()
        expect(res1.headers.get("X-M")).toBe("1")
        expect(res1.status).toBe(404)
        const res2 = await appMMerge.handle({ req: new Request("http://a.co/2/5623") })
        expect(res2).toBeTruthy()
        expect(res2.headers.get("X-M")).toBe("21")
        expect(res2.status).toBe(404)
    })

    test("[method] handle: dependency caching simple", async () => {
        resetDepCounters()

        const res2 = await appDepCache.handle({
            req: new Request("http://d.co/cache-counter", { method: "GET" }),
        })
        expect(res2).toBeTruthy()
        expect(res2.status).toBe(200)
        expect(await res2.json()).toEqual({ counter: 1, counter2: 1 })

        // ensure it runs again
        const res3 = await appDepCache.handle({
            req: new Request("http://d.co/cache-counter", { method: "GET" }),
        })
        expect(res3).toBeTruthy()
        expect(res3.status).toBe(200)
        expect(await res3.json()).toEqual({ counter: 2, counter2: 2 })
    })

    test("[method] handle: dependency caching nested", async () => {
        resetDepCounters()

        const res2 = await appDepCache.handle({
            req: new Request("http://d.co/cache-counter-deep", { method: "GET" }),
        })
        expect(res2).toBeTruthy()
        expect(res2.status).toBe(200)
        expect(await res2.json()).toEqual({ counter: 1, counter3: 1 })

        const res3 = await appDepCache.handle({
            req: new Request("http://d.co/cache-counter-deep", { method: "GET" }),
        })
        expect(res3).toBeTruthy()
        expect(res3.status).toBe(200)
        expect(await res3.json()).toEqual({ counter: 2, counter3: 2 })
    })

    test("[method] handle: dependency caching disabled", async () => {
        resetDepCounters()

        const res2 = await appDepCache.handle({
            req: new Request("http://d.co/cache-counter-no-cache", { method: "GET" }),
        })
        expect(res2).toBeTruthy()
        expect(res2.status).toBe(200)
        const { counter, counter2 } = await res2.json()
        expect(counter + counter2).toEqual(3)
    })

    test("[method] fetch: req + 2 args", async () => {
        const res1 = await app.fetch(
            new Request("http://a.co/fetch-runtime-args", { method: "GET" }),
            222,
            333
        )
        expect(res1).toBeTruthy()
        expect(res1.status).toBe(200)
        expect(await res1.json()).toEqual({ env: 222, ctx: 333 })
    })

    test("[method] fetch: req + 1 args", async () => {
        const res1 = await app.fetch(
            new Request("http://a.co/fetch-runtime-args", { method: "GET" }),
            222
        )
        expect(res1).toBeTruthy()
        expect(res1.status).toBe(200)
        expect(await res1.json()).toEqual({ ctx: 222 })
    })

    test("[method] fetch: req only", async () => {
        const res1 = await app.fetch(
            new Request("http://a.co/fetch-runtime-args", { method: "GET" })
        )
        expect(res1).toBeTruthy()
        expect(res1.status).toBe(200)
        expect(await res1.json()).toEqual({})
    })

    test("[method] handle: path item id", async () => {
        const res1 = await app.handle({
            req: new Request("http://a.co/items/563?q=something", { method: "GET" }),
        })
        expect(res1).toBeTruthy()
        expect(res1.status).toBe(200)
        expect(await res1.json()).toEqual({ itemId: 563, q: "something" })
    })

    test("[method] handle: app level params", async () => {
        const res1 = await appWithParams.handle({
            req: new Request(
                "http://a.co/test-params?zero=0&one=a&two=b&TEST_APP_LEVEL_PARAMETER=true&testOpenAPI=2",
                { method: "GET" }
            ),
        })
        expect(res1).toBeTruthy()
        expect(res1.status).toBe(200)
        expect(await res1.json()).toEqual({
            TEST_APP_LEVEL_PARAMETER: true,
            testOpenAPI: [2],
            depends: { three: { one: "a", two: "b" }, zero: 0 },
        })
    })

    test("[method] handle: sub app extend base params", async () => {
        const res1 = await appRootPath.handle({
            req: new Request("http://a.co/api/v1/params?zero=0&one=a&two=b", { method: "GET" }),
        })
        expect(res1).toBeTruthy()
        expect(res1.status).toBe(200)
        expect(await res1.json()).toEqual({
            depends: { three: { one: "a", two: "b" }, zero: 0 },
            zero: 0,
            three: { one: "a", two: "b" },
            one: "a",
            two: "b",
            version: "v1",
        })
    })

    test("[method] handle: sub app extend base params with path", async () => {
        const res1 = await appRootPath.handle({
            req: new Request("http://a.co/api/v1/items/111?someQuery=foo", { method: "GET" }),
        })
        expect(res1).toBeTruthy()
        expect(res1.status).toBe(200)
        expect(await res1.json()).toEqual({
            itemId: 111,
            someQuery: "foo",
            version: "v1",
            item: { id: 111 },
        })
    })

    test("[method] handle: triple nested sub app params", async () => {
        const res1 = await appRootPath.handle({
            req: new Request("http://a.co/api/v1/items/111/subitems/222?someQuery=foo", {
                method: "GET",
            }),
        })
        expect(res1).toBeTruthy()
        expect(res1.status).toBe(200)
        expect(await res1.json()).toEqual({
            itemId: 111,
            subItemId: 222,
            someQuery: "foo",
            version: "v1",
            item: { id: 111 },
        })
    })

    test("[method] handle: app nonexistent param", async () => {
        const res1 = await app.handle({
            req: new Request("https://a.co/nonexistent", { method: "GET" }),
        })
        expect(res1).toBeTruthy()
        expect(res1.status).toBe(200)
        expect(await res1.json()).toEqual({ nonexistent: "undefined" })
    })

    test("[method] handle: app level params nonexistent param", async () => {
        const res1 = await appWithParams.handle({
            req: new Request(
                "https://a.co/test-nonexistent-params?zero=0&one=a&two=b&TEST_APP_LEVEL_PARAMETER=true&testOpenAPI=2",
                { method: "GET" }
            ),
        })
        expect(res1).toBeTruthy()
        expect(res1.status).toBe(200)
        expect(await res1.json()).toEqual({ nonexistent: "undefined" })
    })
})

describe("class Dependency", () => {
    test("[constructor]: mutation", () => {
        const dependency = new Dependency({
            name: "undefinedDependency",
            parameters: {},
            handle: () => undefined,
        })
        expect(dependency.name).toBe("undefinedDependency")
    })

    test("[method] handle: return value simple", () => {
        const dependency = new Dependency({
            name: "sampleDependency",
            parameters: {
                key: Query(z.number()),
            },
            handle: ({ key }) => key,
        })
        expect(dependency.name).toBe("sampleDependency")
        expect(
            dependency.handle(
                {
                    req: new Request("https://page.com/path"),
                    key: 2,
                },
                () => undefined
            )
        ).toBe(2)
    })

    test("[method] handle: return value later", async () => {
        let flag = false
        const [resolve, later] = createResolveLater()
        const dependency = new Dependency({
            name: "thenDependency",
            parameters: {
                key: Query(z.number()),
            },
            handle: async ({ key }, later) => {
                later(() => (flag = true))
                return key
            },
        })
        expect(dependency.name).toBe("thenDependency")
        expect(
            await dependency.handle(
                {
                    req: new Request("https://page.com/path"),
                    key: 2,
                },
                later
            )
        ).toBe(2)
        expect(flag).toBe(false)
        resolve(new Response(""))
        await new Promise((r) => setTimeout(r, 10))
        expect(flag).toBe(true)
    })
})

describe("class Middleware", () => {
    test("[constructor]: mutation", () => {
        const handle = async ({}, next: Next) => {
            return await next()
        }
        const middleware = new Middleware({
            name: "mymiddleware",
            handle: handle,
        })
        expect(middleware.name).toBe("mymiddleware")
        expect(middleware.handle).toBe(handle)
    })
})
