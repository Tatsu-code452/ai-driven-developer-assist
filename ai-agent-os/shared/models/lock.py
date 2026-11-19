"""Lock model for AI-OS."""

from enum import Enum
from typing import Optional
from pydantic import Field
from .base import BaseEntity, current_utc_iso


class LockStatus(str, Enum):
    ACTIVE = "ACTIVE"
    EXPIRED = "EXPIRED"
    FORCE_UNLOCKED = "FORCE_UNLOCKED"
    RELEASED = "RELEASED"


class Lock(BaseEntity):
    lockId: str = Field(...)
    resource: str = Field(...)
    ownerAgent: str = Field(...)
    acquiredAt: str = Field(default_factory=current_utc_iso)
    expireAt: str = Field(...)
    status: LockStatus = Field(default=LockStatus.ACTIVE)

    def release(self) -> None:
        self.status = LockStatus.RELEASED
        self.touch()

    def force_unlock(self) -> None:
        self.status = LockStatus.FORCE_UNLOCKED
        self.touch()
