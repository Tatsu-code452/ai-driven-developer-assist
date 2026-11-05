# Independent Review — TSK-002 — Iteration 03

## Decision

REQUEST_CHANGE

## Findings

### 1. [P2 — Medium] A design example still uses the retired QA prefix

- **Confidence:** High
- **Evidence:** `docs/01基本設計/AI駆動型開発 サブエージェント体系設計.md:39` still lists `QA-012`, while line 56 uses `qa/QAA-001.md`. The approved policy requires `QAA` as the QA prefix (`docs/00要件/要件定義書.md:301-303`).
- **Impact:** The design examples remain inconsistent with the approved identifier policy and the claim that related design examples were harmonized. Readers may reuse a nonconforming QA identifier.
- **Correction:** Replace `QA-012` with an approved-prefix example, such as `QAA-001`, and recheck the in-scope requirements/design examples for legacy QA prefixes.

## Review notes

- `docs/99管理/QA一覧.md:7-15` has seven five-cell QA rows. QAA-001/002 are marked answered and approved; QAA-003–007 remain unanswered. The register states that QAA-001–007 were finalized only after reference and uniqueness checks.
- `docs/99管理/WBS-001.md:18` marks TSK-002 complete with approval, existing-ID verification, and example harmonization as completion conditions. The requirements ledger records the approved decisions, and `docs/99管理/traceability/TRC-001.md` records their QA/requirement links and the stated 115-ID duplicate check.
- The supplied verification evidence states that changed Markdown links resolve and `git diff --check` passed. This is documentation/requirements work; no product-code test suite was changed or required. No CI run is claimed.
