"""Execution model for AI-OS."""

from enum import Enum
from typing import Optional
from pydantic import Field
from .base import BaseEntity, current_utc_iso


class ExecutionStatus(str, Enum):
    READY = "READY"
    WORKING = "WORKING"
    REVIEW_REQUIRED = "REVIEW_REQUIRED"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    TIMEOUT = "TIMEOUT"


class Execution(BaseEntity):
    executionId: str = Field(..., description="e.g. EXEC-000001")
    instructionId: str = Field(...)
    assignedAgent: str = Field(default="")
    status: ExecutionStatus = Field(default=ExecutionStatus.READY)
    startedAt: Optional[str] = None
    completedAt: Optional[str] = None

    def start(self, agent_name: str) -> None:
        self.assignedAgent = agent_name
        self.status = ExecutionStatus.WORKING
        self.startedAt = current_utc_iso()
        self.touch()

    def request_review(self) -> None:
        self.status = ExecutionStatus.REVIEW_REQUIRED
        self.touch()

    def complete(self) -> None:
        self.status = ExecutionStatus.COMPLETED
        self.completedAt = current_utc_iso()
        self.touch()

    def fail(self) -> None:
        self.status = ExecutionStatus.FAILED
        self.completedAt = current_utc_iso()
        self.touch()
