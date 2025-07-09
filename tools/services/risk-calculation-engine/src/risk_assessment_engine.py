
class RiskAssessmentEngine:
    """
    A class to assess investment risk based on various financial and behavioral factors.
    """

    def __init__(self):
        """
        Initializes the RiskAssessmentEngine with default scoring weights.
        These weights can be adjusted to fine-tune the risk calculation.
        """
        # Weights for each factor in the risk calculation
        # Higher weight means a greater impact on the final risk score
        self.weights = {
            "time_horizon": 0.4,       # Longer time horizon generally means higher risk tolerance
            "risk_tolerance": 0.3,     # Direct measure of willingness to take risk
            "investment_knowledge": 0.2, # More knowledge might allow for more complex (and potentially riskier) investments
            "financial_stability": 0.1 # Higher stability reduces the impact of potential losses
        }

        # Mapping of numerical risk score to descriptive risk levels
        self.risk_levels = {
            (0, 30): "Conservative",
            (31, 60): "Moderate",
            (61, 85): "Growth-Oriented",
            (86, 100): "Aggressive"
        }

        # Basic recommendations based on risk level
        self.recommendations = {
            "Conservative": "Focus on capital preservation with low-volatility assets like bonds and money market funds. Prioritize stable returns over high growth.",
            "Moderate": "A balanced approach with a mix of equities and fixed income. Aim for steady growth while managing risk.",
            "Growth-Oriented": "Higher allocation to equities, including growth stocks and diversified ETFs. Prepared for market fluctuations for long-term capital appreciation.",
            "Aggressive": "Primarily invests in high-growth stocks, emerging markets, and potentially alternative investments. High potential for returns, but also higher risk of capital loss."
        }

    def _map_inputs_to_score(self, time_horizon: int, risk_tolerance: int, investment_knowledge: int, financial_stability: int) -> dict:
        """
        Maps raw input values to a standardized scoring scale (e.g., 0-100)
        before applying weights. This ensures all factors contribute comparably.

        Args:
            time_horizon (int): Investment time horizon in years (e.g., 1-30).
            risk_tolerance (int): User's self-assessed risk tolerance (e.g., 1-5).
            investment_knowledge (int): User's investment knowledge level (e.g., 1-5).
            financial_stability (int): User's financial stability (e.g., 1-5).

        Returns:
            dict: A dictionary of mapped scores for each input.
        """
        # Example mapping logic. These ranges and transformations can be customized.
        # For time_horizon: longer time means higher score (more risk capacity)
        # Max 100, assuming max 30-year horizon -> 90. Can adjust scale if needed.
        mapped_time_horizon = min(time_horizon * 3, 100)

        # For risk_tolerance: higher tolerance means higher score
        mapped_risk_tolerance = risk_tolerance * 20 # Map 1-5 to 20-100

        # For investment_knowledge: higher knowledge means higher score (more comfortable with risk)
        mapped_investment_knowledge = investment_knowledge * 20

        # For financial_stability: higher stability means higher score (can absorb more risk)
        mapped_financial_stability = financial_stability * 20

        return {
            "time_horizon": mapped_time_horizon,
            "risk_tolerance": mapped_risk_tolerance,
            "investment_knowledge": mapped_investment_knowledge,
            "financial_stability": mapped_financial_stability
        }

    def calculate_risk_score(self, time_horizon: int, risk_tolerance: int, investment_knowledge: int, financial_stability: int) -> dict:
        """
        Calculates the overall investment risk score based on provided inputs.

        Args:
            time_horizon (int): The number of years the investment is planned to be held.
                                (e.g., 1-5 years, 6-10 years, 10+ years - represented as a numerical value)
            risk_tolerance (int): An indicator of the investor's willingness to take risk.
                                  (e.g., 1=Very Low, 2=Low, 3=Medium, 4=High, 5=Very High)
            investment_knowledge (int): An indicator of the investor's understanding of investments.
                                        (e.g., 1=Novice, 2=Basic, 3=Intermediate, 4=Advanced, 5=Expert)
            financial_stability (int): An indicator of the investor's financial security.
                                       (e.g., 1=Very Low, 2=Low, 3=Medium, 4=High, 5=Very High)

        Returns:
            dict: A dictionary containing the calculated 'risk_score', 'risk_level', and 'recommendation'.
        """
        if not all(isinstance(arg, int) for arg in [time_horizon, risk_tolerance, investment_knowledge, financial_stability]):
            raise ValueError("All input parameters must be integers.")
        
        # Basic input validation based on expected ranges
        if not (1 <= time_horizon <= 30): # Assuming max 30 years for now
            raise ValueError("Time horizon must be between 1 and 30 years.")
        if not (1 <= risk_tolerance <= 5):
            raise ValueError("Risk tolerance must be an integer between 1 and 5.")
        if not (1 <= investment_knowledge <= 5):
            raise ValueError("Investment knowledge must be an integer between 1 and 5.")
        if not (1 <= financial_stability <= 5):
            raise ValueError("Financial stability must be an integer between 1 and 5.")

        # Map raw inputs to standardized scores
        mapped_scores = self._map_inputs_to_score(time_horizon, risk_tolerance, investment_knowledge, financial_stability)

        # Calculate the weighted sum
        weighted_sum = (
            mapped_scores["time_horizon"] * self.weights["time_horizon"] +
            mapped_scores["risk_tolerance"] * self.weights["risk_tolerance"] +
            mapped_scores["investment_knowledge"] * self.weights["investment_knowledge"] +
            mapped_scores["financial_stability"] * self.weights["financial_stability"]
        )

        # Normalize the score to be between 0 and 100
        # The maximum possible sum if all mapped scores are 100
        max_possible_score = sum(self.weights.values()) * 100
        risk_score = round((weighted_sum / max_possible_score) * 100)

        # Ensure the score is within 0-100 range
        risk_score = max(0, min(100, risk_score))

        # Determine risk level
        risk_level = "Unknown"
        for score_range, level in self.risk_levels.items():
            if score_range[0] <= risk_score <= score_range[1]:
                risk_level = level
                break
        
        recommendation = self.recommendations.get(risk_level, "No specific recommendation available for this risk level.")

        return {
            "risk_score": risk_score,
            "risk_level": risk_level,
            "recommendation": recommendation
        }

if __name__ == "__main__":
    # Example Usage:
    engine = RiskAssessmentEngine()

    # Scenario 1: Aggressive Investor
    print("Scenario 1: Aggressive Investor")
    risk_profile_1 = engine.calculate_risk_score(
        time_horizon=20,          # Long time horizon
        risk_tolerance=5,         # Very high risk tolerance
        investment_knowledge=5,   # Expert knowledge
        financial_stability=5     # Very high financial stability
    )
    print(risk_profile_1)
    print("-" * 30)

    # Scenario 2: Conservative Investor
    print("Scenario 2: Conservative Investor")
    risk_profile_2 = engine.calculate_risk_score(
        time_horizon=3,           # Short time horizon
        risk_tolerance=1,         # Very low risk tolerance
        investment_knowledge=1,   # Novice knowledge
        financial_stability=2     # Low financial stability
    )
    print(risk_profile_2)
    print("-" * 30)

    # Scenario 3: Moderate Investor
    print("Scenario 3: Moderate Investor")
    risk_profile_3 = engine.calculate_risk_score(
        time_horizon=10,          # Medium time horizon
        risk_tolerance=3,         # Medium risk tolerance
        investment_knowledge=3,   # Intermediate knowledge
        financial_stability=4     # High financial stability
    )
    print(risk_profile_3)
    print("-" * 30)

    # Scenario 4: Testing Edge Cases / Invalid Input
    try:
        print("Scenario 4: Invalid Time Horizon")
        engine.calculate_risk_score(
            time_horizon=0, # Invalid
            risk_tolerance=3,
            investment_knowledge=3,
            financial_stability=3
        )
    except ValueError as e:
        print(f"Error: {e}")
    print("-" * 30)

    try:
        print("Scenario 5: Invalid Risk Tolerance Type")
        engine.calculate_risk_score(
            time_horizon=10,
            risk_tolerance="high", # Invalid
            investment_knowledge=3,
            financial_stability=3
        )
    except ValueError as e:
        print(f"Error: {e}")
    print("-" * 30)

