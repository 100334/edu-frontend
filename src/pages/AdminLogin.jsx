import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';  // Go up two levels to src
import toast from 'react-hot-toast';
import api from '../../services/api';  // Go up two levels to src

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
      // Call the admin login API
      const response = await api.post('/api/auth/admin/login', {
        email: formData.email,
        password: formData.password
      });
      
      if (response.data.success) {
        const { token, user } = response.data;
        
        // Use the generic login function
        await login(user, token);
        
        toast.success(`Welcome back, ${user.name || 'Administrator'}! 🔐`, {
          icon: '👑',
          duration: 4000
        });
        
        // Redirect to admin dashboard
        navigate('/admin');
      } else {
        toast.error('Invalid admin credentials. Please try again.', {
          icon: '❌'
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      
      if (error.response?.status === 401) {
        toast.error('Invalid email or password');
      } else if (error.response?.status === 403) {
        toast.error('Access denied. Admin privileges required.');
      } else {
        toast.error('An error occurred during login. Please try again.');
      }
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
    <div className="min-h-screen bg-[#f7f4ef] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back to Home */}
        <div className="mb-4">
          <button
            onClick={() => navigate('/')}
            className="group flex items-center gap-2 text-gray-500 hover:text-[#c9933a] transition-all text-sm"
          >
            <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Back to Home</span>
          </button>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-xl border-2 border-[#d4cfc6] shadow-sm overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-[#0f1923] via-[#c9933a] to-[#0f1923]"></div>
          
          <div className="p-6 lg:p-8">
            {/* Logo and Title */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-[#0f1923] rounded-xl shadow-md mb-4">
                <span className="text-2xl">👑</span>
              </div>
              <h1 className="font-serif text-2xl font-bold text-[#0f1923] mb-1">
                Admin Portal
              </h1>
              <p className="text-sm text-gray-500">
                Secure access for system administrators
              </p>
            </div>

            {/* Role Badge */}
            <div className="flex justify-center mb-6">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#f7f4ef] rounded-full border border-[#d4cfc6]">
                <span className="text-sm">🔐</span>
                <span className="text-xs text-gray-600">
                  Signing in as <span className="font-semibold text-[#c9933a]">Administrator</span>
                </span>
              </div>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Input */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-400">📧</span>
                  </div>
                  <input
                    type="email"
                    placeholder="admin@eduportal.com"
                    value={formData.email}
                    onChange={(e) => {
                      setFormData({...formData, email: e.target.value});
                      if (errors.email) setErrors({...errors, email: null});
                    }}
                    className={`w-full pl-10 pr-4 py-2.5 border rounded-lg bg-white 
                             text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 
                             transition-all ${
                               errors.email 
                                 ? 'border-red-500 focus:border-red-500 focus:ring-red-200' 
                                 : 'border-[#d4cfc6] focus:border-[#c9933a] focus:ring-[#c9933a]/20'
                             }`}
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-red-500 mt-1">{errors.email}</p>
                )}
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-400">🔒</span>
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) => {
                      setFormData({...formData, password: e.target.value});
                      if (errors.password) setErrors({...errors, password: null});
                    }}
                    className={`w-full pl-10 pr-12 py-2.5 border rounded-lg bg-white 
                             text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 
                             transition-all ${
                               errors.password 
                                 ? 'border-red-500 focus:border-red-500 focus:ring-red-200' 
                                 : 'border-[#d4cfc6] focus:border-[#c9933a] focus:ring-[#c9933a]/20'
                             }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-[#c9933a]"
                  >
                    {showPassword ? (
                      <span className="text-sm">👁️</span>
                    ) : (
                      <span className="text-sm">👁️‍🗨️</span>
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-red-500 mt-1">{errors.password}</p>
                )}
              </div>

              {/* Demo Credentials Hint */}
              <div className="bg-[#f7f4ef] rounded-lg p-4 border border-[#d4cfc6]">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-[#0f1923]">🔐 Demo Access</p>
                  <button
                    type="button"
                    onClick={fillDemoCredentials}
                    className="text-xs text-[#c9933a] hover:text-[#0f1923] transition-colors"
                  >
                    Fill credentials
                  </button>
                </div>
                <div className="space-y-1 text-xs text-gray-600">
                  <div className="flex items-center gap-2">
                    <span className="w-16 text-gray-400">Email:</span>
                    <code className="font-mono bg-white px-2 py-0.5 rounded border border-[#d4cfc6] text-[#0f1923]">
                      admin@eduportal.com
                    </code>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-16 text-gray-400">Password:</span>
                    <code className="font-mono bg-white px-2 py-0.5 rounded border border-[#d4cfc6] text-[#0f1923]">
                      admin123
                    </code>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-[#c9933a] text-[#0f1923] font-semibold rounded-lg hover:bg-[#e8b96a] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <>
                    <span>Access Admin Panel</span>
                    <span>→</span>
                  </>
                )}
              </button>
            </form>

            {/* Security Note */}
            <div className="mt-6 pt-4 border-t border-[#d4cfc6] text-center">
              <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                <span>🔒</span>
                <span>256-bit encrypted connection</span>
                <span>•</span>
                <span>Admin only access</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}