# 12_API_Contract_Specification.md

# AI Development Operating System API Contract Specification

Version: 2.0

---

# 1. 文書概要

## 1.1 目的

本仕様は AI Development Operating System（AI-OS）の全Agent共通API契約を定義する。

本仕様は以下を保証する。

- Agent交換可能性
- 疎結合
- Version管理
- Traceability維持
- Retry対応
- Security連携
- Event Protocol連携

---

# 2. API設計原則

## Principle-001

全Agent機能はAPIとして公開可能でなければならない。

---

## Principle-002

APIは後方互換性を維持する。

---

## Principle-003

TraceIdを必須とする。

---

## Principle-004

全通信は監査対象とする。

---

## Principle-005

APIは冪等性を考慮する。

---

## Principle-006

Version管理を必須とする。

---

# 3. API Architecture

```text
Client
   ↓

API Gateway
   ↓

Router-Agent
   ↓

Worker-Agent

Reviewer-Agent

Foundation Service
```

---

# 4. Common Request Model

```json
{
  "instructionId": "",
  "executionId": "",
  "traceId": "",
  "correlationId": "",
  "input": {}
}
```

---

# 5. Common Response Model

```json
{
  "status": "",
  "summary": "",
  "output": {},
  "nextAction": ""
}
```

---

# 6. Common Header

```http
X-Trace-Id

X-Execution-Id

X-Correlation-Id

X-Agent-Id

X-Request-Id
```

---

# 7. Authentication

## Support

```text
OAuth2

OIDC

JWT

GitHub App
```

---

## Authorization Header

```http
Authorization: Bearer <token>
```

---

# 8. Router API

## Execute

```http
POST /api/v1/router/execute
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

# 9. Worker API

## Execute

```http
POST /api/v1/worker/execute
```

### Response Status

```text
OK

REVIEW_REQUIRED

BLOCK

TIMEOUT
```

---

# 10. Reviewer API

## Evaluate

```http
POST /api/v1/review/evaluate
```

### Response

```text
OK

REVIEW_NG

DECISION_REQUIRED
```

---

# 11. Lock API

## Acquire

```http
POST /api/v1/lock/acquire
```

---

## Release

```http
POST /api/v1/lock/release
```

---

## Renew

```http
POST /api/v1/lock/renew
```

---

# 12. Cache API

## Get

```http
GET /api/v1/cache/{id}
```

---

## Create

```http
POST /api/v1/cache
```

---

## Delete

```http
DELETE /api/v1/cache/{id}
```

---

# 13. Trace API

## Query

```http
GET /api/v1/trace/{traceId}
```

---

## Search

```http
GET /api/v1/trace/search
```

---

# 14. Event API

## Publish

```http
POST /api/v1/events/publish
```

---

## Subscribe

```http
POST /api/v1/events/subscribe
```

---

## Replay

```http
POST /api/v1/events/replay
```

---

# 15. Health API

## Liveness

```http
GET /health/live
```

---

## Readiness

```http
GET /health/ready
```

---

## Health

```http
GET /health
```

---

# 16. Standard Status Code

| HTTP | Meaning         |
| ---- | --------------- |
| 200  | Success         |
| 400  | Invalid Request |
| 401  | Unauthorized    |
| 403  | Forbidden       |
| 404  | Not Found       |
| 409  | Conflict        |
| 429  | Rate Limit      |
| 500  | Internal Error  |

---

# 17. Error Response Model

```json
{
  "status": "NG",
  "errorCode": "",
  "message": "",
  "timestamp": "",
  "traceId": ""
}
```

---

# 18. Timeout Policy

| Service  | Timeout |
| -------- | ------- |
| Router   | 30秒    |
| Worker   | 5分     |
| Review   | 5分     |
| Recovery | 10分    |

---

# 19. Retry Policy

## Retry Count

```text
3回
```

---

## Interval

```text
30秒

1分

5分
```

---

## Failure

```text
DLQ送信
```

---

# 20. Rate Limit

## Standard

```text
1000 Request / Hour / Agent
```

---

## Burst

```text
100 Request / Minute
```

---

# 21. Version Management

## URL

```http
/api/v1/

/api/v2/
```

---

## Rule

```text
後方互換維持

破壊的変更禁止

Deprecated期間6か月
```

---

# 22. OpenAPI Support

必須。

```text
OpenAPI 3.1
```

---

## Example

```yaml
openapi: 3.1.0
```

---

# 23. Observability

## 必須項目

```text
TraceId

ExecutionId

CorrelationId

Latency

StatusCode
```

---

## Log Format

```json
{
  "traceId": "",
  "executionId": "",
  "latency": 0,
  "statusCode": 200
}
```

---

# 24. Audit Requirement

監査対象

```text
Request

Response

Authentication

Authorization

Failure

Retry
```

---

# 25. Security Requirement

すべてのAPIは

```text
TLS1.3

JWT Validation

RBAC

Audit Log
```

を必須とする。

---

# 26. Governance Requirement

以下操作は承認必須。

```text
Release

Policy Update

Permission Update

Trace Delete
```

---

# 27. Compatibility Requirement

Agent差し替え条件

```text
同一Schema

同一Status

同一Trace Contract
```

---

# 28. Non Functional Requirement

```text
99.9% Availability

Horizontal Scale

Retry Support

Audit Support
```

---

# 29. Quality Requirement

```text
交換可能

監査可能

追跡可能

再現可能

保守可能
```

---

# 30. 完成条件

API Contract Framework が完成している状態とは以下を満たす。

```text
全Agent API化

Version管理可能

OpenAPI対応

OAuth対応

Retry対応

監査可能

Trace連携済

交換可能
```

---

END OF DOCUMENT