# OpenCode Plan Manager

[![OpenCode Plugin](https://img.shields.io/badge/OpenCode-Plugin-black)](https://opencode.ai)
[![TypeScript](https://img.shields.io/badge/TypeScript-blue)](https://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/Bun-orange)](https://bun.sh)
[![Test](https://github.com/yurihbm/opencode-plan-manager/actions/workflows/test.yml/badge.svg)](https://github.com/yurihbm/opencode-plan-manager/actions/workflows/test.yml)

**AI-native implementation planning for agentic workflows.**

Stop losing context mid-feature or with cross-session work. OpenCode Plan Manager gives your AI agents a structured way to plan, track, and execute complex work — from a single idea to a fully shipped feature.

![OPM Preview](assets/opm_preview.gif)

---

## Why Plan Manager?

Agentic coding workflows break down when context gets too large. Agents start hallucinating, lose track of tasks, and repeat work. Plan Manager solves this with four principles:

- **Selective context loading** — agents read only what they need: `summary` (stats), `spec` (requirements), or `plan` (task list).
- **Zero-hallucination schemas** — strict Zod validation prevents malformed plans and invalid state transitions.
- **Filesystem Kanban** — plan state lives in `pending/`, `in_progress/`, and `done/` folders. Atomic, human-readable, no hidden database.
- **Cross-session continuity** — plans are plain files committed to your repo. Pick up exactly where you left off in any new session, on any machine, with any agent — the spec and task progress are always there.

Designed for the **Planner → Builder** pattern: a Plan Agent architects the spec, a Build Agent executes it with no ambiguity.

---

## Installation

Add the plugin to your OpenCode configuration (`~/.config/opencode/opencode.json`):

```jsonc
{
	"$schema": "https://opencode.ai/config.json",
	"plugin": ["opencode-plan-manager@1.0.2"],
}
```

> Pinning the version improves OpenCode startup time.

---

## Configuration

Config is loaded with the following precedence (highest → lowest):

1. **Project:** `<project-root>/.opencode/plan-manager.json`
2. **User:** `~/.config/opencode/plan-manager.json`
3. **Defaults:** built-in fallback

```jsonc
{
	// "markdown" (default), "json", or "toon" (https://github.com/toon-format/toon)
	"outputFormat": "markdown",
}
```

<details>
<summary><strong>Permission setup</strong></summary>

Plan Manager writes to `.opencode/plans/*`. For `plan_create` and `plan_update` to work, the agents that call them must have `ask` or `allow` permission on that path.

Example config for the Plan agent:

```jsonc
{
	"agent": {
		"plan": {
			"permission": {
				"edit": {
					"*": "deny",
					".opencode/plans/*": "ask",
				},
			},
		},
	},
}
```

See [opencode.ai/docs/permissions](https://opencode.ai/docs/permissions) for details.

</details>

---

## Agentic Workflow

Plan Manager is optimized for a two-agent hierarchy, with prompts in `src/prompts/`:

| Agent                         | Role                                                                                                                                                          |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Plan Agent** (`plan.txt`)   | Architect. Transforms vague requirements into phased, structured plans via a 4-step process: Analysis → Deduplication → Context Decision → Plan Creation.     |
| **Build Agent** (`build.txt`) | Executor. Follows the plan precisely, managing task state from `pending` → `in_progress` → `done`. Escalates to the Plan Agent when a task needs more design. |

> Uses OpenCode's built-in `Plan` and `Build` agents ([docs](https://opencode.ai/docs/agents/)) with injected system prompts. Your own custom prompts always take priority.

---

## Filesystem Layout

```text
.opencode/plans/
├── pending/
│   └── feature_auth/
│       ├── metadata.json
│       ├── specifications.md
│       └── implementation.md
├── in_progress/
└── done/
```

Each plan is an isolated folder. Status moves atomically between `pending/`, `in_progress/`, and `done/` — no database, no sync issues.

---

## API

| Tool          | Description               | Key behavior                                        |
| ------------- | ------------------------- | --------------------------------------------------- |
| `plan_create` | Create a new plan         | Validates full structure via Zod                    |
| `plan_list`   | List plans by status/type | Reads only lightweight `metadata.json` files        |
| `plan_read`   | Read plan content         | Supports `summary`, `spec`, `plan`, or `full` views |
| `plan_update` | Update status or tasks    | Atomic folder moves, batch task updates             |

### `plan_create`

```typescript
plan_create({
	metadata: {
		title: "JWT Authentication",
		type: "feature",
		description: "Secure auth flow with refresh tokens",
	},
	specifications: {
		description: "Implement secure JWT-based authentication",
		functionals: ["User login", "Token refresh"],
		nonFunctionals: ["Passwords hashed with bcrypt"],
		acceptanceCriterias: ["Successful login returns a valid JWT"],
		outOfScope: ["Social OAuth"],
	},
	implementation: {
		description: "Phased rollout",
		phases: [
			{
				name: "Phase 1: Database",
				tasks: [
					{ content: "Create users table", status: "pending" },
					{ content: "Create sessions table", status: "pending" },
				],
			},
		],
	},
});
```

### `plan_read` — selective views

```typescript
plan_read({ id: "feature_auth", view: "summary" }); // metadata + progress stats
plan_read({ id: "feature_auth", view: "spec" }); // requirements only
plan_read({ id: "feature_auth", view: "plan" }); // task list only
plan_read({ id: "feature_auth", view: "full" }); // everything
```

### `plan_update` — batch task updates

```typescript
plan_update({
	id: "feature_auth",
	status: "in_progress",
	taskUpdates: [
		{ content: "Create users table", status: "done" },
		{ content: "Create sessions table", status: "in_progress" },
	],
});
```

---

## Development

```bash
bun install # Install dependencies
bun test    # Run test suite
bun build   # Build for production
```

---

## License

MIT © 2026 [Yuri Maciel](https://github.com/yurihbm)
