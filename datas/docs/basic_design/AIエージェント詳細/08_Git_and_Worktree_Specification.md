# 08_Git_and_Worktree_Specification.md

# AI Development Operating System Git And Worktree Specification

Version: 1.0

---

# 1. 文書概要

## 1.1 目的

本仕様は AI Development Operating System（AI-OS）における Git、GitHub、および Worktree 管理方式を定義する。

本仕様は以下を保証する。

- 並列開発
- Worktree分離実行
- GitHub連携
- Traceability維持
- 競合管理
- 安全なMerge運用
- 復旧可能性



---

# 2. Git運用原則

## Principle-001

すべてのExecutionは独立Worktree上で実施する。



---

## Principle-002

直接main作業を禁止する。

---

## Principle-003

競合状態でのPushを禁止する。



---

## Principle-004

競合状態でのPRを禁止する。



---

## Principle-005

競合の自動解決を禁止する。



---

## Principle-006

Git操作は監査対象とする。



---

# 3. Git-Agent

## 目的

Git関連処理を管理する。

---

## 責務

```text
Git状態確認

認証確認

Branch管理

Worktree管理

競合分析

PR支援

Merge支援
```



---

# 4. Git作業開始前確認

すべてのExecution開始前に実行する。

```bash
git status
git branch
git remote -v
gh auth status
```



---

# 5. 認証管理

## GitHub認証状態

正常

```text
AUTH_OK
```

異常

```text
AUTH_REQUIRED
```



---

## 認証失敗時

```text
Execution停止

↓

認証要求

↓

Git操作禁止
```



---

# 6. Branch戦略

## 標準構成

```text
main

develop

feature/*

bugfix/*

release/*
```

---

## main

役割

```text
本番確定コード
```

---

## develop

役割

```text
統合ブランチ
```

---

## feature

役割

```text
新機能開発
```

---

## bugfix

役割

```text
不具合修正
```

---

## release

役割

```text
リリース準備
```

---

# 7. Branch命名規則

## Instruction

```text
feature/INST-000001
```



---

## Bug

```text
bugfix/BUG-000001
```



---

## Release

```text
release/REL-000001
```



---

# 8. Worktree管理

## 目的

並列Executionを安全に実行する。



---

## 原則

1 Execution = 1 Worktree



---

# 9. Worktree命名規則

## Instruction

```text
wt_INST-000001
```



---

## Bug

```text
wt_BUG-000001
```



---

## 推奨構造

```text
worktrees/

 ├─ wt_INST-000001

 ├─ wt_INST-000002

 ├─ wt_BUG-000001

 └─ wt_REL-000001
```

---

# 10. Worktreeライフサイクル

```text
Instruction受領

↓

Branch作成

↓

Worktree生成

↓

Execution

↓

Review

↓

Merge

↓

Worktree削除
```



---

# 11. Worktreeデータモデル

```json
{
  "worktreeId": "",
  "instructionId": "",
  "executionId": "",
  "branch": "",
  "path": "",
  "createdAt": "",
  "deletedAt": ""
}
```



---

# 12. Commit管理

## Commit作成条件

```text
成果物更新

レビュー反映

競合解消

ドキュメント更新
```

---

## Commit要件

```text
InstructionId必須

ExecutionId必須

TraceId必須
```



---

## 推奨形式

```text
[INST-000123]

Implement User API

EXEC-000581
```

---

# 13. Pull Request管理

## 作成条件

```text
レビュー完了

Lock解除済

テスト完了

競合なし
```



---

## PRデータモデル

```json
{
  "prId": "",
  "instructionId": "",
  "executionId": "",
  "sourceBranch": "",
  "targetBranch": "",
  "status": ""
}
```

---

# 14. Merge戦略

## 条件

```text
Review承認済

競合なし

Trace維持
```



---

## Merge後

```text
develop更新

↓

ExecutionLog保存

↓

Worktree削除
```



---

# 15. Git競合管理

## 状態

```text
CONFLICT_DETECTED
```



---

## 発生原因

```text
同一ファイル更新

同一行更新

Merge競合
```

---

# 16. Git Conflict Rule

## Rule-001

自動解決禁止



---

## Rule-002

競合検知時はCONFLICT_DETECTED



---

## Rule-003

競合分析を許可



---

## Rule-004

競合解決案生成を許可

例

```text
案A main優先

案B feature優先

案C 手動Merge
```



---

## Rule-005

最終決定権限

```text
Reviewer

PM

Human
```



---

# 17. Git Conflict Recovery

```text
CONFLICT_DETECTED

↓

競合箇所抽出

↓

競合分析

↓

解決案作成

↓

Reviewer判断

↓

Merge
```



---

# 18. Worktree Recovery

対象

```text
E4005 WORKTREE_CREATION_FAILED
```



---

## 復旧手順

```text
Worktree削除

↓

Git同期

↓

Worktree再生成

↓

Execution再開
```



---

# 19. Git監査ログ

Git操作はすべて監査対象とする。

```json
{
  "eventType": "GIT",
  "instructionId": "",
  "executionId": "",
  "branch": "",
  "action": "",
  "timestamp": ""
}
```



---

## Action

```text
BRANCH_CREATE

WORKTREE_CREATE

COMMIT

PUSH

PR_CREATE

MERGE

WORKTREE_DELETE
```

---

# 20. Traceability連携

Git成果物は必ず以下と紐付ける。

```text
InstructionId

ExecutionId

TraceId
```



---

# 21. Security Rule

## 禁止事項

```text
main直接更新

競合状態Push

競合状態PR

認証未完了操作

Trace情報削除
```



---

# 22. 運用監視項目

監視主体

```text
Watchdog-Agent
```



---

## 監視項目

```text
Git競合件数

Worktree数

認証状態

Merge失敗件数

PR待機件数
```



---

# 23. 完成条件

Git & Worktree Framework が完成している状態とは以下を満たすことをいう。

```text
全Executionが独立Worktreeで実行

競合が管理可能

Mergeが監査可能

Traceが維持される

GitHub連携可能

自動復旧可能

並列実行可能

安全に統合可能
```



---
END OF DOCUMENT