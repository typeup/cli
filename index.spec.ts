import { execFileSync } from "node:child_process"
import { existsSync, mkdtempSync, rmSync, statSync, symlinkSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { fileURLToPath } from "node:url"

import { Program } from "./index"

const workspaceRoot = fileURLToPath(new URL(".", import.meta.url))
const distEntry = fileURLToPath(new URL("./dist/index.js", import.meta.url))

describe("command line", () => {
	beforeAll(() => {
		execFileSync("npm", ["run", "build"], { cwd: workspaceRoot, stdio: "pipe" })
	})

	it("version", async () => {
		expect(existsSync(distEntry)).toBe(true)
		expect(statSync(distEntry).mode & 0o111).not.toBe(0)

		const output = execFileSync("node", [distEntry, "version"], { cwd: workspaceRoot, encoding: "utf8", stdio: "pipe" })

		expect(output.trim()).toBe(`TypeUp ${new Program(["node", "typeup"]).getVersion()}`)
	})

	it("version through symlinked bin path", async () => {
		const tempDirectory = mkdtempSync(join(tmpdir(), "typeup-cli-"))
		const symlinkPath = join(tempDirectory, "typeup")

		try {
			symlinkSync(distEntry, symlinkPath)

			const output = execFileSync("node", [symlinkPath, "version"], {
				cwd: workspaceRoot,
				encoding: "utf8",
				stdio: "pipe"
			})

			expect(output.trim()).toBe(`TypeUp ${new Program(["node", "typeup"]).getVersion()}`)
		} finally {
			rmSync(tempDirectory, { force: true, recursive: true })
		}
	})
})
