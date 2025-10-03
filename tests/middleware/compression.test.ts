import { createCompressionMiddleware, DecompressionStream } from "../../src/middleware/compression"

describe("function createCompressionMiddleware", () => {
    test("[invocation]: return value", () => {
        const middleware = createCompressionMiddleware("gzip")
        expect(middleware.name).toBe("CompressionMiddleware")
    })

    const originalContent = "sample body for compression test"

    ;["gzip", "deflate", "deflate-raw"].forEach(format => {
        describe(`with ${format} compression`, () => {
            const middleware = createCompressionMiddleware(format as any)
            const next = async () => new Response(originalContent)

            test("[invocation]: handle return value success", async () => {
                const response = await middleware.handle(
                    {
                        req: new Request("http://example.com/path", {
                            headers: { "Accept-Encoding": format },
                        }),
                    },
                    next
                )
                expect(response.status).toBe(200)
                expect(response.headers.get("Content-Encoding")).toBe(format)
                expect(response.headers.get("Content-Length")).toBeNull()

                // Verify decompressed content
                if (response.body) {
                    const decompressionStream = new DecompressionStream(format as any)
                    const decompressedResponse = new Response(response.body.pipeThrough(decompressionStream))
                    const decompressedText = await decompressedResponse.text()
                    expect(decompressedText).toBe(originalContent)
                }
            })

            test("[invocation]: handle return value no compression", async () => {
                const response1 = await middleware.handle(
                    {
                        req: new Request("http://example.com/path", {
                            headers: { "Accept-Encoding": "other" },
                        }),
                    },
                    next
                )
                expect(response1.status).toBe(200)
                expect(response1.headers.get("Content-Encoding")).toBeNull()
                expect(await response1.text()).toBe(originalContent)

                const response2 = await middleware.handle(
                    {
                        req: new Request("http://example.com/path", {
                            headers: { "Accept-Encoding": format },
                        }),
                    },
                    async () => new Response() // no body
                )
                expect(response2.status).toBe(200)
                expect(response2.headers.get("Content-Encoding")).toBeNull()
            })
        })
    })
})