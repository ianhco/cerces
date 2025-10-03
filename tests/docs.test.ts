import { createRedocHTML, createSwaggerHTML } from "../src/docs"

describe("function createSwaggerHTML", () => {
    test("[invocation]: return value simple", () => {
        const html1 = createSwaggerHTML("/openapi.json")
        expect(html1.includes("<body>")).toBe(true)
        const html2 = createSwaggerHTML("/openapi.json", {
            title: "My App",
            parameters: {
                deepLinking: false,
            },
        })
        expect(html2.includes("<body>")).toBe(true)
    })
})

describe("function createRedocHTML", () => {
    test("[invocation]: return value simple", () => {
        const html1 = createRedocHTML("/openapi.json")
        expect(html1.includes("<body>")).toBe(true)
        const html2 = createRedocHTML("/openapi.json", {
            title: "My App",
        })
        expect(html2.includes("<body>")).toBe(true)
    })
})
