import React, { createContext, useState, useContext, useEffect, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';

const AuthContext = createContext();

// Auto-logout after this many milliseconds of inactivity (no clicks/keypresses/scroll).
const IDLE_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

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
    
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        
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
          phone: parsedUser.phone,
          is_active: parsedUser.is_active
        });
        
        // Set default axios header
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
} catch (error) {
localStorage.clear();
      }
    } else {
}
    setLoading(false);
  }, []);

  // Generic login function for any role
  const login = async (userData, token) => {
    try {
      
      // Save to localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Set axios header
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Update state
      setUser(userData);
return { success: true, user: userData };
    } catch (error) {
return { 
        success: false, 
        message: error.response?.data?.message || 'Login failed' 
      };
    }
  };

  // Teacher login - FIXED to ensure role is set
  const teacherLogin = async (credentials) => {
    try {
const response = await api.post('/api/auth/teacher/login', credentials);
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
return await login(userData, response.data.token);
      }
      
      return { success: false, message: response.data.message };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Login failed' 
      };
    }
  };

  // Learner login
  const learnerLogin = async (credentials) => {
    try {
const response = await api.post('/api/auth/learner/login', credentials);
if (response.data.success) {
        const u = response.data.user;
        const userData = {
          id: u?.id,
          name: u?.name,
          email: u?.email,
          role: 'learner', // Force role to learner
          reg: u?.reg,
          reg_number: u?.reg_number,
          form: u?.form || u?.grade,
          grade: u?.grade,
          phone: u?.phone,
        };
        
        return await login(userData, response.data.token);
      }
      
      return { success: false, message: response.data.message };
    } catch (error) {
return { 
        success: false, 
        message: error.response?.data?.message || 'Login failed' 
      };
    }
  };

  // Admin login
  const adminLogin = async (credentials) => {
    try {
const response = await api.post('/api/auth/admin/login', credentials);
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
return { 
        success: false, 
        message: error.response?.data?.message || 'Login failed' 
      };
    }
  };

  const logout = () => {
localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
  };

  // ── Auto-logout on inactivity ────────────────────────────────────────────
  const idleTimerRef = useRef(null);
  const userRef = useRef(user);
  userRef.current = user;

  const handleIdleLogout = useCallback(() => {
    if (!userRef.current) return;
    logout();
    toast.error('You were logged out due to inactivity.', { duration: 5000, icon: '⏰' });
    window.location.href = '/';
  }, []);

  const resetIdleTimer = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    if (!userRef.current) return;
    idleTimerRef.current = setTimeout(handleIdleLogout, IDLE_TIMEOUT_MS);
  }, [handleIdleLogout]);

  useEffect(() => {
    if (!user) {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      return;
    }

    const activityEvents = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    activityEvents.forEach((event) => window.addEventListener(event, resetIdleTimer));
    resetIdleTimer();

    return () => {
      activityEvents.forEach((event) => window.removeEventListener(event, resetIdleTimer));
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [user, resetIdleTimer]);

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