import { HTMLResponse, JSONResponse, PlainTextResponse } from "../src/responses"

describe("class JSONResponse", () => {
    test("[constructor]: operational equality to Response.json", async () => {
        const testData = { data: [1, 2] }
        expect(new JSONResponse(testData) instanceof Response).toBe(true)
        expect(await new JSONResponse(testData).json()).toMatchObject(
            await Response.json(testData).json()
        )
        expect(new JSONResponse(testData).headers.get("content-type")).toBe(
            Response.json(testData).headers.get("content-type")?.replace(/;charset=utf-8/, "")
        )
    })

    test("[constructor]: body and headers mutation", async () => {
        const testData = { data: [1, 2] }
        expect(await new JSONResponse(testData).text()).toBe('{"data":[1,2]}')
        expect([...new JSONResponse(testData).headers.entries()]).toStrictEqual([
            ["content-type", "application/json"],
        ])
    })
})

describe("class HTMLResponse", () => {
    test("[constructor]: body and headers mutation", async () => {
        const testData = "<html><body></body></html>"
        expect(new HTMLResponse(testData) instanceof Response).toBe(true)
        expect(await new HTMLResponse(testData).text()).toBe(testData)
        expect([...new HTMLResponse(testData).headers.entries()]).toStrictEqual([
            ["content-type", "text/html;charset=utf-8"],
        ])
    })
})

describe("class PlainTextResponse", () => {
    test("[constructor]: body and headers mutation", async () => {
        const testData = "Simple text"
        expect(new PlainTextResponse(testData) instanceof Response).toBe(true)
        expect(await new PlainTextResponse(testData).text()).toBe(testData)
        expect([...new PlainTextResponse(testData).headers.entries()]).toStrictEqual([
            ["content-type", "text/plain;charset=utf-8"],
        ])
    })
})
