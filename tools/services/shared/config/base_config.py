"""
Shared configuration base class for all Python services.
This provides a standardized configuration interface across all services.
"""

import os
from typing import List, Optional
from pydantic import BaseSettings, validator
from functools import lru_cache


class BaseServiceConfig(BaseSettings):
    """Base configuration class that all services should inherit from."""
    
    # ==============================================================================
    # SERVICE IDENTIFICATION
    # ==============================================================================
    SERVICE_NAME: str = "unknown-service"
    SERVICE_VERSION: str = "1.0.0"
    SERVICE_DESCRIPTION: str = "A Python microservice"
    
    # ==============================================================================
    # SERVER CONFIGURATION
    # ==============================================================================
    SERVICE_HOST: str = "0.0.0.0"
    SERVICE_PORT: int = 8000
    DEBUG: bool = False
    RELOAD: bool = False
    
    # ==============================================================================
    # DATABASE CONFIGURATION
    # ==============================================================================
    DATABASE_URL: Optional[str] = None
    DATABASE_POOL_SIZE: int = 10
    DATABASE_MAX_OVERFLOW: int = 20
    DATABASE_ECHO: bool = False
    
    # ==============================================================================
    # REDIS CONFIGURATION
    # ==============================================================================
    REDIS_URL: str = "redis://localhost:6379/0"
    REDIS_POOL_SIZE: int = 10
    REDIS_DECODE_RESPONSES: bool = True
    
    # ==============================================================================
    # SECURITY CONFIGURATION
    # ==============================================================================
    SECRET_KEY: str = "your-secret-key-change-in-production"
    JWT_SECRET: str = "your-jwt-secret-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_HOURS: int = 24
    
    # ==============================================================================
    # CORS CONFIGURATION
    # ==============================================================================
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:3001"]
    ALLOWED_HOSTS: List[str] = ["localhost", "127.0.0.1"]
    
    # ==============================================================================
    # LOGGING CONFIGURATION
    # ==============================================================================
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "json"  # json or text
    LOG_FILE: Optional[str] = None
    
    # ==============================================================================
    # EXTERNAL API KEYS
    # ==============================================================================
    ALPHA_VANTAGE_API_KEY: Optional[str] = None
    POLYGON_API_KEY: Optional[str] = None
    YFINANCE_ENABLED: bool = True
    
    # ==============================================================================
    # CELERY CONFIGURATION
    # ==============================================================================
    CELERY_BROKER_URL: Optional[str] = None
    CELERY_RESULT_BACKEND: Optional[str] = None
    CELERY_TASK_SERIALIZER: str = "json"
    CELERY_RESULT_SERIALIZER: str = "json"
    
    # ==============================================================================
    # MONITORING & HEALTH CHECK
    # ==============================================================================
    HEALTH_CHECK_ENABLED: bool = True
    METRICS_ENABLED: bool = False
    SENTRY_DSN: Optional[str] = None
    
    # ==============================================================================
    # RATE LIMITING
    # ==============================================================================
    RATE_LIMIT_ENABLED: bool = True
    RATE_LIMIT_REQUESTS_PER_MINUTE: int = 100
    RATE_LIMIT_BURST: int = 200
    
    # ==============================================================================
    # VALIDATORS
    # ==============================================================================
    @validator('CORS_ORIGINS', pre=True)
    def parse_cors_origins(cls, v):
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(',')]
        return v
    
    @validator('ALLOWED_HOSTS', pre=True)
    def parse_allowed_hosts(cls, v):
        if isinstance(v, str):
            return [host.strip() for host in v.split(',')]
        return v
    
    @validator('LOG_LEVEL')
    def validate_log_level(cls, v):
        valid_levels = ['DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL']
        if v.upper() not in valid_levels:
            raise ValueError(f'LOG_LEVEL must be one of {valid_levels}')
        return v.upper()
    
    @validator('LOG_FORMAT')
    def validate_log_format(cls, v):
        valid_formats = ['json', 'text']
        if v.lower() not in valid_formats:
            raise ValueError(f'LOG_FORMAT must be one of {valid_formats}')
        return v.lower()
    
    # ==============================================================================
    # ENVIRONMENT CONFIGURATION
    # ==============================================================================
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True
        
    # ==============================================================================
    # UTILITY METHODS
    # ==============================================================================
    @property
    def is_production(self) -> bool:
        """Check if running in production environment."""
        return not self.DEBUG
    
    @property
    def database_config(self) -> dict:
        """Get database configuration dictionary."""
        return {
            "url": self.DATABASE_URL,
            "pool_size": self.DATABASE_POOL_SIZE,
            "max_overflow": self.DATABASE_MAX_OVERFLOW,
            "echo": self.DATABASE_ECHO,
        }
    
    @property
    def redis_config(self) -> dict:
        """Get Redis configuration dictionary."""
        return {
            "url": self.REDIS_URL,
            "pool_size": self.REDIS_POOL_SIZE,
            "decode_responses": self.REDIS_DECODE_RESPONSES,
        }
    
    @property
    def cors_config(self) -> dict:
        """Get CORS configuration dictionary."""
        return {
            "allow_origins": self.CORS_ORIGINS,
            "allow_credentials": True,
            "allow_methods": ["*"],
            "allow_headers": ["*"],
        }
    
    def get_api_keys(self) -> dict:
        """Get all configured API keys."""
        return {
            "alpha_vantage": self.ALPHA_VANTAGE_API_KEY,
            "polygon": self.POLYGON_API_KEY,
            "yfinance_enabled": self.YFINANCE_ENABLED,
        }


# ==============================================================================
# SERVICE-SPECIFIC CONFIGURATIONS
# ==============================================================================

class MarketDataConfig(BaseServiceConfig):
    """Configuration for Market Data Ingestion Service."""
    
    SERVICE_NAME: str = "market-data-ingestion"
    SERVICE_DESCRIPTION: str = "Market data collection and processing service"
    SERVICE_PORT: int = 8001
    
    # Market data specific settings
    DATA_REFRESH_INTERVAL_MINUTES: int = 15
    BATCH_SIZE: int = 100
    MAX_RETRIES: int = 3
    TIMEOUT_SECONDS: int = 30


class RiskCalculationConfig(BaseServiceConfig):
    """Configuration for Risk Calculation Engine Service."""
    
    SERVICE_NAME: str = "risk-calculation-engine"
    SERVICE_DESCRIPTION: str = "Portfolio risk assessment and calculation service"
    SERVICE_PORT: int = 8002
    
    # Risk calculation specific settings
    RISK_MODEL_VERSION: str = "v2.1"
    MONTE_CARLO_SIMULATIONS: int = 10000
    CONFIDENCE_INTERVALS: List[float] = [0.95, 0.99]
    LOOKBACK_DAYS: int = 252


class AIBehavioralConfig(BaseServiceConfig):
    """Configuration for AI Behavioral Nudge Engine Service."""
    
    SERVICE_NAME: str = "ai-behavioral-nudge-engine"
    SERVICE_DESCRIPTION: str = "AI-powered behavioral bias detection and nudging service"
    SERVICE_PORT: int = 8003
    
    # AI/ML specific settings
    MODEL_PATH: str = "/models"
    BIAS_DETECTION_THRESHOLD: float = 0.7
    NUDGE_FREQUENCY_HOURS: int = 24
    ML_MODEL_VERSION: str = "v1.0"


# ==============================================================================
# CONFIGURATION FACTORY
# ==============================================================================

@lru_cache()
def get_config(service_name: str = None) -> BaseServiceConfig:
    """
    Factory function to get the appropriate configuration based on service name.
    Uses LRU cache to ensure singleton behavior.
    """
    service_name = service_name or os.getenv("SERVICE_NAME", "base")
    
    config_map = {
        "market-data-ingestion": MarketDataConfig,
        "risk-calculation-engine": RiskCalculationConfig,
        "ai-behavioral-nudge-engine": AIBehavioralConfig,
    }
    
    config_class = config_map.get(service_name, BaseServiceConfig)
    return config_class()


# ==============================================================================
# ENVIRONMENT VALIDATION
# ==============================================================================

def validate_environment():
    """Validate that all required environment variables are set."""
    config = get_config()
    
    # Critical validations
    if config.is_production:
        if config.SECRET_KEY == "your-secret-key-change-in-production":
            raise ValueError("SECRET_KEY must be set in production")
        
        if config.JWT_SECRET == "your-jwt-secret-change-in-production":
            raise ValueError("JWT_SECRET must be set in production")
        
        if not config.DATABASE_URL:
            raise ValueError("DATABASE_URL must be set in production")
    
    return True


# ==============================================================================
# USAGE EXAMPLE
# ==============================================================================
if __name__ == "__main__":
    # Example usage
    config = get_config("market-data-ingestion")
    print(f"Service: {config.SERVICE_NAME}")
    print(f"Port: {config.SERVICE_PORT}")
    print(f"Database: {config.DATABASE_URL}")
    print(f"Debug: {config.DEBUG}")
