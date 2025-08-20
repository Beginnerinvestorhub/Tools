"""
Nudge Optimization Engine
Optimizes behavioral nudges for investment decisions based on user psychology
"""

import numpy as np
from typing import Dict, List, Optional
from datetime import datetime, timedelta

class NudgeOptimizationEngine:
    def __init__(self):
        self.nudge_effectiveness = {}
        self.user_responses = {}
        
    def track_nudge_response(self, user_id: str, nudge_type: str, response: str, context: Dict) -> None:
        """Track user response to nudges for optimization"""
        if user_id not in self.user_responses:
            self.user_responses[user_id] = []
            
        self.user_responses[user_id].append({
            'timestamp': datetime.now(),
            'nudge_type': nudge_type,
            'response': response,  # 'positive', 'negative', 'ignored'
            'context': context
        })
        
    def calculate_nudge_effectiveness(self, nudge_type: str, user_segment: str = 'all') -> float:
        """Calculate effectiveness of a specific nudge type"""
        responses = []
        
        for user_id, user_responses in self.user_responses.items():
            for response in user_responses:
                if response['nudge_type'] == nudge_type:
                    if user_segment == 'all' or response['context'].get('user_segment') == user_segment:
                        responses.append(response['response'])
        
        if not responses:
            return 0.5  # Default effectiveness
            
        positive_responses = sum(1 for r in responses if r == 'positive')
        return positive_responses / len(responses)
    
    def optimize_nudge_timing(self, user_id: str) -> Dict:
        """Determine optimal timing for nudges based on user behavior"""
        if user_id not in self.user_responses:
            return {'optimal_hour': 14, 'optimal_day': 'Tuesday', 'confidence': 0.0}
            
        responses = self.user_responses[user_id]
        positive_responses = [r for r in responses if r['response'] == 'positive']
        
        if not positive_responses:
            return {'optimal_hour': 14, 'optimal_day': 'Tuesday', 'confidence': 0.0}
        
        # Analyze timing patterns
        hours = [r['timestamp'].hour for r in positive_responses]
        days = [r['timestamp'].strftime('%A') for r in positive_responses]
        
        optimal_hour = max(set(hours), key=hours.count) if hours else 14
        optimal_day = max(set(days), key=days.count) if days else 'Tuesday'
        
        confidence = len(positive_responses) / max(len(responses), 1)
        
        return {
            'optimal_hour': optimal_hour,
            'optimal_day': optimal_day,
            'confidence': min(confidence, 1.0)
        }
    
    def generate_personalized_nudge(self, user_id: str, context: Dict) -> Dict:
        """Generate a personalized nudge based on user history"""
        user_profile = context.get('user_profile', {})
        current_situation = context.get('situation', 'general')
        
        # Determine best nudge type based on effectiveness
        nudge_types = ['social_proof', 'loss_aversion', 'goal_reminder', 'education_prompt']
        best_nudge = max(nudge_types, key=lambda nt: self.calculate_nudge_effectiveness(nt))
        
        # Get optimal timing
        timing = self.optimize_nudge_timing(user_id)
        
        nudge_messages = {
            'social_proof': f"85% of investors with similar profiles have diversified their portfolio this month",
            'loss_aversion': f"You could be missing out on potential gains - review your portfolio allocation",
            'goal_reminder': f"You're {user_profile.get('goal_progress', 0)}% towards your investment goal",
            'education_prompt': f"Learn about {context.get('suggested_topic', 'portfolio diversification')} to improve your strategy"
        }
        
        return {
            'nudge_type': best_nudge,
            'message': nudge_messages.get(best_nudge, 'Consider reviewing your investment strategy'),
            'optimal_timing': timing,
            'effectiveness_score': self.calculate_nudge_effectiveness(best_nudge),
            'context': context
        }