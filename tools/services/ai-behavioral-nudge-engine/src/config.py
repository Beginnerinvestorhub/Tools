# services/ai-behavioral-nudge-engine/src/config.py
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Config:
    """
    Configuration class for the AI Behavioral Nudge Engine.
    Loads settings from environment variables.
    """
    API_PORT: int = int(os.getenv("PORT", 8000))
    API_HOST: str = os.getenv("HOST", "0.0.0.0")
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "info")
    # Add other configuration variables like database connections,
    # external service URLs, or model paths if needed
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./nudge_data.db")
    # Example for a mock external model path
    NUDGE_MODEL_PATH: str = os.getenv("NUDGE_MODEL_PATH", "./models/nudge_model.pkl")

config = Config()


