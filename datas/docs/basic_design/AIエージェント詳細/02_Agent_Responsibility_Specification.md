# 02_Agent_Responsibility_Specification.md

# AI Development Operating System Agent Responsibility Specification

Version: 1.0

---

# 1. 文書概要

## 1.1 目的

本仕様は AI Development Operating System における Agent の責務、権限、入出力、状態管理および禁止事項を定義する。

各 Agent は単一責務原則に基づき設計され、責務の重複を禁止する。 

---

## 1.2 適用対象

本仕様は以下の Agent に適用される。

```text
Router-Agent
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
ID-Agent
Lock-Agent
Cache-Agent
Watchdog-Agent
ExecutionLog-Agent
```



---

# 2. Agent共通原則

全Agentは以下の原則を遵守する。

## Rule-001

渡されたコンテキスト以外を読まない。 

---

## Rule-002

許可されていないファイルを変更しない。 

---

## Rule-003

責務外作業を行わない。 

---

## Rule-004

推測を事実として扱わない。 

---

## Rule-005

合理的な代替案の提案を許可する。 

---

## Rule-006

判断権限が必要な場合は REVIEW_REQUIRED を返却する。 

---

## Rule-007

作業不能時のみ BLOCK を返却する。 

---

# 3. Agent共通インターフェース

## 入力形式

```json
{
  "instructionId": "",
  "executionId": "",
  "traceId": "",
  "context": [],
  "deliverables": []
}
```



---

## 出力形式

```json
{
  "status": "",
  "summary": "",
  "deliverables": [],
  "nextAction": ""
}
```



---

## ステータス

```text
OK
REVIEW_REQUIRED
REVIEW_NG
DECISION_REQUIRED
BLOCK
TIMEOUT
SPLIT_REQUIRED
CONFLICT_DETECTED
FORCE_UNLOCK
CACHE_INVALID
NG
```



---

# 4. Router-Agent

## 目的

Instruction を解析し、作業を適切な Agent に振り分ける。



---

## 責務

```text
指示解析
担当Agent選定
レビュー担当選定
コンテキスト選定
進捗管理
成果物統合
Execution管理
ログ保存
```



---

## 入力

```text
Instruction
Execution状態
レビュー結果
監査ログ
```

---

## 出力

```text
Execution生成
Agentアサイン
Review要求
Instruction更新
```

---

## 禁止事項

```text
採番
UUID生成
DisplayId生成
仕様決定
成果物直接編集
全体読込
```



---

# 5. PM-Agent

## 目的

要求管理およびプロジェクト判断支援を行う。

---

## 責務

```text
要求分析
優先順位付け
スコープ管理
意思決定支援
レビュー参加
```

---

## 成果物

```text
Requirement
Issue
Decision
Roadmap
```

---

## 禁止事項

```text
実装
直接コーディング
Git操作
```

---

# 6. Architect-Agent

## 目的

システム設計を行う。

---

## 責務

```text
アーキテクチャ設計
技術選定
API設計
DB設計
非機能設計
```

---

## 成果物

```text
Architecture Document
API Specification
DB Design
Infrastructure Design
```

---

## 禁止事項

```text
要求変更
PM判断
リリース判断
```

---

# 7. Developer-Agent

## 目的

設計に基づく実装を行う。

---

## 責務

```text
実装
リファクタリング
単体テスト作成
不具合修正
```

---

## 成果物

```text
Source Code
Unit Test
Migration
Technical Document
```

---

## 禁止事項

```text
仕様変更
レビュー承認
本番リリース
```

---

# 8. Reviewer-Agent

## 目的

成果物品質を保証する。

---

## 責務

```text
成果物レビュー
品質評価
改善提案
リスク報告
```

---

## 判定

```text
OK
REVIEW_NG
DECISION_REQUIRED
```



---

## 制約

```text
最大レビュー回数 3回
```



---

# 9. Document-Agent

## 目的

仕様書および運用文書を作成する。

---

## 責務

```text
仕様書作成
運用手順作成
利用者向け文書作成
変更履歴作成
```

---

## 成果物

```text
Specification
Manual
Release Note
Runbook
```

---

# 10. QA-Agent

## 目的

品質保証を行う。

---

## 責務

```text
テスト設計
テスト実行
品質評価
品質報告
```

---

## 成果物

```text
Test Case
Test Report
Quality Report
```

---

# 11. Issue-Agent

## 目的

課題管理を行う。

---

## 責務

```text
Issue登録
Issue分析
優先順位設定
Issue追跡
```

---

## 成果物

```text
Issue
Bug
Improvement
Task
```

---

# 12. Traceability-Agent

## 目的

トレーサビリティを保証する。

---

## 責務

```text
Trace管理
関連付け管理
監査支援
整合性確認
```

---

## 管理対象

```text
Instruction
Execution
Deliverable
Review
Decision
```



---

# 13. Release-Agent

## 目的

リリース管理を行う。

---

## 責務

```text
リリース判定
成果物収集
配布管理
変更管理
```

---

## 禁止事項

```text
レビュー省略
監査省略
```

---

# 14. Git-Agent

## 目的

GitおよびGitHub操作を管理する。

---

## 責務

```text
Worktree作成
Branch確認
認証確認
PR支援
Merge支援
```



---

## 作業開始前確認

```bash
git status
git branch
git remote -v
gh auth status
```



---

## 禁止事項

```text
競合状態でPush
競合状態でPR
自動競合解決
```



---

# 15. ID-Agent

## 目的

全識別子を発行する。

---

## 責務

```text
UUID発行
DisplayId発行
一意性保証
```



---

## 発行対象

```text
REQ
TASK
BUG
QUESTION
ISSUE
DECISION
EXEC
INST
```



---

# 16. Lock-Agent

## 目的

排他制御を提供する。

---

## 責務

```text
Lock取得
Lock更新
Lock解放
TTL管理
```



---

## Lock対象

```text
ファイル単位
```



---

# 17. Cache-Agent

## 目的

再解析を削減する。

---

## 責務

```text
キャッシュ生成
キャッシュ利用
キャッシュ削除
期限管理
```



---

## TTL

```text
24時間
```



---

# 18. Watchdog-Agent

## 目的

システムを監視する。

---

## 責務

```text
タイムアウト監視
レビュー回数監視
キャッシュ監視
ロック監視
コンテキスト監視
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

# 19. ExecutionLog-Agent

## 目的

実行履歴を永続化する。

---

## 責務

```text
Execution記録
Review記録
Decision記録
Timeout記録
Conflict記録
Cache記録
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

# 20. Agent状態遷移

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

# 21. Agent設計原則

全Agentは以下を満たさなければならない。

```text
責務分離
追跡可能
再現可能
監査可能
交換可能
並列実行可能
停止耐性
コンテキスト制御対応
```



---
END OF DOCUMENT