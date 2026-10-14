# Setup & Local Execution Guide - EduGrieve

Follow these instructions to set up and run the EduGrieve College Grievance Portal locally.

---

## 1. Prerequisites

- **Node.js**: v20 or higher
- **MongoDB**: Local MongoDB community service (`mongodb://localhost:27017`) or MongoDB Atlas URI
- **NPM**: v10 or higher

---

## 2. Directory Layout

```
Grievance/
├── backend/    # Express server, MongoDB models, NLP classifier & AI engine
├── frontend/   # React 19 + Vite client application
├── docs/       # Architecture & API documentation
└── README.md   # Project overview
```

---

## 3. Dependency Installation

From the root directory:

```bash
# 1. Install backend dependencies
cd backend
npm install

# 2. Install frontend dependencies
cd ../frontend
npm install
```

---

## 4. Environment Setup

Verify `backend/.env`:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/college_grievance_portal
JWT_SECRET=college_grievance_super_secret_key_2024
JWT_EXPIRES_IN=7d
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Optional: Set your Google Gemini API Key for live AI responses
GEMINI_API_KEY=your_key_here
```

---

## 5. Seed Initial Campus Data

Ensure MongoDB is running, then populate initial departments and demo users:

```bash
node backend/seed.js
```

---

## 6. Run System Verification Tests

```bash
node backend/tests/verify.js
```

---

## 7. Starting the Application

Launch both backend and frontend servers in separate terminal sessions:

**Terminal 1 (Backend):**
```bash
cd backend
npm start
```
*Backend runs at: `http://localhost:5000`*

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```
*Frontend runs at: `http://localhost:5173`*

Open **http://localhost:5173** to access EduGrieve!
