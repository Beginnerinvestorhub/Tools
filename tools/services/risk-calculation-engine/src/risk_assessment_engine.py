from dataclasses import dataclass
from typing import TypedDict, Dict


class RiskProfile(TypedDict):
    risk_score: int
    risk_level: str
    recommendation: str
    debug: Dict[str, int]  # Optional diagnostics


class RiskAssessmentEngine:
    """
    A class to assess investment risk based on various financial and behavioral factors.
    """

    def __init__(self, custom_weights: dict = None):
        """
        Initializes the RiskAssessmentEngine with default or custom scoring weights.
        These weights can be adjusted to fine-tune the risk calculation.
        """
        self.weights = custom_weights or {
            "time_horizon": 0.4,
            "risk_tolerance": 0.3,
            "investment_knowledge": 0.2,
            "financial_stability": 0.1
        }

        # Ordered mapping of numerical risk score to descriptive risk levels
        self.risk_levels = [
            (0, 30, "Conservative"),
            (31, 60, "Moderate"),
            (61, 85, "Growth-Oriented"),
            (86, 100, "Aggressive")
        ]

        self.recommendations = {
            "Conservative": "Focus on capital preservation with low-volatility assets like bonds and money market funds. Prioritize stable returns over high growth.",
            "Moderate": "A balanced approach with a mix of equities and fixed income. Aim for steady growth while managing risk.",
            "Growth-Oriented": "Higher allocation to equities, including growth stocks and diversified ETFs. Prepared for market fluctuations for long-term capital appreciation.",
            "Aggressive": "Primarily invests in high-growth stocks, emerging markets, and potentially alternative investments. High potential for returns, but also higher risk of capital loss."
        }

    def _scale(self, value: int, in_max: int = 5, out_max: int = 100) -> int:
        return min(round((value / in_max) * out_max), out_max)

    def _map_inputs_to_score(self, time_horizon: int, risk_tolerance: int,
                              investment_knowledge: int, financial_stability: int) -> dict:
        """
        Maps raw input values to a standardized scoring scale (0-100).
        """
        mapped_scores = {
            "time_horizon": min(time_horizon * 3, 100),  # Max out at 30 years
            "risk_tolerance": self._scale(risk_tolerance),
            "investment_knowledge": self._scale(investment_knowledge),
            "financial_stability": self._scale(financial_stability)
        }
        return mapped_scores

    def calculate_risk_score(self, time_horizon: int, risk_tolerance: int,
                              investment_knowledge: int, financial_stability: int,
                              debug: bool = False) -> RiskProfile:
        """
        Calculates the overall investment risk score.
        """
        if not all(isinstance(arg, int) for arg in [time_horizon, risk_tolerance, investment_knowledge, financial_stability]):
            raise ValueError("All input parameters must be integers.")

        if not (1 <= time_horizon <= 30):
            raise ValueError("Time horizon must be between 1 and 30 years.")
        if not (1 <= risk_tolerance <= 5):
            raise ValueError("Risk tolerance must be between 1 and 5.")
        if not (1 <= investment_knowledge <= 5):
            raise ValueError("Investment knowledge must be between 1 and 5.")
        if not (1 <= financial_stability <= 5):
            raise ValueError("Financial stability must be between 1 and 5.")

        mapped_scores = self._map_inputs_to_score(time_horizon, risk_tolerance,
                                                  investment_knowledge, financial_stability)

        weighted_sum = sum(
            mapped_scores[factor] * self.weights[factor] for factor in self.weights
        )

        max_possible_score = sum(self.weights.values()) * 100
        risk_score = round((weighted_sum / max_possible_score) * 100)
        risk_score = max(0, min(100, risk_score))

        risk_level = "Unknown"
        for low, high, label in self.risk_levels:
            if low <= risk_score <= high:
                risk_level = label
                break

        recommendation = self.recommendations.get(risk_level, "No specific recommendation available.")

        result = {
            "risk_score": risk_score,
            "risk_level": risk_level,
            "recommendation": recommendation,
            "debug": mapped_scores if debug else {}
        }

        return result


if __name__ == "__main__":
    engine = RiskAssessmentEngine()

    print("Scenario 1: Aggressive Investor")
    print(engine.calculate_risk_score(20, 5, 5, 5, debug=True))
    print("-" * 30)

    print("Scenario 2: Conservative Investor")
    print(engine.calculate_risk_score(3, 1, 1, 2, debug=True))
    print("-" * 30)

    print("Scenario 3: Moderate Investor")
    print(engine.calculate_risk_score(10, 3, 3, 4, debug=True))
    print("-" * 30)

    try:
        print("Scenario 4: Invalid Time Horizon")
        engine.calculate_risk_score(0, 3, 3, 3)
    except ValueError as e:
        print(f"Error: {e}")
    print("-" * 30)

    try:
        print("Scenario 5: Invalid Risk Tolerance Type")
        engine.calculate_risk_score(10, "high", 3, 3)  # Invalid type
    except ValueError as e:
        print(f"Error: {e}")
    print("-" * 30)
