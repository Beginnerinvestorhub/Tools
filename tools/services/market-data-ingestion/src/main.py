#!/usr/bin/env python3
"""
Market Data Ingestion Service - Main Entry Point
Part of BeginnerInvestorHub

This is the main entry point for the market data ingestion service.
It orchestrates data collection from multiple sources, processes the data,
and distributes it to various consumers.
"""

import os
import sys
import asyncio
import signal
import argparse
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from pathlib import Path
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
import schedule
from dataclasses import dataclass, asdict

# Add the src directory to the Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from data_processor import DataProcessor, ProcessingConfig, MarketDataType, DataSource, MarketDataPoint

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('market_data_ingestion.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)


@dataclass
class ServiceConfig:
    """Configuration for the market data ingestion service"""
    # Data sources
    api_key: str = ""
    api_base_url: str = "https://api.example.com"
    data_sources: List[str] = None
    
    # Processing settings
    batch_size: int = 100
    max_workers: int = 5
    retry_attempts: int = 3
    retry_delay: int = 5
    
    # Scheduling
    update_interval: int = 300  # 5 minutes
    market_hours_only: bool = True
    timezone: str = "UTC"
    
    # Output settings
    output_dir: str = "output"
    save_raw_data: bool = True
    save_processed_data: bool = True
    
    # Symbols to track
    symbols: List[str] = None
    
    def __post_init__(self):
        if self.data_sources is None:
            self.data_sources = ["api", "csv"]
        if self.symbols is None:
            self.symbols = ["AAPL", "GOOGL", "MSFT", "TSLA", "AMZN"]


class MarketDataAPI:
    """Mock API client for demonstration (replace with real API)"""
    
    def __init__(self, api_key: str, base_url: str):
        self.api_key = api_key
        self.base_url = base_url
        self.session = None
        
    async def get_quote(self, symbol: str) -> Dict[str, Any]:
        """Get current quote for a symbol"""
        # Mock implementation - replace with actual API calls
        await asyncio.sleep(0.1)  # Simulate API delay
        
        # Generate mock data
        base_price = hash(symbol) % 1000 + 100
        current_time = datetime.now()
        
        return {
            "symbol": symbol,
            "timestamp": current_time.isoformat(),
            "open": base_price + (hash(str(current_time.date())) % 20 - 10),
            "high": base_price + (hash(str(current_time.date())) % 25),
            "low": base_price - (hash(str(current_time.date())) % 15),
            "close": base_price + (hash(str(current_time.hour)) % 15 - 7),
            "volume": hash(symbol + str(current_time.hour)) % 1000000 + 100000,
            "market_cap": base_price * 1000000000,
            "pe_ratio": 15 + (hash(symbol) % 20),
            "dividend_yield": (hash(symbol) % 5) / 100
        }
    
    async def get_historical_data(self, symbol: str, days: int = 30) -> List[Dict[str, Any]]:
        """Get historical data for a symbol"""
        data = []
        base_price = hash(symbol) % 1000 + 100
        
        for i in range(days):
            date = datetime.now() - timedelta(days=i)
            day_hash = hash(symbol + str(date.date()))
            
            data.append({
                "symbol": symbol,
                "timestamp": date.isoformat(),
                "open": base_price + (day_hash % 20 - 10),
                "high": base_price + (day_hash % 25),
                "low": base_price - (day_hash % 15),
                "close": base_price + ((day_hash + i) % 15 - 7),
                "volume": (day_hash % 1000000) + 100000,
                "market_cap": base_price * 1000000000
            })
        
        return data
    
    async def get_multiple_quotes(self, symbols: List[str]) -> List[Dict[str, Any]]:
        """Get quotes for multiple symbols"""
        tasks = [self.get_quote(symbol) for symbol in symbols]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        valid_results = []
        for result in results:
            if isinstance(result, Exception):
                logger.error(f"Error fetching quote: {result}")
            else:
                valid_results.append(result)
        
        return valid_results


class DataSourceManager:
    """Manages multiple data sources"""
    
    def __init__(self, config: ServiceConfig):
        self.config = config
        self.api_client = MarketDataAPI(config.api_key, config.api_base_url)
        self.data_processor = DataProcessor(ProcessingConfig(
            validate_data=True,
            remove_duplicates=True,
            decimal_precision=4
        ))
        
    async def fetch_from_api(self, symbols: List[str]) -> List[Dict[str, Any]]:
        """Fetch data from API source"""
        try:
            logger.info(f"Fetching data from API for {len(symbols)} symbols")
            return await self.api_client.get_multiple_quotes(symbols)
        except Exception as e:
            logger.error(f"Error fetching from API: {e}")
            return []
    
    def fetch_from_csv(self, file_path: str) -> List[MarketDataPoint]:
        """Fetch data from CSV file"""
        try:
            logger.info(f"Processing CSV file: {file_path}")
            return self.data_processor.process_csv_file(file_path)
        except Exception as e:
            logger.error(f"Error processing CSV file: {e}")
            return []
    
    def fetch_from_json(self, file_path: str) -> List[MarketDataPoint]:
        """Fetch data from JSON file"""
        try:
            logger.info(f"Processing JSON file: {file_path}")
            return self.data_processor.process_json_file(file_path)
        except Exception as e:
            logger.error(f"Error processing JSON file: {e}")
            return []


class MarketDataIngestionService:
    """Main service class for market data ingestion"""
    
    def __init__(self, config: ServiceConfig):
        self.config = config
        self.data_source_manager = DataSourceManager(config)
        self.is_running = False
        self.last_update = None
        self.total_processed = 0
        self.total_errors = 0
        
        # Create output directory
        Path(config.output_dir).mkdir(parents=True, exist_ok=True)
        
        # Set up signal handlers
        signal.signal(signal.SIGINT, self._signal_handler)
        signal.signal(signal.SIGTERM, self._signal_handler)
    
    def _signal_handler(self, signum, frame):
        """Handle shutdown signals"""
        logger.info(f"Received signal {signum}, shutting down gracefully...")
        self.is_running = False
    
    async def collect_data(self) -> Dict[str, List[MarketDataPoint]]:
        """Collect data from all configured sources"""
        collected_data = {}
        
        for source in self.config.data_sources:
            try:
                if source == "api":
                    raw_data = await self.data_source_manager.fetch_from_api(self.config.symbols)
                    processed_data = self.data_source_manager.data_processor.process_raw_data(
                        raw_data, MarketDataType.STOCK
                    )
                    collected_data["api"] = processed_data
                    
                elif source == "csv":
                    # Look for CSV files in the data directory
                    data_dir = Path("data")
                    if data_dir.exists():
                        csv_files = list(data_dir.glob("*.csv"))
                        all_csv_data = []
                        for csv_file in csv_files:
                            csv_data = self.data_source_manager.fetch_from_csv(str(csv_file))
                            all_csv_data.extend(csv_data)
                        collected_data["csv"] = all_csv_data
                    
                elif source == "json":
                    # Look for JSON files in the data directory
                    data_dir = Path("data")
                    if data_dir.exists():
                        json_files = list(data_dir.glob("*.json"))
                        all_json_data = []
                        for json_file in json_files:
                            json_data = self.data_source_manager.fetch_from_json(str(json_file))
                            all_json_data.extend(json_data)
                        collected_data["json"] = all_json_data
                
            except Exception as e:
                logger.error(f"Error collecting data from {source}: {e}")
                self.total_errors += 1
        
        return collected_data
    
    def save_data(self, data: Dict[str, List[MarketDataPoint]]):
        """Save collected data to files"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        for source, source_data in data.items():
            if not source_data:
                continue
            
            try:
                # Save as JSON
                json_file = Path(self.config.output_dir) / f"market_data_{source}_{timestamp}.json"
                json_data = [item.to_dict() for item in source_data]
                
                with open(json_file, 'w') as f:
                    json.dump(json_data, f, indent=2, default=str)
                
                logger.info(f"Saved {len(source_data)} records to {json_file}")
                
                # Save as CSV using pandas
                try:
                    df = self.data_source_manager.data_processor.export_to_dataframe(source_data)
                    csv_file = Path(self.config.output_dir) / f"market_data_{source}_{timestamp}.csv"
                    df.to_csv(csv_file)
                    logger.info(f"Saved DataFrame to {csv_file}")
                except Exception as e:
                    logger.warning(f"Could not save CSV for {source}: {e}")
                
            except Exception as e:
                logger.error(f"Error saving data for {source}: {e}")
    
    def calculate_and_save_indicators(self, data: Dict[str, List[MarketDataPoint]]):
        """Calculate technical indicators and save them"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        for source, source_data in data.items():
            if not source_data:
                continue
            
            try:
                # Group data by symbol
                symbol_data = {}
                for item in source_data:
                    if item.symbol not in symbol_data:
                        symbol_data[item.symbol] = []
                    symbol_data[item.symbol].append(item)
                
                # Calculate indicators for each symbol
                all_indicators = {}
                for symbol, symbol_items in symbol_data.items():
                    indicators = self.data_source_manager.data_processor.calculate_technical_indicators(symbol_items)
                    if indicators:
                        all_indicators[symbol] = indicators
                
                if all_indicators:
                    indicators_file = Path(self.config.output_dir) / f"technical_indicators_{source}_{timestamp}.json"
                    with open(indicators_file, 'w') as f:
                        json.dump(all_indicators, f, indent=2, default=str)
                    
                    logger.info(f"Saved technical indicators to {indicators_file}")
                
            except Exception as e:
                logger.error(f"Error calculating indicators for {source}: {e}")
    
    def is_market_hours(self) -> bool:
        """Check if current time is within market hours"""
        if not self.config.market_hours_only:
            return True
        
        now = datetime.now()
        # Simple market hours check (9 AM - 4 PM weekdays)
        if now.weekday() >= 5:  # Saturday = 5, Sunday = 6
            return False
        
        if now.hour < 9 or now.hour >= 16:
            return False
        
        return True
    
    def get_service_status(self) -> Dict[str, Any]:
        """Get current service status"""
        return {
            "is_running": self.is_running,
            "last_update": self.last_update.isoformat() if self.last_update else None,
            "total_processed": self.total_processed,
            "total_errors": self.total_errors,
            "config": asdict(self.config),
            "uptime": time.time() - self.start_time if hasattr(self, 'start_time') else 0
        }
    
    async def run_single_update(self):
        """Run a single data collection and processing cycle"""
        try:
            logger.info("Starting data collection cycle")
            
            # Collect data from all sources
            collected_data = await self.collect_data()
            
            # Count total records
            total_records = sum(len(data) for data in collected_data.values())
            
            if total_records > 0:
                # Save the data
                self.save_data(collected_data)
                
                # Calculate and save technical indicators
                self.calculate_and_save_indicators(collected_data)
                
                self.total_processed += total_records
                self.last_update = datetime.now()
                
                logger.info(f"Data collection cycle completed. Processed {total_records} records")
            else:
                logger.warning("No data collected in this cycle")
                
        except Exception as e:
            logger.error(f"Error in data collection cycle: {e}")
            self.total_errors += 1
    
    async def run_scheduled(self):
        """Run the service with scheduled updates"""
        logger.info("Starting scheduled market data ingestion service")
        self.is_running = True
        self.start_time = time.time()
        
        # Schedule the data collection
        schedule.every(self.config.update_interval).seconds.do(
            lambda: asyncio.create_task(self.run_single_update())
        )
        
        while self.is_running:
            try:
                # Check market hours
                if self.is_market_hours():
                    schedule.run_pending()
                else:
                    logger.info("Outside market hours, skipping update")
                
                await asyncio.sleep(60)  # Check every minute
                
            except Exception as e:
                logger.error(f"Error in scheduled run: {e}")
                await asyncio.sleep(60)
        
        logger.info("Market data ingestion service stopped")
    
    async def run_once(self):
        """Run data collection once and exit"""
        logger.info("Running single data collection cycle")
        await self.run_single_update()
        logger.info("Single cycle completed")


def load_config(config_path: str) -> ServiceConfig:
    """Load configuration from JSON file"""
    try:
        with open(config_path, 'r') as f:
            config_data = json.load(f)
        
        return ServiceConfig(**config_data)
    except FileNotFoundError:
        logger.warning("Config file %s not found, using defaults", config_path)
        return ServiceConfig()
    except Exception as e:
        logger.error(f"Error loading config: {e}")
        return ServiceConfig()


def create_sample_config():
    """Create a sample configuration file"""
    config = ServiceConfig(
        api_key="your_api_key_here",
        api_base_url="https://api.example.com",
        data_sources=["api", "csv"],
        symbols=["AAPL", "GOOGL", "MSFT", "TSLA", "AMZN", "NVDA"],
        update_interval=300,
        output_dir="output",
        batch_size=50,
        max_workers=3
    )
    
    with open("config.json", 'w') as f:
        json.dump(asdict(config), f, indent=2)
    
    print("Sample config.json created")


async def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description="Market Data Ingestion Service")
    parser.add_argument("--config", "-c", default="config.json", help="Configuration file path")
    parser.add_argument("--once", action="store_true", help="Run once and exit")
    parser.add_argument("--create-config", action="store_true", help="Create sample config file")
    parser.add_argument("--status", action="store_true", help="Show service status")
    
    args = parser.parse_args()
    
    if args.create_config:
        create_sample_config()
        return
    
    # Load configuration
    config = load_config(args.config)
    
    # Create service instance
    service = MarketDataIngestionService(config)
    
    if args.status:
        status = service.get_service_status()
        print(json.dumps(status, indent=2))
        return
    
    try:
        if args.once:
            await service.run_once()
        else:
            await service.run_scheduled()
    except KeyboardInterrupt:
        logger.info("Service interrupted by user")
    except Exception as e:
        logger.error(f"Service error: {e}")
    finally:
        logger.info("Market data ingestion service shutdown complete")


if __name__ == "__main__":
    asyncio.run(main())
