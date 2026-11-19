"""StateCode definitions and state transition rules for AI-OS.
Ref: 04_State_And_Error_Code_Specification.md
"""

from enum import Enum
from typing import Dict, Set


class StateLevel(str, Enum):
    EXECUTION = "EXECUTION"
    REVIEW = "REVIEW"
    SYSTEM = "SYSTEM"


class StateCode(str, Enum):
    # Standard State Codes per Spec Section 4
    OK = "OK"  # 正常終了
    REVIEW_REQUIRED = "REVIEW_REQUIRED"  # レビュー判断待ち
    REVIEW_NG = "REVIEW_NG"  # レビュー不合格
    DECISION_REQUIRED = "DECISION_REQUIRED"  # 意思決定待ち
    BLOCK = "BLOCK"  # 処理不能
    TIMEOUT = "TIMEOUT"  # 応答停止
    SPLIT_REQUIRED = "SPLIT_REQUIRED"  # 分割要求
    CONFLICT_DETECTED = "CONFLICT_DETECTED"  # 競合発生
    FORCE_UNLOCK = "FORCE_UNLOCK"  # 強制ロック解除
    CACHE_INVALID = "CACHE_INVALID"  # キャッシュ無効
    NG = "NG"  # 異常終了

    @property
    def is_auto_recoverable(self) -> bool:
        """Check if state allows automated recovery per Spec Section 19."""
        auto_recoverable_states = {
            StateCode.TIMEOUT,
            StateCode.FORCE_UNLOCK,
            StateCode.CACHE_INVALID,
        }
        return self in auto_recoverable_states

    @property
    def requires_human_decision(self) -> bool:
        """Check if state requires human or PM decision."""
        return self in {StateCode.DECISION_REQUIRED, StateCode.BLOCK}


class ExecutionState(str, Enum):
    """Execution lifecycle state per Spec Section 5."""
    READY = "READY"
    WORKING = "WORKING"
    REVIEW_REQUIRED = "REVIEW_REQUIRED"
    COMPLETED = "COMPLETED"


# Allowed state transitions for Execution per Spec Section 5 & 6
EXECUTION_TRANSITIONS: Dict[str, Set[str]] = {
    "READY": {"WORKING"},
    "WORKING": {
        "REVIEW_REQUIRED",
        "BLOCK",
        "TIMEOUT",
        "SPLIT_REQUIRED",
        "NG",
    },
    "REVIEW_REQUIRED": {"OK", "REVIEW_NG", "DECISION_REQUIRED"},
    "REVIEW_NG": {"WORKING"},  # REWORK
}
