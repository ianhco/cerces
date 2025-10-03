<div style="text-align: center; font-size: 60px; margin: 32px 0 64px 0">
    <img src="/icon.svg" style="height: 60px; display: inline; margin-bottom: -8px; margin-right: 16px" />
    <b>Cerces</b>
</div>

## Create App

Create a new Cerces app using Bun, PNPM, or NPM.

::: code-group
```sh [bun]
bun create cerces@latest
```
```sh [pnpm]
pnpm create cerces@latest
```
```sh [npm]
npm create cerces@latest
```
:::

::: info About Templates
After executing the `create` command, you will be prompted to select from a list of available templates. These templates are provided, pre-configured, and ready-to-use.

Available templates:
```md
* bun
* cf-workers
* aws-lambda
* docker
```
:::

Now, your app is set up, `cd` into the new folder.

## Check Output

If your template supports a development server, run the local development server and open your browser at `http://localhost:{port}` (port may differ by templates).

::: code-group
```sh [bun]
bun dev
```
```sh [pnpm]
pnpm dev
```
```sh [npm]
npm run dev
```
:::

Otherwise, check the output on your deployment platform.

You will see the JSON response as:

```json
{"message":"Hello World"}
```

## Add Routes

Let's add a new route:

```ts
import { App, Path, Query } from "cerces" // [!code focus:2]
import { z } from "zod"

const app = new App({})

app.get("/items/{itemId}", { // [!code focus:9]
    parameters: {
        itemId: Path(z.number().int().min(0)),
        q: Query(z.string().optional()),
    },
    handle: ({ itemId, q }) => {
        return { itemId, q }
    },
})

export default app
```

Now check the output at `/items/42?q=somequery`:

```json
{"itemId":42,"q":"somequery"}
```

## Interactive Docs

Interactive API documentation is available at `/docs`. Provided by [Swagger UI](https://github.com/swagger-api/swagger-ui), generated from your route definitions, it allows you to **explore and test your API endpoints**.

![Swagger UI Docs](/swaggerdocs.jpg)

## Alternative Docs

Alternative static API documentation is available at `/redoc`. Provided by [ReDoc](https://github.com/Redocly/redoc), it offers a more traditional documentation layout.

![ReDoc Docs](/redocdocs.jpg)


## OpenAPI Spec

Cerces generates a "schema" for all your API using the **OpenAPI** standard for defining APIs.

A "schema" is a definition or description of something. Not the code that implements it, but just an abstract description. This schema definition includes your API paths, the possible parameters they take, etc.

The term "schema" might also refer to the shape of some data, like a JSON content. In that case, it would mean the JSON attributes, and data types they contain, etc.

If you are curious about how the raw OpenAPI schema looks, Cerces automatically generates a JSON (schema) with the descriptions of all your APIs.

You can see it directly at: `/openapi.json`.

## License

This project is licensed under the terms of the [MIT license](https://github.com/ianhco/cerces/?tab=MIT-1-ov-file#readme).
