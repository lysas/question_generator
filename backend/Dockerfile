# Use official Python image as the base
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies (if any) and Python build tools
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy only requirements first for better caching
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy the application code
COPY backend/ ./
COPY supabase_client.py ./backend/supabase_client.py

# Expose port (FastAPI default)
EXPOSE 8081

# Environment variables (will be overridden in Azure)
ENV PORT=8081

# Command to run the server
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8081"]
