"""
Advanced AI Models for Personalized Learning
Phase 4: Machine Learning and Advanced Analytics
"""

import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.cluster import KMeans
from sklearn.ensemble import RandomForestClassifier, GradientBoostingRegressor
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, mean_squared_error
import pickle
import logging
from typing import Dict, List, Tuple, Optional, Any
from datetime import datetime, timedelta
import asyncio
import asyncpg

logger = logging.getLogger(__name__)

class CollaborativeFilteringEngine:
    """
    Collaborative filtering for content recommendations based on user similarity
    """
    
    def __init__(self):
        self.user_item_matrix = None
        self.user_similarity_matrix = None
        self.item_similarity_matrix = None
        self.scaler = StandardScaler()
        
    async def build_user_item_matrix(self, db_connection):
        """Build user-item interaction matrix from learning progress data"""
        try:
            # Get user-content interactions
            query = """
                SELECT 
                    ulp.user_id,
                    ulpr.learning_content_id,
                    CASE 
                        WHEN ulpr.status = 'completed' THEN 1.0
                        WHEN ulpr.status = 'in_progress' THEN 0.5
                        ELSE 0.0
                    END as interaction_score,
                    ulpr.time_spent_minutes,
                    lc.difficulty_level,
                    lc.content_type
                FROM user_learning_profiles ulp
                LEFT JOIN user_learning_progress ulpr ON ulp.user_id = ulpr.user_id
                LEFT JOIN learning_content lc ON ulpr.learning_content_id = lc.id
                WHERE ulpr.learning_content_id IS NOT NULL
            """
            
            rows = await db_connection.fetch(query)
            
            if not rows:
                logger.warning("No user-item interactions found")
                return
            
            # Convert to DataFrame
            df = pd.DataFrame([dict(row) for row in rows])
            
            # Create user-item matrix
            self.user_item_matrix = df.pivot_table(
                index='user_id',
                columns='learning_content_id',
                values='interaction_score',
                fill_value=0.0
            )
            
            # Calculate user similarity matrix
            user_features = self.scaler.fit_transform(self.user_item_matrix.values)
            self.user_similarity_matrix = cosine_similarity(user_features)
            
            # Calculate item similarity matrix
            item_features = self.scaler.fit_transform(self.user_item_matrix.T.values)
            self.item_similarity_matrix = cosine_similarity(item_features)
            
            logger.info(f"Built user-item matrix: {self.user_item_matrix.shape}")
            
        except Exception as e:
            logger.error(f"Error building user-item matrix: {e}")
    
    def get_user_recommendations(self, user_id: str, top_k: int = 5) -> List[Tuple[int, float]]:
        """Get collaborative filtering recommendations for a user"""
        try:
            if self.user_item_matrix is None:
                return []
            
            if user_id not in self.user_item_matrix.index:
                return []
            
            user_idx = self.user_item_matrix.index.get_loc(user_id)
            user_similarities = self.user_similarity_matrix[user_idx]
            
            # Find similar users
            similar_users = np.argsort(user_similarities)[::-1][1:6]  # Top 5 similar users
            
            # Get recommendations based on similar users' preferences
            recommendations = {}
            user_interactions = self.user_item_matrix.iloc[user_idx]
            
            for similar_user_idx in similar_users:
                similar_user_interactions = self.user_item_matrix.iloc[similar_user_idx]
                similarity_score = user_similarities[similar_user_idx]
                
                # Find items the similar user liked but current user hasn't interacted with
                for content_id, score in similar_user_interactions.items():
                    if score > 0.5 and user_interactions[content_id] == 0:
                        if content_id not in recommendations:
                            recommendations[content_id] = 0
                        recommendations[content_id] += score * similarity_score
            
            # Sort and return top-k recommendations
            sorted_recs = sorted(recommendations.items(), key=lambda x: x[1], reverse=True)
            return sorted_recs[:top_k]
            
        except Exception as e:
            logger.error(f"Error getting user recommendations: {e}")
            return []

class ContentBasedEngine:
    """
    Content-based filtering using content features and user preferences
    """
    
    def __init__(self):
        self.content_vectorizer = TfidfVectorizer(max_features=500, stop_words='english')
        self.content_vectors = None
        self.content_features = None
        
    async def build_content_features(self, db_connection):
        """Build content feature vectors"""
        try:
            query = """
                SELECT 
                    id,
                    title,
                    content_body,
                    tags,
                    difficulty_level,
                    content_type,
                    estimated_duration_minutes,
                    points_value
                FROM learning_content
                WHERE is_active = true
            """
            
            rows = await db_connection.fetch(query)
            content_data = pd.DataFrame([dict(row) for row in rows])
            
            # Create text features
            content_texts = []
            for _, row in content_data.iterrows():
                text = f"{row['title']} {row['content_body'] or ''} {' '.join(row['tags'] or [])}"
                content_texts.append(text)
            
            # Vectorize content
            self.content_vectors = self.content_vectorizer.fit_transform(content_texts)
            
            # Store content features
            self.content_features = content_data
            
            logger.info(f"Built content features for {len(content_data)} items")
            
        except Exception as e:
            logger.error(f"Error building content features: {e}")
    
    def get_content_recommendations(self, user_profile: Dict, completed_content_ids: List[int], top_k: int = 5) -> List[Tuple[int, float]]:
        """Get content-based recommendations"""
        try:
            if self.content_features is None:
                return []
            
            # Filter out completed content
            available_content = self.content_features[
                ~self.content_features['id'].isin(completed_content_ids)
            ].copy()
            
            if available_content.empty:
                return []
            
            # Score content based on user preferences
            scores = []
            for _, content in available_content.iterrows():
                score = self._calculate_content_score(content, user_profile)
                scores.append((content['id'], score))
            
            # Sort and return top-k
            sorted_scores = sorted(scores, key=lambda x: x[1], reverse=True)
            return sorted_scores[:top_k]
            
        except Exception as e:
            logger.error(f"Error getting content recommendations: {e}")
            return []
    
    def _calculate_content_score(self, content: pd.Series, user_profile: Dict) -> float:
        """Calculate content relevance score for user"""
        score = 0.0
        
        # Difficulty level matching
        if user_profile.get('learning_style') == 'kinesthetic' and content['content_type'] == 'challenge':
            score += 0.3
        elif user_profile.get('learning_style') == 'visual' and content['content_type'] in ['video', 'lesson']:
            score += 0.3
        elif user_profile.get('learning_style') == 'reading' and content['content_type'] == 'article':
            score += 0.3
        
        # Topic matching
        user_topics = set(user_profile.get('preferred_topics', []))
        content_tags = set(content.get('tags', []))
        topic_overlap = len(user_topics.intersection(content_tags))
        score += topic_overlap * 0.2
        
        # Duration preference (assume shorter is better for beginners)
        if content['estimated_duration_minutes'] <= 20:
            score += 0.1
        
        # Points value (higher is better)
        score += min(content['points_value'] / 200.0, 0.2)
        
        return score

class BehavioralAnalyticsEngine:
    """
    Advanced behavioral analytics and pattern recognition
    """
    
    def __init__(self):
        self.engagement_model = GradientBoostingRegressor(n_estimators=100, random_state=42)
        self.completion_model = RandomForestClassifier(n_estimators=100, random_state=42)
        self.churn_model = RandomForestClassifier(n_estimators=100, random_state=42)
        self.scaler = StandardScaler()
        self.label_encoders = {}
        
    async def train_models(self, db_connection):
        """Train behavioral prediction models"""
        try:
            # Get training data
            training_data = await self._get_training_data(db_connection)
            
            if training_data.empty:
                logger.warning("No training data available")
                return
            
            # Prepare features
            features = self._prepare_features(training_data)
            
            # Train engagement prediction model
            if 'engagement_score' in training_data.columns:
                X_eng = features
                y_eng = training_data['engagement_score']
                self.engagement_model.fit(X_eng, y_eng)
                logger.info("Trained engagement prediction model")
            
            # Train completion prediction model
            if 'will_complete' in training_data.columns:
                X_comp = features
                y_comp = training_data['will_complete']
                self.completion_model.fit(X_comp, y_comp)
                logger.info("Trained completion prediction model")
            
            # Train churn prediction model
            if 'will_churn' in training_data.columns:
                X_churn = features
                y_churn = training_data['will_churn']
                self.churn_model.fit(X_churn, y_churn)
                logger.info("Trained churn prediction model")
                
        except Exception as e:
            logger.error(f"Error training models: {e}")
    
    async def _get_training_data(self, db_connection) -> pd.DataFrame:
        """Get historical data for model training"""
        query = """
            SELECT 
                ulp.user_id,
                ulp.risk_profile_id,
                ulp.time_horizon,
                ulp.learning_style,
                COUNT(ulpr.id) as total_content,
                COUNT(CASE WHEN ulpr.status = 'completed' THEN 1 END) as completed_content,
                AVG(ulpr.time_spent_minutes) as avg_time_spent,
                MAX(ulpr.last_accessed_at) as last_activity,
                COUNT(DISTINCT DATE(uba.timestamp)) as active_days,
                COUNT(uba.id) as total_events,
                AVG(CASE WHEN uba.event_type = 'lesson_completed' THEN 1 ELSE 0 END) as completion_rate
            FROM user_learning_profiles ulp
            LEFT JOIN user_learning_progress ulpr ON ulp.user_id = ulpr.user_id
            LEFT JOIN user_behavioral_analytics uba ON ulp.user_id = uba.user_id
            WHERE ulp.created_at < NOW() - INTERVAL '7 days'
            GROUP BY ulp.user_id, ulp.risk_profile_id, ulp.time_horizon, ulp.learning_style
            HAVING COUNT(ulpr.id) > 0
        """
        
        rows = await db_connection.fetch(query)
        df = pd.DataFrame([dict(row) for row in rows])
        
        if not df.empty:
            # Calculate derived features
            df['completion_rate'] = df['completed_content'] / df['total_content']
            df['engagement_score'] = (df['active_days'] * df['completion_rate'] * df['avg_time_spent'].fillna(0)) / 100
            df['will_complete'] = (df['completion_rate'] > 0.7).astype(int)
            df['days_since_activity'] = (datetime.now() - df['last_activity']).dt.days
            df['will_churn'] = (df['days_since_activity'] > 7).astype(int)
        
        return df
    
    def _prepare_features(self, df: pd.DataFrame) -> np.ndarray:
        """Prepare features for model training"""
        feature_columns = [
            'total_content', 'completed_content', 'avg_time_spent',
            'active_days', 'total_events', 'completion_rate'
        ]
        
        # Handle categorical variables
        categorical_columns = ['time_horizon', 'learning_style']
        for col in categorical_columns:
            if col in df.columns:
                if col not in self.label_encoders:
                    self.label_encoders[col] = LabelEncoder()
                df[f'{col}_encoded'] = self.label_encoders[col].fit_transform(df[col].fillna('unknown'))
                feature_columns.append(f'{col}_encoded')
        
        # Select and scale features
        features = df[feature_columns].fillna(0)
        return self.scaler.fit_transform(features)
    
    def predict_engagement(self, user_features: Dict) -> float:
        """Predict user engagement score"""
        try:
            features = self._prepare_user_features(user_features)
            if features is not None:
                return float(self.engagement_model.predict([features])[0])
            return 0.5
        except Exception as e:
            logger.error(f"Error predicting engagement: {e}")
            return 0.5
    
    def predict_completion_probability(self, user_features: Dict) -> float:
        """Predict probability of content completion"""
        try:
            features = self._prepare_user_features(user_features)
            if features is not None:
                return float(self.completion_model.predict_proba([features])[0][1])
            return 0.5
        except Exception as e:
            logger.error(f"Error predicting completion: {e}")
            return 0.5
    
    def predict_churn_risk(self, user_features: Dict) -> float:
        """Predict user churn risk"""
        try:
            features = self._prepare_user_features(user_features)
            if features is not None:
                return float(self.churn_model.predict_proba([features])[0][1])
            return 0.5
        except Exception as e:
            logger.error(f"Error predicting churn: {e}")
            return 0.5
    
    def _prepare_user_features(self, user_features: Dict) -> Optional[np.ndarray]:
        """Prepare user features for prediction"""
        try:
            feature_vector = [
                user_features.get('total_content', 0),
                user_features.get('completed_content', 0),
                user_features.get('avg_time_spent', 0),
                user_features.get('active_days', 0),
                user_features.get('total_events', 0),
                user_features.get('completion_rate', 0)
            ]
            
            # Handle categorical features
            for col in ['time_horizon', 'learning_style']:
                if col in self.label_encoders and col in user_features:
                    try:
                        encoded_val = self.label_encoders[col].transform([user_features[col]])[0]
                        feature_vector.append(encoded_val)
                    except ValueError:
                        feature_vector.append(0)  # Unknown category
                else:
                    feature_vector.append(0)
            
            return self.scaler.transform([feature_vector])[0]
        except Exception as e:
            logger.error(f"Error preparing user features: {e}")
            return None

class NudgeOptimizationEngine:
    """
    A/B testing and nudge effectiveness optimization
    """
    
    def __init__(self):
        self.nudge_variants = {
            'motivational': [
                "You're doing great! Ready for your next lesson?",
                "Keep up the momentum! Your next lesson is waiting.",
                "You're on fire! 🔥 Continue your learning streak."
            ],
            'educational': [
                "Master {topic} with your next lesson on {content_title}.",
                "Expand your {risk_profile} investment knowledge with {content_title}.",
                "Learn {content_title} to achieve your {investment_goal} goals."
            ],
            'social': [
                "Join thousands of learners who completed {content_title}.",
                "You're in the top {percentile}% of learners! Keep going.",
                "Other {risk_profile} investors loved this lesson: {content_title}"
            ],
            'urgency': [
                "Don't lose your {streak_days}-day learning streak!",
                "Quick 15-minute lesson to maintain your progress.",
                "Your learning path is 85% complete - finish strong!"
            ]
        }
        
    async def optimize_nudge(self, user_profile: Dict, behavior_data: Dict, db_connection) -> Dict:
        """Generate optimized nudge based on A/B testing results"""
        try:
            # Get nudge effectiveness data
            effectiveness_data = await self._get_nudge_effectiveness(db_connection)
            
            # Determine best nudge type for user segment
            user_segment = self._get_user_segment(user_profile, behavior_data)
            best_nudge_type = self._get_best_nudge_type(user_segment, effectiveness_data)
            
            # Generate personalized nudge
            nudge_message = self._generate_personalized_nudge(
                best_nudge_type, user_profile, behavior_data
            )
            
            # Calculate confidence based on historical data
            confidence = self._calculate_nudge_confidence(best_nudge_type, user_segment, effectiveness_data)
            
            return {
                'message': nudge_message,
                'type': best_nudge_type,
                'confidence': confidence,
                'user_segment': user_segment,
                'variant_id': f"{best_nudge_type}_{hash(nudge_message) % 100}"
            }
            
        except Exception as e:
            logger.error(f"Error optimizing nudge: {e}")
            return {
                'message': "Continue your investment learning journey!",
                'type': 'motivational',
                'confidence': 0.5,
                'user_segment': 'default',
                'variant_id': 'default_001'
            }
    
    async def _get_nudge_effectiveness(self, db_connection) -> pd.DataFrame:
        """Get historical nudge effectiveness data"""
        query = """
            SELECT 
                nudge_type,
                user_response,
                effectiveness_score,
                nudge_data
            FROM nudge_logs
            WHERE delivered_at > NOW() - INTERVAL '30 days'
              AND user_response IS NOT NULL
        """
        
        rows = await db_connection.fetch(query)
        return pd.DataFrame([dict(row) for row in rows])
    
    def _get_user_segment(self, user_profile: Dict, behavior_data: Dict) -> str:
        """Segment user based on profile and behavior"""
        engagement = behavior_data.get('engagement_score', 0.5)
        completion_rate = behavior_data.get('completion_rate', 0.5)
        
        if engagement > 0.7 and completion_rate > 0.8:
            return 'high_performer'
        elif engagement < 0.3 or completion_rate < 0.3:
            return 'at_risk'
        elif behavior_data.get('learning_velocity', 0) > 2:
            return 'fast_learner'
        else:
            return 'steady_learner'
    
    def _get_best_nudge_type(self, user_segment: str, effectiveness_data: pd.DataFrame) -> str:
        """Determine best nudge type for user segment"""
        if effectiveness_data.empty:
            return 'motivational'
        
        # Segment-specific preferences
        segment_preferences = {
            'high_performer': 'social',
            'at_risk': 'motivational',
            'fast_learner': 'educational',
            'steady_learner': 'urgency'
        }
        
        return segment_preferences.get(user_segment, 'motivational')
    
    def _generate_personalized_nudge(self, nudge_type: str, user_profile: Dict, behavior_data: Dict) -> str:
        """Generate personalized nudge message"""
        templates = self.nudge_variants.get(nudge_type, self.nudge_variants['motivational'])
        
        # Select template based on user characteristics
        template_idx = hash(user_profile.get('user_id', '')) % len(templates)
        template = templates[template_idx]
        
        # Personalize template
        personalization_data = {
            'topic': user_profile.get('preferred_topics', ['investing'])[0] if user_profile.get('preferred_topics') else 'investing',
            'risk_profile': user_profile.get('risk_profile', 'moderate'),
            'investment_goal': user_profile.get('investment_goals', ['wealth building'])[0] if user_profile.get('investment_goals') else 'wealth building',
            'streak_days': behavior_data.get('current_streak', 1),
            'percentile': min(90, max(10, int(behavior_data.get('engagement_score', 0.5) * 100))),
            'content_title': 'Investment Fundamentals'  # Would be dynamic in real implementation
        }
        
        try:
            return template.format(**personalization_data)
        except KeyError:
            return template
    
    def _calculate_nudge_confidence(self, nudge_type: str, user_segment: str, effectiveness_data: pd.DataFrame) -> float:
        """Calculate confidence in nudge effectiveness"""
        if effectiveness_data.empty:
            return 0.5
        
        # Filter data for this nudge type
        type_data = effectiveness_data[effectiveness_data['nudge_type'] == nudge_type]
        
        if type_data.empty:
            return 0.5
        
        # Calculate average effectiveness
        avg_effectiveness = type_data['effectiveness_score'].mean()
        sample_size = len(type_data)
        
        # Adjust confidence based on sample size
        confidence = avg_effectiveness * min(1.0, sample_size / 50.0)
        
        return float(confidence)

class AdvancedAIOrchestrator:
    """
    Main orchestrator for advanced AI features
    """
    
    def __init__(self):
        self.collaborative_engine = CollaborativeFilteringEngine()
        self.content_engine = ContentBasedEngine()
        self.behavioral_engine = BehavioralAnalyticsEngine()
        self.nudge_engine = NudgeOptimizationEngine()
        self.last_model_update = None
        
    async def initialize(self, db_connection):
        """Initialize all AI engines"""
        try:
            logger.info("Initializing advanced AI engines...")
            
            # Build collaborative filtering data
            await self.collaborative_engine.build_user_item_matrix(db_connection)
            
            # Build content features
            await self.content_engine.build_content_features(db_connection)
            
            # Train behavioral models
            await self.behavioral_engine.train_models(db_connection)
            
            self.last_model_update = datetime.now()
            logger.info("Advanced AI engines initialized successfully")
            
        except Exception as e:
            logger.error(f"Error initializing AI engines: {e}")
    
    async def get_advanced_recommendations(self, user_id: str, user_profile: Dict, behavior_data: Dict, db_connection) -> Dict:
        """Get advanced AI recommendations combining all engines"""
        try:
            # Get collaborative filtering recommendations
            cf_recs = self.collaborative_engine.get_user_recommendations(user_id, top_k=3)
            
            # Get content-based recommendations
            completed_content = behavior_data.get('completed_content_ids', [])
            cb_recs = self.content_engine.get_content_recommendations(user_profile, completed_content, top_k=3)
            
            # Predict user behavior
            engagement_pred = self.behavioral_engine.predict_engagement(behavior_data)
            completion_pred = self.behavioral_engine.predict_completion_probability(behavior_data)
            churn_risk = self.behavioral_engine.predict_churn_risk(behavior_data)
            
            # Optimize nudge
            optimized_nudge = await self.nudge_engine.optimize_nudge(user_profile, behavior_data, db_connection)
            
            # Combine recommendations with hybrid approach
            hybrid_recs = self._combine_recommendations(cf_recs, cb_recs, engagement_pred)
            
            return {
                'recommendations': hybrid_recs,
                'predictions': {
                    'engagement': engagement_pred,
                    'completion_probability': completion_pred,
                    'churn_risk': churn_risk
                },
                'optimized_nudge': optimized_nudge,
                'confidence_score': self._calculate_overall_confidence(cf_recs, cb_recs, engagement_pred)
            }
            
        except Exception as e:
            logger.error(f"Error getting advanced recommendations: {e}")
            return {
                'recommendations': [],
                'predictions': {'engagement': 0.5, 'completion_probability': 0.5, 'churn_risk': 0.5},
                'optimized_nudge': {'message': 'Continue learning!', 'type': 'motivational', 'confidence': 0.5},
                'confidence_score': 0.3
            }
    
    def _combine_recommendations(self, cf_recs: List, cb_recs: List, engagement_score: float) -> List:
        """Combine collaborative and content-based recommendations"""
        combined = {}
        
        # Weight collaborative filtering recommendations
        cf_weight = 0.6 if engagement_score > 0.5 else 0.4
        for content_id, score in cf_recs:
            combined[content_id] = score * cf_weight
        
        # Weight content-based recommendations
        cb_weight = 1.0 - cf_weight
        for content_id, score in cb_recs:
            if content_id in combined:
                combined[content_id] += score * cb_weight
            else:
                combined[content_id] = score * cb_weight
        
        # Sort and return top recommendations
        sorted_recs = sorted(combined.items(), key=lambda x: x[1], reverse=True)
        return sorted_recs[:5]
    
    def _calculate_overall_confidence(self, cf_recs: List, cb_recs: List, engagement_score: float) -> float:
        """Calculate overall confidence in recommendations"""
        base_confidence = 0.3
        
        # Boost confidence based on available recommendations
        if cf_recs:
            base_confidence += 0.2
        if cb_recs:
            base_confidence += 0.2
        
        # Adjust based on engagement
        engagement_boost = engagement_score * 0.3
        
        return min(1.0, base_confidence + engagement_boost)
    
    async def should_retrain_models(self, db_connection) -> bool:
        """Check if models should be retrained"""
        if self.last_model_update is None:
            return True
        
        # Retrain weekly
        if datetime.now() - self.last_model_update > timedelta(days=7):
            return True
        
        # Check for significant new data
        query = """
            SELECT COUNT(*) as new_interactions
            FROM user_learning_progress
            WHERE completed_at > $1
        """
        
        result = await db_connection.fetchrow(query, self.last_model_update)
        new_interactions = result['new_interactions'] if result else 0
        
        # Retrain if significant new data (>100 new interactions)
        return new_interactions > 100
