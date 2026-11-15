## F-001 Project管理

### 文書情報

| 項目       | 内容                                |
| ---------- | ----------------------------------- |
| 機能ID     | F-001                               |
| 機能名     | Project管理                         |
| 分類       | 業務機能                            |
| 優先度     | 最高                                |
| 担当Agent  | AGT-PM / AGT-ARCH / AGT-BE / AGT-FE |
| 関連画面   | SCR-002、SCR-003                    |
| 関連モデル | Project                             |
| 関連API    | Project API                         |

---

## 1. 概要

Project管理機能はAI駆動型開発支援システムにおける最上位管理機能である。

全ての成果物はProjectを起点として管理される。

管理対象

- Context
- WorkItem
- Prompt
- AIExecution
- Artifact
- Repository

本機能はシステム利用開始時の起点となる。

---

## 2. 目的

以下を実現する。

- プロジェクト作成
- プロジェクト選択
- プロジェクト編集
- 作業コンテキスト確立
- 管理データパス管理
- Repository管理
- 成果物管理起点提供
- AI駆動開発の管理単位統制

---

## 3. ユースケース

### UC-001 プロジェクト作成

利用者

↓

プロジェクト情報入力

↓

rootPath指定

↓

登録

↓

利用開始

---

### UC-002 プロジェクト選択

利用者

↓

プロジェクト一覧表示

↓

対象選択

↓

Current Project設定

↓

作業開始

---

### UC-003 プロジェクト編集

利用者

↓

プロジェクト詳細表示

↓

内容変更

↓

保存

---

### UC-004 プロジェクト削除

管理者

↓

削除要求

↓

依存データ確認

↓

論理削除

---

### UC-005 Repository確認

利用者

↓

Project詳細表示

↓

Repository情報確認

---

## 4. 業務ルール

### BR-001 成果物所属

全成果物は必ず1つのProjectに所属する。

---

### BR-002 Project削除前確認

Project削除前に関連データを確認する。

---

### BR-003 rootPath一意性

rootPathはシステム全体で重複してはならない。

---

### BR-004 単一Project運用

利用者が同時に選択できるCurrent Projectは1件のみとする。

---

### BR-005 Current Project保持

選択中のProjectはCurrent Projectとして保持する。

Current Projectは以下の検索条件として利用する。

- Context
- WorkItem
- Prompt
- AIExecution
- Artifact
- Repository

---

### BR-006 Project採番

採番形式

```text
PRJ-001
PRJ-002
PRJ-003
```

ルール

- PrefixはPRJ固定
- 001から連番採番
- 重複不可

---

### BR-007 状態遷移

状態

```text
PLANNING
ACTIVE
SUSPENDED
COMPLETED
ARCHIVED
```

許可遷移

```text
PLANNING → ACTIVE

ACTIVE → SUSPENDED
ACTIVE → COMPLETED

SUSPENDED → ACTIVE
SUSPENDED → COMPLETED

COMPLETED → ARCHIVED
```

禁止遷移

```text
ARCHIVED → *
COMPLETED → ACTIVE
```

---

### BR-008 rootPath妥当性

登録時および更新時に以下を確認する。

- ディレクトリ存在
- 読取権限
- 書込権限
- 重複確認

---

### BR-009 Repository管理

ProjectはRepositoryを保持できる。

管理項目

- URL
- DefaultBranch
- CurrentBranch
- WorktreeRoot

---

### BR-010 削除制約

以下が存在する場合は削除不可。

- Context
- WorkItem
- Prompt
- AIExecution
- Artifact
- Repository

削除は論理削除とする。

---

## 5. データモデル

### Project

| 項目        | 型       | 必須 |
| ----------- | -------- | ---- |
| id          | string   | ○    |
| name        | string   | ○    |
| description | string   |      |
| status      | string   | ○    |
| rootPath    | string   | ○    |
| createdAt   | datetime | ○    |
| updatedAt   | datetime | ○    |

### Repository

| 項目          | 型     |
| ------------- | ------ |
| id            | string |
| url           | string |
| defaultBranch | string |
| currentBranch | string |
| worktreeRoot  | string |

---

## 6. 関連エンティティ

```text
Project
 ├─ Context
 ├─ WorkItem
 ├─ Prompt
 ├─ AIExecution
 ├─ Artifact
 └─ Repository
```

---

## 7. 機能要件

### F-001-001 プロジェクト一覧

- 一覧表示
- 検索
- ソート
- ページング
- Project選択

### F-001-002 プロジェクト登録

- Project作成
- rootPath登録
- 状態設定

### F-001-003 プロジェクト編集

- 情報更新
- 状態変更

### F-001-004 rootPath管理

- 設定
- 更新
- 妥当性確認

### F-001-005 管理データ状況表示

- Artifact数
- WorkItem数
- Context数
- Prompt数
- Repository数

---

## 8. 関連画面

### SCR-002 プロジェクト一覧

### SCR-003 プロジェクト詳細

---

## 9. API

### 一覧取得

#### Request

```http
GET /projects
```

#### Response

```json
{
  "success": true,
  "items": [
    {
      "id": "PRJ-001",
      "name": "AI駆動型開発支援",
      "status": "ACTIVE",
      "artifactCount": 150,
      "workItemCount": 75,
      "updatedAt": "2025-01-01T12:00:00"
    }
  ],
  "totalCount": 1
}
```

---

### 詳細取得

```http
GET /projects/{id}
```

---

### 登録

```http
POST /projects
```

Request

```json
{
  "name": "AI駆動型開発支援",
  "description": "開発支援システム",
  "status": "PLANNING",
  "rootPath": "/project"
}
```

---

### 更新

```http
PUT /projects/{id}
```

---

### 削除

```http
DELETE /projects/{id}
```

---

## 10. Service

### ProjectService

責務

- Project生成
- Project更新
- Project削除
- Project検索
- Current Project管理
- 状態遷移管理

主関数

```text
createProject()
updateProject()
deleteProject()
findProject()
findProjects()
changeStatus()
setCurrentProject()
```

---

## 11. Repository

### ProjectRepository

保存先

```text
projects.json
```

責務

- 永続化
- 検索
- 更新
- 削除

---

## 12. バリデーション

### 名称

- 必須
- 1～255文字

### rootPath

- 必須
- 実在パス
- 重複不可
- 読取可能
- 書込可能

### status

許可値

```text
PLANNING
ACTIVE
SUSPENDED
COMPLETED
ARCHIVED
```

---

## 13. 権限

| 操作 | 一般利用者 | 管理者 |
| ---- | ---------- | ------ |
| 参照 | ○          | ○      |
| 登録 | ×          | ○      |
| 更新 | ×          | ○      |
| 削除 | ×          | ○      |

---

## 14. トレーサビリティ

```text
REQ-PROJ-001
    ↓
F-001
    ↓
SCR-002
SCR-003
    ↓
Project API
    ↓
ProjectService
    ↓
ProjectRepository
```

---

## 15. エラー処理

| エラー | 内容                      |
| ------ | ------------------------- |
| 400    | Validation Error          |
| 404    | Project Not Found         |
| 409    | Duplicate rootPath        |
| 409    | Invalid Status Transition |
| 500    | Repository Access Error   |

---

## 16. 監査ログ

記録対象

- 登録
- 更新
- 削除
- 状態変更
- Current Project変更

記録項目

- ProjectID
- 操作種別
- 操作者
- 操作日時
- 変更前
- 変更後

---

## 17. テスト観点

### 正常系

- 登録
- 更新
- 検索
- 状態変更
- Current Project設定
- Repository表示

### 異常系

- 名称未入力
- rootPath未入力
- rootPath重複
- 不正状態遷移
- 不存在Project

### 境界値

- 名称1文字
- 名称255文字
- Project1000件

### 性能

- 1000件一覧取得
- ページング
- 詳細表示

---

## 18. 将来拡張

- Backlog連携
- Jira連携
- Azure DevOps連携
- GitHub連携強化
- マルチProject横断検索
- Projectテンプレート

---

## 19. 完了条件

- Project一覧表示可能
- Project登録可能
- Project更新可能
- Current Project管理可能
- Repository管理可能
- 関連成果物参照可能
- トレーサビリティ維持可能
- 監査ログ記録可能