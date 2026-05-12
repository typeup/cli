#!/usr/bin/env node
import { dom } from "@typeup/dom"
import { parser } from "@typeup/parser"
import { renderer } from "@typeup/renderer"
import * as cp from "child_process"
import * as fs from "fs"
import { mendly } from "mendly/node"

import * as p from "./package.json"

export class Program {
	private defaultCommand = "html"
	constructor(private commands: string[]) {
		this.commands = this.commands.slice(2)
		if (this.commands.length == 0) {
			this.commands.push(this.defaultCommand)
			this.commands.push(".")
		}
	}
	private open(path: string | undefined): dom.Document | undefined {
		return parser.open(path, new mendly.Error.Handler.Console())
	}
	private async runHelper(command: string | undefined, commands: string[]): Promise<void> {
		switch (command) {
			case "j":
			case "json":
			case "h":
			case "html":
			case "p":
			case "pdf":
			case "t":
			case "tup":
			case "typeup":
				const path = this.commands.shift()
				const document = this.open(path)
				if (!document) console.log(`Unable to open document "${path}".`)
				else if (!document.region) console.log(`Document lacks a region "${path}".`)
				else
					switch (command) {
						case "j":
						case "json":
							console.log(document.toJson("  "))
							break
						case "h":
						case "html":
							fs.writeFileSync(
								document.region.resource.toString().replace(/\.tup$/, ".html"),
								await renderer.render(document)
							)
							break
						case "p":
						case "pdf":
							fs.writeFileSync(
								document.region.resource.toString().replace(/\.tup$/, ".pdf"),
								cp.execFileSync("prince", ["--javascript", "-", "-o", "-"], {
									input: await renderer.render(document),
									cwd: (document.region.resource || new mendly.Uri()).folder.toString()
								})
							)
							break
						case "t":
						case "tup":
						case "typeup":
							console.log(document.toString())
							break
					}
				break
			case "v":
			case "version":
				console.log("TypeUp " + this.getVersion())
				break
			case "help":
				console.log(`TypeUp CLI v${this.getVersion()}

Usage: typeup <command> [path]

Commands:
  json, j         Output document as JSON
  html, h         Convert document to HTML
  pdf, p          Convert document to PDF
  tup, typeup, t  Output document in TypeUp format
  version, v      Show version number
  help            Show this help message

Examples:
  typeup html document.tup          Convert document.tup to HTML
  typeup json                       Parse current directory as JSON
  typeup pdf ./src/file.tup         Convert file to PDF
  typeup version                    Display TypeUp version

If no command is provided, defaults to HTML conversion of current directory.`)
				break
			default:
				if (command) commands.push(command)
				command = undefined
				await this.runHelper(this.defaultCommand, commands)
				break
		}
		if (command) this.defaultCommand = command
	}
	async run(): Promise<void> {
		let command: string | undefined
		while ((command = this.commands.shift())) await this.runHelper(command, this.commands)
	}
	getVersion(): string {
		return p.version
	}
}
new Program(process.argv).run()
