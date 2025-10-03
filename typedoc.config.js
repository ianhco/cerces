import { globSync } from 'fs';

/** @type {import('typedoc').TypeDocOptions} */
export default {
    entryPoints: globSync("src/**/*.ts").map(file => file.replace(/\\/g, '/')),
    out: "docs/reference",
    name: "Cerces",
    plugin: ["typedoc-plugin-markdown"],
    githubPages: false,
    readme: "none",
    entryFileName: "index",
    excludePrivate: true,
    sort: "source-order",
}