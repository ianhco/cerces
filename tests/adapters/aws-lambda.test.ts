import { z } from "zod"
import type { APIGatewayProxyEvent, Context } from "aws-lambda"

import { toWebRequest, toLambdaResponse, createHandler } from "../../src/adapters/aws-lambda"
import { App, PlainTextResponse, Query } from "../../src"

describe("function toWebRequest", () => {
    test("[invocation] convert a basic GET request without query params or headers", () => {
        const event = {
            httpMethod: "GET",
            path: "/test",
            headers: {},
            multiValueHeaders: undefined,
            queryStringParameters: undefined,
            multiValueQueryStringParameters: undefined,
            body: null,
            isBase64Encoded: false,
        } as any

        const request = toWebRequest(event)

        expect(request.method).toBe("GET")
        expect(request.url).toBe("https://localhost/test")
        expect(request.headers.get("host")).toBeNull()
        expect(request.headers.get("something-else")).toBeNull()
    })

    test("[invocation] handle POST request with text body", () => {
        const event = {
            httpMethod: "POST",
            path: "/api/data",
            headers: { "content-type": "application/json" },
            body: '{"key": "value"}',
            isBase64Encoded: false,
        } as any

        const request = toWebRequest(event)

        expect(request.method).toBe("POST")
        expect(request.url).toBe("https://localhost/api/data")
        expect(request.headers.get("content-type")).toBe("application/json")
        expect(request.text()).resolves.toBe('{"key": "value"}')
    })

    test("[invocation] handle base64 encoded body", async () => {
        const body = Buffer.from("hello world").toString("base64")
        const event = {
            httpMethod: "POST",
            path: "/upload",
            headers: { "content-type": "text/plain" },
            body,
            isBase64Encoded: true,
        } as any

        const request = toWebRequest(event)

        expect(request.method).toBe("POST")
        expect(Buffer.from(await request.arrayBuffer())).toEqual(Buffer.from("hello world"))
    })

    test("[invocation] handle single-value query parameters", () => {
        const event = {
            httpMethod: "GET",
            path: "/search",
            queryStringParameters: { q: "test", limit: "10" },
            headers: {},
        } as any

        const request = toWebRequest(event)

        expect(request.url).toBe("https://localhost/search?q=test&limit=10")
    })

    test("[invocation] handle multi-value query parameters", () => {
        const event = {
            httpMethod: "GET",
            path: "/search",
            multiValueQueryStringParameters: { q: ["test", "another"], limit: ["10"] },
            headers: {},
        } as any

        const request = toWebRequest(event)

        expect(request.url).toBe("https://localhost/search?q=test&q=another&limit=10")
    })

    test("[invocation] handle single-value headers", () => {
        const event = {
            httpMethod: "GET",
            path: "/",
            headers: { "user-agent": "test-agent", accept: "application/json" },
        } as any

        const request = toWebRequest(event)

        expect(request.headers.get("user-agent")).toBe("test-agent")
        expect(request.headers.get("accept")).toBe("application/json")
    })

    test("[invocation] handle multi-value headers", () => {
        const event = {
            httpMethod: "GET",
            path: "/",
            multiValueHeaders: { "set-cookie": ["session=abc", "theme=dark"] },
        } as any

        const request = toWebRequest(event)

        expect(request.headers.get("set-cookie")).toEqual("session=abc, theme=dark")
    })

    test("[invocation] use X-Forwarded-Proto for protocol", () => {
        const event = {
            httpMethod: "GET",
            path: "/",
            headers: { "X-Forwarded-Proto": "http" },
        } as any

        const request = toWebRequest(event)

        expect(request.url.startsWith("http://")).toBe(true)
    })

    test("[invocation] use Host header for host", () => {
        const event = {
            httpMethod: "GET",
            path: "/",
            headers: { Host: "example.com" },
        } as any

        const request = toWebRequest(event)

        expect(request.url).toBe("https://example.com/")
    })

    test("[invocation] handle empty body", () => {
        const event = {
            httpMethod: "GET",
            path: "/",
            body: null,
        } as any

        const request = toWebRequest(event)

        expect(request.body).toBeNull()
    })
})

describe("function toLambdaResponse", () => {
    test("[invocation] convert a text response", async () => {
        const response = new Response("Hello World", {
            status: 200,
            headers: { "content-type": "text/plain" },
        })

        const result = await toLambdaResponse(response)

        expect(result.statusCode).toBe(200)
        expect(result.body).toBe("Hello World")
        expect(result.isBase64Encoded).toBe(false)
        expect(result.headers).toEqual({ "content-type": "text/plain" })
    })

    test("[invocation] convert a JSON response", async () => {
        const response = new Response('{"message": "ok"}', {
            status: 201,
            headers: { "content-type": "application/json" },
        })

        const result = await toLambdaResponse(response)

        expect(result.statusCode).toBe(201)
        expect(result.body).toBe('{"message": "ok"}')
        expect(result.isBase64Encoded).toBe(false)
    })

    test("[invocation] handle binary response with base64 encoding", async () => {
        const buffer = Buffer.from("binary data")
        const response = new Response(buffer, {
            status: 200,
            headers: { "content-type": "application/octet-stream" },
        })

        const result = await toLambdaResponse(response)

        expect(result.statusCode).toBe(200)
        expect(result.body).toBe(buffer.toString("base64"))
        expect(result.isBase64Encoded).toBe(true)
    })

    test("[invocation] handle empty body", async () => {
        const response = new Response(null, {
            status: 204,
            headers: {},
        })

        const result = await toLambdaResponse(response)

        expect(result.statusCode).toBe(204)
        expect(result.body).toBe("")
        expect(result.isBase64Encoded).toBe(false)
    })

    test("[invocation] handle multi-value headers", async () => {
        const response = new Response("OK", {
            status: 200,
            headers: [
                ["set-cookie", "session=123"],
                ["set-cookie", "theme=light"],
                ["content-type", "text/plain"],
            ],
        })

        const result = await toLambdaResponse(response)

        expect(result.multiValueHeaders).toEqual({
            "set-cookie": ["session=123", "theme=light"],
            "content-type": ["text/plain"],
        })
        expect(result.headers).toBeUndefined()
    })

    test("[invocation] handle single-value headers when no multiples", async () => {
        const response = new Response("OK", {
            status: 200,
            headers: { "content-type": "text/plain", "x-custom": "value" },
        })

        const result = await toLambdaResponse(response)

        expect(result.headers).toEqual({
            "content-type": "text/plain",
            "x-custom": "value",
        })
        expect(result.multiValueHeaders).toBeUndefined()
    })

    test("[invocation] handle different status codes", async () => {
        const response = new Response("Not Found", {
            status: 404,
            headers: { "content-type": "text/plain" },
        })

        const result = await toLambdaResponse(response)

        expect(result.statusCode).toBe(404)
        expect(result.body).toBe("Not Found")
    })

    test("[invocation] handle XML content type as text", async () => {
        const response = new Response("<xml></xml>", {
            status: 200,
            headers: { "content-type": "application/xml" },
        })

        const result = await toLambdaResponse(response)

        expect(result.body).toBe("<xml></xml>")
        expect(result.isBase64Encoded).toBe(false)
    })

    test("[invocation] handle form-urlencoded as text", async () => {
        const response = new Response("key=value", {
            status: 200,
            headers: { "content-type": "application/x-www-form-urlencoded" },
        })

        const result = await toLambdaResponse(response)

        expect(result.body).toBe("key=value")
        expect(result.isBase64Encoded).toBe(false)
    })
})

describe("function createHandler", () => {
    test("[invocation] should handle a GET request and return 200 response", async () => {
        const app = new App({})
        app.get("/test", {
            responseClass: PlainTextResponse,
            parameters: {},
            handle: () => "Hello World",
        })

        const handler = await createHandler(app)

        const event: APIGatewayProxyEvent = {
            httpMethod: "GET",
            path: "/test",
            headers: {},
            body: null,
            isBase64Encoded: false,
        } as any

        const context: Context = {} as any

        const result = await handler(event, context)

        expect(result.statusCode).toBe(200)
        expect(result.body).toBe("Hello World")
        expect(result.headers).toEqual({ "content-type": "text/plain;charset=utf-8" })
    })

    test("[invocation] should handle a POST request with JSON body", async () => {
        const app = new App({})
        app.post("/api/submit", {
            parameters: {
                data: Query(z.string()),
            },
            handle: ({ data }) => ({ result: "ok", received: data }),
        })

        const handler = await createHandler(app)

        const event: APIGatewayProxyEvent = {
            httpMethod: "POST",
            path: "/api/submit",
            headers: { "content-type": "application/json" },
            queryStringParameters: { data: "test" },
            body: null,
            isBase64Encoded: false,
        } as any

        const context: Context = {} as any

        const result = await handler(event, context)

        expect(result.statusCode).toBe(200)
        expect(JSON.parse(result.body)).toEqual({ result: "ok", received: "test" })
        expect(result.headers).toEqual({ "content-type": "application/json" })
    })
})
