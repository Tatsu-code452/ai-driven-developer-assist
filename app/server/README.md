# AI駆動型開発支援システム server

機能一覧(F-001〜F-014 / 共通機能 C-001〜C-008)に対応するREST APIです。
**外部ライブラリなし**(Node.js 22.18+ の標準機能のみ)。`npm install` なしで起動できます。

```bash
node src/server.ts          # または npm start
npm test                    # APIテスト + 保存層テスト(Gitは一時リポジトリで実操作)
npm run typecheck           # 要 npm install (typescript / @types/node)
```
設定は環境変数(`.env.example` 参照)。client の開発サーバー(`npm run dev`)は `/api` を `localhost:8080` へプロキシします。

## データの保存(案件単位のフォルダ)
`db.json` 1ファイルではなく、案件ごとのフォルダに分割して保存します。1つの案件のファイルが壊れても、他の案件には影響しません。

```
DATA_DIR/
├─ workspace.json          オーケストレーター: 案件フォルダの一覧・採番カウンタ・設定(db.json の代わり)
├─ audit.jsonl             案件に属さない操作の監査ログ(追記専用)
├─ projects/
│   ├─ PRJ-001/            案件フォルダ
│   │   ├─ project.json        案件そのもの
│   │   ├─ contexts.json       コレクションごとのデータ
│   │   ├─ work-items.json  artifacts.json  prompts.json  executions.json
│   │   ├─ traceability.json  repositories.json  branches.json  pull-requests.json  releases.json
│   │   ├─ index.json          検索・ID引き当て用インデックス(データから再構築できる)
│   │   └─ audit.jsonl         この案件の監査ログ
│   └─ PRJ-002/ ...
└─ trash/                  削除した案件フォルダの退避先(完全削除は手動)
```
- **ID**: 全案件で一意です(カウンタは `workspace.json`)。URLに案件IDを含めずに引けます。削除したIDは再利用しません。
- **インデックス(`index.json`)**: 項目ごとに ID・種別・状態・タイトル・タグ・本文冒頭300文字を持ちます。起動時に全案件のインデックスだけを読むので、案件データを読み込まずに ID引き当て・一覧件数(stats)・検索ができます。データファイルと食い違えば(手で編集した、Gitで取り込んだ等)自動で作り直します。`POST /api/projects/:id/reindex` で手動再構築もできます。
- **メモリ**: 案件データは使うときに読み込み、`MAX_LOADED_PROJECTS`(既定20)を超えると最近使っていない案件から手放します。書き込みは常に即時なので失われません。
- **安全策**: 書き込みは一時ファイル→fsync→rename(途中状態が残らない)、直前の版を `.bak` に保持(本体が壊れていれば自動で復旧)。採番はデータより先に永続化。案件削除はフォルダを `trash/` へ移動。`workspace.json` が壊れても案件フォルダから再構築します。別プロセスが使用中のデータディレクトリは開けません(`.lock`)。
- **持ち込み・移行**: `projects/` に案件フォルダ(`project.json` があるもの)を置いて再起動すると取り込みます。旧形式の `db.json` があれば初回起動で自動移行し、元ファイルは `db.json.migrated` として残します。
- 案件をまたぐ関連付け(トレーサビリティ・親子・リポジトリ参照)はできません。案件に属するデータの一覧取得は `projectId` が必須です。

## API 一覧
共通CRUD(`GET /` 一覧 `?projectId=&q=&limit=&offset=&<項目名>=` / `POST /` / `GET|PATCH|DELETE /:id`):
`/api/projects` `/contexts` `/work-items` `/prompts` `/executions` `/artifacts` `/traceability` `/repositories` `/branches` `/pull-requests` `/releases`

| 機能 | エンドポイント |
|---|---|
| F-014 ダッシュボード | `GET /api/dashboard?projectId=` |
| C-002 横断検索 | `GET /api/search?q=&projectId=&deep=` (案件指定=本文全体 / 指定なし=全案件のインデックス検索。`deep=1` で全案件の本文全体) |
| 案件フォルダの運用 | `GET /api/workspace`(案件フォルダ一覧・読込状態・不正な案件) / `GET /api/projects/:id/stats`(件数。インデックスのみで返す) / `POST /api/projects/:id/reindex` |
| F-006 プロンプト生成 | `POST /api/prompts/:id/render` `{workItemId, contextIds, outputFormat}` |
| F-007 AI実行 | `POST /api/ai/execute` `{aiType, prompt, save?}` / `GET /api/executions/compare?a=&b=` / `POST /api/executions/:id/artifact` |
| F-008 成果物 | `POST /api/artifacts/:id/{review,approve,baseline,reject}` / `GET /api/artifacts/:id/versions` |
| F-003 ファイル変換 | `POST /api/convert` (multipart `file`、`projectId` を付けるとドキュメント登録まで実施) |
| タスク生成 | `POST /api/contexts/:id/task` / `POST /api/work-items/:id/fix-task` |
| F-012 トレーサビリティ | `GET /api/traceability/{matrix,gaps}?projectId=` / `GET /api/traceability/impact/:id?depth=` |
| F-013 Git | `POST /api/git/{fetch,pull,commit,push,branch,checkout,merge,tag,worktree}` / `GET /api/git/{status,branches,worktrees}` |
| C-004 監査ログ / C-005 設定 | `GET /api/audit?projectId=&entityId=` / `GET,PUT /api/settings` |
| C-001 認証 | `API_TOKEN` 設定時、`/api/health` 以外は `Authorization: Bearer` 必須 |

エラーは `{ "error": { "message", "details"? } }`。

## AI連携(C-008)
- `GEMINI`: `GEMINI_API_KEY`(任意で `GEMINI_MODEL`)
- `COPILOT` / `GITHUB_COPILOT`: **OpenAI互換の chat/completions エンドポイント**を `*_API_URL` `*_API_KEY` `*_MODEL` で指定。
  CopilotやGitHub Copilot固有のAPIは使っていません。接続先の仕様に合わせて `src/ai.ts` を調整してください。
- 未設定のAI種別は 501 を返します。

## Gitの安全設計
引数配列で git を直接実行(シェル非経由)。操作対象は `GIT_WORKSPACE_ROOT` 配下に限定(`../`・絶対パス・シンボリックリンク経由を拒否)。
ブランチ名は英数字と `. _ / -` のみ(先頭 `-` 不可)。cloneできるURLは `https://` `ssh://` `git@` のみ。競合したマージは自動で中止して元に戻します。

## 既知の制限
- PDF変換は簡易実装です。標準フォントで文字列が直接埋め込まれたPDFのみ対応し、日本語の埋め込みフォントやスキャンPDFは 422 を返します。確実に扱うなら専用ライブラリ/OCRの導入が必要です。
- 旧形式の `.doc` / `.xls` は未対応(415)。
- Pull Request / Release は管理上の記録のみで、GitHub APIとは連携していません(F-013-007/008のうちgit操作のmergeのみ実装)。
- 通知(C-003)・ユーザー管理を伴う認証認可(C-001)・ファイル管理(C-006)は未実装です。認証は共有トークン1つです。
- 保存先がJSONファイルのため、複数プロセスでの同時書き込みは想定していません(二重起動は防止します)。更新のたびに、そのコレクションのファイルと index.json を書き直します(作成時は workspace.json も)。数千件規模までを想定しており、それを超える規模にはDBが必要です。
- インデックス検索は本文冒頭300文字までが対象です。本文全体の検索は案件を指定するか `deep=1` を付けます(案件データを読み込むため、案件数が多いと遅くなります)。全文用の転置インデックスは持っていません。
- 監査ログは追記専用のファイルで、ローテーションはしません。
