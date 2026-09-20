# Project Setup Guide - JanSuniye Portal

This guide provides steps to install dependencies, initialize databases, and launch the Grievance Redressal Platform in a local development environment.

---

## Prerequisites

Ensure you have the following installed:
- **Node.js** (v22.5.0 or later, as we use native `node:sqlite` DatabaseSync)
- **NPM** (v10 or later)

---

## 1. Quick Start Execution

1. **Install Root Node Modules (Frontend & Backend Packages)**:
   ```bash
   npm install
   ```
2. **Initialize SQLite Database & Seed Demo Data**:
   ```bash
   node backend/initDb.js
   ```
3. **Start the Express API Backend Server**:
   ```bash
   node backend/server.js
   ```
4. **Launch Vite React Frontend (In a separate terminal)**:
   ```bash
   npm run dev
   ```
5. **Access Portal**:
   Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 2. Sandbox Accounts

Use these pre-configured credentials to bypass registration during testing:

- **Citizen Access**:
  - Email: `citizen@example.com`
  - Password: `citizen123`
- **Department Officer Access**:
  - Email: `officer@example.com`
  - Password: `officer123`
- **System Administrator Access**:
  - Email: `admin@example.com`
  - Password: `admin123`

---

## 3. Running Heuristic Verification Tests

To verify that the database integrity, bcrypt password encryption, and smart AI classification suggestion utilities are fully functional, execute the test script:

```bash
node backend/tests/verify.js
```
All assertions should pass with a success confirmation output.
