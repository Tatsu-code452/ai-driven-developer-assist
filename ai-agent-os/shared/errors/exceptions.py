"""Custom Exceptions for AI-OS.
Ref: 04_State_And_Error_Code_Specification.md
"""

from datetime import datetime, timezone
from typing import Any, Dict, Optional
from .error_code import ErrorCode, ErrorMeta
from .state_code import StateCode


class AIOSException(Exception):
    """Base exception for all AI Development Operating System errors."""

    def __init__(
        self,
        error_code: ErrorCode,
        message: Optional[str] = None,
        execution_id: Optional[str] = None,
        instruction_id: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
    ):
        self.error_code = error_code
        self.meta: ErrorMeta = error_code.meta
        self.message = message or self.meta.description
        self.execution_id = execution_id
        self.instruction_id = instruction_id
        self.details = details or {}
        self.timestamp = datetime.now(timezone.utc).isoformat()
        super().__init__(f"[{self.meta.code}:{self.meta.name}] {self.message}")

    @property
    def result_state(self) -> StateCode:
        return StateCode(self.meta.result_state)

    def to_audit_log_dict(self) -> Dict[str, Any]:
        """Format exception into standard Audit Log event payload per Spec Section 17."""
        return {
            "eventType": "ERROR",
            "errorCode": self.meta.code,
            "errorName": self.meta.name,
            "severity": self.meta.severity.value,
            "resultState": self.result_state.value,
            "instructionId": self.instruction_id or "",
            "executionId": self.execution_id or "",
            "message": self.message,
            "details": self.details,
            "timestamp": self.timestamp,
        }


class InputException(AIOSException):
    """E1000 series input errors."""
    def __init__(self, error_code: ErrorCode = ErrorCode.E1002_INVALID_PARAMETER, **kwargs):
        super().__init__(error_code=error_code, **kwargs)


class AgentException(AIOSException):
    """E2000 series agent errors."""
    def __init__(self, error_code: ErrorCode = ErrorCode.E2003_AGENT_CRASH, **kwargs):
        super().__init__(error_code=error_code, **kwargs)


class LockException(AIOSException):
    """E3000 series lock errors."""
    def __init__(self, error_code: ErrorCode = ErrorCode.E3001_LOCK_ACQUIRE_FAILED, **kwargs):
        super().__init__(error_code=error_code, **kwargs)


class GitException(AIOSException):
    """E4000 series git errors."""
    def __init__(self, error_code: ErrorCode = ErrorCode.E4002_CONFLICT_DETECTED, **kwargs):
        super().__init__(error_code=error_code, **kwargs)


class ReviewException(AIOSException):
    """E5000 series review errors."""
    def __init__(self, error_code: ErrorCode = ErrorCode.E5001_REVIEW_LIMIT_EXCEEDED, **kwargs):
        super().__init__(error_code=error_code, **kwargs)


class ContextException(AIOSException):
    """E6000 series context limit errors."""
    def __init__(self, error_code: ErrorCode = ErrorCode.E6001_CONTEXT_LIMIT_EXCEEDED, **kwargs):
        super().__init__(error_code=error_code, **kwargs)


class CacheException(AIOSException):
    """E7000 series cache errors."""
    def __init__(self, error_code: ErrorCode = ErrorCode.E7001_CACHE_INVALID, **kwargs):
        super().__init__(error_code=error_code, **kwargs)


class SystemException(AIOSException):
    """E9000 series system errors."""
    def __init__(self, error_code: ErrorCode = ErrorCode.E9001_UNKNOWN_ERROR, **kwargs):
        super().__init__(error_code=error_code, **kwargs)
