# 01_Foundation_Architecture_Specification.md

# AI Development Operating System Foundation Architecture Specification

Version: 1.0

---

# 1. 文書概要

## 1.1 目的

本仕様は AI Development Operating System（以下 AI-OS）の Foundation Layer を定義する。

Foundation Layer は全 AI Agent が共通利用する実行基盤であり、Agent の実装方式に依存せず、統一された実行モデル、制御モデル、管理モデルを提供する。 

本仕様は以下を保証する。

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

## 1.2 適用範囲

本仕様は以下の構成要素へ適用する。

```text
Router-Agent
Worker-Agent
Reviewer-Agent
ID-Agent
Lock-Agent
Cache-Agent
Watchdog-Agent
Git-Agent
ExecutionLog-Agent
```

また、AI-OS上で動作する将来の全Agentも本仕様への準拠を必須とする。 

---

## 1.3 ドキュメント体系内での位置付け

本仕様は以下仕様群の最上位文書である。

```text
01 Foundation Architecture
02 Agent Responsibility
03 Data Model
04 State And Error Code
05 Recovery And Runbook
06 Context Management
07 Lock Management
08 Git and Worktree
09 Traceability and Audit
10 Operation Handbook
```

Foundation Architecture は全仕様書の共通原則を定義する。 

---

# 2. Foundation Layerの責務

Foundation Layer の責務は以下とする。

```text
Agent管理
Execution管理
Context管理
Lock管理
Trace管理
Review管理
Cache管理
Recovery管理
Git管理
監査ログ管理
```

業務ロジックやドメイン知識は Foundation Layer の責務ではない。

---

# 3. 全体アーキテクチャ

## 3.1 実行フロー

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



---

## 3.2 Shared Services

全Agentは以下サービスを共有する。

```text
ID-Agent
Lock-Agent
Watchdog-Agent
Cache-Agent
Git-Agent
ExecutionLog-Agent
```



---

## 3.3 レイヤ構造

```text
Application Layer
 ├─ PM-Agent
 ├─ Architect-Agent
 ├─ Developer-Agent
 ├─ QA-Agent
 └─ Document-Agent

Control Layer
 ├─ Router-Agent
 └─ Reviewer-Agent

Foundation Layer
 ├─ ID-Agent
 ├─ Lock-Agent
 ├─ Watchdog-Agent
 ├─ Cache-Agent
 ├─ Git-Agent
 └─ ExecutionLog-Agent
```

---

# 4. 最上位原則

## Principle-001

完全性より継続可能性を優先する。 

---

## Principle-002

推測を事実として扱ってはならない。 

---

## Principle-003

合理的な代替案の作成を許可する。 

---

## Principle-004

全ての成果物は追跡可能でなければならない。 

---

## Principle-005

全ての成果物はトレーサブルでなければならない。 

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

全ロックは TTL を持つ。 

---

## Principle-010

成果物分割不能という判断を禁止する。 

---

## Principle-011

最終成果物は複数の中間成果物から統合生成してよい。 

---

# 5. Foundation オブジェクトモデル

Foundation Layerで管理されるオブジェクトを定義する。

## Instruction

```json
{
  "instructionId": "INST-000001",
  "title": "",
  "description": "",
  "priority": "HIGH",
  "status": "OPEN"
}
```



---

## Execution

```json
{
  "executionId": "EXEC-000001",
  "instructionId": "INST-000001",
  "assignedAgent": "",
  "status": "",
  "startedAt": "",
  "completedAt": ""
}
```



---

## Deliverable

```json
{
  "deliverableId": "",
  "type": "",
  "version": "",
  "owner": "",
  "traceId": ""
}
```



---

# 6. 実行モデル

## 6.1 Instruction

Instruction は全作業の起点である。

```text
Instruction
→ Execution生成
→ Agent実行
→ Review
→ Completion
```



---

## 6.2 Execution

Execution は Agent 単位の作業トランザクションである。

Execution ごとに以下を持つ。

```text
実行ID
Agent
状態
成果物
ログ
Trace情報
```



---

# 7. 並列実行モデル

Foundation Layer は並列処理を前提とする。 

例

```text
Instruction
    ↓

 ┌─────────┐
 │Worker-A │
 └─────────┘

 ┌─────────┐
 │Worker-B │
 └─────────┘

 ┌─────────┐
 │Worker-C │
 └─────────┘
```

各Workerは独立して実行される。

---

# 8. Worktree実行モデル

全Executionは独立Worktree上で動作する。

```text
Instruction
    ↓
Worktree生成
    ↓
Execution実行
    ↓
Review
    ↓
Merge
```



---

# 9. コンテキスト管理モデル

## 制限

```text
最大対象ファイル数 30

最大文字数 100,000

最大サイズ 500KB
```



---

## 超過時

```text
SPLIT_REQUIRED
```

を返却する。 

---

# 10. 排他制御モデル

## ロック単位

```text
ファイル単位
```



---

## ロックライフサイクル

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

## TTL

```text
30分
```



---

# 11. レビュー管理モデル

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

# 12. トレーサビリティモデル

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

## トレースチェーン

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

# 13. 監査モデル

監査イベントは以下を保持する。

```json
{
  "eventId": "",
  "eventType": "",
  "resource": "",
  "actor": "",
  "timestamp": ""
}
```



---

# 14. 可用性モデル

AIは停止を前提としない。 

優先順位は以下とする。

```text
合理的な代替案提示
↓
レビュー判断要求
↓
タスク分割
↓
BLOCK
↓
TIMEOUT
```



---

# 15. Foundation完成条件

Foundation Layer が正常と判定される条件を定義する。

```text
全成果物が追跡可能

全Executionが識別可能

全Agentが責務分離されている

排他制御が行われている

レビュー制御が機能している

復旧可能である

監査可能である

再現可能である
```



---
END OF DOCUMENT