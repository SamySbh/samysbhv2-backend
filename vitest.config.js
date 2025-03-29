import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        include: ['**/*.spec.js'],
    },
    resolve: {
        alias: {
            '@': resolve(__dirname, './src')
        }
    }
})