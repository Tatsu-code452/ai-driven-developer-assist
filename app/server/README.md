# AI駆動型開発支援システム server

機能一覧(F-001〜F-014 / 共通機能 C-001〜C-008)に対応するREST APIです。
**外部ライブラリなし**(Node.js 22.18+ の標準機能のみ)。`npm install` なしで起動できます。

```bash
node src/server.ts          # または npm start
npm test                    # 15件のAPIテスト(Gitは一時リポジトリで実操作)
npm run typecheck           # 要 npm install (typescript / @types/node)
```
設定は環境変数(`.env.example` 参照)。client の開発サーバー(`npm run dev`)は `/api` を `localhost:8080` へプロキシします。

## データ
`DATA_DIR/db.json` に保存(一時ファイル+renameで原子的に書き込み)。単一プロセス・小〜中規模向けです。
エンティティはデータモデル設計書v2のとおり。ID採番も同じ規則(PRJ/CTX/TSK/BUG/QAA/RVW/FIX/PRM/EXE/ART/TRC/REP)。

## API 一覧
共通CRUD(`GET /` 一覧 `?projectId=&q=&limit=&offset=&<項目名>=` / `POST /` / `GET|PATCH|DELETE /:id`):
`/api/projects` `/contexts` `/work-items` `/prompts` `/executions` `/artifacts` `/traceability` `/repositories` `/branches` `/pull-requests` `/releases`

| 機能 | エンドポイント |
|---|---|
| F-014 ダッシュボード | `GET /api/dashboard?projectId=` |
| C-002 横断検索 | `GET /api/search?projectId=&q=` |
| F-006 プロンプト生成 | `POST /api/prompts/:id/render` `{workItemId, contextIds, outputFormat}` |
| F-007 AI実行 | `POST /api/ai/execute` `{aiType, prompt, save?}` / `GET /api/executions/compare?a=&b=` / `POST /api/executions/:id/artifact` |
| F-008 成果物 | `POST /api/artifacts/:id/{review,approve,baseline,reject}` / `GET /api/artifacts/:id/versions` |
| F-003 ファイル変換 | `POST /api/convert` (multipart `file`、`projectId` を付けるとドキュメント登録まで実施) |
| タスク生成 | `POST /api/contexts/:id/task` / `POST /api/work-items/:id/fix-task` |
| F-012 トレーサビリティ | `GET /api/traceability/{matrix,gaps}?projectId=` / `GET /api/traceability/impact/:id?depth=` |
| F-013 Git | `POST /api/git/{fetch,pull,commit,push,branch,checkout,merge,tag,worktree}` / `GET /api/git/{status,branches,worktrees}` |
| C-004 監査ログ / C-005 設定 | `GET /api/audit` / `GET,PUT /api/settings` |
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
- 保存先がJSONファイルのため、複数プロセスでの同時書き込みは想定していません。
