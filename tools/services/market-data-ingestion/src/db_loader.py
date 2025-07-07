#!/usr/bin/env python3

"""
Database Loader
Part of BeginnerInvestorHub - Market Data Ingestion Service
This module handles loading processed market data into various database systems
including PostgreSQL, MongoDB, and SQLite with proper schema management.
"""

import asyncio
import logging
import pandas as pd
from typing import Dict, List, Optional, Any, Union
from datetime import datetime, timedelta
from dataclasses import dataclass, asdict
from abc import ABC, abstractmethod
import json
import os
from contextlib import asynccontextmanager
from enum import Enum

# Database drivers
try:
    import asyncpg
    HAS_ASYNCPG = True
except ImportError:
    HAS_ASYNCPG = False

try:
    import motor.motor_asyncio
    HAS_MOTOR = True
except ImportError:
    HAS_MOTOR = False

try:
    import aiosqlite
    HAS_AIOSQLITE = True
except ImportError:
    HAS_AIOSQLITE = False

try:
    import aiomysql
    HAS_AIOMYSQL = True
except ImportError:
    HAS_AIOMYSQL = False

# Import from data_processor (assuming these exist)
try:
    from data_processor import MarketDataPoint, MarketDataType, DataSource
except ImportError:
    # Define fallback classes for standalone testing
    class MarketDataType(Enum):
        STOCK = "stock"
        CRYPTO = "crypto"
        FOREX = "forex"
        COMMODITY = "commodity"

    class DataSource(Enum):
        API = "api"
        CSV = "csv"
        JSON = "json"
        MANUAL = "manual"

    @dataclass
    class MarketDataPoint:
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

logger = logging.getLogger(__name__)

@dataclass
class DatabaseConfig:
    """Configuration for database connections"""
    db_type: str = "sqlite" # sqlite, postgresql, mongodb, mysql
    host: str = "localhost"
    port: int = 5432
    database: str = "market_data"
    username: str = ""
    password: str = ""
    # Connection pool settings
    min_connections: int = 1
    max_connections: int = 10
    # SQLite specific
    sqlite_path: str = "market_data.db"
    # MongoDB specific
    collection_name: str = "market_data"
    # Additional options
    ssl: bool = False
    timeout: int = 30

    def get_connection_string(self) -> str:
        """Generate connection string based on database type"""
        if self.db_type == "postgresql":
            return f"postgresql://{self.username}:{self.password}@{self.host}:{self.port}/{self.database}"
        elif self.db_type == "mysql":
            return f"mysql://{self.username}:{self.password}@{self.host}:{self.port}/{self.database}"
        elif self.db_type == "mongodb":
            auth = f"{self.username}:{self.password}@" if self.username else ""
            return f"mongodb://{auth}{self.host}:{self.port}/{self.database}"
        elif self.db_type == "sqlite":
            return self.sqlite_path
        else:
            raise ValueError(f"Unsupported database type: {self.db_type}")

class DatabaseLoader(ABC):
    """Abstract base class for database loaders"""
    def __init__(self, config: DatabaseConfig):
        self.config = config
        self.connection_pool = None
        self.is_connected = False

    @abstractmethod
    async def connect(self):
        """Establish database connection"""
        pass

    @abstractmethod
    async def disconnect(self):
        """Close database connection"""
        pass

    @abstractmethod
    async def create_tables(self):
        """Create necessary tables/collections"""
        pass

    @abstractmethod
    async def load_data(self, data: List[MarketDataPoint]) -> int:
        """Load market data into database"""
        pass

    @abstractmethod
    async def get_latest_data(self, symbol: str, limit: int = 100) -> List[Dict[str, Any]]:
        """Get latest data for a symbol"""
        pass

    @abstractmethod
    async def get_data_by_date_range(self, symbol: str, start_date: datetime, end_date: datetime) -> List[Dict[str, Any]]:
        """Get data for a symbol within date range"""
        pass

    @abstractmethod
    async def delete_data(self, symbol: str, before_date: Optional[datetime] = None) -> int:
        """Delete data for a symbol, optionally before a specific date"""
        pass

    @abstractmethod
    async def get_symbols(self) -> List[str]:
        """Get list of all symbols in database"""
        pass

    @abstractmethod
    async def get_data_count(self, symbol: Optional[str] = None) -> int:
        """Get total count of data points, optionally for a specific symbol"""
        pass

    async def __aenter__(self):
        await self.connect()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.disconnect()

class PostgreSQLLoader(DatabaseLoader):
    """PostgreSQL database loader"""
    def __init__(self, config: DatabaseConfig):
        super().__init__(config)
        if not HAS_ASYNCPG:
            raise ImportError("asyncpg is required for PostgreSQL support")

    async def connect(self):
        """Connect to PostgreSQL database"""
        try:
            self.connection_pool = await asyncpg.create_pool(
                host=self.config.host,
                port=self.config.port,
                user=self.config.username,
                password=self.config.password,
                database=self.config.database,
                min_size=self.config.min_connections,
                max_size=self.config.max_connections,
                command_timeout=self.config.timeout,
                ssl=self.config.ssl
            )
            self.is_connected = True
            logger.info("Connected to PostgreSQL database")
            # Create tables if they don't exist
            await self.create_tables()
        except Exception as e:
            logger.error(f"Failed to connect to PostgreSQL: {e}")
            raise

    async def disconnect(self):
        """Disconnect from PostgreSQL database"""
        if self.connection_pool:
            await self.connection_pool.close()
            self.is_connected = False
            logger.info("Disconnected from PostgreSQL database")

    async def create_tables(self):
        """Create market data tables"""
        create_table_sql = """
        CREATE TABLE IF NOT EXISTS market_data (
            id SERIAL PRIMARY KEY,
            symbol VARCHAR(20) NOT NULL,
            timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
            open_price DECIMAL(12,4) NOT NULL,
            high_price DECIMAL(12,4) NOT NULL,
            low_price DECIMAL(12,4) NOT NULL,
            close_price DECIMAL(12,4) NOT NULL,
            volume BIGINT NOT NULL,
            market_cap DECIMAL(20,2),
            pe_ratio DECIMAL(8,2),
            dividend_yield DECIMAL(6,4),
            data_type VARCHAR(20) NOT NULL DEFAULT 'stock',
            source VARCHAR(20) NOT NULL DEFAULT 'api',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(symbol, timestamp)
        );
        CREATE INDEX IF NOT EXISTS idx_market_data_symbol ON market_data(symbol);
        CREATE INDEX IF NOT EXISTS idx_market_data_timestamp ON market_data(timestamp);
        CREATE INDEX IF NOT EXISTS idx_market_data_symbol_timestamp ON market_data(symbol, timestamp);
        CREATE INDEX IF NOT EXISTS idx_market_data_data_type ON market_data(data_type);
        -- Create trigger for updated_at
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = CURRENT_TIMESTAMP;
            RETURN NEW;
        END;
        $$ language 'plpgsql';
        DROP TRIGGER IF EXISTS update_market_data_updated_at ON market_data;
        CREATE TRIGGER update_market_data_updated_at
        BEFORE UPDATE ON market_data
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
        """
        async with self.connection_pool.acquire() as conn:
            await conn.execute(create_table_sql)
        logger.info("PostgreSQL tables created/verified")

    async def load_data(self, data: List[MarketDataPoint]) -> int:
        """Load market data into PostgreSQL"""
        if not data:
            return 0
        insert_sql = """
        INSERT INTO market_data (
            symbol, timestamp, open_price, high_price, low_price, close_price,
            volume, market_cap, pe_ratio, dividend_yield, data_type, source
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        ON CONFLICT (symbol, timestamp) DO UPDATE SET
            open_price = EXCLUDED.open_price,
            high_price = EXCLUDED.high_price,
            low_price = EXCLUDED.low_price,
            close_price = EXCLUDED.close_price,
            volume = EXCLUDED.volume,
            market_cap = EXCLUDED.market_cap,
            pe_ratio = EXCLUDED.pe_ratio,
            dividend_yield = EXCLUDED.dividend_yield,
            data_type = EXCLUDED.data_type,
            source = EXCLUDED.source,
            updated_at = CURRENT_TIMESTAMP
        """
        rows_inserted = 0
        async with self.connection_pool.acquire() as conn:
            async with conn.transaction():
                for item in data:
                    try:
                        await conn.execute(
                            insert_sql,
                            item.symbol,
                            item.timestamp,
                            item.open_price,
                            item.high_price,
                            item.low_price,
                            item.close_price,
                            item.volume,
                            item.market_cap,
                            item.pe_ratio,
                            item.dividend_yield,
                            item.data_type.value,
                            item.source.value
                        )
                        rows_inserted += 1
                    except Exception as e:
                        logger.error(f"Error inserting data for {item.symbol}: {e}")
        logger.info(f"Loaded {rows_inserted} records into PostgreSQL")
        return rows_inserted

    async def get_latest_data(self, symbol: str, limit: int = 100) -> List[Dict[str, Any]]:
        """Get latest data for a symbol"""
        query = """
        SELECT * FROM market_data
        WHERE symbol = $1
        ORDER BY timestamp DESC
        LIMIT $2
        """
        async with self.connection_pool.acquire() as conn:
            rows = await conn.fetch(query, symbol, limit)
            return [dict(row) for row in rows]

    async def get_data_by_date_range(self, symbol: str, start_date: datetime, end_date: datetime) -> List[Dict[str, Any]]:
        """Get data for a symbol within date range"""
        query = """
        SELECT * FROM market_data
        WHERE symbol = $1 AND timestamp BETWEEN $2 AND $3
        ORDER BY timestamp ASC
        """
        async with self.connection_pool.acquire() as conn:
            rows = await conn.fetch(query, symbol, start_date, end_date)
            return [dict(row) for row in rows]

    async def delete_data(self, symbol: str, before_date: Optional[datetime] = None) -> int:
        """Delete data for a symbol, optionally before a specific date"""
        if before_date:
            query = "DELETE FROM market_data WHERE symbol = $1 AND timestamp < $2"
            params = [symbol, before_date]
        else:
            query = "DELETE FROM market_data WHERE symbol = $1"
            params = [symbol]
        async with self.connection_pool.acquire() as conn:
            result = await conn.execute(query, *params)
            deleted_count = int(result.split()[-1])
            logger.info(f"Deleted {deleted_count} records for {symbol}")
            return deleted_count

    async def get_symbols(self) -> List[str]:
        """Get list of all symbols in database"""
        query = "SELECT DISTINCT symbol FROM market_data ORDER BY symbol"
        async with self.connection_pool.acquire() as conn:
            rows = await conn.fetch(query)
            return [row['symbol'] for row in rows]

    async def get_data_count(self, symbol: Optional[str] = None) -> int:
        """Get total count of data points, optionally for a specific symbol"""
        if symbol:
            query = "SELECT COUNT(*) FROM market_data WHERE symbol = $1"
            params = [symbol]
        else:
            query = "SELECT COUNT(*) FROM market_data"
            params = []
        async with self.connection_pool.acquire() as conn:
            result = await conn.fetchval(query, *params)
            return result

class SQLiteLoader(DatabaseLoader):
    """SQLite database loader"""
    def __init__(self, config: DatabaseConfig):
        super().__init__(config)
        if not HAS_AIOSQLITE:
            raise ImportError("aiosqlite is required for SQLite support")

    async def connect(self):
        """Connect to SQLite database"""
        try:
            # Create directory if it doesn't exist
            os.makedirs(os.path.dirname(self.config.sqlite_path), exist_ok=True)
            self.connection = await aiosqlite.connect(
                self.config.sqlite_path,
                timeout=self.config.timeout
            )
            # Enable foreign keys and WAL mode for better performance
            await self.connection.execute("PRAGMA foreign_keys = ON")
            await self.connection.execute("PRAGMA journal_mode = WAL")
            await self.connection.execute("PRAGMA synchronous = NORMAL")
            self.is_connected = True
            logger.info(f"Connected to SQLite database: {self.config.sqlite_path}")
            # Create tables if they don't exist
            await self.create_tables()
        except Exception as e:
            logger.error(f"Failed to connect to SQLite: {e}")
            raise

    async def disconnect(self):
        """Disconnect from SQLite database"""
        if hasattr(self, 'connection') and self.connection:
            await self.connection.close()
            self.is_connected = False
            logger.info("Disconnected from SQLite database")

    async def create_tables(self):
        """Create market data tables"""
        create_table_sql = """
        CREATE TABLE IF NOT EXISTS market_data (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            symbol TEXT NOT NULL,
            timestamp DATETIME NOT NULL,
            open_price REAL NOT NULL,
            high_price REAL NOT NULL,
            low_price REAL NOT NULL,
            close_price REAL NOT NULL,
            volume INTEGER NOT NULL,
            market_cap REAL,
            pe_ratio REAL,
            dividend_yield REAL,
            data_type TEXT NOT NULL DEFAULT 'stock',
            source TEXT NOT NULL DEFAULT 'api',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(symbol, timestamp)
        );
        CREATE INDEX IF NOT EXISTS idx_market_data_symbol ON market_data(symbol);
        CREATE INDEX IF NOT EXISTS idx_market_data_timestamp ON market_data(timestamp);
        CREATE INDEX IF NOT EXISTS idx_market_data_symbol_timestamp ON market_data(symbol, timestamp);
        CREATE INDEX IF NOT EXISTS idx_market_data_data_type ON market_data(data_type);
        -- Create trigger for updated_at
        CREATE TRIGGER IF NOT EXISTS update_market_data_updated_at
        AFTER UPDATE ON market_data
        BEGIN
            UPDATE market_data SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
        END;
        """
        await self.connection.executescript(create_table_sql)
        await self.connection.commit()
        logger.info("SQLite tables created/verified")

    async def load_data(self, data: List[MarketDataPoint]) -> int:
        """Load market data into SQLite"""
        if not data:
            return 0
        insert_sql = """
        INSERT OR REPLACE INTO market_data (
            symbol, timestamp, open_price, high_price, low_price, close_price,
            volume, market_cap, pe_ratio, dividend_yield, data_type, source
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """
        rows_inserted = 0
        async with self.connection.execute("BEGIN"):
            for item in data:
                try:
                    await self.connection.execute(
                        insert_sql,
                        (
                            item.symbol,
                            item.timestamp,
                            item.open_price,
                            item.high_price,
                            item.low_price,
                            item.close_price,
                            item.volume,
                            item.market_cap,
                            item.pe_ratio,
                            item.dividend_yield,
                            item.data_type.value,
                            item.source.value
                        )
                    )
                    rows_inserted += 1
                except Exception as e:
                    logger.error(f"Error inserting data for {item.symbol}: {e}")
            await self.connection.commit()
        logger.info(f"Loaded {rows_inserted} records into SQLite")
        return rows_inserted

    async def get_latest_data(self, symbol: str, limit: int = 100) -> List[Dict[str, Any]]:
        """Get latest data for a symbol"""
        query = """
        SELECT * FROM market_data
        WHERE symbol = ?
        ORDER BY timestamp DESC
        LIMIT ?
        """
        async with self.connection.execute(query, (symbol, limit)) as cursor:
            rows = await cursor.fetchall()
            columns = [description[0] for description in cursor.description]
            return [dict(zip(columns, row)) for row in rows]

    async def get_data_by_date_range(self, symbol: str, start_date: datetime, end_date: datetime) -> List[Dict[str, Any]]:
        """Get data for a symbol within date range"""
        query = """
        SELECT * FROM market_data
        WHERE symbol = ? AND timestamp BETWEEN ? AND ?
        ORDER BY timestamp ASC
        """
        async with self.connection.execute(query, (symbol, start_date, end_date)) as cursor:
            rows = await cursor.fetchall()
            columns = [description[0] for description in cursor.description]
            return [dict(zip(columns, row)) for row in rows]

    async def delete_data(self, symbol: str, before_date: Optional[datetime] = None) -> int:
        """Delete data for a symbol, optionally before a specific date"""
        if before_date:
            query = "DELETE FROM market_data WHERE symbol = ? AND timestamp < ?"
            params = (symbol, before_date)
        else:
            query = "DELETE FROM market_data WHERE symbol = ?"
            params = (symbol,)
        async with self.connection.execute(query, params) as cursor:
            deleted_count = cursor.rowcount
            await self.connection.commit()
            logger.info(f"Deleted {deleted_count} records for {symbol}")
            return deleted_count

    async def get_symbols(self) -> List[str]:
        """Get list of all symbols in database"""
        query = "SELECT DISTINCT symbol FROM market_data ORDER BY symbol"
        async with self.connection.execute(query) as cursor:
            rows = await cursor.fetchall()
            return [row[0] for row in rows]

    async def get_data_count(self, symbol: Optional[str] = None) -> int:
        """Get total count of data points, optionally for a specific symbol"""
        if symbol:
            query = "SELECT COUNT(*) FROM market_data WHERE symbol = ?"
            params = (symbol,)
        else:
            query = "SELECT COUNT(*) FROM market_data"
            params = ()
        async with self.connection.execute(query, params) as cursor:
            result = await cursor.fetchone()
            return result[0] if result else 0

class MongoDBLoader(DatabaseLoader):
    """MongoDB database loader"""
    def __init__(self, config: DatabaseConfig):
        super().__init__(config)
        if not HAS_MOTOR:
            raise ImportError("motor is required for MongoDB support")

    async def connect(self):
        """Connect to MongoDB database"""
        try:
            connection_string = self.config.get_connection_string()
            self.client = motor.motor_asyncio.AsyncIOMotorClient(
                connection_string,
                serverSelectionTimeoutMS=self.config.timeout * 1000
            )
            self.database = self.client[self.config.database]
            self.collection = self.database[self.config.collection_name]
            # Test connection
            await self.client.admin.command('ping')
            self.is_connected = True
            logger.info("Connected to MongoDB database")
            # Create indexes
            await self.create_tables()
        except Exception as e:
            logger.error(f"Failed to connect to MongoDB: {e}")
            raise

    async def disconnect(self):
        """Disconnect from MongoDB database"""
        if hasattr(self, 'client') and self.client:
            self.client.close()
            self.is_connected = False
            logger.info("Disconnected from MongoDB database")

    async def create_tables(self):
        """Create indexes for MongoDB collection"""
        try:
            # Create indexes for better query performance
            await self.collection.create_index("symbol")
            await self.collection.create_index("timestamp")
            await self.collection.create_index("data_type")
            await self.collection.create_index([("symbol", 1), ("timestamp", -1)])
            await self.collection.create_index([("symbol", 1), ("timestamp", 1)])
            logger.info("MongoDB indexes created/verified")
        except Exception as e:
            logger.error(f"Error creating MongoDB indexes: {e}")

    async def load_data(self, data: List[MarketDataPoint]) -> int:
        """Load market data into MongoDB"""
        if not data:
            return 0
        documents = []
        for item in data:
            doc = {
                "symbol": item.symbol,
                "timestamp": item.timestamp,
                "open_price": item.open_price,
                "high_price": item.high_price,
                "low_price": item.low_price,
                "close_price": item.close_price,
                "volume": item.volume,
                "market_cap": item.market_cap,
                "pe_ratio": item.pe_ratio,
                "dividend_yield": item.dividend_yield,
                "data_type": item.data_type.value,
                "source": item.source.value,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            documents.append(doc)
        try:
            # Use upsert operations to avoid duplicates
            operations = []
            for doc in documents:
                operations.append(
                    {
                        "updateOne": {
                            "filter": {"symbol": doc["symbol"], "timestamp": doc["timestamp"]},
                            "update": {
                                "$set": doc,
                                "$setOnInsert": {"created_at": doc["created_at"]}
                            },
                            "upsert": True
                        }
                    }
                )
            result = await self.collection.bulk_write(operations)
            rows_inserted = result.upserted_count + result.modified_count
            logger.info(f"Loaded {rows_inserted} records into MongoDB")
            return rows_inserted
        except Exception as e:
            logger.error(f"Error loading data into MongoDB: {e}")
            return 0

    async def get_latest_data(self, symbol: str, limit: int = 100) -> List[Dict[str, Any]]:
        """Get latest data for a symbol"""
        cursor = self.collection.find(
            {"symbol": symbol}
        ).sort("timestamp", -1).limit(limit)
        documents = []
        async for doc in cursor:
            doc["_id"] = str(doc["_id"]) # Convert ObjectId to string
            documents.append(doc)
        return documents

    async def get_data_by_date_range(self, symbol: str, start_date: datetime, end_date: datetime) -> List[Dict[str, Any]]:
        """Get data for a symbol within date range"""
        cursor = self.collection.find({
            "symbol": symbol,
            "timestamp": {"$gte": start_date, "$lte": end_date}
        }).sort("timestamp", 1)
        documents = []
        async for doc in cursor:
            doc["_id"] = str(doc["_id"]) # Convert ObjectId to string
            documents.append(doc)
        return documents

    async def delete_data(self, symbol: str, before_date: Optional[datetime] = None) -> int:
        """Delete data for a symbol, optionally before a specific date"""
        if before_date:
            filter_query = {"symbol": symbol, "timestamp": {"$lt": before_date}}
        else:
            filter_query = {"symbol": symbol}
        result = await self.collection.delete_many(filter_query)
        deleted_count = result.deleted_count
        logger.info(f"Deleted {deleted_count} records for {symbol}")
        return deleted_count

    async def get_symbols(self) -> List[str]:
        """Get list of all symbols in database"""
        symbols = await self.collection.distinct("symbol")
        return sorted(symbols)

    async def get_data_count(self, symbol: Optional[str] = None) -> int:
        """Get total count of data points, optionally for a specific symbol"""
        if symbol:
            filter_query = {"symbol": symbol}
        else:
            filter_query = {}
        count = await self.collection.count_documents(filter_query)
        return count

class MySQLLoader(DatabaseLoader):
    """MySQL database loader"""
    def __init__(self, config: DatabaseConfig):
        super().__init__(config)
        if not HAS_AIOMYSQL:
            raise ImportError("aiomysql is required for MySQL support")

    async def connect(self):
        """Connect to MySQL database"""
        try:
            self.connection_pool = await aiomysql.create_pool(
                host=self.config.host,
                port=self.config.port,
                user=self.config.username,
                password=self.config.password,
                db=self.config.database,
                minsize=self.config.min_connections,
                maxsize=self.config.max_connections,
                autocommit=False
            )
            self.is_connected = True
            logger.info("Connected to MySQL database")
            # Create tables if they don't exist
            await self.create_tables()
        except Exception as e:
            logger.error(f"Failed to connect to MySQL: {e}")
            raise

    async def disconnect(self):
        """Disconnect from MySQL database"""
        if hasattr(self, 'connection_pool') and self.connection_pool:
            self.connection_pool.close()
            await self.connection_pool.wait_closed()
            self.is_connected = False
            logger.info("Disconnected from MySQL database")

    async def create_tables(self):
        """Create market data tables"""
        create_table_sql = """
        CREATE TABLE IF NOT EXISTS market_data (
            id INT AUTO_INCREMENT PRIMARY KEY,
            symbol VARCHAR(20) NOT NULL,
            timestamp DATETIME NOT NULL,
            open_price DECIMAL(12,4) NOT NULL,
            high_price DECIMAL(12,4) NOT NULL,
            low_price DECIMAL(12,4) NOT NULL,
            close_price DECIMAL(12,4) NOT NULL,
            volume BIGINT NOT NULL,
            market_cap DECIMAL(20,2),
            pe_ratio DECIMAL(8,2),
            dividend_yield DECIMAL(6,4),
            data_type VARCHAR(20) NOT NULL DEFAULT 'stock',
            source VARCHAR(20) NOT NULL DEFAULT 'api',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY unique_symbol_timestamp (symbol, timestamp)
        );
        CREATE INDEX idx_market_data_symbol ON market_data(symbol);
        CREATE INDEX idx_market_data_timestamp ON market_data(timestamp);
        CREATE INDEX idx_market_data_symbol_timestamp ON market_data(symbol, timestamp);
        CREATE INDEX idx_market_data_data_type ON market_data(data_type);
        """
        async with self.connection_pool.acquire() as conn:
            async with conn.cursor() as cursor:
                for statement in create_table_sql.split(';'):
                    if statement.strip():
                        await cursor.execute(statement)
            await conn.commit()
        logger.info("MySQL tables created/verified")

    async def load_data(self, data: List[MarketDataPoint]) -> int:
        """Load market data into MySQL"""
        if not data:
            return 0
        insert_sql = """
        INSERT INTO market_data (
            symbol, timestamp, open_price, high_price, low_price, close_price,
            volume, market_cap, pe_ratio, dividend_yield, data_type, source
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE
            open_price = VALUES(open_price),
            high_price = VALUES(high_price),
            low_price = VALUES(low_price),
            close_price = VALUES(close_price),
            volume = VALUES(volume),
            market_cap = VALUES(market_cap),
            pe_ratio = VALUES(pe_ratio),
            dividend_yield = VALUES(dividend_yield),
            data_type = VALUES(data_type),
            source = VALUES(source),
            updated_at = CURRENT_TIMESTAMP
        """
        rows_inserted = 0
        async with self.connection_pool.acquire() as conn:
            async with conn.cursor() as cursor:
                for item in data:
                    try:
                        await cursor.execute(
                            insert_sql,
                            (
                                item.symbol,
                                item.timestamp,
                                item.open_price,
                                item.high_price,
                                item.low_price,
                                item.close_price,
                                item.volume,
                                item.market_cap,
                                item.pe_ratio,
                                item.dividend_yield,
                                item.data_type.value,
                                item.source.value
                            )
                        )
                        rows_inserted += 1
                    except Exception as e:
                        logger.error(f"Error inserting data for {item.symbol}: {e}")
                await conn.commit()
        logger.info(f"Loaded {rows_inserted} records into MySQL")
        return rows_inserted

    async def get_latest_data(self, symbol: str, limit: int = 100) -> List[Dict[str, Any]]:
        """Get latest data for a symbol"""
        query = """
        SELECT * FROM market_data
        WHERE symbol = %s
        ORDER BY timestamp DESC
        LIMIT %s
        """
        async with self.connection_pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cursor:
                await cursor.execute(query, (symbol, limit))
                rows = await cursor.fetchall()
                return rows

    async def get_data_by_date_range(self, symbol: str, start_date: datetime, end_date: datetime) -> List[Dict[str, Any]]:
        """Get data for a symbol within date range"""
        query = """
        SELECT * FROM market_data
        WHERE symbol = %s AND timestamp BETWEEN %s AND %s
        ORDER BY timestamp ASC
        """
        async with self.connection_pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cursor:
                await cursor.execute(query, (symbol, start_date, end_date))
                rows = await cursor.fetchall()
                return rows

    async def delete_data(self, symbol: str, before_date: Optional[datetime] = None) -> int:
        """Delete data for a symbol, optionally before a specific date"""
        if before_date:
            query = "DELETE FROM market_data WHERE symbol = %s AND timestamp < %s"
            params = (symbol, before_date)
        else:
            query = "DELETE FROM market_data WHERE symbol = %s"
            params = (symbol,)
        async with self.connection_pool.acquire() as conn:
            async with conn.cursor() as cursor:
                await cursor.execute(query, params)
                deleted_count = cursor.rowcount
                await conn.commit()
                logger.info(f"Deleted {deleted_count} records for {symbol}")
                return deleted_count

    async def get_symbols(self) -> List[str]:
        """Get list of all symbols in database"""
        query = "SELECT DISTINCT symbol FROM market_data ORDER BY symbol"
        async with self.connection_pool.acquire() as conn:
            async with conn.cursor() as cursor:
                await cursor.execute(query)
                rows = await cursor.fetchall()
                return [row[0] for row in rows]

    async def get_data_count(self, symbol: Optional[str] = None) -> int:
        """Get total count of data points, optionally for a specific symbol"""
        if symbol:
            query = "SELECT COUNT(*) FROM market_data WHERE symbol = %s"
            params = (symbol,)
        else:
            query = "SELECT COUNT(*) FROM market_data"
            params = ()
        async with self.connection_pool.acquire() as conn:
            async with conn.cursor() as cursor:
                await cursor.execute(query, params)
                result = await cursor.fetchone()
                return result[0] if result else 0

@asynccontextmanager
async def get_db_loader(config: DatabaseConfig) -> DatabaseLoader:
    """
    Asynchronous context manager to get a database loader instance.
    Ensures connection and disconnection are handled properly.
    """
    loader: Optional[DatabaseLoader] = None
    if config.db_type == "postgresql":
        loader = PostgreSQLLoader(config)
    elif config.db_type == "sqlite":
        loader = SQLiteLoader(config)
    elif config.db_type == "mongodb":
        loader = MongoDBLoader(config)
    elif config.db_type == "mysql":
        loader = MySQLLoader(config)
    else:
        raise ValueError(f"Unsupported database type: {config.db_type}")

    if loader:
        await loader.connect()
        try:
            yield loader
        finally:
            await loader.disconnect()
    else:
        raise ValueError("Failed to initialize database loader.")

async def main():
    """
    Main function to demonstrate database loader usage.
    This will create a SQLite database for demonstration purposes.
    """
    logging.basicConfig(level=logging.INFO,
                        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')

    # Example usage for SQLite
    sqlite_config = DatabaseConfig(db_type="sqlite", sqlite_path="data/market_data.db")
    print(f"Attempting to connect to SQLite at {sqlite_config.sqlite_path}")
    try:
        async with get_db_loader(sqlite_config) as sqlite_loader:
            print("SQLite Loader connected.")
            # Example data
            data_points = [
                MarketDataPoint(
                    symbol="AAPL",
                    timestamp=datetime(2023, 1, 1, 9, 30),
                    open_price=170.0,
                    high_price=172.0,
                    low_price=169.5,
                    close_price=171.5,
                    volume=1000000,
                    market_cap=2.7e12,
                    pe_ratio=28.5,
                    dividend_yield=0.005,
                    data_type=MarketDataType.STOCK,
                    source=DataSource.API
                ),
                MarketDataPoint(
                    symbol="AAPL",
                    timestamp=datetime(2023, 1, 2, 9, 30),
                    open_price=171.0,
                    high_price=173.0,
                    low_price=170.5,
                    close_price=172.5,
                    volume=1200000,
                    data_type=MarketDataType.STOCK
                ),
                MarketDataPoint(
                    symbol="GOOGL",
                    timestamp=datetime(2023, 1, 1, 9, 30),
                    open_price=100.0,
                    high_price=101.0,
                    low_price=99.5,
                    close_price=100.5,
                    volume=500000,
                    data_type=MarketDataType.STOCK
                ),
                MarketDataPoint(
                    symbol="BTC",
                    timestamp=datetime(2023, 1, 1, 0, 0),
                    open_price=16500.0,
                    high_price=16700.0,
                    low_price=16400.0,
                    close_price=16600.0,
                    volume=25000,
                    data_type=MarketDataType.CRYPTO,
                    source=DataSource.API
                )
            ]

            # Load data
            print("\nLoading data into SQLite...")
            loaded_count = await sqlite_loader.load_data(data_points)
            print(f"Successfully loaded {loaded_count} records.")

            # Get data count
            total_count = await sqlite_loader.get_data_count()
            print(f"Total records in SQLite: {total_count}")
            aapl_count = await sqlite_loader.get_data_count(symbol="AAPL")
            print(f"AAPL records in SQLite: {aapl_count}")

            # Get latest data
            print("\nGetting latest 2 AAPL data points:")
            latest_aapl = await sqlite_loader.get_latest_data("AAPL", limit=2)
            for data_point in latest_aapl:
                print(data_point)

            # Get data by date range
            print("\nGetting AAPL data for 2023-01-01 to 2023-01-02:")
            start_date = datetime(2023, 1, 1)
            end_date = datetime(2023, 1, 2, 23, 59, 59)
            ranged_aapl = await sqlite_loader.get_data_by_date_range("AAPL", start_date, end_date)
            for data_point in ranged_aapl:
                print(data_point)

            # Get symbols
            print("\nGetting all symbols:")
            symbols = await sqlite_loader.get_symbols()
            print(symbols)

            # Delete data
            print("\nDeleting old AAPL data (before 2023-01-02):")
            deleted_count = await sqlite_loader.delete_data("AAPL", before_date=datetime(2023, 1, 2))
            print(f"Deleted {deleted_count} AAPL records.")

            total_count_after_delete = await sqlite_loader.get_data_count()
            print(f"Total records in SQLite after delete: {total_count_after_delete}")

    except Exception as e:
        print(f"An error occurred during SQLite demonstration: {e}")

    # Example usage for PostgreSQL (uncomment and configure if you have PostgreSQL running)
    # postgres_config = DatabaseConfig(
    #     db_type="postgresql",
    #     host="localhost",
    #     port=5432,
    #     database="market_data_test",
    #     username="your_user",
    #     password="your_password"
    # )
    # print(f"\nAttempting to connect to PostgreSQL at {postgres_config.host}:{postgres_config.port}/{postgres_config.database}")
    # try:
    #     async with get_db_loader(postgres_config) as pg_loader:
    #         print("PostgreSQL Loader connected.")
    #         # Perform similar load/get/delete operations as with SQLite
    #         # loaded_count = await pg_loader.load_data(data_points)
    #         # ...
    # except Exception as e:
    #     print(f"An error occurred during PostgreSQL demonstration: {e}")

    # Example usage for MongoDB (uncomment and configure if you have MongoDB running)
    # mongodb_config = DatabaseConfig(
    #     db_type="mongodb",
    #     host="localhost",
    #     port=27017,
    #     database="market_data_test",
    #     collection_name="market_data"
    # )
    # print(f"\nAttempting to connect to MongoDB at {mongodb_config.host}:{mongodb_config.port}/{mongodb_config.database}")
    # try:
    #     async with get_db_loader(mongodb_config) as mongo_loader:
    #         print("MongoDB Loader connected.")
    #         # Perform similar load/get/delete operations as with SQLite
    #         # loaded_count = await mongo_loader.load_data(data_points)
    #         # ...
    # except Exception as e:
    #     print(f"An error occurred during MongoDB demonstration: {e}")

    # Example usage for MySQL (uncomment and configure if you have MySQL running)
    # mysql_config = DatabaseConfig(
    #     db_type="mysql",
    #     host="localhost",
    #     port=3306,
    #     database="market_data_test",
    #     username="your_user",
    #     password="your_password"
    # )
    # print(f"\nAttempting to connect to MySQL at {mysql_config.host}:{mysql_config.port}/{mysql_config.database}")
    # try:
    #     async with get_db_loader(mysql_config) as mysql_loader:
    #         print("MySQL Loader connected.")
    #         # Perform similar load/get/delete operations as with SQLite
    #         # loaded_count = await mysql_loader.load_data(data_points)
    #         # ...
    # except Exception as e:
    #     print(f"An error occurred during MySQL demonstration: {e}")


if __name__ == "__main__":
    asyncio.run(main())


