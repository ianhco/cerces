import { createCORSMiddleware } from "../../src/middleware/cors"

describe("function createCORSMiddleware", () => {
    test("[invocation]: return value", () => {
        const middleware = createCORSMiddleware({
            origin: ["http://127.0.0.1", "https://page.com"],
        })
        expect(middleware.name).toBe("CORSMiddleware")
    })

    const middleware = createCORSMiddleware({
        origin: ["http://127.0.0.1:8000", "https://page.com"],
    })
    const next = async () => new Response("sample")

    test("[invocation]: handle return value success", async () => {
        const response1 = await middleware.handle(
            {
                req: new Request("http://127.0.0.1:8000/path", {
                    headers: { Origin: "http://127.0.0.1:8000" },
                }),
            },
            next
        )
        expect(response1.status).toBe(200)
        expect(response1.headers.get("Access-Control-Allow-Origin")).toBe("http://127.0.0.1:8000")

        const response4 = await middleware.handle(
            {
                req: new Request("https://page.com/path", {
                    headers: { Origin: "https://page.com" },
                }),
            },
            next
        )
        expect(response4.status).toBe(200)
        expect(response4.headers.get("Access-Control-Allow-Origin")).toBe("https://page.com")

        const response5 = await middleware.handle(
            {
                req: new Request("https://page.com/path", {
                    method: "OPTIONS",
                    headers: { Origin: "https://page.com", "Access-Control-Request-Method": "GET" },
                }),
            },
            next
        )
        expect(response5.status).toBe(204)
        expect(response5.headers.get("Access-Control-Allow-Origin")).toBe("https://page.com")
    })

    test("[invocation]: handle return value fail", async () => {
        const response2 = await middleware.handle(
            {
                req: new Request("http://127.0.0.1:8800/path", {
                    headers: { Origin: "http://127.0.0.1:8800" },
                }),
            },
            next
        )
        expect(response2.status).toBe(200)
        expect(response2.headers.get("Access-Control-Allow-Origin")).not.toBe(
            "http://127.0.0.1:8800"
        )

        const response3 = await middleware.handle(
            {
                req: new Request("https://google.com/path", {
                    headers: { Origin: "https://google.com", "Access-Control-Request-Method": "GET" },
                }),
            },
            next
        )
        expect(response3.status).toBe(200)
        expect(response3.headers.get("Access-Control-Allow-Origin")).not.toBe("https://google.com")

        const response6 = await middleware.handle(
            {
                req: new Request("https://google.com/path", {
                    method: "OPTIONS",
                    headers: { Origin: "https://google.com", "Access-Control-Request-Method": "GET" },
                }),
            },
            next
        )
        expect(response6.status).toBe(204)
        expect(response6.headers.get("Access-Control-Allow-Origin")).not.toBe("https://google.com")
    })
})
