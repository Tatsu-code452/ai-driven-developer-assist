"""Cache model for AI-OS."""

from enum import Enum
from typing import Optional
from pydantic import Field
from .base import BaseEntity, current_utc_iso


class CacheStatus(str, Enum):
    VALID = "VALID"
    INVALID = "INVALID"
    EXPIRED = "EXPIRED"
    DELETED = "DELETED"


class Cache(BaseEntity):
    cacheId: str = Field(...)
    targetId: str = Field(...)
    hash: str = Field(...)
    cachedAt: str = Field(default_factory=current_utc_iso)
    expireAt: str = Field(...)
    status: CacheStatus = Field(default=CacheStatus.VALID)

    def invalidate(self) -> None:
        self.status = CacheStatus.INVALID
        self.touch()
