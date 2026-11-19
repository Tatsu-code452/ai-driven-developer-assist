"""Trace model for AI-OS."""

from typing import Optional
from pydantic import Field
from .base import BaseEntity


class Trace(BaseEntity):
    traceId: str = Field(...)
    instructionId: str = Field(...)
    executionId: Optional[str] = None
    deliverableId: Optional[str] = None
    reviewId: Optional[str] = None
    decisionId: Optional[str] = None
