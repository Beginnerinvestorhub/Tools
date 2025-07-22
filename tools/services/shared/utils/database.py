"""
Shared database utilities for all Python services.
Provides standardized database connection, session management, and common operations.
"""

import asyncio
from typing import AsyncGenerator, Optional, Dict, Any, List
from contextlib import asynccontextmanager
from sqlalchemy import create_engine, MetaData, text
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import sessionmaker, Session, declarative_base
from sqlalchemy.pool import QueuePool
from sqlalchemy.exc import SQLAlchemyError
from loguru import logger

from ..config.base_config import BaseServiceConfig


# ==============================================================================
# BASE MODEL AND METADATA
# ==============================================================================

Base = declarative_base()
metadata = MetaData()


# ==============================================================================
# DATABASE CONNECTION MANAGER
# ==============================================================================

class DatabaseManager:
    """Manages database connections and sessions for a service."""
    
    def __init__(self, config: BaseServiceConfig):
        self.config = config
        self.engine = None
        self.async_engine = None
        self.session_factory = None
        self.async_session_factory = None
        self._initialized = False
    
    def initialize_sync(self) -> None:
        """Initialize synchronous database connection."""
        if not self.config.DATABASE_URL:
            logger.warning("No DATABASE_URL configured, skipping sync database initialization")
            return
        
        try:
            self.engine = create_engine(
                self.config.DATABASE_URL,
                poolclass=QueuePool,
                pool_size=self.config.DATABASE_POOL_SIZE,
                max_overflow=self.config.DATABASE_MAX_OVERFLOW,
                pool_pre_ping=True,
                pool_recycle=3600,  # Recycle connections every hour
                echo=self.config.DATABASE_ECHO,
            )
            
            self.session_factory = sessionmaker(
                bind=self.engine,
                autocommit=False,
                autoflush=False,
            )
            
            logger.info("Synchronous database connection initialized")
            
        except Exception as e:
            logger.error(f"Failed to initialize sync database: {e}")
            raise
    
    def initialize_async(self) -> None:
        """Initialize asynchronous database connection."""
        if not self.config.DATABASE_URL:
            logger.warning("No DATABASE_URL configured, skipping async database initialization")
            return
        
        try:
            # Convert sync URL to async if needed
            async_url = self.config.DATABASE_URL
            if async_url.startswith("postgresql://"):
                async_url = async_url.replace("postgresql://", "postgresql+asyncpg://", 1)
            elif async_url.startswith("mysql://"):
                async_url = async_url.replace("mysql://", "mysql+aiomysql://", 1)
            
            self.async_engine = create_async_engine(
                async_url,
                pool_size=self.config.DATABASE_POOL_SIZE,
                max_overflow=self.config.DATABASE_MAX_OVERFLOW,
                pool_pre_ping=True,
                pool_recycle=3600,
                echo=self.config.DATABASE_ECHO,
            )
            
            self.async_session_factory = async_sessionmaker(
                bind=self.async_engine,
                class_=AsyncSession,
                autocommit=False,
                autoflush=False,
            )
            
            logger.info("Asynchronous database connection initialized")
            
        except Exception as e:
            logger.error(f"Failed to initialize async database: {e}")
            raise
    
    def initialize(self, async_mode: bool = True) -> None:
        """Initialize database connections."""
        if self._initialized:
            return
        
        if async_mode:
            self.initialize_async()
        else:
            self.initialize_sync()
        
        self._initialized = True
    
    @asynccontextmanager
    async def get_async_session(self) -> AsyncGenerator[AsyncSession, None]:
        """Get an async database session with automatic cleanup."""
        if not self.async_session_factory:
            raise RuntimeError("Async database not initialized")
        
        async with self.async_session_factory() as session:
            try:
                yield session
                await session.commit()
            except Exception:
                await session.rollback()
                raise
            finally:
                await session.close()
    
    def get_sync_session(self) -> Session:
        """Get a sync database session."""
        if not self.session_factory:
            raise RuntimeError("Sync database not initialized")
        
        return self.session_factory()
    
    async def health_check(self) -> bool:
        """Check database connectivity."""
        try:
            if self.async_engine:
                async with self.async_engine.begin() as conn:
                    await conn.execute(text("SELECT 1"))
                return True
            elif self.engine:
                with self.engine.begin() as conn:
                    conn.execute(text("SELECT 1"))
                return True
            else:
                return False
        except Exception as e:
            logger.error(f"Database health check failed: {e}")
            return False
    
    async def close(self) -> None:
        """Close database connections."""
        try:
            if self.async_engine:
                await self.async_engine.dispose()
            if self.engine:
                self.engine.dispose()
            logger.info("Database connections closed")
        except Exception as e:
            logger.error(f"Error closing database connections: {e}")


# ==============================================================================
# GLOBAL DATABASE INSTANCE
# ==============================================================================

_db_manager: Optional[DatabaseManager] = None


def get_database_manager(config: BaseServiceConfig = None) -> DatabaseManager:
    """Get or create the global database manager instance."""
    global _db_manager
    
    if _db_manager is None:
        if config is None:
            raise RuntimeError("Database manager not initialized and no config provided")
        _db_manager = DatabaseManager(config)
    
    return _db_manager


def initialize_database(config: BaseServiceConfig, async_mode: bool = True) -> DatabaseManager:
    """Initialize the global database manager."""
    global _db_manager
    _db_manager = DatabaseManager(config)
    _db_manager.initialize(async_mode=async_mode)
    return _db_manager


# ==============================================================================
# DEPENDENCY INJECTION FOR FASTAPI
# ==============================================================================

async def get_async_db_session() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency for async database sessions."""
    db_manager = get_database_manager()
    async with db_manager.get_async_session() as session:
        yield session


def get_sync_db_session() -> Session:
    """FastAPI dependency for sync database sessions."""
    db_manager = get_database_manager()
    session = db_manager.get_sync_session()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


# ==============================================================================
# COMMON DATABASE OPERATIONS
# ==============================================================================

class BaseRepository:
    """Base repository class with common database operations."""
    
    def __init__(self, session: AsyncSession, model_class):
        self.session = session
        self.model_class = model_class
    
    async def create(self, **kwargs) -> Any:
        """Create a new record."""
        try:
            instance = self.model_class(**kwargs)
            self.session.add(instance)
            await self.session.flush()
            await self.session.refresh(instance)
            return instance
        except SQLAlchemyError as e:
            logger.error(f"Error creating {self.model_class.__name__}: {e}")
            raise
    
    async def get_by_id(self, id: Any) -> Optional[Any]:
        """Get a record by ID."""
        try:
            return await self.session.get(self.model_class, id)
        except SQLAlchemyError as e:
            logger.error(f"Error getting {self.model_class.__name__} by ID {id}: {e}")
            raise
    
    async def get_all(self, limit: int = 100, offset: int = 0) -> List[Any]:
        """Get all records with pagination."""
        try:
            result = await self.session.execute(
                text(f"SELECT * FROM {self.model_class.__tablename__} LIMIT :limit OFFSET :offset"),
                {"limit": limit, "offset": offset}
            )
            return result.fetchall()
        except SQLAlchemyError as e:
            logger.error(f"Error getting all {self.model_class.__name__}: {e}")
            raise
    
    async def update(self, id: Any, **kwargs) -> Optional[Any]:
        """Update a record by ID."""
        try:
            instance = await self.get_by_id(id)
            if instance:
                for key, value in kwargs.items():
                    setattr(instance, key, value)
                await self.session.flush()
                await self.session.refresh(instance)
            return instance
        except SQLAlchemyError as e:
            logger.error(f"Error updating {self.model_class.__name__} {id}: {e}")
            raise
    
    async def delete(self, id: Any) -> bool:
        """Delete a record by ID."""
        try:
            instance = await self.get_by_id(id)
            if instance:
                await self.session.delete(instance)
                await self.session.flush()
                return True
            return False
        except SQLAlchemyError as e:
            logger.error(f"Error deleting {self.model_class.__name__} {id}: {e}")
            raise
    
    async def count(self) -> int:
        """Count total records."""
        try:
            result = await self.session.execute(
                text(f"SELECT COUNT(*) FROM {self.model_class.__tablename__}")
            )
            return result.scalar()
        except SQLAlchemyError as e:
            logger.error(f"Error counting {self.model_class.__name__}: {e}")
            raise


# ==============================================================================
# DATABASE UTILITIES
# ==============================================================================

async def execute_raw_query(query: str, params: Dict[str, Any] = None) -> List[Dict]:
    """Execute a raw SQL query and return results."""
    db_manager = get_database_manager()
    
    async with db_manager.get_async_session() as session:
        try:
            result = await session.execute(text(query), params or {})
            columns = result.keys()
            rows = result.fetchall()
            return [dict(zip(columns, row)) for row in rows]
        except SQLAlchemyError as e:
            logger.error(f"Error executing raw query: {e}")
            raise


async def bulk_insert(model_class, data: List[Dict[str, Any]]) -> int:
    """Bulk insert data into a table."""
    db_manager = get_database_manager()
    
    async with db_manager.get_async_session() as session:
        try:
            instances = [model_class(**item) for item in data]
            session.add_all(instances)
            await session.flush()
            return len(instances)
        except SQLAlchemyError as e:
            logger.error(f"Error bulk inserting {model_class.__name__}: {e}")
            raise


async def create_tables(engine=None):
    """Create all tables defined in Base metadata."""
    if engine is None:
        db_manager = get_database_manager()
        engine = db_manager.async_engine
    
    if engine:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Database tables created successfully")
    else:
        logger.warning("No database engine available for table creation")


async def drop_tables(engine=None):
    """Drop all tables defined in Base metadata."""
    if engine is None:
        db_manager = get_database_manager()
        engine = db_manager.async_engine
    
    if engine:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)
        logger.info("Database tables dropped successfully")
    else:
        logger.warning("No database engine available for table dropping")


# ==============================================================================
# TRANSACTION DECORATORS
# ==============================================================================

def transactional(func):
    """Decorator to wrap function in a database transaction."""
    async def wrapper(*args, **kwargs):
        db_manager = get_database_manager()
        async with db_manager.get_async_session() as session:
            try:
                # Add session to kwargs if not present
                if 'session' not in kwargs:
                    kwargs['session'] = session
                
                result = await func(*args, **kwargs)
                await session.commit()
                return result
            except Exception:
                await session.rollback()
                raise
    
    return wrapper


# ==============================================================================
# MIGRATION UTILITIES
# ==============================================================================

async def run_migrations(migration_dir: str = "migrations"):
    """Run database migrations using Alembic."""
    try:
        from alembic.config import Config
        from alembic import command
        
        alembic_cfg = Config(f"{migration_dir}/alembic.ini")
        command.upgrade(alembic_cfg, "head")
        logger.info("Database migrations completed successfully")
    except ImportError:
        logger.warning("Alembic not installed, skipping migrations")
    except Exception as e:
        logger.error(f"Error running migrations: {e}")
        raise


# ==============================================================================
# USAGE EXAMPLE
# ==============================================================================

if __name__ == "__main__":
    import asyncio
    from ..config.base_config import get_config
    
    async def example_usage():
        # Initialize database
        config = get_config("market-data-ingestion")
        db_manager = initialize_database(config, async_mode=True)
        
        # Health check
        is_healthy = await db_manager.health_check()
        print(f"Database healthy: {is_healthy}")
        
        # Example raw query
        try:
            results = await execute_raw_query("SELECT 1 as test")
            print(f"Query results: {results}")
        except Exception as e:
            print(f"Query failed: {e}")
        
        # Close connections
        await db_manager.close()
    
    asyncio.run(example_usage())
