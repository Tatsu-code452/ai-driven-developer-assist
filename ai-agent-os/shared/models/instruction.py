"""Instruction model for AI-OS."""

from enum import Enum
from typing import Optional
from pydantic import Field
from .base import BaseEntity


class InstructionPriority(str, Enum):
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"


class InstructionStatus(str, Enum):
    OPEN = "OPEN"
    ASSIGNED = "ASSIGNED"
    IN_PROGRESS = "IN_PROGRESS"
    REVIEW = "REVIEW"
    COMPLETED = "COMPLETED"
    CLOSED = "CLOSED"


class Instruction(BaseEntity):
    instructionId: str = Field(..., description="e.g. INST-000001")
    title: str = Field(..., min_length=1)
    description: str = Field(default="")
    priority: InstructionPriority = Field(default=InstructionPriority.MEDIUM)
    status: InstructionStatus = Field(default=InstructionStatus.OPEN)

    def assign(self) -> None:
        self.status = InstructionStatus.ASSIGNED
        self.touch()

    def start(self) -> None:
        self.status = InstructionStatus.IN_PROGRESS
        self.touch()

    def complete(self) -> None:
        self.status = InstructionStatus.COMPLETED
        self.touch()
