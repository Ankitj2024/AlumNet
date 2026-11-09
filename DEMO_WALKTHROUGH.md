# AlumNet (P11) — 5-Minute Evaluator Demo Walkthrough

This interactive walkthrough demonstrates all Phase 1 and Phase 2 features across the three core platform roles: **Student**, **Verified Alumni Mentor**, and **University Officer**.

---

## 🔑 Quick Demo Credentials
All seeded test accounts share the password: **`DemoPassword123!`**

| Persona | Email | Direct Portal Link |
|---|---|---|
| **Student** | `student.demo@university.edu` | [http://localhost:3000/student](http://localhost:3000/student) |
| **Alumni Mentor (AWS)** | `mentor.demo@alumni.edu` | [http://localhost:3000/mentor](http://localhost:3000/mentor) |
| **Alumni Mentor (Google)** | `kevin.gao@alumni.edu` | [http://localhost:3000/mentor](http://localhost:3000/mentor) |
| **Alumni Relations Officer** | `officer@university.edu` | [http://localhost:3000/officer](http://localhost:3000/officer) |
| **Super Admin** | `admin@university.edu` | [http://localhost:3000/officer/policy](http://localhost:3000/officer/policy) |

---

## ⏱️ Minute-by-Minute Script

### Minute 1: Student Login & Explainable Match Discovery
1. Open [http://localhost:3000/auth/login](http://localhost:3000/auth/login).
2. Click the quick-fill button **"Student Demo"** (or enter `student.demo@university.edu` / `DemoPassword123!`).
3. Navigate to **"Discover Mentors"** (`/student/discover`):
   - Notice the **Multi-Factor Match Score** (e.g. `96% Match` with Sarah Connor at Amazon Web Services).
   - Expand the **Explainable Match Card**: observe explicit overlap breakdown (matching skills: `Distributed Systems`, `Cloud Architecture`, target role: `Cloud Developer`).
4. Click **"Request Mentorship"**:
   - Provide a brief goal and submit.
   - Notice the anti-spam policy feedback enforcing maximum 3 pending requests and rolling 7-day quota.

---

### Minute 2: Mentor Portal & Atomic Capacity Protection
1. Log out or open an incognito window at [http://localhost:3000/auth/login](http://localhost:3000/auth/login).
2. Click **"Mentor Demo"** (or enter `mentor.demo@alumni.edu` / `DemoPassword123!`).
3. Go to **"Requests"** (`/mentor/requests`):
   - Review the incoming mentorship outreach from Priya Sharma.
4. Click **"Accept Request"**:
   - The platform executes a MongoDB ACID transaction updating `MentorCapacity.currentActiveMentees` atomically.
   - If the mentor reaches capacity (e.g., 3/3 active mentees), any remaining pending requests are gracefully marked `AUTO_CANCELLED` with alternative mentor suggestions dispatched to students.

---

### Minute 3: Real-Time Messaging & Privacy Shield V2
1. Go to **"Active Mentorships"** (`/mentor/mentorships`):
   - Select the active relationship with Priya Sharma.
2. In the messaging conversation:
   - Try typing an email or contact number: `"Send your resume to test@gmail.com or call 9876543210"`.
   - Send the message:
     - The **Privacy Shield V2** engine immediately scrubs the contact information in the recipient's view.
     - The sender sees a friendly security warning.
     - The backend encrypts the original text with **AES-256-GCM** with an ephemeral IV and auth tag.
     - Zero unredacted PII is sent to the client.

---

### Minute 4: Session Scheduling & Google Meet Integration
1. In the mentorship dashboard, click **"Schedule Session"**:
   - Select a slot conforming to the mentor's availability window (Wednesday 14:00 - 18:00 UTC).
   - Enter agenda: *"System Design Mock Interview: URL Shortener at Scale"*.
2. Confirm the session:
   - The platform calls the `MeetProvider` and generates a verified Google Meet conference link (`https://meet.google.com/...`).
   - Click **"Download .ics"** to export an RFC 5545 iCalendar file importable into Google Calendar, Outlook, or Apple Calendar.
   - Post-session notes (`mentorNotes` private to mentor, `sharedNotes` visible to student) and rating (1–5 stars) can be recorded.

---

### Minute 5: University Officer Governance, Moderation & Policy
1. Log out and sign in as **Alumni Relations Officer** (`officer@university.edu` / `DemoPassword123!`).
2. Explore the Officer Suite:
   - **Analytics Portal** (`/officer`): Review university-wide placement statistics, average starting package, and mentorship-attributed success metrics with zero student PII leakage. Click **"Export CSV"** for institutional reporting.
   - **Moderation Queue** (`/officer/moderation`): Inspect flagged messages. Click **"Decrypt Message"** and observe that a cryptographic audit justification of $\ge 5$ characters is strictly required and permanently logged.
   - **Audit Logs** (`/officer/audit-logs`): View the immutable ledger of all administrative decisions, verifications, and decryptions.
3. Switch to **Super Admin** (`admin@university.edu`):
   - Go to **Programme Policy** (`/officer/policy`):
     - Adjust matching algorithm weights (skills, role, industry, department, cadence).
     - Notice the live mathematical sum indicator (weights must sum to exactly 1.0 to save).
     - Save changes and observe the updated cached policy with instant invalidation and audit ledger entry.
   - **Data Rights**: Visit user settings to test GDPR/DPDP Article 15/20 full JSON archive export and Article 17 soft-delete retention safeguards.

---

## 🏆 Summary of Tested Invariants
- ✅ 169/169 Tests Passing across 18 Test Suites (100% Green)
- ✅ 80.98% Statement / Line Code Coverage on Core Logic
- ✅ Zero PII Leakage verified by automated payload scanners
- ✅ Guaranteed Capacity Protection under 20 concurrent acceptance attempts
- ✅ End-to-End TypeScript compilation with 0 errors across 7 workspace packages
