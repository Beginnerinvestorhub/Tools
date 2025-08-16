"""Pydantic models for API requests and responses."""

from pydantic import BaseModel, Field
from typing import List, Optional

from .domain_models import LearningContent


class NudgeRecommendation(BaseModel):
    learning_path_id: Optional[int] = None
    next_lesson_id: Optional[int] = None
    recommended_content: List[LearningContent] = []
    nudge_message: str
    nudge_type: str
    confidence_score: float = Field(ge=0.0, le=1.0)
    reasoning: str
    priority_score: int = Field(ge=0, le=100)