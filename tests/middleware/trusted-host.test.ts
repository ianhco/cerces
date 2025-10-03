import { createTrustedHostMiddleware } from "../../src/middleware/trusted-host"

describe("function createTrustedHostMiddleware", () => {
    test("[invocation]: return value", () => {
        const middleware = createTrustedHostMiddleware(["example.com"])
        expect(middleware.name).toBe("TrustedHostMiddleware")
    })

    const middleware = createTrustedHostMiddleware(["example.com", "*.example.com"])
    const next = async () => new Response("sample")

    test("[invocation]: handle return value success", async () => {
        const response1 = await middleware.handle(
            {
                req: new Request("http://example.com/path", {
                    headers: { host: "example.com" },
                }),
            },
            next
        )
        expect(response1.status).toBe(200)
        expect(await response1.text()).toBe("sample")

        const response2 = await middleware.handle(
            {
                req: new Request("http://sub.example.com/path", {
                    headers: { host: "sub.example.com" },
                }),
            },
            next
        )
        expect(response2.status).toBe(200)
        expect(await response2.text()).toBe("sample")

        const response3 = await middleware.handle(
            {
                req: new Request("http://a.b.example.com/path", {
                    headers: { host: "a.b.example.com" },
                }),
            },
            next
        )
        expect(response3.status).toBe(200)
        expect(await response3.text()).toBe("sample")

        const response4 = await middleware.handle(
            {
                req: new Request("http://example.com:8080/path", {
                    headers: { host: "example.com:8080" },
                }),
            },
            next
        )
        expect(response4.status).toBe(200)
        expect(await response4.text()).toBe("sample")
    })

    test("[invocation]: handle return value fail", async () => {
        const response1 = await middleware.handle(
            {
                req: new Request("http://bad.com/path", {
                    headers: { host: "bad.com" },
                }),
            },
            next
        )
        expect(response1.status).toBe(403)
        const body1 = await response1.json()
        expect(body1.detail).toBe("Forbidden: Host not allowed")

        const response2 = await middleware.handle(
            {
                req: new Request("http://example.com/path"),
            },
            next
        )
        expect(response2.status).toBe(400)
        const body2 = await response2.json()
        expect(body2.detail).toBe("Host header is missing")
    })
})
