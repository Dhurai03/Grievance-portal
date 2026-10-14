# REST API Documentation - EduGrieve

The EduGrieve backend exposes the following RESTful API endpoints under `/api`. All authenticated endpoints require a valid JWT Bearer token:
```
Authorization: Bearer <token>
```

---

## 1. Authentication (`/api/auth`)

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `/register` | POST | Public | Register a new student or faculty account |
| `/login` | POST | Public | Authenticate user and receive JWT session token |
| `/me` | GET | Token | Retrieve the logged-in user's profile |
| `/profile` | PATCH | Token | Update profile information (name, phone, department) |
| `/change-password` | POST | Token | Securely update password with current verification |

---

## 2. Grievances (`/api/grievances`)

| Endpoint | Method | Auth / Role | Description |
|---|---|---|---|
| `/` | POST | Student | Submit new complaint with auto NLP department routing & file uploads |
| `/` | GET | Token | List grievances (role-scoped, supports status, priority, search filters) |
| `/:id` | GET | Token | Fetch complete grievance record, history log, comments & attachments |
| `/track/:trackingId` | GET | Public | Public grievance lookup by tracking code (`EDU-2026-XXXX`) |
| `/:id/status` | PATCH | Officer / Admin | Update resolution stage (`UNDER_REVIEW`, `IN_PROGRESS`, `RESOLVED`, etc.) |
| `/:id/comments` | POST | Token | Add discussion comment (officers can flag internal notes) |
| `/:id/feedback` | POST | Student | Submit satisfaction rating (1-5 stars) on resolved grievance |
| `/:id/assign` | PATCH | Admin / Dean | Assign grievance to a designated department officer |
| `/ai-classify` | POST | Token | Live NLP/Gemini classification preview for text descriptions |

---

## 3. AI Assistant & Routing (`/api/ai`)

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `/classify` | POST | Optional | Classify complaint text into category, subcategory, priority, & department |
| `/chat` | POST | Optional | Conversational assistant providing advice, drafting tips, & SLA guidance |

---

## 4. Departments (`/api/departments`)

| Endpoint | Method | Auth / Role | Description |
|---|---|---|---|
| `/` | GET | Token | List all active college departments and assigned officers |
| `/:id` | GET | Token | Retrieve specific department information |
| `/` | POST | Admin | Create a new department with custom SLA hours |
| `/:id` | PATCH | Admin | Update department details, contact email, and SLA configuration |
| `/:id/officers` | POST | Admin | Assign an officer or department head |

---

## 5. Notifications (`/api/notifications`)

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `/` | GET | Token | Retrieve user notifications and alerts |
| `/:id/read` | PATCH | Token | Mark a single notification as read |
| `/mark-all-read` | PATCH | Token | Mark all user notifications as read |

---

## 6. Administration & Analytics (`/api/analytics`)

| Endpoint | Method | Auth / Role | Description |
|---|---|---|---|
| `/overview` | GET | Admin / Dean | Campus overview (total, status distribution, resolution rate, breaches) |
| `/by-department` | GET | Admin / Dean | Grievance volume and resolution rate per department |
| `/by-priority` | GET | Admin / Dean | Grievances distributed across Low, Med, High, and Critical |
| `/by-category` | GET | Admin / Dean | Breakdown by category |
| `/monthly-trend` | GET | Admin / Dean | Monthly submission volume history |
| `/users` | GET | Admin / Dean | List registered users with role and department filters |
| `/users/:id/role` | PATCH | Admin | Update a user's role (student, officer, faculty, dean, admin) |
| `/audit-logs` | GET | Admin / Dean | Immutable system security and activity log |
