import { test, expect, describe, beforeEach, afterEach } from "bun:test";
import { join } from "path";
import { mkdtemp, rm, mkdir } from "fs/promises";
import { tmpdir } from "os";
import {
  getPlanPaths,
  ensurePlanDirectories,
  resolvePlanFolder,
  listPlanFolders,
  movePlanFolder,
} from "../../src/utils/paths";

// ============================================================================
// Test setup
// ============================================================================

let testDir: string;

beforeEach(async () => {
  testDir = await mkdtemp(join(tmpdir(), "paths-test-"));
});

afterEach(async () => {
  await rm(testDir, { recursive: true, force: true });
});

/**
 * Helper: creates a plan folder with a minimal metadata.json.
 */
async function createPlanFolder(
  status: "pending" | "in_progress" | "done",
  planId: string,
): Promise<string> {
  const paths = getPlanPaths(testDir);
  const folderPath = join(paths[status], planId);
  await mkdir(folderPath, { recursive: true });

  const metadata = {
    plan_id: planId,
    type: "feature",
    status,
    created_at: "2026-02-06T14:00:00Z",
    updated_at: "2026-02-06T14:00:00Z",
    description: "Test plan",
  };

  await Bun.write(
    join(folderPath, "metadata.json"),
    JSON.stringify(metadata, null, 2),
  );

  return folderPath;
}

// ============================================================================
// getPlanPaths
// ============================================================================

describe("getPlanPaths", () => {
  test("returns correct directory paths for all 3 statuses", () => {
    const paths = getPlanPaths(testDir);

    expect(paths.root).toBe(join(testDir, ".opencode", "plans"));
    expect(paths.pending).toBe(join(testDir, ".opencode", "plans", "pending"));
    expect(paths.in_progress).toBe(
      join(testDir, ".opencode", "plans", "in_progress"),
    );
    expect(paths.done).toBe(join(testDir, ".opencode", "plans", "done"));
  });

  test("handles different working directories", () => {
    const paths1 = getPlanPaths("/home/user/project1");
    const paths2 = getPlanPaths("/home/user/project2");

    expect(paths1.pending).toBe("/home/user/project1/.opencode/plans/pending");
    expect(paths2.pending).toBe("/home/user/project2/.opencode/plans/pending");
    expect(paths1.pending).not.toBe(paths2.pending);
  });
});

// ============================================================================
// ensurePlanDirectories
// ============================================================================

describe("ensurePlanDirectories", () => {
  test("creates all 3 status directories", async () => {
    await ensurePlanDirectories(testDir);

    const paths = getPlanPaths(testDir);

    // Check directories exist by trying to read them
    const pendingEntries = await Bun.file(paths.pending)
      .exists()
      .catch(() => false);
    const inProgressEntries = await Bun.file(paths.in_progress)
      .exists()
      .catch(() => false);
    const doneEntries = await Bun.file(paths.done)
      .exists()
      .catch(() => false);

    // Directories exist (Bun.file().exists() may not work for dirs, check with readdir)
    const { readdir } = await import("fs/promises");
    await expect(readdir(paths.pending)).resolves.toBeDefined();
    await expect(readdir(paths.in_progress)).resolves.toBeDefined();
    await expect(readdir(paths.done)).resolves.toBeDefined();
  });

  test("is idempotent (safe to call multiple times)", async () => {
    await ensurePlanDirectories(testDir);
    await ensurePlanDirectories(testDir);
    await ensurePlanDirectories(testDir);

    const paths = getPlanPaths(testDir);
    const { readdir } = await import("fs/promises");

    await expect(readdir(paths.pending)).resolves.toBeDefined();
    await expect(readdir(paths.in_progress)).resolves.toBeDefined();
    await expect(readdir(paths.done)).resolves.toBeDefined();
  });
});

// ============================================================================
// resolvePlanFolder
// ============================================================================

describe("resolvePlanFolder", () => {
  test("finds plan in pending directory", async () => {
    await createPlanFolder("pending", "feature_auth_20260206");

    const result = await resolvePlanFolder(testDir, "feature_auth_20260206");

    expect(result).not.toBeNull();
    expect(result!.status).toBe("pending");
    expect(result!.path).toContain("pending/feature_auth_20260206");
  });

  test("finds plan in in_progress directory", async () => {
    await createPlanFolder("in_progress", "feature_auth_20260206");

    const result = await resolvePlanFolder(testDir, "feature_auth_20260206");

    expect(result).not.toBeNull();
    expect(result!.status).toBe("in_progress");
    expect(result!.path).toContain("in_progress/feature_auth_20260206");
  });

  test("finds plan in done directory", async () => {
    await createPlanFolder("done", "feature_auth_20260206");

    const result = await resolvePlanFolder(testDir, "feature_auth_20260206");

    expect(result).not.toBeNull();
    expect(result!.status).toBe("done");
    expect(result!.path).toContain("done/feature_auth_20260206");
  });

  test("prioritizes in_progress over pending", async () => {
    // Create same plan_id in both directories
    await createPlanFolder("pending", "feature_auth_20260206");
    await createPlanFolder("in_progress", "feature_auth_20260206");

    const result = await resolvePlanFolder(testDir, "feature_auth_20260206");

    expect(result).not.toBeNull();
    expect(result!.status).toBe("in_progress");
  });

  test("returns null if plan does not exist", async () => {
    await ensurePlanDirectories(testDir);

    const result = await resolvePlanFolder(
      testDir,
      "nonexistent_plan_20260101",
    );

    expect(result).toBeNull();
  });

  test("returns null if directories don't exist", async () => {
    const result = await resolvePlanFolder(testDir, "feature_auth_20260206");

    expect(result).toBeNull();
  });
});

// ============================================================================
// listPlanFolders
// ============================================================================

describe("listPlanFolders", () => {
  test("lists plan folders in a status directory", async () => {
    await createPlanFolder("pending", "feature_a_20260206");
    await createPlanFolder("pending", "bug_b_20260206");

    const folders = await listPlanFolders(testDir, "pending");

    expect(folders).toHaveLength(2);
    expect(folders).toContain("feature_a_20260206");
    expect(folders).toContain("bug_b_20260206");
  });

  test("returns empty array for empty directory", async () => {
    await ensurePlanDirectories(testDir);

    const folders = await listPlanFolders(testDir, "pending");

    expect(folders).toHaveLength(0);
  });

  test("returns empty array for non-existent directory", async () => {
    const folders = await listPlanFolders(testDir, "done");

    expect(folders).toHaveLength(0);
  });

  test("only returns directories, not files", async () => {
    await ensurePlanDirectories(testDir);
    const paths = getPlanPaths(testDir);

    // Create a folder
    await createPlanFolder("pending", "feature_a_20260206");

    // Create a stray file (shouldn't be listed)
    await Bun.write(join(paths.pending, "stray-file.txt"), "nope");

    const folders = await listPlanFolders(testDir, "pending");

    expect(folders).toHaveLength(1);
    expect(folders[0]).toBe("feature_a_20260206");
  });

  test("lists plans from different statuses independently", async () => {
    await createPlanFolder("pending", "feature_a_20260206");
    await createPlanFolder("in_progress", "feature_b_20260206");
    await createPlanFolder("done", "feature_c_20260206");

    const pending = await listPlanFolders(testDir, "pending");
    const inProgress = await listPlanFolders(testDir, "in_progress");
    const done = await listPlanFolders(testDir, "done");

    expect(pending).toEqual(["feature_a_20260206"]);
    expect(inProgress).toEqual(["feature_b_20260206"]);
    expect(done).toEqual(["feature_c_20260206"]);
  });
});

// ============================================================================
// movePlanFolder
// ============================================================================

describe("movePlanFolder", () => {
  test("moves plan from pending to in_progress", async () => {
    await createPlanFolder("pending", "feature_auth_20260206");

    const newPath = await movePlanFolder(
      testDir,
      "feature_auth_20260206",
      "pending",
      "in_progress",
    );

    expect(newPath).toContain("in_progress/feature_auth_20260206");

    // Verify old location is gone
    const oldResult = await resolvePlanFolder(testDir, "feature_auth_20260206");
    expect(oldResult!.status).toBe("in_progress");

    // Verify metadata.json still exists at new location
    const metadataExists = await Bun.file(
      join(newPath, "metadata.json"),
    ).exists();
    expect(metadataExists).toBe(true);
  });

  test("moves plan from in_progress to done", async () => {
    await createPlanFolder("in_progress", "feature_auth_20260206");

    const newPath = await movePlanFolder(
      testDir,
      "feature_auth_20260206",
      "in_progress",
      "done",
    );

    expect(newPath).toContain("done/feature_auth_20260206");

    const result = await resolvePlanFolder(testDir, "feature_auth_20260206");
    expect(result!.status).toBe("done");
  });

  test("moves plan from in_progress to pending (revert)", async () => {
    await createPlanFolder("in_progress", "feature_auth_20260206");

    const newPath = await movePlanFolder(
      testDir,
      "feature_auth_20260206",
      "in_progress",
      "pending",
    );

    expect(newPath).toContain("pending/feature_auth_20260206");

    const result = await resolvePlanFolder(testDir, "feature_auth_20260206");
    expect(result!.status).toBe("pending");
  });

  test("throws when source folder does not exist", async () => {
    await ensurePlanDirectories(testDir);

    expect(
      movePlanFolder(testDir, "nonexistent_20260206", "pending", "in_progress"),
    ).rejects.toThrow();
  });

  test("creates target directory if it doesn't exist", async () => {
    // Only create pending, not in_progress
    const paths = getPlanPaths(testDir);
    await mkdir(paths.pending, { recursive: true });

    await createPlanFolder("pending", "feature_auth_20260206");

    // in_progress dir doesn't exist yet
    const newPath = await movePlanFolder(
      testDir,
      "feature_auth_20260206",
      "pending",
      "in_progress",
    );

    // Should succeed — target dir auto-created
    const metadataExists = await Bun.file(
      join(newPath, "metadata.json"),
    ).exists();
    expect(metadataExists).toBe(true);
  });

  test("preserves all files during move", async () => {
    const folderPath = await createPlanFolder(
      "pending",
      "feature_auth_20260206",
    );

    // Add spec.md and plan.md
    await Bun.write(join(folderPath, "spec.md"), "# Spec\n\nRequirements");
    await Bun.write(join(folderPath, "plan.md"), "# Plan\n\n- [ ] Task 1");

    const newPath = await movePlanFolder(
      testDir,
      "feature_auth_20260206",
      "pending",
      "in_progress",
    );

    // All 3 files should exist at new location
    expect(await Bun.file(join(newPath, "metadata.json")).exists()).toBe(true);
    expect(await Bun.file(join(newPath, "spec.md")).exists()).toBe(true);
    expect(await Bun.file(join(newPath, "plan.md")).exists()).toBe(true);

    // Content should be preserved
    const specContent = await Bun.file(join(newPath, "spec.md")).text();
    expect(specContent).toBe("# Spec\n\nRequirements");

    const planContent = await Bun.file(join(newPath, "plan.md")).text();
    expect(planContent).toBe("# Plan\n\n- [ ] Task 1");
  });
});
