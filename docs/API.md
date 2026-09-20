# REST API Endpoint Documentation - JanSuniye

The backend Express application exposes the following REST API endpoints under the `/api` namespace. All authenticated requests require a valid JWT Bearer Token in the `Authorization` header:
`Authorization: Bearer <JWT_TOKEN>`

---

## 1. Authentication (`/api/auth`)

| Endpoint | Method | Auth Required | Description |
|---|---|---|---|
| `/register` | POST | None | Creates a new Citizen user account. Returns a JWT session token. |
| `/login` | POST | None | Authenticates credentials. Returns user profile details and a JWT token. |
| `/me` | GET | Token | Decodes the JWT token and returns the current user profile. |

---

## 2. Grievances (`/api/grievances`)

| Endpoint | Method | Auth / Role | Description |
|---|---|---|---|
| `/` | GET | Token | Lists grievances. Filtered by role (citizens see theirs, officers see department/assigned, admins see all). Filters: `status`, `priority`, `categoryId`, `departmentId`, `search`, `isBreached`. |
| `/` | POST | Token / Citizen | Files a new grievance. Auto-assigns department and computes SLA. |
| `/:id` | GET | Token | Fetches details, timelines, attachments, comments, and ratings feedback. |
| `/:id/status` | PATCH | Token | Updates ticket lifecycle status. Citizens can only Reopen or Close. |
| `/:id/comments` | POST | Token | Appends discussion comments. Officers can mark comments as internal. |
| `/:id/feedback` | POST | Token / Citizen | Rates a resolved ticket (1-5 stars), triggers auto-close. |
| `/:id/assign` | POST | Token / Officer / Admin | Routes/assigns ticket to department or executive officer. |
| `/:id/escalate` | POST | Token / Officer | Manually escalates a ticket to admin attention. |
| `/:id/attachments` | POST | Token | Uploads up to 5 attachments via Multer. |

---

## 3. Departments (`/api/departments`)

| Endpoint | Method | Auth / Role | Description |
|---|---|---|---|
| `/` | GET | Token | Lists all active departments. |
| `/` | POST | Token / Admin | Creates a new municipal department. |
| `/:id` | PUT | Token / Admin | Updates department attributes. |
| `/:id` | DELETE | Token / Admin | Removes a department. |

---

## 4. Categories & SLAs (`/api/categories`)

| Endpoint | Method | Auth / Role | Description |
|---|---|---|---|
| `/` | GET | Token | Fetch categories and subcategories tree. |
| `/` | POST | Token / Admin | Creates a new parent category. |
| `/:id` | DELETE | Token / Admin | Deletes category and nested subcategories. |
| `/:categoryId/subcategories` | POST | Token / Admin | Adds a subcategory, linking routing and SLA days. |
| `/subcategories/:id` | PUT | Token / Admin | Modifies subcategory routing department and SLA days. |
| `/subcategories/:id` | DELETE | Token / Admin | Deletes a subcategory. |

---

## 5. System Analytics (`/api/analytics`)

| Endpoint | Method | Auth / Role | Description |
|---|---|---|---|
| `/admin` | GET | Token / Admin | Returns overall metrics, monthly submissions lines, category shares, and department tables. |
| `/officer` | GET | Token / Officer | Returns officer assigned counts, due soon queues, and department stats. |
| `/citizen` | GET | Token / Citizen | Returns citizen personal complaint status summaries. |

---

## 6. Notifications (`/api/notifications`)

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `/` | GET | Token | Fetch active user in-app notifications list (limit 100). |
| `/:id/read` | PATCH | Token | Mark notification as read. |

---

## 7. AI Suggestions & Promotions (`/api/admin`, `/api/ai`)

| Endpoint | Method | Auth / Role | Description |
|---|---|---|---|
| `/ai/classify` | POST | Token | Parsers input text description to predict category, department, and priority. |
| `/admin/users` | GET | Token / Admin | Lists all user records, designations, and roles. |
| `/admin/users/:id/role` | PATCH | Token / Admin | Promotes user roles and maps officer designations. |
| `/admin/audit-logs` | GET | Token / Admin | Returns security audit log logs list. |
