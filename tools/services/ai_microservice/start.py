"""
Startup script for AI Behavioral Nudge System
"""

import uvicorn
import sys
import os

# This script runs from the service root, so we import from the `src` package.
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from src.config import API_HOST, API_PORT, LOG_LEVEL

if __name__ == "__main__":
    uvicorn.run(
        "src.main:app",  # Points to the app object in src/main.py
        host=API_HOST,
        port=API_PORT,
        reload=True,  # Enable auto-reload for development
        log_level=LOG_LEVEL.lower()
    )
