#!/usr/bin/env python3
"""
Market Data Processing Service
Part of BeginnerInvestorHub - Market Data Ingestion Service

This module handles processing, validation, and transformation of market data
from various sources including APIs, CSV files, and real-time feeds.
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import json
import logging
import asyncio
from typing import Dict, List, Optional, Union, Any
from dataclasses import dataclass, asdict
from enum import Enum
import re
from decimal import Decimal, ROUND_HALF_UP

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('market_data_processor.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)


class DataSource(Enum):
    """Enumeration of supported data sources"""
    API = "api"
    CSV = "csv"
    JSON = "json"
    WEBSOCKET = "websocket"
    DATABASE = "database"


class MarketDataType(Enum):
    """Types of market data supported"""
    STOCK = "stock"
    CRYPTO = "crypto"
    FOREX = "forex"
    OPTIONS = "options"
    FUTURES = "futures"
    ETF = "etf"
    MUTUAL_FUND = "mutual_fund"


@dataclass
class MarketDataPoint:
    """Standardized market data point structure"""
    symbol: str
    timestamp: datetime
    open_price: float
    high_price: float
    low_price: float
    close_price: float
    volume: int
    market_cap: Optional[float] = None
    pe_ratio: Optional[float] = None
    dividend_yield: Optional[float] = None
    data_type: MarketDataType = MarketDataType.STOCK
    source: DataSource = DataSource.API
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary format"""
        return asdict(self)


@dataclass
class ProcessingConfig:
    """Configuration for data processing"""
    validate_data: bool = True
    remove_duplicates: bool = True
    handle_missing_values: str = "interpolate"  # interpolate, drop, fill_zero
    outlier_detection: bool = True
    outlier_threshold: float = 3.0  # Standard deviations
    time_zone: str = "UTC"
    decimal_precision: int = 4


class DataValidator:
    """Validates market data integrity and consistency"""
    
    @staticmethod
    def validate_price_data(data: Dict[str, Any]) -> bool:
        """Validate price data integrity"""
        try:
            # Check required fields
            required_fields = ['open', 'high', 'low', 'close', 'volume']
            for field in required_fields:
                if field not in data or data[field] is None:
                    logger.warning(f"Missing required field: {field}")
                    return False
            
            # Validate price relationships
            open_price = float(data['open'])
            high_price = float(data['high'])
            low_price = float(data['low'])
            close_price = float(data['close'])
            volume = int(data['volume'])
            
            # High should be >= all other prices
            if high_price < max(open_price, low_price, close_price):
                logger.warning("High price is less than other prices")
                return False
            
            # Low should be <= all other prices
            if low_price > min(open_price, high_price, close_price):
                logger.warning("Low price is greater than other prices")
                return False
            
            # Volume should be non-negative
            if volume < 0:
                logger.warning("Volume is negative")
                return False
            
            return True
            
        except (ValueError, TypeError) as e:
            logger.error(f"Data validation error: {e}")
            return False
    
    @staticmethod
    def validate_symbol(symbol: str) -> bool:
        """Validate symbol format"""
        if not symbol or not isinstance(symbol, str):
            return False
        
        # Basic symbol validation (alphanumeric, dots, hyphens)
        pattern = r'^[A-Za-z0-9\.\-]+$'
        return bool(re.match(pattern, symbol.strip()))
    
    @staticmethod
    def detect_outliers(values: List[float], threshold: float = 3.0) -> List[int]:
        """Detect outliers using z-score method"""
        if len(values) < 3:
            return []
        
        mean = np.mean(values)
        std = np.std(values)
        
        if std == 0:
            return []
        
        z_scores = [(x - mean) / std for x in values]
        outliers = [i for i, z in enumerate(z_scores) if abs(z) > threshold]
        
        return outliers


class DataProcessor:
    """Main data processing class for market data"""
    
    def __init__(self, config: ProcessingConfig = None):
        self.config = config or ProcessingConfig()
        self.validator = DataValidator()
        self.processed_count = 0
        self.error_count = 0
        
    def process_raw_data(self, raw_data: Union[Dict, List[Dict]], 
                        data_type: MarketDataType = MarketDataType.STOCK) -> List[MarketDataPoint]:
        """Process raw market data into standardized format"""
        try:
            if isinstance(raw_data, dict):
                raw_data = [raw_data]
            
            processed_data = []
            
            for item in raw_data:
                try:
                    processed_item = self._process_single_item(item, data_type)
                    if processed_item:
                        processed_data.append(processed_item)
                        self.processed_count += 1
                except Exception as e:
                    logger.error(f"Error processing item: {e}")
                    self.error_count += 1
                    continue
            
            if self.config.remove_duplicates:
                processed_data = self._remove_duplicates(processed_data)
            
            logger.info(f"Processed {len(processed_data)} items successfully")
            return processed_data
            
        except Exception as e:
            logger.error(f"Error in process_raw_data: {e}")
            return []
    
    def _process_single_item(self, item: Dict, data_type: MarketDataType) -> Optional[MarketDataPoint]:
        """Process a single market data item"""
        try:
            # Validate data if enabled
            if self.config.validate_data and not self.validator.validate_price_data(item):
                return None
            
            # Extract and normalize data
            symbol = self._extract_symbol(item)
            if not self.validator.validate_symbol(symbol):
                logger.warning(f"Invalid symbol: {symbol}")
                return None
            
            timestamp = self._extract_timestamp(item)
            
            # Extract price data with precision handling
            open_price = self._round_price(float(item.get('open', 0)))
            high_price = self._round_price(float(item.get('high', 0)))
            low_price = self._round_price(float(item.get('low', 0)))
            close_price = self._round_price(float(item.get('close', 0)))
            volume = int(item.get('volume', 0))
            
            # Extract optional fields
            market_cap = item.get('market_cap')
            if market_cap:
                market_cap = float(market_cap)
            
            pe_ratio = item.get('pe_ratio')
            if pe_ratio:
                pe_ratio = float(pe_ratio)
            
            dividend_yield = item.get('dividend_yield')
            if dividend_yield:
                dividend_yield = float(dividend_yield)
            
            return MarketDataPoint(
                symbol=symbol,
                timestamp=timestamp,
                open_price=open_price,
                high_price=high_price,
                low_price=low_price,
                close_price=close_price,
                volume=volume,
                market_cap=market_cap,
                pe_ratio=pe_ratio,
                dividend_yield=dividend_yield,
                data_type=data_type
            )
            
        except Exception as e:
            logger.error(f"Error processing single item: {e}")
            return None
    
    def _extract_symbol(self, item: Dict) -> str:
        """Extract symbol from various possible field names"""
        possible_fields = ['symbol', 'ticker', 'code', 'instrument', 'Symbol', 'SYMBOL']
        
        for field in possible_fields:
            if field in item and item[field]:
                return str(item[field]).strip().upper()
        
        raise ValueError("No symbol field found in data")
    
    def _extract_timestamp(self, item: Dict) -> datetime:
        """Extract and normalize timestamp"""
        possible_fields = ['timestamp', 'time', 'date', 'datetime', 'Date', 'Time']
        
        for field in possible_fields:
            if field in item and item[field]:
                return self._parse_timestamp(item[field])
        
        # Default to current time if no timestamp found
        return datetime.now()
    
    def _parse_timestamp(self, timestamp: Union[str, int, float, datetime]) -> datetime:
        """Parse various timestamp formats"""
        if isinstance(timestamp, datetime):
            return timestamp
        
        if isinstance(timestamp, (int, float)):
            # Assume Unix timestamp
            return datetime.fromtimestamp(timestamp)
        
        if isinstance(timestamp, str):
            # Try common date formats
            formats = [
                '%Y-%m-%d %H:%M:%S',
                '%Y-%m-%d',
                '%Y/%m/%d %H:%M:%S',
                '%Y/%m/%d',
                '%m/%d/%Y %H:%M:%S',
                '%m/%d/%Y',
                '%Y-%m-%dT%H:%M:%S',
                '%Y-%m-%dT%H:%M:%SZ'
            ]
            
            for fmt in formats:
                try:
                    return datetime.strptime(timestamp, fmt)
                except ValueError:
                    continue
        
        raise ValueError(f"Unable to parse timestamp: {timestamp}")
    
    def _round_price(self, price: float) -> float:
        """Round price to configured decimal precision"""
        decimal_price = Decimal(str(price))
        return float(decimal_price.quantize(
            Decimal('0.' + '0' * self.config.decimal_precision),
            rounding=ROUND_HALF_UP
        ))
    
    def _remove_duplicates(self, data: List[MarketDataPoint]) -> List[MarketDataPoint]:
        """Remove duplicate data points"""
        seen = set()
        unique_data = []
        
        for item in data:
            key = (item.symbol, item.timestamp)
            if key not in seen:
                seen.add(key)
                unique_data.append(item)
        
        logger.info(f"Removed {len(data) - len(unique_data)} duplicate entries")
        return unique_data
    
    def process_csv_file(self, file_path: str, 
                        symbol_column: str = 'symbol',
                        timestamp_column: str = 'timestamp') -> List[MarketDataPoint]:
        """Process market data from CSV file"""
        try:
            df = pd.read_csv(file_path)
            
            # Handle missing values
            if self.config.handle_missing_values == "interpolate":
                df = df.interpolate()
            elif self.config.handle_missing_values == "drop":
                df = df.dropna()
            elif self.config.handle_missing_values == "fill_zero":
                df = df.fillna(0)
            
            # Convert DataFrame to list of dictionaries
            data_list = df.to_dict('records')
            
            return self.process_raw_data(data_list)
            
        except Exception as e:
            logger.error(f"Error processing CSV file: {e}")
            return []
    
    def process_json_file(self, file_path: str) -> List[MarketDataPoint]:
        """Process market data from JSON file"""
        try:
            with open(file_path, 'r') as f:
                data = json.load(f)
            
            return self.process_raw_data(data)
            
        except Exception as e:
            logger.error(f"Error processing JSON file: {e}")
            return []
    
    def calculate_technical_indicators(self, data: List[MarketDataPoint]) -> Dict[str, List[float]]:
        """Calculate basic technical indicators"""
        if not data:
            return {}
        
        # Sort data by timestamp
        sorted_data = sorted(data, key=lambda x: x.timestamp)
        closes = [item.close_price for item in sorted_data]
        
        indicators = {}
        
        # Simple Moving Average (SMA)
        for period in [5, 10, 20, 50]:
            if len(closes) >= period:
                sma = self._calculate_sma(closes, period)
                indicators[f'SMA_{period}'] = sma
        
        # Relative Strength Index (RSI)
        if len(closes) >= 14:
            rsi = self._calculate_rsi(closes, 14)
            indicators['RSI'] = rsi
        
        return indicators
    
    def _calculate_sma(self, values: List[float], period: int) -> List[float]:
        """Calculate Simple Moving Average"""
        sma = []
        for i in range(len(values)):
            if i < period - 1:
                sma.append(np.nan)
            else:
                sma.append(np.mean(values[i - period + 1:i + 1]))
        return sma
    
    def _calculate_rsi(self, values: List[float], period: int = 14) -> List[float]:
        """Calculate Relative Strength Index"""
        if len(values) < period + 1:
            return [np.nan] * len(values)
        
        deltas = [values[i] - values[i-1] for i in range(1, len(values))]
        gains = [d if d > 0 else 0 for d in deltas]
        losses = [-d if d < 0 else 0 for d in deltas]
        
        # Calculate initial average gain/loss
        avg_gain = np.mean(gains[:period])
        avg_loss = np.mean(losses[:period])
        
        rsi = [np.nan] * (period + 1)
        
        for i in range(period, len(deltas)):
            avg_gain = (avg_gain * (period - 1) + gains[i]) / period
            avg_loss = (avg_loss * (period - 1) + losses[i]) / period
            
            if avg_loss == 0:
                rsi_value = 100
            else:
                rs = avg_gain / avg_loss
                rsi_value = 100 - (100 / (1 + rs))
            
            rsi.append(rsi_value)
        
        return rsi
    
    def export_to_dataframe(self, data: List[MarketDataPoint]) -> pd.DataFrame:
        """Export processed data to pandas DataFrame"""
        if not data:
            return pd.DataFrame()
        
        df_data = [item.to_dict() for item in data]
        df = pd.DataFrame(df_data)
        
        # Set timestamp as index
        df['timestamp'] = pd.to_datetime(df['timestamp'])
        df.set_index('timestamp', inplace=True)
        
        return df
    
    def get_processing_stats(self) -> Dict[str, int]:
        """Get processing statistics"""
        return {
            'processed_count': self.processed_count,
            'error_count': self.error_count,
            'success_rate': (self.processed_count / (self.processed_count + self.error_count)) * 100
            if (self.processed_count + self.error_count) > 0 else 0
        }


# Example usage and testing
if __name__ == "__main__":
    # Sample data for testing
    sample_data = [
        {
            'symbol': 'AAPL',
            'timestamp': '2024-01-01 10:00:00',
            'open': 150.25,
            'high': 152.75,
            'low': 149.50,
            'close': 151.80,
            'volume': 1000000,
            'market_cap': 2500000000000
        },
        {
            'symbol': 'GOOGL',
            'timestamp': '2024-01-01 10:00:00',
            'open': 2750.00,
            'high': 2780.50,
            'low': 2740.25,
            'close': 2765.75,
            'volume': 500000
        }
    ]
    
    # Initialize processor
    config = ProcessingConfig(
        validate_data=True,
        remove_duplicates=True,
        decimal_precision=2
    )
    
    processor = DataProcessor(config)
    
    # Process sample data
    processed_data = processor.process_raw_data(sample_data)
    
    # Display results
    print(f"Processed {len(processed_data)} items")
    for item in processed_data:
        print(f"{item.symbol}: {item.close_price} at {item.timestamp}")
    
    # Calculate technical indicators
    indicators = processor.calculate_technical_indicators(processed_data)
    print(f"Technical indicators: {list(indicators.keys())}")
    
    # Export to DataFrame
    df = processor.export_to_dataframe(processed_data)
    print(f"DataFrame shape: {df.shape}")
    
    # Get processing statistics
    stats = processor.get_processing_stats()
    print(f"Processing stats: {stats}")
