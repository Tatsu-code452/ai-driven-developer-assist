# AI Development Operating System Foundation Specification
Version: 4.0

---

# 1. 目的

本仕様は AI 駆動型開発環境における Foundation Layer を定義する。

以下を保証する。

- 並列実行
- Worktree並列運用
- GitHub連携
- トレーサビリティ
- フリーズ耐性
- コンテキスト制御
- レビュー品質維持
- 排他制御
- AIエージェントの継続的動作

---

# 2. アーキテクチャ

```text
Instruction

↓

Router-Agent

↓

Context Selection

↓

Worker-Agent

↓

Reviewer-Agent

↓

Router-Agent

↓

ExecutionLog-Agent

↓

Instruction Update
```

共通サービス

```text
ID-Agent

Lock-Agent

Watchdog-Agent

Cache-Agent
```

---

# 3. 最上位原則

## Principle-001

完全性より継続可能性を優先する。

---

## Principle-002

推測を事実として扱ってはならない。

---

## Principle-003

合理的な代替案の作成は許可する。

---

## Principle-004

全ての成果物は追跡可能であること。

---

## Principle-005

全ての成果物はトレーサブルであること。

---

## Principle-006

同一成果物への同時更新を禁止する。

---

## Principle-007

コンテキスト限界到達前に停止する。

---

## Principle-008

ロックは永続化してはならない。

---

## Principle-009

全ロックはTTLを持つ。

---

## Principle-010

成果物分割不可能な場合は中間成果物へ分割する。

---

## Principle-011

最終成果物は複数の中間成果物から統合生成してよい。

---

# 4. ID-Agent

## 目的

全エージェント共通識別子発行。

---

## 採番方式

UUID v4

---

## 内部ID

```text
550e8400-e29b-41d4-a716-446655440000
```

---

## 表示ID

```text
REQ-000001

TASK-000001

BUG-000001

QUESTION-000001

ISSUE-000001

DECISION-000001

EXEC-000001

INST-000001
```

---

## 管理形式

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "displayId": "TASK-000581"
}
```

---

## 一意性

UUIDを主キーとする。

DisplayIdは人間向け識別子とする。

---

## Router禁止事項

```text
採番禁止

UUID生成禁止

DisplayId生成禁止
```

---

# 5. Router-Agent

## 責務

- 指示解析
- 作業担当選定
- レビュー担当選定
- コンテキスト選定
- 実行管理
- 成果物反映
- 実行ログ保存

---

## 禁止事項

```text
採番

全体読込

成果物直接編集

仕様決定
```

---

# 6. Worker-Agent

## 対象

```text
PM-Agent

Architect-Agent

Developer-Agent

Reviewer-Agent

Document-Agent

QA-Agent

Issue-Agent

Traceability-Agent

Release-Agent

Git-Agent
```

---

## 共通ルール

### Rule-001

渡されたコンテキスト以外を読まない。

---

### Rule-002

許可されていないファイルを変更しない。

---

### Rule-003

責務外作業を行わない。

---

### Rule-004

推測を事実として扱わない。

---

### Rule-005

合理的な設計案の提案は許可する。

---

### Rule-006

判断権限が必要な場合

```text
REVIEW_REQUIRED
```

を返却する。

---

### Rule-007

資料不足で作業不能な場合のみ

```text
BLOCK
```

を返却する。

---

# 7. 状態管理

## OK

正常終了

---

## REVIEW_REQUIRED

レビュー判断待ち

---

## REVIEW_NG

再作業必要

---

## DECISION_REQUIRED

レビュー上限到達

---

## BLOCK

作業不可

---

## TIMEOUT

応答なし

---

## SPLIT_REQUIRED

分割必要

---

## CONFLICT_DETECTED

Git競合発生

---

## FORCE_UNLOCK

強制ロック解除

---

## CACHE_INVALID

キャッシュ無効

---

## NG

異常終了

---

# 8. レビュー制御

## 最大レビュー回数

```text
3回
```

---

## 上限到達

```text
DECISION_REQUIRED
```

---

## 同一指摘ループ

2回以上同じ指摘を繰り返した場合

```text
DECISION_REQUIRED
```

---

# 9. Context Management

## 最大対象ファイル数

```text
30
```

---

## 最大文字数

```text
100,000
```

---

## 最大サイズ

```text
500KB
```

---

## 超過時

```text
SPLIT_REQUIRED
```

---

# 10. Split Strategy

## Level1

ファイル分割

---

例

```text
1～50

51～100
```

---

## Level2

成果物分割

---

例

```text
画面設計

API設計

DB設計
```

---

## Level3

工程分割

---

例

```text
調査

分析

設計

レビュー

統合
```

---

## Level4

中間成果物分割

---

例

最終成果物

```text
トレーサビリティマトリックス
```

↓

中間成果物

```text
REQ分析結果

TASK分析結果

BUG分析結果

マッピング結果

統合結果
```

↓

最終成果物

```text
Traceability Matrix
```

---

## 分割禁止

```text
分割不能
```

という回答は禁止。

---

必ず

```text
分割案
```

を提示する。

---

# 11. Lock-Agent

## ロック単位

```text
ファイル単位
```

---

例

```text
src/api/user.ts
```

---

## ロック取得

```text
LOCK

↓

作業

↓

保存

↓

UNLOCK
```

---

## TTL

```text
30分
```

---

## 自動解除条件

```text
正常終了

TIMEOUT

Execution終了

TTL超過
```

---

## 強制解除条件

```text
Watchdog検知

TTL超過

Agent消失

Execution停止
```

---

## 強制解除実行者

```text
Watchdog-Agent
```

---

## ログ出力

```json
{
  "status": "FORCE_UNLOCK",
  "reason": "TTL_EXPIRED"
}
```

---

# 12. Cache-Agent

## 目的

コンテキスト削減

トークン削減

再解析防止

---

## キャッシュ単位

```text
ファイル

成果物

解析結果
```

---

## 管理情報

```json
{
  "cacheId": "",
  "hash": "",
  "targetId": "",
  "cachedAt": "",
  "expireAt": ""
}
```

---

## 利用ルール

hash一致

↓

既存利用

---

hash不一致

↓

再解析

---

## TTL

```text
24時間
```

---

## キャッシュ破棄

以下実施時

```text
Git Pull

Merge

Rebase

Worktree変更

Branch変更
```

---

# 13. Watchdog-Agent

## 監視対象

```text
Agent応答時間

レビュー回数

ロックTTL

コンテキスト量

キャッシュ状態
```

---

## 監視結果

```text
TIMEOUT

FORCE_UNLOCK

SPLIT_REQUIRED

CACHE_INVALID

DECISION_REQUIRED
```

---

## タイムアウト

```text
5分
```

---

# 14. Git-Agent

## 作業開始前確認

```bash
git status

git branch

git remote -v

gh auth status
```

---

## 認証失敗

```text
AUTH_REQUIRED
```

---

## Worktree

Instruction単位

---

例

```text
INST-UUID
```

↓

専用Worktree生成

---

# 15. Git Conflict Strategy

## Rule-001

自動解決禁止

---

## Rule-002

競合検知

```text
CONFLICT_DETECTED
```

---

## Rule-003

競合分析

許可

---

## Rule-004

競合解決案生成

許可

---

例

```text
案A

main優先

案B

feature優先

案C

手動マージ
```

---

## Rule-005

最終決定

```text
Reviewer

PM

Human
```

のみ

---

## 禁止事項

```text
競合状態でPush

競合状態でPR
```

---

# 16. ExecutionLog-Agent

## 保存対象

```text
Execution

Review

Decision

Split

Conflict

Timeout

Unlock

Cache
```

---

## ログ形式

```json
{
  "executionId": "",
  "instructionId": "",
  "traceId": "",
  "status": "",
  "agent": "",
  "summary": ""
}
```

---

# 17. トレーサビリティ

全成果物は以下を保持する。

```json
{
  "id": "",
  "displayId": "",
  "instructionId": "",
  "executionId": "",
  "traceId": ""
}
```

---

## トレース構造

```text
Instruction

↓

Execution

↓

Agent

↓

Deliverable

↓

Review

↓

Decision

↓

Completion
```

---

# 18. 最終運用ルール

AIは停止してはならない。

優先順位は以下とする。

```text
合理的な案を提示

↓

レビュー判断要求

↓

タスク分割

↓

BLOCK

↓

TIMEOUT
```

BLOCKは最終手段とする。

推測は禁止する。

ただし合理的な代替案の提示は禁止しない。

全ての成果物は追跡可能でなければならない。

全ての成果物は再現可能でなければならない。