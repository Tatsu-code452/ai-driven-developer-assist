| WBS  | Lv  | フェーズ     | タスク名                    | 成果物                        | 依存        | 担当Agent    | 優先度 | 状態 |
| ---- | --- | ------------ | --------------------------- | ----------------------------- | ----------- | ------------ | ------ | ---- |
| 1    | 1   | 要求定義     | 要件整理                    | 要件.md                       | -           | AGT-REQ      | 最高   | TODO |
| 1.1  | 2   | 要求定義     | 非機能要件整理              | 要件定義書.md                 | 1           | AGT-REQ      | 最高   | TODO |
| 1.2  | 2   | 要求定義     | 運用フロー整理              | 運用フロー.md                 | 1           | AGT-PM       | 最高   | TODO |
| 1.3  | 2   | 要求定義     | 運用手順整理                | 運用手順書.md                 | 1.2         | AGT-PM       | 最高   | TODO |
| 2    | 1   | 基本設計     | 画面一覧作成                | 画面一覧.md                   | 1           | AGT-UI       | 最高   | TODO |
| 2.1  | 2   | 基本設計     | 機能一覧作成                | 機能一覧.md                   | 1           | AGT-ARCH     | 最高   | TODO |
| 2.2  | 2   | 基本設計     | データモデル設計            | データモデル設計書.md         | 1,2.1       | AGT-DB       | 最高   | TODO |
| 3    | 1   | 機能仕様     | F-001 Project管理仕様       | F-001_Project管理.md          | 2.2         | AGT-PM       | 最高   | TODO |
| 3.1  | 2   | 機能仕様     | F-002 Artifact管理仕様      | F-002_Artifact管理.md         | 2.2         | AGT-DES      | 最高   | TODO |
| 3.2  | 2   | 機能仕様     | F-004 Context管理仕様       | F-004_Context管理.md          | 2.2         | AGT-DES      | 最高   | TODO |
| 3.3  | 2   | 機能仕様     | F-005 WorkItem管理仕様      | F-005_WorkItem管理.md         | 2.2         | AGT-DES      | 最高   | TODO |
| 3.4  | 2   | 機能仕様     | F-006 Prompt管理仕様        | F-006_Prompt管理.md           | 2.2         | AGT-PROMPT   | 高     | TODO |
| 3.5  | 2   | 機能仕様     | F-007 AIExecution仕様       | F-007_AIExecution管理.md      | 3.4         | AGT-PROMPT   | 高     | TODO |
| 3.6  | 2   | 機能仕様     | F-008 AI成果物管理仕様      | F-008_AI成果物管理.md         | 3.5         | AGT-DOC      | 高     | TODO |
| 3.7  | 2   | 機能仕様     | F-012 Traceability仕様      | F-012_Traceability管理.md     | 3.1,3.2,3.3 | AGT-TRACE    | 高     | TODO |
| 3.8  | 2   | 機能仕様     | F-013 Git管理仕様           | F-013_Git管理.md              | 3.7         | AGT-GIT      | 高     | TODO |
| 4    | 1   | 画面仕様     | SCR-002 プロジェクト一覧    | SCR-002_Project一覧.md        | 3           | AGT-UI       | 高     | TODO |
| 4.1  | 2   | 画面仕様     | SCR-003 プロジェクト詳細    | SCR-003_Project詳細.md        | 4           | AGT-UI       | 高     | TODO |
| 4.2  | 2   | 画面仕様     | SCR-004 Context一覧         | SCR-004_Context一覧.md        | 3.2         | AGT-UI       | 高     | TODO |
| 4.3  | 2   | 画面仕様     | SCR-005 Context詳細         | SCR-005_Context詳細.md        | 4.2         | AGT-UI       | 高     | TODO |
| 4.4  | 2   | 画面仕様     | SCR-006 Context登録         | SCR-006_Context登録.md        | 4.2         | AGT-UI       | 高     | TODO |
| 4.5  | 2   | 画面仕様     | SCR-007 Artifact一覧        | SCR-007_Artifact一覧.md       | 3.1         | AGT-UI       | 高     | TODO |
| 4.6  | 2   | 画面仕様     | SCR-008 Artifact詳細        | SCR-008_Artifact詳細.md       | 4.5         | AGT-UI       | 高     | TODO |
| 4.7  | 2   | 画面仕様     | SCR-021 WorkItem一覧        | SCR-021_WorkItem一覧.md       | 3.3         | AGT-UI       | 高     | TODO |
| 4.8  | 2   | 画面仕様     | SCR-022 WorkItem詳細        | SCR-022_WorkItem詳細.md       | 4.7         | AGT-UI       | 高     | TODO |
| 4.9  | 2   | 画面仕様     | SCR-030 Prompt生成          | SCR-030_Prompt生成.md         | 3.4         | AGT-UI       | 中     | TODO |
| 4.10 | 2   | 画面仕様     | SCR-031 AI実行履歴          | SCR-031_AI実行履歴.md         | 3.5         | AGT-UI       | 中     | TODO |
| 4.11 | 2   | 画面仕様     | SCR-032 AI成果物管理        | SCR-032_AI成果物管理.md       | 3.6         | AGT-UI       | 中     | TODO |
| 4.12 | 2   | 画面仕様     | SCR-015 Traceability一覧    | SCR-015_Traceability一覧.md   | 3.7         | AGT-UI       | 中     | TODO |
| 4.13 | 2   | 画面仕様     | SCR-016 Traceability Matrix | SCR-016_TraceabilityMatrix.md | 4.12        | AGT-UI       | 中     | TODO |
| 4.14 | 2   | 画面仕様     | SCR-040 Repository管理      | SCR-040_Repository管理.md     | 3.8         | AGT-UI       | 中     | TODO |
| 4.15 | 2   | 画面仕様     | SCR-041 Branch管理          | SCR-041_Branch管理.md         | 4.14        | AGT-UI       | 中     | TODO |
| 4.16 | 2   | 画面仕様     | SCR-042 PullRequest管理     | SCR-042_PR管理.md             | 4.15        | AGT-UI       | 中     | TODO |
| 4.17 | 2   | 画面仕様     | SCR-043 Release管理         | SCR-043_Release管理.md        | 4.16        | AGT-UI       | 中     | TODO |
| 5    | 1   | サービス設計 | ProjectService設計          | ProjectService.md             | 3           | AGT-DES      | 高     | TODO |
| 5.1  | 2   | サービス設計 | ContextService設計          | ContextService.md             | 3.2         | AGT-DES      | 高     | TODO |
| 5.2  | 2   | サービス設計 | WorkItemService設計         | WorkItemService.md            | 3.3         | AGT-DES      | 高     | TODO |
| 5.3  | 2   | サービス設計 | PromptService設計           | PromptService.md              | 3.4         | AGT-DES      | 高     | TODO |
| 5.4  | 2   | サービス設計 | AIExecutionService設計      | AIExecutionService.md         | 5.3         | AGT-DES      | 高     | TODO |
| 5.5  | 2   | サービス設計 | ArtifactService設計         | ArtifactService.md            | 5.4         | AGT-DES      | 高     | TODO |
| 5.6  | 2   | サービス設計 | TraceabilityService設計     | TraceabilityService.md        | 5.5         | AGT-TRACE    | 中     | TODO |
| 5.7  | 2   | サービス設計 | RepositoryService設計       | RepositoryService.md          | 5.6         | AGT-GIT      | 中     | TODO |
| 6    | 1   | API設計      | Project API                 | API-Project.md                | 5           | AGT-DES      | 高     | TODO |
| 6.1  | 2   | API設計      | Context API                 | API-Context.md                | 5.1         | AGT-DES      | 高     | TODO |
| 6.2  | 2   | API設計      | WorkItem API                | API-WorkItem.md               | 5.2         | AGT-DES      | 高     | TODO |
| 6.3  | 2   | API設計      | Prompt API                  | API-Prompt.md                 | 5.3         | AGT-DES      | 高     | TODO |
| 6.4  | 2   | API設計      | Execution API               | API-Execution.md              | 5.4         | AGT-DES      | 高     | TODO |
| 6.5  | 2   | API設計      | Artifact API                | API-Artifact.md               | 5.5         | AGT-DES      | 高     | TODO |
| 6.6  | 2   | API設計      | Traceability API            | API-Traceability.md           | 5.6         | AGT-TRACE    | 中     | TODO |
| 6.7  | 2   | API設計      | Repository API              | API-Repository.md             | 5.7         | AGT-GIT      | 中     | TODO |
| 7    | 1   | 実装         | Backend実装                 | backend.diff.txt              | 6           | AGT-BE       | 高     | TODO |
| 7.1  | 2   | 実装         | Frontend実装                | frontend.diff.txt             | 6,4         | AGT-FE       | 高     | TODO |
| 8    | 1   | テスト       | 単体テスト設計              | TST-001.md                    | 7           | AGT-TST-DES  | 高     | TODO |
| 8.1  | 2   | テスト       | 単体テスト実施              | TR-001.md                     | 8           | AGT-TST-EXEC | 高     | TODO |
| 8.2  | 2   | テスト       | Coverage測定                | CoverageReport.md             | 8.1         | AGT-TST-EXEC | 高     | TODO |
| 9    | 1   | レビュー     | レビュー実施                | RVW-xxx.md                    | 7,8         | AGT-REVIEW   | 最高   | TODO |
| 9.1  | 2   | レビュー     | 指摘対応                    | FIX-xxx.md                    | 9           | AGT-FIX      | 最高   | TODO |
| 10   | 1   | 構成管理     | Git/PR対応                  | PR                            | 9.1         | AGT-GIT      | 高     | TODO |
| 10.1 | 2   | 構成管理     | CI/CD                       | CI結果                        | 10          | AGT-CI       | 高     | TODO |
| 10.2 | 2   | 構成管理     | リリース                    | Release                       | 10.1        | AGT-CD       | 中     | TODO |
```

このWBSは、要件 → 基本設計 → 機能仕様 → 画面仕様 → サービス設計 → API設計 → 実装 → テスト → レビュー → Git運用という依存関係を反映しています。特にサブエージェント体系の責務分離とレビュー駆動開発フローを前提に組んでいます。 【3-ef7a0d】【4-faf112】

使用資料: 要件.md 【8-34e50b】 要件定義書.md 【9-618d2b】 運用フロー.md 【1-9ceb5a】 運用手順書.md 【2-d2e862】 画面一覧.md 【5-0d901b】 機能一覧.md 【6-4dbb66】 データモデル設計書.md 【7-cfd7bc】 AI駆動型開発 サブエージェント体系設計 1.md 【3-ef7a0d】 AI駆動型開発 サブエージェント体系設計2.md 【4-faf112】