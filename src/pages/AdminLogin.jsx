import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheckIcon, LockClosedIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import api from '../services/api';

export default function AdminLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
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
      // Mock admin login - in production, this would call your API
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (formData.email === 'admin@eduportal.com' && formData.password === 'admin123') {
        const mockUser = {
          id: 1,
          email: formData.email,
          name: 'System Administrator',
          role: 'admin',
          permissions: {
            manageTeachers: true,
            manageLearners: true,
            manageClasses: true,
            manageSubjects: true,
            systemSettings: true
          }
        };
        const mockToken = 'admin-mock-token-' + Date.now();
        
        await login(mockUser, mockToken);
        toast.success('Welcome, Administrator! 🔐', {
          icon: '👑',
          duration: 4000
        });
        navigate('/admin/dashboard');
      } else {
        toast.error('Invalid admin credentials. Please try again.', {
          icon: '❌'
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('An error occurred during login. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoCredentials = () => {
    setFormData({
      email: 'admin@eduportal.com',
      password: 'admin123'
    });
    setErrors({});
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-ink via-ink to-azure/90 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-azure/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-ink/20 rounded-full blur-3xl"></div>
      </div>

      {/* Main Card */}
      <div className="relative bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-up border border-azure/20">
        {/* Header Gradient with Animation */}
        <div className="h-2 bg-gradient-to-r from-ink via-azure to-ink bg-[length:200%_100%] animate-gradient"></div>
        
        <div className="p-8">
          {/* Back to Student Login */}
          <div className="flex justify-between items-center mb-4">
            <button
              onClick={() => navigate('/learner/login')}
              className="group flex items-center gap-2 text-gray-500 hover:text-ink transition-all text-sm"
              title="Back to Student Login"
            >
              <ArrowLeftIcon className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span className="font-medium">Student Portal</span>
            </button>
            
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
              Secure Access
            </span>
          </div>

          {/* Logo and Title */}
          <div className="text-center mb-8">
            <div className="relative inline-flex">
              <div className="absolute inset-0 bg-ink/20 rounded-full blur-md"></div>
              <div className="relative inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-ink to-azure rounded-2xl shadow-lg mb-4 transform hover:scale-105 transition-transform">
                <ShieldCheckIcon className="w-10 h-10 text-white" />
              </div>
            </div>
            <h1 className="font-serif text-3xl font-bold text-ink mb-2">
              Admin Portal
            </h1>
            <p className="text-gray-500 text-sm">
              Secure access for system administrators
            </p>
          </div>

          {/* Role Indicator */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-ink/5 rounded-full border border-ink/20">
              <ShieldCheckIcon className="w-4 h-4 text-ink" />
              <span className="text-sm text-gray-700">
                Signing in as <span className="font-semibold text-ink">Administrator</span>
              </span>
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Input */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <ShieldCheckIcon className={`h-5 w-5 transition-colors ${
                    errors.email ? 'text-red' : 'text-gray-400 group-focus-within:text-ink'
                  }`} />
                </div>
                <input
                  type="email"
                  placeholder="admin@eduportal.com"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({...formData, email: e.target.value});
                    if (errors.email) setErrors({...errors, email: null});
                  }}
                  className={`w-full pl-10 pr-4 py-3 bg-gray-50 border rounded-xl 
                           text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 
                           transition-all ${
                             errors.email 
                               ? 'border-red-500 focus:border-red-500 focus:ring-red-200' 
                               : 'border-gray-200 focus:border-ink focus:ring-ink/20'
                           }`}
                  required
                />
              </div>
              {errors.email && (
                <p className="text-xs text-red-500 mt-1">{errors.email}</p>
              )}
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LockClosedIcon className={`h-5 w-5 transition-colors ${
                    errors.password ? 'text-red' : 'text-gray-400 group-focus-within:text-ink'
                  }`} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) => {
                    setFormData({...formData, password: e.target.value});
                    if (errors.password) setErrors({...errors, password: null});
                  }}
                  className={`w-full pl-10 pr-12 py-3 bg-gray-50 border rounded-xl 
                           text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 
                           transition-all ${
                             errors.password 
                               ? 'border-red-500 focus:border-red-500 focus:ring-red-200' 
                               : 'border-gray-200 focus:border-ink focus:ring-ink/20'
                           }`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-ink"
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-500 mt-1">{errors.password}</p>
              )}
            </div>

            {/* Demo Credentials Hint */}
            <div className="bg-gradient-to-r from-ink/5 to-azure/5 rounded-lg p-4 border border-ink/10">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-ink">🔐 Demo Access</p>
                <button
                  type="button"
                  onClick={fillDemoCredentials}
                  className="text-xs text-azure hover:text-ink transition-colors"
                >
                  Fill credentials
                </button>
              </div>
              <div className="space-y-1 text-xs text-gray-600">
                <div className="flex items-center gap-2">
                  <span className="w-16 text-gray-400">Email:</span>
                  <span className="font-mono bg-white px-2 py-0.5 rounded border border-ink/10">admin@eduportal.com</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-16 text-gray-400">Password:</span>
                  <span className="font-mono bg-white px-2 py-0.5 rounded border border-ink/10">admin123</span>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full relative group overflow-hidden rounded-xl bg-gradient-to-r from-ink to-azure 
                       p-3 text-white font-semibold shadow-lg shadow-ink/25 
                       hover:shadow-xl hover:shadow-ink/30 transition-all duration-300
                       disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <>
                    <span>Access Admin Panel</span>
                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </>
                )}
              </span>
            </button>
          </form>

          {/* Security Note */}
          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-400">
            <ShieldCheckIcon className="w-4 h-4" />
            <span>256-bit encrypted connection</span>
          </div>
        </div>
      </div>

      {/* Animation keyframes */}
      <style jsx>{`
        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-fade-up {
          animation: fadeUp 0.5s ease-out;
        }
        .animate-gradient {
          animation: gradient 3s ease infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
      `}</style>
    </div>
  );
}