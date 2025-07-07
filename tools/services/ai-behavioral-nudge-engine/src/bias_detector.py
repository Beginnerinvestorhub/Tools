# services/ai-behavioral-nudge-engine/src/bias_detector.py
from typing import Dict, Any, List

class BiasDetector:
    """
    Analyzes user financial behavior data to detect common cognitive biases.
    This is a simplified rule-based detection for demonstration.
    A real system might use ML models for more sophisticated detection.
    """
    def __init__(self):
        pass

    def detect_biases(self, user_data: Dict[str, Any]) -> List[str]:
        """
        Detects behavioral biases based on provided user data.

        Args:
            user_data (Dict[str, Any]): A dictionary of user financial data.

        Returns:
            List[str]: A list of detected behavioral biases.
        """
        detected_biases = []

        if not user_data:
            return detected_biases

        # Overconfidence Bias: High investment experience + frequent decisions + recent losses ignored
        if user_data.get("investment_experience_years", 0) > 3 and \
           user_data.get("decision_frequency_per_month", 0) > 2 and \
           user_data.get("recent_portfolio_change_percentage", 0) < -10 and \
           user_data.get("risk_assessment_score", 0) > 70: # High score suggests aggressive
            detected_biases.append("Overconfidence Bias")

        # Loss Aversion: Significant recent loss + tendency to make impulsive trades
        if user_data.get("recent_portfolio_change_percentage", 0) < -10 and \
           user_data.get("recent_impulsive_trades", 0) > 0:
            detected_biases.append("Loss Aversion")

        # Status Quo Bias: Low decision frequency and lack of emergency fund (indicating inaction)
        if user_data.get("decision_frequency_per_month", 0) < 1 and \
           user_data.get("has_emergency_fund") == False:
            detected_biases.append("Status Quo Bias")

        # Confirmation Bias: Relying on limited news sources, especially if they reinforce existing beliefs
        if len(user_data.get("news_consumption_sources", [])) <= 1:
             # This is a very simplistic check, needs more context in real world
            detected_biases.append("Confirmation Bias")

        print(f"Detected biases for user {user_data.get('user_id')}: {detected_biases}")
        return detected_biases

# Export an instance
bias_detector = BiasDetector()

