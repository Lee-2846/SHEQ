# SHEQ — PRODUCT REQUIREMENTS DOCUMENT (PRD)
## Phase 1 Functional Restructure & Implementation Scope

---

# PART I: IMPLEMENTATION SCOPE & PHASE BOUNDARIES

## 1. IMPORTANT: PHASE BOUNDARY

This is **Frontend Phase 1 only**.

The goal is to restructure and complete the existing SHEQ frontend functionality, information architecture, authentication states, and user flows.

### DO NOT MAKE UI / AESTHETIC CHANGES

**Do NOT redesign the UI during this phase.**

Do NOT:
- Change the existing color palette / theme (`--berry`, `--sage`, `--ivory`, `--beige`, etc.).
- Introduce a new visual theme.
- Change typography choices for aesthetic reasons.
- Redesign cards, buttons, forms, or navigation styling.
- Add new gradients or decorative visual elements.
- Add cinematic effects.
- Add new animations for aesthetic purposes.
- Redesign the landing page visually.
- Change the established SHEQ visual identity.
- Replace the existing design language.

If a small CSS change is absolutely necessary to make a newly implemented feature functional or responsive, make only the minimum functional change.

> **PHASE 2 WILL HANDLE AESTHETICS, VISUAL DESIGN, THEMING, TYPOGRAPHY REFINEMENT, ANIMATIONS, CINEMATIC EFFECTS AND OTHER UI POLISH.**

---

## 2. FRONTEND-ONLY SCOPE

Everything in this phase must work using the existing React frontend and mock/local data where required.

Do NOT implement:
- Backend / Express
- MongoDB / SQL Databases
- Real API infrastructure
- Real authentication servers
- Real SMS / Email OTP providers
- Real police / authority APIs
- Production notification infrastructure
- Production location-sharing infrastructure

The frontend is structured so these can be connected later without rebuilding the user experience.

---

# PART II: ARCHITECTURE & USER EXPERIENCES

## 3. CORE PRODUCT PRINCIPLE: THREE DISTINCT EXPERIENCES

SHEQ clearly separates three distinct tiers of access:

### A. PUBLIC
The public website explains SHEQ to visitors.
- **Accessible Pages**: `Home` (`/`), `How It Works` (`/about`), `Login` (`/login`), `Sign Up` (`/signup`).
- The Safety Map, Report functionality, Dashboard, SOS activation, and personalized tools are **NOT** accessible to unauthenticated visitors.

### B. AUTHENTICATED USER
A registered, verified member can:
- Access **Dashboard** (`/dashboard`) with quick SOS and live metrics.
- Access **Safety Map** (`/map`) with interactive marker/sidebar sync and search.
- **Report an Incident** (`/report`) with 9 standard categories, lat/lng assignment, photo preview, and anonymous toggle.
- View **Incident Details** (`/incident/:id`) with 4-step lifecycle tracker, community confirmation, context/comments, and dispute actions.
- Use **SOS** action directly on Dashboard and configure emergency contacts on the **SOS Settings Page** (`/sos`).
- Manage **Saved Places** (Home, College, Work) and view localized safety insights.
- Access **Profile / Account Settings** (`/profile`) via the top-right avatar menu.

### C. ADMIN
An authorized SHEQ administrator can:
- Access the dedicated **Admin Dashboard** (`/admin`).
- Review and moderate community reports (`/admin/reports`).
- Analyze hotspot candidates and officially designate **SHEQ Hotspots** (`/admin/hotspots`).
- Create and track internal **SHEQ Issues / Complaints** (`/admin/issues`).
- Create internal **External Escalation Records** (`/admin/escalations`) with explicit disclaimers.
- Monitor moderation logs and disputed items (`/admin/moderation`).
- *Note:* Admin login is role-protected; there is **NO public Admin sign up**.

---

# PART III: DETAILED FUNCTIONAL SPECIFICATIONS

## 4. NAVIGATION & INFORMATION ARCHITECTURE

### Public Navigation
```text
Home
How It Works
Login
Sign Up
```

### Authenticated User Navigation
```text
Home
Dashboard
SOS
Report
Safety Map
```
*Profile access is provided exclusively via the top-right avatar menu, NOT as a 6th primary nav item.*

### Admin Navigation
```text
Admin Dashboard
├── Overview
├── Reports
├── Hotspot Analysis
├── Complaints / Issues
├── External Escalations
└── Moderation
```

---

## 5. TERMINOLOGY & LIFECYCLE STANDARDIZATION

### Standardized 4-Step Report Lifecycle
```text
Submitted  ──►  Under Review  ──►  Verified  ──►  Resolved
```
- Standardized across all incident cards, detail views, and admin management tables.
- Derived dynamically from mock report data.

### Standardized 9 Incident Categories
1. **Harassment**
2. **Stalking**
3. **Theft**
4. **Suspicious Activity**
5. **Unsafe Transport**
6. **Poor Lighting**
7. **Broken CCTV**
8. **Unsafe / Isolated Area**
9. **Infrastructure Concern**

---

## 6. AUTHENTICATION & ACCESS CONTROL

### Login (`/login`)
- Centered authentication container with **[ USER ]** and **[ ADMIN ]** mode tabs.
- **User Login**: Select `Email` or `Phone Number`, enter password, `[x] Stay logged in`, forgot password link.
- **Admin Login**: Admin email and access key.

### Sign Up (`/signup`)
- Choice of verification method: `[ Email ]` or `[ Phone ]`.
- Fields: Full Name, Email / Phone, Password, Confirm Password, `[x] Stay logged in`.
- Transition to simulated **OTP Verification Screen** (with mock code verification) before directing to `/dashboard`.

### Session State
- Persistent mock session via central `AuthContext` (utilizing `localStorage` for "Stay Logged In" persistence).
- Role-based route protection:
  - Unauthenticated users redirect to `/login`.
  - Non-admins accessing `/admin/*` redirect to `/dashboard`.

---

## 7. HOME PAGE & HOW IT WORKS

### Home Page (`/`)
- Public showcase communicating the core mission: *"Safety becomes stronger when we share what we know."*
- Community-derived metrics (e.g. Total Community Reports, Verified Signals) replacing any arbitrary safety scores.
- Interactive signal preview and recent report snapshot.
- Retained in navbar for authenticated users to navigate back to the landing page.

### How It Works (`/about`)
- Warm, practical, 10-step user guide:
  1. Create an account
  2. Verify with OTP (Email/Phone)
  3. Explore safety information
  4. Report an incident
  5. Choose anonymous reporting if desired
  6. Understand community confirmation
  7. Add contextual comments
  8. View safety activity & insights
  9. Configure emergency contacts
  10. Use SOS when in immediate need
- Includes a genuine, human message acknowledging real-world safety experiences.
- Removed academic project descriptions, SDG badges, and technical developer notes.

---

## 8. USER DASHBOARD & PERSONALIZED INSIGHTS (`/dashboard`)

- **Prominent SOS Emergency Trigger**: Direct emergency action modal with quick call simulation, location sharing broadcast simulation, and emergency services button.
- **User Places**: Manage saved locations (Home, College, Work, Custom) with location search.
- **Personalized Safety Insights**:
  - If saved places exist: Filter and display nearby reports, active hotspots, and relevant alerts for those places.
  - If no saved places: Display city-wide SHEQ hotspots and general community activity.
- **Data-Derived Live Statistics**:
  - `Reports Submitted` = total mock reports
  - `Reports Verified` = count of verified reports
  - `Community Confirmations` = sum of all confirmations
  - `Active Hotspots` = active SHEQ hotspots count
  - `Issues Resolved` = resolved issue count
  - `Alerts Issued` = active alert count
  *(No fake "mishaps avoided" metrics)*

---

## 9. SAFETY MAP (`/map`) — AUTHENTICATED

- **Location Search**: Search bar with mock geocoding/autocomplete to pan and zoom map to selected areas.
- **Marker ↔ Sidebar Synchronization**:
  - Clicking a sidebar item centers and opens popup on the map.
  - Clicking a map marker highlights the corresponding sidebar card.
- **Category Filter & Search Query**: Instant filtering across all 9 categories and keywords.
- **Marker Differentiation**: Visual differentiation between standard reports, elevated concerns, hotspot candidates, and active SHEQ hotspots.
- **Responsive Layout**: Desktop split-pane; tablet/mobile view-toggle tabs between Map and List view.

---

## 10. INCIDENT REPORTING & PHOTO PREVIEW (`/report`)

- Category dropdown using the standardized 9 categories.
- Location input with coordinate assignment (`lat`, `lng`) so new reports immediately appear on the Safety Map.
- Date and time inputs with responsive picker support.
- Description with validation (minimum 15 characters).
- **Optional Photo Evidence**: Client-side File API image preview with remove photo option (no backend upload claim).
- **Anonymous Reporting Toggle**: Publicly anonymous while internally linked to authenticated user account.

---

## 11. INCIDENT DETAILS, COMMUNITY CONTEXT & DISPUTES (`/incident/:id`)

- **Report Status Stepper**: Visual 4-step lifecycle tracker.
- **Distinct Community Actions**:
  1. **Confirm**: *"I experienced / saw this too"* (+1 confirmation).
  2. **Add Context**: Form to post contextual observations to the incident's community comment stream.
  3. **Dispute**: Separate action to submit a dispute reason regarding inaccurate details.

---

## 12. SOS SYSTEM ARCHITECTURE

- **Dashboard SOS**: Immediate emergency response flow.
- **SOS Configuration Page (`/sos`)**: Settings for primary emergency contact, trusted contact list, location sharing preferences, and test simulation.

---

## 13. USER PROFILE (`/profile`)

Accessible via avatar menu with tabs for:
- Personal details (Name, Email, Phone, Preferred language).
- My Saved Places management.
- Emergency & Trusted Contacts.
- Notification Preferences.
- Account Security & Logout.

---

## 14. MODULAR HOTSPOT SCORING & CANDIDATE ARCHITECTURE

A standalone modular utility (`hotspotScoring.js`) calculates hotspot scores based on:
- Report frequency
- Report recency
- Community confirmations
- Severity weighting
- Spatial proximity

```text
Reports + Recency + Confirmations + Severity + Spatial Density
                       │
                       ▼
                 Hotspot Score
                       │
                       ▼
               Hotspot Candidate
                       │
               (Admin Review)
                       │
                       ▼
                 SHEQ Hotspot
```
- Clear distinction between automated **Hotspot Candidates** and officially designated **SHEQ Hotspots**.

---

## 15. ADMIN FRONTEND (`/admin/*`)

- **Overview (`/admin`)**: Aggregated system metrics, pending review counters, candidate alerts, recent submissions.
- **Reports Review (`/admin/reports`)**: Complete table with status modifier, category filters, dispute inspect, and moderation actions.
- **Hotspot Management (`/admin/hotspots`)**: Inspect hotspot candidates, view score breakdown, click `[ Mark as SHEQ Hotspot ]`, manage/deactivate existing hotspots.
- **Issues & Complaints (`/admin/issues`)**: Create internal tracking issues linked to reported areas/categories with status management (Open / In Progress / Resolved).
- **External Escalations (`/admin/escalations`)**: Internal escalation workflow to record authority-directed escalations. Displays required notice:
  > *"Creating an escalation record is an internal SHEQ tracking mechanism. No direct police API integration is claimed or performed."*
- **Moderation (`/admin/moderation`)**: Review flagged disputes and inappropriate content.

---

# PART IV: ACCEPTANCE CRITERIA & VERIFICATION

1. **Authentication Flows**:
   - Public users can browse Home and How It Works, login with User or Admin modes, and sign up with Email or Phone + OTP.
   - Protected routes redirect unauthenticated users to `/login`.
   - Admin routes redirect non-admin users.
2. **Data & Synchronization**:
   - Creating a new report immediately updates state, adds coordinates, and displays marker on Safety Map and Dashboard.
   - Confirming a report or adding context updates state across all views.
   - Dashboard statistics update reactively from data without hardcoded values.
3. **Map & Search**:
   - Map location search pans to the searched place.
   - Clicking sidebar cards centers map marker; clicking marker focuses card.
4. **Admin Capabilities**:
   - Admins can change report lifecycle status.
   - Admins can promote Hotspot Candidates to SHEQ Hotspots.
   - Admins can create Issues and External Escalations.
5. **Responsive & Functional Quality**:
   - No console errors, no broken links, no duplicate navbar.
   - Seamless usability across Desktop, Tablet, and Mobile.
   - Zero aesthetic overhaul — preserving the visual design system for Phase 2.
