# 11_Event_Protocol_Specification.md

# AI Development Operating System Event Protocol Specification

Version: 1.0

---

# 1. 目的

本仕様は Agent 間通信およびイベント駆動アーキテクチャを定義する。

AI-OS は Execution 中心ではなく Event 中心で動作する。

---

# 2. 設計原則

## Principle-001

全状態変化はイベントとして発行する。

## Principle-002

Agent間通信はイベント経由とする。

## Principle-003

イベントは冪等でなければならない。

## Principle-004

イベントは再送可能でなければならない。

---

# 3. Event Model

```json
{
  "eventId": "",
  "eventType": "",
  "traceId": "",
  "instructionId": "",
  "executionId": "",
  "sourceAgent": "",
  "targetAgent": "",
  "timestamp": "",
  "payload": {}
}
```

---

# 4. Event Category

## Instruction Events

```text
INSTRUCTION_CREATED
INSTRUCTION_UPDATED
INSTRUCTION_COMPLETED
```

## Execution Events

```text
EXECUTION_CREATED
EXECUTION_STARTED
EXECUTION_COMPLETED
EXECUTION_FAILED
```

## Review Events

```text
REVIEW_REQUESTED
REVIEW_APPROVED
REVIEW_REJECTED
```

## Decision Events

```text
DECISION_REQUIRED
DECISION_APPROVED
DECISION_REJECTED
```

## Recovery Events

```text
RECOVERY_STARTED
RECOVERY_COMPLETED
```

## System Events

```text
TIMEOUT_DETECTED
CACHE_INVALIDATED
LOCK_FORCE_UNLOCKED
CONFLICT_DETECTED
```

---

# 5. Event Flow

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

# 6. Event Store

全イベントは永続保存する。

```json
{
  "eventId": "",
  "eventType": "",
  "occurredAt": "",
  "payload": {}
}
```

---

# 7. Retry Rule

失敗時

```text
1回目 30秒

2回目 1分

3回目 5分

以降 Watchdog判断
```

---

# 8. Event Quality

```text
Trace可能

再送可能

順序保証

冪等

監査可能
```

---

# 9. 完成条件

```text
全状態変化がイベント化

全Agent通信がイベント化

イベント追跡可能

再送可能
```

END OF DOCUMENT