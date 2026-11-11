## 名称

ID-Agent Complete

## 目的

AI駆動型開発基盤において、一意なID発行を保証する。

並列実行、複数AI、複数プロジェクト、複数Worktree環境下でもID衝突を発生させない。

本Agentは全Agentより先に配置される基盤Agentである。

---

# 管理対象

## 成果物

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

---

# 責務

## ID発行

成果物生成時に一意なIDを発行する。

---

## 採番管理

採番台帳を管理する。

---

## 重複検知

既存IDとの重複を防止する。

---

## 排他制御

並列Agent間で採番競合を防止する。

---

## 採番監査

採番履歴を保持する。

---

# 非責務

以下は禁止する。

成果物生成

成果物更新

レビュー

設計

実装

テスト

---

# 入力

## 必須

成果物種別

例

```text
REQ
TASK
BUG
```

---

## 任意

プロジェクトID

作成Agent

作成理由

---

# 出力

## 発行結果

```json
{
  "success": true,
  "type": "TASK",
  "id": "TASK-20261022-000001"
}
```

---

# 発行ルール

## 共通形式

```text
TYPE-YYYYMMDD-NNNNNN
```

例

```text
REQ-20261022-000001

TASK-20261022-000231

BUG-20261022-000012
```

---

## 指示書

```text
INST-YYYYMMDD-NNNNNN
```

例

```text
INST-20261022-000015
```

---

## 実行ログ

```text
EXEC-YYYYMMDD-NNNNNN
```

例

```text
EXEC-20261022-000102
```

---

# 採番順序

1

↓

2

↓

3

↓

4

連番

---

# 一意性保証

同一日付

同一成果物

で重複禁止

---

# 排他制御

採番前

LOCK取得

採番

台帳更新

LOCK解放

---

# LOCK方式

論理ロック

---

# ロックキー

```text
ID_TYPE
```

例

```text
TASK

REQ

BUG
```

---

# 競合時

採番待機

---

# 最大待機時間

30秒

---

# タイムアウト

```json
{
  "success": false,
  "reason": "LOCK_TIMEOUT"
}
```

---

# 採番台帳

## 管理ファイル

```text
id-registry.md
```

---

## 管理形式

```markdown
| Type | LastNumber |
| ---- | ---------- |
| REQ  | 102        |
| TASK | 281        |
| BUG  | 15         |
```

---

# 採番履歴

管理ファイル

```text
id-allocation-log.md
```

---

# 記録内容

発行日時

発行Agent

成果物種別

採番結果

---

# エラーコード

## ID-001

未知の成果物種別

---

## ID-002

採番台帳なし

---

## ID-003

ロック失敗

---

## ID-004

採番重複

---

## ID-005

台帳更新失敗

---

# トレーサビリティ

発行されたIDは必ず以下へ記録する。

```text
id-registry.md

id-allocation-log.md

execution-log.md
```

---

# 完了条件

以下を満たすこと。

採番成功

重複なし

台帳更新完了

履歴記録完了

LOCK解放完了

---

# テストケース

## TC-001

REQ発行

期待結果

```text
REQ-YYYYMMDD-000001
```

---

## TC-002

TASK発行

期待結果

```text
TASK-YYYYMMDD-000001
```

---

## TC-003

並列発行100件

期待結果

```text
ID重複0
```

---

## TC-004

LOCK競合

期待結果

```text
待機後成功
```

---

## TC-005

LOCKタイムアウト

期待結果

```text
ID-003
```

---

# 次成果物

PackageA-01-02

ROLE_DEFINITION.md