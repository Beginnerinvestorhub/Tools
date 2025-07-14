from src.bias_detector import detect_bias

def test_detect_bias_no_bias():
    result = detect_bias("This is a neutral statement.")
    assert result == []
