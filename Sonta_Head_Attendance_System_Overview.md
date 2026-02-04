# Sonta Head Attendance System - Complete Overview

## What Problem Does This Solve?

**Current Problem**: No reliable way to track which Sonta heads attended meetings and prevent fake attendance (someone marking present when they weren't there).

**Solution**: Automated attendance system using QR codes + facial recognition + location verification to ensure only people physically present can check in.

---

## How It Works - Complete Flow

### **Before the Meeting (Admin Side)**

**Admin creates a meeting:**
1. Log into admin dashboard
2. Click "Create New Meeting"
3. Fill in details:
   - Meeting title (e.g., "Leadership Sync - January 2025")
   - Location (select on map OR enter address - system gets GPS coordinates)
   - Start time and end time
   - Set verification radius (default 100 meters - anyone outside this can't check in)
   - Choose late arrival cutoff (e.g., "Flag anyone checking in after 15 minutes")
   - Choose QR code expiry rules (explained below)
4. Click "Create Meeting"

**System automatically:**
- Generates a unique QR code for this meeting
- Meeting status set to "Scheduled"

**When meeting time arrives:**
- Admin clicks "Start Meeting" button
- Meeting status → "Active"  
- QR code becomes valid for scanning
- Admin displays QR code on projector/phone screen at meeting entrance

---

### **During the Meeting (Sonta Head Side)**

**Sonta head arrives at meeting:**

**Step 1: Scan QR Code**
- They scan the displayed QR code with their phone camera
- Browser opens to check-in page

**Step 2: Location Verification**
- System asks for location permission
- Checks if they're within 100m (or admin-set radius) of meeting location
- ❌ **If outside radius**: "You must be at the meeting location to check in"
- ✅ **If inside radius**: Continue to next step

**Step 3: Liveness Detection (Anti-Fraud)**
- Camera opens (front-facing only)
- System prompts: 
  - "Look at the camera"
  - "Blink your eyes"  
  - "Smile"
- This prevents someone from using a photo of another person
- Takes a photo when liveness confirmed

**Step 4: Facial Recognition**
- System compares captured photo against all enrolled Sonta heads in database
- Calculates match confidence (0-100%)

**Step 5: Automated Decision**

**SCENARIO A - High Confidence Match (95%+)**
- ✅ **Automatically approved**
- Attendance record created instantly
- Success message: "Check-in successful! You're marked present."
- If they checked in after late cutoff → flagged as "late arrival"

**SCENARIO B - Medium Confidence Match (70-94%)**
- ⏳ **Sent for admin review**
- Message shown: "Verification pending. Admin will review shortly."
- Admin sees notification in dashboard with captured photo vs profile photo
- Admin approves or rejects manually

**SCENARIO C - Low Confidence Match (<70%)**
- ❌ **Rejected**
- Message: "Face not recognized. Please try again (Attempt 1 of 3)"
- They can retry up to 3 times
- After 3 failed attempts:
  - Account flagged as "suspicious" (visible to admin)
  - Message: "Maximum attempts reached. Please see admin for manual check-in"

---

### **During the Meeting (Admin Side - Dashboard)**

**Admin sees real-time dashboard:**

```
Meeting: Leadership Sync - Jan 15, 2025
Status: Active | Time: 10:00 AM - 11:30 AM

Check-in Progress: 18/25 Sonta Heads (72%)

┌─────────────────────────────────────┐
│ CHECKED IN (18)                     │
├─────────────────────────────────────┤
│ ✓ John Doe         10:02 AM        │
│ ✓ Mary Johnson     10:05 AM  🔶LATE│
│ ✓ David Smith      10:01 AM        │
│ ... (15 more)                       │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ NOT YET CHECKED IN (7)              │
├─────────────────────────────────────┤
│ ⚪ Sarah Williams   [Manual Check-in]│
│ ⚪ James Brown      [Manual Check-in]│
│ ... (5 more)                        │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ PENDING REVIEW (2) 🔴               │
├─────────────────────────────────────┤
│ Mike Ross - 85% match [REVIEW NOW] │
│ Lisa Chen - 78% match [REVIEW NOW] │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ SUSPICIOUS ACTIVITY (1) ⚠️          │
├─────────────────────────────────────┤
│ Tom Anderson - 3 failed attempts   │
└─────────────────────────────────────┘

[Regenerate QR Code] [End Meeting] [Export Report]
```

**Admin can:**
- **Manually check someone in** - Click name → "Mark Present" (logs as manual entry)
- **Review pending verifications** - Click "Review Now" → See both photos → Approve/Reject
- **Remove incorrect check-ins** - Click X next to name → Confirm removal
- **Regenerate QR code** - If original QR compromised or expired
- **Handle suspicious cases** - Manually verify people who failed 3 times
- **End meeting** - Locks attendance, no more check-ins allowed

---

## QR Code Expiry Options (Admin Decides Per Meeting)

**Admin chooses ONE of these when creating meeting:**

### Option 1: Valid Until Meeting Ends (RECOMMENDED)
- QR stays active until admin clicks "End Meeting"
- Everyone scans same QR code
- **Best for**: Standard meetings, easiest to manage

### Option 2: Expires After X Scans
- Example: Set max 30 scans for 25 expected attendees (buffer for retries)
- QR becomes invalid after 30th successful scan
- **Best for**: Strict capacity control

### Option 3: Expires After X Minutes
- Example: QR expires 10 minutes after generation
- Admin must click "Regenerate QR" to create new one
- **Best for**: High-security meetings, prevents early QR sharing

---

## Security Features Explained

### **Why Can't Someone Fake Attendance?**

**Scenario**: John wants to mark his friend Mike as present, but Mike isn't at the meeting.

**What stops this?**

1. **Geofencing** - John's phone GPS must be within 100m of meeting location. If he's at home, check-in blocked.

2. **Liveness Detection** - John can't use a photo of Mike on his phone. System requires live person to blink and smile.

3. **Facial Recognition** - Even if John is at the meeting, when he scans with his own face, system recognizes John, not Mike. Mike won't be marked present.

4. **One Check-in Per Person** - Database prevents duplicate entries. If someone already checked in, can't check in again.

5. **Device Tracking** - System logs IP address, browser, timestamp. Admin can review if suspicious patterns emerge.

### **Why Can't Someone Share the QR Code?**

**Scenario**: Sarah takes screenshot of QR and sends to her friend who's absent.

**What stops this?**

- **Geofencing** - Friend must be physically at meeting location (within 100m)
- Even if they show up at location, **facial recognition** ensures only the right person checks in

---

## Admin Management Features

### **Manual Operations**
- **Manual Check-in**: Admin can add anyone who had technical issues (logged separately)
- **Remove Check-in**: Admin can delete incorrect attendance records
- **Approve Pending**: Review borderline facial matches with side-by-side photo comparison
- **Flag Review**: Handle suspicious accounts (3 failed attempts)

### **Bulk Operations**
- **Import Sonta Heads**: Upload CSV file with names, phone numbers, photos
- **Export Reports**: Download attendance for specific dates/meetings as Excel or PDF
  - Shows: Name, Check-in time, Late flag, Manual vs Auto verification

### **Analytics Dashboard**
- **Per Person**: 
  - Attendance rate (e.g., "18 of 20 meetings = 90%")
  - Late arrival frequency
  - Flagged verifications count
  
- **Per Meeting**:
  - Total attendance percentage
  - Average check-in time
  - Late arrivals count

### **Audit Trail**
- Every action logged with timestamp and admin name:
  - "Admin Alice manually checked in John Doe at 10:15 AM"
  - "Admin Bob approved pending verification for Mary at 10:20 AM"
  - "Admin Alice removed check-in for Tom at 10:25 AM"

---

## Real-World Scenarios

### **Scenario 1: Normal Check-in**
- Meeting starts at 10:00 AM
- QR displayed at entrance
- Sarah arrives at 10:03 AM
- Scans QR → location verified → blinks for liveness → face recognized (98% match)
- ✅ Marked present automatically
- Takes 15 seconds total

### **Scenario 2: Late Arrival**
- Meeting started at 10:00 AM, late cutoff set to 15 minutes
- Mike arrives at 10:18 AM
- Completes check-in successfully
- ✅ Marked present but flagged as "LATE" (shows 🔶 on dashboard)

### **Scenario 3: Poor Lighting / Bad Photo**
- Lisa scans QR, but room is dark
- Face match only 82% confident
- System sends to pending review
- Admin sees both photos, recognizes Lisa, clicks "Approve"
- ✅ Lisa marked present (logged as "admin approved")

### **Scenario 4: Wrong Person Attempts Check-in**
- Tom tries to check in for his absent friend Mike
- Tom's face scanned
- System recognizes Tom, not Mike
- Tom already checked in earlier
- ❌ Error: "You are already checked in"

### **Scenario 5: Technical Issues**
- John's phone camera broken
- He approaches admin desk
- Admin searches "John Doe" in dashboard
- Clicks "Manual Check-in"
- ✅ John marked present (logged as "manual by Admin Alice")

### **Scenario 6: Someone Outside Location**
- Sarah tries to check in from home before leaving
- Scans QR code
- System checks GPS location
- ❌ Error: "You must be at the meeting location (within 100m) to check in"

### **Scenario 7: QR Code Compromised**
- Someone posts QR screenshot on WhatsApp group
- Admin sees unusual activity (multiple failed scans from different locations)
- Admin clicks "Regenerate QR Code"
- Old QR becomes invalid instantly
- New QR displayed at entrance
- Problem solved in 10 seconds

---

## Setup Requirements

### **One-Time Setup (Before First Meeting)**

**Admin must:**
1. Create admin account (username/password)
2. Enroll all Sonta heads:
   - Name
   - Phone number
   - Upload clear front-facing photo (for facial recognition)
   - System processes photo and creates "facial embedding" (encrypted face data)

**Photo Requirements:**
- Good lighting
- Face clearly visible
- Front-facing (not profile)
- No sunglasses
- Similar to how they'll look at meetings

### **Hardware Needed**
- **Admin**: Computer/tablet with internet browser
- **Sonta Heads**: Smartphone with camera and internet
- **Meeting Venue**: Display screen (projector/TV/tablet) to show QR code

---

## Benefits Summary

### **For Admins:**
✅ Accurate attendance tracking in real-time  
✅ Eliminate manual paper lists  
✅ Identify chronic absentees with analytics  
✅ Prevent attendance fraud  
✅ Export reports for records  
✅ Reduce meeting disruption (no roll call needed)

### **For Sonta Heads:**
✅ Fast check-in (15 seconds average)  
✅ No need to remember passwords  
✅ Privacy protected (facial data encrypted)  
✅ Works on any smartphone

### **For Ministry:**
✅ Data-driven insights on engagement  
✅ Historical attendance records  
✅ Accountability and transparency  
✅ Professional, modern system

---

## Questions to Discuss with Admins

1. **QR Expiry Preference**: Which strategy feels best - valid until meeting ends, or time/scan limits?

2. **Late Arrival Cutoff**: Should there be a standard (e.g., 15 min) or decide per meeting?

3. **Geofence Radius**: Is 100 meters reasonable, or adjust based on meeting venues?

4. **Pending Review Workflow**: Who handles pending verifications during meetings - one designated admin?

5. **Manual Check-in Policy**: When should manual check-in be allowed (technical issues only, or other cases)?

6. **Data Retention**: How long keep attendance records and photos (suggest 6-12 months)?

7. **Notification Preferences**: Should admins get SMS/email when pending reviews appear?

8. **Privacy Concerns**: How communicate to Sonta heads about facial data encryption and usage?

---

This system ensures **only people physically present at meetings can check in**, while giving admins full control and visibility.
