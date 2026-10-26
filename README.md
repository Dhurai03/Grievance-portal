# 🎓 EduGrieve - AI-Enabled College Grievance Redressal Platform

[![Node.js](https://img.shields.io/badge/Node.js-v20+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19+-blue.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6+-purple.svg)](https://vitejs.dev/)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB-47A248.svg)](https://www.mongodb.com/)
[![AI Powered](https://img.shields.io/badge/AI-NLP%20%26%20Gemini-orange.svg)](https://ai.google.dev/)

**EduGrieve** is an intelligent, full-stack campus grievance management portal designed for modern universities and colleges. It employs Natural Language Processing (NLP) and Google Gemini AI to analyze student complaints, automatically determine priority levels, and route tickets directly to the responsible college department.

The platform provides real-time grievance tracking, automated SLA breach escalations, confidential/anonymous reporting, and role-based workspaces for Students, Department Officers, Faculty, Administrators, and the Dean of Students.

---

## 🌟 Key Highlights & AI Modules

### 1. 🤖 Core AI: NLP-Based Department & Category Classification
- **Technique**: **TF-IDF + Multinomial Logistic Regression** (`scikit-learn`).
- Predicts department, category, subcategory, and routing code from student complaint text (e.g., examination-mark discrepancies route automatically to `Academic Affairs - ACAD`).
- Calibrated probability outputs with top prediction rankings.

### 2. 🔍 Recommended AI: Duplicate & Similar Grievance Detection
- **Technique**: **Sentence Transformers (`all-MiniLM-L6-v2`) + Cosine Similarity**.
- Distinct from classification: Computes semantic vector embeddings to detect existing active tickets with identical or recurring meanings, even with completely different wording.
- Alerts students during submission and helps officers group systemic campus issues (e.g., campus-wide WiFi outages).

### 3. ⚡ Recommended AI: Complaint Severity & Urgency Detection
- **Technique**: **Separate Supervised Text Classifier** trained on time consequence, academic stakes, and campus safety risk.
- Crucially separates genuine urgency from emotional sentiment alone (e.g. calm deadline/safety reports receive HIGH/CRITICAL; angry aesthetic requests receive LOW).
- Flags critical issues for mandatory executive staff review.

### 4. 💬 Generative AI: Campus Grievance Assistant
- **Technique**: **Google Gemini API** (`gemini-1.5-flash`) kept strictly on the backend.
- Enforces institutional guardrails (restricting conversations to campus redressal policies and procedures).
- **Complaint Drafting Assistant**: Converts unstructured student notes into clear, formal, actionable grievances with suggested evidence checklists.
- **Authenticated Status Lookup**: Directly queries the student's authenticated grievance records to report real-time status, timeline, and next steps.

### 5. ⏱️ SLA Monitoring & Automatic Escalation
- Department-specific resolution deadlines (e.g., Anti-Ragging: 24h, Welfare: 24h, Academic: 48h, Hostel/IT: 48h, Library/Finance: 72h-120h).
- Automated background engine continuously monitors deadlines, flags overdue tickets, auto-escalates to the Dean of Students, and generates breach notifications.
- Admin/Officer dashboard controls with live on-demand SLA audit and at-risk early warning detection.

---

## 🏗️ Project Architecture

```
Grievance/
├── backend/                  # Node.js + Express + MongoDB Backend
│   ├── config/              # MongoDB connection configuration (db.js)
│   ├── controllers/         # Request controllers (auth, grievance, dept, analytics, etc.)
│   ├── middleware/          # JWT authentication & role authorization
│   ├── models/              # Mongoose schemas (User, Grievance, Department, Notification, AuditLog)
│   ├── routes/              # RESTful API endpoints (/api/auth, /api/grievances, /api/ai, etc.)
│   ├── services/            # NLP classifier (aiClassifier.js) & Gemini service (geminiService.js)
│   ├── tests/               # Backend automated verification suite (verify.js)
│   ├── uploads/             # Multer file storage for evidence attachments
│   ├── .env                 # Environment configuration (MongoDB URI, JWT secret, Gemini key)
│   ├── package.json         # Backend dependencies & scripts
│   ├── seed.js              # Campus initial seed runner (departments, sample users)
│   └── server.js            # Express server entrypoint & SLA breach auditor
│
├── frontend/                 # React 19 + Vite Frontend SPA
│   ├── public/              # Static public assets & icons
│   ├── src/
│   │   ├── components/      # Reusable UI widgets (AIChatBot, etc.)
│   │   ├── context/         # AuthContext with session state & live notification counter
│   │   ├── hooks/           # useHashRouter for persistent URL routing
│   │   ├── layouts/         # AppLayout with dynamic role navigation & topbar
│   │   ├── pages/           # Student, Officer, Admin dashboards, Submit, Track, Profile, Notifications
│   │   ├── services/        # Centralized frontend API client (api.js)
│   │   ├── App.jsx          # Root application routing
│   │   ├── index.css        # Dark glassmorphism custom CSS design system
│   │   └── main.jsx         # Vite entrypoint
│   ├── index.html           # HTML template
│   ├── package.json         # Frontend dependencies & scripts
│   └── vite.config.js       # Vite dev server configuration with API proxying
│
├── docs/                    # Technical & setup documentation
├── README.md                # Project documentation
└── package.json             # Root monorepo orchestrator
```

---

## 🏛️ Supported College Departments

| Code | Department Name | Key Issues Handled | Default SLA |
| :--- | :--- | :--- | :--- |
| **ACAD** | Academic Affairs | Examinations, results, hall tickets, revaluation, curriculum | 48h - 72h |
| **HSTL** | Hostel & Accommodation | Rooms, water supply, electricity, furniture, mess food quality | 24h - 48h |
| **IT** | IT & Technical Support | Campus WiFi, student portal, lab computers, password resets | 24h - 48h |
| **FIN** | Finance & Fees | Fee challans, tuition payments, scholarships, refund delays | 48h - 72h |
| **LIB** | Library | Books, digital journal access, reading rooms, overdue fines | 72h - 120h |
| **WELF** | Student Welfare & Counseling | Mental health counseling, wellness, emergency support | 12h - 24h |
| **SPRT** | Sports & Extracurricular | Sports grounds, gymnasium, tournament gear, cultural clubs | 72h - 120h |
| **TRNS** | Transportation | College bus routes, commute schedules, bus passes | 24h - 72h |
| **CANT** | Canteen & Food Services | Cafeteria hygiene, food quality, pricing standards | 24h - 72h |
| **PLCMNT**| Placement & Career Services| Internships, recruitment drives, company interview schedules | 72h - 120h |
| **DISC** | Ragging & Discipline | Anti-ragging cell, harassment, bullying, safety *(Always Critical)*| 4h - 24h |

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js** (v20+ recommended)
- **MongoDB** (Local `mongod` service or MongoDB Atlas connection string)
- **Git**

---

### 1. Installation

Install dependencies for both backend and frontend:

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

---

### 2. Configure Environment

Review or edit `backend/.env`:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/college_grievance_portal
JWT_SECRET=college_grievance_super_secret_key_2024
JWT_EXPIRES_IN=7d
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Optional: Google Gemini API Key for live AI responses
GEMINI_API_KEY=your_google_gemini_api_key_here
```
*(If `GEMINI_API_KEY` is omitted, the portal automatically activates the built-in offline NLP engine).*

---

### 3. Seed Database

Ensure your MongoDB instance is running, then run the database seeder:

```bash
# From the root directory:
npm run seed

# Or from backend/:
node backend/seed.js
```

This populates all 12 college departments and sets up pre-configured demo accounts.

---

### 4. Run Verification Tests

Run the backend NLP routing and security test suite:

```bash
node backend/tests/verify.js
```

---

### 5. Launch the Application

In terminal 1, start the backend server:
```bash
npm run server
# (or: node backend/server.js)
```

In terminal 2, start the frontend client:
```bash
npm run dev
# (or: npm --prefix frontend run dev)
```

Open **[http://localhost:5173](http://localhost:5173)** in your browser!

---

## 🔑 Pre-Configured Demo Credentials

| Role | Email | Password | Access Level |
| :--- | :--- | :--- | :--- |
| **Student** | `student@college.edu` | `student123` | Submit complaints, track status, rate feedback |
| **Officer** | `academic.officer@college.edu` | `officer123` | Department queue, status resolution, SLA clocks |
| **Dean** | `dean@college.edu` | `dean123` | Escalated complaints, campus oversight, policy |
| **Admin** | `admin@college.edu` | `admin123` | Departments & SLA setup, user roles, audit trail |

---
  
## 🛡️ License

Built for college campus grievance redressal and transparent student welfare administration.