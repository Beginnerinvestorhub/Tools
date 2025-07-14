import pytest
from src.data_processor import DataProcessor, ProcessingConfig

def test_remove_duplicates():
    processor = DataProcessor(ProcessingConfig(remove_duplicates=True))
    data = [{'id': 1}, {'id': 1}, {'id': 2}]
    result = processor.remove_duplicates(data)
    assert len(result) == 2
