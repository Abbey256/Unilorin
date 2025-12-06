# UniAttend (Adsum Engine)
## Smart Attendance System

**Platform:** Mobile PWA + Web Dashboards  
**Target Users:** Students, Lecturers, Department Admins  
**Target Scale:** 50,000 students (full UNILORIN population)

---

### ⭐ 1. Executive Summary

UniAttend is a secure, GPS-verified, device-bound attendance system designed to replace unreliable manual attendance at the University of Ilorin. It prevents impersonation, eliminates duplicate entries, works offline, and automatically syncs attendance data to the cloud.

The system uses geofencing to ensure only students physically inside the classroom radius can mark attendance. Device fingerprinting ensures “one device per student,” preventing mass impersonation.

Lecturers manage sessions through a simple dashboard, while offline-first architecture ensures students with poor internet can still mark attendance.

UniAttend is built with a hybrid architecture using Supabase, Node.js, and AWS scalability tools, making it affordable, reliable, and capable of serving 50,000+ students across all faculties.

---

### ⭐ 2. Problem Statement

UNILORIN enforces a 75% attendance rule for exam eligibility, yet:
- The current number-based system is easy to cheat
- Students impersonate each other using Google Forms
- Lecturers waste hours cleaning spreadsheets
- The portal cannot handle massive real-time loads
- There is no centralized attendance record, leading to disputes

This creates unfairness, stress, and inefficiency for both staff and students.

---

### ⭐ 3. Solution Overview

UniAttend solves these problems through:

**A. GPS-Based Attendance Verification**
- A student can ONLY mark attendance if:
  - They are inside the classroom geofence (50–100m)
  - Their GPS is verified as non-spoofed

**B. Device Binding / Fingerprinting**
- Each student is linked to a unique device ID.
- This blocks impersonation completely.

**C. Offline Mode**
- Students without stable internet can still mark attendance:
  - Offline cache stores record locally
  - Syncs automatically when online

**D. Lecturer Dashboard**
- Start/end attendance sessions
- Monitor real-time check-ins
- Export attendance CSV/PDF
- Mark special cases (students without smartphones)

**E. Admin Panel**
- Departmental analytics
- Session logs
- Attendance audits
- API sync to UNILORIN portal (night sync mode)

---

### ⭐ 4. Technical Architecture Summary

**Current MVP**
- **Frontend:** React + TypeScript (PWA)
- **Backend:** Node.js + Express
- **Database:** Supabase (PostgreSQL)
- **Hosting:** Render
- **Geo Verification:** Browser GPS + anti-spoof checks

**Scalable Architecture for 50,000 Students**
- **AWS Amplify:** Hosting + Authentication
- **Amazon Location Service:** Geofencing & GPS validation
- **Amazon RDS PostgreSQL:** Highly scalable relational DB
- **API Gateway + Lambda:** Serverless backend
- **S3:** Logs, session files, backups
- **CloudWatch:** Monitoring & alerts
- **Supabase Edge Functions:** Cheap compute for certain endpoints

---

### ⭐ 5. Key Features (Full System)

**Student App**
- Mark attendance
- View attendance history
- Offline mode support
- Device ID bound
- Class notifications

**Lecturer Dashboard**
- Create courses
- Start sessions
- Real-time counter
- Fraud alerts
- Export records
- Manual check-in for non-smartphone users

**Admin Panel**
- Department-wide analytics
- Custom reporting
- Log access
- Portal API sync

**Security**
- GPS + WiFi triangulation
- Anti-spoofing detection
- Device fingerprinting
- End-to-end encrypted attendance packets

---

### ⭐ 6. Product Roadmap (Scalable to 50,000 Users)

**🚀 PHASE 1 — MVP (Current – 0 to 500 Users)**
- **Goal:** Validate core idea
- **Features:**
  - GPS Check-In
  - Device Binding
  - Lecturer Dashboard
  - Offline Mode (Basic Sync)
  - Supabase Integration
- **Duration:** 2–3 weeks

**🚀 PHASE 2 — V1.0 (Pilot – 500 to 5,000 Users)**
- **Goal:** Department-level launch
- **Add:**
  - Admin Panel
  - Fraud Detection Alerts
  - Portal Night-Sync Mode
  - Improved GPS accuracy
  - API load balancing
- **Duration:** 1–2 months

**🚀 PHASE 3 — Scale-Up (5,000 to 20,000 Users)**
- **Goal:** Faculty-level launch
- **Upgrades:**
  - Move DB to Amazon RDS PostgreSQL
  - Implement Lambda-based backend
  - Add CloudWatch monitoring
  - Serverless queues for peak times
  - Multi-class parallel sessions
- **Duration:** 2 months

**🚀 PHASE 4 — University-Wide System (20,000 to 50,000 Users)**
- **Goal:** Full UNILORIN rollout
- **Add:**
  - High-redundancy architecture
  - 3-zone database replication
  - Event-based attendance analytics
  - Dedicated admin tools
  - Mobile app packaging
- **Duration:** 3–5 months

**🚀 PHASE 5 — Region-Wide Solution (50,000+)**
- **Goal:** Sell/Deploy to other universities
- **Add:**
  - Multi-tenant platform
  - Billing system
  - Multi-school dashboard
  - Institution-specific compliance settings
- **Duration:** 6–9 months
