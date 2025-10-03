import {
    createObjectPartial,
    createResolveLater,
    fixPathSlashes,
    searchParamsToQueries,
} from "../src/helpers"

describe("function createResolveLater", () => {
    test("[invocation]: return value", () => {
        const [resolve, later] = createResolveLater()
        expect(resolve).toBeInstanceOf(Function)
        expect(later).toBeInstanceOf(Function)
    })

    test("[return]: data mutation", async () => {
        const data = { num: 0 }
        const [resolve, later] = createResolveLater()
        expect(data.num).toBe(0)
        later(() => data.num++)
        later(() => data.num++)
        later((res) => {
            expect(res).toBeInstanceOf(Response)
            data.num++
        })
        resolve(new Response(""))
        await new Promise((r) => setTimeout(r, 10))
        expect(data.num).toBe(3)
    })
})

describe("function createObjectPartial", () => {
    test("[invocation]: return value", () => {
        const partial = createObjectPartial({ a: "text", b: 1 })
        expect(partial).toBeInstanceOf(Function)
    })

    test("[return]: data mutation", () => {
        const partial = createObjectPartial({ a: "text", b: 1 })
        const complete = partial({ a: "text2", c: 2 })
        expect(complete).toEqual({ a: "text2", b: 1, c: 2 })
    })
})

describe("function fixPathSlashes", () => {
    test("[invocation]: return value", () => {
        expect(fixPathSlashes("path/to/route")).toBe("/path/to/route")
        expect(fixPathSlashes("/path/to/route/")).toBe("/path/to/route")
        expect(fixPathSlashes("path/to/route/")).toBe("/path/to/route")
    })
    test("[invocation]: return value edge cases", () => {
        expect(fixPathSlashes("")).toBe("/")
        expect(fixPathSlashes("/")).toBe("/")
        expect(fixPathSlashes("//path/to/route/")).toBe("/path/to/route")
    })
})

describe("function searchParamsToQueries", () => {
    test("[invocation]: return value", () => {
        const searchParams = new URL(
            "https://google.com/path?name=myName&values=2&text=aText&values=10"
        ).searchParams
        expect(searchParamsToQueries(searchParams)).toStrictEqual({
            name: ["myName"],
            values: ["2", "10"],
            text: ["aText"],
        })
    })
})
