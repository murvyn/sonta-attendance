#!/bin/bash
# Face Service Startup Script
# Ensures face-service binds ONLY to localhost (127.0.0.1)
# This prevents external access - only backend can connect

set -e

echo "Starting face-service on localhost:8000 (private)"
exec uvicorn app:app --host 127.0.0.1 --port 8000
