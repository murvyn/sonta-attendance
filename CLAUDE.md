# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Sonta Head Attendance Verification System - A secure, automated attendance tracking system using QR codes, facial recognition, and geolocation to verify physical presence at meetings.

**Status**: Planning phase - no code implemented yet.

## Technology Stack

### Frontend
- React 18.x with TypeScript 5.x
- Vite 5.x build tool
- Zustand for state management
- Tailwind CSS 3.x + shadcn/ui components
- Socket.io-client for real-time updates
- Leaflet.js + OpenStreetMap for location picker
- html5-qrcode for QR scanning
- react-webcam for camera capture
- React Hook Form + Zod validation

### Backend
- NestJS 10.x with TypeScript
- Node.js 20.x LTS
- TypeORM with PostgreSQL 16.x + PostGIS extension
- Redis 7.x for caching and QR token validation
- JWT authentication with refresh token rotation
- Socket.io for WebSocket gateway
- Sharp for image processing

### External Services
- AWS Rekognition (or face-api.js as self-hosted alternative) for facial recognition
- AWS S3 for image storage
- CloudFront CDN

## Architecture

```
Client Layer (React)
    ↓ HTTPS + WebSocket
API Gateway (Nginx)
    ↓
Application Layer (NestJS)
├── Auth Module (JWT, Guards)
├── Meeting Module (CRUD, QR generation)
├── Attendance Module (Check-in, Facial recognition)
├── Sonta Module (Member management)
├── Analytics Module
└── WebSocket Gateway (Real-time updates)
    ↓
Data Layer
├── PostgreSQL + PostGIS (Primary data, geospatial)
└── Redis (QR tokens, sessions, rate limiting)
```

## Key Domain Concepts

- **Sonta Heads**: Members who attend meetings, enrolled with facial embeddings
- **Meetings**: Events with location (geofence), QR code, and scheduled times
- **Check-in Flow**: QR scan → geofence validation → liveness detection → facial recognition → attendance record
- **Confidence Thresholds**: 95%+ auto-approve, 70-94% pending review, <70% rejected

## Database Schema (PostGIS)

Key tables: `admin_users`, `sonta_heads`, `meetings`, `qr_codes`, `attendance`, `verification_attempts`, `pending_verifications`, `audit_log`

The `validate_geofence()` PostgreSQL function uses `ST_DWithin` for location verification.

## API Structure

- `/api/auth/*` - Authentication (login, logout, refresh, me)
- `/api/sonta-heads/*` - Member CRUD and bulk import
- `/api/meetings/*` - Meeting CRUD, start/end, regenerate QR
- `/api/qr/:token/*` - QR validation
- `/api/attendance/*` - Check-in, manual operations, pending verifications
- `/api/analytics/*` - Reports and exports

## WebSocket Events

- `join-meeting` / `leave-meeting` - Room management
- `attendance-update` - Real-time check-in notifications
- `pending-verification` - New verification for admin review
- `meeting-status-changed` - Status transitions
- `qr-regenerated` - QR code refresh notification

## Security Considerations

- QR tokens are HMAC-signed with meeting ID, timestamp, and random bytes
- Facial embeddings are encrypted with AES-256-GCM before storage
- Rate limiting: 3 check-in attempts per minute per IP
- All admin actions logged to audit trail
- Geofence validation prevents remote check-ins

## Frontend Structure (Planned)

```
src/
├── components/
│   ├── common/         # Shared UI components
│   ├── layout/         # Header, Sidebar, DashboardLayout
│   ├── meetings/       # Meeting management, QR display
│   ├── attendance/     # Live monitor, pending verifications
│   ├── sonta-heads/    # Member management
│   ├── check-in/       # QR scanner, camera, liveness
│   └── analytics/      # Charts and reports
├── hooks/              # Custom hooks (useAuth, useWebSocket, etc.)
├── services/           # API service layer
├── store/              # Zustand stores
├── types/              # TypeScript interfaces
└── pages/              # Route components
```

## Development Environment

```bash
# Local services (via Docker Compose)
Backend: localhost:3000
Frontend: localhost:5173
PostgreSQL: localhost:5432
Redis: localhost:6379
```

## Deployment

- Backend: AWS EC2 / Render / DigitalOcean
- Frontend: Vercel / Netlify
- Database: AWS RDS / DigitalOcean Managed PostgreSQL
- CI/CD: GitHub Actions
