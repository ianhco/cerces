import type { APIGatewayProxyEvent, Context, APIGatewayProxyResult } from "aws-lambda"
import type { App } from "../core"

export function toWebRequest(event: APIGatewayProxyEvent): Request {
    // Headers source
    const multiHeaders = event.multiValueHeaders
    const singleHeaders = event.headers
    const headerSource = multiHeaders || singleHeaders || {}

    // Protocol
    const protoVal = headerSource["X-Forwarded-Proto"]
    const protocol =
        Array.isArray(protoVal) && protoVal.length > 0 ? protoVal[0] : (protoVal ?? "https")

    // Host
    const hostVal = headerSource.Host
    const host =
        Array.isArray(hostVal) && hostVal.length > 0 ? hostVal[0] : (hostVal ?? "localhost")

    // Path
    const path = event.path || "/"

    // Query parameters
    const multiQuery = event.multiValueQueryStringParameters
    const singleQuery = event.queryStringParameters
    const queryParams = multiQuery || singleQuery || {}
    const params = new URLSearchParams()
    for (const [key, value] of Object.entries(queryParams)) {
        if (Array.isArray(value)) {
            value.forEach((v) => params.append(key, v))
        } else if (value !== undefined) {
            params.append(key, value)
        }
    }
    const queryString = params.toString()
    const url = `${protocol}://${host}${path}${queryString ? `?${queryString}` : ""}`

    // Headers
    const headers = new Headers()
    for (const [key, value] of Object.entries(headerSource)) {
        if (Array.isArray(value)) {
            value.forEach((v) => headers.append(key, v))
        } else if (value !== undefined) {
            headers.append(key, value)
        }
    }

    // Body
    let body: BodyInit | null = null
    if (event.body) {
        if (event.isBase64Encoded) {
            body = Buffer.from(event.body, "base64")
        } else {
            body = event.body
        }
    }

    // HTTP method
    const method = event.httpMethod || "GET"

    return new Request(url, {
        method,
        headers,
        body,
    })
}

function isTextContentType(contentType: string): boolean {
    const lower = contentType.toLowerCase()
    return (
        lower.startsWith("text/") ||
        lower.startsWith("application/json") ||
        lower.startsWith("application/xml") ||
        lower.startsWith("application/javascript") ||
        lower.startsWith("application/x-www-form-urlencoded") ||
        false
    )
}

export async function toLambdaResponse(response: Response): Promise<APIGatewayProxyResult> {
    const statusCode = response.status

    // Headers
    const headersMap: { [key: string]: string[] } = {}
    response.headers.forEach((value, key) => {
        const vals = headersMap[key] || []
        vals.push(value)
        headersMap[key] = vals
    })

    let hasMulti = false
    for (const vals of Object.values(headersMap)) {
        if (vals.length > 1) {
            hasMulti = true
            break
        }
    }

    let headers: { [key: string]: string } | undefined
    let multiValueHeaders: { [key: string]: string[] } | undefined
    if (hasMulti) {
        multiValueHeaders = headersMap
    } else {
        headers = {}
        for (const [key, vals] of Object.entries(headersMap)) {
            headers[key] = vals[0]
        }
    }

    // Body
    let body: string = ""
    let isBase64Encoded = false
    if (response.body) {
        const contentType = response.headers.get("content-type") || "text/plain"
        if (isTextContentType(contentType)) {
            body = await response.text()
        } else {
            const ab = await response.arrayBuffer()
            body = Buffer.from(ab).toString("base64")
            isBase64Encoded = true
        }
    }

    return {
        statusCode,
        headers,
        multiValueHeaders,
        body,
        isBase64Encoded,
    }
}

/**
 * Creates a handler function for AWS Lambda that integrates with the provided App instance.
 * @param app The App instance to handle incoming requests.
 * @returns A handler function for AWS Lambda.
 */
export async function createHandler(app: App) {
    return async (
        event: APIGatewayProxyEvent,
        context: Context
    ): Promise<APIGatewayProxyResult> => {
        const req = toWebRequest(event)
        const res = await app.handle({ req, evt: event, ctx: context } as any)
        return toLambdaResponse(res)
    }
}
