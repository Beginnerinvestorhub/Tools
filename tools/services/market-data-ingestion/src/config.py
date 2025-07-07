import os
from typing import Optional, List
from pydantic import BaseSettings, validator, Field
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings and configuration."""
    
    # Application Settings
    app_name: str = "Market Data Ingestion Service"
    app_version: str = "1.0.0"
    debug: bool = Field(default=False, env="DEBUG")
    environment: str = Field(default="development", env="ENVIRONMENT")
    
    # Server Settings
    host: str = Field(default="0.0.0.0", env="HOST")
    port: int = Field(default=8000, env="PORT")
    reload: bool = Field(default=False, env="RELOAD")
    
    # Database Settings
    database_url: str = Field(
        default="postgresql://user:password@localhost:5432/market_data",
        env="DATABASE_URL"
    )
    database_pool_size: int = Field(default=20, env="DATABASE_POOL_SIZE")
    database_max_overflow: int = Field(default=0, env="DATABASE_MAX_OVERFLOW")
    
    # Redis Settings
    redis_url: str = Field(default="redis://localhost:6379", env="REDIS_URL")
    redis_db: int = Field(default=0, env="REDIS_DB")
    redis_password: Optional[str] = Field(default=None, env="REDIS_PASSWORD")
    redis_max_connections: int = Field(default=10, env="REDIS_MAX_CONNECTIONS")
    
    # API Keys
    alpha_vantage_api_key: Optional[str] = Field(default=None, env="ALPHA_VANTAGE_API_KEY")
    polygon_api_key: Optional[str] = Field(default=None, env="POLYGON_API_KEY")
    finnhub_api_key: Optional[str] = Field(default=None, env="FINNHUB_API_KEY")
    iex_api_key: Optional[str] = Field(default=None, env="IEX_API_KEY")
    
    # Rate Limiting
    rate_limit_requests: int = Field(default=100, env="RATE_LIMIT_REQUESTS")
    rate_limit_period: int = Field(default=60, env="RATE_LIMIT_PERIOD")
    
    # Data Ingestion Settings
    batch_size: int = Field(default=100, env="BATCH_SIZE")
    max_retries: int = Field(default=3, env="MAX_RETRIES")
    retry_delay: float = Field(default=1.0, env="RETRY_DELAY")
    request_timeout: int = Field(default=30, env="REQUEST_TIMEOUT")
    
    # Supported Symbols
    default_symbols: List[str] = Field(
        default=[
            "AAPL", "MSFT", "GOOGL", "AMZN", "TSLA", "META", "NVDA", "NFLX",
            "SPY", "QQQ", "VTI", "BTC-USD", "ETH-USD"
        ],
        env="DEFAULT_SYMBOLS"
    )
    
    # Scheduling
    market_hours_start: str = Field(default="09:30", env="MARKET_HOURS_START")
    market_hours_end: str = Field(default="16:00", env="MARKET_HOURS_END")
    market_timezone: str = Field(default="America/New_York", env="MARKET_TIMEZONE")
    
    # Data refresh intervals (in seconds)
    real_time_interval: int = Field(default=1, env="REAL_TIME_INTERVAL")
    intraday_interval: int = Field(default=300, env="INTRADAY_INTERVAL")  # 5 minutes
    daily_interval: int = Field(default=3600, env="DAILY_INTERVAL")  # 1 hour
    
    # Celery Settings
    celery_broker_url: str = Field(default="redis://localhost:6379/1", env="CELERY_BROKER_URL")
    celery_result_backend: str = Field(default="redis://localhost:6379/2", env="CELERY_RESULT_BACKEND")
    celery_task_serializer: str = Field(default="json", env="CELERY_TASK_SERIALIZER")
    celery_accept_content: List[str] = Field(default=["json"], env="CELERY_ACCEPT_CONTENT")
    celery_timezone: str = Field(default="UTC", env="CELERY_TIMEZONE")
    
    # Logging Settings
    log_level: str = Field(default="INFO", env="LOG_LEVEL")
    log_format: str = Field(
        default="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        env="LOG_FORMAT"
    )
    log_file: str = Field(default="logs/market_data.log", env="LOG_FILE")
    log_rotation: str = Field(default="10 MB", env="LOG_ROTATION")
    log_retention: str = Field(default="30 days", env="LOG_RETENTION")
    
    # Security Settings
    secret_key: str = Field(default="your-secret-key-here", env="SECRET_KEY")
    allowed_hosts: List[str] = Field(default=["*"], env="ALLOWED_HOSTS")
    
    # Monitoring Settings
    enable_metrics: bool = Field(default=True, env="ENABLE_METRICS")
    metrics_port: int = Field(default=8001, env="METRICS_PORT")
    health_check_interval: int = Field(default=30, env="HEALTH_CHECK_INTERVAL")
    
    # WebSocket Settings
    websocket_max_connections: int = Field(default=100, env="WEBSOCKET_MAX_CONNECTIONS")
    websocket_ping_interval: int = Field(default=20, env="WEBSOCKET_PING_INTERVAL")
    websocket_ping_timeout: int = Field(default=10, env="WEBSOCKET_PING_TIMEOUT")
    
    # Cache Settings
    cache_ttl_quotes: int = Field(default=60, env="CACHE_TTL_QUOTES")  # 1 minute
    cache_ttl_daily: int = Field(default=3600, env="CACHE_TTL_DAILY")  # 1 hour
    cache_ttl_historical: int = Field(default=86400, env="CACHE_TTL_HISTORICAL")  # 24 hours
    
    # Data Quality Settings
    price_change_threshold: float = Field(default=0.5, env="PRICE_CHANGE_THRESHOLD")  # 50%
    volume_spike_threshold: float = Field(default=3.0, env="VOLUME_SPIKE_THRESHOLD")  # 3x average
    
    @validator("database_url")
    def validate_database_url(cls, v):
        if not v.startswith(("postgresql://", "sqlite:///")):
            raise ValueError("Database URL must start with postgresql:// or sqlite:///")
        return v
    
    @validator("redis_url")
    def validate_redis_url(cls, v):
        if not v.startswith("redis://"):
            raise ValueError("Redis URL must start with redis://")
        return v
    
    @validator("log_level")
    def validate_log_level(cls, v):
        valid_levels = ["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"]
        if v.upper() not in valid_levels:
            raise ValueError(f"Log level must be one of: {valid_levels}")
        return v.upper()
    
    @validator("environment")
    def validate_environment(cls, v):
        valid_envs = ["development", "staging", "production"]
        if v not in valid_envs:
            raise ValueError(f"Environment must be one of: {valid_envs}")
        return v
    
    @validator("default_symbols")
    def validate_symbols(cls, v):
        if isinstance(v, str):
            return [s.strip().upper() for s in v.split(",")]
        return [s.upper() for s in v]
    
    @validator("allowed_hosts")
    def validate_allowed_hosts(cls, v):
        if isinstance(v, str):
            return [h.strip() for h in v.split(",")]
        return v
    
    @validator("celery_accept_content")
    def validate_celery_accept_content(cls, v):
        if isinstance(v, str):
            return [c.strip() for c in v.split(",")]
        return v
    
    @property
    def is_production(self) -> bool:
        """Check if running in production environment."""
        return self.environment == "production"
    
    @property
    def is_development(self) -> bool:
        """Check if running in development environment."""
        return self.environment == "development"
    
    @property
    def database_config(self) -> dict:
        """Get database configuration for SQLAlchemy."""
        return {
            "url": self.database_url,
            "pool_size": self.database_pool_size,
            "max_overflow": self.database_max_overflow,
            "echo": self.debug and not self.is_production,
        }
    
    @property
    def redis_config(self) -> dict:
        """Get Redis configuration."""
        return {
            "url": self.redis_url,
            "db": self.redis_db,
            "password": self.redis_password,
            "max_connections": self.redis_max_connections,
        }
    
    @property
    def celery_config(self) -> dict:
        """Get Celery configuration."""
        return {
            "broker_url": self.celery_broker_url,
            "result_backend": self.celery_result_backend,
            "task_serializer": self.celery_task_serializer,
            "accept_content": self.celery_accept_content,
            "timezone": self.celery_timezone,
            "enable_utc": True,
        }
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()


# Create settings instance
settings = get_settings()
