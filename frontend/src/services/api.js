const API_BASE = '/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

const handleResponse = async (res) => {
  const data = await res.json().catch(() => ({ error: 'Invalid server response' }));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
};

const api = {
  // Auth
  register: (data) => fetch(`${API_BASE}/auth/register`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
  }).then(handleResponse),

  login: (data) => fetch(`${API_BASE}/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
  }).then(handleResponse),

  getMe: () => fetch(`${API_BASE}/auth/me`, { headers: getAuthHeaders() }).then(handleResponse),

  updateProfile: (data) => fetch(`${API_BASE}/auth/profile`, {
    method: 'PATCH', headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }, body: JSON.stringify(data)
  }).then(handleResponse),

  changePassword: (data) => fetch(`${API_BASE}/auth/change-password`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }, body: JSON.stringify(data)
  }).then(handleResponse),

  // Grievances
  submitGrievance: (formData) => fetch(`${API_BASE}/grievances`, {
    method: 'POST', headers: { ...getAuthHeaders() }, body: formData
  }).then(handleResponse),

  getGrievances: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return fetch(`${API_BASE}/grievances?${qs}`, { headers: getAuthHeaders() }).then(handleResponse);
  },

  getGrievanceById: (id) => fetch(`${API_BASE}/grievances/${id}`, { headers: getAuthHeaders() }).then(handleResponse),

  trackGrievance: (trackingId) => fetch(`${API_BASE}/grievances/track/${trackingId}`).then(handleResponse),

  updateStatus: (id, data) => fetch(`${API_BASE}/grievances/${id}/status`, {
    method: 'PATCH', headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }, body: JSON.stringify(data)
  }).then(handleResponse),

  addComment: (id, data) => fetch(`${API_BASE}/grievances/${id}/comments`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }, body: JSON.stringify(data)
  }).then(handleResponse),

  submitFeedback: (id, data) => fetch(`${API_BASE}/grievances/${id}/feedback`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }, body: JSON.stringify(data)
  }).then(handleResponse),

  assignGrievance: (id, data) => fetch(`${API_BASE}/grievances/${id}/assign`, {
    method: 'PATCH', headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }, body: JSON.stringify(data)
  }).then(handleResponse),

  aiClassify: (text) => fetch(`${API_BASE}/grievances/ai-classify`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }, body: JSON.stringify({ text })
  }).then(handleResponse),

  // Departments
  getDepartments: () => fetch(`${API_BASE}/departments`, { headers: getAuthHeaders() }).then(handleResponse),
  createDepartment: (data) => fetch(`${API_BASE}/departments`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }, body: JSON.stringify(data)
  }).then(handleResponse),

  // Notifications
  getNotifications: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return fetch(`${API_BASE}/notifications?${qs}`, { headers: getAuthHeaders() }).then(handleResponse);
  },
  markNotificationRead: (id) => fetch(`${API_BASE}/notifications/${id}/read`, {
    method: 'PATCH', headers: getAuthHeaders()
  }).then(handleResponse),
  markAllNotificationsRead: () => fetch(`${API_BASE}/notifications/mark-all-read`, {
    method: 'PATCH', headers: getAuthHeaders()
  }).then(handleResponse),

  // Analytics (admin/dean)
  getAnalyticsOverview: () => fetch(`${API_BASE}/analytics/overview`, { headers: getAuthHeaders() }).then(handleResponse),
  getAnalyticsByDept: () => fetch(`${API_BASE}/analytics/by-department`, { headers: getAuthHeaders() }).then(handleResponse),
  getAnalyticsByPriority: () => fetch(`${API_BASE}/analytics/by-priority`, { headers: getAuthHeaders() }).then(handleResponse),
  getAnalyticsByCategory: () => fetch(`${API_BASE}/analytics/by-category`, { headers: getAuthHeaders() }).then(handleResponse),
  getMonthlyTrend: () => fetch(`${API_BASE}/analytics/monthly-trend`, { headers: getAuthHeaders() }).then(handleResponse),
  getAuditLogs: () => fetch(`${API_BASE}/analytics/audit-logs`, { headers: getAuthHeaders() }).then(handleResponse),
  getUsers: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return fetch(`${API_BASE}/analytics/users?${qs}`, { headers: getAuthHeaders() }).then(handleResponse);
  },
  updateUserRole: (id, data) => fetch(`${API_BASE}/analytics/users/${id}/role`, {
    method: 'PATCH', headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }, body: JSON.stringify(data)
  }).then(handleResponse),
};

export default api;
