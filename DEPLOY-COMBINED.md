# Deploy Combined Backend + Face Service Container

This guide shows how to deploy the backend and face-service in a **single Docker container** where face-service is only accessible via localhost (not publicly exposed).

---

## Architecture

### Single Container with Supervisor

```
┌────────────────────────────────────────────┐
│        Combined Container                   │
│                                             │
│  ┌──────────────┐   localhost   ┌────────┐ │
│  │   Backend    │──────────────→│  Face  │ │
│  │ (Port 3000)  │  :8000        │Service │ │
│  │              │               │(127.0. │ │
│  │  PUBLIC ✅   │               │0.1:8000│ │
│  └──────────────┘               │PRIVATE│ │
│                                 │   ✅   │ │
│         Managed by Supervisor   └────────┘ │
└─────────────────────────────────────────────┘
                   ↓
            Only port 3000
            exposed to internet
```

**Key Benefits**:
- ✅ Face-service NOT exposed to public internet
- ✅ Single deployment (simpler, cheaper)
- ✅ Localhost communication (faster, more secure)
- ✅ Auto-restart on crashes (supervisor)

---

## Prerequisites

- Docker installed locally (for testing)
- PostgreSQL database (Render, AWS RDS, or DigitalOcean)
- Redis instance (Render, AWS ElastiCache, or Upstash)
- Render account (or any Docker-compatible host)

---

## Local Testing

### 1. Build the Combined Image

```bash
cd /home/marvin/Documents/attendance

# Build image from /api folder
docker build -t sonta-combined ./api
```

**Expected**:
- Multi-stage build completes
- Image size: ~2.5GB (Node + Python + InsightFace)
- Build time: 5-10 minutes (first time)

### 2. Run Locally

```bash
# Start container with required environment variables
docker run --rm -p 3000:3000 \
  -e DATABASE_HOST=host.docker.internal \
  -e DATABASE_PORT=5433 \
  -e DATABASE_USER=sonta \
  -e DATABASE_PASSWORD=sonta_password \
  -e DATABASE_NAME=sonta_attendance \
  -e REDIS_HOST=host.docker.internal \
  -e REDIS_PORT=6380 \
  -e JWT_ACCESS_SECRET=dev-access-secret \
  -e JWT_REFRESH_SECRET=dev-refresh-secret \
  -e QR_SECRET=dev-qr-signing-secret-change-in-production \
  -e EMBEDDING_ENCRYPTION_KEY=dev-embedding-encryption-key-32chars \
  -e FRONTEND_URL=http://localhost:3001 \
  sonta-combined
```

**Note**: Use `host.docker.internal` to connect to services running on your host machine.

### 3. Verify Logs

Watch for these logs in order:

```
✅ Starting supervisord...
✅ [face-service] Starting face-service on localhost:8000 (private)
✅ [face-service] Loading InsightFace Buffalo_L model...
✅ [face-service] Model loaded successfully
✅ [backend] Backend starting on port 3000...
✅ [backend] Face service is ready (model: buffalo_l)
✅ [backend] Backend listening on port 3000
```

**First startup**: 60-90 seconds (downloads Buffalo_L model ~400MB)
**Subsequent startups**: 10-15 seconds (model cached)

### 4. Test Face-Service is NOT Exposed

```bash
# From host machine (should FAIL)
curl http://localhost:8000/health
# Expected: Connection refused or timeout

# From inside container (should SUCCEED)
docker exec <container_id> curl http://localhost:8000/health
# Expected: {"status":"healthy","model":"buffalo_l","model_loaded":true}
```

### 5. Test Backend is Exposed

```bash
# From host machine (should SUCCEED)
curl http://localhost:3000/health
# Expected: Backend health response
```

---

## Deploy to Render

### Step 1: Push Code to GitHub

Ensure all changes are committed:

```bash
git add api/ docker-compose.yml DEPLOY-COMBINED.md
git commit -m "feat: restructure into /api folder with combined Docker container

- Moved backend and face-service into /api folder
- Face-service only accessible via localhost (not publicly exposed)
- Supervisor manages both services in single container
- Only port 3000 exposed to internet
- Cleaner project structure
- Production-ready for Render deployment"
git push origin master
```

### Step 2: Create New Web Service on Render

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. **Configure Service**:

   | Setting | Value |
   |---------|-------|
   | **Name** | `sonta-backend-combined` |
   | **Region** | Select closest to your users |
   | **Branch** | `master` (or your main branch) |
   | **Root Directory** | `api` |
   | **Environment** | **Docker** |
   | **Dockerfile Path** | `Dockerfile` |
   | **Docker Build Context Directory** | `api` |

5. **Instance Type**: Select based on needs
   - **Starter** ($7/month): 512MB RAM ❌ (too little for InsightFace)
   - **Standard** ($25/month): 2GB RAM ⚠️ (minimum viable)
   - **Pro** ($85/month): 4GB RAM ✅ (recommended)

   **Note**: InsightFace model requires ~2GB RAM. Choose Standard minimum, Pro recommended.

### Step 3: Configure Environment Variables

Add these environment variables in Render:

#### Database (PostgreSQL)
```bash
DATABASE_HOST=your-postgres-host.render.com
DATABASE_PORT=5432
DATABASE_USER=sonta
DATABASE_PASSWORD=your-secure-password
DATABASE_NAME=sonta_attendance
```

#### Redis
```bash
REDIS_HOST=your-redis-host.render.com
REDIS_PORT=6379
```

#### JWT Authentication
```bash
JWT_ACCESS_SECRET=generate-with-openssl-rand-base64-32
JWT_REFRESH_SECRET=generate-with-openssl-rand-base64-32
JWT_ACCESS_EXPIRATION=3600
JWT_REFRESH_EXPIRATION=7776000
```

#### Security
```bash
QR_SECRET=generate-with-openssl-rand-base64-32
EMBEDDING_ENCRYPTION_KEY=exactly-32-characters-required!!
```

#### Frontend
```bash
FRONTEND_URL=https://your-frontend.vercel.app
```

#### Application
```bash
PORT=3000
NODE_ENV=production
```

#### Super Admin
```bash
SUPER_ADMIN_EMAIL=your-admin@example.com
```

#### Resend Email (Optional)
```bash
RESEND_API_KEY=re_your_api_key
EMAIL_FROM=noreply@yourdomain.com
```

**IMPORTANT**: Do NOT set `FACE_SERVICE_URL`. It defaults to `http://localhost:8000` which is correct for combined container.

### Step 4: Configure Health Check

In Render service settings:

- **Health Check Path**: `/health`
- **Start Command**: *(leave empty - uses Dockerfile CMD)*

### Step 5: Deploy

1. Click **"Create Web Service"**
2. Render will:
   - Clone your repository
   - Build Docker image using `backend/Dockerfile.combined`
   - Start container with supervisor
   - Run health checks

**Expected deployment time**:
- **First deploy**: 10-15 minutes (build + model download)
- **Subsequent deploys**: 5-10 minutes (cached layers)

### Step 6: Monitor Logs

Watch Render logs for:

```
✅ Building...
✅ Successfully built image
✅ Starting container...
✅ [face-service] Loading InsightFace Buffalo_L model...
✅ [face-service] Model loaded successfully
✅ [backend] Face service is ready (model: buffalo_l)
✅ [backend] Backend listening on port 3000
✅ Health check passed
✅ Service is live
```

### Step 7: Verify Deployment

```bash
# Test backend is accessible
curl https://your-service.onrender.com/health

# Test face-service is NOT accessible (should fail)
curl https://your-service.onrender.com:8000/health
# Expected: Connection refused or timeout
```

**Success**: Backend works, face-service is private!

---

## Troubleshooting

### Build Fails: "No such file or directory"

**Error**: `COPY backend/package.json: no such file or directory`

**Fix**: Ensure Docker build context is set to `/api` folder:
```bash
docker build -t sonta-combined ./api
#                              ^^^^^ api folder
```

In Render: **Root Directory** = `api` and **Docker Build Context Directory** = `api`

### Face-Service Not Starting

**Symptoms**: Backend logs show "Face service is not available"

**Check**:
1. View Render logs for face-service startup errors
2. Ensure 2GB+ RAM available
3. Check Python dependencies installed correctly

**Fix**: Increase instance size to Pro (4GB RAM)

### Backend Can't Connect to Face-Service

**Symptoms**: "Error connecting to http://localhost:8000"

**Check**:
1. Supervisor logs show both services started
2. Face-service health endpoint returns 200
3. `FACE_SERVICE_URL` not overridden in environment variables

**Fix**: Remove `FACE_SERVICE_URL` from environment variables (should default to localhost:8000)

### Out of Memory (OOM) Killed

**Symptoms**: Container crashes with exit code 137

**Cause**: InsightFace model + backend exceeds available RAM

**Fix**: Upgrade to Pro instance (4GB RAM) or optimize:
```bash
# In supervisord.conf, add memory limits
[program:face-service]
environment=OMP_NUM_THREADS="1"
```

### Model Download Timeout

**Symptoms**: "Failed to download buffalo_l model"

**Cause**: Network timeout during model download (~400MB)

**Fix**:
1. Increase health check start period in Dockerfile
2. Or pre-cache model in Docker image (advanced)

### Health Check Failing

**Symptoms**: Render shows "Service Unhealthy"

**Check**:
1. Backend actually listening on port 3000
2. Health endpoint returns 200 OK
3. Database connection successful

**Fix**: Check backend logs for startup errors, database connection issues

---

## Resource Requirements

### Minimum (Not Recommended)
- **RAM**: 2GB
- **CPU**: 1 core
- **Disk**: 10GB
- **Instance**: Render Standard ($25/month)
- **Status**: ⚠️ May run out of memory

### Recommended (Production)
- **RAM**: 4GB
- **CPU**: 2 cores
- **Disk**: 20GB
- **Instance**: Render Pro ($85/month)
- **Status**: ✅ Stable performance

### Performance Characteristics
- **First startup**: 60-90 seconds (model download)
- **Subsequent startups**: 10-15 seconds (model cached)
- **Face detection**: ~100-200ms per image
- **Embedding extraction**: ~150-300ms per image
- **Check-in flow**: ~500-800ms total

---

## Comparison: Combined vs Separate Containers

| Aspect | Combined Container | Separate Containers |
|--------|-------------------|---------------------|
| **Cost** | 1 service ($25-85/month) | 2 services ($50-170/month) |
| **Security** | Face-service private ✅ | Face-service exposed ❌ |
| **Complexity** | Single deployment ✅ | Manage two services ❌ |
| **Performance** | Localhost (fast) ✅ | Network overhead ⚠️ |
| **Debugging** | Single log stream ✅ | Check two services ⚠️ |
| **Scaling** | Scale together ⚠️ | Scale independently ✅ |
| **Development** | Same as docker-compose ✅ | Same ✅ |

**Recommendation**: Use **combined container** for production (secure, simple, cheaper)

---

## Development Workflow

### Local Development (docker-compose)

Continue using separate containers for development:

```bash
docker-compose up
```

**Benefits**:
- Hot reload for backend
- Independent service restarts
- Easy to debug
- Face-service accessible at http://localhost:8000

### Production (combined container)

Deploy to Render with combined Dockerfile:

**Benefits**:
- Face-service not exposed
- Single deployment
- Production-ready
- Cheaper

**Both approaches supported** - choose based on environment!

---

## Rollback to Separate Containers

If combined container doesn't work:

### Option 1: Deploy Separate Services on Render

1. **Face Service**:
   - Dockerfile: `face-service/Dockerfile`
   - Port: 8000
   - Instance: Standard (2GB RAM)

2. **Backend Service**:
   - Dockerfile: `backend/Dockerfile`
   - Port: 3000
   - Environment: `FACE_SERVICE_URL=https://your-face-service.onrender.com`
   - Instance: Starter (512MB RAM)

3. **Add API Key Protection** to face-service (since it's public)

### Option 2: Use Docker Compose on VPS

Deploy docker-compose.yml to DigitalOcean, AWS EC2, or similar:

```bash
# On VPS
git clone your-repo
cd attendance
docker-compose up -d
```

---

## Next Steps

1. ✅ Deploy combined container to Render
2. ✅ Verify face-service is private
3. ✅ Test facial recognition with real Sonta Heads
4. ✅ Monitor RAM usage and performance
5. ✅ Add monitoring/alerting (optional)
6. ✅ Configure backups for database
7. ✅ Set up CI/CD for automatic deployments

---

## Support

- **Logs**: Check Render dashboard → Logs tab
- **Health**: `https://your-service.onrender.com/health`
- **Face Service Health** (from inside container): `curl http://localhost:8000/health`
- **Debug**: SSH into Render shell (if available on plan)

---

## Security Notes

✅ **Face-service NOT exposed** - Only accessible via localhost
✅ **Backend JWT secured** - All endpoints require authentication
✅ **Facial embeddings encrypted** - AES-256-GCM in database
✅ **QR codes signed** - HMAC prevents tampering
✅ **Environment variables** - Never commit secrets to git

**Remember**: This combined container approach ensures face-service remains private while keeping backend publicly accessible!
