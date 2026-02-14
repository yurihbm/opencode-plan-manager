import type { PluginConfig } from "../../types";

import { DEFAULT_CONFIG } from "../../constants";

/**
 * Merges configuration from multiple sources with precedence.
 *
 * Precedence (highest to lowest):
 * 1. Local config (cwd/.opencode/plan-manager.json)
 * 2. User config (~/.config/opencode/plan-manager.json)
 * 3. Default config (hardcoded defaults)
 *
 * Each level only provides values that are explicitly set.
 * Missing values are filled from lower-precedence sources.
 *
 * @param local - Local config (partial, from project)
 * @param user - User config (partial, from home directory)
 * @returns Merged config with all fields populated
 *
 * @example
 * ```ts
 * const merged = mergeConfigs(
 *   { outputFormat: "json" },  // local overrides user
 *   { outputFormat: "toon" },  // user overrides default
 * );
 * console.log(merged.outputFormat); // "json" (local wins)
 * ```
 */
export function mergeConfigs(
	local: Partial<PluginConfig>,
	user: Partial<PluginConfig>,
): PluginConfig {
	return {
		outputFormat:
			local.outputFormat ?? user.outputFormat ?? DEFAULT_CONFIG.outputFormat,
	};
}
