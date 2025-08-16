from ..src.bias_detector import BiasDetector

def test_detect_bias_no_bias():
    """
    Test case for when user behavior data shows no discernible biases.
    """
    # This mock data is designed to not trigger any of the simple, rule-based biases.
    mock_data = {
        "user_id": "user_no_bias",
        "trades": [
            {"symbol": "MSFT", "action": "buy", "quantity": 5, "price": 300, "timestamp": "2023-10-01T10:00:00Z"},
        ],
        "portfolio_turnover": 0.1,
        "risk_profile_changes": 0,
        "news_sentiment": {}
    }
    detector = BiasDetector()
    biases = detector.detect(mock_data)
    assert biases == []
