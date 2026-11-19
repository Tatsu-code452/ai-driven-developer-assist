"""AuditLog model for AI-OS."""

from enum import Enum
from typing import Optional
from pydantic import Field
from .base import BaseEntity, current_utc_iso


class AuditEventType(str, Enum):
    CREATE = "CREATE"
    UPDATE = "UPDATE"
    DELETE = "DELETE"
    REVIEW = "REVIEW"
    DECISION = "DECISION"
    LOCK = "LOCK"
    UNLOCK = "UNLOCK"
    MERGE = "MERGE"
    CONFLICT = "CONFLICT"
    TIMEOUT = "TIMEOUT"
    RECOVERY = "RECOVERY"


class AuditLog(BaseEntity):
    eventId: str = Field(...)
    eventType: AuditEventType = Field(...)
    resource: str = Field(...)
    actor: str = Field(...)
    timestamp: str = Field(default_factory=current_utc_iso)
