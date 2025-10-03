# Auth Schemas

There are numerous approaches to handling security, authentication and authorization when building APIs. Cerces **does not enforce restrictions on how these are implemented**, but provides utilities to better reflect on the OpenAPI schema definitions.

::: tip Intended Usage
The content of this page is only to improve OpenAPI definitions, and to enhance the automatic interactive Swagger documentation by showing an actionable **Authorize** button and ensuring the credential headers are sent using the **Try it out** feature.

![docsauthbtn](/docsauthbtn.jpg)

**It does not affect the programmatic implementation or have restrictions on authentication flows.**
:::

## Scheme Definition

Schemes can be defined on the root application under `securitySchemes`. Supported schemes:

- `apiKey`: an application specific key that can come from:
    - A query parameter.
    - A header.
    - A cookie.
- `http`: standard HTTP authentication systems, including:
    - `bearer`: a header `Authorization` (the header name cannot be changed for `http` schemes) with a value of `Bearer` plus a token. This is inherited from OAuth2.
    - HTTP `basic` authentication, like above.
    - HTTP `digest`, etc.
- `oauth2`: all the OAuth2 ways to handle security (called "flows").
    - Several of these flows are appropriate for building an OAuth 2.0 authentication provider (like Google, Facebook, Twitter, GitHub, etc):
        - `implicit`
        - `clientCredentials`
        - `authorizationCode`
- But there is one specific "flow" that can be perfectly used for handling authentication in the same application directly:
    - `password`: some next chapters will cover examples of this.
- `openIdConnect`: has a way to define how to discover OAuth2 authentication data automatically.
    - This automatic discovery is what is defined in the OpenID Connect specification.

Example definition of a simple bearer authentication scheme:

```ts
import { App } from "cerces"

const app = new App({
    // ...
    securitySchemes: { // [!code focus:6]
        bearerAuth: {
            type: "http",
            scheme: "bearer"
        }
    }
})
``` 

## Usage Declaration

After defining the schemes, routes need to declare which scheme can be accepted when receiving requests, the declaration uses OAS3.1 `SecurityRequirementObject[]` (`{[schemeKey]: scopes[]}[]`) structure. There are two ways to declare:

- **Root default** (declaring that all routes can accept specific security schemes):
    ```ts
    const app = new App({
        // ...
        securitySchemes: { // [!code focus:9]
            bearerAuth: {
                type: "http",
                scheme: "bearer"
            }
        },
        security: [
            { bearerAuth: [] }
        ]
    })
    ```
    By default, if `securitySchemes` is provided, for each `keyof securitySchemes` will generate a `{ [key]: [] }` item to `security`. Therefore:
    ```ts
    const app = new App({
        // ...
        securitySchemes: { // [!code focus:10]
            bearerAuth: {
                type: "http",
                scheme: "bearer"
            }
        },
        /* This is already implied:
        security: [
            { bearerAuth: [] }
        ]
        */
    })
    ```
    You can override this behavior by manually setting `security`.

- **Per Router** (declaring schemes accepted by all routes under a router):
    ```ts
    import { Router, Base } from "cerces"

    const router = new Router({
        base: Base<typeof app>(),
        security: [ // [!code focus:3]
            { bearerAuth: [] }
        ]
    }) 
    ```

- **Route specific** (declaring schemes accepted during route definition):
    ```ts
    app.get("/protected", {
        //...
        security: [ // [!code focus:3]
            { bearerAuth: [] }
        ],
        handle: () => "Protected content"
        //...
    })
    ```

## Examples

Defining an application that accepts a bearer token:

```ts
import { App, Header } from "cerces"
import { z } from "zod"

const app = new App({
    // ...
    securitySchemes: { // [!code focus:6]
        bearerAuth: {
            type: "http",
            scheme: "bearer"
        }
    },
})

app.get("/authed", {
    parameters: { // [!code focus:6]
        Authorization: Header(z.string().optional()),
    },
    handle: ({ Authorization }) => {
        // do something with the bearer token ...
    },
})
```

Defining an application that accepts an API key:

```ts
import { App, Header } from "cerces"
import { z } from "zod"

const app = new App({
    // ...
    securitySchemes: { // [!code focus:7]
        apiKeyAuth: {
            type: "apiKey",
            name: "X-API-Key",
            in: "header",
        }
    },
})

app.get("/authed", {
    parameters: { // [!code focus:6]
        X_API_Key: Header(z.string().optional()),
    },
    handle: ({ X_API_Key }) => {
        // do something with the api key ...
    },
})
```

::: tip Kind Reminder
The `securitySchemes` definition is only for OpenAPI definition and Swagger, it does not affect the programmatic implementation of the route, therefore, **optional**. The above route implementation is **still valid** and functional without defining `securitySchemes`, however, it might have issues when using Swagger to _Try it out_ because Swagger _may_ not send the required headers (e.g. `Authorization`) if the OpenAPI definition is incomplete.
:::


