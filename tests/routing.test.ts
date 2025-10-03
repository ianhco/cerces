import { z } from "zod"
import { Body, Depends, Header, Path, Query, Dependency } from "../src"
import { Route, RouteNode, RouteMatcher, generateRouteSummary } from "../src/routing"

const nullHandler = async () => null

describe("function generateRouteSummary", () => {
    test("[invocation]: return value", () => {
        expect(generateRouteSummary("GET", "path/to/route")).toBe("Read Path To Route")
        expect(generateRouteSummary("POST", "/path/to/route/")).toBe("Create Path To Route")
        expect(generateRouteSummary("PUT", "path/to/route/")).toBe("Update Path To Route")
        expect(generateRouteSummary("PUT", "path/to/route/{id}")).toBe("Update Path To Route")
        expect(generateRouteSummary("GET", "/items/{itemId}/subitems")).toBe("Read Items Subitems")
        expect(generateRouteSummary("GET", ";droigh/675/等级")).toBeTruthy()
        expect(generateRouteSummary("PATCH", "//route/")).toBe("Modify Route")
        expect(generateRouteSummary("DELETE", "")).toBe("Delete")
        expect(generateRouteSummary("TRACE", "")).toBe("Trace")
        expect(generateRouteSummary("OPTIONS", "")).toBe("Check")
        expect(generateRouteSummary("HEAD", "/items")).toBe("Head Items")
    })
})

describe("class Route", () => {
    test("[constructor]: mutation", () => {
        const route = new Route({
            method: "GET",
            path: "path/to/route",
            parameters: {},
            handle: nullHandler,
        })
        expect(route.path).toBe("/path/to/route")
        expect(route.handle).toBe(nullHandler)
        expect(route.parameters).toStrictEqual({})
    })
})

describe("class RouteNode", () => {
    test("[method] touch: mutation and return value", () => {
        const routeNode = new RouteNode("")
        expect(routeNode.touch("new")).toBeInstanceOf(RouteNode)
    })

    test("[method] match: mutation and return value", () => {
        const routeNode = new RouteNode("")
        routeNode.touch("new").touch("{}").touch("new2")
        expect(routeNode.match("new")).toBeInstanceOf(RouteNode)
        expect(routeNode.match("idk")).toBeUndefined()
        expect(routeNode.match("new")!.match("123")).toBeInstanceOf(RouteNode)
        expect(routeNode.match("new")!.match("dfg45")).toBeInstanceOf(RouteNode)
        expect(routeNode.match("new")!.match("dfg45")!.match("new2")).toBeInstanceOf(RouteNode)
        expect(routeNode.match("new")!.match("dfg45")!.match("new3")).toBeUndefined()
    })
})

describe("class RouteMatcher", () => {
    test("[method] push: mutation 0 params", () => {
        const router = new RouteMatcher()
        const route = new Route({
            method: "GET",
            path: "/path/to/route",
            parameters: {},
            handle: nullHandler,
        })
        router.push(route)
        const [routeOut, params] = router.match("GET", "/path/to/route")
        expect(routeOut).toStrictEqual(route)
        expect(params).toStrictEqual({})
    })

    test("[method] push: mutation 2 params", () => {
        const router = new RouteMatcher()
        const route = new Route({
            method: "GET",
            path: "/path/{to}/route/{target}",
            parameters: {},
            handle: nullHandler,
        })
        router.push(route)
        const [routeOut, params] = router.match("GET", "/path/123/route/abc")
        expect(routeOut).toStrictEqual(route)
        expect(params).toStrictEqual({ to: "123", target: "abc" })
    })

    const router = new RouteMatcher()
    const route1 = new Route({
        method: "GET",
        path: "/path/to/route",
        parameters: {},
        handle: nullHandler,
    })
    const route2 = new Route({
        method: "GET",
        path: "/path/{to}/route/{target}",
        parameters: {},
        handle: nullHandler,
    })
    const route3 = new Route({
        method: "POST",
        path: "/path/{to}/route/{target}",
        parameters: {},
        handle: nullHandler,
    })
    const route4 = new Route({
        method: "GET",
        path: "/another/to/route",
        parameters: {},
        handle: nullHandler,
    })
    const route5 = new Route({
        method: "GET",
        path: "/path/{to}/route/{target}/action",
        parameters: {},
        handle: nullHandler,
    })
    const route6 = new Route({
        method: "PUT",
        path: "/path/{to}/route/{target}/action",
        parameters: {},
        handle: nullHandler,
    })
    router.push(route1)
    router.push(route2)
    router.push(route3)
    router.push(route4)
    router.push(route5)
    router.push(route6)

    test("[method] match: return value 0 params", () => {
        const [routeOut1, paramsOut1] = router.match("GET", "/path/to/route")
        expect(routeOut1).toBe(route1)
        expect(paramsOut1).toStrictEqual({})
        const [routeOut4, paramsOut4] = router.match("GET", "/another/to/route")
        expect(routeOut4).toBe(route4)
        expect(paramsOut4).toStrictEqual({})
    })

    test("[method] match: return value >0 params", () => {
        const [routeOut2, paramsOut2] = router.match("GET", "/path/a/route/b")
        const [routeOut3, paramsOut3] = router.match("POST", "/path/ab/route/123")
        const [routeOut5, paramsOut5] = router.match("GET", "/path/12/route/abc/action")
        const [routeOut6, paramsOut6] = router.match("PUT", "/path/12/route/abc/action")
        expect(routeOut2).toBe(route2)
        expect(paramsOut2).toStrictEqual({ to: "a", target: "b" })
        expect(routeOut3).toBe(route3)
        expect(paramsOut3).toStrictEqual({ to: "ab", target: "123" })
        expect(routeOut5).toBe(route5)
        expect(paramsOut5).toStrictEqual({ to: "12", target: "abc" })
        expect(routeOut6).toBe(route6)
        expect(paramsOut6).toStrictEqual({ to: "12", target: "abc" })
    })

    test("[method] match: return value not found", () => {
        const [routeOut7] = router.match("GET", "/pat/12/route/abc/action")
        const [routeOut8] = router.match("GET", "/path/to")
        const [routeOut9] = router.match("GET", "/path/12/route")
        expect(routeOut7).toBeUndefined()
        expect(routeOut8).toBeUndefined()
        expect(routeOut9).toBeUndefined()
    })

    test("[method] match: return value method not allowed", () => {
        const [routeOut1] = router.match("POST", "/path/to/route")
        const [routeOut3] = router.match("DELETE", "/path/ab/route/123")
        expect(routeOut1).toBeNull()
        expect(routeOut3).toBeNull()
    })

    test("[method] openapi: parameters schema inclusion", () => {
        const dep = new Dependency({
            parameters: {
                path2: Path(z.string()),
                query2: Query(z.string()),
                header2: Header(z.string()),
                Host: Header(z.string()), // default excluded
                Origin: Header(z.string(), { includeInSchema: true }), // excluded, force include
                query3: Query(z.string()), // repeated
            },
            handle: nullHandler,
        })
        const route = new Route({
            method: "GET",
            path: "/path/to/{path}",
            parameters: {
                path: Path(z.string()),
                query: Query(z.string()),
                header: Header(z.string()),
                Accept: Header(z.string()), // default excluded
                Content_Length: Header(z.string()), // default excluded
                Content_Type: Header(z.string()), // default excluded
                Authorization: Header(z.string()), // default excluded
                User_Agent: Header(z.string(), { includeInSchema: true }), // excluded, force include
                body: Body(z.object({})),
                dep: Depends(dep),
            },
            handle: nullHandler,
        })
        const openapi = route.openapi()
        expect((openapi.request?.params as z.ZodObject<any>)?.shape.path).toBeTruthy()
        expect((openapi.request?.params as z.ZodObject<any>)?.shape.path2).toBeTruthy()
        expect((openapi.request?.query as z.ZodObject<any>)?.shape.query).toBeTruthy()
        expect((openapi.request?.query as z.ZodObject<any>)?.shape.query2).toBeTruthy()
        expect((openapi.request?.query as z.ZodObject<any>)?.shape.query3).toBeTruthy()
        expect((openapi.request?.headers as z.ZodObject<any>)?.shape.header).toBeTruthy()
        expect((openapi.request?.headers as z.ZodObject<any>)?.shape.header2).toBeTruthy()
        expect((openapi.request?.headers as z.ZodObject<any>)?.shape.Accept).toBeFalsy()
        expect((openapi.request?.headers as z.ZodObject<any>)?.shape["Content-Length"]).toBeFalsy()
        expect((openapi.request?.headers as z.ZodObject<any>)?.shape["Content-Type"]).toBeFalsy()
        expect((openapi.request?.headers as z.ZodObject<any>)?.shape.Authorization).toBeFalsy()
        expect((openapi.request?.headers as z.ZodObject<any>)?.shape.Origin).toBeTruthy() // force included
        expect((openapi.request?.headers as z.ZodObject<any>)?.shape.Host).toBeFalsy()
        expect((openapi.request?.headers as z.ZodObject<any>)?.shape["User-Agent"]).toBeTruthy() // force included
        expect(openapi.request?.body).toBeTruthy()
    })
})
