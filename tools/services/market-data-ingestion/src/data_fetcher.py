#!/usr/bin/env python3
"""
Market Data Fetcher
Part of BeginnerInvestorHub - Market Data Ingestion Service

This module handles fetching market data from various external sources
including APIs, web scraping, and real-time data feeds.
"""

import asyncio
import aiohttp
import logging
from typing import Dict, List, Optional, Any, Union
from datetime import datetime, timedelta
from dataclasses import dataclass, asdict
import json
import time
import random
from abc import ABC, abstractmethod
import os
from urllib.parse import urljoin

logger = logging.getLogger(__name__)


@dataclass
class FetcherConfig:
    """Configuration for data fetchers"""
    api_key: str = ""
    base_url: str = ""
    rate_limit: int = 5  # requests per second
    timeout: int = 30
    retries: int = 3
    retry_delay: int = 1
    headers: Dict[str, str] = None
    
    def __post_init__(self):
        if self.headers is None:
            self.headers = {
                'User-Agent': 'BeginnerInvestorHub/1.0',
                'Accept': 'application/json'
            }


class DataFetcher(ABC):
    """Abstract base class for data fetchers"""
    
    def __init__(self, config: FetcherConfig):
        self.config = config
        self.last_request_time = 0
        self.session = None
        
    async def __aenter__(self):
        self.session = aiohttp.ClientSession(
            timeout=aiohttp.ClientTimeout(total=self.config.timeout),
            headers=self.config.headers
        )
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    async def _rate_limit(self):
        """Implement rate limiting"""
        current_time = time.time()
        time_since_last_request = current_time - self.last_request_time
        min_interval = 1.0 / self.config.rate_limit
        
        if time_since_last_request < min_interval:
            sleep_time = min_interval - time_since_last_request
            await asyncio.sleep(sleep_time)
        
        self.last_request_time = time.time()
    
    async def _make_request(self, url: str, params: Dict = None) -> Dict[str, Any]:
        """Make HTTP request with rate limiting and retries"""
        await self._rate_limit()
        
        for attempt in range(self.config.retries):
            try:
                async with self.session.get(url, params=params) as response:
                    if response.status == 200:
                        return await response.json()
                    elif response.status == 429:  # Rate limited
                        wait_time = self.config.retry_delay * (2 ** attempt)
                        logger.warning(f"Rate limited, waiting {wait_time} seconds")
                        await asyncio.sleep(wait_time)
                        continue
                    else:
                        response.raise_for_status()
                        
            except Exception as e:
                logger.error(f"Request failed (attempt {attempt + 1}): {e}")
                if attempt < self.config.retries - 1:
                    wait_time = self.config.retry_delay * (2 ** attempt)
                    await asyncio.sleep(wait_time)
                else:
                    raise
        
        raise Exception(f"Failed to fetch data after {self.config.retries} attempts")
    
    @abstractmethod
    async def fetch_quote(self, symbol: str) -> Dict[str, Any]:
        """Fetch current quote for a symbol"""
        pass
    
    @abstractmethod
    async def fetch_historical_data(self, symbol: str, period: str = "1mo") -> List[Dict[str, Any]]:
        """Fetch historical data for a symbol"""
        pass
    
    @abstractmethod
    async def fetch_multiple_quotes(self, symbols: List[str]) -> List[Dict[str, Any]]:
        """Fetch quotes for multiple symbols"""
        pass


class AlphaVantageFetcher(DataFetcher):
    """Alpha Vantage API data fetcher"""
    
    def __init__(self, config: FetcherConfig):
        super().__init__(config)
        self.base_url = "https://www.alphavantage.co/query"
        
    async def fetch_quote(self, symbol: str) -> Dict[str, Any]:
        """Fetch current quote from Alpha Vantage"""
        params = {
            'function': 'GLOBAL_QUOTE',
            'symbol': symbol,
            'apikey': self.config.api_key
        }
        
        try:
            data = await self._make_request(self.base_url, params)
            
            if 'Global Quote' in data:
                quote = data['Global Quote']
                return {
                    'symbol': symbol,
                    'timestamp': datetime.now().isoformat(),
                    'open': float(quote.get('02. open', 0)),
                    'high': float(quote.get('03. high', 0)),
                    'low': float(quote.get('04. low', 0)),
                    'close': float(quote.get('05. price', 0)),
                    'volume': int(quote.get('06. volume', 0)),
                    'change': float(quote.get('09. change', 0)),
                    'change_percent': quote.get('10. change percent', '0%').replace('%', '')
                }
            else:
                logger.error(f"Unexpected response format for {symbol}: {data}")
                return None
                
        except Exception as e:
            logger.error(f"Error fetching quote for {symbol}: {e}")
            return None
    
    async def fetch_historical_data(self, symbol: str, period: str = "1mo") -> List[Dict[str, Any]]:
        """Fetch historical data from Alpha Vantage"""
        params = {
            'function': 'TIME_SERIES_DAILY',
            'symbol': symbol,
            'apikey': self.config.api_key,
            'outputsize': 'compact' if period == '1mo' else 'full'
        }
        
        try:
            data = await self._make_request(self.base_url, params)
            
            if 'Time Series (Daily)' in data:
                time_series = data['Time Series (Daily)']
                historical_data = []
                
                for date_str, daily_data in time_series.items():
                    historical_data.append({
                        'symbol': symbol,
                        'timestamp': date_str,
                        'open': float(daily_data['1. open']),
                        'high': float(daily_data['2. high']),
                        'low': float(daily_data['3. low']),
                        'close': float(daily_data['4. close']),
                        'volume': int(daily_data['5. volume'])
                    })
                
                return historical_data
            else:
                logger.error(f"Unexpected response format for {symbol}: {data}")
                return []
                
        except Exception as e:
            logger.error(f"Error fetching historical data for {symbol}: {e}")
            return []
    
    async def fetch_multiple_quotes(self, symbols: List[str]) -> List[Dict[str, Any]]:
        """Fetch quotes for multiple symbols"""
        tasks = [self.fetch_quote(symbol) for symbol in symbols]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        valid_results = []
        for result in results:
            if isinstance(result, Exception):
                logger.error(f"Error in batch fetch: {result}")
            elif result is not None:
                valid_results.append(result)
        
        return valid_results


class YahooFinanceFetcher(DataFetcher):
    """Yahoo Finance API data fetcher (unofficial)"""
    
    def __init__(self, config: FetcherConfig):
        super().__init__(config)
        self.base_url = "https://query1.finance.yahoo.com/v8/finance/chart"
        
    async def fetch_quote(self, symbol: str) -> Dict[str, Any]:
        """Fetch current quote from Yahoo Finance"""
        url = f"{self.base_url}/{symbol}"
        params = {
            'interval': '1d',
            'range': '1d'
        }
        
        try:
            data = await self._make_request(url, params)
            
            if 'chart' in data and data['chart']['result']:
                result = data['chart']['result'][0]
                meta = result['meta']
                
                return {
                    'symbol': symbol,
                    'timestamp': datetime.now().isoformat(),
                    'open': meta.get('regularMarketOpen', 0),
                    'high': meta.get('regularMarketDayHigh', 0),
                    'low': meta.get('regularMarketDayLow', 0),
                    'close': meta.get('regularMarketPrice', 0),
                    'volume': meta.get('regularMarketVolume', 0),
                    'market_cap': meta.get('marketCap', 0),
                    'previous_close': meta.get('previousClose', 0)
                }
            else:
                logger.error(f"Unexpected response format for {symbol}: {data}")
                return None
                
        except Exception as e:
            logger.error(f"Error fetching quote for {symbol}: {e}")
            return None
    
    async def fetch_historical_data(self, symbol: str, period: str = "1mo") -> List[Dict[str, Any]]:
        """Fetch historical data from Yahoo Finance"""
        url = f"{self.base_url}/{symbol}"
        
        # Convert period to Yahoo Finance format
        period_map = {
            '1d': '1d',
            '1w': '5d',
            '1mo': '1mo',
            '3mo': '3mo',
            '6mo': '6mo',
            '1y': '1y',
            '2y': '2y',
            '5y': '5y',
            '10y': '10y',
            'max': 'max'
        }
        
        params = {
            'interval': '1d',
            'range': period_map.get(period, '1mo')
        }
        
        try:
            data = await self._make_request(url, params)
            
            if 'chart' in data and data['chart']['result']:
                result = data['chart']['result'][0]
                timestamps = result['timestamp']
                indicators = result['indicators']['quote'][0]
                
                historical_data = []
                for i, timestamp in enumerate(timestamps):
                    historical_data.append({
                        'symbol': symbol,
                        'timestamp': datetime.fromtimestamp(timestamp).isoformat(),
                        'open': indicators['open'][i] or 0,
                        'high': indicators['high'][i] or 0,
                        'low': indicators['low'][i] or 0,
                        'close': indicators['close'][i] or 0,
                        'volume': indicators['volume'][i] or 0
                    })
                
                return historical_data
            else:
                logger.error(f"Unexpected response format for {symbol}: {data}")
                return []
                
        except Exception as e:
            logger.error(f"Error fetching historical data for {symbol}: {e}")
            return []
    
    async def fetch_multiple_quotes(self, symbols: List[str]) -> List[Dict[str, Any]]:
        """Fetch quotes for multiple symbols"""
        # Yahoo Finance supports batch requests
        symbols_str = ','.join(symbols)
        url = f"{self.base_url}/{symbols_str}"
        
        try:
            data = await self._make_request(url)
            
            if 'chart' in data and data['chart']['result']:
                results = []
                for result in data['chart']['result']:
                    symbol = result['meta']['symbol']
                    meta = result['meta']
                    
                    results.append({
                        'symbol': symbol,
                        'timestamp': datetime.now().isoformat(),
                        'open': meta.get('regularMarketOpen', 0),
                        'high': meta.get('regularMarketDayHigh', 0),
                        'low': meta.get('regularMarketDayLow', 0),
                        'close': meta.get('regularMarketPrice', 0),
                        'volume': meta.get('regularMarketVolume', 0),
                        'market_cap': meta.get('marketCap', 0),
                        'previous_close': meta.get('previousClose', 0)
                    })
                
                return results
            else:
                logger.error(f"Unexpected response format for symbols: {data}")
                return []
                
        except Exception as e:
            logger.error(f"Error fetching multiple quotes: {e}")
            # Fallback to individual requests
            return await super().fetch_multiple_quotes(symbols)


class MockDataFetcher(DataFetcher):
    """Mock data fetcher for testing and development"""
    
    def __init__(self, config: FetcherConfig):
        super().__init__(config)
        
    async def fetch_quote(self, symbol: str) -> Dict[str, Any]:
        """Generate mock quote data"""
        await asyncio.sleep(0.1)  # Simulate API delay
        
        # Generate consistent mock data based on symbol
        base_price = abs(hash(symbol)) % 1000 + 50
        now = datetime.now()
        day_seed = hash(symbol + str(now.date()))
        
        return {
            'symbol': symbol,
            'timestamp': now.isoformat(),
            'open': base_price + (day_seed % 10 - 5),
            'high': base_price + (day_seed % 15),
            'low': base_price - (day_seed % 10),
            'close': base_price + (day_seed % 8 - 4),
            'volume': abs(day_seed) % 10000000 + 1000000,
            'market_cap': base_price * 1000000000,
            'pe_ratio': 15 + (abs(day_seed) % 20),
            'dividend_yield': (abs(day_seed) % 5) / 100
        }
    
    async def fetch_historical_data(self, symbol: str, period: str = "1mo") -> List[Dict[str, Any]]:
        """Generate mock historical data"""
        await asyncio.sleep(0.2)  # Simulate API delay
        
        # Determine number of days based on period
        period_days = {
            '1d': 1,
            '1w': 7,
            '1mo': 30,
            '3mo': 90,
            '6mo': 180,
            '1y': 365,
            '2y': 730,
            '5y': 1825
        }
        
        days = period_days.get(period, 30)
        base_price = abs(hash(symbol)) % 1000 + 50
        
        historical_data = []
        for i in range(days):
            date = datetime.now() - timedelta(days=i)
            day_seed = hash(symbol + str(date.date()))
            
            historical_data.append({
                'symbol': symbol,
                'timestamp': date.isoformat(),
                'open': base_price + (day_seed % 10 - 5),
                'high': base_price + (day_seed % 15),
                'low': base_price - (day_seed % 10),
                'close': base_price + ((day_seed + i) % 8 - 4),
                'volume': abs(day_seed) % 5000000 + 500000
            })
        
        return list(reversed(historical_data))  # Return chronological order
    
    async def fetch_multiple_quotes(self, symbols: List[str]) -> List[Dict[str, Any]]:
        """Generate mock quotes for multiple symbols"""
        tasks = [self.fetch_quote(symbol) for symbol in symbols]
        return await asyncio.gather(*tasks)


class FetcherFactory:
    """Factory class for creating data fetchers"""
    
    @staticmethod
    def create_fetcher(fetcher_type: str, config: FetcherConfig) -> DataFetcher:
        """Create a data fetcher based on type"""
        fetcher_map = {
            'alphavantage': AlphaVantageFetcher,
            'yahoo': YahooFinanceFetcher,
            'mock': MockDataFetcher
        }
        
        if fetcher_type not in fetcher_map:
            raise ValueError(f"Unknown fetcher type: {fetcher_type}")
        
        return fetcher_map[fetcher_type](config)


class DataFetcherManager:
    """Manager for multiple data fetchers with failover"""
    
    def __init__(self, fetchers: List[DataFetcher]):
        self.fetchers = fetchers
        self.current_fetcher_index = 0
        
    async def __aenter__(self):
        for fetcher in self.fetchers:
            await fetcher.__aenter__()
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        for fetcher in self.fetchers:
            await fetcher.__aexit__(exc_type, exc_val, exc_tb)
    
    async def fetch_quote(self, symbol: str) -> Dict[str, Any]:
        """Fetch quote with automatic failover"""
        for i, fetcher in enumerate(self.fetchers):
            try:
                result = await fetcher.fetch_quote(symbol)
                if result:
                    self.current_fetcher_index = i
                    return result
            except Exception as e:
                logger.warning(f"Fetcher {i} failed for {symbol}: {e}")
                continue
        
        raise Exception(f"All fetchers failed for symbol: {symbol}")
    
    async def fetch_historical_data(self, symbol: str, period: str = "1mo") -> List[Dict[str, Any]]:
        """Fetch historical data with automatic failover"""
        for i, fetcher in enumerate(self.fetchers):
            try:
                result = await fetcher.fetch_historical_data(symbol, period)
                if result:
                    self.current_fetcher_index = i
                    return result
            except Exception as e:
                logger.warning(f"Fetcher {i} failed for {symbol} historical data: {e}")
                continue
        
        raise Exception(f"All fetchers failed for symbol: {symbol}")
    
    async def fetch_multiple_quotes(self, symbols: List[str]) -> List[Dict[str, Any]]:
        """Fetch multiple quotes with automatic failover"""
        for i, fetcher in enumerate(self.fetchers):
            try:
                result = await fetcher.fetch_multiple_quotes(symbols)
                if result:
                    self.current_fetcher_index = i
                    return result
            except Exception as e:
                logger.warning(f"Fetcher {i} failed for multiple quotes: {e}")
                continue
        
        raise Exception(f"All fetchers failed for symbols: {symbols}")


# Example usage
async def main():
    """Example usage of the data fetcher"""
    # Configure fetchers
    alpha_vantage_config = FetcherConfig(
        api_key=os.getenv('ALPHA_VANTAGE_API_KEY', 'demo'),
        rate_limit=5
    )
    
    yahoo_config = FetcherConfig(rate_limit=10)
    mock_config = FetcherConfig(rate_limit=100)
    
    # Create fetchers
    fetchers = [
        FetcherFactory.create_fetcher('alphavantage', alpha_vantage_config),
        FetcherFactory.create_fetcher('yahoo', yahoo_config),
        FetcherFactory.create_fetcher('mock', mock_config)
    ]
    
    # Test data fetching
    async with DataFetcherManager(fetchers) as manager:
        # Fetch single quote
        quote = await manager.fetch_quote('AAPL')
        print(f"Quote: {quote}")
        
        # Fetch multiple quotes
        quotes = await manager.fetch_multiple_quotes(['AAPL', 'GOOGL', 'MSFT'])
        print(f"Multiple quotes: {len(quotes)} received")
        
        # Fetch historical data
        historical = await manager.fetch_historical_data('AAPL', '1mo')
        print(f"Historical data: {len(historical)} records")


if __name__ == "__main__":
    asyncio.run(main())
