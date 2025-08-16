"""
Configuration settings for AI Behavioral Nudge System
"""

import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Database Configuration
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@localhost:5432/investor_hub")

# API Configuration
API_HOST = os.getenv("API_HOST", "0.0.0.0")
API_PORT = int(os.getenv("API_PORT", "8000"))

# CORS Configuration
ALLOWED_ORIGINS = [
    "http://localhost:3000",  # Frontend development
    "http://localhost:4000",  # Backend development
    # Add production URLs as needed
]

# AI Model Configuration
AI_CONFIG = {
    "max_recommendations": 5,
    "confidence_threshold": 0.3,
    "nudge_frequency_hours": 24,  # Minimum hours between nudges
    "content_similarity_threshold": 0.7,
}

# Logging Configuration
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")

# Security Configuration
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key-here")
JWT_ALGORITHM = "HS256"
