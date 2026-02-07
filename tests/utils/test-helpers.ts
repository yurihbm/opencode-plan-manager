import { mkdtemp, rm } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { OpenPlanManagerPlugin } from "../../src/index";

/**
 * Creates a mock OpenCode context for testing tools.
 */
export const createMockContext = (directory: string): any => ({
  sessionID: "test-session",
  messageID: "test-message",
  agent: "test-agent",
  directory,
  worktree: directory,
  abort: () => {},
  metadata: {},
  ask: async () => ({ answer: "" }),
});

/**
 * Sets up a temporary directory for testing.
 * @param prefix Prefix for the temp directory name
 * @returns Path to the created temp directory
 */
export const setupTestDir = async (prefix = "integration-test-"): Promise<string> => {
  return await mkdtemp(join(tmpdir(), prefix));
};

/**
 * Cleans up a test directory.
 * @param directory Path to the directory to remove
 */
export const cleanupTestDir = async (directory: string): Promise<void> => {
  if (directory) {
    await rm(directory, { recursive: true, force: true });
  }
};

/**
 * Initializes the OpenPlanManagerPlugin with a mock client.
 * @returns Initialized plugin instance
 */
export const initTestPlugin = async (): Promise<any> => {
  return await OpenPlanManagerPlugin({
    client: {
      app: {
        log: async () => {}, // Mock logging function
      },
    },
  } as any);
};
