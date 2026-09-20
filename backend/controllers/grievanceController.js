const { db } = require('../config/db');

// 1. Submit a Grievance
function submit(req, res) {
  const { title, description, subcategoryId, priority, address, city, district, state, pincode, latitude, longitude, isPrivate } = req.body;

  if (!title || !description || !subcategoryId || !priority) {
    return res.status(400).json({ error: 'Title, description, subcategory, and priority are required.' });
  }

  try {
    // Generate Unique Grievance ID: GRV-YYYY-XXXXXX
    const currentYear = new Date().getFullYear();
    const yearPattern = `GRV-${currentYear}-%`;
    const countRow = db.prepare('SELECT COUNT(*) as count FROM grievances WHERE id LIKE ?').get(yearPattern);
    const sequenceNum = (countRow.count + 1).toString().padStart(6, '0');
    const grievanceId = `GRV-${currentYear}-${sequenceNum}`;

    // Get subcategory details to find responsible department and SLA days
    const subcat = db.prepare('SELECT department_id, sla_days FROM subcategories WHERE id = ?').get(subcategoryId);
    
    if (!subcat) {
      return res.status(400).json({ error: 'Selected subcategory is invalid.' });
    }

    const departmentId = subcat.department_id;
    const slaDays = subcat.sla_days || 7;
    
    // Calculate SLA Deadline
    const now = new Date();
    const slaDeadline = new Date(now.getTime() + slaDays * 24 * 60 * 60 * 1000).toISOString();
    const createdAt = now.toISOString();

    // Insert Grievance
    const insertStmt = db.prepare(`
      INSERT INTO grievances (
        id, title, description, citizen_id, subcategory_id, department_id, 
        priority, status, address, city, district, state, pincode, 
        latitude, longitude, is_private, sla_deadline, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'SUBMITTED', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertStmt.run(
      grievanceId,
      title,
      description,
      req.user.id,
      subcategoryId,
      departmentId || null,
      priority,
      address || null,
      city || null,
      district || null,
      state || null,
      pincode || null,
      latitude ? parseFloat(latitude) : null,
      longitude ? parseFloat(longitude) : null,
      isPrivate ? 1 : 0,
      slaDeadline,
      createdAt,
      createdAt
    );

    // Write initial history record
    db.prepare(`
      INSERT INTO grievance_history (grievance_id, previous_status, new_status, changed_by, remarks, timestamp)
      VALUES (?, NULL, 'SUBMITTED', ?, 'Grievance submitted by citizen.', ?)
    `).run(grievanceId, req.user.id, createdAt);

    // Log action
    db.prepare(`
      INSERT INTO audit_logs (user_id, action, entity_type, entity_id, metadata)
      VALUES (?, 'CREATE_GRIEVANCE', 'grievance', ?, ?)
    `).run(req.user.id, grievanceId, JSON.stringify({ title, departmentId }));

    // Send notifications to admins
    const admins = db.prepare("SELECT id FROM users WHERE role = 'admin'").all();
    const insertNotif = db.prepare(`
      INSERT INTO notifications (user_id, grievance_id, message)
      VALUES (?, ?, ?)
    `);
    
    admins.forEach(admin => {
      insertNotif.run(admin.id, grievanceId, `New grievance ${grievanceId} submitted: "${title}"`);
    });

    res.status(211).json({
      message: 'Grievance submitted successfully!',
      grievanceId,
      expectedResolution: new Date(slaDeadline).toLocaleDateString(),
      departmentId
    });
  } catch (error) {
    console.error('Submit grievance error:', error);
    res.status(500).json({ error: 'Server error submitting grievance.' });
  }
}

// 2. List Grievances
function list(req, res) {
  const { status, priority, categoryId, departmentId, search, isBreached } = req.query;

  try {
    let query = `
      SELECT g.*, 
             s.name as subcategory_name, 
             c.name as category_name, 
             d.name as department_name, 
             u.name as citizen_name,
             o_u.name as officer_name
      FROM grievances g
      LEFT JOIN subcategories s ON g.subcategory_id = s.id
      LEFT JOIN categories c ON s.category_id = c.id
      LEFT JOIN departments d ON g.department_id = d.id
      LEFT JOIN users u ON g.citizen_id = u.id
      LEFT JOIN officers o ON g.assigned_officer_id = o.id
      LEFT JOIN users o_u ON o.user_id = o_u.id
      WHERE 1=1
    `;
    const params = [];

    // Role-based Access Filters
    if (req.user.role === 'citizen') {
      query += ' AND g.citizen_id = ?';
      params.push(req.user.id);
    } else if (req.user.role === 'officer') {
      // Officers see their assigned grievances OR any unassigned grievances in their department
      const officer = db.prepare('SELECT id, department_id FROM officers WHERE user_id = ?').get(req.user.id);
      if (officer) {
        query += ' AND (g.assigned_officer_id = ? OR (g.department_id = ? AND g.assigned_officer_id IS NULL))';
        params.push(officer.id, officer.department_id);
      } else {
        return res.status(403).json({ error: 'Unauthorized officer profile.' });
      }
    } // Admins see all

    // Search filter
    if (search) {
      query += ' AND (g.id LIKE ? OR g.title LIKE ? OR g.city LIKE ? OR g.district LIKE ? OR s.name LIKE ?)';
      const searchWildcard = `%${search}%`;
      params.push(searchWildcard, searchWildcard, searchWildcard, searchWildcard, searchWildcard);
    }

    // Explicit Filter options
    if (status) {
      query += ' AND g.status = ?';
      params.push(status);
    }
    if (priority) {
      query += ' AND g.priority = ?';
      params.push(priority);
    }
    if (departmentId) {
      query += ' AND g.department_id = ?';
      params.push(parseInt(departmentId));
    }
    if (categoryId) {
      query += ' AND s.category_id = ?';
      params.push(parseInt(categoryId));
    }
    if (isBreached === 'true') {
      query += " AND g.status NOT IN ('RESOLVED', 'CLOSED', 'REJECTED') AND g.sla_deadline < CURRENT_TIMESTAMP";
    }

    query += ' ORDER BY g.created_at DESC';

    const grievances = db.prepare(query).all(...params);
    res.json(grievances);
  } catch (error) {
    console.error('List grievances error:', error);
    res.status(500).json({ error: 'Server error listing grievances.' });
  }
}

// 3. Get Grievance Details
function getById(req, res) {
  const { id } = req.params;

  try {
    const grievance = db.prepare(`
      SELECT g.*, 
             s.name as subcategory_name, 
             c.name as category_name, 
             d.name as department_name, 
             d.contact_email as department_email,
             d.contact_phone as department_phone,
             u.name as citizen_name,
             u.email as citizen_email,
             u.phone as citizen_phone,
             o_u.name as officer_name,
             o.designation as officer_designation
      FROM grievances g
      LEFT JOIN subcategories s ON g.subcategory_id = s.id
      LEFT JOIN categories c ON s.category_id = c.id
      LEFT JOIN departments d ON g.department_id = d.id
      LEFT JOIN users u ON g.citizen_id = u.id
      LEFT JOIN officers o ON g.assigned_officer_id = o.id
      LEFT JOIN users o_u ON o.user_id = o_u.id
      WHERE g.id = ?
    `).get(id);

    if (!grievance) {
      return res.status(404).json({ error: 'Grievance not found.' });
    }

    // Role-based visibility check
    if (req.user.role === 'citizen' && grievance.citizen_id !== req.user.id) {
      return res.status(403).json({ error: 'Access Denied: This is not your grievance record.' });
    }

    // Hide citizen contact info if private toggle is on and requesting user is NOT officer/admin
    if (grievance.is_private === 1 && req.user.role === 'citizen' && grievance.citizen_id !== req.user.id) {
      grievance.citizen_email = '[PRIVATE]';
      grievance.citizen_phone = '[PRIVATE]';
    }

    // Fetch History Timeline
    const history = db.prepare(`
      SELECT h.*, u.name as changed_by_name, u.role as changed_by_role 
      FROM grievance_history h
      LEFT JOIN users u ON h.changed_by = u.id
      WHERE h.grievance_id = ?
      ORDER BY h.timestamp ASC
    `).all(id);

    // Fetch Comments (exclude internal ones if user is citizen)
    let commentQuery = `
      SELECT c.*, u.name as user_name, u.role as user_role 
      FROM grievance_comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.grievance_id = ?
    `;
    const commentParams = [id];

    if (req.user.role === 'citizen') {
      commentQuery += ' AND c.is_internal = 0';
    }
    commentQuery += ' ORDER BY c.created_at ASC';
    const comments = db.prepare(commentQuery).all(...commentParams);

    // Fetch Attachments
    const attachments = db.prepare('SELECT * FROM attachments WHERE grievance_id = ?').all(id);

    // Fetch Feedback
    const feedback = db.prepare('SELECT * FROM feedback WHERE grievance_id = ?').get(id);

    res.json({
      grievance,
      history,
      comments,
      attachments,
      feedback: feedback || null
    });
  } catch (error) {
    console.error('Fetch grievance details error:', error);
    res.status(500).json({ error: 'Server error retrieving grievance details.' });
  }
}

// 4. Update Status (with history logging & citizen notifications)
function updateStatus(req, res) {
  const { id } = req.params;
  const { status, remarks } = req.body;

  if (!status) {
    return res.status(400).json({ error: 'New status value is required.' });
  }

  try {
    const grievance = db.prepare('SELECT id, status, citizen_id, title FROM grievances WHERE id = ?').get(id);
    if (!grievance) {
      return res.status(404).json({ error: 'Grievance not found.' });
    }

    // Access control for status changes
    // Citizens can reopen resolved or close tickets
    if (req.user.role === 'citizen') {
      if (grievance.citizen_id !== req.user.id) {
        return res.status(403).json({ error: 'Unauthorized operation.' });
      }
      if (!['REOPENED', 'CLOSED'].includes(status)) {
        return res.status(400).json({ error: 'Citizens are only allowed to reopen or close their grievances.' });
      }
    }

    const updatedAt = new Date().toISOString();

    db.prepare(`
      UPDATE grievances 
      SET status = ?, updated_at = ? 
      WHERE id = ?
    `).run(status, updatedAt, id);

    // Write to history
    db.prepare(`
      INSERT INTO grievance_history (grievance_id, previous_status, new_status, changed_by, remarks, timestamp)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, grievance.status, status, req.user.id, remarks || `Status updated to ${status}.`, updatedAt);

    // Audit Log
    db.prepare(`
      INSERT INTO audit_logs (user_id, action, entity_type, entity_id, metadata)
      VALUES (?, 'UPDATE_STATUS', 'grievance', ?, ?)
    `).run(req.user.id, id, JSON.stringify({ from: grievance.status, to: status, remarks }));

    // Notify citizen if changed by officer/admin
    if (req.user.id !== grievance.citizen_id) {
      db.prepare(`
        INSERT INTO notifications (user_id, grievance_id, message)
        VALUES (?, ?, ?)
      `).run(
        grievance.citizen_id, 
        id, 
        `Your grievance ${id} status has been updated to ${status} by ${req.user.name}. Remarks: "${remarks || 'None'}"`
      );
    }

    res.json({ message: `Status updated successfully to ${status}.` });
  } catch (error) {
    console.error('Update grievance status error:', error);
    res.status(500).json({ error: 'Server error updating status.' });
  }
}

// 5. Add Comment
function addComment(req, res) {
  const { id } = req.params;
  const { comment, isInternal } = req.body;

  if (!comment) {
    return res.status(400).json({ error: 'Comment text is required.' });
  }

  try {
    const grievance = db.prepare('SELECT id, citizen_id, assigned_officer_id, title FROM grievances WHERE id = ?').get(id);
    if (!grievance) {
      return res.status(404).json({ error: 'Grievance not found.' });
    }

    // Validate internal comment rights (officers/admins only)
    let internalVal = 0;
    if (isInternal && req.user.role !== 'citizen') {
      internalVal = 1;
    }

    const result = db.prepare(`
      INSERT INTO grievance_comments (grievance_id, user_id, comment, is_internal)
      VALUES (?, ?, ?, ?)
    `).run(id, req.user.id, comment, internalVal);

    // Notify appropriate parties
    if (req.user.role === 'citizen') {
      // Notify assigned officer, or department head if unassigned
      if (grievance.assigned_officer_id) {
        const officerUser = db.prepare('SELECT user_id FROM officers WHERE id = ?').get(grievance.assigned_officer_id);
        if (officerUser) {
          db.prepare(`
            INSERT INTO notifications (user_id, grievance_id, message)
            VALUES (?, ?, ?)
          `).run(officerUser.user_id, id, `New citizen reply on ${id}: "${comment.substring(0, 40)}..."`);
        }
      }
    } else if (internalVal === 0) {
      // Public reply from official: Notify citizen
      db.prepare(`
        INSERT INTO notifications (user_id, grievance_id, message)
        VALUES (?, ?, ?)
      `).run(grievance.citizen_id, id, `Official comment added on ${id} by ${req.user.name}: "${comment.substring(0, 40)}..."`);
    }

    res.status(211).json({
      message: 'Comment posted successfully!',
      comment: {
        id: result.lastInsertRowid,
        grievance_id: id,
        user_id: req.user.id,
        comment,
        is_internal: internalVal,
        user_name: req.user.name,
        user_role: req.user.role,
        created_at: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ error: 'Server error posting comment.' });
  }
}

// 6. Assign Grievance (Admin or Department Officer with rights)
function assign(req, res) {
  const { id } = req.params;
  const { departmentId, officerId } = req.body;

  try {
    const grievance = db.prepare('SELECT id, status, department_id, assigned_officer_id FROM grievances WHERE id = ?').get(id);
    if (!grievance) {
      return res.status(404).json({ error: 'Grievance not found.' });
    }

    // Role check: Only admin can reassign across departments. 
    // Officers can only assign/reassign within their own department if they are supervisors.
    if (req.user.role !== 'admin') {
      const officer = db.prepare('SELECT department_id FROM officers WHERE user_id = ?').get(req.user.id);
      if (!officer || officer.department_id !== grievance.department_id) {
        return res.status(403).json({ error: 'Permission denied: Cannot reassign tickets outside your department.' });
      }
    }

    let nextStatus = grievance.status;
    let remarks = '';
    
    // Auto shift status to ASSIGNED/ACKNOWLEDGED if relevant
    if (['SUBMITTED', 'ACKNOWLEDGED'].includes(grievance.status)) {
      nextStatus = 'ASSIGNED';
    }

    const updatedAt = new Date().toISOString();

    // Update DB
    if (departmentId && officerId) {
      db.prepare(`
        UPDATE grievances 
        SET department_id = ?, assigned_officer_id = ?, status = ?, updated_at = ? 
        WHERE id = ?
      `).run(departmentId, officerId, nextStatus, updatedAt, id);

      const deptName = db.prepare('SELECT name FROM departments WHERE id = ?').get(departmentId).name;
      const officerName = db.prepare('SELECT name FROM users u JOIN officers o ON u.id = o.user_id WHERE o.id = ?').get(officerId).name;
      remarks = `Routed to Department: ${deptName}. Assigned to Officer: ${officerName}.`;

      // Notify officer
      const officerUser = db.prepare('SELECT user_id FROM officers WHERE id = ?').get(officerId);
      db.prepare(`
        INSERT INTO notifications (user_id, grievance_id, message)
        VALUES (?, ?, ?)
      `).run(officerUser.user_id, id, `Grievance ${id} has been assigned to you.`);

    } else if (departmentId) {
      db.prepare(`
        UPDATE grievances 
        SET department_id = ?, assigned_officer_id = NULL, status = ?, updated_at = ? 
        WHERE id = ?
      `).run(departmentId, nextStatus, updatedAt, id);

      const deptName = db.prepare('SELECT name FROM departments WHERE id = ?').get(departmentId).name;
      remarks = `Routed to Department: ${deptName}. Officer assignment pending.`;
    }

    // Write history
    db.prepare(`
      INSERT INTO grievance_history (grievance_id, previous_status, new_status, changed_by, remarks, timestamp)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, grievance.status, nextStatus, req.user.id, remarks, updatedAt);

    // Audit Log
    db.prepare(`
      INSERT INTO audit_logs (user_id, action, entity_type, entity_id, metadata)
      VALUES (?, 'ASSIGN_GRIEVANCE', 'grievance', ?, ?)
    `).run(req.user.id, id, JSON.stringify({ departmentId, officerId, remarks }));

    res.json({ message: 'Grievance assigned/routed successfully.', status: nextStatus });
  } catch (error) {
    console.error('Assign grievance error:', error);
    res.status(500).json({ error: 'Server error routing grievance.' });
  }
}

// 7. Escalate Grievance (Officer or system trigger)
function escalate(req, res) {
  const { id } = req.params;
  const { reason } = req.body;

  if (!reason) {
    return res.status(400).json({ error: 'Escalation reason is required.' });
  }

  try {
    const grievance = db.prepare('SELECT id, status, assigned_officer_id, department_id FROM grievances WHERE id = ?').get(id);
    if (!grievance) {
      return res.status(404).json({ error: 'Grievance not found.' });
    }

    const updatedAt = new Date().toISOString();

    // Update status to ESCALATED
    db.prepare(`
      UPDATE grievances 
      SET status = 'ESCALATED', updated_at = ? 
      WHERE id = ?
    `).run(updatedAt, id);

    // Log escalation record
    db.prepare(`
      INSERT INTO escalations (grievance_id, escalated_from_officer_id, reason)
      VALUES (?, ?, ?)
    `).run(id, grievance.assigned_officer_id || null, reason);

    // Write history
    db.prepare(`
      INSERT INTO grievance_history (grievance_id, previous_status, new_status, changed_by, remarks, timestamp)
      VALUES (?, ?, 'ESCALATED', ?, ?, ?)
    `).run(id, grievance.status, req.user.id, `Escalated: ${reason}`, updatedAt);

    // Audit Log
    db.prepare(`
      INSERT INTO audit_logs (user_id, action, entity_type, entity_id, metadata)
      VALUES (?, 'ESCALATE_GRIEVANCE', 'grievance', ?, ?)
    `).run(req.user.id, id, JSON.stringify({ reason }));

    // Notify Admins
    const admins = db.prepare("SELECT id FROM users WHERE role = 'admin'").all();
    const insertNotif = db.prepare(`
      INSERT INTO notifications (user_id, grievance_id, message)
      VALUES (?, ?, ?)
    `);
    admins.forEach(admin => {
      insertNotif.run(admin.id, id, `CRITICAL: Grievance ${id} has been escalated: "${reason}"`);
    });

    res.json({ message: 'Grievance escalated successfully.' });
  } catch (error) {
    console.error('Escalate grievance error:', error);
    res.status(500).json({ error: 'Server error escalating grievance.' });
  }
}

// 8. Submit Feedback/Rating (Citizen only)
function submitFeedback(req, res) {
  const { id } = req.params;
  const { rating, comments } = req.body;

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Rating must be an integer between 1 and 5.' });
  }

  try {
    const grievance = db.prepare('SELECT id, status, citizen_id FROM grievances WHERE id = ?').get(id);
    if (!grievance) {
      return res.status(404).json({ error: 'Grievance not found.' });
    }

    if (grievance.citizen_id !== req.user.id) {
      return res.status(403).json({ error: 'Access Denied: Feedback can only be submitted by the filing citizen.' });
    }

    if (grievance.status !== 'RESOLVED') {
      return res.status(400).json({ error: 'Feedback can only be submitted on RESOLVED grievances.' });
    }

    // Insert feedback
    db.prepare(`
      INSERT INTO feedback (grievance_id, rating, comments)
      VALUES (?, ?, ?)
    `).run(id, rating, comments || null);

    const updatedAt = new Date().toISOString();

    // Auto-close grievance upon receiving feedback
    db.prepare(`
      UPDATE grievances 
      SET status = 'CLOSED', updated_at = ? 
      WHERE id = ?
    `).run(updatedAt, id);

    // Log history
    db.prepare(`
      INSERT INTO grievance_history (grievance_id, previous_status, new_status, changed_by, remarks, timestamp)
      VALUES (?, 'RESOLVED', 'CLOSED', ?, ?, ?)
    `).run(id, req.user.id, `Citizen rated resolution: ${rating} Stars. Ticket Closed.`, updatedAt);

    // Audit Log
    db.prepare(`
      INSERT INTO audit_logs (user_id, action, entity_type, entity_id, metadata)
      VALUES (?, 'SUBMIT_FEEDBACK', 'grievance', ?, ?)
    `).run(req.user.id, id, JSON.stringify({ rating }));

    res.json({ message: 'Feedback submitted and grievance closed.' });
  } catch (error) {
    console.error('Submit feedback error:', error);
    res.status(500).json({ error: 'Server error saving feedback.' });
  }
}

// 9. Upload Attachments
function uploadAttachments(req, res) {
  const { id } = req.params;

  try {
    const grievance = db.prepare('SELECT id, citizen_id FROM grievances WHERE id = ?').get(id);
    if (!grievance) {
      return res.status(404).json({ error: 'Grievance not found.' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded.' });
    }

    const insertAttachment = db.prepare(`
      INSERT INTO attachments (grievance_id, file_name, file_path, file_type, file_size)
      VALUES (?, ?, ?, ?, ?)
    `);

    const saved = [];
    req.files.forEach(file => {
      // Store relative path for frontend rendering
      const filePath = `/uploads/${file.filename}`;
      const result = insertAttachment.run(id, file.originalname, filePath, file.mimetype, file.size);
      
      saved.push({
        id: result.lastInsertRowid,
        file_name: file.originalname,
        file_path: filePath,
        file_type: file.mimetype,
        file_size: file.size
      });
    });

    // Audit log
    db.prepare(`
      INSERT INTO audit_logs (user_id, action, entity_type, entity_id, metadata)
      VALUES (?, 'UPLOAD_ATTACHMENT', 'grievance', ?, ?)
    `).run(req.user.id, id, JSON.stringify({ count: req.files.length }));

    res.json({
      message: 'Files uploaded successfully.',
      attachments: saved
    });
  } catch (error) {
    console.error('Upload attachments error:', error);
    res.status(500).json({ error: 'Server error saving attachments.' });
  }
}

module.exports = {
  submit,
  list,
  getById,
  updateStatus,
  addComment,
  assign,
  escalate,
  submitFeedback,
  uploadAttachments
};
