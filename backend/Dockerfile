# Smart Study Notes Generator - Backend Dockerfile
# Optimized for Railway deployment

FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PORT=8000

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    tesseract-ocr \
    tesseract-ocr-eng \
    libtesseract-dev \
    poppler-utils \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create necessary directories
RUN mkdir -p uploads chroma_db logs

# Expose port
EXPOSE $PORT

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:$PORT/api/health || exit 1

# Start command
CMD gunicorn app.main:app --workers 1 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT --timeout 120
