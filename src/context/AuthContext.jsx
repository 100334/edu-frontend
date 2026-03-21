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
    const userType = localStorage.getItem('userType');
    const userData = localStorage.getItem(userType === 'teacher' ? 'teacherData' : 'learnerData');
    
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser({
          ...parsedUser,
          role: userType,
          id: parsedUser.id,
          name: parsedUser.name,
          email: parsedUser.email,
          reg: parsedUser.reg || parsedUser.reg_number,
          form: parsedUser.form || parsedUser.grade, // Support both old and new
          grade: parsedUser.grade // Keep for backward compatibility
        });
        // Set default axios header
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.clear();
      }
    }
    setLoading(false);
  }, []);

  const login = async (credentials, role) => {
    try {
      const endpoint = role === 'teacher' 
        ? '/api/auth/teacher/login' 
        : '/api/auth/learner/login';
      
      const response = await api.post(endpoint, credentials);
      
      if (response.data.success) {
        const userData = {
          id: response.data[role]?.id,
          name: response.data[role]?.name,
          email: response.data[role]?.email,
          reg: response.data[role]?.reg,
          reg_number: response.data[role]?.reg,
          form: response.data[role]?.form || response.data[role]?.grade, // Use form if available, fallback to grade
          grade: response.data[role]?.grade, // Keep for backward compatibility
          role: role,
          ...response.data[role]
        };
        
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('userType', role);
        localStorage.setItem(role === 'teacher' ? 'teacherData' : 'learnerData', JSON.stringify(userData));
        
        if (response.data.refreshToken) {
          localStorage.setItem('refreshToken', response.data.refreshToken);
        }
        
        api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
        setUser(userData);
        
        return { success: true, user: userData };
      }
      
      return { success: false, message: response.data.message };
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Login failed' 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userType');
    localStorage.removeItem('teacherData');
    localStorage.removeItem('learnerData');
    localStorage.removeItem('refreshToken');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};