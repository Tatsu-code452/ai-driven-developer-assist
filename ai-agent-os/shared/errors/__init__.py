"""shared/errors package initialization."""

from .state_code import StateCode, StateLevel, ExecutionState, EXECUTION_TRANSITIONS
from .error_code import ErrorCode, ErrorCategory, ErrorSeverity, ErrorMeta, ERROR_METADATA
from .exceptions import (
    AIOSException,
    InputException,
    AgentException,
    LockException,
    GitException,
    ReviewException,
    ContextException,
    CacheException,
    SystemException,
)

__all__ = [
    "StateCode",
    "StateLevel",
    "ExecutionState",
    "EXECUTION_TRANSITIONS",
    "ErrorCode",
    "ErrorCategory",
    "ErrorSeverity",
    "ErrorMeta",
    "ERROR_METADATA",
    "AIOSException",
    "InputException",
    "AgentException",
    "LockException",
    "GitException",
    "ReviewException",
    "ContextException",
    "CacheException",
    "SystemException",
]
