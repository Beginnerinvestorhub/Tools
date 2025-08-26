# Use Python 3.11 slim image
FROM python:3.11-slim

# Environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PORT=8000

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy merged requirements file
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY src/ ./src/
COPY *.py ./

# Create non-root user
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Create necessary directories
RUN mkdir -p /app/logs /app/data && \
    chown -R appuser:appuser /app && \
    chmod -R 755 /app

USER appuser

EXPOSE $PORT

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:${PORT}/health || exit 1

CMD python -c "import os; exec(open('src/main.py' if os.path.exists('src/main.py') else 'main.py').read())"
