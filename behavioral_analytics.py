"""
Behavioral Analytics Module for Investment Platform
Tracks user behavior patterns and provides insights for nudge optimization
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
import json

class BehavioralAnalytics:
    def __init__(self):
        self.user_sessions = {}
        self.interaction_patterns = {}
        
    def track_user_action(self, user_id: str, action: str, context: Dict) -> None:
        """Track user actions for behavioral analysis"""
        timestamp = datetime.now()
        
        if user_id not in self.user_sessions:
            self.user_sessions[user_id] = []
            
        self.user_sessions[user_id].append({
            'timestamp': timestamp,
            'action': action,
            'context': context
        })
    
    def analyze_risk_tolerance_patterns(self, user_id: str) -> Dict:
        """Analyze user's risk tolerance based on behavior"""
        if user_id not in self.user_sessions:
            return {'risk_score': 0.5, 'confidence': 0.0}
            
        sessions = self.user_sessions[user_id]
        risk_indicators = []
        
        for session in sessions:
            if session['action'] == 'portfolio_simulation':
                risk_level = session['context'].get('risk_level', 0.5)
                risk_indicators.append(risk_level)
            elif session['action'] == 'risk_assessment_completed':
                risk_score = session['context'].get('risk_score', 0.5)
                risk_indicators.append(risk_score)
                
        if not risk_indicators:
            return {'risk_score': 0.5, 'confidence': 0.0}
            
        avg_risk = np.mean(risk_indicators)
        confidence = min(len(risk_indicators) / 10.0, 1.0)
        
        return {
            'risk_score': avg_risk,
            'confidence': confidence,
            'data_points': len(risk_indicators)
        }
    
    def get_engagement_metrics(self, user_id: str, days: int = 30) -> Dict:
        """Calculate user engagement metrics"""
        if user_id not in self.user_sessions:
            return {'engagement_score': 0.0, 'session_count': 0}
            
        cutoff_date = datetime.now() - timedelta(days=days)
        recent_sessions = [
            s for s in self.user_sessions[user_id] 
            if s['timestamp'] > cutoff_date
        ]
        
        session_count = len(recent_sessions)
        unique_days = len(set(s['timestamp'].date() for s in recent_sessions))
        
        engagement_score = min(unique_days / days, 1.0) * 0.7 + min(session_count / 50, 1.0) * 0.3
        
        return {
            'engagement_score': engagement_score,
            'session_count': session_count,
            'unique_active_days': unique_days,
            'avg_sessions_per_day': session_count / max(unique_days, 1)
        }
    
    def predict_churn_risk(self, user_id: str) -> float:
        """Predict likelihood of user churn"""
        if user_id not in self.user_sessions:
            return 1.0
            
        last_session = max(self.user_sessions[user_id], key=lambda x: x['timestamp'])
        days_since_last = (datetime.now() - last_session['timestamp']).days
        
        # Simple churn prediction based on recency
        if days_since_last > 30:
            return 0.9
        elif days_since_last > 14:
            return 0.6
        elif days_since_last > 7:
            return 0.3
        else:
            return 0.1