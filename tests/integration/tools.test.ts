import { test, expect, beforeEach, afterEach } from "bun:test";
import { join } from "path";
import {
	createMockContext,
	setupTestDir,
	cleanupTestDir,
	initTestPlugin,
} from "../utils/test-helpers";
import type { Hooks } from "@opencode-ai/plugin";

let testDir: string;
let plugin: Hooks;

beforeEach(async () => {
	testDir = await setupTestDir();
	plugin = await initTestPlugin();
});

afterEach(async () => {
	await cleanupTestDir(testDir);
});

// ============================================================================
// Full Lifecycle
// ============================================================================

test("Integration: Full workflow — create → list → read → update status → update task → done", async () => {
	const context = createMockContext(testDir);

	// 1. Create a new plan
	const createResult = await plugin.tool?.plan_create?.execute(
		{
			title: "User Authentication",
			type: "feature",
			description: "Add user authentication flow with JWT tokens",
			spec: {
				overview:
					"Add user authentication flow with JWT tokens and session management",
				functionals: ["Login endpoint", "Token refresh endpoint"],
				nonFunctionals: [
					"Must handle 1000 concurrent users",
					"Response time under 200ms",
				],
				acceptanceCriterias: [
					"Login validates credentials",
					"Token refresh extends session",
				],
				outOfScope: ["OAuth2 integration", "Social login providers"],
			},
			implementation: {
				description: "Implementation strategy for authentication flow",
				phases: [
					{
						phase: "Phase 1: Foundation",
						tasks: [
							"Create auth middleware",
							"Build login endpoint",
							"Add token refresh",
						],
					},
				],
			},
		},
		context,
	);

	expect(createResult).toContain("✓ Plan created successfully");
	expect(createResult).toContain("pending");
	expect(createResult).toContain("feature");

	// Extract plan_id from response
	const planIdMatch = createResult?.match(/\*\*Plan ID:\*\* (.+)/);
	expect(planIdMatch).not.toBeNull();
	const planId = planIdMatch![1];

	// Verify folder structure on disk
	const pendingPath = join(testDir, ".opencode", "plans", "pending", planId!);
	expect(await Bun.file(join(pendingPath, "metadata.json")).exists()).toBe(
		true,
	);
	expect(await Bun.file(join(pendingPath, "spec.md")).exists()).toBe(true);
	expect(await Bun.file(join(pendingPath, "plan.md")).exists()).toBe(true);

	// 2. List plans — should show our new plan
	const listResult = await plugin.tool?.plan_list?.execute(
		{ status: "active" },
		context,
	);

	expect(listResult).toContain(planId);
	expect(listResult).toContain("feature");
	expect(listResult).toContain("pending");

	// 3. Read the plan (full view)
	const readResult = await plugin.tool?.plan_read?.execute(
		{ plan_id: planId, view: "full" },
		context,
	);

	expect(readResult).toContain("✓ Plan loaded successfully");
	expect(readResult).toContain("Create auth middleware");
	expect(readResult).toContain("Build login endpoint");
	expect(readResult).toContain("Spec");

	// 4. Move to in_progress
	const startResult = await plugin.tool?.plan_update?.execute(
		{ plan_id: planId, status: "in_progress" },
		context,
	);

	expect(startResult).toContain("✓ Plan updated successfully");
	expect(startResult).toContain("pending → in_progress");

	// Verify folder moved
	const inProgressPath = join(
		testDir,
		".opencode",
		"plans",
		"in_progress",
		planId!,
	);
	expect(await Bun.file(join(inProgressPath, "metadata.json")).exists()).toBe(
		true,
	);
	expect(await Bun.file(join(pendingPath, "metadata.json")).exists()).toBe(
		false,
	);

	// 5. Toggle a task
	const taskResult = await plugin.tool?.plan_update?.execute(
		{
			plan_id: planId,
			taskUpdates: [{ content: "Create auth middleware", status: "done" }],
		},
		context,
	);

	expect(taskResult).toContain("✓ Plan updated successfully");
	expect(taskResult).toContain('"Create auth middleware" → done');

	// 6. Read to verify task update
	const readAfterTask = await plugin.tool?.plan_read?.execute(
		{ plan_id: planId, view: "plan" },
		context,
	);

	expect(readAfterTask).toContain("[x] Create auth middleware");
	expect(readAfterTask).toContain("[ ] Build login endpoint");

	// 7. Move to done
	const doneResult = await plugin.tool?.plan_update?.execute(
		{ plan_id: planId, status: "done" },
		context,
	);

	expect(doneResult).toContain("✓ Plan updated successfully");
	expect(doneResult).toContain("in_progress → done");

	// Verify folder moved to done
	const donePath = join(testDir, ".opencode", "plans", "done", planId!);
	expect(await Bun.file(join(donePath, "metadata.json")).exists()).toBe(true);
	expect(await Bun.file(join(inProgressPath, "metadata.json")).exists()).toBe(
		false,
	);

	// 8. List active — should be empty
	const listActive = await plugin.tool?.plan_list?.execute(
		{ status: "active" },
		context,
	);

	expect(listActive).toContain("No active plans found");

	// 9. List done — should show our plan
	const listDone = await plugin.tool?.plan_list?.execute(
		{ status: "done" },
		context,
	);

	expect(listDone).toContain(planId);
	expect(listDone).toContain("done");
});

// ============================================================================
// plan_create
// ============================================================================

test("Integration: Create plan with duplicate plan_id", async () => {
	const context = createMockContext(testDir);

	// Create first plan
	const first = await plugin.tool?.plan_create?.execute(
		{
			title: "Auth Flow",
			type: "feature",
			description: "First auth flow implementation",
			spec: {
				overview: "First version of auth flow",
				functionals: ["Login feature"],
				nonFunctionals: ["Performance requirement"],
				acceptanceCriterias: ["Login works"],
				outOfScope: ["OAuth"],
			},
			implementation: {
				description: "First implementation",
				phases: [{ phase: "Phase 1", tasks: ["Task 1"] }],
			},
		},
		context,
	);

	expect(first).toContain("✓ Plan created successfully");

	// Create second plan with same title + type → same base plan_id
	const second = await plugin.tool?.plan_create?.execute(
		{
			title: "Auth Flow",
			type: "feature",
			description: "Second auth flow implementation",
			spec: {
				overview: "Second version of auth flow",
				functionals: ["Login feature v2"],
				nonFunctionals: ["Performance requirement v2"],
				acceptanceCriterias: ["Login works v2"],
				outOfScope: ["OAuth v2"],
			},
			implementation: {
				description: "Second implementation",
				phases: [{ phase: "Phase 1", tasks: ["Task 2"] }],
			},
		},
		context,
	);

	expect(second).toContain("✓ Plan created successfully");
	// The second one should have a -2 suffix
	expect(second).toMatch(/-2/);
});

test("Integration: Create plan generates correct folder structure", async () => {
	const context = createMockContext(testDir);

	const result = await plugin.tool?.plan_create?.execute(
		{
			title: "Database Migration",
			type: "refactor",
			description: "Migrate from SQLite to PostgreSQL",
			spec: {
				overview:
					"Migrate database from SQLite to PostgreSQL with zero downtime",
				functionals: ["Data migration", "Schema conversion"],
				nonFunctionals: ["Zero downtime", "Data integrity maintained"],
				acceptanceCriterias: ["All data migrated successfully", "No data loss"],
				outOfScope: ["Performance tuning", "Index optimization"],
			},
			implementation: {
				description: "Database migration implementation strategy",
				phases: [
					{
						phase: "Phase 1: Setup",
						tasks: [
							"Set up PostgreSQL",
							"Write migration scripts",
							"Test rollback",
						],
					},
				],
			},
		},
		context,
	);

	expect(result).toContain("✓ Plan created successfully");
	expect(result).toContain("refactor");

	// Extract plan_id
	const planIdMatch = result?.match(/\*\*Plan ID:\*\* (.+)/);
	const planId = planIdMatch![1];

	// Read back metadata.json and verify contents
	const metadataPath = join(
		testDir,
		".opencode",
		"plans",
		"pending",
		planId!,
		"metadata.json",
	);
	const metadata = JSON.parse(await Bun.file(metadataPath).text());

	expect(metadata.plan_id).toBe(planId);
	expect(metadata.type).toBe("refactor");
	expect(metadata.status).toBe("pending");
	expect(metadata.description).toBe("Migrate from SQLite to PostgreSQL");
	expect(metadata.created_at).toBeDefined();
	expect(metadata.updated_at).toBeDefined();

	// Check spec.md content
	const specPath = join(
		testDir,
		".opencode",
		"plans",
		"pending",
		planId!,
		"spec.md",
	);
	const specContent = await Bun.file(specPath).text();
	expect(specContent).toContain("Zero downtime");

	// Check plan.md content
	const planPath = join(
		testDir,
		".opencode",
		"plans",
		"pending",
		planId!,
		"plan.md",
	);
	const planContent = await Bun.file(planPath).text();
	expect(planContent).toContain("Set up PostgreSQL");
});

// ============================================================================
// plan_list
// ============================================================================

test("Integration: List plans with type filter", async () => {
	const context = createMockContext(testDir);

	// Create a feature
	await plugin.tool?.plan_create?.execute(
		{
			title: "Feature A",
			type: "feature",
			description: "A feature plan for testing",
			spec: {
				overview: "Feature A spec overview",
				functionals: ["Feature requirement"],
				nonFunctionals: ["Performance"],
				acceptanceCriterias: ["Works correctly"],
				outOfScope: ["Advanced features"],
			},
			implementation: {
				description: "Feature A implementation",
				phases: [{ phase: "Phase 1", tasks: ["Task A"] }],
			},
		},
		context,
	);

	// Create a bug fix
	await plugin.tool?.plan_create?.execute(
		{
			title: "Bug Fix B",
			type: "bug",
			description: "A bugfix plan for testing",
			spec: {
				overview: "Bug fix B spec overview",
				functionals: ["Fix critical bug"],
				nonFunctionals: ["Stability"],
				acceptanceCriterias: ["Bug is fixed"],
				outOfScope: ["Related bugs"],
			},
			implementation: {
				description: "Bug fix B implementation",
				phases: [{ phase: "Phase 1", tasks: ["Task B"] }],
			},
		},
		context,
	);

	// List only features
	const featureList = await plugin.tool?.plan_list?.execute(
		{ status: "active", type: "feature" },
		context,
	);

	expect(featureList).toContain("feature");
	expect(featureList).not.toContain("bug");

	// List only bugs
	const bugList = await plugin.tool?.plan_list?.execute(
		{ status: "active", type: "bug" },
		context,
	);

	expect(bugList).toContain("bug");
	expect(bugList).not.toContain("feature");
});

test("Integration: List plans across statuses", async () => {
	const context = createMockContext(testDir);

	// Create a plan in pending
	const createResult = await plugin.tool?.plan_create?.execute(
		{
			title: "Cross Status",
			type: "feature",
			description: "Testing cross-status listing",
			spec: {
				overview: "Cross status test overview",
				functionals: ["Status tracking"],
				nonFunctionals: ["Reliability"],
				acceptanceCriterias: ["Status changes work"],
				outOfScope: ["Advanced status features"],
			},
			implementation: {
				description: "Cross status implementation",
				phases: [{ phase: "Phase 1", tasks: ["Task 1"] }],
			},
		},
		context,
	);

	const planIdMatch = createResult?.match(/\*\*Plan ID:\*\* (.+)/);
	const planId = planIdMatch![1];

	// Move to in_progress
	await plugin.tool?.plan_update?.execute(
		{ plan_id: planId, status: "in_progress" },
		context,
	);

	// List pending — should be empty
	const pendingList = await plugin.tool?.plan_list?.execute(
		{ status: "pending" },
		context,
	);
	expect(pendingList).toContain("No pending plans found");

	// List in_progress — should show our plan
	const ipList = await plugin.tool?.plan_list?.execute(
		{ status: "in_progress" },
		context,
	);
	expect(ipList).toContain(planId);

	// List active — should show our plan (pending + in_progress)
	const activeList = await plugin.tool?.plan_list?.execute(
		{ status: "active" },
		context,
	);
	expect(activeList).toContain(planId);
});

// ============================================================================
// plan_read
// ============================================================================

test("Integration: Read plan with summary view (cheapest)", async () => {
	const context = createMockContext(testDir);

	const createResult = await plugin.tool?.plan_create?.execute(
		{
			title: "Summary View Test",
			type: "docs",
			description: "Testing summary view mode",
			spec: {
				overview: "Summary view test - this should NOT appear in summary view",
				functionals: ["Documentation feature"],
				nonFunctionals: ["Readability"],
				acceptanceCriterias: ["Docs are clear"],
				outOfScope: ["Advanced docs"],
			},
			implementation: {
				description: "Summary view implementation",
				phases: [
					{
						phase: "Phase 1",
						tasks: ["Task 1", "Task 2"],
					},
				],
			},
		},
		context,
	);

	const planIdMatch = createResult?.match(/\*\*Plan ID:\*\* (.+)/);
	const planId = planIdMatch![1];

	const summaryResult = await plugin.tool?.plan_read?.execute(
		{ plan_id: planId, view: "summary" },
		context,
	);

	expect(summaryResult).toContain("✓ Plan loaded successfully");
	expect(summaryResult).toContain("docs");
	expect(summaryResult).toContain("Progress:");
	// Summary should NOT include full spec or plan content
	expect(summaryResult).not.toContain("Specification (spec.md)");
	expect(summaryResult).not.toContain("Implementation Plan (plan.md)");
});

test("Integration: Read plan with spec view", async () => {
	const context = createMockContext(testDir);

	const createResult = await plugin.tool?.plan_create?.execute(
		{
			title: "Spec View Test",
			type: "feature",
			description: "Testing spec view mode",
			spec: {
				overview: "Spec view test overview",
				functionals: ["Must support OAuth2"],
				nonFunctionals: ["Security"],
				acceptanceCriterias: ["OAuth2 works"],
				outOfScope: ["SAML"],
			},
			implementation: {
				description: "Spec view implementation",
				phases: [{ phase: "Phase 1", tasks: ["Build OAuth2 flow"] }],
			},
		},
		context,
	);

	const planIdMatch = createResult?.match(/\*\*Plan ID:\*\* (.+)/);
	const planId = planIdMatch![1];

	const specResult = await plugin.tool?.plan_read?.execute(
		{ plan_id: planId, view: "spec" },
		context,
	);

	expect(specResult).toContain("Specification (spec.md)");
	expect(specResult).toContain("Must support OAuth2");
	// Spec view should NOT include plan content
	expect(specResult).not.toContain("Implementation Plan (plan.md)");
});

test("Integration: Read plan with plan view", async () => {
	const context = createMockContext(testDir);

	const createResult = await plugin.tool?.plan_create?.execute(
		{
			title: "Plan View Test",
			type: "feature",
			description: "Testing plan view mode",
			spec: {
				overview: "Plan view test overview",
				functionals: ["Requirement A"],
				nonFunctionals: ["Performance"],
				acceptanceCriterias: ["Works as expected"],
				outOfScope: ["Advanced features"],
			},
			implementation: {
				description: "Plan view implementation",
				phases: [
					{
						phase: "Phase 1",
						tasks: ["Step 1", "Step 2", "Step 3"],
					},
				],
			},
		},
		context,
	);

	const planIdMatch = createResult?.match(/\*\*Plan ID:\*\* (.+)/);
	const planId = planIdMatch![1];

	const planResult = await plugin.tool?.plan_read?.execute(
		{ plan_id: planId, view: "plan" },
		context,
	);

	expect(planResult).toContain("Implementation Plan (plan.md)");
	expect(planResult).toContain("Step 1");
	expect(planResult).toContain("Step 2");
	expect(planResult).toContain("Step 3");
	// Should show parsed tasks
	expect(planResult).toContain("Parsed Tasks");
	// Plan view should NOT include spec
	expect(planResult).not.toContain("Specification (spec.md)");
});

// ============================================================================
// plan_update
// ============================================================================

test("Integration: Invalid status transition — pending → done (skip)", async () => {
	const context = createMockContext(testDir);

	const createResult = await plugin.tool?.plan_create?.execute(
		{
			title: "Invalid Transition",
			type: "bug",
			description: "Testing invalid status transitions",
			spec: {
				overview: "Invalid transition test",
				functionals: ["Bug fix"],
				nonFunctionals: ["Stability"],
				acceptanceCriterias: ["Bug is fixed"],
				outOfScope: ["Other bugs"],
			},
			implementation: {
				description: "Bug fix implementation",
				phases: [{ phase: "Phase 1", tasks: ["Fix the bug"] }],
			},
		},
		context,
	);

	const planIdMatch = createResult?.match(/\*\*Plan ID:\*\* (.+)/);
	const planId = planIdMatch![1];

	// Try to skip from pending → done
	const result = await plugin.tool?.plan_update?.execute(
		{ plan_id: planId, status: "done" },
		context,
	);

	expect(result).toContain("Error");
	expect(result).toContain("Invalid status transition");
	expect(result).toContain("pending");
	expect(result).toContain("done");
});

test("Integration: Invalid status transition — done → in_progress (immutable)", async () => {
	const context = createMockContext(testDir);

	const createResult = await plugin.tool?.plan_create?.execute(
		{
			title: "Immutable Done",
			type: "feature",
			description: "Testing done is immutable after completion",
			spec: {
				overview: "Immutable done test",
				functionals: ["Complete feature"],
				nonFunctionals: ["Finality"],
				acceptanceCriterias: ["Feature is done"],
				outOfScope: ["Future enhancements"],
			},
			implementation: {
				description: "Feature implementation",
				phases: [{ phase: "Phase 1", tasks: ["Already done"] }],
			},
		},
		context,
	);

	const planIdMatch = createResult?.match(/\*\*Plan ID:\*\* (.+)/);
	const planId = planIdMatch![1];

	// Move through lifecycle: pending → in_progress → done
	await plugin.tool?.plan_update?.execute(
		{ plan_id: planId, status: "in_progress" },
		context,
	);
	await plugin.tool?.plan_update?.execute(
		{ plan_id: planId, status: "done" },
		context,
	);

	// Try to move back from done → in_progress
	const result = await plugin.tool?.plan_update?.execute(
		{ plan_id: planId, status: "in_progress" },
		context,
	);

	expect(result).toContain("Error");
	expect(result).toContain("Invalid status transition");
});

test("Integration: Update spec.md and plan.md content", async () => {
	const context = createMockContext(testDir);

	const createResult = await plugin.tool?.plan_create?.execute(
		{
			title: "Content Update",
			type: "feature",
			description: "Testing content replacement in spec and plan",
			spec: {
				overview: "Original spec overview",
				functionals: ["Original requirement"],
				nonFunctionals: ["Original performance"],
				acceptanceCriterias: ["Original criteria"],
				outOfScope: ["Original scope"],
			},
			implementation: {
				description: "Original plan description",
				phases: [{ phase: "Phase 1", tasks: ["Original task"] }],
			},
		},
		context,
	);

	const planIdMatch = createResult?.match(/\*\*Plan ID:\*\* (.+)/);
	const planId = planIdMatch![1];

	// Update spec
	const specResult = await plugin.tool?.plan_update?.execute(
		{
			plan_id: planId,
			spec: {
				overview: "Updated spec overview",
				functionals: ["New requirement"],
				nonFunctionals: ["New performance"],
				acceptanceCriterias: ["New criteria"],
				outOfScope: ["New scope"],
			},
		},
		context,
	);

	expect(specResult).toContain("✓ Plan updated successfully");
	expect(specResult).toContain("spec.md updated");

	// Update plan
	const planResult = await plugin.tool?.plan_update?.execute(
		{
			plan_id: planId,
			plan: {
				description: "Updated plan description",
				phases: [
					{
						phase: "Phase 1",
						tasks: ["New task 1", "New task 2"],
					},
				],
			},
		},
		context,
	);

	expect(planResult).toContain("✓ Plan updated successfully");
	expect(planResult).toContain("plan.md updated");

	// Read to verify
	const readResult = await plugin.tool?.plan_read?.execute(
		{ plan_id: planId, view: "full" },
		context,
	);

	expect(readResult).toContain("Updated spec overview");
	expect(readResult).toContain("New requirement");
	expect(readResult).toContain("New task 1");
	expect(readResult).toContain("New task 2");
	expect(readResult).not.toContain("Original");
});

test("Integration: Toggle task through all 3 states", async () => {
	const context = createMockContext(testDir);

	const createResult = await plugin.tool?.plan_create?.execute(
		{
			title: "Task States",
			type: "feature",
			description: "Testing 3-state task toggling (pending, in_progress, done)",
			spec: {
				overview: "Task states test",
				functionals: ["Task management"],
				nonFunctionals: ["State tracking"],
				acceptanceCriterias: ["States work correctly"],
				outOfScope: ["Advanced state features"],
			},
			implementation: {
				description: "Task states implementation",
				phases: [{ phase: "Phase 1", tasks: ["My task"] }],
			},
		},
		context,
	);

	const planIdMatch = createResult?.match(/\*\*Plan ID:\*\* (.+)/);
	const planId = planIdMatch![1];

	// pending → in_progress
	await plugin.tool?.plan_update?.execute(
		{
			plan_id: planId,
			taskUpdates: [{ content: "My task", status: "in_progress" }],
		},
		context,
	);

	let readResult = await plugin.tool?.plan_read?.execute(
		{ plan_id: planId, view: "plan" },
		context,
	);
	expect(readResult).toContain("[~] My task");

	// in_progress → done
	await plugin.tool?.plan_update?.execute(
		{
			plan_id: planId,
			taskUpdates: [{ content: "My task", status: "done" }],
		},
		context,
	);

	readResult = await plugin.tool?.plan_read?.execute(
		{ plan_id: planId, view: "plan" },
		context,
	);
	expect(readResult).toContain("[x] My task");

	// done → pending (revert)
	await plugin.tool?.plan_update?.execute(
		{
			plan_id: planId,
			taskUpdates: [{ content: "My task", status: "pending" }],
		},
		context,
	);

	readResult = await plugin.tool?.plan_read?.execute(
		{ plan_id: planId, view: "plan" },
		context,
	);
	expect(readResult).toContain("[ ] My task");
});

test("Integration: Update with no arguments fails", async () => {
	const context = createMockContext(testDir);

	const createResult = await plugin.tool?.plan_create?.execute(
		{
			title: "No Args Update",
			type: "feature",
			description: "Testing update with no arguments fails",
			spec: {
				overview: "No args test",
				functionals: ["Update validation"],
				nonFunctionals: ["Error handling"],
				acceptanceCriterias: ["Validation works"],
				outOfScope: ["Complex validation"],
			},
			implementation: {
				description: "No args implementation",
				phases: [{ phase: "Phase 1", tasks: ["Task 1"] }],
			},
		},
		context,
	);

	const planIdMatch = createResult?.match(/\*\*Plan ID:\*\* (.+)/);
	const planId = planIdMatch![1];

	const result = await plugin.tool?.plan_update?.execute(
		{ plan_id: planId },
		context,
	);

	expect(result).toContain("Error");
	expect(result).toContain("At least one");
});

test("Integration: Update with taskContent (legacy) fails", async () => {
	const context = createMockContext(testDir);

	const createResult = await plugin.tool?.plan_create?.execute(
		{
			title: "Missing Task Status",
			type: "feature",
			description: "Testing taskContent without taskStatus fails",
			spec: {
				overview: "Missing task status test",
				functionals: ["Task validation"],
				nonFunctionals: ["Error handling"],
				acceptanceCriterias: ["Validation works"],
				outOfScope: ["Complex validation"],
			},
			implementation: {
				description: "Missing task status implementation",
				phases: [{ phase: "Phase 1", tasks: ["Some task"] }],
			},
		},
		context,
	);

	const planIdMatch = createResult?.match(/\*\*Plan ID:\*\* (.+)/);
	const planId = planIdMatch![1];

	const result = await plugin.tool?.plan_update?.execute(
		{ plan_id: planId, taskContent: "Some task" },
		context,
	);

	expect(result).toContain("Error");
	expect(result).toContain("At least one");
});

// ============================================================================
// Error Handling
// ============================================================================

test("Integration: Read nonexistent plan", async () => {
	const context = createMockContext(testDir);

	const result = await plugin.tool?.plan_read?.execute(
		{ plan_id: "nonexistent_plan_20260101" },
		context,
	);

	expect(result).toContain("not found");
	expect(result).toContain("plan_list");
});

test("Integration: Update nonexistent plan", async () => {
	const context = createMockContext(testDir);

	const result = await plugin.tool?.plan_update?.execute(
		{ plan_id: "nonexistent_plan_20260101", status: "in_progress" },
		context,
	);

	expect(result).toContain("not found");
});

test("Integration: Update nonexistent task", async () => {
	const context = createMockContext(testDir);

	const createResult = await plugin.tool?.plan_create?.execute(
		{
			title: "Real Plan",
			type: "feature",
			description: "Plan with a real task for testing nonexistent toggle",
			spec: {
				overview: "Real plan test",
				functionals: ["Task management"],
				nonFunctionals: ["Error handling"],
				acceptanceCriterias: ["Handles errors correctly"],
				outOfScope: ["Advanced features"],
			},
			implementation: {
				description: "Real plan implementation",
				phases: [{ phase: "Phase 1", tasks: ["Real task"] }],
			},
		},
		context,
	);

	const planIdMatch = createResult?.match(/\*\*Plan ID:\*\* (.+)/);
	const planId = planIdMatch![1];

	const result = await plugin.tool?.plan_update?.execute(
		{
			plan_id: planId,
			taskUpdates: [{ content: "Fake task", status: "done" }],
		},
		context,
	);

	// expect(result).toContain("Error");
	// The new batch update returns Warnings: instead of a hard error for one task
	expect(result).toContain("Warnings");
	expect(result).toContain("Fake task");
});

// ============================================================================
// Status + Task combined update
// ============================================================================

test("Integration: Update status and task in same call", async () => {
	const context = createMockContext(testDir);

	const createResult = await plugin.tool?.plan_create?.execute(
		{
			title: "Combined Update",
			type: "feature",
			description: "Testing status change and task toggle in one call",
			spec: {
				overview: "Combined update test",
				functionals: ["Multi-update support"],
				nonFunctionals: ["Atomicity"],
				acceptanceCriterias: ["Updates work together"],
				outOfScope: ["Complex updates"],
			},
			implementation: {
				description: "Combined update implementation",
				phases: [{ phase: "Phase 1", tasks: ["First step"] }],
			},
		},
		context,
	);

	const planIdMatch = createResult?.match(/\*\*Plan ID:\*\* (.+)/);
	const planId = planIdMatch![1];

	// Move to in_progress AND mark task as in_progress, in one call
	const result = await plugin.tool?.plan_update?.execute(
		{
			plan_id: planId,
			status: "in_progress",
			taskUpdates: [{ content: "First step", status: "in_progress" }],
		},
		context,
	);

	expect(result).toContain("✓ Plan updated successfully");
	expect(result).toContain("pending → in_progress");
	expect(result).toContain('"First step" → in_progress');

	// Verify task was updated in the moved folder
	const readResult = await plugin.tool?.plan_read?.execute(
		{ plan_id: planId, view: "plan" },
		context,
	);
	expect(readResult).toContain("[~] First step");
});

// ============================================================================
// Revert status (in_progress → pending)
// ============================================================================

test("Integration: Revert status from in_progress to pending", async () => {
	const context = createMockContext(testDir);

	const createResult = await plugin.tool?.plan_create?.execute(
		{
			title: "Revert Test",
			type: "feature",
			description: "Testing status revert from in_progress back to pending",
			spec: {
				overview: "Revert test overview",
				functionals: ["Status management"],
				nonFunctionals: ["Flexibility"],
				acceptanceCriterias: ["Revert works"],
				outOfScope: ["Complex reverts"],
			},
			implementation: {
				description: "Revert implementation",
				phases: [{ phase: "Phase 1", tasks: ["Task"] }],
			},
		},
		context,
	);

	const planIdMatch = createResult?.match(/\*\*Plan ID:\*\* (.+)/);
	const planId = planIdMatch![1];

	// Start work
	await plugin.tool?.plan_update?.execute(
		{ plan_id: planId, status: "in_progress" },
		context,
	);

	// Revert
	const revertResult = await plugin.tool?.plan_update?.execute(
		{ plan_id: planId, status: "pending" },
		context,
	);

	expect(revertResult).toContain("✓ Plan updated successfully");
	expect(revertResult).toContain("in_progress → pending");

	// Verify it's back in pending/
	const pendingPath = join(testDir, ".opencode", "plans", "pending", planId!);
	expect(await Bun.file(join(pendingPath, "metadata.json")).exists()).toBe(
		true,
	);
});

// ============================================================================
// Plan with no tasks (edge case)
// ============================================================================

test("Integration: Plan with no tasks", async () => {
	const context = createMockContext(testDir);

	const createResult = await plugin.tool?.plan_create?.execute(
		{
			title: "No Tasks Plan",
			type: "docs",
			description: "A documentation plan with no checkboxes",
			spec: {
				overview: "Documentation with no tasks",
				functionals: ["Documentation"],
				nonFunctionals: ["Clarity"],
				acceptanceCriterias: ["Docs are clear"],
				outOfScope: ["Complex documentation"],
			},
			implementation: {
				description: "Just some notes, no checkboxes.",
				phases: [{ phase: "Phase 1", tasks: ["Note taking"] }],
			},
		},
		context,
	);

	const planIdMatch = createResult?.match(/\*\*Plan ID:\*\* (.+)/);
	const planId = planIdMatch![1];

	const readResult = await plugin.tool?.plan_read?.execute(
		{ plan_id: planId, view: "plan" },
		context,
	);

	expect(readResult).toContain("✓ Plan loaded successfully");
	// Should still show progress (0/0 = 100%)
	expect(readResult).toContain("Progress:");
});

// ============================================================================
// Duplicate Task Validation
// ============================================================================

test("Integration: Create plan with duplicate tasks fails", async () => {
	const context = createMockContext(testDir);

	const result = await plugin.tool?.plan_create?.execute(
		{
			title: "Duplicate Tasks",
			type: "feature",
			description: "Testing duplicate task validation",
			spec: {
				overview: "Spec",
				functionals: ["Func"],
				nonFunctionals: ["NonFunc"],
				acceptanceCriterias: ["AC"],
				outOfScope: ["OOS"],
			},
			implementation: {
				description: "Impl",
				phases: [
					{ phase: "Phase 1", tasks: ["Task A", "Task B"] },
					{ phase: "Phase 2", tasks: ["Task B", "Task C"] },
				],
			},
		},
		context,
	);

	expect(result).toContain("Error: Duplicate task names found");
	expect(result).toContain("Task B");
});

test("Integration: Update plan with duplicate tasks fails", async () => {
	const context = createMockContext(testDir);

	// Create valid plan
	const createResult = await plugin.tool?.plan_create?.execute(
		{
			title: "Update Duplicates",
			type: "feature",
			description: "Testing update duplicate task validation",
			spec: {
				overview: "Spec",
				functionals: ["Func"],
				nonFunctionals: ["NonFunc"],
				acceptanceCriterias: ["AC"],
				outOfScope: ["OOS"],
			},
			implementation: {
				description: "Impl",
				phases: [{ phase: "Phase 1", tasks: ["Task A"] }],
			},
		},
		context,
	);

	const planIdMatch = createResult?.match(/\*\*Plan ID:\*\* (.+)/);
	const planId = planIdMatch![1];

	// Update with duplicates
	const result = await plugin.tool?.plan_update?.execute(
		{
			plan_id: planId,
			plan: {
				description: "Updated Impl",
				phases: [{ phase: "Phase 1", tasks: ["Task A", "Task A"] }],
			},
		},
		context,
	);

	expect(result).toContain("Error: Duplicate task names found");
	expect(result).toContain("Task A");
});
