# 04_State_And_Error_Code_Specification.md

# AI Development Operating System State And Error Code Specification

Version: 1.0

---

# 1. 文書概要

## 1.1 目的

本仕様は AI Development Operating System（AI-OS）における状態管理、エラー管理、例外処理、および障害分類の標準を定義する。

本仕様の目的は以下とする。

- Agent間の状態統一
- 実行状況の可視化
- 障害検知の標準化
- 復旧処理の自動化
- ログ解析の効率化
- トレーサビリティ確保



---

# 2. 状態管理原則

## Principle-001

全Executionは必ず状態を保持しなければならない。



---

## Principle-002

状態遷移は監査対象とする。



---

## Principle-003

全異常終了はエラーコードを保持しなければならない。



---

## Principle-004

エラー発生時は復旧可能性を優先する。



---

## Principle-005

推測による状態変更を禁止する。



---

# 3. State Model

## 状態区分

状態は以下の3レベルで管理する。

```text
Execution State
Review State
System State
```

---

# 4. 標準状態コード

## OK

### 意味

正常終了

### 説明

処理が正常に完了した状態



---

## REVIEW_REQUIRED

### 意味

レビュー判断待ち

### 説明

Agent単独では意思決定できない状態



---

## REVIEW_NG

### 意味

レビュー不合格

### 説明

成果物の修正が必要



---

## DECISION_REQUIRED

### 意味

意思決定待ち

### 説明

人間またはPMによる判断が必要



---

## BLOCK

### 意味

処理不能

### 説明

必要情報不足により作業を続行できない



---

## TIMEOUT

### 意味

応答停止

### 説明

Agent応答時間を超過した状態



---

## SPLIT_REQUIRED

### 意味

分割要求

### 説明

コンテキスト制限を超過した状態



---

## CONFLICT_DETECTED

### 意味

競合発生

### 説明

Git競合が検出された状態



---

## FORCE_UNLOCK

### 意味

強制ロック解除

### 説明

Watchdog によりロック解除が実施された状態



---

## CACHE_INVALID

### 意味

キャッシュ無効

### 説明

キャッシュの整合性が失われた状態



---

## NG

### 意味

異常終了

### 説明

回復不能なエラーにより停止した状態



---

# 5. Execution状態遷移

```text
READY
  ↓
WORKING
  ↓
REVIEW_REQUIRED
  ↓
COMPLETED
```



---

## エラー経路

```text
WORKING
  ├─ BLOCK
  ├─ TIMEOUT
  ├─ SPLIT_REQUIRED
  └─ NG
```



---

# 6. Review状態遷移

```text
REVIEW_REQUIRED
     │
     ├── OK
     │
     ├── REVIEW_NG
     │        │
     │        ↓
     │     REWORK
     │
     └── DECISION_REQUIRED
```



---

# 7. Error Code体系

## エラーコード構成

```text
E + Category + Number

例

E1001
E2002
E4005
```



---

# 8. E1000系 入力エラー

## E1001 INVALID_INSTRUCTION

### 原因

Instruction形式不正

### 対応

Instruction再作成

---

## E1002 INVALID_PARAMETER

### 原因

入力パラメータ異常

### 対応

値を修正

---

## E1003 INVALID_CONTEXT

### 原因

コンテキスト不整合

### 対応

Context再取得

---

# 9. E2000系 Agentエラー

## E2001 AGENT_NOT_FOUND

Agent未登録

---

## E2002 AGENT_TIMEOUT

Agent無応答

---

## E2003 AGENT_CRASH

Agent異常終了

---

## E2004 AGENT_RESPONSE_INVALID

応答形式異常

---

### 復旧

```text
Watchdog検知
 ↓
Agent再起動
 ↓
Execution再開
```



---

# 10. E3000系 Lockエラー

## E3001 LOCK_ACQUIRE_FAILED

ロック取得失敗

---

## E3002 LOCK_CONFLICT

ロック競合

---

## E3003 LOCK_EXPIRED

TTL失効

---

## E3004 LOCK_OWNER_MISMATCH

所有者不一致

---

### 復旧

```text
Lock再取得
 ↓
Execution再開
```



---

# 11. E4000系 Gitエラー

## E4001 AUTH_REQUIRED

認証失敗

---

## E4002 CONFLICT_DETECTED

競合発生

---

## E4003 PUSH_REJECTED

Push拒否

---

## E4004 MERGE_FAILED

Merge失敗

---

## E4005 WORKTREE_CREATION_FAILED

Worktree作成失敗

---

### 復旧

```text
競合分析
 ↓
解決案生成
 ↓
Reviewer判断
 ↓
Merge
```



---

# 12. E5000系 Reviewエラー

## E5001 REVIEW_LIMIT_EXCEEDED

レビュー回数超過

---

## E5002 REVIEW_LOOP_DETECTED

同一指摘ループ

---

## E5003 REVIEWER_UNAVAILABLE

レビュー担当不在

---

### 結果

```text
DECISION_REQUIRED
```



---

# 13. E6000系 Contextエラー

## E6001 CONTEXT_LIMIT_EXCEEDED

容量超過

---

## E6002 FILE_LIMIT_EXCEEDED

ファイル数超過

---

## E6003 TOKEN_LIMIT_EXCEEDED

トークン超過

---

### 結果

```text
SPLIT_REQUIRED
```



---

# 14. E7000系 Cacheエラー

## E7001 CACHE_INVALID

キャッシュ無効

---

## E7002 CACHE_MISS

キャッシュ未存在

---

## E7003 CACHE_CORRUPTION

キャッシュ破損

---

### 復旧

```text
キャッシュ削除
 ↓
再解析
 ↓
再生成
```



---

# 15. E9000系 Systemエラー

## E9001 UNKNOWN_ERROR

未知エラー

---

## E9002 STORAGE_FAILURE

ストレージ障害

---

## E9003 LOG_WRITE_FAILED

ログ保存失敗

---

## E9004 RECOVERY_FAILED

復旧失敗

---

### 結果

```text
NG
```



---

# 16. Error Severity定義

## Severity-1

```text
Critical
```

対象

```text
Router停止
ID-Agent停止
Trace情報消失
```



---

## Severity-2

```text
High
```

対象

```text
Git利用不可
Lock停止
```



---

## Severity-3

```text
Medium
```

対象

```text
Cache異常
Review遅延
```



---

## Severity-4

```text
Low
```

対象

```text
通知異常
ログ遅延
```



---

# 17. Event Log連携

エラー発生時は Audit Log へ記録する。

```json
{
  "eventType": "ERROR",
  "errorCode": "",
  "executionId": "",
  "timestamp": ""
}
```



---

# 18. Error Handling原則

エラー発生時の優先順位は以下とする。

```text
自動復旧

↓

レビュー要求

↓

タスク分割

↓

BLOCK

↓

NG
```



---

# 19. 復旧対象判定

| 状態              | 自動復旧 |
| ----------------- | -------- |
| TIMEOUT           | Yes      |
| FORCE_UNLOCK      | Yes      |
| CACHE_INVALID     | Yes      |
| CONFLICT_DETECTED | No       |
| DECISION_REQUIRED | No       |
| NG                | No       |



---

# 20. 完成条件

本状態管理基盤が完成している状態とは以下を満たすこととする。

```text
全Executionが状態管理される

全異常にエラーコードが存在する

全エラーが分類される

全復旧手順が定義される

全ログが追跡可能

全イベントが監査可能
```



---
END OF DOCUMENT