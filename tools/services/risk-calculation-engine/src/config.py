import os
from dotenv import load_dotenv

# Load environment variables from .env file
# This assumes your .env file is in the root of the project or where you run the service from.
# If your .env is in a different location relative to the service, you might need to adjust the path.
load_dotenv()

class Settings:
    """
    Application settings loaded from environment variables.
    """
    APP_NAME: str = os.getenv("APP_NAME", "RiskCalculationEngine")
    APP_VERSION: str = "1.0.0" # You can manage this dynamically or via environment variable

    # Database settings (PostgreSQL - as assumed from project structure)
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://user:password@localhost:5432/risk_db")
    ASYNC_DATABASE_URL: str = os.getenv("ASYNC_DATABASE_URL", "postgresql+asyncpg://user:password@localhost:5432/risk_db")

    # Redis settings for caching/Celery broker
    REDIS_HOST: str = os.getenv("REDIS_HOST", "localhost")
    REDIS_PORT: int = int(os.getenv("REDIS_PORT", 6379))
    REDIS_DB: int = int(os.getenv("REDIS_DB", 0))

    # API Keys for external services (e.g., yfinance, Alpha Vantage, Polygon)
    YFINANCE_API_KEY: str = os.getenv("YFINANCE_API_KEY", "")
    ALPHA_VANTAGE_API_KEY: str = os.getenv("ALPHA_VANTAGE_API_KEY", "")
    POLYGON_API_KEY: str = os.getenv("POLYGON_API_KEY", "")

    # Celery settings
    CELERY_BROKER_URL: str = os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/1")
    CELERY_RESULT_BACKEND: str = os.getenv("CELERY_RESULT_BACKEND", "redis://localhost:6379/2")

    # Logging settings
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")

    # CORS settings for FastAPI (if applicable for API.py)
    # You might want to restrict these in production
    CORS_ORIGINS: list = os.getenv("CORS_ORIGINS", "*").split(',')
    CORS_METHODS: list = os.getenv("CORS_METHODS", "GET,POST,PUT,DELETE,OPTIONS").split(',')
    CORS_HEADERS: list = os.getenv("CORS_HEADERS", "*").split(',')

    # Example for risk engine specific parameters
    DEFAULT_RISK_TOLERANCE: float = float(os.getenv("DEFAULT_RISK_TOLERANCE", 0.5))
    SIMULATION_ITERATIONS: int = int(os.getenv("SIMULATION_ITERATIONS", 1000))

    # For development/production distinction
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development") # "development", "production", "testing"

# Create an instance of the settings for easy import
settings = Settings()

if __name__ == "__main__":
    # Example usage and verification
    print(f"App Name: {settings.APP_NAME}")
    print(f"Database URL: {settings.DATABASE_URL}")
    print(f"Redis Host: {settings.REDIS_HOST}:{settings.REDIS_PORT}")
    print(f"Environment: {settings.ENVIRONMENT}")
    print(f"CORS Origins: {settings.CORS_ORIGINS}")
