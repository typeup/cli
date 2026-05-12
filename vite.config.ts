/// <reference types="vitest/config" />
import { chmodSync, readFileSync } from "node:fs"
import { defineConfig } from "vite"

const packageJson = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8")) as { version: string }

export default defineConfig({
	define: { __TYPEUP_VERSION__: JSON.stringify(packageJson.version) },
	ssr: { noExternal: true },
	build: {
		copyPublicDir: false,
		emptyOutDir: true,
		minify: false,
		outDir: "dist",
		ssr: "./index.ts",
		sourcemap: true,
		target: "node24",
		rollupOptions: {
			external: [/^node:/],
			output: { banner: "#!/usr/bin/env node", entryFileNames: "index.js", format: "es" }
		}
	},
	plugins: [
		{
			name: "typeup-cli-permissions",
			writeBundle() {
				chmodSync(new URL("./dist/index.js", import.meta.url), 0o755)
			}
		}
	],
	test: {
		typecheck: { tsconfig: "./tsconfig.json" },
		coverage: {
			reporter: ["text", "json", "html"],
			enabled: false,
			cleanOnRerun: true,
			thresholds: { statements: 80, branches: 80, functions: 80, lines: 80 }
		},
		globals: true,
		include: ["**/*.spec.[tj]s"],
		testTimeout: 20000,
		isolate: false,
		exclude: ["node_modules", "dist"]
	}
})
