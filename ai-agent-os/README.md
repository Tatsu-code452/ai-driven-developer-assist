# AI Development Operating System - Shared Errors Module (R002)

AI-OS における状態管理（StateCode）、エラーコード体系（ErrorCode）、およびカスタム例外クラス（AIOSException）を提供する共通モジュールです。

## モジュール構造

```text
shared/
├── __init__.py
├── models/             # R001 共通データモデル
└── errors/             # R002 状態・エラー管理
    ├── __init__.py
    ├── state_code.py   # StateCode, ExecutionState, StateLevel, 状態遷移規則
    ├── error_code.py   # ErrorCode, ErrorCategory, ErrorSeverity, Meta情報
    └── exceptions.py   # AIOSException および E1000〜E9000系例外クラス
tests/
├── test_shared_models.py
└── test_shared_errors.py
```

## 主な機能・定義

1. **StateCode (標準状態コード)**
   - `OK`, `REVIEW_REQUIRED`, `REVIEW_NG`, `DECISION_REQUIRED`, `BLOCK`, `TIMEOUT`, `SPLIT_REQUIRED`, `CONFLICT_DETECTED`, `FORCE_UNLOCK`, `CACHE_INVALID`, `NG`
   - `is_auto_recoverable` プロパティ（自動復旧可能状態の判定）
   - `requires_human_decision` プロパティ（人間/PM判断が必要な状態の判定）

2. **ErrorCode (エラーコード体系)**
   - `E1000系` (INPUT), `E2000系` (AGENT), `E3000系` (LOCK), `E4000系` (GIT), `E5000系` (REVIEW), `E6000系` (CONTEXT), `E7000系` (CACHE), `E9000系` (SYSTEM)
   - 各エラーコードはカテゴリ、重要度（Severity-1〜4）、詳細説明、復旧アクション、結果状態メタデータを保持

3. **Exception (例外クラス体系)**
   - `AIOSException` (基底例外クラス)
   - `InputException`, `AgentException`, `LockException`, `GitException`, `ReviewException`, `ContextException`, `CacheException`, `SystemException`
   - `to_audit_log_dict()` メソッドにより AuditLog 用イベントデータを標準フォーマットで出力可能

## テスト実行手順

```bash
python3 -m unittest discover -s tests
```
