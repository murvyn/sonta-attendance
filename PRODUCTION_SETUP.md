# Sonta Head Attendance System - Production Setup Guide

## System Status

### ✅ Completed Features
- **Real Facial Recognition**: face-api.js with 128D embeddings, AES-256-GCM encryption
- **Full CRUD Operations**: Admin users, Sonta Heads, Meetings, Attendance
- **QR Code System**: Dynamic QR generation with expiry strategies
- **Geofence Validation**: PostGIS-based location verification
- **Real-time Updates**: WebSocket gateway for live monitoring
- **Analytics Dashboard**: Charts, statistics, and CSV export
- **Database Migrations**: Production-ready TypeORM migrations
- **Docker Infrastructure**: All services containerized

### 📋 Production Readiness Checklist

#### Phase 1-3: COMPLETE ✅
- [x] Face-api.js integration with real facial recognition
- [x] Docker Compose with all services (PostgreSQL, Redis, Backend, Frontend)
- [x] Database migrations with indexes and PostGIS function
- [x] TypeORM synchronize disabled

#### Phase 4: AWS S3 Storage (Optional - Currently using local filesystem)
- [ ] S3 bucket setup for profile images
- [ ] CloudFront CDN configuration
- [ ] Migration from local uploads to S3

#### Phase 5: Production Features & Security
- [ ] SSL/TLS certificates (Let's Encrypt or manual)
- [ ] Nginx reverse proxy with HTTPS
- [ ] Environment-specific secrets (rotate from dev defaults)
- [ ] Health check endpoints
- [ ] Log rotation with Winston
- [ ] Database backup automation
- [ ] Rate limiting configuration
- [ ] Security headers (helmet, CORS, CSP)

#### Phase 6: CI/CD & Deployment
- [ ] GitHub Actions workflows
- [ ] Deployment automation scripts
- [ ] Server setup documentation
- [ ] Rollback procedures

---

## Quick Start (Development)

### Prerequisites
- Docker & Docker Compose
- Node.js 20.x LTS
- PostgreSQL 16 with PostGIS (via Docker)
- Redis 7 (via Docker)

### 1. Clone and Setup

```bash
cd /path/to/attendance
```

### 2. Environment Configuration

**Backend (.env)**
```bash
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5433  # For local development
DATABASE_USER=sonta
DATABASE_PASSWORD=sonta_password
DATABASE_NAME=sonta_attendance

# Redis
REDIS_HOST=localhost
REDIS_PORT=6380

# JWT (⚠️ CHANGE IN PRODUCTION)
JWT_ACCESS_SECRET=dev-access-secret-key-change-in-production
JWT_REFRESH_SECRET=dev-refresh-secret-key-change-in-production
JWT_ACCESS_EXPIRATION=3600
JWT_REFRESH_EXPIRATION=7776000

# QR Security (⚠️ CHANGE IN PRODUCTION)
QR_SECRET=dev-qr-signing-secret-change-in-production

# Encryption (⚠️ MUST be exactly 32 characters)
EMBEDDING_ENCRYPTION_KEY=dev-embedding-encryption-key-32chars

# Server
PORT=3000
NODE_ENV=development

# Frontend URL
FRONTEND_URL=http://localhost:3001
```

**Frontend (.env.local)**
```bash
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_WS_URL=ws://localhost:3000
```

### 3. Start Services

```bash
docker compose up -d
```

**Services:**
- Backend API: http://localhost:3000
- API Docs: http://localhost:3000/api/docs
- Frontend: http://localhost:3001
- PostgreSQL: localhost:5433
- Redis: localhost:6380

### 4. Default Credentials

```
Username: superadmin
Password: Admin@123
```

**⚠️ IMPORTANT**: Change this password immediately after first login!

### 5. Verify Services

```bash
# Check all services are running
docker compose ps

# Check backend logs
docker logs sonta-backend --tail 50

# Check database connection
docker exec sonta-backend npm run migration:show
```

---

## Production Deployment

### 1. Server Requirements

**Minimum:**
- Ubuntu 22.04 LTS
- 2 vCPUs
- 4GB RAM
- 40GB SSD
- Docker & Docker Compose installed

**Recommended:**
- 4 vCPUs
- 8GB RAM
- 80GB SSD

### 2. Production Environment Variables

**⚠️ CRITICAL SECURITY**: Generate strong secrets for production!

```bash
# Generate random secrets (Linux/Mac)
openssl rand -base64 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Production .env:**
```bash
# Database
DATABASE_HOST=postgres  # Docker service name
DATABASE_PORT=5432      # Internal port
DATABASE_USER=sonta
DATABASE_PASSWORD=<STRONG_PASSWORD_HERE>
DATABASE_NAME=sonta_attendance

# Redis
REDIS_HOST=redis
REDIS_PORT=6379

# JWT - Generate new secrets!
JWT_ACCESS_SECRET=<GENERATED_SECRET_32+_CHARS>
JWT_REFRESH_SECRET=<GENERATED_SECRET_32+_CHARS>
JWT_ACCESS_EXPIRATION=3600
JWT_REFRESH_EXPIRATION=7776000

# QR Security - Generate new secret!
QR_SECRET=<GENERATED_SECRET_32+_CHARS>

# Encryption - MUST be exactly 32 characters
EMBEDDING_ENCRYPTION_KEY=<GENERATED_32_CHAR_SECRET>

# Server
PORT=3000
NODE_ENV=production

# Frontend URL
FRONTEND_URL=https://yourdomain.com
```

### 3. Docker Compose for Production

Update `docker-compose.yml`:

```yaml
environment:
  - NODE_ENV=production
  - DATABASE_HOST=postgres
  - DATABASE_PORT=5432
  - REDIS_HOST=redis
  - REDIS_PORT=6379
```

### 4. Run Migrations

```bash
# From backend directory
npm run migration:run
```

### 5. Start Production Services

```bash
docker compose up -d --build
```

### 6. SSL/TLS Setup (Let's Encrypt)

```bash
# Install certbot
sudo apt-get update
sudo apt-get install certbot

# Generate certificate
sudo certbot certonly --standalone -d yourdomain.com

# Certificates will be in:
# /etc/letsencrypt/live/yourdomain.com/
```

### 7. Nginx Configuration

Create `/etc/nginx/sites-available/sonta-attendance`:

```nginx
upstream backend {
    server localhost:3000;
}

upstream frontend {
    server localhost:3001;
}

server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Backend API
    location /api {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket
    location /socket.io {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }

    # Frontend
    location / {
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable and reload:
```bash
sudo ln -s /etc/nginx/sites-available/sonta-attendance /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## Database Management

### Migrations

```bash
# Show migration status
npm run migration:show

# Run pending migrations
npm run migration:run

# Revert last migration
npm run migration:revert

# Generate new migration from entity changes
npm run migration:generate -- src/database/migrations/MigrationName

# Create empty migration
npm run migration:create -- src/database/migrations/MigrationName
```

### Backups

```bash
# Manual backup
docker exec sonta-postgres pg_dump -U sonta sonta_attendance | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz

# Restore from backup
gunzip < backup.sql.gz | docker exec -i sonta-postgres psql -U sonta sonta_attendance
```

### Automated Daily Backups

Create `/opt/sonta/backup.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/opt/sonta/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
FILENAME="sonta_attendance_${TIMESTAMP}.sql.gz"

mkdir -p $BACKUP_DIR
docker exec sonta-postgres pg_dump -U sonta sonta_attendance | gzip > "$BACKUP_DIR/$FILENAME"

# Keep only last 7 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete

echo "Backup completed: $FILENAME"
```

Add to crontab:
```bash
# Run daily at 2 AM
0 2 * * * /opt/sonta/backup.sh >> /var/log/sonta-backup.log 2>&1
```

---

## Monitoring & Health Checks

### Service Health

```bash
# Check all services
docker compose ps

# Backend health (when health endpoint is added)
curl http://localhost:3000/health

# Database connection
docker exec sonta-postgres pg_isready -U sonta

# Redis connection
docker exec sonta-redis redis-cli ping
```

### Logs

```bash
# Backend logs
docker logs sonta-backend -f

# Frontend logs
docker logs sonta-web -f

# PostgreSQL logs
docker logs sonta-postgres -f

# All services
docker compose logs -f
```

---

## Security Checklist

### Before Going Live

- [ ] **Change all default passwords**
  - Superadmin password
  - Database password
  - All JWT and encryption secrets

- [ ] **SSL/TLS configured**
  - Valid certificate installed
  - HTTP redirects to HTTPS
  - Strong cipher suites

- [ ] **Environment variables secured**
  - No secrets in version control
  - Production .env files are gitignored
  - Secrets are at least 32 characters

- [ ] **Database hardened**
  - Strong database password
  - Database not exposed to public internet
  - Regular backups configured

- [ ] **CORS configured**
  - Only production domain allowed
  - No wildcard (*) origins

- [ ] **Rate limiting enabled**
  - API endpoints protected
  - Check-in attempts limited

- [ ] **File upload validation**
  - MIME type checking
  - File size limits (5MB max)
  - Only JPEG/PNG allowed

---

## Troubleshooting

### Backend Won't Start

```bash
# Check logs
docker logs sonta-backend

# Common issues:
# 1. Database connection failed
docker exec sonta-postgres pg_isready -U sonta

# 2. Redis connection failed
docker exec sonta-redis redis-cli ping

# 3. Face-api models not loaded
docker exec sonta-backend ls -la /app/models
```

### Database Migration Errors

```bash
# Check migration status
npm run migration:show

# If stuck, manually check migrations table
docker exec -it sonta-postgres psql -U sonta -d sonta_attendance
SELECT * FROM migrations;
```

### Face Recognition Not Working

```bash
# Check models are loaded
docker exec sonta-backend ls -la /app/models

# Should see:
# - ssd_mobilenetv1_model-*
# - face_recognition_model-*
# - face_landmark_68_model-*

# Check backend logs for face-api errors
docker logs sonta-backend | grep -i "face"
```

### WebSocket Connection Issues

```bash
# Check CORS configuration
# Backend should allow frontend URL

# Check Nginx WebSocket headers
# Must have:
# proxy_set_header Upgrade $http_upgrade;
# proxy_set_header Connection "upgrade";
```

---

## Performance Tuning

### Database Indexes

All critical indexes are created via migrations:
- Email lookups (admin_users, sonta_heads)
- Foreign key relationships
- Timestamp queries
- Status filters

### Redis Caching

Currently used for:
- QR token validation
- Session management
- Rate limiting counters

### Connection Pooling

TypeORM automatically manages connection pools. For high load:

```typescript
// In app.module.ts
extra: {
  max: 20, // Maximum pool size
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
}
```

---

## API Documentation

Once running, visit:
- **Swagger UI**: http://localhost:3000/api/docs
- **OpenAPI JSON**: http://localhost:3000/api/docs-json

---

## Support & Maintenance

### Regular Maintenance Tasks

**Daily:**
- Monitor service health
- Check disk space
- Review error logs

**Weekly:**
- Verify backups are running
- Review audit logs
- Check for npm security updates

**Monthly:**
- Update dependencies
- Review and rotate logs
- Performance optimization review

### Updating the System

```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker compose up -d --build

# Run new migrations if any
npm run migration:run
```

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         Client Browser                       │
│                     (React/Next.js App)                      │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  │ HTTPS / WSS
                  │
┌─────────────────▼───────────────────────────────────────────┐
│                      Nginx (Reverse Proxy)                   │
│                    SSL Termination & Routing                 │
└─────────────┬──────────────────────┬─────────────────────────┘
              │                      │
       /api/* │               /*     │ Frontend
              │                      │
┌─────────────▼───────────┐ ┌───────▼──────────────────────────┐
│   Backend (NestJS)      │ │   Frontend (Next.js)             │
│   - REST API            │ │   - Server-Side Rendering        │
│   - WebSocket Gateway   │ │   - Static Assets                │
│   - Face Recognition    │ │                                  │
│   - Business Logic      │ │                                  │
└──┬─────────┬────────────┘ └──────────────────────────────────┘
   │         │
   │         │
   │         └─────────┐
   │                   │
┌──▼──────────┐ ┌─────▼─────────────┐
│ PostgreSQL  │ │      Redis        │
│   +PostGIS  │ │   - QR Tokens     │
│   - Data    │ │   - Sessions      │
│   - Geofence│ │   - Rate Limiting │
└─────────────┘ └───────────────────┘
```

---

## Technology Stack

**Backend:**
- NestJS 10.x (TypeScript)
- TypeORM (PostgreSQL ORM)
- face-api.js (Facial Recognition)
- Socket.io (WebSockets)
- bcrypt (Password Hashing)
- JWT (Authentication)

**Frontend:**
- Next.js 15 (React 18)
- TypeScript
- Tailwind CSS + shadcn/ui
- Zustand (State Management)
- Socket.io-client
- React Hook Form + Zod

**Infrastructure:**
- PostgreSQL 16 + PostGIS
- Redis 7
- Docker & Docker Compose
- Nginx (Production)

**Face Recognition:**
- face-api.js with TensorFlow.js
- Models: ssd_mobilenetv1, face_recognition, face_landmark_68
- AES-256-GCM encryption for embeddings
- 95% confidence threshold for auto-approval

---

## License

Proprietary - Sonta Head Attendance System

---

## Contact

For support and inquiries, contact the system administrator.

**System Version**: 1.0.0
**Last Updated**: February 2026
