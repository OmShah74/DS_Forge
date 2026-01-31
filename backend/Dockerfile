FROM python:3.10-slim

WORKDIR /app

# Install system dependencies (needed for some numpy/pandas operations)
RUN apt-get update && apt-get install -y gcc

# Install python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose port
EXPOSE 8000

# Start command (Production mode - no reload)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

# Note: In development, we override this with --reload in docker-compose.yml