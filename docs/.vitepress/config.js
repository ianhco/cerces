export default {
    title: 'Cerces',
    description: 'Modern web framework for Cloudflare Workers.',
    head: [['link', { rel: 'icon', href: '/icon.svg' }]],
    cleanUrls: true,
    themeConfig: {
        logo: "/icon.svg",
        siteTitle: "Cerces",
        nav: [
            {
                text: "Guides",
                link: "/guides/first-steps.md",
                activeMatch: "/guides/*"
            },
            {
                text: "Reference",
                link: "/reference/index.md",
                activeMatch: "/reference/*"
            },
            {
                text: "Migrate -> 2.0",
                link: "/migrations/1_2-2_0.md",
                activeMatch: "/migrations/*"
            },
            {
                text: "Releases",
                link: "https://github.com/ianhco/cerces/releases"
            },
            {
                text: "Star ⭐",
                link: "https://github.com/ianhco/cerces",
                activeMatch: "."
            },
        ],
        search: {
            provider: 'local'
        },
        socialLinks: [
            {
                icon: "github",
                link: "https://github.com/ianhco/cerces"
            },
        ],
        sidebar: {
            "/guides/": {
                items: [
                    {
                        text: 'Getting Started',
                        collapsed: false,
                        items: [
                            {
                                text: "First Steps",
                                link: '/guides/first-steps.md'
                            },
                            {
                                text: "Route Parameters",
                                link: '/guides/route-params.md'
                            },
                            {
                                text: "Request Body",
                                link: '/guides/request-body.md'
                            },
                        ]
                    },
                    {
                        text: 'Advanced Usage',
                        collapsed: false,
                        items: [
                            {
                                text: "Responses",
                                link: '/guides/responses.md'
                            },
                            {
                                text: "Dependencies",
                                link: '/guides/dependencies.md'
                            },
                            {
                                text: "Middleware",
                                link: '/guides/middleware.md'
                            },
                            {
                                text: "Handling Errors",
                                link: '/guides/handling-errors.md'
                            },
                            {
                                text: "Runtime Args",
                                link: '/guides/runtime-args.md'
                            },
                            {
                                text: "Bigger Applications",
                                link: '/guides/bigger-apps.md'
                            },
                        ]
                    },
                    {
                        text: "Built-in Middleware",
                        collapsed: false,
                        items: [
                            { text: "CORS", link: "/guides/middleware/cors.md" },
                            { text: "Trusted Host", link: "/guides/middleware/trusted-host.md" },
                            { text: "Compress", link: "/guides/middleware/compress.md" },
                        ]
                    },
                    {
                        text: "Runtime Adapters",
                        collapsed: false,
                        items: [
                            { text: "AWS Lambda", link: "/guides/adapters/aws-lambda.md" },
                        ]
                    },
                    {
                        text: "Other Miscellaneous",
                        collapsed: false,
                        items: [
                            {
                                text: "App Options",
                                link: '/guides/app-options.md'
                            },
                            {
                                text: "Auth Schemas",
                                link: '/guides/auth-schemas.md'
                            },
                        ]
                    },
                ],
            },
            "/reference/": {
                items: [
                    {
                        text: "Reference",
                        collapsed: false,
                        items: [
                            { text: "index", link: "/reference/index.md" },
                            {
                                text: "adapters",
                                collapsed: true,
                                items: [
                                    { text: "aws-lambda", link: "/reference/adapters/aws-lambda/index.md" },
                                ]
                            },
                            { text: "core", link: "/reference/core/index.md" },
                            { text: "docs", link: "/reference/docs/index.md" },
                            { text: "helpers", link: "/reference/helpers/index.md" },
                            {
                                text: "middleware",
                                collapsed: true,
                                items: [
                                    { text: "compress", link: "/reference/middleware/compress/index.md" },
                                    { text: "cors", link: "/reference/middleware/cors/index.md" },
                                    { text: "trusted-host", link: "/reference/middleware/trusted-host/index.md" },
                                ]
                            },
                            { text: "parameters", link: "/reference/parameters/index.md" },
                            { text: "responses", link: "/reference/responses/index.md" },
                            { text: "routing", link: "/reference/routing/index.md" },
                            { text: "types", link: "/reference/types/index.md" },
                        ]
                    }
                ]
            },
            "/migrations/": {
                items: [
                    {
                        text: "Migrations",
                        items: [
                            { text: "Workery -> Cerces", link: "/migrations/1_2-2_0.md" },
                        ]
                    },
                    {
                        text: "Workery (pre-Cerces)",
                        items: [
                            { text: "Workery 1.1 -> 1.2", link: "/migrations/1_1-1_2.md" },
                            { text: "Workery 1.0 -> 1.1", link: "/migrations/1_0-1_1.md" },
                        ]
                    }
                ]
            }
        }
    },
}