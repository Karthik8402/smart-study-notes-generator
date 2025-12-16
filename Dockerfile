# ==========================================
# Stage 1: Frontend Build
# ==========================================
FROM node:18-alpine AS frontend_build

WORKDIR /app

# Copy package files first for caching
COPY frontend/package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY frontend/ .

# Build the React application
RUN npm run build

# ==========================================
# Stage 2: Backend & Final Image
# ==========================================
FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8000

# Install system dependencies (including Tesseract)
# Clean up apt cache to keep image small
RUN apt-get update && apt-get install -y \
    build-essential \
    tesseract-ocr \
    tesseract-ocr-eng \
    libtesseract-dev \
    poppler-utils \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy backend requirements
COPY backend/requirements.txt .

# Install Python dependencies
# --no-cache-dir reduces image size
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/ .

# Copy built frontend assets from Stage 1
# They go into app/static so FastAPI can serve them
COPY --from=frontend_build /app/dist /app/app/static

# Create necessary directories for runtime
RUN mkdir -p uploads chroma_db logs && chmod 777 uploads chroma_db logs

# Expose port
EXPOSE $PORT

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:$PORT/api/health || exit 1

# Start command
# Using a single worker to strictly limit RAM usage < 600MB
# Timeout set to 120s for long operations (like file processing)
CMD gunicorn app.main:app --workers 1 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT --timeout 120
