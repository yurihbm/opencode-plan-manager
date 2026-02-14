import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";

import { getConfigPaths } from "./get-config-paths";
import { loadConfig } from "./load-config";
import { loadConfigFile } from "./load-config-file";
import { mergeConfigs } from "./merge-configs";

describe("loadConfig", () => {
	let originalConsoleWarn: typeof console.warn;
	let originalGetConfigPaths: typeof getConfigPaths;
	let originalLoadConfigFile: typeof loadConfigFile;
	let originalMergeConfigs: typeof mergeConfigs;

	let mockGetConfigPaths: ReturnType<typeof mock>;
	let mockLoadConfigFile: ReturnType<typeof mock>;
	let mockMergeConfigs: ReturnType<typeof mock>;

	beforeEach(() => {
		originalConsoleWarn = console.warn;
		originalGetConfigPaths = getConfigPaths;
		originalLoadConfigFile = loadConfigFile;
		originalMergeConfigs = mergeConfigs;

		console.warn = mock();
		mockGetConfigPaths = mock(() => ({
			local: "/test/project/.opencode/plan-manager.json",
			user: "/home/user/.config/opencode/plan-manager.json",
		}));
		mock.module("./get-config-paths", () => ({
			getConfigPaths: mockGetConfigPaths,
		}));

		mockLoadConfigFile = mock(() => ({
			success: true,
			config: { outputFormat: "json" },
		}));
		mock.module("./load-config-file", () => ({
			loadConfigFile: mockLoadConfigFile,
		}));

		mockMergeConfigs = mock(() => ({ outputFormat: "markdown" }));
		mock.module("./merge-configs", () => ({
			mergeConfigs: mockMergeConfigs,
		}));
	});

	afterEach(() => {
		console.warn = originalConsoleWarn;
		mock.module("./get-config-paths", () => ({
			getConfigPaths: originalGetConfigPaths,
		}));
		mock.module("./load-config-file", () => ({
			loadConfigFile: originalLoadConfigFile,
		}));
		mock.module("./merge-configs", () => ({
			mergeConfigs: originalMergeConfigs,
		}));
	});

	test("load user and local configs and merge them", async () => {
		await loadConfig("cwd");

		expect(mockGetConfigPaths).toHaveBeenCalledWith("cwd");
		expect(mockLoadConfigFile).toHaveBeenCalledWith(
			"/home/user/.config/opencode/plan-manager.json",
		);
		expect(mockLoadConfigFile).toHaveBeenCalledWith(
			"/test/project/.opencode/plan-manager.json",
		);
		expect(mockMergeConfigs).toHaveBeenCalledWith(
			{ outputFormat: "json" },
			{ outputFormat: "json" },
		);
	});

	test("should return merged config", async () => {
		const result = await loadConfig("cwd");

		expect(result).toEqual({ outputFormat: "markdown" });
	});

	test("should warn if user config has an error", async () => {
		mockLoadConfigFile.mockImplementationOnce(() => ({
			success: false,
			error: "User config error",
		}));

		await loadConfig("cwd");

		expect(console.warn).toHaveBeenCalled();
	});
});
