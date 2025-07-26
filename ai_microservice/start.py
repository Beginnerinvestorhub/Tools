"""
Startup script for AI Behavioral Nudge System
"""

import uvicorn
from config import API_HOST, API_PORT, LOG_LEVEL

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=API_HOST,
        port=API_PORT,
        reload=True,  # Enable auto-reload for development
        log_level=LOG_LEVEL.lower()
    )
