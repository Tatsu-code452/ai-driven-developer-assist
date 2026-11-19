# 07_Lock_Management_Specification.md

# AI Development Operating System Lock Management Specification

Version: 1.0

---

# 1. 文書概要

## 1.1 目的

本仕様は AI Development Operating System（AI-OS）における排他制御機構（Lock Management）を定義する。

Lock Management は並列実行環境において、同一成果物への同時更新を防止し、データ整合性およびトレーサビリティを維持することを目的とする。 

---

## 1.2 保証対象

本仕様は以下を保証する。

```text
排他制御

同時更新防止

ロック自動解除

デッドロック回避

強制復旧

監査可能性

実行継続性
```



---

# 2. Lock管理原則

## Principle-001

同一成果物への同時更新を禁止する。 

---

## Principle-002

全ロックはTTLを持たなければならない。 

---

## Principle-003

ロックは永続化してはならない。 

---

## Principle-004

ロック所有権は明示されなければならない。

---

## Principle-005

ロック操作は全て監査対象とする。 

---

## Principle-006

ロック取得失敗時は再試行または代替案を提示する。

---

# 3. Lock-Agent

## 目的

全Agent共通の排他制御サービスを提供する。 

---

## 責務

```text
Lock取得

Lock更新

Lock延長

Lock解放

TTL管理

強制解除

監査ログ出力
```



---

# 4. Lock対象

## ロック単位

```text
ファイル単位
```



---

## 対象例

```text
src/api/user.ts

src/domain/customer.ts

docs/specification.md

database/schema.sql
```



---

# 5. Lockデータモデル

```json
{
  "lockId": "",
  "resource": "",
  "ownerAgent": "",
  "executionId": "",
  "instructionId": "",
  "traceId": "",
  "status": "",
  "acquiredAt": "",
  "expireAt": ""
}
```



---

# 6. Lock状態

## ACTIVE

有効なロック

---

## EXPIRED

TTL失効

---

## RELEASED

正常解除

---

## FORCE_UNLOCKED

強制解除済

---

## INVALID

不正ロック



---

# 7. Lock Lifecycle

```text
LOCK
 ↓
WORK
 ↓
SAVE
 ↓
UNLOCK
```



---

## 詳細フロー

```text
Lock取得

↓

所有権確立

↓

作業実施

↓

保存

↓

Lock解放

↓

監査ログ保存
```



---

# 8. Lock取得

## 処理

```text
LOCK request

↓

競合確認

↓

取得成功
または
取得失敗
```



---

## 成功レスポンス

```json
{
  "status": "LOCK_ACQUIRED",
  "lockId": ""
}
```

---

## 失敗レスポンス

```json
{
  "status": "LOCK_CONFLICT",
  "currentOwner": ""
}
```



---

# 9. Lock所有権

Lock保有者は以下情報で識別する。

```text
Agent

Execution

Instruction

Trace
```



---

## Owner Validation

確認項目

```text
Agent一致

Execution一致

TTL有効

状態ACTIVE
```

---

# 10. Lock TTL

## TTL

```text
30分
```



---

## 理由

```text
永久ロック防止

Agent障害対応

フリーズ耐性確保
```



---

# 11. Heartbeat

## 目的

長時間処理中のロック維持

---

## 更新間隔

```text
5分毎
```



---

## 更新内容

```json
{
  "lockId": "",
  "lastHeartbeat": "",
  "expireAt": ""
}
```

---

# 12. Lock延長

## 条件

以下を満たす場合。

```text
Agent存続

Execution実行中

作業継続中
```

---

## 動作

```text
Heartbeat送信

↓

TTL更新

↓

Lock継続
```



---

# 13. Lock解放

## 正常解除条件

```text
Execution完了

保存完了

Agent正常終了
```



---

## 実行フロー

```text
UNLOCK要求

↓

所有権確認

↓

Lock解除

↓

監査ログ保存
```



---

# 14. 自動解除

## 条件

```text
正常終了

TIMEOUT

Execution終了

TTL超過
```



---

## 処理

```text
状態確認

↓

Lock削除

↓

ログ出力
```

---

# 15. 強制解除

## 実行者

```text
Watchdog-Agent
```



---

## 条件

```text
TTL超過

Agent消失

Execution停止

Watchdog検知
```



---

## 処理

```text
FORCE_UNLOCK

↓

監査ログ出力

↓

対象Execution通知
```



---

# 16. Force Unlockログ

```json
{
  "status": "FORCE_UNLOCK",
  "reason": "TTL_EXPIRED"
}
```



---

# 17. Lock衝突管理

## エラー

```text
E3001 LOCK_ACQUIRE_FAILED

E3002 LOCK_CONFLICT

E3003 LOCK_EXPIRED

E3004 LOCK_OWNER_MISMATCH
```



---

## 対応

### LOCK_CONFLICT

```text
待機

または

再試行
```

---

### LOCK_EXPIRED

```text
Lock再取得
```

---

### OWNER_MISMATCH

```text
Execution停止

監査通知
```



---

# 18. デッドロック防止

## 原則

複数Lock取得を最小化する。

---

## Rule-001

同時に複数Lock取得を行わない。

---

## Rule-002

取得順序を固定する。

---

## Rule-003

待機時間上限を設定する。

---

## Rule-004

TTLを超えたLockは解除する。



---

# 19. Lock Recovery

Lock異常発生時は以下を実施する。

```text
TTL超過検知

↓

FORCE_UNLOCK

↓

Lock再取得

↓

Execution再開
```



---

# 20. Git Worktreeとの連携

Lock管理はWorktree単位ではなく成果物単位である。

```text
Worktree-A
    └─ file-A lock

Worktree-B
    └─ file-B lock
```

同一ファイルへの複数Lockは禁止する。 

---

# 21. Audit Log

Lockイベントは全て監査ログへ保存する。

```json
{
  "eventType": "LOCK",
  "lockId": "",
  "resource": "",
  "agent": "",
  "timestamp": ""
}
```



---

## Event Type

```text
LOCK

UNLOCK

FORCE_UNLOCK

LOCK_CONFLICT

LOCK_EXPIRED
```



---

# 22. Lock品質要件

Lock機構は以下を保証しなければならない。

```text
同時更新防止

整合性維持

自動復旧

TTL管理

監査可能

再現可能

高可用性
```



---

# 23. 完成条件

Lock Management Framework が完成している状態とは以下を満たすことをいう。

```text
すべての成果物が排他制御対象

デッドロックを回避可能

TTL管理可能

自動解除可能

強制解除可能

監査可能

Recovery可能

並列実行対応
```



---
END OF DOCUMENT
