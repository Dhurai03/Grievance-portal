const Department = require('../models/Department');
const { COLLEGE_RULES } = require('../services/aiClassifier');

// Get all categories with subcategories
exports.getAll = async (req, res) => {
  try {
    const departments = await Department.find({ isActive: true }).select('name code');
    const deptMap = {};
    departments.forEach(d => { deptMap[d.name] = d; });

    // Group rules by category
    const catMap = {};
    for (const rule of COLLEGE_RULES) {
      if (!catMap[rule.category]) {
        catMap[rule.category] = {
          name: rule.category,
          departmentName: rule.department,
          departmentCode: rule.departmentCode,
          subcategories: []
        };
      }
      catMap[rule.category].subcategories.push({
        name: rule.subcategory,
        department: rule.department,
        departmentCode: rule.departmentCode,
        priority: rule.priority
      });
    }

    const categories = Object.values(catMap);
    res.json({ categories });
  } catch (error) {
    console.error('Fetch categories error:', error);
    res.status(500).json({ error: 'Server error fetching categories.' });
  }
};

// Create category (Admin placeholder)
exports.createCategory = async (req, res) => {
  res.status(200).json({ message: 'Category management synced with departments.' });
};

// Delete category (Admin placeholder)
exports.deleteCategory = async (req, res) => {
  res.status(200).json({ message: 'Category deleted.' });
};

// Subcategories
exports.createSubcategory = async (req, res) => {
  res.status(200).json({ message: 'Subcategory added.' });
};

exports.updateSubcategory = async (req, res) => {
  res.status(200).json({ message: 'Subcategory updated.' });
};

exports.deleteSubcategory = async (req, res) => {
  res.status(200).json({ message: 'Subcategory removed.' });
};
