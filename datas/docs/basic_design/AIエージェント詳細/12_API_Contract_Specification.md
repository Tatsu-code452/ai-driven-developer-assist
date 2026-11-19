# 12_API_Contract_Specification.md

# AI Development Operating System API Contract Specification

Version: 1.0

---

# 1. 目的

本仕様は全Agentの標準API契約を定義する。

Agent交換可能性を保証する。

---

# 2. 共通ルール

## Request

```json
{
  "instructionId": "",
  "executionId": "",
  "traceId": "",
  "input": {}
}
```

## Response

```json
{
  "status": "",
  "summary": "",
  "output": {},
  "nextAction": ""
}
```

---

# 3. Router API

## Route Execution

```text
POST /router/execute
```

### Request

```json
{
  "instructionId": ""
}
```

### Response

```json
{
  "executionId": "",
  "assignedAgent": ""
}
```

---

# 4. Worker API

```text
POST /worker/execute
```

---

# 5. Review API

```text
POST /review/evaluate
```

### Result

```text
OK
REVIEW_NG
DECISION_REQUIRED
```

---

# 6. Lock API

## Acquire

```text
POST /lock/acquire
```

## Release

```text
POST /lock/release
```

---

# 7. Cache API

## Read

```text
GET /cache/{id}
```

## Write

```text
POST /cache
```

---

# 8. Trace API

```text
GET /trace/{traceId}
```

---

# 9. Event API

```text
POST /events/publish

POST /events/subscribe
```

---

# 10. Error Response

```json
{
  "status": "NG",
  "errorCode": "",
  "message": ""
}
```

---

# 11. Versioning

```text
v1
v2
v3
```

URL形式

```text
/api/v1/
```

---

# 12. Compatibility Rule

```text
後方互換維持

破壊的変更禁止

Deprecated期間6か月
```

---

# 13. 完成条件

```text
全AgentがAPI化

交換可能

バージョン管理可能

Trace連携可能
```

END OF DOCUMENT