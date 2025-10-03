# App Options

The App init constructor, as well as the Router init constructor, accept various options to configure OpenAPI schema generation, and top-level behavioral settings.

## Class `App`

Main application class. Extends `Router`.

| Name | Type | Description | Default |
| :------ | :------ | :------ | :------ |
| `rootPath?` | `string` | Root path of your application, a prefix that is not seen on the application but is seen by clients, like Worker Route Patterns and Swagger. | `"/"` |
| `title?` | `string` | Title of the application (OpenAPI). | `"Cerces API"` |
| `description?` | `string` | Description of the application (OpenAPI). | `""` |
| `version?` | `string` | Version of the application (OpenAPI). | `"0.1.0"` |
| `tagsInfo?` | `TagObject`[] | List of tag descriptions used by application routes. | `[]` |
| `servers?` | `ServerObject`[] | List of connectivity information of the application (OpenAPI). | `[{ url: this.rootPath }]` |
| `contact?` | `ContactObject` | Contact info of the application (OpenAPI). | `undefined` |
| `license?` | `LicenseObject` | License info of the application (OpenAPI). | `undefined` |
| `termsOfService?` | `string` | Terms of service info of the application (OpenAPI). | `undefined` |
| `securitySchemes?` | `Record<string, SecuritySchemeObject>` | Mapping of security schemes and authentication (OpenAPI). | `undefined` |
| `security?` | `SecurityRequirementObject[]` | Array of security authentication requirements applied to all routes. | `[{ [key]: [] }]` per `keyof securitySchemes` |
| `tags?` | `string`[] | List of tags to be applied to all routes. | `[]` |
| `deprecated?` | `boolean` | Set the deprecated status to all routes. | `false` |
| `includeInSchema?` | `boolean` | Set to include or exclude all routes from the generated OpenAPI document. | `true` |
| `responses?` | `Record`\<`number`, `ResponseConfig`\> | Additional [response schemas](./responses.md#openapi-schemas) to all routes, shown in the generated OpenAPI document. | `{ 422: ... }` |
| `openapiUrl?` | ``null`` \| `string` | Route path URL for serving the OpenAPI JSON document. | `"/openapi.json"` |
| `swaggerUrl?` | ``null`` \| `string` | Route path URL for serving the Swagger interactive documentation. | `"/docs"` |
| `redocUrl?` | ``null`` \| `string` | Route path URL for serving the ReDoc alternative documentation. | `"/redoc"` |
| `defaultResponseClass?` | [`ResponseClass`](/reference/types/type-aliases/ResponseClass.md) | Default response class of all routes. | `JSONResponse` |
| `errorHandler?` | [`ErrorHandler`](/reference/types/type-aliases/ErrorHandler.md) | Exception handler when an exception or error has occurred during requests. | `baseExceptionHandler` |
| `middleware?` | [`Middleware`](/reference/middleware/classes/Middleware.md)[] | List of middleware applied to this app. | `[]` |
| `parameters?` | `GenericRouteParameters` | App-level parameters applied to all routes. | `{}` |

## Class `Router`

This class is used for structuring [big applications](./bigger-apps.md) into multiple routers that are later included in the main app.

| Name | Type | Description | Default |
| :------ | :------ | :------ | :------ |
| `base` | `Ps0` | Parent types extracted by `Base<typeof parent>()`. | - |
| `tags?` | `string`[] | List of tags to be applied to all routes. | `[]` |
| `deprecated?` | `boolean` | Set the deprecated status to all routes. | `false` |
| `includeInSchema?` | `boolean` | Set to include or exclude all routes from the generated OpenAPI document. | `true` |
| `security?` | `SecurityRequirementObject[]` | Array of security authentication requirements applied to all routes | `undefined` |
| `responses?` | `Record`\<`number`, `ResponseConfig`\> | Additional [response schemas](./responses.md#openapi-schemas) to all routes, shown in the generated OpenAPI document. | `{ 422: ... }` |
| `defaultResponseClass?` | [`ResponseClass`](/reference/types/type-aliases/ResponseClass.md) | Default response class of all routes. | `JSONResponse` |
| `middleware?` | [`Middleware`](/reference/middleware/classes/Middleware.md)[] | List of middleware applied to this router, merged when included in higher level routers. | `[]` |
| `parameters?` | `Ps1` | Router-level parameters applied to all routes. | `{}` |
