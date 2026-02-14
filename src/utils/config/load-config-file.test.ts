import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, test } from "bun:test";

import { loadConfigFile } from "./load-config-file";

describe("loadConfigFile", () => {
	let tempDir: string;

	beforeEach(async () => {
		tempDir = await mkdtemp(join(tmpdir(), "config-test-"));
	});

	afterEach(async () => {
		await rm(tempDir, { recursive: true, force: true });
	});

	test("returns success=false when file does not exist", async () => {
		const result = await loadConfigFile(join(tempDir, "nonexistent.json"));
		expect(result.success).toBe(false);
		expect(result.error).toBe("File does not exist");
		expect(result.config).toBeUndefined();
	});

	test("loads valid config file", async () => {
		const configPath = join(tempDir, "config.json");
		await writeFile(configPath, JSON.stringify({ outputFormat: "json" }));

		const result = await loadConfigFile(configPath);
		expect(result.success).toBe(true);
		expect(result.config).toEqual({ outputFormat: "json" });
		expect(result.error).toBeUndefined();
	});

	test("handles invalid JSON", async () => {
		const configPath = join(tempDir, "config.json");
		await writeFile(configPath, "{invalid json}");

		const result = await loadConfigFile(configPath);
		expect(result.success).toBe(false);
		expect(result.error).toContain("Invalid JSON");
	});

	test("handles validation errors", async () => {
		const configPath = join(tempDir, "config.json");
		await writeFile(configPath, JSON.stringify({ outputFormat: "invalid" }));

		const result = await loadConfigFile(configPath);
		expect(result.success).toBe(false);
		expect(result.error).toContain("Validation failed");
	});

	test("accepts partial config", async () => {
		const configPath = join(tempDir, "config.json");
		await writeFile(configPath, JSON.stringify({}));

		const result = await loadConfigFile(configPath);
		expect(result.success).toBe(true);
		expect(result.config).toEqual({ outputFormat: "markdown" });
	});

	test("ignores unknown fields", async () => {
		const configPath = join(tempDir, "config.json");
		await writeFile(
			configPath,
			JSON.stringify({
				outputFormat: "toon",
				unknownField: "ignored",
			}),
		);

		const result = await loadConfigFile(configPath);
		expect(result.success).toBe(true);
		expect(result.config?.outputFormat).toBe("toon");
	});
});
