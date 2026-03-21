import axios from 'axios';
import toast from 'react-hot-toast';

// ============================================
// API Configuration - FIXED: No double /api
// ============================================

const SERVER_URL = process.env.REACT_APP_API_URL || 'https://eduportal-backend-vctg.onrender.com';

// IMPORTANT: Do NOT add /api here because your routes already include it
// Your backend has routes like /api/teacher/learners, so base URL should be just the server URL
const API_URL = SERVER_URL;

console.log('🔧 API Configuration:');
console.log('   Server URL:', SERVER_URL);
console.log('   API URL:', API_URL);
console.log('   Note: Routes will be called with /api prefix (e.g., /api/auth/login)');

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: false,
  timeout: 60000, // Increased timeout for Render cold starts
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    console.log(`🚀 ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log(`✅ ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`);
    return response;
  },
  async (error) => {
    const fullUrl = `${error.config?.baseURL}${error.config?.url}`;
    
    console.error('❌ API Error Details:', {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      url: fullUrl,
      method: error.config?.method?.toUpperCase()
    });

    // Handle network errors
    if (error.message === 'Network Error') {
      console.error('🌐 Network Error - Cannot reach server');
      toast.error('Cannot connect to server. The server may be waking up from sleep. Please try again in a moment.', {
        duration: 6000,
        icon: '🔄'
      });
      return Promise.reject(error);
    }

    // Handle timeouts (Render cold start)
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      console.error('⏱️ Timeout - Server may be waking up from cold start');
      toast.error('Server is waking up (cold start). Please wait 10-15 seconds and try again.', { 
        id: 'timeout',
        duration: 8000,
        icon: '⏳'
      });
      return Promise.reject(error);
    }

    // Handle 404 - Endpoint not found
    if (error.response?.status === 404) {
      console.error(`❌ 404 - Endpoint not found: ${fullUrl}`);
      
      // Check if it's a double /api issue
      if (fullUrl.includes('/api/api/')) {
        console.error('⚠️ Detected double /api in URL! Check your API calls.');
        toast.error('API configuration error: Double /api in URL. Please check your API service configuration.', {
          duration: 5000,
          icon: '🔧'
        });
      } else {
        toast.error(`API endpoint not found: ${error.config?.url}`, { duration: 3000 });
      }
    }

    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true;
      localStorage.clear();
      toast.error('Session expired. Please login again.');
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/')) {
        setTimeout(() => window.location.href = '/', 1500);
      }
    }

    // Handle other errors
    if (error.response?.status === 403) {
      toast.error('You do not have permission to perform this action.');
    } else if (error.response?.status === 422) {
      toast.error(error.response?.data?.message || 'Validation error');
    } else if (error.response?.status === 429) {
      toast.error('Too many requests. Please wait a moment.');
    } else if (error.response?.status >= 500) {
      toast.error('Server error. Please try again later.');
    } else if (error.response?.data?.message) {
      toast.error(error.response.data.message);
    }

    return Promise.reject(error);
  }
);

// ============================================
// Helper functions to test server connection
// ============================================

export const testServerConnection = async () => {
  console.log('Testing server connection...');
  console.log('Testing:', `${SERVER_URL}/health`);
  
  const results = [];
  
  // Test root health endpoint
  try {
    const response = await axios.get(`${SERVER_URL}/health`, { timeout: 10000 });
    results.push({ 
      name: 'Server Health', 
      url: `${SERVER_URL}/health`,
      success: true, 
      status: response.status,
      data: response.data
    });
    console.log('✅ Server health check passed');
  } catch (error) {
    results.push({ 
      name: 'Server Health', 
      url: `${SERVER_URL}/health`,
      success: false, 
      error: error.message 
    });
    console.log('❌ Server health check failed:', error.message);
  }
  
  // Test API endpoint
  try {
    const response = await axios.get(`${SERVER_URL}/api/test`, { timeout: 10000 });
    results.push({ 
      name: 'API Test', 
      url: `${SERVER_URL}/api/test`,
      success: true, 
      status: response.status,
      data: response.data
    });
    console.log('✅ API test endpoint works');
  } catch (error) {
    results.push({ 
      name: 'API Test', 
      url: `${SERVER_URL}/api/test`,
      success: false, 
      error: error.message 
    });
    console.log('❌ API test endpoint failed:', error.message);
  }
  
  return results;
};

export const testConnection = async () => {
  try {
    console.log('Testing connection to API:', `${SERVER_URL}/api/test`);
    const response = await api.get('/api/test', { timeout: 10000 });
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Test connection failed:', error.message);
    return { success: false, error: error.message, code: error.code };
  }
};

export const checkHealth = async () => {
  try {
    console.log('Checking server health at:', `${SERVER_URL}/health`);
    const response = await axios.get(`${SERVER_URL}/health`, { timeout: 10000 });
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Health check failed:', error.message);
    return { success: false, error: error.message, code: error.code };
  }
};

export const checkServerStatus = async (retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`Health check attempt ${i + 1}/${retries}`);
      const result = await checkHealth();
      if (result.success) {
        return { status: 'online', ...result };
      }
    } catch (error) {
      console.log(`Health check attempt ${i + 1} failed`);
    }
    if (i < retries - 1) {
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
  return { status: 'offline', success: false };
};

export const diagnoseConnection = async () => {
  console.log('=== API CONNECTION DIAGNOSIS ===');
  console.log('Server URL:', SERVER_URL);
  
  const results = await testServerConnection();
  
  console.log('\n=== RESULTS ===');
  results.forEach(r => {
    console.log(`${r.success ? '✅' : '❌'} ${r.name}: ${r.success ? `Status ${r.status}` : r.error}`);
    if (r.success && r.data) {
      console.log(`   Response:`, r.data);
    }
  });
  
  const serverOnline = results.find(r => r.name === 'Server Health' && r.success);
  const apiWorking = results.find(r => r.name === 'API Test' && r.success);
  
  if (serverOnline && apiWorking) {
    console.log('\n🎯 Server is online and API is working!');
    return { success: true, serverOnline: true, apiWorking: true };
  } else if (serverOnline && !apiWorking) {
    console.log('\n⚠️ Server is online but API endpoints are not responding. Check your backend routes.');
    return { success: false, serverOnline: true, apiWorking: false };
  } else {
    console.log('\n❌ Server is not reachable. Make sure your backend is deployed and running.');
    return { success: false, serverOnline: false, apiWorking: false };
  }
};

// ============================================
// Auth API Methods - Routes include /api prefix
// ============================================

export const authAPI = {
  teacherLogin: (credentials) => api.post('/api/auth/teacher/login', credentials),
  learnerLogin: (credentials) => api.post('/api/auth/learner/login', credentials),
  logout: () => api.post('/api/auth/logout'),
  refreshToken: (refreshToken) => api.post('/api/auth/refresh', { refreshToken }),
  verifyToken: () => api.get('/api/auth/verify'),
};

// ============================================
// Teacher API Methods
// ============================================

export const teacherAPI = {
  getLearners: () => api.get('/api/teacher/learners'),
  addLearner: (data) => api.post('/api/teacher/learners', data),
  updateLearner: (id, data) => api.put(`/api/teacher/learners/${id}`, data),
  deleteLearner: (id) => api.delete(`/api/teacher/learners/${id}`),
  getReports: () => api.get('/api/teacher/reports'),
  createReport: (data) => api.post('/api/teacher/reports', data),
  deleteReport: (id) => api.delete(`/api/teacher/reports/${id}`),
  getAttendance: () => api.get('/api/teacher/attendance'),
  recordAttendance: (data) => api.post('/api/teacher/attendance', data),
  getDashboardStats: () => api.get('/api/teacher/dashboard/stats'),
};

// ============================================
// Learner API Methods
// ============================================

export const learnerAPI = {
  getProfile: () => api.get('/api/learner/profile'),
  getReportCards: () => api.get('/api/learner/reports'),
  getAttendance: () => api.get('/api/learner/attendance'),
  getDashboardStats: () => api.get('/api/learner/dashboard/stats'),
};

// Export the API instance and helper functions
export { api };
export default api;