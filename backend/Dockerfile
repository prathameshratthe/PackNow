FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install security dependencies if exists
COPY requirements_security.txt* ./
RUN if [ -f requirements_security.txt ]; then pip install --no-cache-dir -r requirements_security.txt; fi

# Copy application code
COPY . .

# Expose port
EXPOSE 8000

# Run seed_db first (creates tables + admin user), then start the server
CMD ["sh", "-c", "python seed_db.py && uvicorn api.main:app --host 0.0.0.0 --port 8000"]

