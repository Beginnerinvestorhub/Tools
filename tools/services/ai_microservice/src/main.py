"""
AI Behavioral Nudge System - FastAPI Microservice
Phase 2: Python AI Behavioral Nudge System (Core Intelligence)

This microservice provides AI-driven personalized learning recommendations
and behavioral nudges for the Beginner Investor Hub platform.
"""

from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import List, Optional, Dict, Any
import os
import asyncio
import asyncpg
from datetime import datetime, timedelta
import json
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.feature_extraction.text import TfidfVectorizer
# After moving to the `src` directory, this import must be relative.
from .models.advanced_ai import AdvancedAIOrchestrator
from .models.api_models import NudgeRecommendation
from .models.domain_models import UserProfile, LearningContent, LearningPath, UserBehaviorData
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

# Initialize Advanced AI Orchestrator
advanced_ai = AdvancedAIOrchestrator()

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
            await advanced_ai.initialize(conn)
        logger.info("AI Behavioral Nudge System with Advanced AI started successfully")
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

@app.get("/nudge/advanced-recommendations")
async def get_advanced_recommendations(
    user_id: str,
    db_connection = Depends(get_db)
) -> Dict:
    """
    Get advanced AI recommendations using machine learning models
    Combines collaborative filtering, content-based filtering, and behavioral predictions
    """
    try:
        # Get user profile and behavior data
        user_profile = await ai_engine.get_user_profile(user_id, db_connection)
        if not user_profile:
            raise HTTPException(status_code=404, detail="User profile not found")
        
        behavior_data = await ai_engine.analyze_user_behavior(user_id, db_connection)
        
        # Get advanced recommendations
        advanced_results = await advanced_ai.get_advanced_recommendations(
            user_id, 
            user_profile.__dict__, 
            behavior_data.__dict__, 
            db_connection
        )
        
        return {
            "user_id": user_id,
            "advanced_recommendations": advanced_results["recommendations"],
            "behavioral_predictions": advanced_results["predictions"],
            "optimized_nudge": advanced_results["optimized_nudge"],
            "confidence_score": advanced_results["confidence_score"],
            "model_version": "advanced_v1.0",
            "generated_at": datetime.now().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating advanced recommendations: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/analytics/user-insights")
async def get_user_insights(
    user_id: str,
    db_connection = Depends(get_db)
) -> Dict:
    """
    Get comprehensive user analytics and behavioral insights
    """
    try:
        # Get user behavior data
        behavior_data = await ai_engine.analyze_user_behavior(user_id, db_connection)
        
        # Get behavioral predictions
        user_features = {
            'total_content': len(behavior_data.recent_sessions),
            'completed_content': sum(1 for s in behavior_data.recent_sessions if s['event_type'] == 'lesson_completed'),
            'avg_time_spent': behavior_data.average_session_duration,
            'active_days': len(set(s['timestamp'][:10] for s in behavior_data.recent_sessions)),
            'total_events': len(behavior_data.recent_sessions),
            'completion_rate': behavior_data.completion_rate,
            'time_horizon': 'medium_term',  # Would come from user profile
            'learning_style': 'visual'  # Would come from user profile
        }
        
        engagement_pred = advanced_ai.behavioral_engine.predict_engagement(user_features)
        completion_pred = advanced_ai.behavioral_engine.predict_completion_probability(user_features)
        churn_risk = advanced_ai.behavioral_engine.predict_churn_risk(user_features)
        
        # Calculate learning trajectory
        learning_trajectory = await _calculate_learning_trajectory(user_id, db_connection)
        
        return {
            "user_id": user_id,
            "engagement_score": float(engagement_pred),
            "completion_probability": float(completion_pred),
            "churn_risk": float(churn_risk),
            "learning_velocity": behavior_data.learning_velocity,
            "preferred_content_types": behavior_data.preferred_content_types,
            "learning_trajectory": learning_trajectory,
            "behavioral_segment": _get_behavioral_segment(engagement_pred, completion_pred, churn_risk),
            "recommendations": {
                "intervention_needed": churn_risk > 0.7,
                "suggested_content_type": behavior_data.preferred_content_types[0] if behavior_data.preferred_content_types else "lesson",
                "optimal_session_length": min(30, max(10, behavior_data.average_session_duration))
            },
            "generated_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error generating user insights: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/analytics/cohort-analysis")
async def get_cohort_analysis(
    cohort_period: str = "weekly",
    db_connection = Depends(get_db)
) -> Dict:
    """
    Get cohort analysis for user retention and engagement
    """
    try:
        # Get cohort data
        cohort_query = """
            SELECT 
                DATE_TRUNC($1, ulp.created_at) as cohort_period,
                COUNT(DISTINCT ulp.user_id) as cohort_size,
                COUNT(DISTINCT CASE WHEN ulpr.completed_at > ulp.created_at + INTERVAL '7 days' THEN ulp.user_id END) as week_1_retention,
                COUNT(DISTINCT CASE WHEN ulpr.completed_at > ulp.created_at + INTERVAL '30 days' THEN ulp.user_id END) as month_1_retention,
                AVG(CASE WHEN ulpr.status = 'completed' THEN 1.0 ELSE 0.0 END) as avg_completion_rate
            FROM user_learning_profiles ulp
            LEFT JOIN user_learning_progress ulpr ON ulp.user_id = ulpr.user_id
            WHERE ulp.created_at > NOW() - INTERVAL '90 days'
            GROUP BY DATE_TRUNC($1, ulp.created_at)
            ORDER BY cohort_period DESC
        """
        
        cohort_data = await db_connection.fetch(cohort_query, cohort_period)
        
        # Calculate retention rates
        cohorts = []
        for row in cohort_data:
            cohort_size = row['cohort_size']
            cohorts.append({
                "period": row['cohort_period'].isoformat(),
                "cohort_size": cohort_size,
                "week_1_retention_rate": (row['week_1_retention'] / cohort_size) if cohort_size > 0 else 0,
                "month_1_retention_rate": (row['month_1_retention'] / cohort_size) if cohort_size > 0 else 0,
                "avg_completion_rate": float(row['avg_completion_rate'] or 0)
            })
        
        return {
            "cohort_period": cohort_period,
            "cohorts": cohorts,
            "summary": {
                "total_cohorts": len(cohorts),
                "avg_week_1_retention": sum(c["week_1_retention_rate"] for c in cohorts) / len(cohorts) if cohorts else 0,
                "avg_month_1_retention": sum(c["month_1_retention_rate"] for c in cohorts) / len(cohorts) if cohorts else 0,
                "avg_completion_rate": sum(c["avg_completion_rate"] for c in cohorts) / len(cohorts) if cohorts else 0
            },
            "generated_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error generating cohort analysis: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.post("/models/retrain")
async def retrain_models(
    force: bool = False,
    db_connection = Depends(get_db)
) -> Dict:
    """
    Retrain AI models with latest data
    """
    try:
        # Check if retraining is needed
        should_retrain = force or await advanced_ai.should_retrain_models(db_connection)
        
        if not should_retrain:
            return {
                "status": "skipped",
                "message": "Models are up to date",
                "last_update": advanced_ai.last_model_update.isoformat() if advanced_ai.last_model_update else None
            }
        
        # Retrain models
        logger.info("Starting model retraining...")
        await advanced_ai.initialize(db_connection)
        
        return {
            "status": "success",
            "message": "Models retrained successfully",
            "retrained_at": datetime.now().isoformat(),
            "models_updated": [
                "collaborative_filtering",
                "content_based",
                "behavioral_analytics",
                "nudge_optimization"
            ]
        }
        
    except Exception as e:
        logger.error(f"Error retraining models: {e}")
        raise HTTPException(status_code=500, detail="Model retraining failed")

@app.get("/models/performance")
async def get_model_performance(
    db_connection = Depends(get_db)
) -> Dict:
    """
    Get AI model performance metrics
    """
    try:
        # Get recent nudge effectiveness
        nudge_query = """
            SELECT 
                nudge_type,
                COUNT(*) as total_nudges,
                COUNT(CASE WHEN user_response = 'clicked' THEN 1 END) as clicked,
                COUNT(CASE WHEN user_response = 'completed_action' THEN 1 END) as completed,
                AVG(effectiveness_score) as avg_effectiveness
            FROM nudge_logs
            WHERE delivered_at > NOW() - INTERVAL '30 days'
            GROUP BY nudge_type
        """
        
        nudge_data = await db_connection.fetch(nudge_query)
        
        # Get recommendation accuracy (simplified)
        rec_query = """
            SELECT 
                COUNT(*) as total_recommendations,
                COUNT(CASE WHEN ulpr.status = 'completed' THEN 1 END) as completed_recommendations
            FROM learning_recommendations lr
            LEFT JOIN user_learning_progress ulpr ON lr.recommended_content_id = ulpr.learning_content_id
            WHERE lr.created_at > NOW() - INTERVAL '30 days'
        """
        
        rec_data = await db_connection.fetchrow(rec_query)
        
        nudge_performance = []
        for row in nudge_data:
            total = row['total_nudges']
            nudge_performance.append({
                "nudge_type": row['nudge_type'],
                "total_sent": total,
                "click_rate": (row['clicked'] / total) if total > 0 else 0,
                "completion_rate": (row['completed'] / total) if total > 0 else 0,
                "avg_effectiveness": float(row['avg_effectiveness'] or 0)
            })
        
        total_recs = rec_data['total_recommendations'] or 0
        recommendation_accuracy = (rec_data['completed_recommendations'] / total_recs) if total_recs > 0 else 0
        
        return {
            "model_status": "healthy",
            "last_update": advanced_ai.last_model_update.isoformat() if advanced_ai.last_model_update else None,
            "nudge_performance": nudge_performance,
            "recommendation_accuracy": float(recommendation_accuracy),
            "overall_performance_score": _calculate_overall_performance(nudge_performance, recommendation_accuracy),
            "generated_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting model performance: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

# Helper functions
async def _calculate_learning_trajectory(user_id: str, db_connection) -> Dict:
    """Calculate user's learning trajectory over time"""
    query = """
        SELECT 
            DATE(completed_at) as completion_date,
            COUNT(*) as lessons_completed
        FROM user_learning_progress
        WHERE user_id = $1 AND status = 'completed'
          AND completed_at > NOW() - INTERVAL '30 days'
        GROUP BY DATE(completed_at)
        ORDER BY completion_date
    """
    
    rows = await db_connection.fetch(query, user_id)
    
    trajectory = []
    cumulative = 0
    for row in rows:
        cumulative += row['lessons_completed']
        trajectory.append({
            "date": row['completion_date'].isoformat(),
            "daily_completions": row['lessons_completed'],
            "cumulative_completions": cumulative
        })
    
    return {
        "daily_progress": trajectory,
        "total_days_active": len(trajectory),
        "avg_daily_completions": sum(t["daily_completions"] for t in trajectory) / len(trajectory) if trajectory else 0
    }

def _get_behavioral_segment(engagement: float, completion: float, churn_risk: float) -> str:
    """Determine user behavioral segment"""
    if churn_risk > 0.7:
        return "at_risk"
    elif engagement > 0.7 and completion > 0.8:
        return "champion"
    elif engagement > 0.5 and completion > 0.6:
        return "loyal"
    elif engagement < 0.3:
        return "hibernating"
    else:
        return "developing"

def _calculate_overall_performance(nudge_performance: List, recommendation_accuracy: float) -> float:
    """Calculate overall AI system performance score"""
    if not nudge_performance:
        return recommendation_accuracy
    
    avg_nudge_effectiveness = sum(n["avg_effectiveness"] for n in nudge_performance) / len(nudge_performance)
    return (avg_nudge_effectiveness * 0.6 + recommendation_accuracy * 0.4)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
