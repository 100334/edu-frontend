import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored user data
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    console.log('🔍 AuthProvider init - token exists:', !!token);
    console.log('🔍 AuthProvider init - userData exists:', !!userData);
    
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        console.log('📦 Parsed user from storage:', parsedUser);
        console.log('📦 User role:', parsedUser.role);
        
        // Set user based on role
        setUser({
          id: parsedUser.id,
          name: parsedUser.name,
          email: parsedUser.email,
          role: parsedUser.role, // 'admin', 'teacher', or 'learner'
          reg: parsedUser.reg || parsedUser.reg_number,
          reg_number: parsedUser.reg_number || parsedUser.reg,
          form: parsedUser.form || parsedUser.grade,
          grade: parsedUser.grade,
          is_active: parsedUser.is_active
        });
        
        // Set default axios header
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        console.log('✅ Auth initialized, user role:', parsedUser.role);
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.clear();
      }
    } else {
      console.log('⚠️ No stored auth data found');
    }
    setLoading(false);
  }, []);

  // Generic login function for any role
  const login = async (userData, token) => {
    try {
      console.log('🔐 Logging in user:', userData);
      console.log('🔐 User role:', userData.role);
      
      // Save to localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Set axios header
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Update state
      setUser(userData);
      
      console.log('✅ Login successful, user role:', userData.role);
      
      return { success: true, user: userData };
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Login failed' 
      };
    }
  };

  // Teacher login - FIXED to ensure role is set
  const teacherLogin = async (credentials) => {
    try {
      console.log('👨‍🏫 Teacher login attempt:', credentials.username);
      
      const response = await api.post('/api/auth/teacher/login', credentials);
      
      console.log('📥 Teacher login response:', response.data);
      
      if (response.data.success) {
        // Make sure role is explicitly set to 'teacher'
        const userData = {
          id: response.data.user?.id,
          name: response.data.user?.name,
          email: response.data.user?.email,
          role: 'teacher', // Force role to teacher
          reg: response.data.user?.reg,
          reg_number: response.data.user?.reg_number,
          form: response.data.user?.form
        };
        
        console.log('📦 Teacher user data to store:', userData);
        
        return await login(userData, response.data.token);
      }
      
      return { success: false, message: response.data.message };
    } catch (error) {
      console.error('❌ Teacher login error:', error);
      console.error('Error response:', error.response?.data);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Login failed' 
      };
    }
  };

  // Learner login
  const learnerLogin = async (credentials) => {
    try {
      console.log('🎓 Learner login attempt:', credentials.name);
      
      const response = await api.post('/api/auth/learner/login', credentials);
      
      console.log('📥 Learner login response:', response.data);
      
      if (response.data.success) {
        const userData = {
          id: response.data.user?.id,
          name: response.data.user?.name,
          email: response.data.user?.email,
          role: 'learner', // Force role to learner
          reg: response.data.user?.reg,
          reg_number: response.data.user?.reg_number,
          form: response.data.user?.form
        };
        
        return await login(userData, response.data.token);
      }
      
      return { success: false, message: response.data.message };
    } catch (error) {
      console.error('❌ Learner login error:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Login failed' 
      };
    }
  };

  // Admin login
  const adminLogin = async (credentials) => {
    try {
      console.log('👑 Admin login attempt:', credentials.email);
      
      const response = await api.post('/api/auth/admin/login', credentials);
      
      console.log('📥 Admin login response:', response.data);
      
      if (response.data.success) {
        const userData = {
          id: response.data.user?.id,
          name: response.data.user?.name,
          email: response.data.user?.email,
          role: 'admin', // Force role to admin
          is_active: response.data.user?.is_active !== undefined ? response.data.user.is_active : true
        };
        
        return await login(userData, response.data.token);
      }
      
      return { success: false, message: response.data.message || 'Login failed' };
    } catch (error) {
      console.error('❌ Admin login error:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Login failed' 
      };
    }
  };

  const logout = () => {
    console.log('🚪 Logging out');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    teacherLogin,
    learnerLogin,
    adminLogin,
    logout,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};