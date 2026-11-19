"""Review model for AI-OS."""

from enum import Enum
from typing import Optional
from pydantic import Field
from .base import BaseEntity


class ReviewResult(str, Enum):
    OK = "OK"
    REVIEW_NG = "REVIEW_NG"
    DECISION_REQUIRED = "DECISION_REQUIRED"


class Review(BaseEntity):
    reviewId: str = Field(..., description="e.g. REV-000001")
    executionId: str = Field(...)
    reviewer: str = Field(...)
    result: ReviewResult = Field(...)
    comment: str = Field(default="")
