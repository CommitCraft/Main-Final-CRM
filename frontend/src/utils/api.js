import axios from 'axios';
import Cookies from 'js-cookie';

// API Base configuration
const API_BASE_URL = import.meta.env.VITE_API_URL;

// Create axios instance with default config
export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    // Try localStorage first, then cookies as fallback
    const localToken = localStorage.getItem('cmscrm-token');
    const cookieToken = Cookies.get('cmscrm-token');
    const authToken = localToken || cookieToken;
    
    if (authToken) {
      config.headers.Authorization = `Bearer ${authToken}`;
      console.log(`API Request to ${config.url} with token:`, authToken.substring(0, 20) + '...');
    } else {
      console.log(`API Request to ${config.url} without token`);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// API endpoints
export const endpoints = {
  // Auth
  auth: {
    login: '/auth/login',
    logout: '/auth/logout',
    profile: '/auth/profile',
    verify: '/auth/verify',
    changePassword: '/auth/change-password',
    loginHistory: '/auth/login-history'
  },
  
  // Users
  users: {
    list: '/users',
    create: '/users',
    get: (id) => `/users/${id}`,
    update: (id) => `/users/${id}`,
    delete: (id) => `/users/${id}`,
    roles: (id) => `/users/${id}/roles`,
    pages: (id) => `/users/${id}/pages`,
    assignRole: '/users/assign-role',
    removeRole: '/users/remove-role'
  },
  
  // Roles
  roles: {
    list: '/roles',
    simple: '/roles/simple',
    create: '/roles',
    get: (id) => `/roles/${id}`,
    update: (id) => `/roles/${id}`,
    delete: (id) => `/roles/${id}`,
    pages: (id) => `/roles/${id}/pages`,
    pageHierarchy: (id) => `/roles/${id}/page-hierarchy`,
    pageOrder: (id) => `/roles/${id}/page-order`,
    updatePageOrder: (id) => `/roles/${id}/page-order`,
    assignPages: '/roles/assign-pages'
  },
  
  // Pages
  pages: {
    list: '/pages',
    simple: '/pages/simple',
    myPages: '/pages/my-pages',
    create: '/pages',
    get: (id) => `/pages/${id}`,
    update: (id) => `/pages/${id}`,
    delete: (id) => `/pages/${id}`,
    access: (pageUrl) => `/pages/access/${pageUrl}`
  },
  
  // Statistics
  stats: {
    dashboard: '/stats/dashboard',
    activity: '/stats/activity',
    login: '/stats/login',
    api: '/stats/api',
    health: '/stats/health',
    recentActivity: '/stats/recent-activity',
    activeUsers: '/stats/active-users'
  },
  
  // Export
  exports: {
    users: '/exports/users',
    roles: '/exports/roles',
    pages: '/exports/pages',
    activityLogs: '/exports/activity-logs',
    loginActivities: '/exports/login-activities',
    download: (filename) => `/exports/download/${filename}`
  },
  
  // System monitoring
  system: {
    performance: '/system/performance',
    info: '/system/info',
    processes: '/system/processes',
    status: '/system/status',
    health: '/system/health'
  }
};

// API service functions
export const apiService = {
  // Generic CRUD operations
  get: (url, params = {}) => api.get(url, { params }),
  post: (url, data = {}) => api.post(url, data),
  put: (url, data = {}) => api.put(url, data),
  delete: (url) => api.delete(url),
  
  // File upload
  upload: (url, formData) => api.post(url, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  
  // Download file
  download: async (url, filename) => {
    const response = await api.get(url, { responseType: 'blob' });
    const blob = new Blob([response.data]);
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  }
};

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle common errors
    if (error.code === 'ECONNABORTED') {
      console.error('Request timeout');
    } else if (error.response) {
      // Server responded with error status
      console.error('API Error:', error.response.data);
      
      // Don't handle 401 here - let the AuthContext handle it to prevent loops
      if (error.response.status === 401) {
        console.log('Authentication error - handled by AuthContext');
      }
    } else if (error.request) {
      // Network error
      console.error('Network Error:', error.request);
    }
    return Promise.reject(error);
  }
);

export default api;