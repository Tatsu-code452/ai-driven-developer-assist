"""ErrorCode definitions and categories for AI-OS.
Ref: 04_State_And_Error_Code_Specification.md
"""

from dataclasses import dataclass
from enum import Enum
from typing import Dict, Optional


class ErrorSeverity(str, Enum):
    SEVERITY_1 = "CRITICAL"
    SEVERITY_2 = "HIGH"
    SEVERITY_3 = "MEDIUM"
    SEVERITY_4 = "LOW"


class ErrorCategory(str, Enum):
    INPUT = "E1000"
    AGENT = "E2000"
    LOCK = "E3000"
    GIT = "E4000"
    REVIEW = "E5000"
    CONTEXT = "E6000"
    CACHE = "E7000"
    SYSTEM = "E9000"


@dataclass(frozen=True)
class ErrorMeta:
    code: str
    name: str
    category: ErrorCategory
    severity: ErrorSeverity
    description: str
    recovery_action: str
    result_state: str


class ErrorCode(str, Enum):
    # E1000系 入力エラー
    E1001_INVALID_INSTRUCTION = "E1001"
    E1002_INVALID_PARAMETER = "E1002"
    E1003_INVALID_CONTEXT = "E1003"

    # E2000系 Agentエラー
    E2001_AGENT_NOT_FOUND = "E2001"
    E2002_AGENT_TIMEOUT = "E2002"
    E2003_AGENT_CRASH = "E2003"
    E2004_AGENT_RESPONSE_INVALID = "E2004"

    # E3000系 Lockエラー
    E3001_LOCK_ACQUIRE_FAILED = "E3001"
    E3002_LOCK_CONFLICT = "E3002"
    E3003_LOCK_EXPIRED = "E3003"
    E3004_LOCK_OWNER_MISMATCH = "E3004"

    # E4000系 Gitエラー
    E4001_AUTH_REQUIRED = "E4001"
    E4002_CONFLICT_DETECTED = "E4002"
    E4003_PUSH_REJECTED = "E4003"
    E4004_MERGE_FAILED = "E4004"
    E4005_WORKTREE_CREATION_FAILED = "E4005"

    # E5000系 Reviewエラー
    E5001_REVIEW_LIMIT_EXCEEDED = "E5001"
    E5002_REVIEW_LOOP_DETECTED = "E5002"
    E5003_REVIEWER_UNAVAILABLE = "E5003"

    # E6000系 Contextエラー
    E6001_CONTEXT_LIMIT_EXCEEDED = "E6001"
    E6002_FILE_LIMIT_EXCEEDED = "E6002"
    E6003_TOKEN_LIMIT_EXCEEDED = "E6003"

    # E7000系 Cacheエラー
    E7001_CACHE_INVALID = "E7001"
    E7002_CACHE_MISS = "E7002"
    E7003_CACHE_CORRUPTION = "E7003"

    # E9000系 Systemエラー
    E9001_UNKNOWN_ERROR = "E9001"
    E9002_STORAGE_FAILURE = "E9002"
    E9003_LOG_WRITE_FAILED = "E9003"
    E9004_RECOVERY_FAILED = "E9004"

    @property
    def meta(self) -> ErrorMeta:
        """Return full error metadata based on specification."""
        return ERROR_METADATA[self]


ERROR_METADATA: Dict[ErrorCode, ErrorMeta] = {
    # E1000
    ErrorCode.E1001_INVALID_INSTRUCTION: ErrorMeta(
        code="E1001",
        name="INVALID_INSTRUCTION",
        category=ErrorCategory.INPUT,
        severity=ErrorSeverity.SEVERITY_3,
        description="Instruction形式不正",
        recovery_action="Instruction再作成",
        result_state="BLOCK",
    ),
    ErrorCode.E1002_INVALID_PARAMETER: ErrorMeta(
        code="E1002",
        name="INVALID_PARAMETER",
        category=ErrorCategory.INPUT,
        severity=ErrorSeverity.SEVERITY_4,
        description="入力パラメータ異常",
        recovery_action="値を修正",
        result_state="BLOCK",
    ),
    ErrorCode.E1003_INVALID_CONTEXT: ErrorMeta(
        code="E1003",
        name="INVALID_CONTEXT",
        category=ErrorCategory.INPUT,
        severity=ErrorSeverity.SEVERITY_3,
        description="コンテキスト不整合",
        recovery_action="Context再取得",
        result_state="BLOCK",
    ),
    # E2000
    ErrorCode.E2001_AGENT_NOT_FOUND: ErrorMeta(
        code="E2001",
        name="AGENT_NOT_FOUND",
        category=ErrorCategory.AGENT,
        severity=ErrorSeverity.SEVERITY_1,
        description="Agent未登録",
        recovery_action="Agent登録確認",
        result_state="NG",
    ),
    ErrorCode.E2002_AGENT_TIMEOUT: ErrorMeta(
        code="E2002",
        name="AGENT_TIMEOUT",
        category=ErrorCategory.AGENT,
        severity=ErrorSeverity.SEVERITY_2,
        description="Agent無応答",
        recovery_action="Watchdog検知 -> Agent再起動 -> Execution再開",
        result_state="TIMEOUT",
    ),
    ErrorCode.E2003_AGENT_CRASH: ErrorMeta(
        code="E2003",
        name="AGENT_CRASH",
        category=ErrorCategory.AGENT,
        severity=ErrorSeverity.SEVERITY_2,
        description="Agent異常終了",
        recovery_action="Agent再起動",
        result_state="NG",
    ),
    ErrorCode.E2004_AGENT_RESPONSE_INVALID: ErrorMeta(
        code="E2004",
        name="AGENT_RESPONSE_INVALID",
        category=ErrorCategory.AGENT,
        severity=ErrorSeverity.SEVERITY_3,
        description="応答形式異常",
        recovery_action="再試行またはフォーマット修正",
        result_state="BLOCK",
    ),
    # E3000
    ErrorCode.E3001_LOCK_ACQUIRE_FAILED: ErrorMeta(
        code="E3001",
        name="LOCK_ACQUIRE_FAILED",
        category=ErrorCategory.LOCK,
        severity=ErrorSeverity.SEVERITY_2,
        description="ロック取得失敗",
        recovery_action="Lock再取得",
        result_state="BLOCK",
    ),
    ErrorCode.E3002_LOCK_CONFLICT: ErrorMeta(
        code="E3002",
        name="LOCK_CONFLICT",
        category=ErrorCategory.LOCK,
        severity=ErrorSeverity.SEVERITY_2,
        description="ロック競合",
        recovery_action="待機後にLock再取得",
        result_state="BLOCK",
    ),
    ErrorCode.E3003_LOCK_EXPIRED: ErrorMeta(
        code="E3003",
        name="LOCK_EXPIRED",
        category=ErrorCategory.LOCK,
        severity=ErrorSeverity.SEVERITY_3,
        description="TTL失効",
        recovery_action="FORCE_UNLOCKまたはLock再取得",
        result_state="FORCE_UNLOCK",
    ),
    ErrorCode.E3004_LOCK_OWNER_MISMATCH: ErrorMeta(
        code="E3004",
        name="LOCK_OWNER_MISMATCH",
        category=ErrorCategory.LOCK,
        severity=ErrorSeverity.SEVERITY_2,
        description="所有者不一致",
        recovery_action="所有権確認",
        result_state="BLOCK",
    ),
    # E4000
    ErrorCode.E4001_AUTH_REQUIRED: ErrorMeta(
        code="E4001",
        name="AUTH_REQUIRED",
        category=ErrorCategory.GIT,
        severity=ErrorSeverity.SEVERITY_2,
        description="認証失敗",
        recovery_action="認証情報再設定",
        result_state="NG",
    ),
    ErrorCode.E4002_CONFLICT_DETECTED: ErrorMeta(
        code="E4002",
        name="CONFLICT_DETECTED",
        category=ErrorCategory.GIT,
        severity=ErrorSeverity.SEVERITY_2,
        description="競合発生",
        recovery_action="競合分析 -> 解決案生成 -> Reviewer判断 -> Merge",
        result_state="CONFLICT_DETECTED",
    ),
    ErrorCode.E4003_PUSH_REJECTED: ErrorMeta(
        code="E4003",
        name="PUSH_REJECTED",
        category=ErrorCategory.GIT,
        severity=ErrorSeverity.SEVERITY_2,
        description="Push拒否",
        recovery_action="Pull / Rebase実施",
        result_state="BLOCK",
    ),
    ErrorCode.E4004_MERGE_FAILED: ErrorMeta(
        code="E4004",
        name="MERGE_FAILED",
        category=ErrorCategory.GIT,
        severity=ErrorSeverity.SEVERITY_2,
        description="Merge失敗",
        recovery_action="マージコンフリクト手動解決",
        result_state="CONFLICT_DETECTED",
    ),
    ErrorCode.E4005_WORKTREE_CREATION_FAILED: ErrorMeta(
        code="E4005",
        name="WORKTREE_CREATION_FAILED",
        category=ErrorCategory.GIT,
        severity=ErrorSeverity.SEVERITY_2,
        description="Worktree作成失敗",
        recovery_action="パス確認およびクリーンアップ",
        result_state="NG",
    ),
    # E5000
    ErrorCode.E5001_REVIEW_LIMIT_EXCEEDED: ErrorMeta(
        code="E5001",
        name="REVIEW_LIMIT_EXCEEDED",
        category=ErrorCategory.REVIEW,
        severity=ErrorSeverity.SEVERITY_3,
        description="レビュー回数超過",
        recovery_action="DECISION_REQUIREDにエスカレーション",
        result_state="DECISION_REQUIRED",
    ),
    ErrorCode.E5002_REVIEW_LOOP_DETECTED: ErrorMeta(
        code="E5002",
        name="REVIEW_LOOP_DETECTED",
        category=ErrorCategory.REVIEW,
        severity=ErrorSeverity.SEVERITY_3,
        description="同一指摘ループ",
        recovery_action="DECISION_REQUIREDにエスカレーション",
        result_state="DECISION_REQUIRED",
    ),
    ErrorCode.E5003_REVIEWER_UNAVAILABLE: ErrorMeta(
        code="E5003",
        name="REVIEWER_UNAVAILABLE",
        category=ErrorCategory.REVIEW,
        severity=ErrorSeverity.SEVERITY_3,
        description="レビュー担当不在",
        recovery_action="代替Reviewer割り当て",
        result_state="BLOCK",
    ),
    # E6000
    ErrorCode.E6001_CONTEXT_LIMIT_EXCEEDED: ErrorMeta(
        code="E6001",
        name="CONTEXT_LIMIT_EXCEEDED",
        category=ErrorCategory.CONTEXT,
        severity=ErrorSeverity.SEVERITY_3,
        description="容量超過",
        recovery_action="タスク分割要求",
        result_state="SPLIT_REQUIRED",
    ),
    ErrorCode.E6002_FILE_LIMIT_EXCEEDED: ErrorMeta(
        code="E6002",
        name="FILE_LIMIT_EXCEEDED",
        category=ErrorCategory.CONTEXT,
        severity=ErrorSeverity.SEVERITY_3,
        description="ファイル数超過",
        recovery_action="対象ファイルの絞り込み",
        result_state="SPLIT_REQUIRED",
    ),
    ErrorCode.E6003_TOKEN_LIMIT_EXCEEDED: ErrorMeta(
        code="E6003",
        name="TOKEN_LIMIT_EXCEEDED",
        category=ErrorCategory.CONTEXT,
        severity=ErrorSeverity.SEVERITY_3,
        description="トークン超過",
        recovery_action="コンテキスト圧縮または分割",
        result_state="SPLIT_REQUIRED",
    ),
    # E7000
    ErrorCode.E7001_CACHE_INVALID: ErrorMeta(
        code="E7001",
        name="CACHE_INVALID",
        category=ErrorCategory.CACHE,
        severity=ErrorSeverity.SEVERITY_3,
        description="キャッシュ無効",
        recovery_action="キャッシュ削除 -> 再解析 -> 再生成",
        result_state="CACHE_INVALID",
    ),
    ErrorCode.E7002_CACHE_MISS: ErrorMeta(
        code="E7002",
        name="CACHE_MISS",
        category=ErrorCategory.CACHE,
        severity=ErrorSeverity.SEVERITY_4,
        description="キャッシュ未存在",
        recovery_action="新規解析実行",
        result_state="WORKING",
    ),
    ErrorCode.E7003_CACHE_CORRUPTION: ErrorMeta(
        code="E7003",
        name="CACHE_CORRUPTION",
        category=ErrorCategory.CACHE,
        severity=ErrorSeverity.SEVERITY_3,
        description="キャッシュ破損",
        recovery_action="キャッシュ破棄",
        result_state="CACHE_INVALID",
    ),
    # E9000
    ErrorCode.E9001_UNKNOWN_ERROR: ErrorMeta(
        code="E9001",
        name="UNKNOWN_ERROR",
        category=ErrorCategory.SYSTEM,
        severity=ErrorSeverity.SEVERITY_1,
        description="未知エラー",
        recovery_action="システム調査およびログ確認",
        result_state="NG",
    ),
    ErrorCode.E9002_STORAGE_FAILURE: ErrorMeta(
        code="E9002",
        name="STORAGE_FAILURE",
        category=ErrorCategory.SYSTEM,
        severity=ErrorSeverity.SEVERITY_1,
        description="ストレージ障害",
        recovery_action="ストレージ復旧手配",
        result_state="NG",
    ),
    ErrorCode.E9003_LOG_WRITE_FAILED: ErrorMeta(
        code="E9003",
        name="LOG_WRITE_FAILED",
        category=ErrorCategory.SYSTEM,
        severity=ErrorSeverity.SEVERITY_4,
        description="ログ保存失敗",
        recovery_action="フォールバックログ保存",
        result_state="WORKING",
    ),
    ErrorCode.E9004_RECOVERY_FAILED: ErrorMeta(
        code="E9004",
        name="RECOVERY_FAILED",
        category=ErrorCategory.SYSTEM,
        severity=ErrorSeverity.SEVERITY_1,
        description="復旧失敗",
        recovery_action="手動復旧エスカレーション",
        result_state="NG",
    ),
}
