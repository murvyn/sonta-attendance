# Combined Dockerfile for Backend + Face Recognition Service
# This container runs both NestJS backend and Python face-service using supervisor
# Face-service is ONLY accessible via localhost:8000 (not exposed publicly)
# Only backend port 3000 is exposed to the internet

# =============================================================================
# Stage 1: Build NestJS Backend
# =============================================================================
FROM node:20-slim AS backend-builder

# Install build dependencies for native modules
RUN apt-get update && apt-get install -y \
    python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy backend package files
COPY backend/package*.json ./

# Install dependencies
RUN npm ci

# Copy backend source code
COPY backend/ ./

# Build the application
RUN npm run build

# =============================================================================
# Stage 2: Production Runtime with Node + Python
# =============================================================================
FROM node:20-slim

# Install Python 3.11, pip, supervisor, and system dependencies
RUN apt-get update && apt-get install -y \
    # Python and pip
    python3 python3-pip python3-venv \
    # Supervisor process manager
    supervisor \
    # System dependencies for InsightFace (libgl1 replaces deprecated libgl1-mesa-glx)
    libgl1 libglib2.0-0 \
    # Utilities
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# =============================================================================
# Install Backend
# =============================================================================

# Copy node_modules and built application from builder
COPY --from=backend-builder /app/node_modules ./backend/node_modules
COPY --from=backend-builder /app/package*.json ./backend/
COPY --from=backend-builder /app/dist ./backend/dist

# Copy backend runtime files
COPY backend/init.sql ./backend/init.sql
COPY backend/src/polyfill.js ./backend/polyfill.js

# Create uploads directory
RUN mkdir -p backend/uploads/profiles backend/uploads/qr-codes backend/uploads/check-in-photos

# =============================================================================
# Install Face Service
# =============================================================================

# Copy face-service files
COPY face-service/ ./face-service/

# Make start script executable
RUN chmod +x ./face-service/start.sh

# Install Python dependencies (using --break-system-packages for Docker container)
RUN pip3 install --no-cache-dir --break-system-packages -r ./face-service/requirements.txt

# Pre-download InsightFace model during build (avoids runtime download + memory spike)
# Default: buffalo_sc (~50MB, low memory). Set FACE_MODEL=buffalo_l for higher accuracy.
ARG FACE_MODEL=buffalo_sc
ENV FACE_MODEL=${FACE_MODEL}
RUN python3 ./face-service/download_model.py

# =============================================================================
# Configure Supervisor
# =============================================================================

# Copy supervisor configuration
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# =============================================================================
# Container Configuration
# =============================================================================

# Create directory for InsightFace models (will be downloaded on first run)
RUN mkdir -p /root/.insightface/models

# Expose ONLY backend port (NOT face-service port 8000)
EXPOSE 3000

# Health check for backend
HEALTHCHECK --interval=30s --timeout=10s --start-period=90s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start supervisor (which will start both face-service and backend)
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
