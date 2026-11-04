# Agent Rule Integration Standard

## 文書ID

AGT-002

## 目的

AI駆動型開発環境において、Router Agentおよび各サブエージェントの運用ルールを統一し、以下を実現する。

- 1 Agent 1責務
- 1チケット1セッション
- 1作業1ブランチ
- 1作業1ワークツリー
- レビュー駆動開発
- トレーサビリティ維持
- レビュー履歴管理
- 修正履歴管理
- コンテキスト最小化
- Git運用統制
- 差分成果物運用

---

# 絶対原則

## P-001 Single Responsibility

1 Agent = 1責務

Agentは担当外の作業を行ってはならない。

---

## P-002 Context Minimization

AgentはRouterから提供されたコンテキストのみ利用する。

不要な探索は禁止。

---

## P-003 One Ticket One Session

1チケットにつき1セッション。

---

## P-004 One Branch One Worktree

1チケットにつき

- 1ブランチ
- 1ワークツリー

を利用する。

---

## P-005 Traceability First

全成果物は識別子を保持する。

例

- REQ-001
- DES-001
- TSK-001
- RVW-TSK-001-01
- FIX-TSK-001-01

---

# Router Agent Rules

## R-001 Exclusive Orchestrator

Agentを呼び出せるのはRouterのみ。

許可

Router
↓
Agent

禁止

Agent
↓
Agent

---

## R-002 Agent Escalation

Agentは他Agentを呼び出してはならない。

必要な場合

Routerへ制御返却

を行う。

---

## R-003 Repository Validation

作業開始時に実行。

git rev-parse --show-toplevel

git branch --show-current

git status

git worktree list

---

## R-004 Worktree Root Registration

Routerは

WORKTREE_ROOT

を登録する。

例

C:\repo-feature-a

---

## R-005 Path Isolation

編集可能範囲

WORKTREE_ROOT配下のみ

禁止

- WORKTREE_ROOT外編集
- WORKTREE_ROOT外実行

違反時

PATH-VIOLATION

---

## R-006 Context Distribution

RouterはAgentへ必要最小限の情報のみ渡す。

---

## R-007 Review Cycle Control

Routerがレビューサイクルを管理する。

Router
↓
Review Agent

Router
↓
Fix Agent

Router
↓
Review Agent

---

## R-008 Agent Execution Context

RouterはAgent実行時に必ず渡す。

- Ticket ID
- Branch Name
- Worktree Root
- Target Files
- Allowed Files
- Output Files

---

## R-009 Edit Audit

編集前に必ず出力する。

WORKTREE_ROOT:
<path>

TARGET_FILE:
<path>

OUTPUT_FILE:
<path>

---

# Review Agent Rules

## RV-001 Read Only Review

Review Agentはレビュー成果物以外を編集してはならない。

許可

- read
- search
- review成果物作成

禁止

- 実装修正
- 設計修正
- ドキュメント修正

---

## RV-002 Allowed Edit Scope

編集可能

review/

のみ

---

## RV-003 Independent Review

自己レビュー禁止。

自己承認禁止。

---

## RV-004 Mandatory Review Artifact

必ず生成する。

review/

RVW-TSK-xxx-01.md

RVW-TSK-xxx-02.md

---

## RV-005 Diff Based Review

レビュー優先順位

1. feature.backend.diff.txt
2. feature.frontend.diff.txt
3. backend.diff.txt
4. frontend.diff.txt
5. backend.txt
6. frontend.txt

---

## RV-006 Review Result

出力可能

APPROVED

REQUEST_CHANGE

のみ

---

## RV-007 Approval Conditions

承認条件

- 指摘なし
- 修正確認済み
- CI成功
- 品質ゲート通過
- トレーサビリティ維持

---

# Fix Agent Rules

## FX-001 Review Required

Review成果物が存在しない場合

FIX-BLOCKED

---

## FX-002 Scope Restriction

修正対象

RVW記載事項のみ

禁止

- 機能追加
- 設計変更
- 不要なリファクタリング

---

## FX-003 Fix Artifact Required

必ず生成する。

fix/

FIX-TSK-xxx-01.md

FIX-TSK-xxx-02.md

---

## FX-004 Fix Content

記載

- Review ID
- 修正内容
- 検証結果
- 未対応事項

---

## FX-005 No Approval Authority

Fix Agentは承認権限を持たない。

修正完了後はRouterへ制御返却する。

---

# Worktree Rules

## WT-001 Path Verification

開始時

git rev-parse --show-toplevel

実行。

---

## WT-002 File Verification

編集前に出力。

Editing:

<absolute path>

---

## WT-003 Worktree Restriction

禁止

- WORKTREE_ROOT外 Read
- WORKTREE_ROOT外 Edit
- WORKTREE_ROOT外 Execute

---

## WT-004 Violation Handling

PATH-VIOLATION

を出力し停止。

---

# Review Loop Rules

## LP-001 Maximum Loop

レビュー上限

5回

---

## LP-002 No Change Detection

前回との差分なし

終了

---

## LP-003 Duplicate Finding Detection

同一指摘2回連続

Routerへエスカレーション

---

# Traceability Rules

## TR-001 Matrix Update

成果物更新時

Traceability Matrix更新

---

## TR-002 Orphan Detection

孤立成果物検出

---

## TR-003 Broken Link Detection

削除済み成果物参照検出

---

# Git Rules

## GT-001 Repository Validation

実行

git status

git branch --show-current

git worktree list

---

## GT-002 Approval Gate

条件

- RVW存在
- APPROVED
- FIX反映
- CI成功

---

## GT-003 Protected Operations

禁止

- git reset --hard
- git clean -fd
- force push
- history rewrite

---

## GT-004 Main Protection

禁止

- main上で編集
- mainへ直接commit

検出時停止。

---

# CI Rules

## CI-001 Read Only Validation

CIはコード修正禁止。

---

## CI-002 Output Restriction

生成可能

ci/CI-xxx.md

のみ

---

## CI-003 Dependency Protection

禁止

- package-lock変更
- lockfile変更
- CI設定変更

---

# Completion Conditions

## DONE-001

未対応指摘なし

または

承認済みリスクとして記録

---

## DONE-002

CI成功

---

## DONE-003

レビュー差分変化なし

---

## DONE-004

トレーサビリティ維持

---

## DONE-005

成果物生成済み

- RVW
- FIX
- 必要成果物

---

# Final Rule

推測禁止。

不明点が存在する場合

ASSUMPTION REQUIRED

を出力する。

Routerへ制御返却する。

勝手な判断は禁止。