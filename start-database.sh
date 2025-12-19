#!/usr/bin/env bash
# Use this script to start a docker container for a local development database

# TO RUN ON WINDOWS:
# 1. Install WSL (Windows Subsystem for Linux) - https://learn.microsoft.com/en-us/windows/wsl/install
# 2. Install Docker Desktop or Podman Desktop
#    - Docker Desktop for Windows - https://docs.docker.com/docker-for-windows/install/
#    - Podman Desktop - https://podman.io/getting-started/installation
# 3. Open a real WSL distro (e.g., Ubuntu), not "docker-desktop"
# 4. Run this script - `bash ./start-database.sh`

# On Linux and macOS you can run this script directly - `./start-database.sh`

set -euo pipefail

# Import env variables from .env
if [ ! -f .env ]; then
  echo ".env not found in $(pwd). Create it first and set DATABASE_URL."
  exit 1
fi

set -a
. .env
set +a

if [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL is not set in .env"
  exit 1
fi

# Parse credentials from DATABASE_URL (e.g., postgresql://postgres:password@localhost:5432/dbname)
DB_PASSWORD=$(printf "%s" "$DATABASE_URL" | awk -F':' '{print $3}' | awk -F'@' '{print $1}')
DB_PORT=$(printf "%s" "$DATABASE_URL" | awk -F':' '{print $4}' | awk -F'/' '{print $1}')
# DB name = last path segment (strip any query string)
# Use character class to avoid awk escape warnings
DB_NAME=$(printf "%s" "$DATABASE_URL" | awk -F'/' '{print $NF}' | awk -F'[?]' '{print $1}')
DB_CONTAINER_NAME="${DB_NAME}-postgres"

# Ensure Docker or Podman is installed
if ! command -v docker >/dev/null 2>&1 \
   && ! command -v docker.exe >/dev/null 2>&1 \
   && ! command -v podman >/dev/null 2>&1; then
  echo "Docker or Podman is not installed. Please install Docker or Podman and try again." >&2
  echo "Docker: https://docs.docker.com/engine/install/" >&2
  echo "Podman: https://podman.io/getting-started/installation" >&2
  exit 1
fi

# determine which container CLI to use
if command -v docker >/dev/null 2>&1; then
  DOCKER_CMD="docker"
elif command -v docker.exe >/dev/null 2>&1; then
  DOCKER_CMD="docker.exe"
else
  DOCKER_CMD="podman"
fi

if ! $DOCKER_CMD info >/dev/null 2>&1; then
  echo "$DOCKER_CMD daemon is not running. Please start Docker Desktop (or Podman) and try again." >&2
  echo "On Windows: open Docker Desktop and enable WSL integration for your distro in Settings → Resources → WSL Integration." >&2
  exit 1
fi

# Check if desired port is free (best-effort)
if command -v nc >/dev/null 2>&1; then
  if nc -z localhost "$DB_PORT" 2>/dev/null; then
    echo "Port $DB_PORT is already in use."
    exit 1
  fi
else
  echo "Warning: Unable to check if port $DB_PORT is already in use (netcat not installed)"
  read -p "Do you want to continue anyway? [y/N]: " -r REPLY
  if ! [[ ${REPLY:-N} =~ ^[Yy]$ ]]; then
    echo "Aborting."
    exit 1
  fi
fi

# Reuse or start existing container
if [ "$($DOCKER_CMD ps -q -f name=$DB_CONTAINER_NAME)" ]; then
  echo "Database container '$DB_CONTAINER_NAME' already running"
  exit 0
fi

if [ "$($DOCKER_CMD ps -q -a -f name=$DB_CONTAINER_NAME)" ]; then
  $DOCKER_CMD start "$DB_CONTAINER_NAME"
  echo "Existing database container '$DB_CONTAINER_NAME' started"
  exit 0
fi

# If using the default password, offer to generate a safer one and update .env
if [ "${DB_PASSWORD}" = "password" ]; then
  echo "You are using the default database password"
  read -p "Generate a random password and update .env? [y/N]: " -r REPLY
  if [[ ${REPLY:-N} =~ ^[Yy]$ ]]; then
    if ! command -v openssl >/dev/null 2>&1; then
      echo "OpenSSL is not installed; cannot generate a random password automatically." >&2
      echo "Install it (e.g., 'sudo apt install openssl') or change the password in .env manually and rerun." >&2
      exit 1
    fi
    # Generate a random URL-safe password
    DB_PASSWORD=$(openssl rand -base64 12 | tr '+/' '-_')
    # Linux (GNU sed) vs macOS (BSD sed) in-place edit
    if sed --version >/dev/null 2>&1; then
      sed -i "s#:password@#:${DB_PASSWORD}@#" .env
    else
      sed -i '' "s#:password@#:${DB_PASSWORD}@#" .env
    fi
  else
    echo "Please change the default password in the .env file and try again"
    exit 1
  fi
fi

$DOCKER_CMD run -d \
  --name "$DB_CONTAINER_NAME" \
  -e POSTGRES_USER="postgres" \
  -e POSTGRES_PASSWORD="$DB_PASSWORD" \
  -e POSTGRES_DB="$DB_NAME" \
  -p "${DB_PORT}:5432" \
  -v "health_tracker_webapp-postgres-data:/var/lib/postgresql/data" \
  docker.io/postgres:16 \
  && echo "Database container '$DB_CONTAINER_NAME' was successfully created"
