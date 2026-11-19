"""Decision model for AI-OS."""

from typing import Optional
from pydantic import Field
from .base import BaseEntity, current_utc_iso


class Decision(BaseEntity):
    decisionId: str = Field(..., description="e.g. DECISION-000001")
    traceId: str = Field(...)
    decisionMaker: str = Field(...)
    decision: str = Field(...)
    reason: str = Field(default="")
    decidedAt: str = Field(default_factory=current_utc_iso)
