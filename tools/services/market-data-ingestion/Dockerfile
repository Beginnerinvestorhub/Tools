# Use Python 3.11 slim image
FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PORT=8000

# Set work directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements files
COPY requirements.txt .

# Copy shared requirements from the correct path
# Note: This assumes the shared requirements exist at the service level
COPY ./shared/requirements.txt ./shared_requirements.txt 2>/dev/null || echo "# No shared requirements" > ./shared_requirements.txt

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt && \
    pip install --no-cache-dir -r shared_requirements.txt 2>/dev/null || echo "No shared requirements to install"

# Copy source code
COPY src/ ./src/
COPY *.py ./

# Create non-root user for security
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Create necessary directories with proper permissions
RUN mkdir -p /app/logs /app/data && \
    chown -R appuser:appuser /app && \
    chmod -R 755 /app

# Switch to non-root user
USER appuser

# Expose the port (Render will use this)
EXPOSE $PORT

# Health check - using environment variable for port
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:${PORT}/health || exit 1

# Start command - let Render handle the port via environment variable
CMD python -c "import os; exec(open('src/main.py' if os.path.exists('src/main.py') else 'main.py').read())"