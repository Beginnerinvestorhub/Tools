
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies for ML and data processing
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    libpq-dev \
    curl \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy reWA.    quirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy the risk calculator engine files
COPY advanced_ai.py ./
COPY behavioral_analytics.py ./
COPY collaborative_filtering.py ./
COPY content_based.py ./
COPY nudge_optimization.py ./
COPY __init__.py ./

# Copy service directories
COPY ai_microservice/ ./ai_microservice/
COPY tools/ ./tools/

# Copy any configuration files
COPY *.json ./ 2>/dev/null || true
COPY *.yaml ./ 2>/dev/null || true
COPY *.yml ./ 2>/dev/null || true

# Set environment variables
ENV PYTHONPATH=/app
ENV FLASK_APP=advanced_ai.py
ENV FLASK_ENV=production

# Create non-root user for security
RUN useradd --create-home --shell /bin/bash app && \
    chown -R app:app /app
USER app

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Run the risk calculator engine
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--workers", "4", "--timeout", "120", "advanced_ai:app"]
