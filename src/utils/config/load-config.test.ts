import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";

import { CONFIG_FILE_NAME } from "../../constants";
import { getConfigPaths } from "./get-config-paths";
import { clearConfigCache, loadConfig } from "./load-config";
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

	const localConfigPath = `/test/project/.opencode/${CONFIG_FILE_NAME}`;
	const userConfigPath = `/home/user/.config/opencode/${CONFIG_FILE_NAME}`;

	beforeEach(() => {
		originalConsoleWarn = console.warn;
		originalGetConfigPaths = getConfigPaths;
		originalLoadConfigFile = loadConfigFile;
		originalMergeConfigs = mergeConfigs;

		console.warn = mock();
		mockGetConfigPaths = mock(() => ({
			local: localConfigPath,
			user: userConfigPath,
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
		clearConfigCache();
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
		expect(mockLoadConfigFile).toHaveBeenCalledWith(userConfigPath);
		expect(mockLoadConfigFile).toHaveBeenCalledWith(localConfigPath);
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

	test("should return cached config on subsequent calls", async () => {
		const result1 = await loadConfig("cwd");
		const result2 = await loadConfig("cwd");

		expect(result1).toEqual(result2);
		expect(mockGetConfigPaths).toHaveBeenCalledTimes(1);
		expect(mockLoadConfigFile).toHaveBeenCalledTimes(2); // user + local
		expect(mockMergeConfigs).toHaveBeenCalledTimes(1);
	});

	test("should run full process for different cwds", async () => {
		await loadConfig("cwd");
		await loadConfig("other-cwd");

		expect(mockGetConfigPaths).toHaveBeenCalledWith("cwd");
		expect(mockGetConfigPaths).toHaveBeenCalledWith("other-cwd");
		expect(mockLoadConfigFile).toHaveBeenCalledTimes(4);
		expect(mockMergeConfigs).toHaveBeenCalledTimes(2);
	});

	test("should run full process when cache is cleared", async () => {
		await loadConfig("cwd");
		clearConfigCache();
		await loadConfig("cwd");

		expect(mockGetConfigPaths).toHaveBeenCalledWith("cwd");
		expect(mockGetConfigPaths).toHaveBeenCalledTimes(2);
		expect(mockLoadConfigFile).toHaveBeenCalledTimes(4);
		expect(mockMergeConfigs).toHaveBeenCalledTimes(2);
	});
});
