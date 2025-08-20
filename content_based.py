"""
Content-Based Recommendation Engine
Provides investment recommendations based on asset characteristics and user preferences
"""

import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from typing import Dict, List, Optional

class ContentBasedEngine:
    def __init__(self):
        self.asset_features = {}
        self.feature_matrix = None
        self.tfidf_vectorizer = TfidfVectorizer(max_features=1000, stop_words='english')
        
    def add_asset_features(self, asset_id: str, features: Dict) -> None:
        """Add or update asset features"""
        self.asset_features[asset_id] = features
        
    def build_feature_matrix(self) -> np.ndarray:
        """Build feature matrix from asset characteristics"""
        if not self.asset_features:
            return np.array([])
            
        assets = list(self.asset_features.keys())
        feature_vectors = []
        
        for asset_id in assets:
            features = self.asset_features[asset_id]
            
            # Combine text features
            text_features = []
            if 'sector' in features:
                text_features.append(features['sector'])
            if 'description' in features:
                text_features.append(features['description'])
            if 'tags' in features:
                text_features.extend(features['tags'])
                
            combined_text = ' '.join(text_features)
            
            # Numerical features
            numerical_features = [
                features.get('risk_score', 0.5),
                features.get('expected_return', 0.0),
                features.get('volatility', 0.0),
                features.get('market_cap', 0.0),
                features.get('pe_ratio', 0.0)
            ]
            
            feature_vectors.append({
                'asset_id': asset_id,
                'text': combined_text,
                'numerical': numerical_features
            })
        
        # Create TF-IDF matrix for text features
        texts = [fv['text'] for fv in feature_vectors]
        tfidf_matrix = self.tfidf_vectorizer.fit_transform(texts)
        
        # Combine with numerical features
        numerical_matrix = np.array([fv['numerical'] for fv in feature_vectors])
        
        # Normalize numerical features
        if numerical_matrix.shape[0] > 0:
            numerical_matrix = (numerical_matrix - numerical_matrix.mean(axis=0)) / (numerical_matrix.std(axis=0) + 1e-8)
        
        # Combine text and numerical features
        self.feature_matrix = np.hstack([tfidf_matrix.toarray(), numerical_matrix])
        self.asset_index = {asset: i for i, asset in enumerate(assets)}
        
        return self.feature_matrix
    
    def get_similar_assets(self, asset_id: str, n_similar: int = 10) -> List[Tuple[str, float]]:
        """Find assets similar to the given asset"""
        if asset_id not in self.asset_index or self.feature_matrix is None:
            return []
            
        asset_idx = self.asset_index[asset_id]
        asset_vector = self.feature_matrix[asset_idx].reshape(1, -1)
        
        similarities = cosine_similarity(asset_vector, self.feature_matrix)[0]
        similar_indices = np.argsort(similarities)[::-1][1:n_similar+1]  # Exclude self
        
        similar_assets = []
        for idx in similar_indices:
            asset_name = list(self.asset_index.keys())[idx]
            similarity_score = similarities[idx]
            similar_assets.append((asset_name, similarity_score))
            
        return similar_assets
    
    def recommend_for_user_profile(self, user_profile: Dict, n_recommendations: int = 10) -> List[Dict]:
        """Recommend assets based on user profile preferences"""
        if self.feature_matrix is None:
            return []
            
        # Create user preference vector
        user_risk_tolerance = user_profile.get('risk_tolerance', 0.5)
        preferred_sectors = user_profile.get('preferred_sectors', [])
        investment_goals = user_profile.get('investment_goals', [])
        
        recommendations = []
        
        for asset_id, features in self.asset_features.items():
            score = 0.0
            
            # Risk alignment
            asset_risk = features.get('risk_score', 0.5)
            risk_alignment = 1.0 - abs(user_risk_tolerance - asset_risk)
            score += risk_alignment * 0.4
            
            # Sector preference
            if features.get('sector') in preferred_sectors:
                score += 0.3
                
            # Goal alignment
            asset_type = features.get('asset_type', '')
            if asset_type in investment_goals:
                score += 0.3
                
            recommendations.append({
                'asset_id': asset_id,
                'recommendation_score': score,
                'reason': f"Matches your risk tolerance and preferences",
                'asset_features': features
            })
        
        # Sort by score and return top recommendations
        recommendations.sort(key=lambda x: x['recommendation_score'], reverse=True)
        return recommendations[:n_recommendations]