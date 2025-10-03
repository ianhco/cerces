/**
 * Main entry point for the library, re-exporting all core functionalities.
 * Also extends Zod with OpenAPI capabilities if not already extended.
 */
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi"
import { z } from "zod"

if (z.string().openapi === undefined) {
    extendZodWithOpenApi(z)
}

export * from "./core"
export * from "./parameters"
export * from "./responses"
