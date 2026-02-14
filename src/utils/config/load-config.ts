import type { PluginConfig } from "../../types";

import { getConfigPaths } from "./get-config-paths";
import { ERROR_MESSAGES, loadConfigFile } from "./load-config-file";
import { mergeConfigs } from "./merge-configs";

/**
 * Loads and merges configuration from both user and local config files.
 *
 * This is the main entry point for loading configuration.
 * It orchestrates:
 * 1. Loading user config from ~/.config/opencode/plan-manager.json
 * 2. Loading local config from <cwd>/.opencode/plan-manager.json
 * 3. Merging with precedence: local > user > default
 * 4. Warning about any errors (but continuing with defaults)
 *
 * @param cwd - Current working directory (project root)
 * @returns Merged configuration with all fields populated
 *
 * @example
 * ```ts
 * const config = await loadConfig(process.cwd());
 * console.log("Output format:", config.outputFormat);
 * ```
 */
export async function loadConfig(cwd: string): Promise<PluginConfig> {
	const paths = getConfigPaths(cwd);

	// Load user config
	const userResult = await loadConfigFile(paths.user);
	if (
		!userResult.success &&
		userResult.error !== ERROR_MESSAGES.FILE_NOT_FOUND
	) {
		console.warn(
			`Warning: User config error (${paths.user}): ${userResult.error}`,
		);
	}

	// Load local config
	const localResult = await loadConfigFile(paths.local);
	if (
		!localResult.success &&
		localResult.error !== ERROR_MESSAGES.FILE_NOT_FOUND
	) {
		console.warn(
			`Warning: Local config error (${paths.local}): ${localResult.error}`,
		);
	}

	// Merge with precedence
	return mergeConfigs(localResult.config ?? {}, userResult.config ?? {});
}
