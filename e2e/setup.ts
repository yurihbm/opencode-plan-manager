import type { ToolContext } from "@opencode-ai/plugin";

import { mkdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

export interface TestContext {
	directory: string;
	cleanup: () => Promise<void>;
	context: ToolContext;
}

/**
 * Creates a temporary directory for testing and provides a cleanup function
 * to remove it after tests.
 *
 * @param prefix Optional prefix for the temporary directory name.
 *
 * @return An object containing the directory path, a cleanup function, and
 * a mock ToolContext.
 */
export async function createTestContext(
	prefix = "opencode-test-",
): Promise<TestContext> {
	const uniqueId = Math.random().toString(36).substring(2, 9);
	const directory = join(tmpdir(), `${prefix}${uniqueId}`);

	await mkdir(directory, { recursive: true });

	// Mock the ToolContext needed by plugin tools
	// The execute method receives (args, context) where context has directory
	const context: ToolContext = {
		directory,
	} as ToolContext;

	return {
		directory,
		context,
		cleanup: async () => {
			try {
				await rm(directory, { recursive: true, force: true });
			} catch (error) {
				console.error(`Failed to cleanup test directory ${directory}:`, error);
			}
		},
	};
}
