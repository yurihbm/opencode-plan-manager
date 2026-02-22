# OpenCode Plan Manager

[![OpenCode Plugin](https://img.shields.io/badge/OpenCode-Plugin-black)](https://opencode.ai)
[![TypeScript](https://img.shields.io/badge/TypeScript-blue)](https://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/Bun-orange)](https://bun.sh)
[![Test](https://github.com/yurihbm/opencode-plan-manager/actions/workflows/test.yml/badge.svg)](https://github.com/yurihbm/opencode-plan-manager/actions/workflows/test.yml)

**AI-Native Implementation Planning for Modern Agentic Workflows.**

OpenCode Plan Manager is a high-performance, minimalist plugin designed to bridge the gap between complex implementation strategies and autonomous execution. By utilizing a **folder-per-plan** architecture and **token-efficient views**, it empowers AI agents to manage large-scale features without context overload.

---

<details>
<summary><strong>⚠️ v0.3.0 Breaking Changes – Read Before Upgrading!</strong></summary>

#### **This release introduces breaking changes that affect file structure, field names, and plan format.**

If you are upgrading from v0.2.x, you MUST migrate all existing plans and metadata for compatibility.

> Tip: AI Agents can still access old plans by reading their files directly (using Bash/list/read tools), then recreate plans in the new format using the latest plugin's API.

**What Changed?**

- **File naming:**
  - `spec.md` → `specifications.md`
  - `plan.md` → `implementation.md`
- **Metadata key:**
  - `"plan_id"` → `"id"` in `metadata.json`
- **Markdown structure:**
  - All `.md` files now require H1 headers:
    - `# Specifications` at the top of `specifications.md`
    - `# Implementation Plan` at the top of `implementation.md`
  - Phases are now indicated using H2 (`##`) headers, not H3.
  - No more `## Overview/Description` headers—put the summary right after the H1.
- **Tool arguments:**
  - All APIs expect updated argument keys (e.g., `id` instead of `plan_id`)

**How to Migrate?**

1. Rename all `spec.md` to `specifications.md` & `plan.md` to `implementation.md` in each plan folder.
2. Open each `metadata.json` file and rename `plan_id` → `id`.
3. Update the content of each markdown file to add the correct H1 headers and phase header levels as described above.
4. Validate your plans by running `plan_list` and `plan_read`.

**Older plans will not load or load with errors until they are migrated to the new format.**

</details>

---

## 🧠 Why Plan Manager?

In agentic workflows, **Implementation Plans** are the source of truth. However, most implementations suffer from "Token Soup"—where agents are forced to parse massive, unstructured files, leading to hallucinations and lost context.

Plan Manager solves this by enforcing **Plan-to-Code Determinism**:

- **Selective Context Loading:** Don't load the whole project. Agents can read just the `summary` (stats), `spec` (requirements), or `plan` (tasks) as needed.
- **Zero-Hallucination Schemas:** Built with strict Zod validation. Agents _cannot_ create malformed plans or invalid state transitions.
- **Visible Filesystem Kanban:** Unlike hidden databases, your state is the filesystem. `pending/`, `in_progress/`, and `done/` folders provide an atomic, human-readable Kanban board.
- **Multi-Agent Native:** Designed for the **Planner-Builder** pattern. Standardized outputs allow a specialized **Plan Agent** to hand off a deterministic spec to a **Build Agent** with zero ambiguity.

---

## ⚙️ Installation

Add the plugin to your OpenCode configuration file (~/.config/opencode/opencode.json or similar):

```jsonc
{
	"$schema": "https://opencode.ai/config.json",
	"plugin": ["opencode-plan-manager@0.2.0"],
}
```

> ⚠️ By specifying the version, you improve OpenCode startup time.

---

## ⚙️ Configuration

Configuration files are loaded with the following precedence (highest to lowest):

1. **Local Config:** `<project-root>/.opencode/plan-manager.json` (project-specific settings)
2. **User Config:** `~/.config/opencode/plan-manager.json` (global user settings)
3. **Default Config:** Built-in defaults (used when no config files exist)

```jsonc
{
	"outputFormat": "markdown", // "markdown" (default), "json" or "toon" (see https://github.com/toon-format/toon)
}
```

<details>
<summary>⚠️ Permission Requirement</summary>

> Important:
> If you deny edit permission in your OpenCode configuration (opencode.json) for the .opencode/plans/\* file pattern, the Plan Manager plugin cannot create or update plans.
> This is because the plugin uses OpenCode’s built-in ask permission method when modifying plan files. This mechanism shows users a summary of the changes and asks for review (accept/reject) before files are edited, increasing transparency and control.

What does this mean?

- The plan_create and plan_update actions require that AI agents (Plan and Build) have ask or allow permissions for edit on the .opencode/plans/\* pattern.
- If permission is set to deny, plan creation and modification will fail, and the workflow will not proceed.
  How to ensure compatibility:

1. Open your opencode.json config file (usually at ~/.config/opencode/opencode.json).
2. Check the permissions for .opencode/plans/\*.
3. Make sure edit edit permission is set to "ask" or "allow" for both the Plan Agent and Build Agent.

Here is an example similar to how I configure permissions for the Plan agent:

```jsonc
{
	"agent": {
		"plan": {
			"permission": {
				"edit": {
					"*": "deny", // Deny edits on everything
					".opencode/plans/*": "ask", // Except for plan files, ask for permission
				},
			},
		},
	},
}
```

References:

- https://opencode.ai/docs/permissions

</details>

---

## 🤖 The Agentic Workflow

This plugin is optimized for a dual-agent hierarchy, utilizing specialized prompts found in `src/prompts/`:

1.  **Plan Agent (`plan.txt`):** A high-reasoning architect that transforms vague requirements into structured, phased implementation plans.
    - **Workflow:** Follows a 4-step process: Analysis → Deduplication → Context Decision → Plan Creation.
2.  **Build Agent (`build.txt`):** An implementation specialist that executes plans with high precision.
    - **Logic:** If a plan exists, it _must_ follow it. If a task is too complex, it will suggest calling the Plan Agent first.
    - **Task Management:** Automatically handles task state transitions from `pending` to `in_progress` to `done`.

> ⚠️ This plugin uses the built-in `Plan` and `Build` agents (see [https://opencode.ai/docs/agents/](https://opencode.ai/docs/agents/))
> and adds custom system prompts to optimize them for the provided tools, but does not create new agent types.

> ℹ️ If you provide custom prompts for `Plan` or `Build` agents at your configuration file, this plugin will NOT inject its optimized prompts.
> Your prompts have priority over the plugin's defaults.

---

## ✨ Features

- 🛠️ **Folder-Per-Plan Architecture:** Isolation of concerns. Each feature has its own metadata, spec, and task list.
- 📉 **Token Optimization:** Native support for `summary` and `selective` views to keep agent context windows clean and focused.
- 🔄 **Atomic State Transitions:** Safe folder movements (`rename()`) ensure that plan status is always in sync with the filesystem.
- ✅ **Deterministic Task Management:** Support for three task states (`[ ]`, `[~]`, `[x]`) with batch update capabilities.
- 🚀 **High Performance:** Metadata-only listing for fast scanning of plans.

---

## 📁 Architecture: The Filesystem Kanban

Plan Manager organizes work into a structured directory tree that both humans and AI can navigate intuitively:

```text
.opencode/plans/
├── pending/             # New ideas and upcoming features
│   └── feature_auth/    # Each plan is a dedicated folder
│       ├── metadata.json
│       ├── specifications.md
│       └── implementation.md
├── in_progress/         # Currently active development
└── done/                # Immutable history of completed work
```

---

## 🚀 Usage

### 1. Creating a Deterministic Plan (`plan_create`)

Instead of loose markdown, agents use structured objects to ensure every plan has clear requirements and phases.

```typescript
plan_create({
	title: "JWT Authentication",
	type: "feature",
	description: "Secure auth flow with refresh tokens",
	spec: {
		description: "Implement secure JWT-based authentication",
		functionals: ["User login", "Token refresh"],
		nonFunctionals: ["Passwords hashed with bcrypt"],
		acceptanceCriterias: ["Successful login returns valid JWT"],
		outOfScope: ["Social OAuth"],
	},
	implementation: {
		description: "Phased rollout",
		phases: [
			{
				phase: "Phase 1: Database",
				tasks: ["Create users table", "Create sessions table"],
			},
		],
	},
});
```

### 2. Context-Efficient Reading (`plan_read`)

Agents can request only the information they need, significantly reducing token costs.

```typescript
// Summary View: Just the metadata and progress stats
plan_read({ id: "feature_auth", view: "summary" });

// Spec View: Just the requirements (useful for the Planner)
plan_read({ id: "feature_auth", view: "spec" });

// Plan View: Just the task list (useful for the Builder)
plan_read({ id: "feature_auth", view: "plan" });
```

### 3. Batch Task Updates (`plan_update`)

Update multiple tasks or move a plan through the lifecycle with validation.

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

## 🛠️ API Reference

| Tool          | Purpose                | Key Optimization                          |
| :------------ | :--------------------- | :---------------------------------------- |
| `plan_create` | Initializes a new plan | Validates structure via Zod               |
| `plan_list`   | Scans available plans  | Reads only 200B metadata files            |
| `plan_read`   | Loads plan content     | Supports selective views for token saving |
| `plan_update` | Updates state/tasks    | Atomic folder moves + batch updates       |

---

## 🧪 Development

```bash
bun install    # Install dependencies
bun test       # Run test suite (188 tests)
bun build      # Build for production
```

## 📄 License

MIT © 2026 OpenCode Ecosystem.
