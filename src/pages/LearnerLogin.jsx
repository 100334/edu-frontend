import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AcademicCapIcon, IdentificationIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import api from '../services/api';

// Theme constants matching Flutter
const DARK_BLUE = '#1A237E';
const AZURE = '#00B0FF';

export default function LearnerLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ 
    name: '', 
    regNumber: '' 
  });
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Load saved credentials on mount
  useEffect(() => {
    const savedName = localStorage.getItem('learner_rem_name');
    const savedRegNumber = localStorage.getItem('learner_rem_reg');
    
    if (savedName && savedRegNumber) {
      setFormData({
        name: savedName,
        regNumber: savedRegNumber
      });
      setRememberMe(true);
    }
  }, []);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required';
    }
    
    if (!formData.regNumber.trim()) {
      newErrors.regNumber = 'Registration number is required';
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
      console.log('Sending:', {
        name: formData.name,
        regNumber: formData.regNumber.toUpperCase()
      });

      const response = await api.post('/auth/learner/login', {
        name: formData.name,
        regNumber: formData.regNumber.toUpperCase()
      });

      if (response.data.success) {
        // Handle Remember Me
        if (rememberMe) {
          localStorage.setItem('learner_rem_name', formData.name);
          localStorage.setItem('learner_rem_reg', formData.regNumber.toUpperCase());
        } else {
          localStorage.removeItem('learner_rem_name');
          localStorage.removeItem('learner_rem_reg');
        }

        await login(response.data.user, response.data.token);
        toast.success(`Welcome back, ${response.data.user.name?.split(' ')[0] || 'Student'}!`);
        navigate('/learner/dashboard');
      } else {
        toast.error(response.data.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      
      if (error.response) {
        // Show validation errors if available
        if (error.response.data.errors) {
          const validationErrors = error.response.data.errors;
          // Set field-specific errors
          const fieldErrors = {};
          validationErrors.forEach(err => {
            if (err.field === 'name') fieldErrors.name = err.message;
            if (err.field === 'regNumber') fieldErrors.regNumber = err.message;
          });
          setErrors(fieldErrors);
          
          // Show first error as toast
          toast.error(validationErrors[0]?.message || 'Validation failed');
        } else {
          toast.error(error.response.data.message || 'Login failed');
        }
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
            {/* Back button to teacher login - FIXED PATH */}
            <button
              onClick={() => navigate('/teacher/login')}
              className="mb-5 flex items-center text-[#1A237E] hover:text-[#00B0FF] transition-colors"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="text-sm">Teacher Login</span>
            </button>

            {/* Logo and Title */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-[90px] h-[90px] bg-white rounded-full shadow-lg mb-2">
                <AcademicCapIcon className="w-10 h-10 text-[#1A237E]" />
              </div>
              <h1 className="text-xl font-bold text-[#1A237E] mt-2">
                STUDENT LOGIN
              </h1>
              <div className="w-10 h-1 bg-[#00B0FF] mx-auto mt-2"></div>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name Field */}
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-blue-600 tracking-wider">
                  FULL NAME
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-0 flex items-center pointer-events-none">
                    <svg className="w-4 h-4 text-[#1A237E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({...formData, name: e.target.value});
                      if (errors.name) setErrors({...errors, name: null});
                    }}
                    className={`w-full pl-6 pr-4 py-3 bg-transparent border-b-2 text-[#1A237E] font-semibold text-base
                             placeholder-gray-400 focus:outline-none transition-colors
                             ${errors.name ? 'border-red-500' : 'border-[#1A237E] focus:border-[#00B0FF]'}`}
                  />
                </div>
                {errors.name && (
                  <p className="text-xs text-red-500 mt-1">{errors.name}</p>
                )}
              </div>

              {/* Registration Number Field */}
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-blue-600 tracking-wider">
                  REGISTRATION NUMBER
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-0 flex items-center pointer-events-none">
                    <IdentificationIcon className="w-4 h-4 text-[#1A237E]" />
                  </div>
                  <input
                    type="text"
                    placeholder="EDU-2024-0001"
                    value={formData.regNumber}
                    onChange={(e) => {
                      setFormData({...formData, regNumber: e.target.value.toUpperCase()});
                      if (errors.regNumber) setErrors({...errors, regNumber: null});
                    }}
                    className={`w-full pl-6 pr-4 py-3 bg-transparent border-b-2 text-[#1A237E] font-semibold text-base
                             placeholder-gray-400 focus:outline-none transition-colors uppercase
                             ${errors.regNumber ? 'border-red-500' : 'border-[#1A237E] focus:border-[#00B0FF]'}`}
                  />
                </div>
                {errors.regNumber && (
                  <p className="text-xs text-red-500 mt-1">{errors.regNumber}</p>
                )}
              </div>

              {/* Remember Me */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="rememberMe"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-[#00B0FF] border-gray-300 rounded focus:ring-[#00B0FF]"
                />
                <label htmlFor="rememberMe" className="ml-2 text-sm text-blue-600">
                  Remember me
                </label>
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
                  LOGIN
                </button>
              )}
            </form>

            {/* Footer - FIXED PATH */}
            <div className="mt-8 text-center">
              <p className="text-[10px] tracking-wider text-gray-400 font-bold mb-3">
                STUDENT ACCESS ONLY
              </p>
              <div className="flex items-center justify-center gap-1">
                <span className="text-sm text-gray-500">Are you a teacher? </span>
                <button
                  onClick={() => navigate('/teacher/login')}
                  className="text-sm font-bold text-[#00B0FF] hover:underline"
                >
                  Login here
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}