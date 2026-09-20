const API_BASE_URL = 'http://localhost:5000/api';

// Helper to make API requests
async function request(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  
  const headers = {
    ...options.headers,
  };

  // If body is not FormData, add JSON Content-Type
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      // Return detailed API error if present, fallback to statusText
      throw new Error(data.error || response.statusText || 'Something went wrong.');
    }

    return data;
  } catch (error) {
    console.error(`API Request Error [${endpoint}]:`, error);
    throw error;
  }
}

const api = {
  // Authentication
  auth: {
    register: (data) => request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
    login: (data) => request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
    me: () => request('/auth/me', { method: 'GET' }),
  },

  // Grievances
  grievances: {
    list: (filters = {}) => {
      const queryParams = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
          queryParams.append(key, filters[key]);
        }
      });
      const queryString = queryParams.toString();
      return request(`/grievances${queryString ? `?${queryString}` : ''}`, { method: 'GET' });
    },
    get: (id) => request(`/grievances/${id}`, { method: 'GET' }),
    submit: (data) => request('/grievances', { method: 'POST', body: JSON.stringify(data) }),
    updateStatus: (id, status, remarks) => request(`/grievances/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, remarks })
    }),
    addComment: (id, comment, isInternal = false) => request(`/grievances/${id}/comments`, {
      method: 'POST',
      body: JSON.stringify({ comment, isInternal })
    }),
    assign: (id, departmentId, officerId) => request(`/grievances/${id}/assign`, {
      method: 'POST',
      body: JSON.stringify({ departmentId, officerId })
    }),
    escalate: (id, reason) => request(`/grievances/${id}/escalate`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    }),
    submitFeedback: (id, rating, comments) => request(`/grievances/${id}/feedback`, {
      method: 'POST',
      body: JSON.stringify({ rating, comments })
    }),
    uploadAttachments: (id, formData) => request(`/grievances/${id}/attachments`, {
      method: 'POST',
      body: formData // Body is FormData
    }),
  },

  // Departments CRUD
  departments: {
    list: () => request('/departments', { method: 'GET' }),
    create: (data) => request('/departments', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/departments/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => request(`/departments/${id}`, { method: 'DELETE' }),
  },

  // Category & Subcategory CRUD
  categories: {
    list: () => request('/categories', { method: 'GET' }),
    create: (data) => request('/categories', { method: 'POST', body: JSON.stringify(data) }),
    delete: (id) => request(`/categories/${id}`, { method: 'DELETE' }),
    createSubcategory: (catId, data) => request(`/categories/${catId}/subcategories`, { method: 'POST', body: JSON.stringify(data) }),
    updateSubcategory: (subId, data) => request(`/categories/subcategories/${subId}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteSubcategory: (subId) => request(`/categories/subcategories/${subId}`, { method: 'DELETE' }),
  },

  // Notifications
  notifications: {
    list: () => request('/notifications', { method: 'GET' }),
    markRead: (id) => request(`/notifications/${id}/read`, { method: 'PATCH' }),
  },

  // Analytics
  analytics: {
    admin: () => request('/analytics/admin', { method: 'GET' }),
    officer: () => request('/analytics/officer', { method: 'GET' }),
    citizen: () => request('/analytics/citizen', { method: 'GET' }),
  },

  // AI Assistant Suggestions
  ai: {
    classify: (description) => request('/ai/classify', {
      method: 'POST',
      body: JSON.stringify({ description })
    }),
    chat: (message, history = []) => request('/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message, history })
    }),
  },

  // Admin User Management
  users: {
    list: () => request('/admin/users', { method: 'GET' }),
    updateRole: (id, data) => request(`/admin/users/${id}/role`, { method: 'PATCH', body: JSON.stringify(data) }),
  }
};

export default api;
export { API_BASE_URL };
