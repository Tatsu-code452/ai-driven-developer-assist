# 03_Data_Model_Specification.md

# AI Development Operating System Data Model Specification

Version: 1.0

---

# 1. 文書概要

## 1.1 目的

本仕様は AI Development Operating System（AI-OS）において利用する全データモデルを定義する。

本仕様は以下を保証する。

- 識別可能性
- トレーサビリティ
- 再現可能性
- 並列実行対応
- 監査可能性
- 障害復旧可能性

すべての Agent、Execution、成果物は本仕様で定義するデータモデルに準拠しなければならない。 

---

# 2. データモデリング原則

## Principle-001

全レコードは一意に識別可能でなければならない。 

---

## Principle-002

全成果物はトレーサブルでなければならない。 

---

## Principle-003

全更新履歴は復元可能でなければならない。 

---

## Principle-004

UUIDを唯一の主キーとする。 

---

## Principle-005

DisplayIdは人間向け識別子である。 

---

# 3. 共通メタモデル

AI-OSで管理する全オブジェクトは共通メタ情報を継承する。

## BaseEntity

```json
{
  "id": "UUID",
  "displayId": "",
  "instructionId": "",
  "executionId": "",
  "traceId": "",
  "createdAt": "",
  "updatedAt": ""
}
```



---

# 4. 識別子モデル

## UUID

内部識別子

```text
550e8400-e29b-41d4-a716-446655440000
```



---

## DisplayId

人間向け識別子

```text
REQ-000001
TASK-000001
BUG-000001
QUESTION-000001
ISSUE-000001
DECISION-000001
EXEC-000001
INST-000001
```



---

# 5. Instructionモデル

## 概要

Instructionは全実行の起点となる要求オブジェクトである。

---

## データ構造

```json
{
  "instructionId": "INST-000001",
  "title": "",
  "description": "",
  "priority": "HIGH",
  "status": "OPEN"
}
```



---

## 状態

```text
OPEN
ASSIGNED
IN_PROGRESS
REVIEW
COMPLETED
CLOSED
```

---

## 優先度

```text
CRITICAL
HIGH
MEDIUM
LOW
```

---

# 6. Executionモデル

## 概要

ExecutionはAgent実行単位を表す。

Instructionは複数Executionを持つことができる。 

---

## データ構造

```json
{
  "executionId": "EXEC-000001",
  "instructionId": "INST-000001",
  "assignedAgent": "",
  "status": "",
  "startedAt": "",
  "completedAt": ""
}
```



---

## 実行状態

```text
READY
WORKING
REVIEW_REQUIRED
COMPLETED
FAILED
TIMEOUT
```



---

# 7. Deliverableモデル

## 概要

DeliverableはExecutionによって生成された成果物を表す。

---

## データ構造

```json
{
  "deliverableId": "",
  "type": "",
  "version": "",
  "owner": "",
  "traceId": ""
}
```



---

## 成果物種別

```text
SOURCE_CODE
DOCUMENT
DESIGN
TEST_CASE
TEST_RESULT
ISSUE
DECISION
RELEASE
```

---

## バージョン規則

```text
Major.Minor.Patch
例

1.0.0
1.1.0
1.1.1
```

---

# 8. Reviewモデル

## 概要

レビュー結果を保持する。

---

## データ構造

```json
{
  "reviewId": "",
  "executionId": "",
  "reviewer": "",
  "result": "",
  "comment": ""
}
```



---

## Review Result

```text
OK
REVIEW_NG
DECISION_REQUIRED
```



---

# 9. Decisionモデル

## 概要

人間またはPMによる最終判断を保持する。

---

## データ構造

```json
{
  "decisionId": "",
  "traceId": "",
  "decisionMaker": "",
  "decision": "",
  "reason": "",
  "decidedAt": ""
}
```

---

# 10. Issueモデル

## 概要

課題管理情報を保持する。

---

## データ構造

```json
{
  "issueId": "",
  "title": "",
  "description": "",
  "priority": "",
  "status": ""
}
```

---

## ステータス

```text
OPEN
ANALYZING
ASSIGNED
FIXING
VERIFYING
CLOSED
```

---

# 11. Lockモデル

## 概要

排他制御情報を保持する。

---

## データ構造

```json
{
  "lockId": "",
  "resource": "",
  "ownerAgent": "",
  "acquiredAt": "",
  "expireAt": ""
}
```



---

## Lock状態

```text
ACTIVE
EXPIRED
FORCE_UNLOCKED
RELEASED
```

---

## TTL

```text
30分
```



---

# 12. Cacheモデル

## 概要

再解析防止用キャッシュ管理モデル。

---

## データ構造

```json
{
  "cacheId": "",
  "targetId": "",
  "hash": "",
  "cachedAt": "",
  "expireAt": ""
}
```



---

## TTL

```text
24時間
```



---

## Cache状態

```text
VALID
INVALID
EXPIRED
DELETED
```

---

# 13. Traceモデル

## 概要

トレーサビリティ管理モデル。

---

## データ構造

```json
{
  "traceId": "",
  "instructionId": "",
  "executionId": "",
  "deliverableId": "",
  "reviewId": "",
  "decisionId": ""
}
```



---

## Trace Chain

```text
Instruction
 ↓
Execution
 ↓
Deliverable
 ↓
Review
 ↓
Decision
 ↓
Completion
```



---

# 14. ExecutionLogモデル

## 概要

Agent実行履歴管理モデル。

---

## データ構造

```json
{
  "logId": "",
  "instructionId": "",
  "executionId": "",
  "traceId": "",
  "agent": "",
  "status": "",
  "summary": "",
  "timestamp": ""
}
```



---

## ログ種別

```text
Execution
Review
Decision
Split
Conflict
Timeout
Unlock
Cache
Recovery
```



---

# 15. AuditLogモデル

## 概要

監査証跡を記録する。

---

## データ構造

```json
{
  "eventId": "",
  "eventType": "",
  "resource": "",
  "actor": "",
  "timestamp": ""
}
```



---

## Event Type

```text
CREATE
UPDATE
DELETE
REVIEW
DECISION
LOCK
UNLOCK
MERGE
CONFLICT
TIMEOUT
RECOVERY
```



---

# 16. Recoveryモデル

## 概要

障害復旧履歴を保持する。

---

## データ構造

```json
{
  "recoveryId": "",
  "executionId": "",
  "errorCode": "",
  "recoveredBy": "",
  "startAt": "",
  "completedAt": "",
  "result": ""
}
```



---

# 17. GitWorktreeモデル

## 概要

Git作業領域を管理する。

---

## データ構造

```json
{
  "worktreeId": "",
  "instructionId": "",
  "branch": "",
  "path": "",
  "createdAt": ""
}
```



---

## 命名規則

```text
wt_INST-000001
wt_BUG-000001
```



---

# 18. エンティティ関連図

```text
Instruction
    │
    ├──── Execution
    │           │
    │           ├──── Deliverable
    │           │
    │           ├──── Review
    │           │
    │           └──── ExecutionLog
    │
    ├──── Decision
    │
    ├──── Trace
    │
    └──── Worktree

Deliverable
    │
    ├──── Lock
    │
    ├──── Cache
    │
    └──── AuditLog
```

---

# 19. データ保持要件

全エンティティは以下を満たさなければならない。

```text
一意識別可能

追跡可能

検索可能

監査可能

復旧可能

参照整合性維持

履歴保持可能
```



---

# 20. 完成条件

Data Model Layer が完成している状態とは以下を満たすこととする。

```text
全Agentが共通モデルに準拠

全成果物がTrace可能

全Executionが監査可能

全障害が復旧追跡可能

全識別子が一意

全データが再現可能
```



---
END OF DOCUMENT