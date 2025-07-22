# Python Service Template Structure

This directory contains the standardized structure template for all Python services in the Beginner Investor Hub platform.

## 📁 Standard Service Directory Structure

```
service-name/
├── README.md                    # Service-specific documentation
├── requirements.txt             # Service-specific requirements (inherits from shared)
├── Dockerfile                   # Container configuration
├── docker-compose.yml           # Local development setup
├── .env.example                 # Environment variables template
├── .gitignore                   # Service-specific git ignores
├── pyproject.toml               # Python project configuration
├── src/                         # Source code directory
│   ├── __init__.py
│   ├── main.py                  # FastAPI application entry point
│   ├── config.py                # Configuration management
│   ├── models/                  # Pydantic models
│   │   ├── __init__.py
│   │   ├── requests.py          # Request models
│   │   └── responses.py         # Response models
│   ├── api/                     # API route handlers
│   │   ├── __init__.py
│   │   └── routes.py            # API endpoints
│   ├── core/                    # Business logic
│   │   ├── __init__.py
│   │   └── service.py           # Core service logic
│   ├── database/                # Database related code
│   │   ├── __init__.py
│   │   ├── connection.py        # Database connection
│   │   └── models.py            # SQLAlchemy models
│   └── utils/                   # Utility functions
│       ├── __init__.py
│       ├── logging.py           # Logging configuration
│       └── helpers.py           # Helper functions
├── tests/                       # Test directory
│   ├── __init__.py
│   ├── conftest.py              # Pytest configuration
│   ├── test_api.py              # API endpoint tests
│   ├── test_core.py             # Business logic tests
│   └── test_utils.py            # Utility function tests
├── scripts/                     # Deployment and utility scripts
│   ├── start.sh                 # Service startup script
│   ├── migrate.sh               # Database migration script
│   └── health-check.sh          # Health check script
└── docs/                        # Service documentation
    ├── api.md                   # API documentation
    └── deployment.md            # Deployment guide
```

## 🔧 Configuration Standards

### Environment Variables
All services should use the following standard environment variables:

```bash
# Service Configuration
SERVICE_NAME=service-name
SERVICE_VERSION=1.0.0
SERVICE_PORT=8000
SERVICE_HOST=0.0.0.0

# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
DATABASE_POOL_SIZE=10
DATABASE_MAX_OVERFLOW=20

# Redis Configuration
REDIS_URL=redis://localhost:6379/0
REDIS_POOL_SIZE=10

# Logging Configuration
LOG_LEVEL=INFO
LOG_FORMAT=json

# Security Configuration
SECRET_KEY=your-secret-key
JWT_SECRET=your-jwt-secret
CORS_ORIGINS=http://localhost:3000,https://yourdomain.com

# External APIs
ALPHA_VANTAGE_API_KEY=your-api-key
POLYGON_API_KEY=your-api-key
YFINANCE_ENABLED=true
```

### FastAPI Application Structure
```python
# src/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware

from .config import settings
from .api.routes import router
from .utils.logging import setup_logging

# Setup logging
setup_logging()

# Create FastAPI app
app = FastAPI(
    title=settings.SERVICE_NAME,
    description=f"{settings.SERVICE_NAME} API",
    version=settings.SERVICE_VERSION,
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
)

# Add middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=settings.ALLOWED_HOSTS,
)

# Include routers
app.include_router(router, prefix="/api/v1")

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": settings.SERVICE_NAME}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.SERVICE_HOST,
        port=settings.SERVICE_PORT,
        reload=settings.DEBUG,
    )
```

## 📦 Dependencies Management

### Service-Specific Requirements
Each service should have its own `requirements.txt` that inherits from the shared requirements:

```txt
# Inherit shared dependencies
-r ../shared/requirements.txt

# Service-specific dependencies
service-specific-package==1.0.0
another-package==2.0.0
```

### Development Dependencies
```txt
# requirements-dev.txt
-r requirements.txt

# Development tools
pre-commit==3.5.0
pytest-watch==4.2.0
httpx==0.25.2  # For testing FastAPI
```

## 🐳 Docker Standards

### Dockerfile Template
```dockerfile
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY src/ ./src/
COPY scripts/ ./scripts/

# Create non-root user
RUN useradd --create-home --shell /bin/bash app
USER app

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Start command
CMD ["python", "-m", "src.main"]
```

## 🧪 Testing Standards

### Test Configuration (conftest.py)
```python
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from src.main import app
from src.database.connection import get_db
from src.config import settings

# Test database
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture
def client():
    return TestClient(app)

@pytest.fixture
def db_session():
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
```

## 📋 Migration Checklist

When migrating existing services to this structure:

- [ ] Create new directory structure
- [ ] Move source files to appropriate directories
- [ ] Update import statements
- [ ] Create standardized configuration
- [ ] Update requirements.txt to use shared dependencies
- [ ] Create/update Dockerfile
- [ ] Add comprehensive tests
- [ ] Update documentation
- [ ] Configure logging
- [ ] Add health check endpoints
- [ ] Update deployment scripts
