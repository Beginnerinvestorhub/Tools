"""
Collaborative Filtering Recommendation Engine
Provides investment recommendations based on user similarity patterns
"""

import numpy as np
import pandas as pd
from sklearn.metrics.pairwise import cosine_similarity
from typing import Dict, List, Tuple, Optional

class CollaborativeFilteringEngine:
    def __init__(self):
        self.user_item_matrix = None
        self.user_similarity_matrix = None
        self.item_similarity_matrix = None
        
    def build_user_item_matrix(self, interactions: List[Dict]) -> np.ndarray:
        """Build user-item interaction matrix from user data"""
        users = list(set([interaction['user_id'] for interaction in interactions]))
        items = list(set([interaction['item_id'] for interaction in interactions]))
        
        matrix = np.zeros((len(users), len(items)))
        user_idx = {user: i for i, user in enumerate(users)}
        item_idx = {item: i for i, item in enumerate(items)}
        
        for interaction in interactions:
            u_idx = user_idx[interaction['user_id']]
            i_idx = item_idx[interaction['item_id']]
            matrix[u_idx][i_idx] = interaction.get('rating', 1.0)
            
        self.user_item_matrix = matrix
        self.user_index = user_idx
        self.item_index = item_idx
        return matrix
    
    def calculate_user_similarity(self) -> np.ndarray:
        """Calculate cosine similarity between users"""
        if self.user_item_matrix is None:
            raise ValueError("User-item matrix not built yet")
            
        self.user_similarity_matrix = cosine_similarity(self.user_item_matrix)
        return self.user_similarity_matrix
    
    def get_user_recommendations(self, user_id: str, n_recommendations: int = 10) -> List[Tuple[str, float]]:
        """Get recommendations for a user based on similar users"""
        if user_id not in self.user_index:
            return []
            
        user_idx = self.user_index[user_id]
        user_similarities = self.user_similarity_matrix[user_idx]
        
        # Find most similar users
        similar_users = np.argsort(user_similarities)[::-1][1:6]  # Top 5 similar users
        
        recommendations = {}
        user_items = set(np.where(self.user_item_matrix[user_idx] > 0)[0])
        
        for similar_user_idx in similar_users:
            similarity_score = user_similarities[similar_user_idx]
            similar_user_items = np.where(self.user_item_matrix[similar_user_idx] > 0)[0]
            
            for item_idx in similar_user_items:
                if item_idx not in user_items:  # User hasn't interacted with this item
                    item_id = list(self.item_index.keys())[list(self.item_index.values()).index(item_idx)]
                    if item_id not in recommendations:
                        recommendations[item_id] = 0
                    recommendations[item_id] += similarity_score
        
        # Sort and return top recommendations
        sorted_recs = sorted(recommendations.items(), key=lambda x: x[1], reverse=True)
        return sorted_recs[:n_recommendations]
    
    def get_investment_recommendations(self, user_id: str, portfolio_data: Dict) -> List[Dict]:
        """Get investment recommendations based on collaborative filtering"""
        base_recs = self.get_user_recommendations(user_id)
        
        recommendations = []
        for item_id, score in base_recs:
            recommendations.append({
                'investment_id': item_id,
                'recommendation_score': score,
                'reason': 'Users with similar profiles also invested in this',
                'confidence': min(score, 1.0)
            })
            
        return recommendations