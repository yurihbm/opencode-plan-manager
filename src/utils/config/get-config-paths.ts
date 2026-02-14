import { homedir } from "node:os";
import { join } from "node:path";

/**
 * Interface for configuration file paths at both user and local levels.
 */
export interface ConfigPaths {
	/** User-level config path: ~/.config/opencode/plan-manager.json */
	user: string;

	/** Local/project-level config path: <cwd>/.opencode/plan-manager.json */
	local: string;
}

/**
 * Gets the configuration file paths for both user and local levels.
 *
 * User config is stored in the user's home directory:
 * `~/.config/opencode/plan-manager.json`
 *
 * Local config is stored in the current working directory:
 * `<cwd>/.opencode/plan-manager.json`
 *
 * @param cwd - Current working directory (project root)
 * @returns Configuration file paths
 *
 * @example
 * ```ts
 * const paths = getConfigPaths(process.cwd());
 * console.log(paths.user);  // /home/user/.config/opencode/plan-manager.json
 * console.log(paths.local); // /project/.opencode/plan-manager.json
 * ```
 */
export function getConfigPaths(cwd: string): ConfigPaths {
	return {
		user: join(homedir(), ".config", "opencode", "plan-manager.json"),
		local: join(cwd, ".opencode", "plan-manager.json"),
	};
}
