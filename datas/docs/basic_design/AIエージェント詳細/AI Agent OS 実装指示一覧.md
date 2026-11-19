# AI Agent OS 実装指示一覧

---

# R001 shared-models

## TASK

共通データモデル実装

## INPUT

```text
03_Data_Model_Specification
```

## OUTPUT

```text
shared/models/

Instruction

Execution

Review

Decision

Trace

Lock

Cache

AuditLog
```

## DONE

```text
Entity作成済

Schema定義済

DTO定義済

UnitTest成功
```

---

# R002 shared-errors

## TASK

状態管理・エラー管理実装

## INPUT

```text
04_State_And_Error_Code_Specification
```

## OUTPUT

```text
shared/errors/

ErrorCode

StateCode

Exception
```

## DONE

```text
ErrorCode実装

StateCode実装

Exception実装
```

---

# R003 agent-sdk-core

## TASK

Agent SDK Core作成

## INPUT

```text
16_Agent_SDK_Specification

R001

R002
```

## OUTPUT

```text
sdk/core/

BaseAgent

AgentRequest

AgentResponse

Lifecycle
```

## DONE

```text
全Agent継承可能
```

---

# R004 event-sdk

## TASK

Event SDK作成

## INPUT

```text
11_Event_Protocol_Specification
```

## OUTPUT

```text
sdk/events/

Event

Publisher

Subscriber
```

## DONE

```text
Publish API実装
```

---

# R005 event-bus

## TASK

Event Bus実装

## INPUT

```text
11_Event_Protocol

R004
```

## OUTPUT

```text
services/event-bus/

Publisher

Subscriber

Retry

DLQ
```

## DONE

```text
Publish成功

Subscribe成功
```

---

# R006 event-store

## TASK

Event Store実装

## INPUT

```text
11_Event_Protocol
```

## OUTPUT

```text
services/event-store/

EventRepository

Replay

Ordering
```

## DONE

```text
Replay可能
```

---

# R007 trace-service

## TASK

Trace管理実装

## INPUT

```text
09_Traceability_And_Audit
```

## OUTPUT

```text
services/trace/

TraceService

TraceRepository
```

## DONE

```text
Trace検索可能
```

---

# R008 audit-service

## TASK

Audit管理実装

## INPUT

```text
09_Traceability_And_Audit
```

## OUTPUT

```text
services/audit/

AuditService

AuditRepository
```

## DONE

```text
Audit保存可能
```

---

# R009 lock-service

## TASK

Lock管理実装

## INPUT

```text
07_Lock_Management
```

## OUTPUT

```text
services/lock/

Acquire

Release

Renew
```

## DONE

```text
TTL対応
```

---

# R010 cache-service

## TASK

Cache管理実装

## INPUT

```text
06_Context_Management
```

## OUTPUT

```text
services/cache/

Lookup

Store

Invalidate
```

## DONE

```text
Hash管理可能
```

---

# R011 context-engine

## TASK

Context構築エンジン実装

## INPUT

```text
06_Context_Management

R007

R010
```

## OUTPUT

```text
services/context/

Builder

Prioritizer

Splitter
```

## DONE

```text
SPLIT_REQUIRED対応
```

---

# R012 execution-engine

## TASK

Execution Engine実装

## INPUT

```text
01_Foundation

04_State
```

## OUTPUT

```text
services/execution/

ExecutionManager

StateMachine
```

## DONE

```text
Execution生成可能
```

---

# R013 recovery-engine

## TASK

Recovery Engine実装

## INPUT

```text
05_Recovery
```

## OUTPUT

```text
services/recovery/

RecoveryManager
```

## DONE

```text
TimeoutRecovery動作
```

---

# R014 watchdog-service

## TASK

Watchdog実装

## INPUT

```text
05_Recovery

10_Operation
```

## OUTPUT

```text
services/watchdog/

HealthCheck

TimeoutMonitor
```

## DONE

```text
Timeout検知可能
```

---

# R015 router-agent

## TASK

Router Agent実装

## INPUT

```text
02_Agent

01_Foundation

R011

R012
```

## OUTPUT

```text
apps/router-agent/
```

## DONE

```text
Execution生成可能
```

---

# R016 reviewer-agent

## TASK

Reviewer Agent実装

## INPUT

```text
02_Agent
```

## OUTPUT

```text
apps/reviewer-agent/
```

## DONE

```text
Review実行可能
```

---

# R017 governance-service

## TASK

Governance実装

## INPUT

```text
14_Governance
```

## OUTPUT

```text
services/governance/

Approval

Escalation

Decision
```

## DONE

```text
Approval動作
```

---

# R018 security-service

## TASK

Security実装

## INPUT

```text
13_Security
```

## OUTPUT

```text
services/security/

Auth

RBAC

Secret
```

## DONE

```text
OAuth対応
```

---

# R019 identity-service

## TASK

Identity管理実装

## INPUT

```text
13_Security
```

## OUTPUT

```text
services/identity/

User

Role

Permission
```

## DONE

```text
RBAC動作
```

---

# R020 api-gateway

## TASK

API Gateway実装

## INPUT

```text
12_API
```

## OUTPUT

```text
gateway/

Routing

Auth

RateLimit
```

## DONE

```text
TraceHeader対応
```

---

# R021-R027 Worker Agent群

## TASK

業務Agent実装

## INPUT

```text
02_Agent

16_Agent_SDK
```

## OUTPUT

```text
pm-agent

architect-agent

developer-agent

qa-agent

document-agent

issue-agent

release-agent
```

## DONE

```text
SDK準拠

ContractTest成功
```

---