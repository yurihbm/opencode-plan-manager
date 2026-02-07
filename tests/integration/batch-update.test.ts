import { test, expect, beforeEach, afterEach } from "bun:test";
import { join } from "path";
import {
  createMockContext,
  setupTestDir,
  cleanupTestDir,
  initTestPlugin,
} from "../utils/test-helpers";

let testDir: string;
let plugin: any;

beforeEach(async () => {
  testDir = await setupTestDir("integration-test-batch-");
  plugin = await initTestPlugin();
});

afterEach(async () => {
  await cleanupTestDir(testDir);
});

test("Integration: Batch Update Tasks", async () => {
  const context = createMockContext(testDir);

  // 1. Create a new plan
  const createResult = await plugin.tool.plan_create.execute(
    {
      title: "Batch Update Test",
      type: "feature",
      description: "Test batch update functionality",
      spec: {
        overview: "Batch update test overview",
        functionals: ["Support batch updates"],
        nonFunctionals: ["Efficient"],
        acceptanceCriterias: ["Batch works"],
        outOfScope: ["None"],
      },
      implementation: {
        description: "Batch implementation strategy",
        phases: [
          {
            phase: "Phase 1: Foundation",
            tasks: ["Task 1", "Task 2", "Task 3"],
          },
        ],
      },
    },
    context,
  );

  const planIdMatch = createResult.match(/\*\*Plan ID:\*\* (.+)/);
  const planId = planIdMatch![1];

  // 2. Batch update tasks (Task 1 -> done, Task 2 -> in_progress)
  const batchUpdateResult = await plugin.tool.plan_update.execute(
    {
      plan_id: planId,
      status: "in_progress", // Move to in_progress as well
      taskUpdates: [
        { content: "Task 1", status: "done" },
        { content: "Task 2", status: "in_progress" },
      ],
    },
    context,
  );

  expect(batchUpdateResult).toContain("✓ Plan updated successfully");
  expect(batchUpdateResult).toContain('Task "Task 1" → done');
  expect(batchUpdateResult).toContain('Task "Task 2" → in_progress');
  expect(batchUpdateResult).toContain("pending → in_progress");

  // 3. Verify changes in file
  const readResult = await plugin.tool.plan_read.execute(
    { plan_id: planId, view: "plan" },
    context,
  );

  expect(readResult).toContain("[x] Task 1");
  expect(readResult).toContain("[~] Task 2");
  expect(readResult).toContain("[ ] Task 3");

  // 4. Test error handling (one valid, one invalid)
  const partialErrorResult = await plugin.tool.plan_update.execute(
    {
      plan_id: planId,
      taskUpdates: [
        { content: "Task 3", status: "done" },
        { content: "Non-existent Task", status: "done" },
      ],
    },
    context,
  );

  expect(partialErrorResult).toContain("✓ Plan updated successfully");
  expect(partialErrorResult).toContain('Task "Task 3" → done');
  expect(partialErrorResult).toContain("Warnings:");
  expect(partialErrorResult).toContain('Failed to update task "Non-existent Task"');

  // Verify Task 3 is done despite error
  const finalReadResult = await plugin.tool.plan_read.execute(
    { plan_id: planId, view: "plan" },
    context,
  );
  expect(finalReadResult).toContain("[x] Task 3");
});
