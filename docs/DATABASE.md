# MongoDB Collections Reference - EduGrieve

EduGrieve uses **MongoDB** with Mongoose Object Data Modeling (ODM).

Database Name: `college_grievance_portal`

---

## Collections & Schemas

### 1. `users` (`User.js`)
Stores student profiles, faculty, department officers, and administration accounts.
- `name` (String, required)
- `email` (String, required, unique, lowercase)
- `password` (String, hashed with bcryptjs)
- `role` (String, enum: `['student', 'faculty', 'officer', 'dean', 'admin']`, default: `'student'`)
- `studentId` (String, student roll/registration number)
- `department` (String, student's branch/major)
- `year` (Number, current academic year)
- `section` (String)
- `designation` (String, for faculty/officers/admin)
- `assignedDepartment` (ObjectId, ref: `Department`, for officers)
- `phone` (String)
- `isActive` (Boolean, default: true)
- `timestamps` (`createdAt`, `updatedAt`)

---

### 2. `departments` (`Department.js`)
Stores college departments and their individual SLA response configurations.
- `name` (String, required, unique) - E.g., Academic Affairs, Hostel & Accommodation, IT & Technical Support
- `code` (String, required, unique, uppercase) - E.g., `ACAD`, `HSTL`, `IT`, `FIN`, `DISC`
- `description` (String)
- `contactEmail` (String)
- `contactPhone` (String)
- `head` (ObjectId, ref: `User`)
- `officers` ([ObjectId, ref: `User`])
- `slaConfig` (Object, resolution hours per priority):
  - `LOW` (Number, default: 168 hours / 7 days)
  - `MEDIUM` (Number, default: 72 hours / 3 days)
  - `HIGH` (Number, default: 48 hours / 2 days)
  - `CRITICAL` (Number, default: 24 hours / 1 day)
- `totalGrievances` (Number, default: 0)
- `resolvedGrievances` (Number, default: 0)
- `isActive` (Boolean, default: true)
- `timestamps` (`createdAt`, `updatedAt`)

---

### 3. `grievances` (`Grievance.js`)
Stores submitted complaints, AI classification metadata, attachments, and resolution lifecycle history.
- `trackingId` (String, required, unique) - Format: `EDU-YYYY-XXXXX`
- `title` (String, required)
- `description` (String, required)
- `category` (String, required)
- `subcategory` (String)
- `department` (ObjectId, ref: `Department`)
- `submittedBy` (ObjectId, ref: `User`)
- `isAnonymous` (Boolean, default: false)
- `priority` (String, enum: `['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']`, default: `'MEDIUM'`)
- `status` (String, enum: `['SUBMITTED', 'UNDER_REVIEW', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REJECTED', 'ESCALATED']`)
- `assignedTo` (ObjectId, ref: `User`, assigned department officer)
- `attachments` ([Object: `filename`, `originalName`, `mimetype`, `size`])
- `aiClassification` (Object):
  - `category` (String)
  - `subcategory` (String)
  - `department` (String)
  - `departmentCode` (String)
  - `priority` (String)
  - `confidence` (Number)
  - `reasoning` (String)
  - `model` (String)
  - `classifiedAt` (Date)
- `isAiRouted` (Boolean, default: true)
- `slaDeadline` (Date)
- `isSlaBreach` (Boolean, default: false)
- `escalatedAt` (Date)
- `escalationReason` (String)
- `history` ([Object: `previousStatus`, `newStatus`, `changedBy`, `remarks`, `timestamp`])
- `comments` ([Object: `author`, `text`, `isInternal`, `createdAt`])
- `feedback` (Object: `rating`, `comment`, `submittedAt`)
- `timestamps` (`createdAt`, `updatedAt`)

---

### 4. `notifications` (`Notification.js`)
Alerts sent to students, officers, and administrators.
- `recipient` (ObjectId, ref: `User`, required)
- `type` (String, enum: `['GRIEVANCE_SUBMITTED', 'STATUS_UPDATED', 'GRIEVANCE_ASSIGNED', 'SLA_BREACH', 'ESCALATED', 'NEW_COMMENT']`)
- `title` (String, required)
- `message` (String, required)
- `grievance` (ObjectId, ref: `Grievance`)
- `link` (String, navigation hash)
- `isRead` (Boolean, default: false)
- `timestamps` (`createdAt`, `updatedAt`)

---

### 5. `audit_logs` (`AuditLog.js`)
Immutable audit record for compliance and accountability.
- `action` (String, required) - E.g., `GRIEVANCE_SUBMITTED`, `STATUS_UPDATED`, `ROLE_UPDATED`
- `performedBy` (ObjectId, ref: `User`)
- `targetEntity` (String)
- `targetId` (ObjectId)
- `metadata` (Object)
- `timestamps` (`createdAt`)
