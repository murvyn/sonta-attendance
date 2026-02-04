# Sonta Head Attendance System - Complete Technical Implementation Plan

## Table of Contents
1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [System Architecture](#system-architecture)
4. [Database Design](#database-design)
5. [API Endpoints](#api-endpoints)
6. [Frontend Components](#frontend-components)
7. [Security Implementation](#security-implementation)
8. [Third-Party Services](#third-party-services)
9. [Development Phases](#development-phases)
10. [Deployment Strategy](#deployment-strategy)
11. [Testing Strategy](#testing-strategy)
12. [Cost Estimation](#cost-estimation)

---

## Project Overview

### Project Name
Sonta Head Attendance Verification System

### Project Goal
Build a secure, automated attendance tracking system that uses QR codes, facial recognition, and geolocation to verify physical presence at meetings.

### Key Features
- QR code-based check-in
- Facial recognition verification
- Geofencing (location-based verification)
- Liveness detection (anti-spoofing)
- Real-time admin dashboard
- Manual attendance management
- Analytics and reporting
- Audit logging

### Success Metrics
- Check-in time: < 20 seconds per person
- Facial recognition accuracy: > 95%
- System uptime: 99.5%
- Zero successful attendance fraud

---

## Technology Stack

### Frontend
```
Framework: React 18.x
Language: TypeScript 5.x
Build Tool: Vite 5.x
State Management: Zustand (lightweight alternative to Redux)
Styling: Tailwind CSS 3.x
UI Components: shadcn/ui (built on Radix UI)
Real-time: Socket.io-client
Maps: Leaflet.js + OpenStreetMap
Charts: Recharts
QR Scanner: html5-qrcode
Camera: react-webcam
Forms: React Hook Form + Zod validation
HTTP Client: Axios
Date/Time: date-fns
```

**Why These Choices?**
- **React + TypeScript**: Type safety, component reusability, large ecosystem
- **Vite**: Fast builds, excellent developer experience
- **Zustand**: Simple state management, no boilerplate
- **Tailwind**: Rapid UI development, consistent design
- **shadcn/ui**: Accessible, customizable components
- **Socket.io**: Real-time attendance updates for admins
- **Leaflet**: Open-source maps, no API costs

### Backend
```
Framework: NestJS 10.x
Language: TypeScript 5.x
Runtime: Node.js 20.x LTS
API Style: RESTful + WebSocket
Authentication: JWT (JSON Web Tokens)
Password Hashing: bcrypt
ORM: TypeORM
Validation: class-validator + class-transformer
File Upload: Multer
Image Processing: Sharp
Environment: dotenv
Logger: Winston
Rate Limiting: @nestjs/throttler
```

**Why These Choices?**
- **NestJS**: Enterprise-ready, modular architecture, built-in DI
- **TypeORM**: Type-safe database queries, migrations support
- **JWT**: Stateless authentication, scalable
- **Sharp**: Fast image processing for photo compression
- **Winston**: Production-grade logging

### Database
```
Primary Database: PostgreSQL 16.x
Extensions: 
  - PostGIS (geospatial queries)
  - pgcrypto (encryption)
Cache: Redis 7.x (for QR token validation, session management)
```

**Why These Choices?**
- **PostgreSQL**: ACID compliance, JSON support, excellent geospatial features
- **PostGIS**: Native location-based queries (ST_DWithin for geofencing)
- **Redis**: Fast key-value store for QR tokens, reduces DB load

### Facial Recognition
```
Option 1 (Cloud-based): AWS Rekognition
Option 2 (Self-hosted): face-api.js + TensorFlow.js
```

**Recommendation**: Start with AWS Rekognition for MVP, migrate to self-hosted if costs become prohibitive.

**Why AWS Rekognition?**
- Pre-trained models, high accuracy
- Liveness detection built-in
- Face comparison API
- Handles embedding storage
- Pay-per-use pricing

**face-api.js Alternative:**
- Free, runs in browser
- Good accuracy (SSD MobileNet v1)
- Privacy-friendly (no data leaves server)
- Requires more setup

### File Storage
```
Cloud Storage: AWS S3 (images, QR codes)
CDN: CloudFront (fast image delivery)
Alternative: DigitalOcean Spaces (cheaper S3-compatible)
```

### Real-time Communication
```
WebSocket: Socket.io
Use Cases:
  - Live attendance updates on admin dashboard
  - Pending verification notifications
  - Meeting status changes
```

### DevOps & Infrastructure
```
Hosting: 
  - Backend: AWS EC2 / DigitalOcean Droplet / Render
  - Frontend: Vercel / Netlify / AWS Amplify
  - Database: AWS RDS PostgreSQL / DigitalOcean Managed Database

CI/CD: GitHub Actions
Containerization: Docker + Docker Compose
Reverse Proxy: Nginx
SSL: Let's Encrypt (free)
Monitoring: 
  - Application: Sentry (error tracking)
  - Infrastructure: AWS CloudWatch / Prometheus + Grafana
Environment Management: 
  - Development
  - Staging  
  - Production
```

### Development Tools
```
Version Control: Git + GitHub
API Testing: Postman / Insomnia
Database Client: DBeaver / pgAdmin
Code Quality: ESLint + Prettier
Git Hooks: Husky + lint-staged
Documentation: Swagger/OpenAPI (auto-generated from NestJS)
```

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────┐              ┌──────────────────┐     │
│  │  Admin Dashboard │              │  Check-in Page   │     │
│  │  (React + TS)    │              │  (React + TS)    │     │
│  │                  │              │                  │     │
│  │  - Meeting Mgmt  │              │  - QR Scanner    │     │
│  │  - Live Monitor  │              │  - Camera        │     │
│  │  - Analytics     │              │  - Liveness      │     │
│  │  - Reports       │              │  - Geolocation   │     │
│  └────────┬─────────┘              └────────┬─────────┘     │
│           │                                 │                │
└───────────┼─────────────────────────────────┼────────────────┘
            │                                 │
            │ HTTPS + WebSocket               │ HTTPS
            │                                 │
┌───────────▼─────────────────────────────────▼────────────────┐
│                      API GATEWAY LAYER                        │
├───────────────────────────────────────────────────────────────┤
│                       Nginx (Reverse Proxy)                   │
│                   SSL Termination | Load Balancing            │
└───────────────────────────────────┬───────────────────────────┘
                                    │
┌───────────────────────────────────▼───────────────────────────┐
│                    APPLICATION LAYER                          │
├───────────────────────────────────────────────────────────────┤
│                    NestJS Backend Server                      │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ Auth Module  │  │Meeting Module│  │Attendance Mod│       │
│  │              │  │              │  │              │       │
│  │ - Login      │  │ - CRUD       │  │ - Check-in   │       │
│  │ - JWT        │  │ - QR Gen     │  │ - Validation │       │
│  │ - Guards     │  │ - Status Mgmt│  │ - Facial Rec │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ Sonta Module │  │ Analytics    │  │ WebSocket    │       │
│  │              │  │ Module       │  │ Gateway      │       │
│  │ - CRUD       │  │              │  │              │       │
│  │ - Bulk Ops   │  │ - Reports    │  │ - Live Feed  │       │
│  │ - Face Enroll│  │ - Exports    │  │ - Notifications      │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│                                                               │
└───────────────────────────────────┬───────────────────────────┘
                                    │
┌───────────────────────────────────▼───────────────────────────┐
│                      DATA LAYER                               │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────┐        ┌──────────────────────┐    │
│  │ PostgreSQL + PostGIS │        │     Redis Cache      │    │
│  │                      │        │                      │    │
│  │ - User Data          │        │ - QR Tokens          │    │
│  │ - Meetings           │        │ - Session Data       │    │
│  │ - Attendance         │        │ - Rate Limiting      │    │
│  │ - Audit Logs         │        │                      │    │
│  └──────────────────────┘        └──────────────────────┘    │
│                                                               │
└───────────────────────────────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼───────────────────────────┐
│                   EXTERNAL SERVICES                           │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────┐  ┌──────────────────┐                  │
│  │ AWS Rekognition  │  │     AWS S3       │                  │
│  │                  │  │                  │                  │
│  │ - Face Compare   │  │ - Image Storage  │                  │
│  │ - Liveness       │  │ - QR Images      │                  │
│  │ - Embeddings     │  │                  │                  │
│  └──────────────────┘  └──────────────────┘                  │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

### Request Flow Diagrams

#### Check-in Flow
```
User Scans QR Code
       ↓
Frontend: Validate QR Token (GET /api/qr/:token/validate)
       ↓
Frontend: Request Geolocation Permission
       ↓
Frontend: Send Location to Backend (POST /api/attendance/verify-location)
       ↓
Backend: Check Geofence (PostGIS ST_DWithin)
       ↓
   [Outside] → Return Error 403
       ↓
   [Inside] → Return Success
       ↓
Frontend: Start Camera + Liveness Detection
       ↓
Frontend: Capture Photo
       ↓
Frontend: Upload Photo (POST /api/attendance/check-in)
       ↓
Backend: Extract Face Embedding
       ↓
Backend: Compare Against Database (AWS Rekognition / face-api.js)
       ↓
   [Score >= 95%] → Auto-approve → Create Attendance Record
       ↓
   [Score 70-94%] → Create Pending Verification
       ↓
   [Score < 70%] → Increment Attempts → Reject
       ↓
Backend: Emit WebSocket Event to Admin Dashboard
       ↓
Frontend: Show Result to User
```

#### Real-time Admin Dashboard Flow
```
Admin Opens Dashboard
       ↓
Frontend: Connect WebSocket (io.connect('/attendance'))
       ↓
Backend: Join Room (socket.join(`meeting-${meetingId}`))
       ↓
Backend: Send Initial State (current attendance list)
       ↓
[User Checks In]
       ↓
Backend: Emit to Room (io.to(`meeting-${meetingId}`).emit('attendance-update'))
       ↓
Frontend: Update UI in Real-time
```

---

## Database Design

### Complete Schema (PostgreSQL)

```sql
-- Enable Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Admin Users Table
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin')),
  is_active BOOLEAN DEFAULT TRUE,
  last_login_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for admin_users
CREATE INDEX idx_admin_users_username ON admin_users(username);
CREATE INDEX idx_admin_users_email ON admin_users(email);

-- Sonta Heads Table
CREATE TABLE sonta_heads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) UNIQUE NOT NULL,
  email VARCHAR(255),
  profile_image_url TEXT NOT NULL,
  profile_image_s3_key TEXT,
  facial_embedding_id VARCHAR(255), -- AWS Rekognition Face ID or local embedding reference
  facial_embedding BYTEA, -- Encrypted embedding for self-hosted solution
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  enrollment_date DATE DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for sonta_heads
CREATE INDEX idx_sonta_heads_phone ON sonta_heads(phone);
CREATE INDEX idx_sonta_heads_status ON sonta_heads(status);
CREATE INDEX idx_sonta_heads_name ON sonta_heads(name);

-- Meetings Table
CREATE TABLE meetings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  location_name VARCHAR(255) NOT NULL,
  location_address TEXT,
  location_coordinates GEOGRAPHY(POINT, 4326) NOT NULL,
  geofence_radius_meters INT DEFAULT 100 CHECK (geofence_radius_meters > 0),
  scheduled_start TIMESTAMP NOT NULL,
  scheduled_end TIMESTAMP NOT NULL,
  actual_start TIMESTAMP,
  actual_end TIMESTAMP,
  late_arrival_cutoff_minutes INT,
  qr_expiry_strategy VARCHAR(50) NOT NULL CHECK (qr_expiry_strategy IN ('until_end', 'max_scans', 'time_based')),
  qr_expiry_minutes INT,
  qr_max_scans INT,
  status VARCHAR(50) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'active', 'ended', 'cancelled')),
  expected_attendees INT,
  created_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for meetings
CREATE INDEX idx_meetings_status ON meetings(status);
CREATE INDEX idx_meetings_scheduled_start ON meetings(scheduled_start);
CREATE INDEX idx_meetings_location ON meetings USING GIST(location_coordinates);

-- QR Codes Table
CREATE TABLE qr_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  qr_token TEXT UNIQUE NOT NULL,
  qr_image_url TEXT,
  qr_image_s3_key TEXT,
  scan_count INT DEFAULT 0,
  max_scans INT,
  is_active BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMP,
  invalidated_at TIMESTAMP,
  invalidated_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for qr_codes
CREATE INDEX idx_qr_codes_meeting_id ON qr_codes(meeting_id);
CREATE INDEX idx_qr_codes_token ON qr_codes(qr_token);
CREATE INDEX idx_qr_codes_is_active ON qr_codes(is_active);

-- Attendance Table
CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  sonta_head_id UUID NOT NULL REFERENCES sonta_heads(id) ON DELETE CASCADE,
  qr_code_id UUID REFERENCES qr_codes(id) ON DELETE SET NULL,
  check_in_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  check_in_method VARCHAR(50) NOT NULL CHECK (check_in_method IN ('facial_recognition', 'manual_admin')),
  facial_confidence_score DECIMAL(5,2),
  is_late BOOLEAN DEFAULT FALSE,
  verification_attempts INT DEFAULT 1,
  is_suspicious BOOLEAN DEFAULT FALSE,
  check_in_location GEOGRAPHY(POINT, 4326),
  device_info JSONB,
  checked_in_by_admin UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(meeting_id, sonta_head_id)
);

-- Indexes for attendance
CREATE INDEX idx_attendance_meeting_id ON attendance(meeting_id);
CREATE INDEX idx_attendance_sonta_head_id ON attendance(sonta_head_id);
CREATE INDEX idx_attendance_check_in_timestamp ON attendance(check_in_timestamp);
CREATE INDEX idx_attendance_is_suspicious ON attendance(is_suspicious);
CREATE INDEX idx_attendance_device_info ON attendance USING GIN(device_info);

-- Verification Attempts Table
CREATE TABLE verification_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  sonta_head_id UUID REFERENCES sonta_heads(id) ON DELETE SET NULL,
  qr_code_id UUID REFERENCES qr_codes(id) ON DELETE SET NULL,
  attempt_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  facial_confidence_score DECIMAL(5,2),
  result VARCHAR(50) NOT NULL CHECK (result IN ('success', 'low_confidence', 'rejected', 'liveness_failed', 'outside_geofence')),
  captured_image_url TEXT,
  captured_image_s3_key TEXT,
  check_in_location GEOGRAPHY(POINT, 4326),
  device_info JSONB,
  error_message TEXT
);

-- Indexes for verification_attempts
CREATE INDEX idx_verification_attempts_meeting_id ON verification_attempts(meeting_id);
CREATE INDEX idx_verification_attempts_sonta_head_id ON verification_attempts(sonta_head_id);
CREATE INDEX idx_verification_attempts_result ON verification_attempts(result);

-- Pending Verifications Table
CREATE TABLE pending_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  sonta_head_id UUID NOT NULL REFERENCES sonta_heads(id) ON DELETE CASCADE,
  qr_code_id UUID REFERENCES qr_codes(id) ON DELETE SET NULL,
  captured_image_url TEXT NOT NULL,
  captured_image_s3_key TEXT,
  profile_image_url TEXT NOT NULL,
  facial_confidence_score DECIMAL(5,2),
  check_in_location GEOGRAPHY(POINT, 4326),
  device_info JSONB,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP,
  review_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for pending_verifications
CREATE INDEX idx_pending_verifications_meeting_id ON pending_verifications(meeting_id);
CREATE INDEX idx_pending_verifications_status ON pending_verifications(status);
CREATE INDEX idx_pending_verifications_created_at ON pending_verifications(created_at);

-- Audit Log Table
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  action VARCHAR(255) NOT NULL,
  entity_type VARCHAR(100),
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for audit_log
CREATE INDEX idx_audit_log_admin_id ON audit_log(admin_id);
CREATE INDEX idx_audit_log_entity_type ON audit_log(entity_type);
CREATE INDEX idx_audit_log_timestamp ON audit_log(timestamp);
CREATE INDEX idx_audit_log_action ON audit_log(action);

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_admin_users_updated_at BEFORE UPDATE ON admin_users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sonta_heads_updated_at BEFORE UPDATE ON sonta_heads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_meetings_updated_at BEFORE UPDATE ON meetings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_attendance_updated_at BEFORE UPDATE ON attendance FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function for geofence validation
CREATE OR REPLACE FUNCTION validate_geofence(
  meeting_uuid UUID,
  user_lat DOUBLE PRECISION,
  user_lng DOUBLE PRECISION
)
RETURNS BOOLEAN AS $$
DECLARE
  meeting_location GEOGRAPHY;
  geofence_radius INT;
  distance_meters DOUBLE PRECISION;
BEGIN
  SELECT location_coordinates, geofence_radius_meters 
  INTO meeting_location, geofence_radius
  FROM meetings 
  WHERE id = meeting_uuid;
  
  IF meeting_location IS NULL THEN
    RETURN FALSE;
  END IF;
  
  distance_meters := ST_Distance(
    meeting_location,
    ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography
  );
  
  RETURN distance_meters <= geofence_radius;
END;
$$ LANGUAGE plpgsql;
```

### Database Relationships Diagram

```
admin_users (1) ──── (M) meetings [created_by]
admin_users (1) ──── (M) audit_log [admin_id]
admin_users (1) ──── (M) attendance [checked_in_by_admin]
admin_users (1) ──── (M) pending_verifications [reviewed_by]

meetings (1) ──── (M) qr_codes [meeting_id]
meetings (1) ──── (M) attendance [meeting_id]
meetings (1) ──── (M) verification_attempts [meeting_id]
meetings (1) ──── (M) pending_verifications [meeting_id]

sonta_heads (1) ──── (M) attendance [sonta_head_id]
sonta_heads (1) ──── (M) verification_attempts [sonta_head_id]
sonta_heads (1) ──── (M) pending_verifications [sonta_head_id]

qr_codes (1) ──── (M) attendance [qr_code_id]
qr_codes (1) ──── (M) verification_attempts [qr_code_id]
qr_codes (1) ──── (M) pending_verifications [qr_code_id]
```

---

## API Endpoints

### Authentication Endpoints

```
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/refresh
GET    /api/auth/me
POST   /api/auth/change-password
```

#### Example: POST /api/auth/login
```typescript
// Request
{
  "username": "admin",
  "password": "securePassword123"
}

// Response (200 OK)
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "username": "admin",
    "role": "super_admin",
    "full_name": "Admin User"
  }
}

// Error (401 Unauthorized)
{
  "statusCode": 401,
  "message": "Invalid credentials"
}
```

### Sonta Heads Endpoints

```
GET    /api/sonta-heads
GET    /api/sonta-heads/:id
POST   /api/sonta-heads
PUT    /api/sonta-heads/:id
DELETE /api/sonta-heads/:id
POST   /api/sonta-heads/bulk-import
GET    /api/sonta-heads/:id/attendance-history
```

#### Example: POST /api/sonta-heads
```typescript
// Request (multipart/form-data)
{
  "name": "John Doe",
  "phone": "+1234567890",
  "email": "john@example.com",
  "profile_image": File // Image file
}

// Response (201 Created)
{
  "id": "uuid",
  "name": "John Doe",
  "phone": "+1234567890",
  "email": "john@example.com",
  "profile_image_url": "https://s3.../profile.jpg",
  "facial_embedding_id": "aws-rekognition-face-id",
  "status": "active",
  "created_at": "2025-02-01T10:00:00Z"
}

// Error (400 Bad Request)
{
  "statusCode": 400,
  "message": "Face not detected in image"
}
```

### Meetings Endpoints

```
GET    /api/meetings
GET    /api/meetings/:id
POST   /api/meetings
PUT    /api/meetings/:id
DELETE /api/meetings/:id
PATCH  /api/meetings/:id/start
PATCH  /api/meetings/:id/end
GET    /api/meetings/:id/attendance
GET    /api/meetings/:id/statistics
POST   /api/meetings/:id/regenerate-qr
```

#### Example: POST /api/meetings
```typescript
// Request
{
  "title": "Leadership Sync - Feb 2025",
  "description": "Monthly leadership meeting",
  "location_name": "Main Conference Room",
  "location_address": "123 Church St, City, State",
  "location_coordinates": {
    "latitude": 40.7128,
    "longitude": -74.0060
  },
  "geofence_radius_meters": 100,
  "scheduled_start": "2025-02-15T10:00:00Z",
  "scheduled_end": "2025-02-15T12:00:00Z",
  "late_arrival_cutoff_minutes": 15,
  "qr_expiry_strategy": "until_end",
  "expected_attendees": 25
}

// Response (201 Created)
{
  "id": "uuid",
  "title": "Leadership Sync - Feb 2025",
  "qr_code": {
    "id": "uuid",
    "qr_token": "encrypted-token",
    "qr_image_url": "https://s3.../qr-code.png",
    "is_active": false // Not active until meeting starts
  },
  "status": "scheduled",
  "created_at": "2025-02-01T10:00:00Z"
}
```

### QR Code Endpoints

```
GET    /api/qr/:token/validate
GET    /api/qr/:token/info
POST   /api/meetings/:meetingId/qr/regenerate
PATCH  /api/qr/:id/invalidate
```

#### Example: GET /api/qr/:token/validate
```typescript
// Response (200 OK)
{
  "valid": true,
  "meeting": {
    "id": "uuid",
    "title": "Leadership Sync",
    "status": "active",
    "location_name": "Main Conference Room",
    "location_coordinates": {
      "latitude": 40.7128,
      "longitude": -74.0060
    },
    "geofence_radius_meters": 100
  }
}

// Error (400 Bad Request)
{
  "statusCode": 400,
  "message": "QR code has expired",
  "code": "QR_EXPIRED"
}
```

### Attendance Endpoints

```
POST   /api/attendance/verify-location
POST   /api/attendance/check-in
POST   /api/attendance/manual-check-in
DELETE /api/attendance/:id
GET    /api/attendance/pending-verifications
PATCH  /api/attendance/pending-verifications/:id/approve
PATCH  /api/attendance/pending-verifications/:id/reject
GET    /api/attendance/statistics
POST   /api/attendance/export
```

#### Example: POST /api/attendance/verify-location
```typescript
// Request
{
  "meeting_id": "uuid",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "accuracy": 20 // meters
}

// Response (200 OK)
{
  "valid": true,
  "distance_meters": 45
}

// Error (403 Forbidden)
{
  "statusCode": 403,
  "message": "You are outside the meeting geofence",
  "distance_meters": 250
}
```

#### Example: POST /api/attendance/check-in
```typescript
// Request (multipart/form-data)
{
  "qr_token": "encrypted-token",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "captured_image": File, // Captured photo
  "device_info": {
    "user_agent": "Mozilla/5.0...",
    "platform": "iOS"
  }
}

// Response - Auto Approved (201 Created)
{
  "status": "approved",
  "attendance": {
    "id": "uuid",
    "sonta_head": {
      "id": "uuid",
      "name": "John Doe"
    },
    "meeting": {
      "id": "uuid",
      "title": "Leadership Sync"
    },
    "check_in_timestamp": "2025-02-15T10:05:00Z",
    "facial_confidence_score": 98.5,
    "is_late": false,
    "check_in_method": "facial_recognition"
  }
}

// Response - Pending Review (202 Accepted)
{
  "status": "pending",
  "message": "Your check-in is pending admin review",
  "pending_verification_id": "uuid",
  "facial_confidence_score": 85.2
}

// Response - Rejected (400 Bad Request)
{
  "statusCode": 400,
  "message": "Face not recognized. Please try again.",
  "attempts_remaining": 2,
  "facial_confidence_score": 45.3
}
```

### Analytics Endpoints

```
GET    /api/analytics/overview
GET    /api/analytics/sonta-head/:id
GET    /api/analytics/meeting/:id
GET    /api/analytics/attendance-trends
POST   /api/analytics/export-report
```

### Admin Endpoints

```
GET    /api/admins
POST   /api/admins
PUT    /api/admins/:id
DELETE /api/admins/:id
GET    /api/audit-log
```

### WebSocket Events

```
// Client → Server
'join-meeting': { meetingId: string }
'leave-meeting': { meetingId: string }

// Server → Client
'attendance-update': {
  type: 'new' | 'removed',
  attendance: AttendanceRecord
}

'pending-verification': {
  pendingVerification: PendingVerification
}

'meeting-status-changed': {
  meetingId: string,
  status: 'scheduled' | 'active' | 'ended'
}

'qr-regenerated': {
  meetingId: string,
  newQrCode: QRCode
}
```

---

## Frontend Components

### Folder Structure

```
src/
├── assets/
│   ├── images/
│   └── icons/
├── components/
│   ├── common/
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   ├── Spinner.tsx
│   │   ├── Table.tsx
│   │   ├── Card.tsx
│   │   └── Badge.tsx
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   ├── Footer.tsx
│   │   └── DashboardLayout.tsx
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   └── ProtectedRoute.tsx
│   ├── meetings/
│   │   ├── MeetingList.tsx
│   │   ├── MeetingCard.tsx
│   │   ├── CreateMeetingForm.tsx
│   │   ├── EditMeetingForm.tsx
│   │   ├── MeetingDetails.tsx
│   │   ├── QRCodeDisplay.tsx
│   │   └── LocationPicker.tsx
│   ├── attendance/
│   │   ├── LiveAttendanceMonitor.tsx
│   │   ├── AttendanceTable.tsx
│   │   ├── PendingVerificationCard.tsx
│   │   ├── PendingVerificationList.tsx
│   │   ├── ManualCheckInModal.tsx
│   │   └── AttendanceStats.tsx
│   ├── sonta-heads/
│   │   ├── SontaHeadList.tsx
│   │   ├── SontaHeadCard.tsx
│   │   ├── CreateSontaHeadForm.tsx
│   │   ├── EditSontaHeadForm.tsx
│   │   ├── BulkImportModal.tsx
│   │   └── AttendanceHistory.tsx
│   ├── check-in/
│   │   ├── QRScanner.tsx
│   │   ├── LocationVerification.tsx
│   │   ├── LivenessDetection.tsx
│   │   ├── CameraCapture.tsx
│   │   ├── CheckInProgress.tsx
│   │   └── CheckInResult.tsx
│   └── analytics/
│       ├── OverviewDashboard.tsx
│       ├── AttendanceChart.tsx
│       ├── SontaHeadStats.tsx
│       ├── MeetingStats.tsx
│       └── ExportReportModal.tsx
├── hooks/
│   ├── useAuth.ts
│   ├── useMeetings.ts
│   ├── useAttendance.ts
│   ├── useSontaHeads.ts
│   ├── useWebSocket.ts
│   ├── useGeolocation.ts
│   ├── useCamera.ts
│   └── useAnalytics.ts
├── services/
│   ├── api.ts
│   ├── auth.service.ts
│   ├── meeting.service.ts
│   ├── attendance.service.ts
│   ├── sonta-head.service.ts
│   ├── analytics.service.ts
│   ├── upload.service.ts
│   └── websocket.service.ts
├── store/
│   ├── authStore.ts
│   ├── meetingStore.ts
│   ├── attendanceStore.ts
│   └── uiStore.ts
├── types/
│   ├── auth.types.ts
│   ├── meeting.types.ts
│   ├── attendance.types.ts
│   ├── sonta-head.types.ts
│   └── common.types.ts
├── utils/
│   ├── constants.ts
│   ├── validators.ts
│   ├── formatters.ts
│   ├── geolocation.ts
│   └── helpers.ts
├── pages/
│   ├── Login.tsx
│   ├── Dashboard.tsx
│   ├── Meetings/
│   │   ├── MeetingsList.tsx
│   │   ├── CreateMeeting.tsx
│   │   ├── MeetingDetail.tsx
│   │   └── LiveMonitor.tsx
│   ├── SontaHeads/
│   │   ├── SontaHeadsList.tsx
│   │   ├── CreateSontaHead.tsx
│   │   └── SontaHeadDetail.tsx
│   ├── Analytics/
│   │   ├── Overview.tsx
│   │   ├── Reports.tsx
│   │   └── Trends.tsx
│   ├── CheckIn.tsx
│   └── NotFound.tsx
├── App.tsx
├── main.tsx
└── vite.config.ts
```

### Key Component Descriptions

#### 1. LiveAttendanceMonitor.tsx
**Purpose**: Real-time dashboard for monitoring attendance during active meeting

**Features**:
- WebSocket connection for live updates
- Progress bar (X/Y checked in)
- Three sections: Checked In, Not Checked In, Pending Review
- Manual check-in button for each absent person
- Pending verification review modal
- QR code display with regenerate button

**State Management**:
- Connected to WebSocket
- Subscribes to attendance updates
- Auto-refreshes when new check-in occurs

#### 2. QRScanner.tsx
**Purpose**: Scans QR code to initiate check-in

**Features**:
- Uses html5-qrcode library
- Validates QR token with backend
- Handles errors (expired QR, invalid format)
- Redirects to check-in flow on success

#### 3. LivenessDetection.tsx
**Purpose**: Prevents photo spoofing during check-in

**Features**:
- Prompts user to blink, smile, turn head
- Uses face-api.js for basic liveness check
- Captures photo when liveness confirmed
- Clear visual feedback for each step

#### 4. CameraCapture.tsx
**Purpose**: Captures photo for facial recognition

**Features**:
- Uses react-webcam
- Front-facing camera only
- Preview with capture button
- Retake option
- Compresses image before upload

#### 5. PendingVerificationCard.tsx
**Purpose**: Admin reviews borderline facial matches

**Features**:
- Side-by-side comparison (captured vs profile)
- Confidence score display
- Approve/Reject buttons
- Optional notes field

#### 6. LocationPicker.tsx
**Purpose**: Admin selects meeting location on map

**Features**:
- Leaflet map with OpenStreetMap
- Click to set coordinates
- Address search/autocomplete
- Adjustable geofence radius (visual circle overlay)

---

## Security Implementation

### Authentication & Authorization

#### JWT Strategy
```typescript
// Access Token
{
  "sub": "user-id",
  "username": "admin",
  "role": "super_admin",
  "iat": 1675000000,
  "exp": 1675003600 // 1 hour
}

// Refresh Token
{
  "sub": "user-id",
  "iat": 1675000000,
  "exp": 1682776000 // 90 days
}
```

**Implementation**:
- Access token expires in 1 hour
- Refresh token expires in 90 days
- Refresh token rotation on use
- Store refresh token in httpOnly cookie
- Access token in memory (Zustand store)

#### Role-Based Access Control (RBAC)

```typescript
// Roles
enum UserRole {
  SUPER_ADMIN = 'super_admin', // Full access
  ADMIN = 'admin'               // Standard access
}

// Permissions Matrix
const permissions = {
  super_admin: [
    'create:admin',
    'delete:admin',
    'create:meeting',
    'delete:meeting',
    'manage:sonta-heads',
    'view:analytics',
    'export:reports',
    'view:audit-log'
  ],
  admin: [
    'create:meeting',
    'edit:meeting',
    'manage:attendance',
    'view:analytics',
    'export:reports'
  ]
}
```

### Password Security

```typescript
// Backend (NestJS)
import * as bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;

// Hash password
const hashedPassword = await bcrypt.hash(plainPassword, SALT_ROUNDS);

// Verify password
const isMatch = await bcrypt.compare(plainPassword, hashedPassword);
```

**Requirements**:
- Minimum 8 characters
- Must contain uppercase, lowercase, number, special character
- Not in common password list (check against top 10k)

### QR Code Security

```typescript
// QR Token Generation
import * as crypto from 'crypto';

function generateQRToken(meetingId: string): string {
  const timestamp = Date.now();
  const randomBytes = crypto.randomBytes(16).toString('hex');
  const payload = `${meetingId}:${timestamp}:${randomBytes}`;
  
  const hmac = crypto.createHmac('sha256', process.env.QR_SECRET);
  hmac.update(payload);
  const signature = hmac.digest('hex');
  
  return Buffer.from(`${payload}:${signature}`).toString('base64url');
}

// QR Token Validation
function validateQRToken(token: string): { valid: boolean; meetingId?: string } {
  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf-8');
    const [meetingId, timestamp, randomBytes, signature] = decoded.split(':');
    
    // Verify signature
    const hmac = crypto.createHmac('sha256', process.env.QR_SECRET);
    hmac.update(`${meetingId}:${timestamp}:${randomBytes}`);
    const expectedSignature = hmac.digest('hex');
    
    if (signature !== expectedSignature) {
      return { valid: false };
    }
    
    // Check expiry (if time-based strategy)
    // Check scan count (if max scans strategy)
    // Check meeting status
    
    return { valid: true, meetingId };
  } catch (error) {
    return { valid: false };
  }
}
```

### Facial Recognition Security

#### Data Encryption
```typescript
// Encrypt facial embedding before storing
import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;

function encryptEmbedding(embedding: Float32Array): Buffer {
  const password = process.env.EMBEDDING_ENCRYPTION_KEY;
  const salt = crypto.randomBytes(SALT_LENGTH);
  const key = crypto.pbkdf2Sync(password, salt, 100000, KEY_LENGTH, 'sha512');
  const iv = crypto.randomBytes(IV_LENGTH);
  
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const embeddingBuffer = Buffer.from(embedding.buffer);
  
  const encrypted = Buffer.concat([cipher.update(embeddingBuffer), cipher.final()]);
  const tag = cipher.getAuthTag();
  
  return Buffer.concat([salt, iv, tag, encrypted]);
}

function decryptEmbedding(encryptedData: Buffer): Float32Array {
  const password = process.env.EMBEDDING_ENCRYPTION_KEY;
  
  const salt = encryptedData.slice(0, SALT_LENGTH);
  const iv = encryptedData.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const tag = encryptedData.slice(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
  const encrypted = encryptedData.slice(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
  
  const key = crypto.pbkdf2Sync(password, salt, 100000, KEY_LENGTH, 'sha512');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return new Float32Array(decrypted.buffer);
}
```

#### AWS Rekognition Integration
```typescript
import { RekognitionClient, CompareFacesCommand, DetectFacesCommand } from '@aws-sdk/client-rekognition';

const rekognitionClient = new RekognitionClient({ region: 'us-east-1' });

// Index face during enrollment
async function enrollFace(imageBuffer: Buffer): Promise<string> {
  const command = new DetectFacesCommand({
    Image: { Bytes: imageBuffer },
    Attributes: ['ALL']
  });
  
  const response = await rekognitionClient.send(command);
  
  if (response.FaceDetails.length === 0) {
    throw new Error('No face detected');
  }
  
  // Store in AWS Rekognition collection
  // Return Face ID
}

// Compare faces during check-in
async function compareFaces(
  capturedImage: Buffer,
  profileImage: Buffer
): Promise<number> {
  const command = new CompareFacesCommand({
    SourceImage: { Bytes: capturedImage },
    TargetImage: { Bytes: profileImage },
    SimilarityThreshold: 70
  });
  
  const response = await rekognitionClient.send(command);
  
  if (response.FaceMatches.length === 0) {
    return 0;
  }
  
  return response.FaceMatches[0].Similarity;
}
```

### Geolocation Security

```typescript
// Validate geofence (PostgreSQL function already defined in schema)
async function validateGeofence(
  meetingId: string,
  userLat: number,
  userLng: number
): Promise<{ valid: boolean; distance: number }> {
  const result = await db.query(
    'SELECT validate_geofence($1, $2, $3) as valid, ' +
    'ST_Distance(' +
    '  (SELECT location_coordinates FROM meetings WHERE id = $1)::geography, ' +
    '  ST_SetSRID(ST_MakePoint($3, $2), 4326)::geography' +
    ') as distance',
    [meetingId, userLat, userLng]
  );
  
  return {
    valid: result.rows[0].valid,
    distance: result.rows[0].distance
  };
}
```

### Rate Limiting

```typescript
// NestJS Throttler Configuration
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      ttl: 60, // Time window in seconds
      limit: 10, // Max requests per window
    }),
  ],
})
export class AppModule {}

// Custom rate limiting for check-in endpoint
@Throttle(3, 60) // 3 attempts per minute per IP
@Post('check-in')
async checkIn(@Body() dto: CheckInDto) {
  // ...
}
```

### CORS Configuration

```typescript
// main.ts
app.enableCors({
  origin: [
    'https://admin.sonta-attendance.com',
    'https://checkin.sonta-attendance.com',
    process.env.NODE_ENV === 'development' ? 'http://localhost:5173' : null
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
});
```

### Input Validation

```typescript
// Using class-validator
import { IsString, IsNotEmpty, IsEmail, IsPhoneNumber, IsUUID, IsOptional } from 'class-validator';

export class CreateSontaHeadDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsPhoneNumber()
  phone: string;

  @IsEmail()
  @IsOptional()
  email?: string;
}

export class CheckInDto {
  @IsString()
  @IsNotEmpty()
  qr_token: string;

  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;
}
```

### SQL Injection Prevention

```typescript
// TypeORM automatically prevents SQL injection
// Always use parameterized queries

// GOOD
const user = await userRepository.findOne({
  where: { username: userInput }
});

// GOOD (raw query with parameters)
const result = await entityManager.query(
  'SELECT * FROM users WHERE username = $1',
  [userInput]
);

// BAD (vulnerable to SQL injection)
const result = await entityManager.query(
  `SELECT * FROM users WHERE username = '${userInput}'`
);
```

### XSS Prevention

```typescript
// Sanitize user inputs
import * as DOMPurify from 'isomorphic-dompurify';

function sanitizeInput(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [], // Strip all HTML
    ALLOWED_ATTR: []
  });
}

// React automatically escapes JSX
// Avoid dangerouslySetInnerHTML unless absolutely necessary
```

---

## Third-Party Services

### AWS Services Configuration

#### S3 Bucket Setup
```typescript
// Bucket structure
sonta-attendance-prod/
├── profile-images/
│   └── {sonta-head-id}.jpg
├── captured-images/
│   └── {timestamp}-{attempt-id}.jpg
└── qr-codes/
    └── {meeting-id}-{qr-id}.png

// S3 Configuration
{
  "Bucket": "sonta-attendance-prod",
  "ACL": "private",
  "CorsConfiguration": {
    "CorsRules": [{
      "AllowedHeaders": ["*"],
      "AllowedMethods": ["GET", "PUT"],
      "AllowedOrigins": ["https://admin.sonta-attendance.com", "https://checkin.sonta-attendance.com"],
      "MaxAgeSeconds": 3000
    }]
  },
  "LifecycleConfiguration": {
    "Rules": [{
      "Id": "DeleteOldCapturedImages",
      "Status": "Enabled",
      "Prefix": "captured-images/",
      "Expiration": {
        "Days": 30
      }
    }]
  }
}
```

#### AWS Rekognition Setup
```typescript
// Create collection for Sonta Heads
import { CreateCollectionCommand } from '@aws-sdk/client-rekognition';

await rekognitionClient.send(new CreateCollectionCommand({
  CollectionId: 'sonta-heads-collection'
}));

// Environment variables
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
AWS_REKOGNITION_COLLECTION_ID=sonta-heads-collection
```

### Email Service (Optional for Notifications)

**Recommended**: SendGrid or AWS SES

```typescript
// SendGrid configuration
import * as sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

async function sendPendingVerificationEmail(adminEmail: string, meetingTitle: string) {
  const msg = {
    to: adminEmail,
    from: 'noreply@sonta-attendance.com',
    subject: `Pending Verification - ${meetingTitle}`,
    text: `A new check-in requires your review for ${meetingTitle}.`,
    html: `<p>A new check-in requires your review for <strong>${meetingTitle}</strong>.</p>`
  };
  
  await sgMail.send(msg);
}
```

### SMS Service (Optional for Notifications)

**Recommended**: Twilio

```typescript
import twilio from 'twilio';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

async function sendMeetingReminder(phone: string, meetingTitle: string, startTime: Date) {
  await client.messages.create({
    body: `Reminder: ${meetingTitle} starts at ${startTime.toLocaleTimeString()}`,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: phone
  });
}
```

---

## Development Phases

### Phase 1: Foundation & Setup (Week 1-2)

**Backend**
- [x] NestJS project setup with TypeScript
- [x] PostgreSQL database setup with PostGIS
- [x] TypeORM configuration and migrations
- [x] Environment configuration (.env files)
- [x] Database schema implementation
- [x] Auth module (JWT, login, logout)
- [x] Admin CRUD endpoints
- [x] API documentation with Swagger

**Frontend**
- [x] React + Vite project setup
- [x] Tailwind CSS configuration
- [x] Folder structure
- [x] Routing setup (React Router)
- [x] Auth context and protected routes
- [x] Login page
- [x] Base layout components (Header, Sidebar)

**DevOps**
- [x] Git repository setup
- [x] Docker Compose for local development
- [x] Environment variable management
- [x] Database seeding scripts

**Deliverables**:
- Working login system
- Admin can create/edit/delete admin users
- Database migrations in place

---

### Phase 2: Sonta Heads Management (Week 3)

**Backend**
- [x] Sonta Heads CRUD endpoints
- [x] Image upload to S3
- [x] Face enrollment (AWS Rekognition or face-api.js)
- [x] Bulk import endpoint (CSV parsing)
- [x] Validation and error handling

**Frontend**
- [x] Sonta Heads list page with search/filter
- [x] Create Sonta Head form with image upload
- [x] Edit Sonta Head form
- [x] Delete confirmation modal
- [x] Bulk import modal with CSV upload
- [x] Image preview and validation

**Deliverables**:
- Admin can manage Sonta Heads
- Facial embeddings stored securely
- Bulk import functional

---

### Phase 3: Meeting Management (Week 4)

**Backend**
- [x] Meeting CRUD endpoints
- [x] QR code generation logic
- [x] Location storage (PostGIS)
- [x] Meeting status management (scheduled → active → ended)
- [x] QR regeneration endpoint
- [x] Meeting statistics endpoint

**Frontend**
- [x] Meeting list page
- [x] Create meeting form with location picker (Leaflet map)
- [x] Edit meeting form
- [x] Meeting detail page
- [x] QR code display component
- [x] QR regeneration button
- [x] Meeting status controls (Start, End)

**Deliverables**:
- Admin can create meetings with geofence
- QR codes generated automatically
- Meeting lifecycle management

---

### Phase 4: Check-in System (Week 5-6)

**Backend**
- [x] QR validation endpoint
- [x] Geofence validation function
- [x] Liveness detection integration
- [x] Facial recognition comparison
- [x] Check-in logic (auto-approve, pending, reject)
- [x] Verification attempts tracking
- [x] Pending verifications management
- [x] WebSocket gateway for real-time updates

**Frontend**
- [x] QR scanner component
- [x] Check-in page layout
- [x] Location permission request
- [x] Geofence validation display
- [x] Liveness detection UI
- [x] Camera capture component
- [x] Check-in progress indicators
- [x] Success/error result pages
- [x] Retry mechanism (3 attempts)

**Deliverables**:
- End-to-end check-in flow functional
- Geofencing works correctly
- Facial recognition accurate (>95%)
- Real-time updates on admin dashboard

---

### Phase 5: Admin Dashboard & Manual Operations (Week 7)

**Backend**
- [x] Live attendance WebSocket events
- [x] Manual check-in endpoint
- [x] Remove attendance endpoint
- [x] Pending verification approval/rejection endpoints
- [x] Audit logging for all admin actions

**Frontend**
- [x] Live attendance monitor component
- [x] WebSocket connection management
- [x] Manual check-in modal
- [x] Pending verification review modal
- [x] Attendance table with late flags
- [x] Real-time updates animation
- [x] Admin action confirmations

**Deliverables**:
- Admin dashboard fully functional
- Real-time attendance updates
- Manual operations working
- All admin actions logged

---

### Phase 6: Analytics & Reporting (Week 8)

**Backend**
- [x] Attendance statistics calculations
- [x] Analytics endpoints (per person, per meeting, trends)
- [x] Report export (CSV, PDF)
- [x] Attendance history endpoint

**Frontend**
- [x] Analytics dashboard
- [x] Charts (attendance trends, comparison)
- [x] Sonta Head statistics page
- [x] Meeting statistics page
- [x] Export report modal
- [x] Date range filters

**Deliverables**:
- Analytics dashboard with visualizations
- Export functionality (CSV, PDF)
- Historical attendance data accessible

---

### Phase 7: Testing & Bug Fixes (Week 9)

**Backend Testing**
- [x] Unit tests for critical functions (geofence, facial recognition)
- [x] Integration tests for API endpoints
- [x] Load testing (simulate 50+ concurrent check-ins)
- [x] Security testing (SQL injection, XSS, CSRF)

**Frontend Testing**
- [x] Component tests (Jest + React Testing Library)
- [x] E2E tests (Playwright)
- [x] Cross-browser testing (Chrome, Safari, Firefox)
- [x] Mobile responsiveness testing

**Bug Fixes**
- [x] Fix identified issues
- [x] Performance optimizations
- [x] UI/UX improvements based on testing

**Deliverables**:
- Test coverage >80%
- All critical bugs fixed
- Performance optimized

---

### Phase 8: Deployment & Launch (Week 10)

**Infrastructure**
- [x] Production database setup (AWS RDS or DigitalOcean)
- [x] Backend deployment (AWS EC2 / Render / DigitalOcean)
- [x] Frontend deployment (Vercel / Netlify)
- [x] SSL certificates (Let's Encrypt)
- [x] Domain setup
- [x] CDN configuration (CloudFront)
- [x] Monitoring setup (Sentry, CloudWatch)
- [x] Backup strategy (automated DB backups)

**CI/CD**
- [x] GitHub Actions workflows
  - Run tests on PR
  - Deploy to staging on merge to develop
  - Deploy to production on merge to main
- [x] Automated migrations

**Documentation**
- [x] Admin user guide
- [x] API documentation (Swagger)
- [x] Deployment guide
- [x] Troubleshooting guide

**Deliverables**:
- System live in production
- Monitoring active
- Documentation complete
- Admin training conducted

---

## Deployment Strategy

### Environment Setup

#### Development
```
Backend: localhost:3000
Frontend: localhost:5173
Database: localhost:5432
Redis: localhost:6379
```

#### Staging
```
Backend: https://api-staging.sonta-attendance.com
Frontend: https://staging.sonta-attendance.com
Database: AWS RDS / DigitalOcean Managed DB
Redis: AWS ElastiCache / DigitalOcean Managed Redis
```

#### Production
```
Backend: https://api.sonta-attendance.com
Frontend: https://app.sonta-attendance.com
Check-in: https://checkin.sonta-attendance.com (optional separate domain)
Database: AWS RDS / DigitalOcean Managed DB
Redis: AWS ElastiCache / DigitalOcean Managed Redis
```

### Deployment Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    Route 53 / DNS                        │
└───────────────────────┬──────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
┌───────▼─────┐  ┌──────▼──────┐  ┌────▼────────┐
│  Frontend   │  │   Backend   │  │  Check-in   │
│  (Vercel)   │  │ (AWS EC2 /  │  │   (Vercel)  │
│             │  │   Render)   │  │             │
└─────────────┘  └──────┬──────┘  └─────────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
┌───────▼─────┐  ┌──────▼──────┐  ┌────▼────────┐
│ PostgreSQL  │  │    Redis    │  │     S3      │
│   (RDS)     │  │(ElastiCache)│  │  (Storage)  │
└─────────────┘  └─────────────┘  └─────────────┘
```

### CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/backend-ci.yml
name: Backend CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgis/postgis:16-3.4
        env:
          POSTGRES_PASSWORD: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run test
      - run: npm run test:e2e

  deploy-staging:
    needs: test
    if: github.ref == 'refs/heads/develop'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Staging
        run: |
          # SSH into staging server
          # Pull latest code
          # Run migrations
          # Restart service

  deploy-production:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Production
        run: |
          # SSH into production server
          # Pull latest code
          # Run migrations
          # Restart service with zero downtime
```

### Docker Configuration

```dockerfile
# Dockerfile (Backend)
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./

EXPOSE 3000

CMD ["node", "dist/main"]
```

```yaml
# docker-compose.yml (Local Development)
version: '3.8'

services:
  postgres:
    image: postgis/postgis:16-3.4
    environment:
      POSTGRES_USER: sonta
      POSTGRES_PASSWORD: password
      POSTGRES_DB: sonta_attendance
    ports:
      - '5432:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - '6379:6379'

  backend:
    build: ./backend
    ports:
      - '3000:3000'
    environment:
      DATABASE_URL: postgresql://sonta:password@postgres:5432/sonta_attendance
      REDIS_URL: redis://redis:6379
    depends_on:
      - postgres
      - redis
    volumes:
      - ./backend:/app
      - /app/node_modules

volumes:
  postgres_data:
```

### Environment Variables

```bash
# Backend .env (Production)
NODE_ENV=production
PORT=3000

# Database
DATABASE_HOST=your-rds-endpoint.rds.amazonaws.com
DATABASE_PORT=5432
DATABASE_USER=sonta_admin
DATABASE_PASSWORD=secure-password
DATABASE_NAME=sonta_attendance

# Redis
REDIS_HOST=your-elasticache-endpoint.cache.amazonaws.com
REDIS_PORT=6379

# JWT
JWT_ACCESS_SECRET=your-super-secret-access-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key
JWT_ACCESS_EXPIRATION=3600
JWT_REFRESH_EXPIRATION=7776000

# AWS
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
AWS_S3_BUCKET=sonta-attendance-prod
AWS_REKOGNITION_COLLECTION_ID=sonta-heads-collection

# QR Security
QR_SECRET=your-qr-signing-secret

# Encryption
EMBEDDING_ENCRYPTION_KEY=your-embedding-encryption-key

# CORS
FRONTEND_URL=https://app.sonta-attendance.com
CHECKIN_URL=https://checkin.sonta-attendance.com

# Monitoring
SENTRY_DSN=https://...@sentry.io/...
```

---

## Testing Strategy

### Backend Testing

#### Unit Tests
```typescript
// geofence.service.spec.ts
import { GeofenceService } from './geofence.service';

describe('GeofenceService', () => {
  let service: GeofenceService;

  beforeEach(() => {
    service = new GeofenceService();
  });

  it('should return true when user is inside geofence', async () => {
    const result = await service.validateGeofence(
      'meeting-id',
      40.7128, // user lat
      -74.0060, // user lng
      40.7130, // meeting lat
      -74.0062, // meeting lng
      100 // radius meters
    );
    
    expect(result.valid).toBe(true);
    expect(result.distance).toBeLessThan(100);
  });

  it('should return false when user is outside geofence', async () => {
    const result = await service.validateGeofence(
      'meeting-id',
      40.7200, // far away
      -74.0100,
      40.7130,
      -74.0062,
      100
    );
    
    expect(result.valid).toBe(false);
    expect(result.distance).toBeGreaterThan(100);
  });
});
```

#### Integration Tests
```typescript
// attendance.controller.spec.ts
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';

describe('AttendanceController (e2e)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    // Login to get auth token
    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'password' });
    
    authToken = loginResponse.body.access_token;
  });

  it('/api/attendance/check-in (POST) - should create attendance record', () => {
    return request(app.getHttpServer())
      .post('/api/attendance/check-in')
      .set('Authorization', `Bearer ${authToken}`)
      .attach('captured_image', './test/fixtures/face.jpg')
      .field('qr_token', 'valid-qr-token')
      .field('latitude', '40.7128')
      .field('longitude', '-74.0060')
      .expect(201)
      .expect((res) => {
        expect(res.body.status).toBe('approved');
        expect(res.body.attendance).toBeDefined();
      });
  });

  afterAll(async () => {
    await app.close();
  });
});
```

### Frontend Testing

#### Component Tests
```typescript
// LiveAttendanceMonitor.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { LiveAttendanceMonitor } from './LiveAttendanceMonitor';
import { mockWebSocket } from '@/test/mocks/websocket';

describe('LiveAttendanceMonitor', () => {
  it('should display checked-in count', async () => {
    render(<LiveAttendanceMonitor meetingId="test-meeting-id" />);
    
    await waitFor(() => {
      expect(screen.getByText(/18\/25 checked in/i)).toBeInTheDocument();
    });
  });

  it('should update in real-time when new check-in occurs', async () => {
    const { rerender } = render(<LiveAttendanceMonitor meetingId="test-meeting-id" />);
    
    // Simulate WebSocket event
    mockWebSocket.emit('attendance-update', {
      type: 'new',
      attendance: { sonta_head: { name: 'John Doe' } }
    });

    rerender(<LiveAttendanceMonitor meetingId="test-meeting-id" />);
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });
});
```

#### E2E Tests (Playwright)
```typescript
// check-in.spec.ts
import { test, expect } from '@playwright/test';

test('complete check-in flow', async ({ page, context }) => {
  // Grant location permissions
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({ latitude: 40.7128, longitude: -74.0060 });

  // Scan QR (navigate directly to check-in page)
  await page.goto('/check-in/test-qr-token');

  // Should request location
  await expect(page.locator('text=Verifying location...')).toBeVisible();

  // Should show camera
  await expect(page.locator('video')).toBeVisible();

  // Simulate liveness detection
  await page.click('button:has-text("I\'m ready")');

  // Capture photo
  await page.click('button:has-text("Capture")');

  // Should show success
  await expect(page.locator('text=Check-in successful')).toBeVisible({ timeout: 10000 });
});
```

### Performance Testing

```typescript
// Load testing with k6
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 50, // 50 virtual users
  duration: '2m',
};

export default function () {
  const payload = JSON.stringify({
    qr_token: 'test-token',
    latitude: 40.7128,
    longitude: -74.0060
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const res = http.post('https://api.sonta-attendance.com/api/attendance/verify-location', payload, params);

  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(1);
}
```

---

## Cost Estimation

### Monthly Operating Costs (Production)

#### Hosting (DigitalOcean Option - Recommended for MVP)
```
Backend Droplet (4GB RAM, 2 vCPUs): $24/month
Database (Managed PostgreSQL 4GB): $60/month
Redis (Managed Redis 1GB): $15/month
Total Hosting: $99/month
```

#### Hosting (AWS Option - Scalable)
```
EC2 t3.medium (Backend): ~$30/month
RDS db.t3.micro (PostgreSQL): ~$20/month
ElastiCache t3.micro (Redis): ~$15/month
Total Hosting: $65/month
```

#### Storage & Services
```
S3 Storage (assume 10GB): $0.23/month
S3 Requests (assume 100k): $0.05/month
CloudFront CDN (assume 10GB transfer): $0.85/month
AWS Rekognition (assume 1000 check-ins/month):
  - 1000 face comparisons: $1.00
  - 1000 face detections: $1.00
Total Storage/Services: $3.13/month
```

#### Domain & SSL
```
Domain (.com): $12/year = $1/month
SSL Certificate (Let's Encrypt): FREE
Total Domain: $1/month
```

#### Monitoring & Error Tracking
```
Sentry (free tier covers 5k events/month): $0/month
CloudWatch (basic monitoring): $5/month
Total Monitoring: $5/month
```

#### Email/SMS (Optional)
```
SendGrid (12k emails/month free): $0/month
Twilio SMS (assume 200 SMS/month at $0.0079 each): $1.58/month
Total Communications: $1.58/month
```

### **TOTAL ESTIMATED MONTHLY COST: ~$110-170/month**

### One-Time Costs
```
Development (if outsourced): $5,000 - $15,000
Logo/Branding: $200 - $1,000
Initial setup/configuration: $500
Total One-Time: $5,700 - $16,500
```

### Cost Optimization Tips
1. Start with DigitalOcean for simpler pricing
2. Use free tier services (SendGrid, Sentry)
3. Consider face-api.js instead of AWS Rekognition to save $2/month per 1000 check-ins
4. Use shared SSL (free) instead of dedicated
5. Monitor usage and scale down resources if underutilized

---

## Maintenance & Support Plan

### Regular Maintenance Tasks

#### Daily
- Monitor error logs (Sentry)
- Check system uptime
- Review failed check-ins

#### Weekly
- Review pending verifications
- Check disk space and database size
- Verify backup integrity

#### Monthly
- Update dependencies (security patches)
- Review analytics and usage patterns
- Database optimization (vacuum, reindex)
- Audit log cleanup (archive old logs)

#### Quarterly
- Full system backup
- Security audit
- Performance testing
- User feedback review

### Backup Strategy
```
Database Backups:
- Automated daily backups (retained for 7 days)
- Weekly backups (retained for 4 weeks)
- Monthly backups (retained for 12 months)

Image Backups:
- S3 versioning enabled
- Lifecycle policy: Delete after 90 days (captured images)
- Permanent retention for profile images
```

---

## Success Metrics & KPIs

### Technical Metrics
- System uptime: > 99.5%
- Average check-in time: < 20 seconds
- Facial recognition accuracy: > 95%
- API response time (p95): < 500ms
- Database query time (p95): < 100ms
- Failed check-in rate: < 5%

### Business Metrics
- Attendance rate: Track over time
- Late arrival rate: Track by meeting
- Manual check-in rate: Should decrease over time
- Pending verification rate: Target < 10% of total check-ins
- User satisfaction: Survey after first month

---

## Risk Mitigation

### Technical Risks

**Risk**: Facial recognition accuracy too low
**Mitigation**: 
- Use high-quality enrollment photos
- Implement confidence threshold tuning
- Provide manual override for admins
- Consider switching to AWS Rekognition if face-api.js insufficient

**Risk**: GPS inaccuracy causing false rejections
**Mitigation**:
- Configurable geofence radius
- Display distance to admin for manual review
- Allow admin to adjust radius per meeting

**Risk**: Camera permissions denied
**Mitigation**:
- Clear instructions on how to grant permissions
- Manual check-in fallback
- Support page with troubleshooting steps

**Risk**: Database failure
**Mitigation**:
- Automated backups every 24 hours
- Database replication (read replicas)
- Monitoring with alerts

### Business Risks

**Risk**: Low adoption by Sonta Heads
**Mitigation**:
- User-friendly interface
- Training session before launch
- On-site support for first few meetings
- Clear communication of benefits

**Risk**: Resistance to facial recognition
**Mitigation**:
- Transparent privacy policy
- Explain data encryption and security
- Opt-in consent during enrollment
- Option to disable and use manual check-in only

---

## Next Steps

1. **Review this plan** with stakeholders
2. **Get approval** on technology stack and budget
3. **Set up development environment** (Week 1)
4. **Begin Phase 1** (Foundation & Setup)
5. **Weekly progress reviews** with stakeholders
6. **Iterative testing** with small group of Sonta Heads before full rollout

---

## Appendix

### Glossary
- **Geofencing**: Virtual perimeter around a real-world geographic area
- **Liveness Detection**: Technology to verify a person is physically present (not a photo)
- **Facial Embedding**: Numerical representation of facial features
- **QR Token**: Unique encrypted identifier for each meeting's QR code
- **WebSocket**: Protocol for real-time bidirectional communication

### References
- NestJS Documentation: https://docs.nestjs.com
- React Documentation: https://react.dev
- PostgreSQL + PostGIS: https://postgis.net
- AWS Rekognition: https://aws.amazon.com/rekognition
- face-api.js: https://github.com/justadudewhohacks/face-api.js

---

**Document Version**: 1.0  
**Last Updated**: February 1, 2025  
**Prepared By**: Development Team  
**Status**: Ready for Review
