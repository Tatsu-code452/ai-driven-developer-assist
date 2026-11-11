# INPUT SPECIFICATION

## ファイル情報

```text
Agent

ID-Agent

Version

1.0.0
```

---

# 目的

ID発行要求を標準化する。

全Agentは本仕様へ従うこと。

---

# 入力方式

## Accepted Format

```json
{
  "requestId": "",
  "artifactType": "",
  "projectId": "",
  "requestedBy": "",
  "reason": ""
}
```

---

# 必須項目

## requestId

要求識別子

---

### 形式

```text
INST-YYYYMMDD-NNNNNN
```

---

### 例

```text
INST-20261022-000001
```

---

## artifactType

成果物種別

---

### 必須

```text
REQ

UC

SCR

API

DB

CMP

SRV

TEST

REV

TASK

QA

ISSUE

BUG

REL

INST

EXEC

WBS

SCH
```

---

### 例

```text
TASK
```

---

## requestedBy

依頼Agent

---

### 形式

```text
Agent Name
```

---

### 例

```text
PM-Agent

Developer-Agent

QA-Agent

Instruction-Agent
```

---

# 任意項目

## projectId

プロジェクトID

---

### 形式

```text
PROJECT-YYYY-NNN
```

---

### 例

```text
PROJECT-2026-001
```

---

## reason

発行理由

---

### 例

```text
新規成果物作成

実行ログ生成

課題登録
```

---

# 入力検証

## Validation-001

requestId必須

---

### エラー

```json
{
  "success": false,
  "errorCode": "ID-VAL-001",
  "message": "requestId is required"
}
```

---

## Validation-002

artifactType必須

---

### エラー

```json
{
  "success": false,
  "errorCode": "ID-VAL-002",
  "message": "artifactType is required"
}
```

---

## Validation-003

未定義成果物禁止

---

### エラー

```json
{
  "success": false,
  "errorCode": "ID-VAL-003",
  "message": "unsupported artifact type"
}
```

---

## Validation-004

requestedBy必須

---

### エラー

```json
{
  "success": false,
  "errorCode": "ID-VAL-004",
  "message": "requestedBy is required"
}
```

---

# 入力例

## REQ発行

```json
{
  "requestId": "INST-20261022-000001",
  "artifactType": "REQ",
  "projectId": "PROJECT-2026-001",
  "requestedBy": "PM-Agent",
  "reason": "新規要件"
}
```

---

## TASK発行

```json
{
  "requestId": "INST-20261022-000002",
  "artifactType": "TASK",
  "projectId": "PROJECT-2026-001",
  "requestedBy": "Developer-Agent",
  "reason": "実装タスク"
}
```

---

## EXEC発行

```json
{
  "requestId": "INST-20261022-000003",
  "artifactType": "EXEC",
  "requestedBy": "ExecutionLog-Agent",
  "reason": "実行開始"
}
```

---

# セキュリティ

禁止入力

```text
空文字

NULL

未定義成果物

改行を含むType

スクリプト文字列
```

---

# サイズ制限

requestId

```text
最大64文字
```

---

artifactType

```text
最大32文字
```

---

projectId

```text
最大64文字
```

---

reason

```text
最大256文字
```

---

# トレーサビリティ

入力要求は以下へ記録する。

```text
execution-log.md

id-allocation-log.md
```

---

# 完了条件

入力が以下を満たすこと。

```text
形式一致

必須項目存在

成果物種別有効

Agent有効
```