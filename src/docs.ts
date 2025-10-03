/**
 * Creates the HTML for the Swagger UI.
 * @param url The URL of the OpenAPI/Swagger specification.
 * @param options Optional parameters for customizing the Swagger UI.
 * @returns The HTML string for the Swagger UI.
 */
export function createSwaggerHTML(
    url: string,
    options?: {
        title?: string
        jsUrl?: string
        cssUrl?: string
        faviconUrl?: string
        parameters?: Record<string, any>
    }
): `<!DOCTYPE html>${string}</html>` {
    const defaults = {
        title: "Untitled",
        jsUrl: "https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.9.0/swagger-ui-bundle.js",
        cssUrl: "https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.9.0/swagger-ui.css",
        faviconUrl: "https://static1.smartbear.co/swagger/media/assets/swagger_fav.png",
        parameters: {},
    }
    const defaultUiParameters = {
        dom_id: "#swagger-ui",
        layout: "BaseLayout",
        deepLinking: true,
        showExtensions: true,
        showCommonExtensions: true,
    }
    options = {
        ...defaults,
        ...options,
    }
    options.parameters = {
        ...defaultUiParameters,
        ...options.parameters,
    }
    return `<!DOCTYPE html>
    <html>
    <head>
        <link type="text/css" rel="stylesheet" href="${options.cssUrl}">
        <link rel="shortcut icon" href="${options.faviconUrl}">
        <title>${options.title}</title>
    </head>
    <body>
        <div id="swagger-ui">
        </div>
        <script src="${options.jsUrl}"></script>
        <script>
        const ui = SwaggerUIBundle({
            url: '${url}',
            ${Object.entries(options.parameters)
                .map(([k, v]) => JSON.stringify(k) + ":" + JSON.stringify(v))
                .join(",\n")},
            presets: [
                SwaggerUIBundle.presets.apis,
                SwaggerUIBundle.SwaggerUIStandalonePreset
            ],
        })
        </script>
    </body>
    </html>`
}

/**
 * Creates the HTML for the ReDoc documentation.
 * @param url The URL of the OpenAPI/Swagger specification.
 * @param options Optional parameters for customizing the ReDoc documentation.
 * @returns The HTML string for the ReDoc documentation.
 */
export function createRedocHTML(
    url: string,
    options?: {
        title?: string
        jsUrl?: string
        faviconUrl?: string
    }
): `<!DOCTYPE html>${string}</html>` {
    const defaults = {
        title: "Untitled",
        jsUrl: "https://cdn.jsdelivr.net/npm/redoc@next/bundles/redoc.standalone.js",
        faviconUrl: "",
    }
    options = {
        ...defaults,
        ...options,
    }
    return `<!DOCTYPE html>
    <html>
    <head>
        <title>${options.title}</title>
        <!-- needed for adaptive design -->
        <meta charset="utf-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <link href="https://fonts.googleapis.com/css?family=Montserrat:300,400,700|Roboto:300,400,700" rel="stylesheet">
        <link rel="shortcut icon" href="${options.faviconUrl}">
        <style>
        body {
            margin: 0;
            padding: 0;
        }
        </style>
    </head>
    <body>
        <noscript>
            ReDoc requires Javascript to function. Please enable it to browse the documentation.
        </noscript>
        <redoc spec-url="${url}"></redoc>
        <script src="${options.jsUrl}"> </script>
    </body>
    </html>`
}
