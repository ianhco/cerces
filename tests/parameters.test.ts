import { z } from "zod"
import {
    Dependency,
    Body,
    Cookie,
    Depends,
    Header,
    Path,
    Query,
    jsonCoerce,
    Responds,
    isJsonCoercible,
    resolveArgs,
    parseCookie,
} from "../src"
import { createResolveLater } from "../src/helpers"

const nullLater = () =>
    void describe("function Path", () => {
        test("[invocation]: return value", () => {
            const schema = z.number()
            const routeParam = Path(schema)
            expect(routeParam.location).toBe("path")
            expect(routeParam.schema).toBe(schema)
            expect(routeParam.options.preprocessor).toBe(jsonCoerce)
        })
    })

describe("function jsonCoerce", () => {
    test("[invocation]: return value", () => {
        expect(jsonCoerce<number>("12")).toBe(12)
        expect(jsonCoerce<boolean>("true")).toBe(true)
        expect(jsonCoerce<boolean>("false")).toBe(false)
        expect(jsonCoerce<string>("text")).toBe("text")
        expect(jsonCoerce<number[]>(["1", "23"])).toStrictEqual([1, 23])
        expect(jsonCoerce<boolean[]>(["true", "false"])).toStrictEqual([true, false])
        expect(jsonCoerce<string[]>(["something", "else"])).toStrictEqual(["something", "else"])
    })
})

describe("function isJsonCoercible", () => {
    test("[invocation]: return value zod number", () => {
        expect(isJsonCoercible(z.number())).toBe(true)
        expect(isJsonCoercible(z.number().max(256))).toBe(true)
        expect(isJsonCoercible(z.number().optional())).toBe(true)
        expect(isJsonCoercible(z.number().default(1))).toBe(true)
        expect(isJsonCoercible(z.number().array())).toBe(true)
    })

    test("[invocation]: return value zod boolean", () => {
        expect(isJsonCoercible(z.boolean())).toBe(true)
        expect(isJsonCoercible(z.boolean().optional())).toBe(true)
        expect(isJsonCoercible(z.boolean().default(true))).toBe(true)
        expect(isJsonCoercible(z.boolean().array())).toBe(true)
    })

    test("[invocation]: return value zod enum", () => {
        expect(isJsonCoercible(z.enum(["a", "b"]))).toBe(false)
        expect(isJsonCoercible(z.enum(["a", "b"]).optional())).toBe(false)
        expect(isJsonCoercible(z.enum(["a", "b"]).default("a"))).toBe(false)
        expect(isJsonCoercible(z.enum(["a", "b"]).array())).toBe(false)
    })

    test("[invocation]: return value zod native enum", () => {
        expect(isJsonCoercible(z.nativeEnum({ a: 1, b: 2 }))).toBe(true)
        expect(isJsonCoercible(z.nativeEnum({ a: 1, b: 2 }).optional())).toBe(true)
        expect(isJsonCoercible(z.nativeEnum({ a: 1, b: 2 }).default(1))).toBe(true)
        expect(isJsonCoercible(z.nativeEnum({ a: 1, b: 2 }).array())).toBe(true)
        expect(isJsonCoercible(z.nativeEnum({ a: "1", b: 2 }))).toBe(true)
        expect(isJsonCoercible(z.nativeEnum({ a: "1", b: 2 }).optional())).toBe(true)
        expect(isJsonCoercible(z.nativeEnum({ a: "1", b: 2 }).default("1"))).toBe(true)
        expect(isJsonCoercible(z.nativeEnum({ a: "1", b: 2 }).array())).toBe(true)
        expect(isJsonCoercible(z.nativeEnum({ a: "1", b: "2" }))).toBe(false)
        expect(isJsonCoercible(z.nativeEnum({ a: "1", b: "2" }).optional())).toBe(false)
        expect(isJsonCoercible(z.nativeEnum({ a: "1", b: "2" }).array())).toBe(false)
    })

    test("[invocation]: return value not coercible", () => {
        expect(isJsonCoercible(z.string())).toBe(false)
        expect(isJsonCoercible(z.string().array())).toBe(false)
        expect(isJsonCoercible(z.bigint().array())).toBe(false)
        expect(isJsonCoercible(z.object({}))).toBe(false)
    })
})

describe("function Query", () => {
    test("[invocation]: return value", () => {
        const schema = z.boolean()
        const routeParam = Query(schema)
        expect(routeParam.location).toBe("query")
        expect(routeParam.schema).toBe(schema)
        expect(routeParam.options.preprocessor).toBe(jsonCoerce)
    })
})

describe("function Header", () => {
    test("[invocation]: return value", () => {
        const schema = z.string()
        const routeParam = Header(schema)
        expect(routeParam.location).toBe("header")
        expect(routeParam.schema).toBe(schema)
    })
})

describe("function Cookie", () => {
    test("[invocation]: return value", () => {
        const schema = z.string()
        const routeParam = Cookie(schema)
        expect(routeParam.location).toBe("cookie")
        expect(routeParam.schema).toBe(schema)
    })
})

describe("function Body", () => {
    test("[invocation]: return value", () => {
        const schema = z.object({
            id: z.number(),
            name: z.string(),
        })
        const routeParam = Body(schema)
        expect(routeParam.location).toBe("body")
        expect(routeParam.schema).toBe(schema)
    })
})

describe("function Depends", () => {
    test("[invocation]: return value", () => {
        const dependency = new Dependency({
            parameters: {
                key: Query(z.string()),
            },
            handle: ({ key }) => key,
        })
        const routeParam = Depends(dependency)
        expect(routeParam.location).toBe("@depends")
        expect(routeParam.dependency).toBe(dependency)
    })
})

describe("function resolveArgs", () => {
    test("[invocation]: return value success empty", async () => {
        const parseInfo1 = await resolveArgs(
            {},
            {
                baseArgs: { req: new Request("http://a.co/notimportant") },
                later: nullLater,
            }
        )
        expect(parseInfo1.errors).toStrictEqual([])
        expect(parseInfo1.args).toStrictEqual({})
        expect(parseInfo1.success).toBe(true)
    })

    test("[invocation]: return value success flat", async () => {
        const parseInfo1 = await resolveArgs(
            {
                pPath: Path(z.number()),
                pPathEnum: Path(z.enum(["yellow", "green", "blue"])),
                pQuery: Query(z.boolean()),
                pQueryNenum: Query(z.nativeEnum({ ok: 200, bad: 400, error: 500 })),
                pQueryArr: Query(z.number().array()),
                pQueryArrOpt: Query(z.number().array().optional()),
                pQueryArrDef: Query(z.number().array().default([])),
                pQueryArrNenum: Query(z.nativeEnum({ ok: 200, bad: 400, error: 500 }).array()),
                p_Header: Header(z.string()),
                pCookie: Cookie(z.string(), { altName: "pAltCookie" }),
                pBody: Body(z.object({ key: z.string(), value: z.number() })),
            },
            {
                baseArgs: {
                    req: new Request("http://a.co/notimportant", {
                        method: "POST",
                        headers: { "P-Header": "htext" },
                        body: JSON.stringify({ key: "mykey", value: 12 }),
                    }),
                },
                later: nullLater,
                rawParameters: {
                    params: { pPath: "23", pPathEnum: "blue" },
                    queries: {
                        pQuery: ["true"],
                        pQueryNenum: ["200"],
                        pQueryArr: ["5", "9"],
                        pQueryArrNenum: ["200", "500"],
                    },
                    cookies: { pAltCookie: "ctext" },
                },
            }
        )
        expect(parseInfo1.errors).toStrictEqual([])
        expect(parseInfo1.args).toStrictEqual({
            pPath: 23,
            pPathEnum: "blue",
            pQuery: true,
            pQueryNenum: 200,
            pQueryArr: [5, 9],
            pQueryArrOpt: undefined,
            pQueryArrDef: [],
            pQueryArrNenum: [200, 500],
            p_Header: "htext",
            pCookie: "ctext",
            pBody: { key: "mykey", value: 12 },
        })
        expect(parseInfo1.success).toBe(true)
    })

    test("[invocation]: return value success body json", async () => {
        const parseInfo1 = await resolveArgs(
            {
                pBody: Body(z.object({ key: z.string(), value: z.number() })),
            },
            {
                baseArgs: {
                    req: new Request("http://a.co/notimportant", {
                        method: "POST",
                        body: JSON.stringify({ key: "mykey", value: 12 }),
                    }),
                },
                later: nullLater,
            }
        )
        expect(parseInfo1.errors).toStrictEqual([])
        expect(parseInfo1.args).toStrictEqual({
            pBody: { key: "mykey", value: 12 },
        })
        expect(parseInfo1.success).toBe(true)
    })

    test("[invocation]: return value success body text", async () => {
        const parseInfo1 = await resolveArgs(
            {
                pBody: Body(String),
            },
            {
                baseArgs: {
                    req: new Request("http://a.co/notimportant", {
                        method: "POST",
                        body: "mysampletext",
                    }),
                },
                later: nullLater,
            }
        )
        expect(parseInfo1.errors).toStrictEqual([])
        expect(parseInfo1.args).toStrictEqual({
            pBody: "mysampletext",
        })
        expect(parseInfo1.success).toBe(true)
    })

    test("[invocation]: return value success body blob", async () => {
        const parseInfo1 = await resolveArgs(
            {
                pBody: Body(Blob),
            },
            {
                baseArgs: {
                    req: new Request("http://a.co/notimportant", {
                        method: "POST",
                        body: "mysampletext",
                    }),
                },
                later: nullLater,
            }
        )
        expect(parseInfo1.errors).toStrictEqual([])
        expect(await parseInfo1.args.pBody.text()).toBe("mysampletext")
        expect(parseInfo1.success).toBe(true)
    })

    test("[invocation]: return value success body stream", async () => {
        const parseInfo1 = await resolveArgs(
            {
                pBody: Body(ReadableStream),
            },
            {
                baseArgs: {
                    req: new Request("http://a.co/notimportant", {
                        method: "POST",
                        body: "mysampletext",
                    }),
                },
                later: nullLater,
            }
        )
        expect(parseInfo1.errors).toStrictEqual([])
        expect(parseInfo1.args.pBody).toBeInstanceOf(ReadableStream)
        expect(parseInfo1.success).toBe(true)
    })

    test("[invocation]: return value success optional", async () => {
        const parseInfo1 = await resolveArgs(
            {
                pPath: Path(z.number()),
                pQuery: Query(z.boolean().optional()),
            },
            {
                baseArgs: {
                    req: new Request("http://a.co/notimportant", {
                        method: "POST",
                        body: JSON.stringify({ key: "mykey", value: 12 }),
                        headers: { "P-Header": "htext" },
                    }),
                },
                later: nullLater,
                rawParameters: {
                    params: { pPath: "23" },
                },
            }
        )
        expect(parseInfo1.errors).toStrictEqual([])
        expect(parseInfo1.args).toStrictEqual({ pPath: 23, pQuery: undefined })
        expect(parseInfo1.success).toBe(true)
    })

    test("[invocation]: return value success default", async () => {
        const parseInfo1 = await resolveArgs(
            {
                pPath: Path(z.number()),
                pQuery: Query(z.boolean().default(true)),
            },
            {
                baseArgs: {
                    req: new Request("http://a.co/notimportant", {
                        method: "POST",
                        body: JSON.stringify({ key: "mykey", value: 12 }),
                        headers: { "P-Header": "htext" },
                    }),
                },
                later: nullLater,
                rawParameters: {
                    params: { pPath: "23" },
                },
            }
        )
        expect(parseInfo1.errors).toStrictEqual([])
        expect(parseInfo1.args).toStrictEqual({ pPath: 23, pQuery: true })
        expect(parseInfo1.success).toBe(true)
    })

    test("[invocation]: return value success depended", async () => {
        const dependency1 = new Dependency({
            parameters: {
                p_Header: Header(z.string()),
                pCookie: Cookie(z.string(), { altName: "pAltCookie" }),
            },
            handle: ({ p_Header, pCookie }) => p_Header + pCookie,
        })
        const parseInfo1 = await resolveArgs(
            {
                pPath: Path(z.number()),
                pQuery: Query(z.boolean()),
                pQueryArr: Query(z.number().array()),
                pQueryArrOpt: Query(z.number().array().optional()),
                pBody: Body(z.object({ key: z.string(), value: z.number() })),
                pDepend: Depends(dependency1),
            },
            {
                baseArgs: {
                    req: new Request("http://a.co/notimportant", {
                        method: "POST",
                        headers: { "P-Header": "htext" },
                        body: JSON.stringify({ key: "mykey", value: 12 }),
                    }),
                },
                later: nullLater,
                rawParameters: {
                    params: { pPath: "23" },
                    queries: { pQuery: ["true"], pQueryArr: ["5", "9"], pQueryArrOpt: ["1", "2"] },
                    cookies: { pAltCookie: "ctext" },
                },
            }
        )
        expect(parseInfo1.errors).toStrictEqual([])
        expect(parseInfo1.args).toStrictEqual({
            pPath: 23,
            pQuery: true,
            pQueryArr: [5, 9],
            pQueryArrOpt: [1, 2],
            pDepend: "htextctext",
            pBody: { key: "mykey", value: 12 },
            p_Header: "htext",
            pCookie: "ctext",
        })
        expect(parseInfo1.success).toBe(true)
    })

    test("[invocation]: return value success async depended", async () => {
        const dependency1 = new Dependency({
            parameters: {
                p_Header: Header(z.string()),
                pCookie: Cookie(z.string(), { altName: "pAltCookie" }),
            },
            handle: async ({ p_Header, pCookie }) => p_Header + pCookie,
        })
        const parseInfo1 = await resolveArgs(
            {
                pPath: Path(z.number()),
                pDepend: Depends(dependency1),
            },
            {
                baseArgs: {
                    req: new Request("http://a.co/notimportant", {
                        headers: { "P-Header": "htext" },
                    }),
                },
                later: nullLater,
                rawParameters: {
                    params: { pPath: "23" },
                    cookies: { pAltCookie: "ctext" },
                },
            }
        )
        expect(parseInfo1.errors).toStrictEqual([])
        expect(parseInfo1.args).toStrictEqual({
            pPath: 23,
            pDepend: "htextctext",
            p_Header: "htext",
            pCookie: "ctext",
        })
        expect(parseInfo1.success).toBe(true)
    })

    test("[invocation]: return value success depended later", async () => {
        let flag = false
        const [resolve, later] = createResolveLater()
        const dependency1 = new Dependency({
            parameters: {
                p_Header: Header(z.string()),
                pCookie: Cookie(z.string(), { altName: "pAltCookie" }),
            },
            handle: async ({ p_Header, pCookie }, later) => {
                later(() => (flag = true))
                return p_Header + pCookie
            },
        })
        const parseInfo1 = await resolveArgs(
            {
                pPath: Path(z.number()),
                pDepend: Depends(dependency1),
            },
            {
                baseArgs: {
                    req: new Request("http://a.co/notimportant", {
                        headers: { "P-Header": "htext" },
                    }),
                },
                later: later,
                rawParameters: {
                    params: { pPath: "23" },
                    cookies: { pAltCookie: "ctext" },
                },
            }
        )
        expect(parseInfo1.errors).toStrictEqual([])
        expect(parseInfo1.args).toStrictEqual({
            pPath: 23,
            pDepend: "htextctext",
            p_Header: "htext",
            pCookie: "ctext",
        })
        expect(parseInfo1.success).toBe(true)

        expect(flag).toBe(false)
        resolve(new Response(""))
        await new Promise((r) => setTimeout(r, 10))
        expect(flag).toBe(true)
    })

    test("[invocation]: return value fail invalid body json", async () => {
        const parseInfo1 = await resolveArgs(
            {
                pBody: Body(z.object({ key: z.string(), value: z.number() })),
            },
            {
                baseArgs: {
                    req: new Request("http://a.co/notimportant", {
                        method: "POST",
                        body: `{ key: "mykey", value: 12, }`,
                    }),
                },
                later: nullLater,
            }
        )
        expect(parseInfo1.errors.length).toBe(1)
        expect(parseInfo1.success).toBe(false)
    })

    test("[invocation]: return value fail flat", async () => {
        const parseInfo1 = await resolveArgs(
            {
                pPath: Path(z.number()),
                pBody: Body(z.object({ key: z.string(), value: z.number() })),
            },
            {
                baseArgs: {
                    req: new Request("http://a.co/notimportant", {
                        method: "POST",
                        body: JSON.stringify({ key: "mykey", value: "12" }),
                    }),
                },
                later: nullLater,
                rawParameters: {
                    params: { pPath: "23" },
                },
            }
        )
        expect(parseInfo1.errors.length).toBe(1)
        expect(parseInfo1.success).toBe(false)

        const parseInfo2 = await resolveArgs(
            {
                pPath: Path(z.number()),
                pBody: Body(z.object({ key: z.string(), value: z.number() })),
            },
            {
                baseArgs: {
                    req: new Request("http://a.co/notimportant", {
                        method: "POST",
                        body: JSON.stringify({ key: "mykey", value: "12" }),
                    }),
                },
                rawParameters: {
                    params: { pPath: "abc" },
                },
                later: nullLater,
            }
        )
        expect(parseInfo2.errors.length).toBe(2)
        expect(parseInfo2.success).toBe(false)
    })

    test("[invocation]: return value fail depends", async () => {
        const dependency1 = new Dependency({
            parameters: {
                p_Header: Header(z.string().startsWith("notgonnapass")),
                pCookie: Cookie(z.string(), { altName: "pAltCookie" }),
            },
            handle: ({ p_Header, pCookie }) => p_Header + pCookie,
        })
        const parseInfo1 = await resolveArgs(
            {
                pPath: Path(z.number()),
                pBody: Body(z.object({ key: z.string(), value: z.number() })),
                pDepend: Depends(dependency1),
            },
            {
                baseArgs: {
                    req: new Request("http://a.co/notimportant", {
                        method: "POST",
                        body: JSON.stringify({ key: "mykey", value: 12 }),
                        headers: { "P-Header": "htext" },
                    }),
                },
                rawParameters: {
                    params: { pPath: "23" },
                    cookies: { pAltCookie: "ctext" },
                },
                later: nullLater,
            }
        )
        expect(parseInfo1.errors.length).toBe(1)
        expect(parseInfo1.success).toBe(false)
    })

    test("[invocation]: return value fail required", async () => {
        const parseInfo1 = await resolveArgs(
            {
                pPath: Path(z.number()),
                pQuery: Query(z.boolean()),
            },
            {
                baseArgs: {
                    req: new Request("http://a.co/notimportant", {
                        method: "POST",
                        body: JSON.stringify({ key: "mykey", value: 12 }),
                        headers: { "P-Header": "htext" },
                    }),
                },
                rawParameters: {
                    params: { pPath: "23" },
                },
                later: nullLater,
            }
        )
        expect(parseInfo1.errors.length).toBe(1)
        expect(parseInfo1.success).toBe(false)
    })

    test("[invocation]: return value success nested depends", async () => {
        const dependency1 = new Dependency({
            parameters: {
                p_Header: Header(z.string()),
            },
            handle: ({ p_Header }) => ({ p_Header }),
        })
        const dependency2 = new Dependency({
            parameters: {
                pQuery: Query(z.boolean()),
                pDep1: Depends(dependency1),
            },
            handle: ({ pQuery, pDep1, p_Header }) => ({ pQuery, pDep1, p_Header }),
        })
        const dependency3 = new Dependency({
            parameters: {
                pCookie: Cookie(z.string(), { altName: "pAltCookie" }),
                pDep2: Depends(dependency2),
            },
            handle: ({ pQuery, pDep1, p_Header, pCookie, pDep2 }) => ({
                pQuery,
                pDep1,
                p_Header,
                pCookie,
                pDep2,
            }),
        })
        const parseInfo1 = await resolveArgs(
            {
                pDep3: Depends(dependency3),
                pPath: Path(z.number()),
            },
            {
                baseArgs: {
                    req: new Request("http://a.co/notimportant", {
                        method: "POST",
                        headers: { "P-Header": "htext" },
                    }),
                },
                rawParameters: {
                    params: { pPath: "23" },
                    queries: { pQuery: ["true"] },
                    cookies: { pAltCookie: "ctext" },
                },
                later: nullLater,
            }
        )
        expect(parseInfo1.errors.length).toBe(0)
        expect(parseInfo1.success).toBe(true)
        expect(parseInfo1.args).toStrictEqual({
            pPath: 23,
            pDep2: {
                pQuery: true,
                pDep1: { p_Header: "htext" },
                p_Header: "htext",
            },
            p_Header: "htext",
            pQuery: true,
            pDep1: { p_Header: "htext" },
            pDep3: {
                pQuery: true,
                pDep1: { p_Header: "htext" },
                pCookie: "ctext",
                pDep2: {
                    pQuery: true,
                    pDep1: { p_Header: "htext" },
                    p_Header: "htext",
                },
                p_Header: "htext",
            },
            pCookie: "ctext",
        })
    })

    test("[invocation]: return value success repeated depends", async () => {
        const dependency1 = new Dependency({
            parameters: {
                p_Header: Header(z.string()),
            },
            handle: ({ p_Header }) => ({ p_Header }),
        })
        const dependency2 = new Dependency({
            parameters: {
                pQuery: Query(z.boolean()),
                pDep1: Depends(dependency1),
            },
            handle: ({ pQuery, pDep1, p_Header }) => ({ pQuery, pDep1, p_Header }),
        })
        const dependency3 = new Dependency({
            parameters: {
                pCookie: Cookie(z.string(), { altName: "pAltCookie" }),
                pDep2: Depends(dependency2),
            },
            handle: ({ pQuery, pDep1, p_Header, pCookie, pDep2 }) => ({
                pQuery,
                pDep1,
                p_Header,
                pCookie,
                pDep2,
            }),
        })
        const parseInfo1 = await resolveArgs(
            {
                pDep3: Depends(dependency3),
                pPath: Path(z.number()),
            },
            {
                baseArgs: {
                    req: new Request("http://a.co/notimportant", {
                        method: "POST",
                        headers: { "P-Header": "htext" },
                    }),
                },
                rawParameters: {
                    params: { pPath: "23" },
                    queries: { pQuery: ["true"] },
                    cookies: { pAltCookie: "ctext" },
                },
                later: nullLater,
            }
        )
        expect(parseInfo1.errors.length).toBe(0)
        expect(parseInfo1.success).toBe(true)
        expect(parseInfo1.args).toStrictEqual({
            pPath: 23,
            pDep2: {
                pQuery: true,
                pDep1: { p_Header: "htext" },
                p_Header: "htext",
            },
            p_Header: "htext",
            pQuery: true,
            pDep1: { p_Header: "htext" },
            pDep3: {
                pQuery: true,
                pDep1: { p_Header: "htext" },
                pCookie: "ctext",
                pDep2: {
                    pQuery: true,
                    pDep1: { p_Header: "htext" },
                    p_Header: "htext",
                },
                p_Header: "htext",
            },
            pCookie: "ctext",
        })
    })
})

describe("function Responds", () => {
    test("[invocation]: return value simple", () => {
        expect(Responds(z.object({})).content).toBeTruthy()
        expect(Responds(ReadableStream).content).toBeTruthy()
        expect(Responds(Blob).content).toBeTruthy()
        expect(Responds(String).content).toBeTruthy()
    })
})

describe("function parseCookie", () => {
    test("[invocation]: return value null", () => {
        expect(parseCookie("")).toStrictEqual({})
        expect(parseCookie(undefined)).toStrictEqual({})
        expect(parseCookie(null)).toStrictEqual({})
        expect(parseCookie("HttpOnly")).toStrictEqual({})
    })
    test("[invocation]: return value simple", () => {
        expect(parseCookie("a=1; b=2")).toStrictEqual({ a: "1", b: "2" })
        expect(parseCookie(" a = 1 ; b = 2 ")).toStrictEqual({ a: "1", b: "2" })
        expect(parseCookie("a=1; b=; c=3")).toStrictEqual({ a: "1", b: "", c: "3" })
        expect(parseCookie("a=1; b; c=3")).toStrictEqual({ a: "1", c: "3" })
        expect(parseCookie("a=1; a=2")).toStrictEqual({ a: "2" })
        expect(parseCookie("a=")).toStrictEqual({ a: "" })
        expect(parseCookie("a")).toStrictEqual({})
    })
    test("[invocation]: return value quoted", () => {
        expect(parseCookie('a="1"; b="2"')).toStrictEqual({ a: "1", b: "2" })
        expect(parseCookie(' a = "1" ; b = "fisg fih s jog" ')).toStrictEqual({
            a: "1",
            b: "fisg fih s jog",
        })
        expect(parseCookie('a="1"; b=""; c="3"')).toStrictEqual({ a: "1", b: "", c: "3" })
        expect(parseCookie('a=1; b; c="3"')).toStrictEqual({ a: "1", c: "3" })
    })
    test("[invocation]: return value advanced", () => {
        expect(parseCookie("a=1=2=3; b=2; c=3=4=5=6")).toStrictEqual({
            a: "1=2=3",
            b: "2",
            c: "3=4=5=6",
        })
        expect(parseCookie("a==1; b===2; c====3")).toStrictEqual({ a: "=1", b: "==2", c: "===3" })
        expect(parseCookie("a=%3B%20%3D%20%25; b=%7B%7D")).toStrictEqual({ a: "; = %", b: "{}" })
    })
})
