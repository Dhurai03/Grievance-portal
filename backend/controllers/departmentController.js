const { db } = require('../config/db');

// Get all departments
function getAll(req, res) {
  try {
    const departments = db.prepare(`
      SELECT d.*, COUNT(o.id) as officer_count 
      FROM departments d
      LEFT JOIN officers o ON d.id = o.department_id
      GROUP BY d.id
      ORDER BY d.name ASC
    `).all();

    res.json(departments);
  } catch (error) {
    console.error('Fetch departments error:', error);
    res.status(500).json({ error: 'Server error fetching departments.' });
  }
}

// Create department (Admin only)
function create(req, res) {
  const { name, description, contact_email, contact_phone } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Department name is required.' });
  }

  try {
    // Check duplication
    const duplicate = db.prepare('SELECT id FROM departments WHERE name = ?').get(name);
    if (duplicate) {
      return res.status(400).json({ error: 'A department with this name already exists.' });
    }

    const insertStmt = db.prepare(`
      INSERT INTO departments (name, description, contact_email, contact_phone, status)
      VALUES (?, ?, ?, ?, 'active')
    `);
    const result = insertStmt.run(name, description || null, contact_email || null, contact_phone || null);

    const deptId = result.lastInsertRowid;

    // Create Audit Log
    db.prepare(`
      INSERT INTO audit_logs (user_id, action, entity_type, entity_id, metadata)
      VALUES (?, 'CREATE_DEPARTMENT', 'department', ?, ?)
    `).run(req.user.id, deptId.toString(), JSON.stringify({ name, description }));

    res.status(211).json({
      message: 'Department created successfully!',
      department: { id: deptId, name, description, contact_email, contact_phone, status: 'active' }
    });
  } catch (error) {
    console.error('Create department error:', error);
    res.status(500).json({ error: 'Server error creating department.' });
  }
}

// Update department (Admin only)
function update(req, res) {
  const { id } = req.params;
  const { name, description, contact_email, contact_phone, status } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Department name is required.' });
  }

  try {
    const department = db.prepare('SELECT id FROM departments WHERE id = ?').get(id);
    if (!department) {
      return res.status(404).json({ error: 'Department not found.' });
    }

    // Check duplicate name
    const duplicate = db.prepare('SELECT id FROM departments WHERE name = ? AND id != ?').get(name, id);
    if (duplicate) {
      return res.status(400).json({ error: 'Another department with this name already exists.' });
    }

    db.prepare(`
      UPDATE departments 
      SET name = ?, description = ?, contact_email = ?, contact_phone = ?, status = ?
      WHERE id = ?
    `).run(name, description || null, contact_email || null, contact_phone || null, status || 'active', id);

    // Create Audit Log
    db.prepare(`
      INSERT INTO audit_logs (user_id, action, entity_type, entity_id, metadata)
      VALUES (?, 'UPDATE_DEPARTMENT', 'department', ?, ?)
    `).run(req.user.id, id.toString(), JSON.stringify({ name, status }));

    res.json({
      message: 'Department updated successfully!',
      department: { id: parseInt(id), name, description, contact_email, contact_phone, status }
    });
  } catch (error) {
    console.error('Update department error:', error);
    res.status(500).json({ error: 'Server error updating department.' });
  }
}

// Delete department (Admin only)
function remove(req, res) {
  const { id } = req.params;

  try {
    const department = db.prepare('SELECT name FROM departments WHERE id = ?').get(id);
    if (!department) {
      return res.status(404).json({ error: 'Department not found.' });
    }

    // Clean references on subcategories and officers
    db.prepare('UPDATE subcategories SET department_id = NULL WHERE department_id = ?').run(id);
    db.prepare('UPDATE officers SET department_id = NULL WHERE department_id = ?').run(id);
    db.prepare('UPDATE grievances SET department_id = NULL, assigned_officer_id = NULL WHERE department_id = ?').run(id);

    // Delete department
    db.prepare('DELETE FROM departments WHERE id = ?').run(id);

    // Create Audit Log
    db.prepare(`
      INSERT INTO audit_logs (user_id, action, entity_type, entity_id, metadata)
      VALUES (?, 'DELETE_DEPARTMENT', 'department', ?, ?)
    `).run(req.user.id, id.toString(), JSON.stringify({ name: department.name }));

    res.json({ message: `Department '${department.name}' deleted successfully.` });
  } catch (error) {
    console.error('Delete department error:', error);
    res.status(500).json({ error: 'Server error deleting department.' });
  }
}

module.exports = {
  getAll,
  create,
  update,
  remove
};
