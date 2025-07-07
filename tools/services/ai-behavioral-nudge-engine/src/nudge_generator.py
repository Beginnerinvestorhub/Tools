# services/ai-behavioral-nudge-engine/src/nudge_generator.py
from typing import List, Dict, Any, Optional
import random

class NudgeGenerator:
    """
    Generates tailored behavioral nudges based on detected biases.
    This uses a rule-based approach. A more advanced system might
    use ML models to learn effective nudges.
    """
    def __init__(self):
        # Define a mapping from bias to potential nudges
        self.nudge_templates = {
            "Overconfidence Bias": [
                "Consider conducting a 'pre-mortem' for your next investment decision. What could go wrong?",
                "Seek out dissenting opinions or data that challenges your investment thesis before acting.",
                "Review your past investment decisions, especially those that didn't go as planned, to learn from them."
            ],
            "Loss Aversion": [
                "Remember that past performance does not guarantee future results. Focus on your long-term goals.",
                "Consider rebalancing your portfolio according to your original plan, even after market drops.",
                "It's often wiser to focus on what you can gain by sticking to your strategy, rather than reacting to short-term losses."
            ],
            "Status Quo Bias": [
                "Even small, consistent steps can lead to significant financial progress. What's one small change you can make today?",
                "Automate your savings or investments to overcome inertia. Set it and forget it!",
                "Review your financial plan regularly. Are there areas you've been avoiding that need attention?"
            ],
            "Confirmation Bias": [
                "Diversify your information sources. Read analyses from different perspectives.",
                "Before making a decision, list three reasons why your chosen investment might fail.",
                "Actively seek out information that contradicts your current beliefs."
            ],
            # Add more biases and corresponding nudges
        }

        # General nudges if no specific bias is detected, or as supplementary
        self.general_nudges = [
            "Review your emergency fund. It's crucial for financial stability.",
            "Consider setting up automated contributions to your investment accounts.",
            "Ensure your investment portfolio aligns with your long-term financial goals."
        ]

    def generate_nudge(self, detected_biases: List[str], user_data: Dict[str, Any]) -> Optional[str]:
        """
        Generates a specific behavioral nudge for the user based on detected biases.

        Args:
            detected_biases (List[str]): A list of biases detected for the user.
            user_data (Dict[str, Any]): The user's financial data.

        Returns:
            Optional[str]: A generated nudge message, or None if no specific nudge can be found.
        """
        if not detected_biases:
            # If no specific biases, provide a general financial health nudge
            return random.choice(self.general_nudges)

        # Prioritize a nudge based on the first detected bias (can be refined)
        for bias in detected_biases:
            if bias in self.nudge_templates:
                return random.choice(self.nudge_templates[bias])

        # Fallback to general nudge if no specific template found for detected biases
        return random.choice(self.general_nudges)

# Export an instance
nudge_generator = NudgeGenerator()

