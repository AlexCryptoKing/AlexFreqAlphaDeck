FROM python:3.11-slim

# System deps + Docker CLI
RUN apt-get update \
  && apt-get install -y --no-install-recommends curl ca-certificates apt-transport-https gnupg lsb-release \
  && curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg \
  && echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/debian $(lsb_release -cs) stable" > /etc/apt/sources.list.d/docker.list \
  && apt-get update \
  && apt-get install -y --no-install-recommends docker-ce-cli \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install python deps
COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

# Copy backend code
COPY alembic.ini /app/alembic.ini
COPY alembic /app/alembic
COPY src /app/src

# Default config mount location
RUN mkdir -p /app/config

ENV PYTHONUNBUFFERED=1
EXPOSE 8000

# Run migrations then start
CMD ["bash", "-lc", "alembic upgrade head && uvicorn src.main:app --host 0.0.0.0 --port 8000"]
