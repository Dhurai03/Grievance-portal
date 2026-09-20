const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../config/db');
const { JWT_SECRET } = require('../middleware/authMiddleware');

// 1. Citizen Registration
function register(req, res) {
  const { email, password, name, phone } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Email, password, and name are required.' });
  }

  try {
    // Check if user already exists
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }

    // Hash password
    const passwordHash = bcrypt.hashSync(password, 10);

    // Insert user as citizen
    const insertStmt = db.prepare(`
      INSERT INTO users (email, password_hash, name, role, phone)
      VALUES (?, ?, ?, 'citizen', ?)
    `);
    const result = insertStmt.run(email, passwordHash, name, phone || null);

    const userId = result.lastInsertRowid;

    // Create Audit Log
    db.prepare(`
      INSERT INTO audit_logs (user_id, action, entity_type, entity_id, metadata)
      VALUES (?, 'REGISTER_CITIZEN', 'user', ?, ?)
    `).run(userId, userId.toString(), JSON.stringify({ email, name }));

    // Generate JWT
    const token = jwt.sign(
      { id: userId, email, role: 'citizen', name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(211).json({
      message: 'Registration successful!',
      token,
      user: { id: userId, email, role: 'citizen', name, phone: phone || null }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error during registration. Please try again.' });
  }
}

// 2. User Login
function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const passwordMatch = bcrypt.compareSync(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Prepare token payload
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name
    };

    // If officer, find officer designation and department
    let officerDetails = null;
    if (user.role === 'officer') {
      const officer = db.prepare(`
        SELECT o.id as officer_id, o.designation, d.id as department_id, d.name as department_name
        FROM officers o
        LEFT JOIN departments d ON o.department_id = d.id
        WHERE o.user_id = ?
      `).get(user.id);
      
      if (officer) {
        officerDetails = officer;
        payload.officerId = officer.officer_id;
        payload.departmentId = officer.department_id;
      }
    }

    // Create Audit Log for login
    db.prepare(`
      INSERT INTO audit_logs (user_id, action, entity_type, entity_id)
      VALUES (?, 'LOGIN', 'user', ?)
    `).run(user.id, user.id.toString());

    // Sign Token
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      message: 'Login successful!',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        officer: officerDetails
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login. Please try again.' });
  }
}

// 3. Get current session info (Me)
function getMe(req, res) {
  try {
    const user = db.prepare('SELECT id, email, name, role, phone, created_at FROM users WHERE id = ?').get(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User profile not found.' });
    }

    let officerDetails = null;
    if (user.role === 'officer') {
      const officer = db.prepare(`
        SELECT o.id as officer_id, o.designation, d.id as department_id, d.name as department_name
        FROM officers o
        LEFT JOIN departments d ON o.department_id = d.id
        WHERE o.user_id = ?
      `).get(user.id);
      
      if (officer) {
        officerDetails = officer;
      }
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        created_at: user.created_at,
        officer: officerDetails
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Server error fetching user profile.' });
  }
}

module.exports = {
  register,
  login,
  getMe
};
