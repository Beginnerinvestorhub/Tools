from src.risk_assessment_engine import RiskAssessmentEngine, RiskFactors

def test_basic_risk_score():
    engine = RiskAssessmentEngine()
    factors = RiskFactors(income=100000, expenses=50000)
    score = engine.calculate_risk_score(factors)
    assert isinstance(score, float)
