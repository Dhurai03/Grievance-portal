# 🏛️ JanSuniye - Smart Grievance Redressal Platform

[![Node.js](https://img.shields.io/badge/Node.js-v22+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19+-blue.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6+-purple.svg)](https://vitejs.dev/)
[![SQLite](https://img.shields.io/badge/Database-SQLite-003B57.svg)](https://sqlite.org/)
[![AI Powered](https://img.shields.io/badge/AI-Google%20Gemini-orange.svg)](https://ai.google.dev/)

**JanSuniye** is a production-quality, full-stack civic technology application designed for transparent, accountable, and SLA-driven public grievance management. It bridges the gap between citizens and municipal authorities with an AI-assisted multi-step submission wizard, visual timeline tracking, real-time departmental routing, and automated escalation triggers.

---

## 🌟 Key Highlights

- **Multi-Role Portals**: Dedicated workspaces for **Citizens**, **Department Officers**, and **Portal Administrators**.
- **🤖 Civic AI Chatbot & Classification**: 
  - Integrated with `@google/generative-ai` (`gemini-1.5-flash`).
  - Automatically analyzes complaint descriptions to predict category, subcategory, severity, and routing department.
  - Floating interactive AI assistant to help citizens draft complaints, understand SLAs, and resolve civic queries.
- **⏱️ SLA & Escalation Engine**: Automated background audits track resolution deadlines. Breached tickets are automatically escalated with admin alerts.
- **📍 Location & Evidence Attachments**: GPS coordinate tagging, photo/document uploads (with validation), and map previews.
- **📊 Interactive Analytics**: SVG charts for submission trends, category distributions, department redressal velocity, and satisfaction ratings.
- **🛡️ Enterprise Security**: Parameterized queries against SQL injection, bcrypt password hashing, JWT authentication, and full audit trail logging.

---

## 🏗️ System Architecture

```
grievance-portal/
├── backend/
│   ├── config/          # SQLite database connection & initial schema
│   ├── controllers/     # Controller handlers (grievances, departments, etc.)
│   ├── middleware/      # JWT verification & RBAC authorization
│   ├── routes/          # REST route endpoints (/api/auth, /api/grievances, etc.)
│   ├── services/        # Gemini AI LLM & SLA notification engine
│   ├── tests/           # Verification test suite
│   ├── initDb.js        # Standalone database seed runner
│   └── server.js        # Express application entrypoint
├── src/
│   ├── assets/          # Icons & static media
│   ├── components/      # UI components (AIChatBot, SVG charts, etc.)
│   ├── context/         # AuthContext with persistent session state
│   ├── hooks/           # useHashRouter with URL hash persistence
│   ├── layouts/         # Authenticated portal layout with sidebar & topbar
│   ├── pages/           # Landing, Citizen, Officer, Admin dashboards, Submissions
│   ├── services/        # Frontend API client library
│   ├── App.jsx          # Root application component
│   └── index.css        # Responsive CSS custom variable design system
├── docs/                # API, Database, and Setup documentation
└── package.json
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js** (v22.5.0 or later recommended)
- **NPM** (v10 or later)
- **Git**

### 1. Clone & Install
```bash
git clone https://github.com/Harsitha-srinivasan/Grievance.git
cd Grievance
npm install
```

### 2. Environment Configuration (Optional)
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
To enable live Google Gemini LLM chat and categorization, set your key:
```env
GEMINI_API_KEY=your_google_gemini_api_key_here
```
*(If omitted, the platform seamlessly uses the built-in intelligent offline assistant).*

### 3. Initialize Database & Seeds
```bash
node backend/initDb.js
```

### 4. Start the Application
Start the backend server:
```bash
node backend/server.js
```

In a separate terminal, launch the frontend dev server:
```bash
npm run dev
```

Open **[http://localhost:5173](http://localhost:5173)** in your browser!

---

## 🔑 Demo Sandbox Accounts

Pre-seeded accounts are available for instant evaluation:

| Role | Email | Password | Access Highlights |
|---|---|---|---|
| **Citizen** | `citizen@example.com` | `citizen123` | File tickets, chat with AI, track progress, rate resolutions |
| **Officer** | `officer@example.com` | `officer123` | Inspect assigned Roads tickets, update statuses, escalate |
| **Admin** | `admin@example.com` | `admin123` | View audit logs, configure categories & SLAs, manage departments |

---

## 🧪 Automated Verification Test Suite

Run the built-in test suite to verify database tables, hashing security, and AI heuristic classifications:
```bash
node backend/tests/verify.js
```

---

## 📚 Documentation
- [Setup & Deployment Guide](docs/SETUP.md)
- [REST API Specifications](docs/API.md)
- [Database Schema Reference](docs/DATABASE.md)

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).
