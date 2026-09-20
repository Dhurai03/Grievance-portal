# Database Schema Reference - JanSuniye

The Grievance Redressal Platform uses a normalized SQLite database stored at `database/grievances.db`. Foreign keys constraints are enforced on runtime initialization.

---

## Entity Relationship Tables

### 1. `users`
Stores user profile credentials and system-wide roles.
- `id` (INTEGER PRIMARY KEY AUTOINCREMENT)
- `email` (TEXT UNIQUE NOT NULL)
- `password_hash` (TEXT NOT NULL)
- `name` (TEXT NOT NULL)
- `role` (TEXT NOT NULL) - Constraints: `citizen`, `officer`, `admin`
- `phone` (TEXT NULL)
- `created_at` (DATETIME DEFAULT CURRENT_TIMESTAMP)

### 2. `departments`
Stores municipal office departments.
- `id` (INTEGER PRIMARY KEY AUTOINCREMENT)
- `name` (TEXT UNIQUE NOT NULL) - E.g., Water Supply, Electricity
- `description` (TEXT NULL)
- `contact_email` (TEXT NULL)
- `contact_phone` (TEXT NULL)
- `status` (TEXT DEFAULT 'active') - Constraints: `active`, `inactive`
- `created_at` (DATETIME DEFAULT CURRENT_TIMESTAMP)

### 3. `officers`
Stores designation details for users promoted to the Officer role.
- `id` (INTEGER PRIMARY KEY AUTOINCREMENT)
- `user_id` (INTEGER NOT NULL UNIQUE) - Foreign Key `users(id)` ON DELETE CASCADE
- `department_id` (INTEGER NULL) - Foreign Key `departments(id)` ON DELETE SET NULL
- `designation` (TEXT NULL)
- `created_at` (DATETIME DEFAULT CURRENT_TIMESTAMP)

### 4. `categories`
Stores main category groupings.
- `id` (INTEGER PRIMARY KEY AUTOINCREMENT)
- `name` (TEXT UNIQUE NOT NULL)
- `description` (TEXT NULL)
- `created_at` (DATETIME DEFAULT CURRENT_TIMESTAMP)

### 5. `subcategories`
Stores nested grievance types, mapping them to departments and configuring SLAs.
- `id` (INTEGER PRIMARY KEY AUTOINCREMENT)
- `category_id` (INTEGER NOT NULL) - Foreign Key `categories(id)` ON DELETE CASCADE
- `name` (TEXT NOT NULL)
- `department_id` (INTEGER NULL) - Foreign Key `departments(id)` ON DELETE SET NULL
- `sla_days` (INTEGER DEFAULT 7) - SLA resolution period (Days)
- `created_at` (DATETIME DEFAULT CURRENT_TIMESTAMP)
- *Constraint*: `UNIQUE(category_id, name)`

### 6. `grievances`
Primary ledger storing filed complaints.
- `id` (TEXT PRIMARY KEY) - Generated format: `GRV-YYYY-XXXXXX`
- `title` (TEXT NOT NULL)
- `description` (TEXT NOT NULL)
- `citizen_id` (INTEGER NOT NULL) - Foreign Key `users(id)` ON DELETE CASCADE
- `subcategory_id` (INTEGER NULL) - Foreign Key `subcategories(id)` ON DELETE SET NULL
- `department_id` (INTEGER NULL) - Foreign Key `departments(id)` ON DELETE SET NULL
- `assigned_officer_id` (INTEGER NULL) - Foreign Key `officers(id)` ON DELETE SET NULL
- `priority` (TEXT NOT NULL) - Constraints: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`
- `status` (TEXT NOT NULL) - Constraints: `SUBMITTED`, `ACKNOWLEDGED`, `ASSIGNED`, `UNDER REVIEW`, `IN PROGRESS`, `WAITING FOR CITIZEN`, `RESOLVED`, `CLOSED`, `REJECTED`, `ESCALATED`, `REOPENED`
- `address` (TEXT NULL), `city` (TEXT NULL), `district` (TEXT NULL), `state` (TEXT NULL), `pincode` (TEXT NULL)
- `latitude` (REAL NULL), `longitude` (REAL NULL)
- `is_private` (INTEGER DEFAULT 0) - `1` to hide contact info from guest views, else `0`
- `sla_deadline` (DATETIME NULL) - Target resolution deadline timestamp
- `created_at` (DATETIME DEFAULT CURRENT_TIMESTAMP)
- `updated_at` (DATETIME DEFAULT CURRENT_TIMESTAMP)

### 7. `grievance_history`
Stores status transitions log timeline.
- `id` (INTEGER PRIMARY KEY AUTOINCREMENT)
- `grievance_id` (TEXT NOT NULL) - Foreign Key `grievances(id)` ON DELETE CASCADE
- `previous_status` (TEXT NULL)
- `new_status` (TEXT NOT NULL)
- `changed_by` (INTEGER NULL) - Foreign Key `users(id)` ON DELETE SET NULL
- `remarks` (TEXT NULL)
- `timestamp` (DATETIME DEFAULT CURRENT_TIMESTAMP)

### 8. `grievance_comments`
Discussion thread messaging logs.
- `id` (INTEGER PRIMARY KEY AUTOINCREMENT)
- `grievance_id` (TEXT NOT NULL) - Foreign Key `grievances(id)` ON DELETE CASCADE
- `user_id` (INTEGER NULL) - Foreign Key `users(id)` ON DELETE SET NULL
- `comment` (TEXT NOT NULL)
- `is_internal` (INTEGER DEFAULT 0) - `1` if restricted to officers/admins, `0` for public
- `created_at` (DATETIME DEFAULT CURRENT_TIMESTAMP)

### 9. `attachments`
Evidence upload links.
- `id` (INTEGER PRIMARY KEY AUTOINCREMENT)
- `grievance_id` (TEXT NOT NULL) - Foreign Key `grievances(id)` ON DELETE CASCADE
- `file_name` (TEXT NOT NULL), `file_path` (TEXT NOT NULL), `file_type` (TEXT NOT NULL), `file_size` (INTEGER NOT NULL)
- `uploaded_at` (DATETIME DEFAULT CURRENT_TIMESTAMP)

### 10. `notifications`
In-app notification center logs.
- `id` (INTEGER PRIMARY KEY AUTOINCREMENT)
- `user_id` (INTEGER NOT NULL) - Foreign Key `users(id)` ON DELETE CASCADE
- `grievance_id` (TEXT NULL) - Foreign Key `grievances(id)` ON DELETE SET NULL
- `message` (TEXT NOT NULL)
- `is_read` (INTEGER DEFAULT 0)
- `created_at` (DATETIME DEFAULT CURRENT_TIMESTAMP)

### 11. `escalations`
SLA breach or officer-triggered escalations.
- `id` (INTEGER PRIMARY KEY AUTOINCREMENT)
- `grievance_id` (TEXT NOT NULL) - Foreign Key `grievances(id)` ON DELETE CASCADE
- `escalated_from_officer_id` (INTEGER NULL) - Foreign Key `officers(id)` ON DELETE SET NULL
- `escalated_to_admin_id` (INTEGER NULL) - Foreign Key `users(id)` ON DELETE SET NULL
- `reason` (TEXT NOT NULL)
- `status` (TEXT DEFAULT 'PENDING') - Constraints: `PENDING`, `RESOLVED`
- `created_at` (DATETIME DEFAULT CURRENT_TIMESTAMP)

### 12. `feedback`
Citizen rating evaluations for resolved complaints.
- `id` (INTEGER PRIMARY KEY AUTOINCREMENT)
- `grievance_id` (TEXT NOT NULL UNIQUE) - Foreign Key `grievances(id)` ON DELETE CASCADE
- `rating` (INTEGER NOT NULL) - Constraint: `1` to `5` stars
- `comments` (TEXT NULL)
- `created_at` (DATETIME DEFAULT CURRENT_TIMESTAMP)

### 13. `audit_logs`
Global security administrative log.
- `id` (INTEGER PRIMARY KEY AUTOINCREMENT)
- `user_id` (INTEGER NULL) - Foreign Key `users(id)` ON DELETE SET NULL
- `action` (TEXT NOT NULL)
- `entity_type` (TEXT NOT NULL), `entity_id` (TEXT NULL)
- `metadata` (TEXT NULL) - JSON string data
- `timestamp` (DATETIME DEFAULT CURRENT_TIMESTAMP)
