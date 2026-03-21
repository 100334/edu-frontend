import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AcademicCapIcon, LockClosedIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import api from '../services/api';

// Theme constants matching Flutter
const DARK_BLUE = '#1A237E';
const AZURE = '#00B0FF';

export default function TeacherLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await api.post('/auth/teacher/login', {
        username: formData.username,
        password: formData.password
      });

      if (response.data.success) {
        await login(response.data.user, response.data.token);
        toast.success(`Welcome back, ${response.data.user.name || 'Teacher'}!`);
        navigate('/teacher/dashboard');
      } else {
        toast.error(response.data.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      
      if (error.response) {
        toast.error(error.response.data.message || 'Invalid credentials');
      } else if (error.request) {
        toast.error('Cannot reach server. Please try again.');
      } else {
        toast.error('An error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="min-h-screen flex">
        <div className="flex-1 overflow-auto px-6 py-4">
          <div className="max-w-[400px] mx-auto">
            {/* Back button to student login */}
            <button
              onClick={() => navigate('/learner/login')}
              className="mb-5 flex items-center text-[#1A237E] hover:text-[#00B0FF] transition-colors"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="text-sm">Student Login</span>
            </button>

            {/* Logo and Title */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-[90px] h-[90px] bg-white rounded-full shadow-lg mb-2">
                <UserGroupIcon className="w-10 h-10 text-[#1A237E]" />
              </div>
              <h1 className="text-xl font-bold text-[#1A237E] mt-2">
                TEACHER LOGIN
              </h1>
              <div className="w-10 h-1 bg-[#00B0FF] mx-auto mt-2"></div>
              <p className="text-xs text-gray-500 mt-3">
                Sign in to manage learners, reports & attendance
              </p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Username Field */}
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-blue-600 tracking-wider">
                  USERNAME
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-0 flex items-center pointer-events-none">
                    <UserGroupIcon className="w-4 h-4 text-[#1A237E]" />
                  </div>
                  <input
                    type="text"
                    placeholder="Enter your username"
                    value={formData.username}
                    onChange={(e) => {
                      setFormData({...formData, username: e.target.value});
                      if (errors.username) setErrors({...errors, username: null});
                    }}
                    className={`w-full pl-6 pr-4 py-3 bg-transparent border-b-2 text-[#1A237E] font-semibold text-base
                             placeholder-gray-400 focus:outline-none transition-colors
                             ${errors.username ? 'border-red-500' : 'border-[#1A237E] focus:border-[#00B0FF]'}`}
                  />
                </div>
                {errors.username && (
                  <p className="text-xs text-red-500 mt-1">{errors.username}</p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-blue-600 tracking-wider">
                  PASSWORD
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-0 flex items-center pointer-events-none">
                    <LockClosedIcon className="w-4 h-4 text-[#1A237E]" />
                  </div>
                  <input
                    type="password"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) => {
                      setFormData({...formData, password: e.target.value});
                      if (errors.password) setErrors({...errors, password: null});
                    }}
                    className={`w-full pl-6 pr-4 py-3 bg-transparent border-b-2 text-[#1A237E] font-semibold text-base
                             placeholder-gray-400 focus:outline-none transition-colors
                             ${errors.password ? 'border-red-500' : 'border-[#1A237E] focus:border-[#00B0FF]'}`}
                  />
                </div>
                {errors.password && (
                  <p className="text-xs text-red-500 mt-1">{errors.password}</p>
                )}
              </div>

              {/* Demo Credentials Hint */}
              <div className="bg-[#00B0FF]/5 rounded-lg p-3 border border-[#00B0FF]/20">
                <p className="text-xs text-gray-600">
                  <span className="font-semibold text-[#00B0FF]">Demo:</span> username{' '}
                  <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-gray-200">admin</span> · password{' '}
                  <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-gray-200">password123</span>
                </p>
              </div>

              {/* Login Button */}
              {loading ? (
                <div className="flex justify-center py-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#1A237E]"></div>
                </div>
              ) : (
                <button
                  type="submit"
                  className="w-full h-[55px] bg-[#1A237E] text-white font-bold tracking-wider text-base
                           hover:bg-[#00B0FF] transition-colors duration-300"
                  style={{ borderRadius: '6px' }}
                >
                  ACCESS DASHBOARD
                </button>
              )}
            </form>

            {/* Student Login Link */}
            <div className="mt-8 text-center">
              <p className="text-[10px] tracking-wider text-gray-400 font-bold mb-3">
                SECURE ACCESS FOR EDUCATORS ONLY
              </p>
              <div className="flex items-center justify-center gap-1">
                <span className="text-sm text-gray-500">Are you a student? </span>
                <button
                  onClick={() => navigate('/learner/login')}
                  className="text-sm font-bold text-[#00B0FF] hover:underline"
                >
                  Sign in here
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}