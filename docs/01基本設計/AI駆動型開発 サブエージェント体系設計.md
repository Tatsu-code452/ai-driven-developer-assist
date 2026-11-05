## AI駆動型開発 サブエージェント体系設計

### 文書ID

AGT-001

### 目的

GitHub Copilot Agent Modeを利用したAI駆動型開発において、責務を明確に分離したサブエージェント構成を定義する。

以下を実現する。

- 1サブエージェント1責務
- 1チケット1セッション
- 1チケット1成果物ファイル
- レビュー駆動開発
- Git/GitHub/CI/CD自動化
- トレーサビリティ維持
- レビュー履歴・修正履歴保存
- AI間のコンテキスト最小化
- 並列開発対応

要件として定義されている以下を満たす。 

---

## 基本原則

### AGP-001

1チケット = 1セッション

1チケット完了までを単一セッションで実施する。

例

- TSK-001
- BUG-004
- QAA-012

ごとに独立セッションを開始する。

---

### AGP-002

1成果物 = 1ファイル

要件単位で成果物を分離する。

例

- requirements/REQ-001.md
- design/DES-001.md
- task/TSK-001.md
- qa/QAA-001.md
- issue/BUG-001.md

---

### AGP-003

1責務 = 1サブエージェント

複数責務を持たせない。

禁止例

- 設計兼実装エージェント
- 実装兼レビューエージェント

---

### AGP-004

レビュー必須

全ての変更はレビューサブエージェントを必ず通過する。

実装完了
↓
レビュー
↓
修正
↓
レビュー
↓
修正
↓
レビューOK
↓
マージ

---

## サブエージェント構成

### 1. Router Agent

ID

AGT-ROUTER

責務

- ユーザー指示の解析
- チケット生成
- サブエージェント呼び出し
- コンテキスト最適化
- ワークフロー制御

入力

- ユーザー要求
- プロジェクト情報

出力

- 作業計画
- サブエージェント実行指示

実行権限

- 全サブエージェント呼び出し

---

### 2. Project Audit Agent

ID

AGT-AUDIT

責務

- プロジェクト監査
- リスク分析
- 品質分析
- ボトルネック抽出
- 改善提案

出力

- AUD-xxx.md

---

### 3. Project Manager Agent

ID

AGT-PM

責務

- WBS作成
- スケジュール作成
- タスク分解
- 工数見積
- 優先順位付け

成果物

- PRJ-xxx.md
- WBS-xxx.md

---

### 4. Requirement Agent

ID

AGT-REQ

責務

- 要件整理
- 要件定義
- ユースケース作成
- 非機能要件整理

成果物

- requirements/REQ-xxx.md

---

### 5. Architecture Agent

ID

AGT-ARCH

責務

- システム構成設計
- 技術選定
- アーキテクチャ設計
- レイヤ構成設計

成果物

- architecture/ARC-xxx.md

---

### 6. Database Agent

ID

AGT-DB

責務

- ER図作成
- DB設計
- インデックス設計
- SQLレビュー

成果物

- database/DBS-xxx.md

---

### 7. UI/UX Agent

ID

AGT-UI

責務

- 画面設計
- UX設計
- ワイヤーフレーム作成
- 操作フロー設計

成果物

- screen/SCR-xxx.md

---

### 8. Detail Design Agent

ID

AGT-DES

責務

- API設計
- クラス設計
- 詳細設計
- IF定義

成果物

- design/DES-xxx.md

---

### 9. Backend Agent

ID

AGT-BE

責務

- バックエンド実装
- リファクタリング
- ソース生成

成果物

- backend.diff.txt

---

### 10. Frontend Agent

ID

AGT-FE

責務

- フロントエンド実装
- UI実装
- 状態管理実装

成果物

- frontend.diff.txt

---

### 11. Test Design Agent

ID

AGT-TST-DES

責務

- テスト仕様作成
- テストケース作成

成果物

- test/TST-xxx.md

---

### 12. Test Execution Agent

ID

AGT-TST-EXEC

責務

- 単体テスト
- 結合テスト
- E2Eテスト
- カバレッジ測定

成果物

- test-result/TR-xxx.md

---

### 13. Review Agent

ID

AGT-REVIEW

責務

- コードレビュー
- 設計レビュー
- セキュリティレビュー
- 規約レビュー
- 改善提案

最重要エージェント

変更は必ずここを通す。

成果物

- review/RVW-xxx.md

出力

- APPROVED
- REQUEST_CHANGE

---

### 14. Fix Agent

ID

AGT-FIX

責務

- 指摘対応
- レビュー反映
- 再提出

成果物

- fix/FIX-xxx.md

---

### 15. Git Agent

ID

AGT-GIT

責務

- ブランチ作成
- コミット
- リベース
- マージ

操作例

- git checkout -b
- git add
- git commit
- git rebase
- git merge

---

### 16. GitHub Agent

ID

AGT-GITHUB

責務

- Pull Request作成
- Pull Request更新
- Issue作成
- Label付与
- Milestone管理

---

### 17. CI Agent

ID

AGT-CI

責務

- Build
- UnitTest
- Lint
- Coverage

---

### 18. CD Agent

ID

AGT-CD

責務

- Deploy
- Release
- Rollback

---

### 19. Documentation Agent

ID

AGT-DOC

責務

- README更新
- ナビゲーション更新
- 関連文書更新
- トレーサビリティ更新

---

### 20. Traceability Agent

ID

AGT-TRACE

責務

- 採番
- リンク生成
- トレーサビリティマトリクス更新

成果物

- traceability/TRC-xxx.md

---

### 21. Knowledge Agent

ID

AGT-KNOWLEDGE

責務

- プロジェクト知識管理
- コンテキスト最適化
- AI向け入力作成
- 履歴要約

---

## レビュー反復フロー

### 標準フロー

Router
↓
設計系Agent
↓
実装Agent
↓
Review Agent
↓
Fix Agent
↓
Review Agent
↓
Fix Agent
↓
Review Agent
↓
Approve
↓
Git Agent
↓
GitHub Agent
↓
CI Agent
↓
Review Agent
↓
Merge
↓
Documentation Agent
↓
Traceability Agent

---

## レビュー終了条件

以下を満たした時に終了する

### 条件1

Review Agentの指摘件数が0件

### 条件2

過去レビューとの差分が存在しない

### 条件3

重大指摘が0件

### 条件4

CI成功

### 条件5

品質ゲート通過

---

## レビュー履歴保存

### ディレクトリ

review/

### ファイル例

- RVW-001.md
- RVW-002.md
- RVW-003.md

内容

- 対象
- 指摘事項
- 優先度
- 判定

---

## 修正履歴保存

### ディレクトリ

fix/

### ファイル例

- FIX-001.md
- FIX-002.md

内容

- レビューID
- 修正内容
- 修正理由
- 対応結果

---

## GitHub Copilot向け推奨ディレクトリ構成

project-root/

- project/
  - PRJ-001.md

- requirements/
  - REQ-001.md

- architecture/
  - ARC-001.md

- design/
  - DES-001.md

- database/
  - DBS-001.md

- screen/
  - SCR-001.md

- task/
  - TSK-001.md

- test/
  - TST-001.md

- review/
  - RVW-001.md

- fix/
  - FIX-001.md

- traceability/
  - TRC-001.md

- prompts/
  - agents/

    - router.md
    - project-manager.md
    - requirement.md
    - architecture.md
    - database.md
    - uiux.md
    - design.md
    - backend.md
    - frontend.md
    - review.md
    - fix.md
    - git.md
    - github.md
    - ci.md
    - cd.md

---

## GitHub Copilot Agent Mode向け追加推奨

以下のサブエージェントも追加推奨

### Security Agent

AGT-SEC

責務

- セキュリティレビュー
- OWASPチェック
- 脆弱性確認

---

### Performance Agent

AGT-PERF

責務

- パフォーマンス分析
- SQLチューニング
- フロント最適化

---

### Prompt Engineer Agent

AGT-PROMPT

責務

- サブエージェント改善
- プロンプト最適化
- AI品質改善

---

## Routerの判断ルール

ユーザー指示
↓
チケット生成
↓
対象成果物特定
↓
対象サブエージェント特定
↓
必要コンテキスト収集
↓
サブエージェント実行
↓
レビューサイクル
↓
Git/GitHub処理
↓
CI/CD
↓
成果物更新
↓
トレーサビリティ更新
↓
完了

この構成をAI駆動型開発の標準サブエージェント構成とする。