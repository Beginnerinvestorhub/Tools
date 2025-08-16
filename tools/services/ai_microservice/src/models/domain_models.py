"""Core domain models for the AI service."""

from pydantic import BaseModel
from typing import List, Optional, Dict, Any


class UserProfile(BaseModel):
    user_id: str
    risk_profile: str
    investment_goals: List[str]
    time_horizon: str
    learning_style: str
    preferred_topics: List[str]
    completed_lessons: List[int]
    completed_challenges: List[int]
    behavioral_tendencies: Dict[str, Any]

class LearningContent(BaseModel):
    id: int
    title: str
    content_type: str
    difficulty_level: str
    estimated_duration_minutes: int
    points_value: int
    tags: List[str]

class LearningPath(BaseModel):
    id: int
    name: str
    description: str
    difficulty_level: str
    estimated_duration_hours: int
    target_risk_profile: Optional[str]

class UserBehaviorData(BaseModel):
    user_id: str
    recent_sessions: List[Dict[str, Any]]
    completion_rate: float
    average_session_duration: float
    preferred_content_types: List[str]
    learning_velocity: float  # lessons per week
    engagement_score: float