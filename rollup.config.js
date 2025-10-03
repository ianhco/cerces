import terser from '@rollup/plugin-terser'
import typescript from '@rollup/plugin-typescript'
import { globSync } from 'fs'

export default {
    input: globSync('src/**/*.ts'),
    output: [
        {
            format: 'cjs',
            preserveModules: true,
            dir: 'dist',
            entryFileNames: '[name].cjs',
        },
        {
            format: 'es',
            preserveModules: true,
            dir: 'dist',
            entryFileNames: '[name].js',
        },
    ],
    plugins: [
        typescript({
            sourceMap: false,
            filterRoot: 'src',
            outDir: 'dist',
            exclude: ["**/*.test.ts"]
        }),
        terser(),
    ],
    external: ['zod', '@asteasolutions/zod-to-openapi'],
}
