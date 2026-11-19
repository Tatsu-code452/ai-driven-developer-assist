# 06_Context_Management_Specification.md

# AI Development Operating System Context Management Specification

Version: 1.0

---

# 1. 文書概要

## 1.1 目的

本仕様は AI Development Operating System（AI-OS）における Context Management を定義する。

Context Management は AI Agent が作業に必要な情報のみを選択的に利用し、コンテキスト枯渇、トークン超過、不要情報混入を防止するための基盤機能である。

本仕様は以下を保証する。

- Context最適化
- トークン消費最適化
- 並列作業支援
- Agent責務分離
- コンテキスト枯渇防止
- トレーサビリティ維持
- 自動分割対応



---

# 2. Context Management 原則

## Principle-001

Agent は渡されたコンテキスト以外を参照してはならない。



---

## Principle-002

必要最小限の情報のみを利用する。

---

## Principle-003

コンテキスト上限到達前に停止する。



---

## Principle-004

超過時は必ず分割を行う。



---

## Principle-005

分割不能という判断を禁止する。

必ず代替分割案を提示する。



---

## Principle-006

Contextは再現可能でなければならない。



---

# 3. Contextとは

ContextとはAgentが作業時に利用可能な情報集合である。

対象情報

```text
Instruction

Requirement

Decision

Deliverable

ExecutionLog

Review結果

Issue

Trace情報

関連成果物

Git情報
```



---

# 4. Context構成モデル

```text
Context
 ├─ Requirement
 ├─ Decision
 ├─ Current Task
 ├─ Deliverable
 ├─ Review
 ├─ ExecutionLog
 ├─ Trace
 └─ Related Artifact
```

---

# 5. Context優先順位

Contextは以下順で選択する。

```text
1 Requirement

2 Decision

3 Current Task

4 Deliverable

5 Logs

6 Others
```



---

# 6. Context選択フロー

```text
Instruction受領
 ↓
対象Task特定
 ↓
必要成果物抽出
 ↓
Decision抽出
 ↓
Review結果抽出
 ↓
Contextサイズ計測
 ↓
制限値判定
 ↓
Workerへ引渡し
```



---

# 7. Context制限

## ファイル数

```text
30件
```



---

## 最大文字数

```text
100,000文字
```



---

## 最大サイズ

```text
500KB
```



---

# 8. 超過判定

以下いずれかを満たす場合。

```text
ファイル数 > 30

文字数 > 100,000

サイズ > 500KB
```

結果

```text
SPLIT_REQUIRED
```



---

# 9. Context状態

## READY

利用可能

---

## LOADING

構築中

---

## VALID

有効

---

## INVALID

無効

---

## EXPIRED

期限切れ

---

## SPLIT_REQUIRED

分割必要



---

# 10. Contextデータモデル

```json
{
  "contextId": "",
  "instructionId": "",
  "executionId": "",
  "traceId": "",
  "priority": "",
  "resources": [],
  "size": 0,
  "characterCount": 0,
  "createdAt": "",
  "expireAt": ""
}
```



---

# 11. Context Resourceモデル

```json
{
  "resourceId": "",
  "resourceType": "",
  "resourcePath": "",
  "version": "",
  "priority": ""
}
```

---

## Resource Type

```text
INSTRUCTION
REQUIREMENT
DECISION
DELIVERABLE
REVIEW
ISSUE
TRACE
LOG
CACHE
```



---

# 12. Context Assembly Rule

Context構築時は以下順で収集する。

```text
Requirement

↓

Decision

↓

Current Task

↓

Related Deliverable

↓

Review Result

↓

Execution Log

↓

Others
```



---

# 13. Agent別Context方針

## PM-Agent

優先情報

```text
Requirement
Decision
Issue
Review
```



---

## Architect-Agent

優先情報

```text
Requirement
Architecture
Decision
Trace
```



---

## Developer-Agent

優先情報

```text
Current Task
Design
SourceCode
Review
```



---

## Reviewer-Agent

優先情報

```text
Deliverable
Requirement
Decision
Review History
```



---

## QA-Agent

優先情報

```text
Requirement
TestCase
TestResult
Issue
```



---

# 14. Context分割戦略

## Level-1

ファイル分割

例

```text
001-050

051-100
```



---

## Level-2

成果物分割

例

```text
画面設計

API設計

DB設計
```



---

## Level-3

工程分割

例

```text
調査

分析

設計

レビュー

統合
```



---

## Level-4

中間成果物分割

例

```text
REQ分析

TASK分析

BUG分析

マッピング

統合
```



---

# 15. Context圧縮ルール

コンテキスト逼迫時は以下順で圧縮する。

```text
不要ログ削除

↓

古いReview削除

↓

不要Deliverable削除

↓

サマリー化

↓

分割
```

---

# 16. Context Cache連携

Context構築時はCacheを利用する。

利用条件

```text
Hash一致
```

利用不可条件

```text
Hash不一致
```

結果

```text
再解析
```



---

# 17. Context失効条件

以下発生時はContextを再生成する。

```text
Git Pull

Merge

Rebase

Branch変更

Worktree変更

Decision変更

Requirement変更
```



---

# 18. Context Recovery

対象

```text
CACHE_INVALID

INVALID_CONTEXT

SPLIT_REQUIRED
```



---

## 復旧フロー

```text
無効検知
 ↓
再解析
 ↓
Context再生成
 ↓
サイズ検証
 ↓
Execution再開
```



---

# 19. Context監視

監視主体

```text
Watchdog-Agent
```



---

## 監視対象

```text
文字数

サイズ

トークン量

有効期限

キャッシュ状態
```



---

## 監視結果

```text
SPLIT_REQUIRED

CACHE_INVALID

TIMEOUT
```



---

# 20. Context監査モデル

Context生成時は監査ログを出力する。

```json
{
  "eventType": "CONTEXT_BUILD",
  "contextId": "",
  "executionId": "",
  "resourceCount": 0,
  "size": 0,
  "timestamp": ""
}
```



---

# 21. Context品質要件

Contextは以下を満たさなければならない。

```text
必要情報のみ含む

不要情報を含まない

再現可能

Trace可能

監査可能

復旧可能

制限値内
```



---

# 22. 完成条件

Context Management Framework が完成している状態とは以下を満たすことをいう。

```text
全Agentが制限内で動作

コンテキスト超過を防止

自動分割可能

自動再生成可能

トレーサビリティ維持

監査可能

並列実行対応

キャッシュ活用可能
```



---
END OF DOCUMENT