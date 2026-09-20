const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

// Ensure database directory exists
const dbDir = path.join(__dirname, '..', '..', 'database');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'grievances.db');
const db = new DatabaseSync(dbPath);

console.log(`Database connected at: ${dbPath}`);

// Enable foreign keys
db.exec('PRAGMA foreign_keys = ON;');

// Create tables in order of dependency
function initDb() {
  // 1. Users Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('citizen', 'officer', 'admin')),
      phone TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 2. Departments Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS departments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      description TEXT,
      contact_email TEXT,
      contact_phone TEXT,
      status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 3. Officers Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS officers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL UNIQUE,
      department_id INTEGER,
      designation TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
    );
  `);

  // 4. Categories Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 5. Subcategories Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS subcategories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      department_id INTEGER,
      sla_days INTEGER DEFAULT 7 CHECK(sla_days > 0),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
      FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
      UNIQUE(category_id, name)
    );
  `);

  // 6. Grievances Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS grievances (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      citizen_id INTEGER NOT NULL,
      subcategory_id INTEGER,
      department_id INTEGER,
      assigned_officer_id INTEGER,
      priority TEXT NOT NULL CHECK(priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
      status TEXT NOT NULL CHECK(status IN (
        'SUBMITTED', 'ACKNOWLEDGED', 'ASSIGNED', 'UNDER REVIEW', 
        'IN PROGRESS', 'WAITING FOR CITIZEN', 'RESOLVED', 'CLOSED', 
        'REJECTED', 'ESCALATED', 'REOPENED'
      )),
      address TEXT,
      city TEXT,
      district TEXT,
      state TEXT,
      pincode TEXT,
      latitude REAL,
      longitude REAL,
      is_private INTEGER DEFAULT 0 CHECK(is_private IN (0, 1)),
      sla_deadline DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (citizen_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (subcategory_id) REFERENCES subcategories(id) ON DELETE SET NULL,
      FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
      FOREIGN KEY (assigned_officer_id) REFERENCES officers(id) ON DELETE SET NULL
    );
  `);

  // 7. Grievance Status History
  db.exec(`
    CREATE TABLE IF NOT EXISTS grievance_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      grievance_id TEXT NOT NULL,
      previous_status TEXT,
      new_status TEXT NOT NULL,
      changed_by INTEGER,
      remarks TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (grievance_id) REFERENCES grievances(id) ON DELETE CASCADE,
      FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL
    );
  `);

  // 8. Grievance Comments
  db.exec(`
    CREATE TABLE IF NOT EXISTS grievance_comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      grievance_id TEXT NOT NULL,
      user_id INTEGER,
      comment TEXT NOT NULL,
      is_internal INTEGER DEFAULT 0 CHECK(is_internal IN (0, 1)),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (grievance_id) REFERENCES grievances(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );
  `);

  // 9. Attachments Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS attachments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      grievance_id TEXT NOT NULL,
      file_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_type TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (grievance_id) REFERENCES grievances(id) ON DELETE CASCADE
    );
  `);

  // 10. Notifications Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      grievance_id TEXT,
      message TEXT NOT NULL,
      is_read INTEGER DEFAULT 0 CHECK(is_read IN (0, 1)),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (grievance_id) REFERENCES grievances(id) ON DELETE SET NULL
    );
  `);

  // 11. Escalations Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS escalations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      grievance_id TEXT NOT NULL,
      escalated_from_officer_id INTEGER,
      escalated_to_admin_id INTEGER,
      reason TEXT NOT NULL,
      status TEXT DEFAULT 'PENDING' CHECK(status IN ('PENDING', 'RESOLVED')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (grievance_id) REFERENCES grievances(id) ON DELETE CASCADE,
      FOREIGN KEY (escalated_from_officer_id) REFERENCES officers(id) ON DELETE SET NULL,
      FOREIGN KEY (escalated_to_admin_id) REFERENCES users(id) ON DELETE SET NULL
    );
  `);

  // 12. Feedback Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS feedback (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      grievance_id TEXT NOT NULL UNIQUE,
      rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
      comments TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (grievance_id) REFERENCES grievances(id) ON DELETE CASCADE
    );
  `);

  // 13. Audit Logs Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT,
      metadata TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );
  `);

  console.log("Database schema initialized.");
  
  // Seed initial data if empty
  seedData();
}

function seedData() {
  const usersCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (usersCount > 0) {
    console.log("Database already seeded.");
    return;
  }

  console.log("Seeding initial database content...");

  // 1. Seed Departments
  const departments = [
    { name: 'Water Supply', desc: 'Handles clean drinking water, pipe leaks, and billing issues.', email: 'water@gov.org', phone: '1800-111-001' },
    { name: 'Electricity', desc: 'Manages grid lines, blackouts, street lighting, and transformer issues.', email: 'power@gov.org', phone: '1800-111-002' },
    { name: 'Roads & Infrastructure', desc: 'Responsible for road maintenance, potholes, and bridge upkeep.', email: 'roads@gov.org', phone: '1800-111-003' },
    { name: 'Sanitation', desc: 'Handles garbage collection, street sweeping, and public hygiene.', email: 'sanitation@gov.org', phone: '1800-111-004' },
    { name: 'Public Safety', desc: 'Coordinated police, fire, emergency services, and general public security.', email: 'safety@gov.org', phone: '1800-111-005' },
    { name: 'Municipal Services', desc: 'Controls general local administration, park upkeep, and commercial licensing.', email: 'municipal@gov.org', phone: '1800-111-006' }
  ];

  const insertDept = db.prepare(`
    INSERT INTO departments (name, description, contact_email, contact_phone) 
    VALUES (?, ?, ?, ?)
  `);
  
  departments.forEach(dept => {
    insertDept.run(dept.name, dept.desc, dept.email, dept.phone);
  });
  console.log("Seeded departments.");

  // Fetch created department ids
  const deptList = db.prepare('SELECT id, name FROM departments').all();
  const getDeptId = name => deptList.find(d => d.name === name).id;

  // 2. Seed Categories
  const categories = [
    { name: 'Water Supply', desc: 'Water leakage, quality, supply hours' },
    { name: 'Electricity & Power', desc: 'Outages, billing, sparking transformers' },
    { name: 'Roads & Streets', desc: 'Potholes, paving, signages' },
    { name: 'Garbage & Waste', desc: 'Trash overflow, sewage block' }
  ];

  const insertCat = db.prepare('INSERT INTO categories (name, description) VALUES (?, ?)');
  categories.forEach(cat => {
    insertCat.run(cat.name, cat.desc);
  });
  console.log("Seeded categories.");

  // Fetch category ids
  const catList = db.prepare('SELECT id, name FROM categories').all();
  const getCatId = name => catList.find(c => c.name === name).id;

  // 3. Seed Subcategories with SLA & Routing Dept
  const subcategories = [
    { cat: 'Water Supply', name: 'Water Pipe Leakage', dept: 'Water Supply', sla: 3 },
    { cat: 'Water Supply', name: 'Dirty Water Supply', dept: 'Water Supply', sla: 2 },
    { cat: 'Electricity & Power', name: 'Area Power Outage', dept: 'Electricity', sla: 1 },
    { cat: 'Electricity & Power', name: 'Dangerous Sparks or Hanging Wire', dept: 'Electricity', sla: 1 },
    { cat: 'Roads & Streets', name: 'Potholes on Main Road', dept: 'Roads & Infrastructure', sla: 7 },
    { cat: 'Roads & Streets', name: 'Broken Streetlights', dept: 'Roads & Infrastructure', sla: 5 },
    { cat: 'Garbage & Waste', name: 'Garbage Dump Overflow', dept: 'Sanitation', sla: 2 },
    { cat: 'Garbage & Waste', name: 'Drain Clogging', dept: 'Sanitation', sla: 3 }
  ];

  const insertSub = db.prepare(`
    INSERT INTO subcategories (category_id, name, department_id, sla_days) 
    VALUES (?, ?, ?, ?)
  `);

  subcategories.forEach(sub => {
    insertSub.run(getCatId(sub.cat), sub.name, getDeptId(sub.dept), sub.sla);
  });
  console.log("Seeded subcategories.");

  // Fetch subcategories
  const subList = db.prepare('SELECT id, name FROM subcategories').all();
  const getSubId = name => subList.find(s => s.name === name).id;

  // 4. Seed Users (Citizen, Officer, Admin)
  const insertUser = db.prepare(`
    INSERT INTO users (email, password_hash, name, role, phone) 
    VALUES (?, ?, ?, ?, ?)
  `);

  const citizenHash = bcrypt.hashSync('citizen123', 10);
  const officerHash = bcrypt.hashSync('officer123', 10);
  const adminHash = bcrypt.hashSync('admin123', 10);

  // Seed standard demo users
  insertUser.run('citizen@example.com', citizenHash, 'Rahul Sharma (Citizen)', 'citizen', '+91 98765 43210');
  insertUser.run('officer@example.com', officerHash, 'Officer Vikram Singh', 'officer', '+91 99988 87766');
  insertUser.run('admin@example.com', adminHash, 'System Administrator', 'admin', '+91 90000 11111');

  // Seed another couple of officers for assignment diversity
  insertUser.run('roads.officer@example.com', officerHash, 'Anil Kumar (Roads Inspector)', 'officer', '+91 88877 66655');
  insertUser.run('water.officer@example.com', officerHash, 'Priya Patel (Water Engineer)', 'officer', '+91 77766 55544');

  console.log("Seeded users.");

  // Fetch user list
  const userList = db.prepare('SELECT id, email FROM users').all();
  const getUserId = email => userList.find(u => u.email === email).id;

  // 5. Seed Officers details
  const insertOfficer = db.prepare(`
    INSERT INTO officers (user_id, department_id, designation) 
    VALUES (?, ?, ?)
  `);

  // officer@example.com -> Roads & Infrastructure
  insertOfficer.run(getUserId('officer@example.com'), getDeptId('Roads & Infrastructure'), 'Junior Roads Engineer');
  // roads.officer@example.com -> Roads & Infrastructure
  insertOfficer.run(getUserId('roads.officer@example.com'), getDeptId('Roads & Infrastructure'), 'Roads & Infrastructure Superintendent');
  // water.officer@example.com -> Water Supply
  insertOfficer.run(getUserId('water.officer@example.com'), getDeptId('Water Supply'), 'Assistant Water Engineer');
  
  console.log("Seeded officer department assignments.");

  const officerRows = db.prepare('SELECT id, user_id FROM officers').all();
  const getOfficerIdByEmail = email => officerRows.find(o => o.user_id === getUserId(email)).id;

  // 6. Seed Grievances
  const insertGrievance = db.prepare(`
    INSERT INTO grievances (id, title, description, citizen_id, subcategory_id, department_id, assigned_officer_id, priority, status, address, city, district, state, pincode, latitude, longitude, is_private, sla_deadline, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const citizenId = getUserId('citizen@example.com');
  const roadsDeptId = getDeptId('Roads & Infrastructure');
  const waterDeptId = getDeptId('Water Supply');
  const sanitationDeptId = getDeptId('Sanitation');

  const roadsOfficerId = getOfficerIdByEmail('officer@example.com');
  const waterOfficerId = getOfficerIdByEmail('water.officer@example.com');

  // Let's create timestamps relative to current time to mock dynamic data
  const now = new Date();
  
  // Grievance 1: Resolved Pothole (Submitted 10 days ago, resolved 3 days ago)
  const g1Created = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString();
  const g1Updated = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString();
  const g1Sla = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(); // 7 days SLA
  insertGrievance.run(
    'GRV-2026-000101',
    'Massive pothole on Sector 5 Main Road',
    'There is an extremely large pothole near the central bus stop. It causes vehicles to swerve dangerously, especially during rainfall. Several motorists have suffered minor accidents.',
    citizenId,
    getSubId('Potholes on Main Road'),
    roadsDeptId,
    roadsOfficerId,
    'HIGH',
    'RESOLVED',
    'Near Central Bus Stop, Sector 5',
    'New Delhi',
    'Central',
    'Delhi',
    '110001',
    28.6139,
    77.2090,
    0,
    g1Sla,
    g1Created,
    g1Updated
  );

  // Grievance 2: In Progress Power Outage (Submitted 12 hours ago, SLA is 24 hours, due soon)
  const g2Created = new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString();
  const g2Updated = new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString();
  const g2Sla = new Date(now.getTime() + 12 * 60 * 60 * 1000).toISOString(); // 1 day SLA
  insertGrievance.run(
    'GRV-2026-000102',
    'Frequent power outage in block C',
    'Block C has been experiencing continuous power outages lasting 4-5 hours every single evening. No notices or maintenance details have been shared by the electricity board.',
    citizenId,
    getSubId('Area Power Outage'),
    getDeptId('Electricity'),
    null, // Unassigned officer yet
    'MEDIUM',
    'ASSIGNED',
    'Block C, Sector 12',
    'New Delhi',
    'South',
    'Delhi',
    '110021',
    28.5700,
    77.2200,
    0,
    g2Sla,
    g2Created,
    g2Updated
  );

  // Grievance 3: SLA Breached Dirty Water (Submitted 5 days ago, SLA was 2 days)
  const g3Created = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString();
  const g3Updated = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString();
  const g3Sla = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(); // 2 days SLA, expired!
  insertGrievance.run(
    'GRV-2026-000103',
    'Contaminated mud water in tap',
    'Since the last 4 days, the tap water supply in our locality contains dark mud sediment and smells heavily of sewage. It is completely unfit for cooking or drinking.',
    citizenId,
    getSubId('Dirty Water Supply'),
    waterDeptId,
    waterOfficerId,
    'CRITICAL',
    'ESCALATED', // Escalated due to SLA breach
    'Gali No. 4, Pocket A, Sector 3',
    'New Delhi',
    'West',
    'Delhi',
    '110059',
    28.6200,
    77.0800,
    1, // Private contact details
    g3Sla,
    g3Created,
    g3Updated
  );

  // Grievance 4: Submitted Garbage collection (Submitted 2 hours ago)
  const g4Created = new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString();
  const g4Updated = g4Created;
  const g4Sla = new Date(now.getTime() + 46 * 60 * 60 * 1000).toISOString(); // 2 days SLA
  insertGrievance.run(
    'GRV-2026-000104',
    'Garbage truck has not arrived for a week',
    'The garbage collector truck has not visited pocket B for the last 7 days. Trash is piling up outside houses, causing stray dogs to spread it everywhere and creating a horrible smell.',
    citizenId,
    getSubId('Garbage Dump Overflow'),
    sanitationDeptId,
    null,
    'LOW',
    'SUBMITTED',
    'Pocket B, Block 2, Sector 15',
    'New Delhi',
    'North',
    'Delhi',
    '110085',
    28.7100,
    77.1200,
    0,
    g4Sla,
    g4Created,
    g4Updated
  );

  console.log("Seeded grievances.");

  // 7. Seed History
  const insertHistory = db.prepare(`
    INSERT INTO grievance_history (grievance_id, previous_status, new_status, changed_by, remarks, timestamp)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  // History for GRV-2026-000101 (Resolved Pothole)
  insertHistory.run('GRV-2026-000101', null, 'SUBMITTED', citizenId, 'Grievance submitted by citizen', g1Created);
  insertHistory.run('GRV-2026-000101', 'SUBMITTED', 'ACKNOWLEDGED', getUserId('admin@example.com'), 'Acknowledged by administration. Route assigned to Roads Department.', new Date(new Date(g1Created).getTime() + 1 * 3600000).toISOString());
  insertHistory.run('GRV-2026-000101', 'ACKNOWLEDGED', 'ASSIGNED', getUserId('admin@example.com'), 'Assigned to Roads Officer Vikram Singh.', new Date(new Date(g1Created).getTime() + 2 * 3600000).toISOString());
  insertHistory.run('GRV-2026-000101', 'ASSIGNED', 'IN PROGRESS', getUserId('officer@example.com'), 'Inspected location. Road patching scheduled.', new Date(new Date(g1Created).getTime() + 24 * 3600000).toISOString());
  insertHistory.run('GRV-2026-000101', 'IN PROGRESS', 'RESOLVED', getUserId('officer@example.com'), 'Pothole filled and road leveled. Resolution photo uploaded.', g1Updated);

  // History for GRV-2026-000103 (Mud Water)
  insertHistory.run('GRV-2026-000103', null, 'SUBMITTED', citizenId, 'Grievance submitted. Marked Critical.', g3Created);
  insertHistory.run('GRV-2026-000103', 'SUBMITTED', 'ASSIGNED', getUserId('admin@example.com'), 'Routed to Water Supply department, assigned to Priya Patel.', new Date(new Date(g3Created).getTime() + 4 * 3600000).toISOString());
  insertHistory.run('GRV-2026-000103', 'ASSIGNED', 'ESCALATED', null, 'Automated SLA Breach: Escalated to Administration', g3Updated);

  console.log("Seeded grievance histories.");

  // 8. Seed Comments
  const insertComment = db.prepare(`
    INSERT INTO grievance_comments (grievance_id, user_id, comment, is_internal, created_at)
    VALUES (?, ?, ?, ?, ?)
  `);

  insertComment.run(
    'GRV-2026-000101', 
    getUserId('officer@example.com'), 
    'We are waiting for the hot-mix asphalt batch supply. Road repair crew will visit tomorrow morning.', 
    0, 
    new Date(new Date(g1Created).getTime() + 22 * 3600000).toISOString()
  );
  insertComment.run(
    'GRV-2026-000101', 
    citizenId, 
    'Thank you. Please ensure the repair goes up to the bus stand shelter area as well.', 
    0, 
    new Date(new Date(g1Created).getTime() + 23 * 3600000).toISOString()
  );
  insertComment.run(
    'GRV-2026-000101', 
    getUserId('officer@example.com'), 
    'Noted, we will patch the entire bus stop bay.', 
    1, // Internal comment between officers
    new Date(new Date(g1Created).getTime() + 23.5 * 3600000).toISOString()
  );

  // Comments for GRV-2026-000103 (Dirty Water)
  insertComment.run(
    'GRV-2026-000103', 
    getUserId('water.officer@example.com'), 
    'Our crew is testing the water purification valve at block 3. Please let us know if the water is clearing up.', 
    0, 
    new Date(new Date(g3Created).getTime() + 18 * 3600000).toISOString()
  );
  insertComment.run(
    'GRV-2026-000103', 
    citizenId, 
    'Still extremely dirty. We cannot use it even for washing clothes.', 
    0, 
    new Date(new Date(g3Created).getTime() + 24 * 3600000).toISOString()
  );

  console.log("Seeded grievance comments.");

  // 9. Seed Feedback for resolved grievance
  const insertFeedback = db.prepare(`
    INSERT INTO feedback (grievance_id, rating, comments, created_at)
    VALUES (?, ?, ?, ?)
  `);
  insertFeedback.run('GRV-2026-000101', 5, 'Quick response! The pothole was fixed perfectly and the street is safe now. Thanks!', g1Updated);
  console.log("Seeded customer feedback.");

  // 10. Seed Notifications
  const insertNotif = db.prepare(`
    INSERT INTO notifications (user_id, grievance_id, message, is_read)
    VALUES (?, ?, ?, ?)
  `);

  insertNotif.run(citizenId, 'GRV-2026-000101', 'Your grievance GRV-2026-000101 has been marked as RESOLVED.', 1);
  insertNotif.run(citizenId, 'GRV-2026-000102', 'Your grievance GRV-2026-000102 has been assigned to a department officer.', 0);
  insertNotif.run(getUserId('officer@example.com'), 'GRV-2026-000101', 'Grievance GRV-2026-000101 has been assigned to you.', 1);
  insertNotif.run(getUserId('water.officer@example.com'), 'GRV-2026-000103', 'Grievance GRV-2026-000103 SLA has BREACHED and escalated.', 0);

  console.log("Seeded notifications.");

  // 11. Seed Audit Logs
  const insertAudit = db.prepare(`
    INSERT INTO audit_logs (user_id, action, entity_type, entity_id, metadata)
    VALUES (?, ?, ?, ?, ?)
  `);
  insertAudit.run(getUserId('admin@example.com'), 'CREATE_DEPARTMENT', 'department', '1', JSON.stringify({ name: 'Water Supply' }));
  insertAudit.run(getUserId('admin@example.com'), 'CREATE_DEPARTMENT', 'department', '3', JSON.stringify({ name: 'Roads & Infrastructure' }));
  insertAudit.run(citizenId, 'CREATE_GRIEVANCE', 'grievance', 'GRV-2026-000101', JSON.stringify({ title: 'Massive pothole on Sector 5 Main Road' }));
  insertAudit.run(getUserId('officer@example.com'), 'RESOLVE_GRIEVANCE', 'grievance', 'GRV-2026-000101', JSON.stringify({ remark: 'Pothole filled and road leveled.' }));

  console.log("Seeded audit logs.");
}

module.exports = {
  db,
  initDb
};
