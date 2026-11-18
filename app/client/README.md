# AI駆動型開発支援システム client

React + TypeScript (Vite)。画面一覧(SCR-001〜043)・機能一覧・データモデル設計書v2に沿った構成です。

## 起動
バックエンド(`server/`)を先に起動してください。client の開発サーバーは `/api` を `localhost:8080` へプロキシします。
```bash
# 1. サーバー (別ターミナル)
cd server && node src/server.ts

# 2. client
cd client && npm install && npm run dev      # http://localhost:5173
npm run build                                # 型チェック + ビルド
```
接続先を変える場合は `.env` の `VITE_API_BASE`(本番ビルドなど)や、環境変数 `VITE_API_TARGET`(開発プロキシ先)を使います。
サーバーで `API_TOKEN` を有効にしたときは `VITE_API_TOKEN` に同じ値を設定します(ビルド成果物に埋め込まれるため、ローカル・社内利用向けの簡易認証です)。

## データの保持
業務データはすべてサーバー(`DATA_DIR/db.json`)に保存されます。client が持つのは「作業中のプロジェクト」の選択だけ(localStorage)です。
サーバーに接続できないときは画面に再試行ボタンを表示します。
以前の localStorage 版で入力したデータは自動では移行されません。

`src/store.tsx` が全データをメモリに持ち、更新系(`add` / `update` / `remove` / `call`)はサーバーへ送信します。失敗時はトーストでサーバーのメッセージを表示します。
成果物の状態遷移・版管理・マージ日時・関連付けの自動作成など、整合性が必要な処理はサーバー側のAPIで行います。

## 画面とルート
| SCR | ルート | ファイル |
|---|---|---|
| 001 ダッシュボード | `/` | pages/Dashboard.tsx |
| 002/003 プロジェクト | `/projects`, `/projects/:id` | pages/Projects.tsx |
| 004/005/006 コンテキスト | `/contexts`, `/contexts/:id`, `/contexts/new` | pages/Contexts.tsx |
| 007/008 ドキュメント | `/documents`, `/documents/:id` | pages/Artifacts.tsx |
| 025 ファイル変換 | `/convert` | pages/Convert.tsx |
| 021/022 タスク | `/tasks`, `/tasks/:id` | pages/WorkItems.tsx |
| 017/018 課題 | `/issues`, `/issues/:id` | pages/WorkItems.tsx |
| 019/020 QA | `/qa`, `/qa/:id` | pages/WorkItems.tsx |
| 030 プロンプト生成 | `/prompts` | pages/Prompts.tsx |
| 031 AI実行履歴 | `/executions` | pages/Executions.tsx |
| 032 AI成果物管理 | `/ai-artifacts`, `/ai-artifacts/:id` | pages/Artifacts.tsx |
| 015/016 トレーサビリティ | `/traceability`, `/traceability/matrix` | pages/Traceability.tsx |
| 040〜043 Git/GitHub | `/git/repositories` `/git/branches` `/git/pull-requests` `/git/releases` | pages/Git.tsx |

## バックエンドAPI(任意・`src/api.ts`)
| 用途 | リクエスト | レスポンス |
|---|---|---|
| ファイル変換(PDF/Word/Excel) | `POST /api/convert` multipart `file` | `{ "text": string }` |
| AI実行 | `POST /api/ai/execute` `{ aiType, prompt }` | `{ "response": string }` |
| Fetch / Pull | `POST /api/git/fetch` `/api/git/pull` `{ repositoryId, url, worktreeRoot }` | `{ "message"?: string }` |

未接続時はエラーを画面に表示します。AIはプロンプトをコピーして外部で実行し、回答を貼り付ける運用も可能です。

## 設計書に対する拡張(要確認)
- WorkItem に `answer`(QA回答)・`isKnowledge`(ナレッジ化)を追加
- Artifact に `origin`(MANUAL/CONVERTED/AI)・`version`・`versions`・`reviewNote` を追加(ドキュメントとAI成果物の区別、版管理、レビュー結果)
- Branch / PullRequest / Release を追加(SCR-041〜043用)
