#!/bin/sh
# Container entrypoint: run database migrations then start the API server.
set -e

echo "[entrypoint] running migrations..."
python migrate.py

echo "[entrypoint] starting uvicorn on port ${PORT:-8000}..."
exec python -m uvicorn src.main:app --host 0.0.0.0 --port "${PORT:-8000}"
