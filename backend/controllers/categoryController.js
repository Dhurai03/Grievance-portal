const { db } = require('../config/db');

// Get all categories with subcategories
function getAll(req, res) {
  try {
    const categories = db.prepare('SELECT * FROM categories ORDER BY name ASC').all();
    const subcategories = db.prepare(`
      SELECT s.*, d.name as department_name 
      FROM subcategories s
      LEFT JOIN departments d ON s.department_id = d.id
      ORDER BY s.name ASC
    `).all();

    const data = categories.map(cat => {
      return {
        ...cat,
        subcategories: subcategories.filter(sub => sub.category_id === cat.id)
      };
    });

    res.json(data);
  } catch (error) {
    console.error('Fetch categories error:', error);
    res.status(500).json({ error: 'Server error fetching categories.' });
  }
}

// Create category (Admin)
function createCategory(req, res) {
  const { name, description } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Category name is required.' });
  }

  try {
    const duplicate = db.prepare('SELECT id FROM categories WHERE name = ?').get(name);
    if (duplicate) {
      return res.status(400).json({ error: 'A category with this name already exists.' });
    }

    const result = db.prepare('INSERT INTO categories (name, description) VALUES (?, ?)').run(name, description || null);
    const catId = result.lastInsertRowid;

    // Audit Log
    db.prepare(`
      INSERT INTO audit_logs (user_id, action, entity_type, entity_id, metadata)
      VALUES (?, 'CREATE_CATEGORY', 'category', ?, ?)
    `).run(req.user.id, catId.toString(), JSON.stringify({ name }));

    res.status(211).json({
      message: 'Category created successfully!',
      category: { id: catId, name, description, subcategories: [] }
    });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ error: 'Server error creating category.' });
  }
}

// Create subcategory (Admin)
function createSubcategory(req, res) {
  const { categoryId } = req.params;
  const { name, departmentId, slaDays } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Subcategory name is required.' });
  }

  try {
    const category = db.prepare('SELECT id FROM categories WHERE id = ?').get(categoryId);
    if (!category) {
      return res.status(404).json({ error: 'Category not found.' });
    }

    // Check duplicate subcategory name inside this category
    const duplicate = db.prepare('SELECT id FROM subcategories WHERE category_id = ? AND name = ?').get(categoryId, name);
    if (duplicate) {
      return res.status(400).json({ error: 'A subcategory with this name already exists in this category.' });
    }

    const result = db.prepare(`
      INSERT INTO subcategories (category_id, name, department_id, sla_days)
      VALUES (?, ?, ?, ?)
    `).run(categoryId, name, departmentId || null, slaDays || 7);
    const subId = result.lastInsertRowid;

    // Audit Log
    db.prepare(`
      INSERT INTO audit_logs (user_id, action, entity_type, entity_id, metadata)
      VALUES (?, 'CREATE_SUBCATEGORY', 'subcategory', ?, ?)
    `).run(req.user.id, subId.toString(), JSON.stringify({ name, categoryId, departmentId, slaDays }));

    res.status(211).json({
      message: 'Subcategory created successfully!',
      subcategory: { id: subId, category_id: parseInt(categoryId), name, department_id: departmentId || null, sla_days: slaDays || 7 }
    });
  } catch (error) {
    console.error('Create subcategory error:', error);
    res.status(500).json({ error: 'Server error creating subcategory.' });
  }
}

// Update subcategory (Admin)
function updateSubcategory(req, res) {
  const { id } = req.params;
  const { name, departmentId, slaDays } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Subcategory name is required.' });
  }

  try {
    const sub = db.prepare('SELECT * FROM subcategories WHERE id = ?').get(id);
    if (!sub) {
      return res.status(404).json({ error: 'Subcategory not found.' });
    }

    // Check duplicate subcategory name
    const duplicate = db.prepare('SELECT id FROM subcategories WHERE category_id = ? AND name = ? AND id != ?')
      .get(sub.category_id, name, id);
    if (duplicate) {
      return res.status(400).json({ error: 'Another subcategory in this category already has this name.' });
    }

    db.prepare(`
      UPDATE subcategories 
      SET name = ?, department_id = ?, sla_days = ?
      WHERE id = ?
    `).run(name, departmentId || null, slaDays || 7, id);

    // Audit Log
    db.prepare(`
      INSERT INTO audit_logs (user_id, action, entity_type, entity_id, metadata)
      VALUES (?, 'UPDATE_SUBCATEGORY', 'subcategory', ?, ?)
    `).run(req.user.id, id.toString(), JSON.stringify({ name, departmentId, slaDays }));

    res.json({
      message: 'Subcategory updated successfully!',
      subcategory: { id: parseInt(id), category_id: sub.category_id, name, department_id: departmentId || null, sla_days: slaDays || 7 }
    });
  } catch (error) {
    console.error('Update subcategory error:', error);
    res.status(500).json({ error: 'Server error updating subcategory.' });
  }
}

// Delete subcategory (Admin)
function deleteSubcategory(req, res) {
  const { id } = req.params;

  try {
    const sub = db.prepare('SELECT name, category_id FROM subcategories WHERE id = ?').get(id);
    if (!sub) {
      return res.status(404).json({ error: 'Subcategory not found.' });
    }

    // Clear references on grievances
    db.prepare('UPDATE grievances SET subcategory_id = NULL WHERE subcategory_id = ?').run(id);

    // Delete
    db.prepare('DELETE FROM subcategories WHERE id = ?').run(id);

    // Audit Log
    db.prepare(`
      INSERT INTO audit_logs (user_id, action, entity_type, entity_id, metadata)
      VALUES (?, 'DELETE_SUBCATEGORY', 'subcategory', ?, ?)
    `).run(req.user.id, id.toString(), JSON.stringify({ name: sub.name }));

    res.json({ message: `Subcategory '${sub.name}' deleted successfully.` });
  } catch (error) {
    console.error('Delete subcategory error:', error);
    res.status(500).json({ error: 'Server error deleting subcategory.' });
  }
}

// Delete category (Admin)
function deleteCategory(req, res) {
  const { id } = req.params;

  try {
    const cat = db.prepare('SELECT name FROM categories WHERE id = ?').get(id);
    if (!cat) {
      return res.status(404).json({ error: 'Category not found.' });
    }

    // Subcategories in this category will be deleted by CASCADE constraint in SQLite schema
    // But we need to make sure we nullify references in grievances first!
    const subIds = db.prepare('SELECT id FROM subcategories WHERE category_id = ?').all().map(s => s.id);
    if (subIds.length > 0) {
      const placeholders = subIds.map(() => '?').join(',');
      db.prepare(`UPDATE grievances SET subcategory_id = NULL WHERE subcategory_id IN (${placeholders})`).run(...subIds);
    }

    // Delete category (cascades delete on subcategories)
    db.prepare('DELETE FROM categories WHERE id = ?').run(id);

    // Audit Log
    db.prepare(`
      INSERT INTO audit_logs (user_id, action, entity_type, entity_id, metadata)
      VALUES (?, 'DELETE_CATEGORY', 'category', ?, ?)
    `).run(req.user.id, id.toString(), JSON.stringify({ name: cat.name }));

    res.json({ message: `Category '${cat.name}' and all its subcategories deleted successfully.` });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ error: 'Server error deleting category.' });
  }
}

module.exports = {
  getAll,
  createCategory,
  createSubcategory,
  updateSubcategory,
  deleteSubcategory,
  deleteCategory
};
