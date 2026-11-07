# RVW-TSK-006-01

**Decision: REQUEST_CHANGE**

## Scope and method

- **Scope:** TSK-006 project persistence/API, project list/detail UI, project associations, and directly related design/traceability documents.
- **Base:** `main` at `a61cc045cb179271ea810bc350997227f77992ee` (same as `HEAD`); reviewed the current uncommitted diff and relevant untracked files.
- **Runtime:** Windows, Node.js `v20.19.4`, npm `11.6.1`.
- Compared scoped changes to `main`, reviewed the project design and traceability updates, and ran `npx vitest run src/repositories/__tests__/ProjectRepository.test.ts` from `backend/` (1 file, 5 tests passed). CI and other quality-gate results were not available for confirmation.

## Findings

### P2 — High confidence: Edits made while saving are silently discarded

`frontend/src/pages/ProjectDetailPage.tsx:124-128` snapshots the form into `input` before awaiting the create/update request. On success, lines `140-145` replace the form with the saved response and leave edit mode. The name, description, and status controls at lines `240-272` remain enabled while `saving` is true (only the buttons are disabled at lines `277` and `284`). A user can therefore continue editing during a slow save, then lose those newer edits without a prompt when the response arrives.

**Correction:** Disable the editable controls for the duration of the request, or preserve and surface changes made after submission rather than overwriting them.

## Other review notes

- No additional confirmed defects found in the reviewed scope.
- WBS-001 and TRC-001 continue to identify TSK-006 as a plan mapping rather than completed requirement coverage.
- The repository test passed; broader CI/quality-gate success remains unverified and is not represented as passed.
