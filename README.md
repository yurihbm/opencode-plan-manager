# OpenCode Plan Manager

[![OpenCode Plugin](https://img.shields.io/badge/OpenCode-Plugin-black)](https://opencode.ai)
[![TypeScript](https://img.shields.io/badge/TypeScript-blue)](https://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/Bun-orange)](https://bun.sh)
[![Test](https://github.com/yurihbm/opencode-plan-manager/actions/workflows/test.yml/badge.svg)](https://github.com/yurihbm/opencode-plan-manager/actions/workflows/test.yml)

**AI-Native Implementation Planning for Modern Agentic Workflows.**

OpenCode Plan Manager is a high-performance, minimalist plugin designed to bridge the gap between complex implementation strategies and autonomous execution. By utilizing a **folder-per-plan** architecture and **token-efficient views**, it empowers AI agents to manage large-scale features without context overload.

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

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["opencode-plan-manager@0.2.0"]
}
```

> ⚠️ By specifying the version, you improve OpenCode startup time.

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
│       ├── spec.md
│       └── plan.md
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
    overview: "Implement secure JWT-based authentication",
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
plan_read({ plan_id: "feature_auth", view: "summary" });

// Spec View: Just the requirements (useful for the Planner)
plan_read({ plan_id: "feature_auth", view: "spec" });

// Plan View: Just the task list (useful for the Builder)
plan_read({ plan_id: "feature_auth", view: "plan" });
```

### 3. Batch Task Updates (`plan_update`)

Update multiple tasks or move a plan through the lifecycle with validation.

```typescript
plan_update({
  plan_id: "feature_auth",
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
