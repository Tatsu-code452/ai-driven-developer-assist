# AI-Driven Developer Assist: Antigravity Agent Guidelines

This repository follows a strict multi-agent development workflow managed by **Antigravity**.
The workflow coordinates a central Router Agent with 23 domain specialist agents.

---

## 1. Operating Architecture

```
                  +--------------------------------+
                  |  Antigravity / Router Agent    |
                  |          (AGT-ROUTER)          |
                  +---------------+----------------+
                                  |
                                  | invoke_subagent
                                  v
+---------------------------------+----------------------------------+
| Requirements & Design           | Implementation & Verification    |
| - requirement (AGT-REQ)         | - backend (AGT-BE)               |
| - architecture (AGT-ARCH)       | - frontend (AGT-FE)              |
| - database (AGT-DB)             | - fix (AGT-FIX)                  |
| - detail-design (AGT-DES)       | - test-design (AGT-TST-DES)      |
| - uiux (AGT-UI)                 | - test-execution (AGT-TST-EXEC)  |
+---------------------------------+ - review (AGT-REVIEW)            |
| Quality, Security & Audit       | - ci (AGT-CI)                    |
| - review (AGT-REVIEW)           +----------------------------------+
| - security (AGT-SEC)            | Project Management & Git         |
| - performance (AGT-PERF)        | - project-manager (AGT-PM)       |
| - project-audit (AGT-AUDIT)     | - git (AGT-GIT)                  |
| - traceability (AGT-TRACE)      | - github (AGT-GITHUB)            |
| - documentation (AGT-DOC)       | - cd (AGT-CD)                    |
| - prompt-engineer (AGT-PROMPT)  | - knowledge (AGT-KNOWLEDGE)      |
+---------------------------------+----------------------------------+
```

---

## 2. Antigravity Subagent Execution Protocol

1. **Router Coordination**:
   - The primary Antigravity session operates as the **Router Agent (`router`)**.
   - The Router analyzes requests, checks git status/worktree, breaks tickets down, and invokes specialists.
   - Delegation is performed via `invoke_subagent` using the specialist's `TypeName` (e.g. `backend`, `frontend`, `review`).

2. **Strict Isolation & Security Boundaries**:
   - Every specialist operates strictly within the verified `WORKTREE_ROOT`.
   - Never edit files directly on `main` branch.
   - Edit Audit: Specialists must print `WORKTREE_ROOT`, `TARGET_FILE`, `OUTPUT_FILE`, and `Editing: <absolute path>` immediately before every file edit.
   - Non-compliant paths trigger `PATH-VIOLATION` and stop work immediately.

3. **Independent Review & Fix Loop**:
   - All code, design, or configuration changes MUST be reviewed by the **Review Agent (`review`)**.
   - Artifact convention: `review/RVW-TSK-xxx-NN.md`. Decision must be either `APPROVED` or `REQUEST_CHANGE`.
   - If changes are requested, the **Fix Agent (`fix`)** addresses them and creates `fix/FIX-TSK-xxx-NN.md`.
   - The loop repeats until `APPROVED` (up to a maximum of 5 iterations). If identical findings persist across 2 iterations, escalate to the user.

4. **One Artifact = One Specialist**:
   - Multiple specialists must never edit the same artifact concurrently.

---

## 3. Registered Agents Directory

All agent definitions reside in `.agents/agents/<name>.md`:

| Agent ID | Display Name | Core Responsibility | Antigravity Subagent Type |
| :--- | :--- | :--- | :--- |
| `router` | Router Agent (AGT-ROUTER) | Workflow routing, ticket breakdown, specialist dispatch, review coordination | `router` |
| `project-manager` | Project Manager Agent (AGT-PM) | Ticket planning, WBS, dependencies, timeline estimation | `project-manager` |
| `project-audit` | Project Audit Agent (AGT-AUDIT) | Project health audit, gate inspection, deliverable completeness | `project-audit` |
| `requirement` | Requirement Agent (AGT-REQ) | Eliciting requirements, acceptance criteria, non-functional requirements | `requirement` |
| `architecture` | Architecture Agent (AGT-ARCH) | System structure, component architecture, technology evaluation, ADR | `architecture` |
| `database` | Database Agent (AGT-DB) | Data modeling, ER diagrams, schema migration, index planning | `database` |
| `uiux` | UI/UX Agent (AGT-UI) | Screen flows, wireframes, interaction specs, accessibility | `uiux` |
| `detail-design` | Detail Design Agent (AGT-DES) | API contracts, class/module specs, interface design | `detail-design` |
| `backend` | Backend Agent (AGT-BE) | Backend implementation, APIs, server business logic | `backend` |
| `frontend` | Frontend Agent (AGT-FE) | Frontend client components, state management, client UX | `frontend` |
| `test-design` | Test Design Agent (AGT-TST-DES) | Test strategies, test scenarios, coverage criteria | `test-design` |
| `test-execution` | Test Execution Agent (AGT-TST-EXEC) | Test execution (Vitest, unit, integration), result recording | `test-execution` |
| `review` | Review Agent (AGT-REVIEW) | Independent review, defect detection (`review/RVW-TSK-xxx-NN.md`) | `review` |
| `fix` | Fix Agent (AGT-FIX) | Targeted defect remediation (`fix/FIX-TSK-xxx-NN.md`) | `fix` |
| `git` | Git Agent (AGT-GIT) | Branching, committing, rebasing, and merge verification | `git` |
| `github` | GitHub Agent (AGT-GITHUB) | GitHub PR management, Issue management, release notes | `github` |
| `ci` | CI Agent (AGT-CI) | CI workflow validation, build/lint checks, quality gate checks | `ci` |
| `cd` | CD Agent (AGT-CD) | Deployment readiness, release scripts, rollback planning | `cd` |
| `documentation` | Documentation Agent (AGT-DOC) | Project docs, user guides, API manuals, architecture docs | `documentation` |
| `traceability` | Traceability Agent (AGT-TRACE) | Requirement-to-code traceability matrix, orphan artifact checks | `traceability` |
| `knowledge` | Knowledge Agent (AGT-KNOWLEDGE) | Knowledge base, onboarding docs, session handoff context | `knowledge` |
| `security` | Security Agent (AGT-SEC) | OWASP vulnerability scans, dependency audits, defensive checks | `security` |
| `performance` | Performance Agent (AGT-PERF) | Profiling, query tuning, frontend/backend performance optimization | `performance` |
| `prompt-engineer` | Prompt Engineer Agent (AGT-PROMPT) | Agent prompt optimization, instruction tuning, capability alignment | `prompt-engineer` |

---

## 4. Agent Support Tools Integration

Antigravity agents can run the repository's built-in Agent Support Tools from `WORKTREE_ROOT`:

```bash
npm --prefix backend run agent-tools -- status
npm --prefix backend run agent-tools -- agents [query]
npm --prefix backend run agent-tools -- plan <request>
```
Or with `--json` / `-json` suffix for structured programmatic processing.
