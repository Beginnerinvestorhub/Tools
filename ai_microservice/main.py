"""
AI Behavioral Nudge System - FastAPI Microservice
Phase 2: Python AI Behavioral Nudge System (Core Intelligence)

This microservice provides AI-driven personalized learning recommendations
and behavioral nudges for the Beginner Investor Hub platform.
"""

from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import os
import asyncio
import asyncpg
from datetime import datetime, timedelta
import json
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.feature_extraction.text import TfidfVectorizer
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="AI Behavioral Nudge System",
    description="Personalized learning recommendations and behavioral nudges for investment education",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:4000"],  # Add production URLs as needed
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()

# Database connection
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@localhost:5432/investor_hub")

# Pydantic models
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

class NudgeRecommendation(BaseModel):
    learning_path_id: Optional[int] = None
    next_lesson_id: Optional[int] = None
    recommended_content: List[LearningContent] = []
    nudge_message: str
    nudge_type: str
    confidence_score: float = Field(ge=0.0, le=1.0)
    reasoning: str
    priority_score: int = Field(ge=0, le=100)

class UserBehaviorData(BaseModel):
    user_id: str
    recent_sessions: List[Dict[str, Any]]
    completion_rate: float
    average_session_duration: float
    preferred_content_types: List[str]
    learning_velocity: float  # lessons per week
    engagement_score: float

# Database connection pool
db_pool = None

async def get_db_pool():
    global db_pool
    if db_pool is None:
        db_pool = await asyncpg.create_pool(DATABASE_URL, min_size=1, max_size=10)
    return db_pool

async def get_db():
    pool = await get_db_pool()
    async with pool.acquire() as connection:
        yield connection

# Authentication dependency (simplified for now)
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    # In production, validate JWT token here
    # For now, we'll extract user_id from a simple token
    token = credentials.credentials
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return {"user_id": token}  # Simplified - in production, decode JWT

# AI Recommendation Engine
class AIRecommendationEngine:
    def __init__(self):
        self.content_vectorizer = TfidfVectorizer(max_features=1000, stop_words='english')
        self.content_vectors = None
        self.content_data = []
        
    async def load_content_data(self, db_connection):
        """Load and vectorize learning content for similarity calculations"""
        try:
            # Fetch all active learning content
            query = """
                SELECT id, title, content_body, tags, difficulty_level, content_type, points_value, estimated_duration_minutes
                FROM learning_content 
                WHERE is_active = true
            """
            rows = await db_connection.fetch(query)
            
            self.content_data = []
            content_texts = []
            
            for row in rows:
                content_item = {
                    'id': row['id'],
                    'title': row['title'],
                    'content_body': row['content_body'] or '',
                    'tags': row['tags'] or [],
                    'difficulty_level': row['difficulty_level'],
                    'content_type': row['content_type'],
                    'points_value': row['points_value'],
                    'estimated_duration_minutes': row['estimated_duration_minutes']
                }
                self.content_data.append(content_item)
                
                # Create text representation for vectorization
                text_repr = f"{row['title']} {row['content_body'] or ''} {' '.join(row['tags'] or [])}"
                content_texts.append(text_repr)
            
            # Vectorize content for similarity calculations
            if content_texts:
                self.content_vectors = self.content_vectorizer.fit_transform(content_texts)
                
            logger.info(f"Loaded {len(self.content_data)} content items for AI recommendations")
            
        except Exception as e:
            logger.error(f"Error loading content data: {e}")
            raise
    
    async def get_user_profile(self, user_id: str, db_connection) -> Optional[UserProfile]:
        """Fetch comprehensive user profile for recommendations"""
        try:
            query = """
                SELECT 
                    ulp.*,
                    rp.name as risk_profile_name
                FROM user_learning_profiles ulp
                LEFT JOIN risk_profiles rp ON ulp.risk_profile_id = rp.id
                WHERE ulp.user_id = $1
            """
            row = await db_connection.fetchrow(query, user_id)
            
            if not row:
                return None
                
            return UserProfile(
                user_id=user_id,
                risk_profile=row['risk_profile_name'] or 'moderate',
                investment_goals=row['investment_goals'] or [],
                time_horizon=row['time_horizon'] or 'medium_term',
                learning_style=row['learning_style'] or 'visual',
                preferred_topics=row['preferred_topics'] or [],
                completed_lessons=row['completed_lessons'] or [],
                completed_challenges=row['completed_challenges'] or [],
                behavioral_tendencies=row['behavioral_tendencies'] or {}
            )
            
        except Exception as e:
            logger.error(f"Error fetching user profile: {e}")
            return None
    
    async def analyze_user_behavior(self, user_id: str, db_connection) -> UserBehaviorData:
        """Analyze user behavior patterns for personalized nudges"""
        try:
            # Get recent behavioral analytics
            behavior_query = """
                SELECT event_type, event_data, timestamp, session_duration_seconds
                FROM user_behavioral_analytics 
                WHERE user_id = $1 AND timestamp > $2
                ORDER BY timestamp DESC
                LIMIT 100
            """
            
            week_ago = datetime.now() - timedelta(days=7)
            behavior_rows = await db_connection.fetch(behavior_query, user_id, week_ago)
            
            # Get completion statistics
            completion_query = """
                SELECT 
                    COUNT(*) as total_started,
                    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
                    AVG(time_spent_minutes) as avg_time_spent
                FROM user_learning_progress 
                WHERE user_id = $1
            """
            completion_row = await db_connection.fetchrow(completion_query, user_id)
            
            # Calculate metrics
            recent_sessions = [
                {
                    'event_type': row['event_type'],
                    'event_data': row['event_data'],
                    'timestamp': row['timestamp'].isoformat(),
                    'duration': row['session_duration_seconds']
                }
                for row in behavior_rows
            ]
            
            total_started = completion_row['total_started'] or 0
            completed = completion_row['completed'] or 0
            completion_rate = completed / total_started if total_started > 0 else 0.0
            
            avg_session_duration = completion_row['avg_time_spent'] or 0
            
            # Analyze content type preferences
            content_type_counts = {}
            for session in recent_sessions:
                if session['event_type'] in ['lesson_completed', 'challenge_completed']:
                    event_data = session['event_data']
                    if isinstance(event_data, dict) and 'contentType' in event_data:
                        content_type = event_data['contentType']
                        content_type_counts[content_type] = content_type_counts.get(content_type, 0) + 1
            
            preferred_content_types = sorted(content_type_counts.keys(), 
                                           key=lambda x: content_type_counts[x], 
                                           reverse=True)[:3]
            
            # Calculate learning velocity (lessons per week)
            lesson_completions = [s for s in recent_sessions if s['event_type'] == 'lesson_completed']
            learning_velocity = len(lesson_completions) / 7.0  # per week
            
            # Calculate engagement score (0-1)
            engagement_factors = [
                min(completion_rate * 2, 1.0),  # Completion rate (weighted)
                min(learning_velocity / 3.0, 1.0),  # Learning velocity (3+ lessons/week = max)
                min(len(recent_sessions) / 20.0, 1.0),  # Session frequency
            ]
            engagement_score = sum(engagement_factors) / len(engagement_factors)
            
            return UserBehaviorData(
                user_id=user_id,
                recent_sessions=recent_sessions,
                completion_rate=completion_rate,
                average_session_duration=avg_session_duration,
                preferred_content_types=preferred_content_types,
                learning_velocity=learning_velocity,
                engagement_score=engagement_score
            )
            
        except Exception as e:
            logger.error(f"Error analyzing user behavior: {e}")
            # Return default behavior data
            return UserBehaviorData(
                user_id=user_id,
                recent_sessions=[],
                completion_rate=0.0,
                average_session_duration=0.0,
                preferred_content_types=[],
                learning_velocity=0.0,
                engagement_score=0.5
            )
    
    def generate_nudge_message(self, user_profile: UserProfile, behavior_data: UserBehaviorData, 
                              recommended_content: List[LearningContent]) -> tuple[str, str]:
        """Generate personalized nudge message based on user data"""
        
        # Determine nudge type based on behavior patterns
        if behavior_data.engagement_score < 0.3:
            nudge_type = "re_engagement"
        elif behavior_data.completion_rate < 0.5:
            nudge_type = "completion_encouragement"
        elif behavior_data.learning_velocity > 2.0:
            nudge_type = "challenge_progression"
        else:
            nudge_type = "learning_continuation"
        
        # Generate personalized message
        messages = {
            "re_engagement": [
                f"Hi! We miss you on your investment learning journey. Ready to dive back in?",
                f"Your {user_profile.risk_profile} investment strategy is waiting for you to continue learning!",
                f"Small steps lead to big gains. How about a quick 15-minute lesson today?"
            ],
            "completion_encouragement": [
                f"You're {int(behavior_data.completion_rate * 100)}% of the way there! Let's finish what you started.",
                f"Great progress on your {user_profile.risk_profile} investment path! Ready for the next step?",
                f"You've got this! Complete one more lesson to keep your momentum going."
            ],
            "challenge_progression": [
                f"Impressive learning pace! Ready for a challenge to test your {user_profile.risk_profile} investment knowledge?",
                f"You're on fire! 🔥 Time to level up with some advanced content.",
                f"Your dedication is paying off! Let's tackle something more challenging."
            ],
            "learning_continuation": [
                f"Perfect timing for your next lesson in {user_profile.risk_profile} investing!",
                f"Ready to build on your investment knowledge? Your next lesson awaits!",
                f"Consistency is key to investment success. Let's continue your learning journey!"
            ]
        }
        
        # Select message based on user's learning style
        message_options = messages.get(nudge_type, messages["learning_continuation"])
        
        # Simple selection based on user_id hash for consistency
        message_index = hash(user_profile.user_id) % len(message_options)
        nudge_message = message_options[message_index]
        
        # Add content-specific context if available
        if recommended_content:
            content = recommended_content[0]
            nudge_message += f" We recommend starting with '{content.title}' - it's perfect for your {user_profile.learning_style} learning style."
        
        return nudge_message, nudge_type
    
    async def recommend_content(self, user_profile: UserProfile, behavior_data: UserBehaviorData, 
                               db_connection) -> List[LearningContent]:
        """Generate personalized content recommendations"""
        try:
            # Get user's current progress
            progress_query = """
                SELECT learning_content_id, status 
                FROM user_learning_progress 
                WHERE user_id = $1
            """
            progress_rows = await db_connection.fetch(progress_query, user_profile.user_id)
            
            completed_content_ids = [row['learning_content_id'] for row in progress_rows 
                                   if row['status'] == 'completed']
            in_progress_content_ids = [row['learning_content_id'] for row in progress_rows 
                                     if row['status'] == 'in_progress']
            
            # Rule-based recommendations
            recommendations = []
            
            # 1. Continue in-progress content
            if in_progress_content_ids:
                for content_item in self.content_data:
                    if content_item['id'] in in_progress_content_ids:
                        recommendations.append(LearningContent(
                            id=content_item['id'],
                            title=content_item['title'],
                            content_type=content_item['content_type'],
                            difficulty_level=content_item['difficulty_level'],
                            estimated_duration_minutes=content_item['estimated_duration_minutes'],
                            points_value=content_item['points_value'],
                            tags=content_item['tags']
                        ))
            
            # 2. Recommend based on user preferences and risk profile
            for content_item in self.content_data:
                if (content_item['id'] not in completed_content_ids and 
                    content_item['id'] not in in_progress_content_ids):
                    
                    # Filter by difficulty (start with beginner, progress to intermediate)
                    if len(completed_content_ids) < 5 and content_item['difficulty_level'] != 'beginner':
                        continue
                    elif len(completed_content_ids) >= 10 and content_item['difficulty_level'] == 'beginner':
                        continue
                    
                    # Match content type preferences
                    if (behavior_data.preferred_content_types and 
                        content_item['content_type'] not in behavior_data.preferred_content_types):
                        continue
                    
                    # Match tags with user interests
                    content_tags = set(content_item['tags'])
                    user_topics = set(user_profile.preferred_topics)
                    
                    if user_topics and content_tags.intersection(user_topics):
                        recommendations.append(LearningContent(
                            id=content_item['id'],
                            title=content_item['title'],
                            content_type=content_item['content_type'],
                            difficulty_level=content_item['difficulty_level'],
                            estimated_duration_minutes=content_item['estimated_duration_minutes'],
                            points_value=content_item['points_value'],
                            tags=content_item['tags']
                        ))
            
            # 3. Fallback: recommend popular beginner content
            if not recommendations:
                for content_item in self.content_data[:5]:  # Top 5 content items
                    if content_item['id'] not in completed_content_ids:
                        recommendations.append(LearningContent(
                            id=content_item['id'],
                            title=content_item['title'],
                            content_type=content_item['content_type'],
                            difficulty_level=content_item['difficulty_level'],
                            estimated_duration_minutes=content_item['estimated_duration_minutes'],
                            points_value=content_item['points_value'],
                            tags=content_item['tags']
                        ))
            
            # Limit to top 3 recommendations
            return recommendations[:3]
            
        except Exception as e:
            logger.error(f"Error generating content recommendations: {e}")
            return []

# Initialize AI engine
ai_engine = AIRecommendationEngine()

@app.on_event("startup")
async def startup_event():
    """Initialize the AI engine with content data"""
    try:
        db_connection = await get_db_pool()
        async with db_connection.acquire() as conn:
            await ai_engine.load_content_data(conn)
        logger.info("AI Behavioral Nudge System started successfully")
    except Exception as e:
        logger.error(f"Failed to start AI system: {e}")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "AI Behavioral Nudge System",
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/nudge/recommend-path")
async def recommend_learning_path(
    user_id: str,
    db_connection = Depends(get_db)
) -> NudgeRecommendation:
    """
    Generate personalized learning path recommendation with behavioral nudge
    
    This is the core AI endpoint that analyzes user behavior, preferences, and progress
    to provide intelligent learning recommendations and motivational nudges.
    """
    try:
        # Get user profile
        user_profile = await ai_engine.get_user_profile(user_id, db_connection)
        if not user_profile:
            raise HTTPException(
                status_code=404, 
                detail="User learning profile not found. Please complete onboarding first."
            )
        
        # Analyze user behavior
        behavior_data = await ai_engine.analyze_user_behavior(user_id, db_connection)
        
        # Generate content recommendations
        recommended_content = await ai_engine.recommend_content(user_profile, behavior_data, db_connection)
        
        # Generate personalized nudge message
        nudge_message, nudge_type = ai_engine.generate_nudge_message(
            user_profile, behavior_data, recommended_content
        )
        
        # Calculate confidence score based on data quality
        confidence_factors = [
            0.3 if user_profile.completed_lessons else 0.1,  # Has completion history
            0.2 if behavior_data.recent_sessions else 0.1,   # Has recent activity
            0.2 if user_profile.preferred_topics else 0.1,  # Has preferences
            0.3 if recommended_content else 0.1              # Has recommendations
        ]
        confidence_score = sum(confidence_factors)
        
        # Calculate priority score
        priority_score = int(min(
            (1 - behavior_data.engagement_score) * 50 +  # Lower engagement = higher priority
            (1 - behavior_data.completion_rate) * 30 +   # Lower completion = higher priority
            20,  # Base priority
            100
        ))
        
        # Generate reasoning
        reasoning = f"Based on {user_profile.risk_profile} risk profile, {behavior_data.completion_rate:.0%} completion rate, and {behavior_data.learning_velocity:.1f} lessons/week pace."
        
        # Get current learning path
        current_path_query = """
            SELECT id FROM learning_paths 
            WHERE id = (SELECT current_learning_path_id FROM user_learning_profiles WHERE user_id = $1)
        """
        current_path_row = await db_connection.fetchrow(current_path_query, user_id)
        current_path_id = current_path_row['id'] if current_path_row else None
        
        # Get next lesson ID
        next_lesson_id = recommended_content[0].id if recommended_content else None
        
        # Log the nudge
        await db_connection.execute("""
            INSERT INTO nudge_logs (user_id, nudge_type, nudge_message, nudge_data, delivery_method)
            VALUES ($1, $2, $3, $4, 'api')
        """, user_id, nudge_type, nudge_message, json.dumps({
            'confidence_score': confidence_score,
            'priority_score': priority_score,
            'recommended_content_count': len(recommended_content)
        }))
        
        return NudgeRecommendation(
            learning_path_id=current_path_id,
            next_lesson_id=next_lesson_id,
            recommended_content=recommended_content,
            nudge_message=nudge_message,
            nudge_type=nudge_type,
            confidence_score=confidence_score,
            reasoning=reasoning,
            priority_score=priority_score
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating recommendation for user {user_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
