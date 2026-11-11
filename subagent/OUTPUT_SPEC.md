# OUTPUT SPECIFICATION

## ファイル情報

```text
Agent

ID-Agent

Version

1.0.0
```

---

# 目的

ID発行結果の標準形式を定義する。

全Agentは本仕様の出力形式を利用すること。

---

# 出力方式

## 成功時

```json
{
  "success": true,
  "requestId": "",
  "artifactType": "",
  "generatedId": "",
  "sequence": 0,
  "generatedAt": "",
  "generatedBy": "ID-Agent"
}
```

---

# 出力項目

## success

処理結果

---

### 型

```text
Boolean
```

---

### 値

```text
true
false
```

---

## requestId

入力要求識別子

---

### 型

```text
String
```

---

### 例

```text
INST-20261022-000015
```

---

## artifactType

成果物種別

---

### 型

```text
String
```

---

### 例

```text
TASK
```

---

## generatedId

発行ID

---

### 型

```text
String
```

---

### 例

```text
TASK-20261022-000123

REQ-20261022-000054

BUG-20261022-000011
```

---

## sequence

内部採番値

---

### 型

```text
Integer
```

---

### 例

```text
123
```

---

## generatedAt

発行日時

---

### 型

```text
ISO8601
```

---

### 例

```text
2026-10-22T14:20:31Z
```

---

## generatedBy

発行Agent

---

### 固定値

```text
ID-Agent
```

---

# 成功例

## TASK

```json
{
  "success": true,
  "requestId": "INST-20261022-000015",
  "artifactType": "TASK",
  "generatedId": "TASK-20261022-000123",
  "sequence": 123,
  "generatedAt": "2026-10-22T14:20:31Z",
  "generatedBy": "ID-Agent"
}
```

---

## REQ

```json
{
  "success": true,
  "requestId": "INST-20261022-000016",
  "artifactType": "REQ",
  "generatedId": "REQ-20261022-000054",
  "sequence": 54,
  "generatedAt": "2026-10-22T14:22:11Z",
  "generatedBy": "ID-Agent"
}
```

---

# エラー時出力

```json
{
  "success": false,
  "requestId": "",
  "errorCode": "",
  "errorMessage": "",
  "occurredAt": "",
  "generatedBy": "ID-Agent"
}
```

---

# エラー項目

## errorCode

エラー識別子

---

### 型

```text
String
```

---

## errorMessage

エラー内容

---

### 型

```text
String
```

---

## occurredAt

発生日時

---

### 型

```text
ISO8601
```

---

# エラー例

## ID-001

未知の成果物種別

```json
{
  "success": false,
  "requestId": "INST-20261022-000001",
  "errorCode": "ID-001",
  "errorMessage": "unsupported artifact type",
  "occurredAt": "2026-10-22T14:25:00Z",
  "generatedBy": "ID-Agent"
}
```

---

## ID-002

採番台帳不存在

```json
{
  "success": false,
  "requestId": "INST-20261022-000002",
  "errorCode": "ID-002",
  "errorMessage": "registry not found",
  "occurredAt": "2026-10-22T14:26:10Z",
  "generatedBy": "ID-Agent"
}
```

---

## ID-003

LOCKタイムアウト

