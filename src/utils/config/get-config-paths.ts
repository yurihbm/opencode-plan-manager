import { homedir } from "node:os";
import { join } from "node:path";

import { CONFIG_FILE_NAME } from "../../constants";

/**
 * Interface for configuration file paths at both user and local levels.
 */
export interface ConfigPaths {
	/** User-level config path. */
	user: string;

	/** Local/project-level config path. */
	local: string;
}

/**
 * Gets the configuration file paths for both user and local levels.
 *
 * User config is stored in the user's home directory:
 * `~/.config/opencode/<CONFIG_FILE_NAME>`
 *
 * Local config is stored in the current working directory:
 * `<cwd>/.opencode/<CONFIG_FILE_NAME>`
 *
 * @param cwd - Current working directory (project root)
 * @returns Configuration file paths
 *
 * @example
 * ```ts
 * const paths = getConfigPaths(process.cwd());
 * console.log(paths.user);  // /home/user/.config/opencode/<CONFIG_FILE_NAME>
 * console.log(paths.local); // /project/.opencode/<CONFIG_FILE_NAME>
 * ```
 */
export function getConfigPaths(cwd: string): ConfigPaths {
	return {
		user: join(homedir(), ".config", "opencode", CONFIG_FILE_NAME),
		local: join(cwd, ".opencode", CONFIG_FILE_NAME),
	};
}
