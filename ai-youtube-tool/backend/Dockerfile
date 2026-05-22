FROM python:3.11-slim

WORKDIR /app

# Install system dependencies (asyncpg build, FFmpeg for thumbnails)
RUN apt-get update && apt-get install -y \
    build-essential \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies (cached layer)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create non-root user
RUN groupadd --system app && useradd --system --gid app app && \
    mkdir -p /app/storage && chown -R app:app /app/storage

USER app

EXPOSE 8000

# Default command (overridden in docker-compose for worker)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
