# services/ai-behavioral-nudge-engine/src/data_collector.py
from typing import Dict, Any, Optional

class DataCollector:
    """
    Simulates collecting and structuring user financial behavior data.
    In a real application, this would interact with databases,
    event streams, or other services.
    """
    def __init__(self):
        # Initialize any data sources or connections here
        pass

    def collect_user_financial_data(self, user_id: str) -> Optional[Dict[str, Any]]:
        """
        Simulates fetching financial behavior data for a given user.
        This data would be used to detect biases.

        Args:
            user_id (str): The ID of the user.

        Returns:
            Optional[Dict[str, Any]]: A dictionary of user financial data,
                                      or None if not found/collected.
        """
        print(f"Collecting data for user: {user_id}")
        # Mock data based on common financial behaviors
        # In a real scenario, this would come from a database, CRM, etc.
        if user_id == "user123":
            return {
                "user_id": user_id,
                "investment_experience_years": 5,
                "recent_portfolio_change_percentage": -15, # Negative for a loss
                "decision_frequency_per_month": 3,
                "risk_assessment_score": 75, # From your risk assessment service
                "news_consumption_sources": ["financial_news_site_A", "social_media_B"],
                "has_emergency_fund": False,
                "debt_to_income_ratio": 0.4,
                "recent_impulsive_trades": 2
            }
        elif user_id == "user456":
            return {
                "user_id": user_id,
                "investment_experience_years": 1,
                "recent_portfolio_change_percentage": 5,
                "decision_frequency_per_month": 1,
                "risk_assessment_score": 50,
                "news_consumption_sources": ["financial_news_site_C"],
                "has_emergency_fund": True,
                "debt_to_income_ratio": 0.2,
                "recent_impulsive_trades": 0
            }
        return None

# Export an instance for easier import in other modules
data_collector = DataCollector()

