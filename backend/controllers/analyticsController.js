const { db } = require('../config/db');

// 1. Admin Dashboard Analytics
function getAdminAnalytics(req, res) {
  try {
    const totalCount = db.prepare('SELECT COUNT(*) as count FROM grievances').get().count;
    
    if (totalCount === 0) {
      return res.json({
        metrics: { total: 0, pending: 0, resolved: 0, closed: 0, resolutionRate: 0, avgResolutionDays: 0, slaCompliance: 100, escalated: 0 },
        trends: [],
        categories: [],
        departments: [],
        geographic: []
      });
    }

    // Pending vs Resolved
    const pendingCount = db.prepare(`
      SELECT COUNT(*) as count FROM grievances 
      WHERE status NOT IN ('RESOLVED', 'CLOSED', 'REJECTED')
    `).get().count;

    const resolvedCount = db.prepare(`
      SELECT COUNT(*) as count FROM grievances 
      WHERE status IN ('RESOLVED', 'CLOSED')
    `).get().count;

    const closedCount = db.prepare("SELECT COUNT(*) as count FROM grievances WHERE status = 'CLOSED'").get().count;
    const escalatedCount = db.prepare("SELECT COUNT(*) as count FROM grievances WHERE status = 'ESCALATED'").get().count;

    const resolutionRate = totalCount > 0 ? Math.round((resolvedCount / totalCount) * 100) : 0;

    // Average Resolution Time (in days)
    // We calculate from created_at to the date status first changed to RESOLVED
    const avgRes = db.prepare(`
      SELECT AVG(julianday(updated_at) - julianday(created_at)) as avg_days 
      FROM grievances 
      WHERE status IN ('RESOLVED', 'CLOSED')
    `).get();
    
    const avgResolutionDays = avgRes.avg_days ? Math.round(avgRes.avg_days * 10) / 10 : 0;

    // SLA Compliance: resolved cases resolved before SLA deadline
    const slaResolvedCount = db.prepare(`
      SELECT COUNT(*) as count FROM grievances 
      WHERE status IN ('RESOLVED', 'CLOSED') AND updated_at <= sla_deadline
    `).get().count;
    const slaCompliance = resolvedCount > 0 ? Math.round((slaResolvedCount / resolvedCount) * 100) : 100;

    // Trends: monthly submissions count (last 6 months)
    const trends = db.prepare(`
      SELECT strftime('%Y-%m', created_at) as month, COUNT(*) as count 
      FROM grievances 
      GROUP BY month 
      ORDER BY month DESC 
      LIMIT 6
    `).all().reverse();

    // Categories Distribution
    const categories = db.prepare(`
      SELECT c.name, COUNT(g.id) as count 
      FROM grievances g
      JOIN subcategories s ON g.subcategory_id = s.id
      JOIN categories c ON s.category_id = c.id
      GROUP BY c.id
    `).all();

    // Department Performance
    const departments = db.prepare(`
      SELECT 
        d.id,
        d.name,
        COUNT(g.id) as total,
        SUM(CASE WHEN g.status IN ('RESOLVED', 'CLOSED') THEN 1 ELSE 0 END) as resolved,
        SUM(CASE WHEN g.status NOT IN ('RESOLVED', 'CLOSED', 'REJECTED') THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN g.status NOT IN ('RESOLVED', 'CLOSED') AND g.sla_deadline < CURRENT_TIMESTAMP THEN 1 ELSE 0 END) as breached,
        SUM(CASE WHEN g.status IN ('RESOLVED', 'CLOSED') AND g.updated_at <= g.sla_deadline THEN 1 ELSE 0 END) as compliant_resolved
      FROM departments d
      LEFT JOIN grievances g ON d.id = g.department_id
      GROUP BY d.id
      ORDER BY total DESC
    `).all().map(dept => {
      const compliantResolved = dept.compliant_resolved || 0;
      const resolved = dept.resolved || 0;
      const slaPercentage = resolved > 0 ? Math.round((compliantResolved / resolved) * 100) : 100;
      return {
        id: dept.id,
        name: dept.name,
        total: dept.total || 0,
        resolved: dept.resolved || 0,
        pending: dept.pending || 0,
        breached: dept.breached || 0,
        slaPercentage
      };
    });

    // Geographic analysis
    const geographic = db.prepare(`
      SELECT district, city, COUNT(*) as count 
      FROM grievances 
      WHERE district IS NOT NULL AND district != ''
      GROUP BY district, city
      ORDER BY count DESC
    `).all();

    res.json({
      metrics: {
        total: totalCount,
        pending: pendingCount,
        resolved: resolvedCount,
        closed: closedCount,
        resolutionRate,
        avgResolutionDays,
        slaCompliance,
        escalated: escalatedCount
      },
      trends,
      categories,
      departments,
      geographic
    });
  } catch (error) {
    console.error('Fetch admin analytics error:', error);
    res.status(500).json({ error: 'Server error compiling dashboard analytics.' });
  }
}

// 2. Department Officer Stats
function getOfficerStats(req, res) {
  try {
    // Find officer department and id
    const officer = db.prepare('SELECT id, department_id FROM officers WHERE user_id = ?').get(req.user.id);
    if (!officer) {
      return res.status(404).json({ error: 'Officer profile details not found.' });
    }

    const { id: officerId, department_id: departmentId } = officer;

    // Assigned to Me
    const assignedCount = db.prepare('SELECT COUNT(*) as count FROM grievances WHERE assigned_officer_id = ?').get(officerId).count;
    
    // Pending assigned
    const pendingCount = db.prepare(`
      SELECT COUNT(*) as count FROM grievances 
      WHERE assigned_officer_id = ? AND status NOT IN ('RESOLVED', 'CLOSED', 'REJECTED')
    `).get(officerId).count;

    // In Progress assigned
    const progressCount = db.prepare(`
      SELECT COUNT(*) as count FROM grievances 
      WHERE assigned_officer_id = ? AND status = 'IN PROGRESS'
    `).get(officerId).count;

    // Resolved assigned
    const resolvedCount = db.prepare(`
      SELECT COUNT(*) as count FROM grievances 
      WHERE assigned_officer_id = ? AND status IN ('RESOLVED', 'CLOSED')
    `).get(officerId).count;

    // SLA Breached assigned
    const breachedCount = db.prepare(`
      SELECT COUNT(*) as count FROM grievances 
      WHERE assigned_officer_id = ? AND status NOT IN ('RESOLVED', 'CLOSED', 'REJECTED') AND sla_deadline < CURRENT_TIMESTAMP
    `).get(officerId).count;

    // Due Soon (Pending assigned with less than 24 hours remaining)
    const dueSoonCount = db.prepare(`
      SELECT COUNT(*) as count FROM grievances 
      WHERE assigned_officer_id = ? 
        AND status NOT IN ('RESOLVED', 'CLOSED', 'REJECTED') 
        AND sla_deadline >= CURRENT_TIMESTAMP
        AND (julianday(sla_deadline) - julianday(CURRENT_TIMESTAMP)) <= 1.0
    `).get(officerId).count;

    // Department Stats (to show in officer dashboard sidebar)
    const deptTotal = db.prepare('SELECT COUNT(*) as count FROM grievances WHERE department_id = ?').get(departmentId).count;
    const deptUnassigned = db.prepare('SELECT COUNT(*) as count FROM grievances WHERE department_id = ? AND assigned_officer_id IS NULL').get(departmentId).count;
    const deptResolved = db.prepare("SELECT COUNT(*) as count FROM grievances WHERE department_id = ? AND status IN ('RESOLVED', 'CLOSED')").get(departmentId).count;

    res.json({
      officer: {
        assigned: assignedCount,
        pending: pendingCount,
        inProgress: progressCount,
        resolved: resolvedCount,
        breached: breachedCount,
        dueSoon: dueSoonCount
      },
      department: {
        total: deptTotal,
        unassigned: deptUnassigned,
        resolved: deptResolved
      }
    });
  } catch (error) {
    console.error('Fetch officer stats error:', error);
    res.status(500).json({ error: 'Server error compiling officer statistics.' });
  }
}

// 3. Citizen Stats
function getCitizenStats(req, res) {
  try {
    const total = db.prepare('SELECT COUNT(*) as count FROM grievances WHERE citizen_id = ?').get(req.user.id).count;
    
    const pending = db.prepare(`
      SELECT COUNT(*) as count FROM grievances 
      WHERE citizen_id = ? AND status NOT IN ('RESOLVED', 'CLOSED', 'REJECTED')
    `).get(req.user.id).count;

    const inProgress = db.prepare(`
      SELECT COUNT(*) as count FROM grievances 
      WHERE citizen_id = ? AND status = 'IN PROGRESS'
    `).get(req.user.id).count;

    const resolved = db.prepare(`
      SELECT COUNT(*) as count FROM grievances 
      WHERE citizen_id = ? AND status IN ('RESOLVED', 'CLOSED')
    `).get(req.user.id).count;

    const closed = db.prepare(`
      SELECT COUNT(*) as count FROM grievances 
      WHERE citizen_id = ? AND status = 'CLOSED'
    `).get(req.user.id).count;

    res.json({
      total,
      pending,
      inProgress,
      resolved,
      closed
    });
  } catch (error) {
    console.error('Fetch citizen stats error:', error);
    res.status(500).json({ error: 'Server error compiling citizen statistics.' });
  }
}

module.exports = {
  getAdminAnalytics,
  getOfficerStats,
  getCitizenStats
};
