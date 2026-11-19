# AI Agent Operating System 開発WBS

## Level 0

```text
AI Agent Operating System
```

---

# 1. Foundation Platform

仕様対応

```text
01 Foundation
03 Data Model
04 State/Error
```

---

## 1.1 共通モデル

### R001 shared-models

成果物

```text
Entity

DTO

Schema

Instruction

Execution

Decision

Review

Trace
```

---

### R002 shared-errors

成果物

```text
State Code

Error Code

Severity

Exception
```

---

## 1.2 SDK基盤

### R003 agent-sdk-core

成果物

```text
BaseAgent

Agent Interface

Request

Response

Lifecycle
```

---

### R004 event-sdk

成果物

```text
Publish API

Subscribe API

Replay API

Event Model
```

---

# 2. Event Platform

仕様対応

```text
11 Event Protocol
```

---

## 2.1 Event Messaging

### R005 event-bus

成果物

```text
Publisher

Subscriber

Retry

DLQ
```

---

### R006 event-store

成果物

```text
Event Store

Replay

Ordering

Retention
```

---

# 3. Traceability Platform

仕様対応

```text
09 Traceability
```

---

### R007 trace-service

成果物

```text
Trace Chain

Trace Search

Trace Query
```

---

### R008 audit-service

成果物

```text
Audit Log

Audit Query

Audit Report
```

---

# 4. Lock & Context Platform

仕様対応

```text
06 Context

07 Lock
```

---

## 4.1 Lock

### R009 lock-service

成果物

```text
Acquire

Release

Renew

Heartbeat
```

---

## 4.2 Context

### R010 cache-service

成果物

```text
Cache

Invalidate

TTL
```

---

### R011 context-engine

成果物

```text
Context Builder

Context Splitter

Context Prioritizer
```

---

# 5. Execution Runtime

仕様対応

```text
01 Foundation

05 Recovery

10 Operation
```

---

### R012 execution-engine

成果物

```text
Execution Lifecycle

Workflow Engine

State Machine
```

---

### R013 recovery-engine

成果物

```text
Recovery Handler

Conflict Recovery

Cache Recovery

Lock Recovery
```

---

### R014 watchdog-service

成果物

```text
Health Check

Timeout

Recovery Trigger
```

---

# 6. Control Layer

仕様対応

```text
02 Agent
```

---

## 6.1 Router

### R015 router-agent

成果物

```text
Instruction Parser

Agent Resolver

Execution Creator
```

---

## 6.2 Reviewer

### R016 reviewer-agent

成果物

```text
Review

Quality Gate

Decision Trigger
```

---

# 7. Governance Platform

仕様対応

```text
14 Governance
```

---

### R017 governance-service

成果物

```text
Approval

Decision

Escalation

Policy
```

---

# 8. Security Platform

仕様対応

```text
13 Security
```

---

### R018 security-service

成果物

```text
Authentication

Authorization

Audit

Secret
```

---

### R019 identity-service

成果物

```text
RBAC

Identity

Permission
```

---

# 9. API Platform

仕様対応

```text
12 API Contract
```

---

### R020 api-gateway

成果物

```text
Gateway

Routing

Rate Limit

OpenAPI
```

---

# 10. Worker Agents

仕様対応

```text
02 Agent
16 SDK
```

---

### R021 pm-agent

成果物

```text
Requirement Analysis

Roadmap
```

---

### R022 architect-agent

成果物

```text
Architecture

Design
```

---

### R023 developer-agent

成果物

```text
Implementation

Refactoring
```

---

### R024 qa-agent

成果物

```text
Testing

Validation
```

---

### R025 document-agent

成果物

```text
Specification

Manual
```

---

### R026 issue-agent

成果物

```text
Issue

Bug

Improvement
```

---

### R027 release-agent

成果物

```text
Release

Deployment Approval
```

---

# マイルストーン

## M1 Foundation Runtime

対象

```text
R001 ～ R006
```

完了条件

```text
Event Publish可能

Event Store可能

Agent SDK利用可能
```

---

## M2 Core Runtime

対象

```text
R007 ～ R014
```

完了条件

```text
Trace可能

Lock可能

Context可能

Recovery可能
```

---

## M3 Agent Control

対象

```text
R015 ～ R016
```

完了条件

```text
Instruction

↓

Router

↓

Review
```

まで動作

---

## M4 Enterprise

対象

```text
R017 ～ R020
```

完了条件

```text
Governance

Security

Gateway
```

利用可能

---

## M5 Business Agents

対象

```text
R021 ～ R027
```

完了条件

```text
実案件実行可能
```

---

# 全体進捗管理

```text
1 Foundation Platform
 ├─ R001
 ├─ R002
 ├─ R003
 └─ R004

2 Event Platform
 ├─ R005
 └─ R006

3 Traceability Platform
 ├─ R007
 └─ R008

4 Lock & Context
 ├─ R009
 ├─ R010
 └─ R011

5 Execution Runtime
 ├─ R012
 ├─ R013
 └─ R014

6 Control Layer
 ├─ R015
 └─ R016

7 Governance
 └─ R017

8 Security
 ├─ R018
 └─ R019

9 API Platform
 └─ R020

10 Worker Agents
 ├─ R021
 ├─ R022
 ├─ R023
 ├─ R024
 ├─ R025
 ├─ R026
 └─ R027
```

---

# 完成判定

## MVP

```text
R001 ～ R016
```

---

## Enterprise Platform

```text
R001 ～ R020
```

---

## Full AI Agent Operating System

```text
R001 ～ R027
```