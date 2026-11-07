# Independent review — TSK-005 — iteration 03

REQUEST_CHANGE

## Scope and summary

Reviewed `docs/01基本設計/画面遷移図.md` against `docs/99管理/instruction/TSK-005.md`, WBS-001 TSK-005, `docs/99管理/方針.md`, requirement §3.1, and `docs/01基本設計/画面一覧.md`. Also reviewed the prior TSK-005 review/fix records, `ci/CI-005.md`, and the TSK-005 traceability entry.

The design now excludes menu-to-detail edges: menu destinations are list/entry screens, and the project, task, and document details are reached from their lists. The design includes the required screen IDs and the recommended SCR-005/013/014 path. Operational details that are not established requirements are identified as design recommendations/proposals, with unresolved product policies explicitly listed rather than represented as approved requirements. It also provides missing-ID, load/save-error, and unsaved-change handling.

The prior list/detail evidence concern is corrected: the current diagram describes those interactions as its recommended design, without claiming they are already specified by the source screen inventory. The traceability candidate still does not claim TSK-005 completion or REQ-007 satisfaction; this is consistent with `WBS-001.md:21` and `TRC-001.md:29,129`.

Approval is blocked by the following evidence gap.

## Findings (ranked)

### 1. High — Current revision has no verified CI run on the required runtime

- **Confidence:** High
- **Evidence:** `ci/CI-005.md:15-23` records the defined workflow commands as passing locally, but `ci/CI-005.md:7-8` records Node.js 20.19.4 although `.nvmrc` specifies Node 24, and explicitly states that no remote workflow was triggered. Thus the record does not establish a successful CI run for the current revision under the workflow's configured runtime.
- **Impact:** Approval requires successful CI and quality-gate evidence. Local command success on a different Node major version is useful evidence, but does not confirm the workflow result for this revision.
- **Concrete correction:** Obtain and record a successful CI run for the current revision using the configured Node 24 runtime, including the run/revision and required job results. If remote CI cannot be run, obtain an explicitly accepted equivalent validation disposition; do not treat the current local Node 20 results as a CI run.

## Prior finding disposition and other checks

- The previous menu/list-detail design concerns are addressed: the menu-to-list structure and subsequent detail transitions are present, while the labels and introductory text identify the interactions as recommended design rather than pre-existing requirements.
- The screen IDs and names used in the diagram are present in `画面一覧.md`; the required and recommended screens are within the ticket's scope.
- The open decisions around project status vocabulary, pagination/filter defaults, numbering allocation, document-save scope, and AI-answer/document association are explicitly distinguished from confirmed requirements. Error and unsaved-change behavior is addressed in the design.
- `ci/CI-005.md:29-34` reports Mermaid, link, whitespace, menu-edge, ID, and behavior checks as passing. These checks do not substitute for the missing CI run noted above.

## Decision

REQUEST_CHANGE — finding #1 remains open pending CI evidence for the current revision under the configured runtime (or a formally accepted equivalent).
