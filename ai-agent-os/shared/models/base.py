"""Base entity for AI-OS models per Principle-004 and BaseEntity spec."""

from datetime import datetime, timezone
import uuid
from typing import Optional
from pydantic import BaseModel, Field


def generate_uuid() -> str:
    return str(uuid.uuid4())


def current_utc_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class BaseEntity(BaseModel):
    id: str = Field(default_factory=generate_uuid, description="Internal UUID")
    displayId: str = Field(default="", description="Human-readable ID e.g. REQ-000001")
    instructionId: str = Field(default="", description="Parent Instruction ID")
    executionId: str = Field(default="", description="Parent Execution ID")
    traceId: str = Field(default="", description="Trace chain ID")
    createdAt: str = Field(default_factory=current_utc_iso)
    updatedAt: str = Field(default_factory=current_utc_iso)

    def touch(self) -> None:
        self.updatedAt = current_utc_iso()
