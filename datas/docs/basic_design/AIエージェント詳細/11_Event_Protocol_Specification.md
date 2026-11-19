# 11_Event_Protocol_Specification.md

# AI Development Operating System Event Protocol Specification

Version: 2.0

---

# 1. 文書概要

## 1.1 目的

本仕様は AI Development Operating System（AI-OS）における Agent 間通信およびイベント駆動アーキテクチャを定義する。

AI-OS は Execution 中心ではなく Event 中心で動作する。

本仕様は以下を保証する。

- Event Driven Architecture
- Agent疎結合
- 冪等処理
- 再送可能性
- Traceability
- Event Replay
- Recovery支援
- Audit対応

---

# 2. Event設計原則

## Principle-001

全状態変化はイベントとして発行する。

---

## Principle-002

Agent間通信はイベント経由とする。

---

## Principle-003

イベントは冪等でなければならない。

---

## Principle-004

イベントは再送可能でなければならない。

---

## Principle-005

イベントは再生可能でなければならない。

---

## Principle-006

イベントは監査対象とする。

---

# 3. Event Architecture

```text
Instruction
      ↓

Event Bus
      ↓

Router-Agent
      ↓

Worker-Agent
      ↓

Reviewer-Agent
      ↓

ExecutionLog-Agent

      ↓

Event Store
```

---

# 4. Event Model

```json
{
  "eventId": "",
  "schemaVersion": "2.0",
  "eventType": "",
  "streamId": "",
  "sequenceNo": 1,
  "traceId": "",
  "instructionId": "",
  "executionId": "",
  "sourceAgent": "",
  "targetAgent": "",
  "correlationId": "",
  "causationId": "",
  "timestamp": "",
  "payload": {}
}
```

---

# 5. Event識別体系

## Event ID

```text
UUID
```

---

## Stream ID

```text
Instruction単位
```

例

```text
STR-INST-000001
```

---

## Correlation ID

業務トランザクション単位

例

```text
CORR-000001
```

---

## Causation ID

親イベント

例

```text
EXECUTION_CREATED
 ↓
causationId
 ↓
EXECUTION_STARTED
```

---

# 6. Event Versioning

## 管理形式

```json
{
  "schemaVersion": "2.0"
}
```

---

## ルール

```text
破壊的変更禁止

旧Version共存可

後方互換維持
```

---

# 7. Event Ordering

## Sequence Model

```json
{
  "streamId": "",
  "sequenceNo": 1
}
```

---

## Rule

```text
同一Streamは順序保証

欠番禁止

逆順処理禁止
```

---

## 例

```text
1 INSTRUCTION_CREATED

2 EXECUTION_CREATED

3 EXECUTION_STARTED

4 REVIEW_REQUESTED

5 REVIEW_APPROVED

6 EXECUTION_COMPLETED
```

---

# 8. Event Category

## Instruction Events

```text
INSTRUCTION_CREATED

INSTRUCTION_UPDATED

INSTRUCTION_COMPLETED

INSTRUCTION_CLOSED
```

---

## Execution Events

```text
EXECUTION_CREATED

EXECUTION_STARTED

EXECUTION_COMPLETED

EXECUTION_FAILED

EXECUTION_TIMEOUT
```

---

## Review Events

```text
REVIEW_REQUESTED

REVIEW_APPROVED

REVIEW_REJECTED
```

---

## Decision Events

```text
DECISION_REQUIRED

DECISION_APPROVED

DECISION_REJECTED
```

---

## Lock Events

```text
LOCK_ACQUIRED

LOCK_RELEASED

LOCK_EXPIRED

LOCK_FORCE_UNLOCKED
```

---

## Cache Events

```text
CACHE_CREATED

CACHE_INVALIDATED

CACHE_EXPIRED
```

---

## Git Events

```text
WORKTREE_CREATED

MERGE_COMPLETED

CONFLICT_DETECTED
```

---

## Recovery Events

```text
RECOVERY_STARTED

RECOVERY_COMPLETED

RECOVERY_FAILED
```

---

# 9. Event Flow

```text
Instruction
 ↓

INSTRUCTION_CREATED
 ↓

EXECUTION_CREATED
 ↓

EXECUTION_STARTED
 ↓

REVIEW_REQUESTED
 ↓

REVIEW_APPROVED
 ↓

EXECUTION_COMPLETED
```

---

# 10. Event Store

## 目的

全イベントを永続保存し、Replay・監査・復旧を可能にする。

---

## Event Store Model

```json
{
  "eventId": "",
  "eventType": "",
  "streamId": "",
  "sequenceNo": 0,
  "occurredAt": "",
  "payload": {}
}
```

---

## 保存対象

```text
Instruction Events

Execution Events

Review Events

Decision Events

Recovery Events

System Events
```

---

# 11. Event Delivery Model

## At Least Once

標準配送方式。

```text
Delivery

↓

Ack

↓

Success
```

---

## Delivery Failure

```text
Delivery

↓

Timeout

↓

Retry

↓

DLQ
```

---

# 12. Retry Strategy

## Retry Count

```text
3回
```

---

## Interval

```text
1回目 30秒

2回目 1分

3回目 5分
```

---

## Policy

```text
指数バックオフ
```

採用。

---

# 13. Dead Letter Queue

## 目的

配信失敗イベントを隔離する。

---

## 格納条件

```text
Retry超過

Agent不存在

不正Payload

Schema不一致
```

---

## DLQ Model

```json
{
  "eventId": "",
  "reason": "",
  "failedAt": ""
}
```

---

# 14. Event Replay

## 目的

Execution再構築を可能にする。

---

## Replay対象

```text
Execution

Review

Decision

Audit

Recovery
```

---

## Replay Flow

```text
Event Store

↓

Replay Request

↓

Event Read

↓

Execution Restore
```

---

# 15. Correlation Management

## Correlation ID

業務トランザクション識別子。

```json
{
  "correlationId": ""
}
```

---

## Rule

同一業務のイベントは同一Correlationを持つ。

---

## Example

```text
Instruction

↓

Execution Created

↓

Review Requested

↓

Review Approved

↓

Execution Completed
```

Correlationは同一。

---

# 16. Causation Management

## Causation ID

生成元イベント。

```json
{
  "causationId": ""
}
```

---

## Example

```text
EXECUTION_CREATED

↓

EXECUTION_STARTED
```

EXECUTION_CREATED が原因。

---

# 17. Event Security

## Rule

イベント改ざん禁止。

---

## Validation

```text
Hash Validation

Schema Validation

Version Validation
```

---

# 18. Event Audit

## Event Log Model

```json
{
  "eventId": "",
  "eventType": "",
  "executionId": "",
  "traceId": "",
  "agent": "",
  "timestamp": ""
}
```

---

## Audit対象

```text
Publish

Subscribe

Retry

Replay

DLQ

Delete
```

---

# 19. Event Retention Policy

| Event       | Retention |
| ----------- | --------- |
| Instruction | Permanent |
| Decision    | Permanent |
| Audit       | Permanent |
| Execution   | 5 Years   |
| Recovery    | 5 Years   |
| Cache       | 30 Days   |

---

# 20. Event Quality Requirements

イベントは以下を満たす。

```text
Trace可能

再送可能

Replay可能

順序保証

冪等

監査可能

復旧可能
```

---

# 21. Event Bus要件

## 必須機能

```text
Publish

Subscribe

Retry

Replay

Ordering

DLQ
```

---

## 非機能要件

```text
高可用性

水平スケール

障害耐性

監査対応
```

---

# 22. Event Governance

## 禁止事項

```text
未承認Event削除

Trace切断

Replay履歴削除

監査ログ削除
```

---

# 23. Monitoring

監視主体

```text
Watchdog-Agent
```

---

## 監視項目

```text
Event遅延

Retry件数

DLQ件数

Replay件数

Ordering違反件数
```

---

# 24. SLA

## Publish

```text
5秒以内
```

---

## Delivery

```text
30秒以内
```

---

## Replay

```text
5分以内
```

---

# 25. 完成条件

Event Protocol Framework が完成している状態とは以下を満たす。

```text
全状態変化がイベント化

Agent通信がイベント化

Event Replay可能

DLQ対応

Retry対応

Ordering保証

Trace維持

監査可能
```

---

END OF DOCUMENT