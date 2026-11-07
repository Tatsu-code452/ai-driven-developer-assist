# TSK-005 Review Remediation — Iteration 02

- **Review ID:** RVW-TSK-005-02
- **User direction:** remove menu-to-detail transitions from the Mermaid diagram and provide recommended handling for the previously open behaviors.

## Changes

- Removed menu edges to detail screens; details are reached from their corresponding lists. Added explicit back-to-list paths that preserve list conditions.
- Replaced the prior list/detail conceptual-only relationships with proposed selection behavior: selecting a row or ID opens that record's detail.
- Added recommended MVP filters, sorting, 20-item pagination, project/task create-edit flows, document editing and save behavior, numbering-screen responsibilities, context/AI flow and data handoff, and consistent missing-ID, load/save-error, and unsaved-change handling.
- Used only fields and enum values present in the current data model/implementation where defined. Kept project status vocabulary, the numbering allocation policy, and other not-yet-established rules marked as design proposals rather than source requirements.
- Revalidated the Mermaid syntax and confirmed all diagram IDs exist in the screen inventory. Updated `ci/CI-005.md` with the current CI and document-validation results.

## Verification

- Required local workflow jobs: backend tests (9 files / 37 tests), backend build, frontend lint/build, and app lint/build all passed; root `npm ci` passed.
- Mermaid parser, relative-link, whitespace, menu-edge, screen-ID, and focused behavior assertions passed.
- The local Node version is 20 while `.nvmrc` selects 24; remote CI was not triggered.
- Review approval remains pending a fresh independent review.
