# Use an official Python runtime
FROM python:3.11-slim

# Environment optimizations
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PYTHONPATH=/app

WORKDIR /app

# System dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    libpq-dev \
    libffi-dev \
    libssl-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy app code
COPY src/ ./src/
COPY start.py .

# Non-root user for security
RUN groupadd -r appuser && useradd -r -g appuser appuser \
    && mkdir -p /app/logs /app/data /app/temp \
    && chown -R appuser:appuser /app \
    && chmod -R 755 /app
USER appuser

# Expose Render port
EXPOSE $PORT

# Healthcheck
HEALTHCHECK --interval=30s --timeout=15s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:$PORT/health || exit 1

# Run uvicorn with dynamic port
CMD ["sh", "-c", "uvicorn start:app --host 0.0.0.0 --port ${PORT:-8000}"]
