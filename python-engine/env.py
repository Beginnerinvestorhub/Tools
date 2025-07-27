import os
from typing import Optional

class EnvironmentConfig:
    def __init__(self):
        self._validate_environment()
    
    def _validate_environment(self):
        """Validate required environment variables and fail fast if missing."""
        required_vars = [
            # Add required environment variables here
            # Example: 'DATABASE_URL', 'OPENAI_API_KEY'
        ]
        
        missing_vars = []
        for var in required_vars:
            if not os.getenv(var):
                missing_vars.append(var)
        
        if missing_vars:
            raise ValueError(f"Missing required environment variables: {', '.join(missing_vars)}")
        
        print("✅ All required environment variables are present")
    
    @property
    def port(self) -> int:
        return int(os.getenv('PORT', '8000'))
    
    @property
    def environment(self) -> str:
        return os.getenv('ENVIRONMENT', 'development')

# Initialize environment config
env_config = EnvironmentConfig()
