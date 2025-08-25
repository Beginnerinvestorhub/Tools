# Use an official Python runtime as a parent image
FROM python:3.9-slim-buster

# Set the working directory in the container
WORKDIR /app

# Copy the requirements file into the container at /app
COPY requirements.txt .

COPY ../shared/requirements.txt ./shared_requirements.txt

# Install any needed packages specified in requirements.txt
RUN pip install --no-cache-dir -r requirements.txt -r shared_requirements.txt

RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Copy the rest of the application code into the container at /app
COPY src/ .

# Expose the port that the FastAPI application runs on (assuming default FastAPI port 8000)
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Command to run the application
# 'uvicorn' is typically used to run FastAPI applications
# 'api:app' refers to the 'app' object inside 'api.py'
CMD ["uvicorn", "api:app", "--host", "0.0.0.0", "--port", "8000"]
