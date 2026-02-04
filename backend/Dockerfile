# Multi-stage build for production
FROM node:20-slim AS builder

# Install build dependencies for native modules (canvas + tensorflow)
RUN apt-get update && apt-get install -y \
    python3 make g++ \
    libcairo2-dev libjpeg-dev libpango1.0-dev libgif-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:20-slim

# Install runtime dependencies AND build dependencies for canvas + tensorflow
RUN apt-get update && apt-get install -y \
    libcairo2 libjpeg62-turbo libpango-1.0-0 libgif7 \
    python3 make g++ \
    libcairo2-dev libjpeg-dev libpango1.0-dev libgif-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files (not needed since we're copying node_modules from builder)
# COPY package*.json ./

# Copy node_modules from builder (production deps will be filtered during runtime)
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

# Copy built application from builder
COPY --from=builder /app/dist ./dist

# Copy face-api.js models
COPY models ./models

# Copy init scripts if any
COPY init.sql ./init.sql

# Create uploads directory
RUN mkdir -p uploads/profiles uploads/qr-codes uploads/check-in-photos

# Expose port
EXPOSE 3000

# Start the application
CMD ["node", "dist/main.js"]
