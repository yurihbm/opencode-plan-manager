import { describe, expect, test } from "bun:test";

import {
	CreatePlanInputSchema,
	isValidTransition,
	MetadataSchema,
	PlanStatusEnum,
	PlanTypeEnum,
	PlanViewEnum,
	TaskStatusEnum,
	UpdatePlanInputSchema,
} from "../../src/schemas";

// ============================================================================
// Helper: valid metadata object
// ============================================================================

function validMetadata(overrides: Record<string, unknown> = {}) {
	return {
		plan_id: "feature_auth_20260206",
		type: "feature",
		status: "pending",
		created_at: "2026-02-06T14:00:00Z",
		updated_at: "2026-02-06T14:00:00Z",
		description: "Add user authentication flow",
		...overrides,
	};
}

// ============================================================================
// Enum Schemas
// ============================================================================

describe("PlanStatusEnum", () => {
	test("accepts valid statuses", () => {
		expect(PlanStatusEnum.parse("pending")).toBe("pending");
		expect(PlanStatusEnum.parse("in_progress")).toBe("in_progress");
		expect(PlanStatusEnum.parse("done")).toBe("done");
	});

	test("rejects invalid statuses", () => {
		expect(() => PlanStatusEnum.parse("active")).toThrow();
		expect(() => PlanStatusEnum.parse("completed")).toThrow();
		expect(() => PlanStatusEnum.parse("")).toThrow();
	});
});

describe("PlanTypeEnum", () => {
	test("accepts valid types", () => {
		expect(PlanTypeEnum.parse("feature")).toBe("feature");
		expect(PlanTypeEnum.parse("bug")).toBe("bug");
		expect(PlanTypeEnum.parse("refactor")).toBe("refactor");
		expect(PlanTypeEnum.parse("docs")).toBe("docs");
	});

	test("rejects invalid types", () => {
		expect(() => PlanTypeEnum.parse("task")).toThrow();
		expect(() => PlanTypeEnum.parse("chore")).toThrow();
	});
});

describe("TaskStatusEnum", () => {
	test("accepts valid task statuses", () => {
		expect(TaskStatusEnum.parse("pending")).toBe("pending");
		expect(TaskStatusEnum.parse("in_progress")).toBe("in_progress");
		expect(TaskStatusEnum.parse("done")).toBe("done");
	});
});

describe("PlanViewEnum", () => {
	test("accepts valid views", () => {
		expect(PlanViewEnum.parse("summary")).toBe("summary");
		expect(PlanViewEnum.parse("spec")).toBe("spec");
		expect(PlanViewEnum.parse("plan")).toBe("plan");
		expect(PlanViewEnum.parse("full")).toBe("full");
	});

	test("rejects invalid views", () => {
		expect(() => PlanViewEnum.parse("all")).toThrow();
		expect(() => PlanViewEnum.parse("brief")).toThrow();
	});
});

// ============================================================================
// MetadataSchema
// ============================================================================

describe("MetadataSchema", () => {
	test("accepts valid metadata", () => {
		const result = MetadataSchema.safeParse(validMetadata());
		expect(result.success).toBe(true);
	});

	test("rejects missing required fields", () => {
		const { plan_id, ...noPlanId } = validMetadata();
		expect(MetadataSchema.safeParse(noPlanId).success).toBe(false);

		const { description, ...noDesc } = validMetadata();
		expect(MetadataSchema.safeParse(noDesc).success).toBe(false);

		const { status, ...noStatus } = validMetadata();
		expect(MetadataSchema.safeParse(noStatus).success).toBe(false);
	});

	test("rejects empty plan_id", () => {
		const result = MetadataSchema.safeParse(validMetadata({ plan_id: "" }));
		expect(result.success).toBe(false);
	});

	test("rejects plan_id with uppercase", () => {
		const result = MetadataSchema.safeParse(
			validMetadata({ plan_id: "Feature_Auth_20260206" }),
		);
		expect(result.success).toBe(false);
	});

	test("rejects plan_id with spaces", () => {
		const result = MetadataSchema.safeParse(
			validMetadata({ plan_id: "feature auth" }),
		);
		expect(result.success).toBe(false);
	});

	test("accepts plan_id with hyphens and underscores", () => {
		expect(
			MetadataSchema.safeParse(
				validMetadata({ plan_id: "feature_user-auth_20260206" }),
			).success,
		).toBe(true);
		expect(
			MetadataSchema.safeParse(
				validMetadata({ plan_id: "bug_fix-123_20260101" }),
			).success,
		).toBe(true);
	});

	test("rejects invalid status value", () => {
		const result = MetadataSchema.safeParse(
			validMetadata({ status: "active" }),
		);
		expect(result.success).toBe(false);
	});

	test("rejects invalid type value", () => {
		const result = MetadataSchema.safeParse(validMetadata({ type: "chore" }));
		expect(result.success).toBe(false);
	});

	test("rejects non-ISO datetime strings", () => {
		const result = MetadataSchema.safeParse(
			validMetadata({ created_at: "2026-02-06" }),
		);
		expect(result.success).toBe(false);
	});

	test("rejects description over 500 characters", () => {
		const result = MetadataSchema.safeParse(
			validMetadata({ description: "x".repeat(501) }),
		);
		expect(result.success).toBe(false);
	});

	test("rejects empty description", () => {
		const result = MetadataSchema.safeParse(validMetadata({ description: "" }));
		expect(result.success).toBe(false);
	});
});

// ============================================================================
// CreatePlanInputSchema
// ============================================================================

describe("CreatePlanInputSchema", () => {
	const validInput = {
		title: "User Authentication",
		type: "feature",
		description: "Add user authentication flow with OAuth2",
		spec: {
			overview: "Add user authentication with OAuth2 support",
			functionals: ["Login form", "Session management"],
			nonFunctionals: ["Security", "Performance"],
			acceptanceCriterias: ["User can login", "Session persists"],
			outOfScope: ["Social login", "2FA"],
		},
		implementation: {
			description: "Implementation strategy for authentication",
			phases: [
				{
					phase: "Phase 1",
					tasks: ["Create login form", "Add session handling"],
				},
			],
		},
	};

	test("accepts valid input", () => {
		const result = CreatePlanInputSchema.safeParse(validInput);
		expect(result.success).toBe(true);
	});

	test("rejects title shorter than 3 characters", () => {
		const result = CreatePlanInputSchema.safeParse({
			...validInput,
			title: "ab",
		});
		expect(result.success).toBe(false);
	});

	test("rejects title longer than 100 characters", () => {
		const result = CreatePlanInputSchema.safeParse({
			...validInput,
			title: "x".repeat(101),
		});
		expect(result.success).toBe(false);
	});

	test("rejects description shorter than 10 characters", () => {
		const result = CreatePlanInputSchema.safeParse({
			...validInput,
			description: "too short",
		});
		expect(result.success).toBe(false);
	});

	test("rejects description longer than 500 characters", () => {
		const result = CreatePlanInputSchema.safeParse({
			...validInput,
			description: "x".repeat(501),
		});
		expect(result.success).toBe(false);
	});

	test("rejects spec with empty overview", () => {
		const result = CreatePlanInputSchema.safeParse({
			...validInput,
			spec: { ...validInput.spec, overview: "" },
		});
		expect(result.success).toBe(false);
	});

	test("rejects spec with empty functionals array", () => {
		const result = CreatePlanInputSchema.safeParse({
			...validInput,
			spec: { ...validInput.spec, functionals: [] },
		});
		expect(result.success).toBe(false);
	});

	test("rejects spec with empty nonFunctionals array", () => {
		const result = CreatePlanInputSchema.safeParse({
			...validInput,
			spec: { ...validInput.spec, nonFunctionals: [] },
		});
		expect(result.success).toBe(false);
	});

	test("rejects spec with empty acceptanceCriterias array", () => {
		const result = CreatePlanInputSchema.safeParse({
			...validInput,
			spec: { ...validInput.spec, acceptanceCriterias: [] },
		});
		expect(result.success).toBe(false);
	});

	test("rejects spec with empty outOfScope array", () => {
		const result = CreatePlanInputSchema.safeParse({
			...validInput,
			spec: { ...validInput.spec, outOfScope: [] },
		});
		expect(result.success).toBe(false);
	});

	test("rejects implementation with empty description", () => {
		const result = CreatePlanInputSchema.safeParse({
			...validInput,
			implementation: { ...validInput.implementation, description: "" },
		});
		expect(result.success).toBe(false);
	});

	test("rejects implementation with empty phases array", () => {
		const result = CreatePlanInputSchema.safeParse({
			...validInput,
			implementation: { ...validInput.implementation, phases: [] },
		});
		expect(result.success).toBe(false);
	});

	test("rejects phase with empty tasks array", () => {
		const result = CreatePlanInputSchema.safeParse({
			...validInput,
			implementation: {
				...validInput.implementation,
				phases: [{ phase: "Phase 1", tasks: [] }],
			},
		});
		expect(result.success).toBe(false);
	});

	test("rejects invalid type", () => {
		const result = CreatePlanInputSchema.safeParse({
			...validInput,
			type: "chore",
		});
		expect(result.success).toBe(false);
	});
});

// ============================================================================
// UpdatePlanInputSchema
// ============================================================================

describe("UpdatePlanInputSchema", () => {
	test("accepts valid status update", () => {
		const result = UpdatePlanInputSchema.safeParse({
			plan_id: "feature_auth_20260206",
			status: "in_progress",
		});
		expect(result.success).toBe(true);
	});

	test("accepts valid spec update", () => {
		const result = UpdatePlanInputSchema.safeParse({
			plan_id: "feature_auth_20260206",
			spec: {
				overview: "Updated spec overview",
				functionals: ["Updated requirement"],
				nonFunctionals: ["Updated performance"],
				acceptanceCriterias: ["Updated criteria"],
				outOfScope: ["Updated scope"],
			},
		});
		expect(result.success).toBe(true);
	});

	test("accepts valid plan update", () => {
		const result = UpdatePlanInputSchema.safeParse({
			plan_id: "feature_auth_20260206",
			plan: {
				description: "Updated plan description",
				phases: [
					{ phase: "Phase 1", tasks: ["New task with enough characters"] },
				],
			},
		});
		expect(result.success).toBe(true);
	});

	test("accepts valid batch task update (taskUpdates)", () => {
		const result = UpdatePlanInputSchema.safeParse({
			plan_id: "feature_auth_20260206",
			taskUpdates: [{ content: "Write tests", status: "done" }],
		});
		expect(result.success).toBe(true);
	});

	test("rejects when no update field is provided", () => {
		const result = UpdatePlanInputSchema.safeParse({
			plan_id: "feature_auth_20260206",
		});
		expect(result.success).toBe(false);
	});

	test("rejects legacy format (taskContent + taskStatus)", () => {
		const result = UpdatePlanInputSchema.safeParse({
			plan_id: "feature_auth_20260206",
			taskContent: "Write tests",
			taskStatus: "done",
		});
		expect(result.success).toBe(false);
	});

	test("rejects empty plan_id", () => {
		const result = UpdatePlanInputSchema.safeParse({
			plan_id: "",
			status: "in_progress",
		});
		expect(result.success).toBe(false);
	});

	test("accepts multiple update fields at once", () => {
		const result = UpdatePlanInputSchema.safeParse({
			plan_id: "feature_auth_20260206",
			status: "in_progress",
			plan: {
				description: "Updated plan",
				phases: [{ phase: "Phase 1", tasks: ["Task one with enough chars"] }],
			},
			taskUpdates: [{ content: "Write tests", status: "in_progress" }],
		});
		expect(result.success).toBe(true);
	});

	test("rejects spec update with empty arrays", () => {
		const result = UpdatePlanInputSchema.safeParse({
			plan_id: "feature_auth_20260206",
			spec: {
				overview: "Valid overview",
				functionals: [], // empty array should fail
				nonFunctionals: ["Non-functional"],
				acceptanceCriterias: ["Criteria"],
				outOfScope: ["Scope"],
			},
		});
		expect(result.success).toBe(false);
	});

	test("rejects plan update with empty phases", () => {
		const result = UpdatePlanInputSchema.safeParse({
			plan_id: "feature_auth_20260206",
			plan: {
				description: "Valid description",
				phases: [], // empty array should fail
			},
		});
		expect(result.success).toBe(false);
	});
});

// ============================================================================
// isValidTransition
// ============================================================================

describe("isValidTransition", () => {
	test("allows pending -> in_progress", () => {
		expect(isValidTransition("pending", "in_progress")).toBe(true);
	});

	test("allows in_progress -> done", () => {
		expect(isValidTransition("in_progress", "done")).toBe(true);
	});

	test("allows in_progress -> pending (revert)", () => {
		expect(isValidTransition("in_progress", "pending")).toBe(true);
	});

	test("rejects pending -> done (skip)", () => {
		expect(isValidTransition("pending", "done")).toBe(false);
	});

	test("rejects done -> pending (immutable)", () => {
		expect(isValidTransition("done", "pending")).toBe(false);
	});

	test("rejects done -> in_progress (immutable)", () => {
		expect(isValidTransition("done", "in_progress")).toBe(false);
	});

	test("rejects same-status transition", () => {
		expect(isValidTransition("pending", "pending")).toBe(false);
		expect(isValidTransition("in_progress", "in_progress")).toBe(false);
		expect(isValidTransition("done", "done")).toBe(false);
	});

	test("returns false for unknown statuses", () => {
		expect(isValidTransition("active", "completed")).toBe(false);
		expect(isValidTransition("unknown", "pending")).toBe(false);
	});
});
