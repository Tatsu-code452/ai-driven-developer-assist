# Independent Review — TSK-002

## Decision

REQUEST_CHANGE

## Findings

### 1. [P2 / Medium] QA table rows QAA-003–QAA-007 no longer match the expanded column layout

- **Confidence:** High
- **Evidence:** `docs/99管理/QA一覧.md:7` adds the “推奨回答（提案、承認未取得）” column, but lines 11–15 retain the former four-cell row shape. For example, line 11 has only ID, question, “未回答,” and source; these values consequently shift into the recommendation and status columns, leaving the source column empty.
- **Impact:** Existing unanswered items appear to have “未回答” as a recommendation, their source citations display as status, and their source column is blank. This makes the QA register misleading and breaks the documented traceability.
- **Correction:** Keep the new five-column shape consistent for QAA-003–QAA-007. Add an explicit recommendation cell (for example, “未回答／承認待ち” as appropriate) and place each existing status and citation in its own column. Do not invent recommendations unsupported by source material.

## Acceptance-criteria review

- The three TSK-002 questions are represented: the QA PREFIX, the duplicate-ID scope, and whether TSK-001 provisional IDs may be finalized. QAA-001 and QAA-002 provide recommendations and keep the items unanswered. The QA list and BUG-001 distinguish recommendations from authorized decisions and retain provisional/non-final treatment.
- `BUG-001` remains unresolved pending QAA-001; its proposed `QAA` treatment is explicitly conditional on approval.
- WBS-001 records TSK-002 as “回答案記録済み・承認待ち,” and its completion condition keeps the policy unresolved until an authorized response.
- The cited requirement/design source documents were outside the permitted review scope, so their contents could not be independently checked. No CI result was supplied; `git diff --check` passed for the three target files.
