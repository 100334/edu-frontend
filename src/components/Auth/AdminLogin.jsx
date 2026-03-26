import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

// Theme constants
const DARK_BLUE = '#1A237E';
const AZURE = '#00B0FF';

export default function AdminLogin() {
  const navigate = useNavigate();
  const { adminLogin } = useAuth();
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
      const result = await adminLogin({
        email: formData.email,
        password: formData.password
      });
      
      if (result.success) {
        toast.success(`Welcome back, ${result.user?.name || 'Administrator'}!`, {
          duration: 4000,
          icon: '👑'
        });
        navigate('/admin');
      } else {
        toast.error(result.message || 'Invalid admin credentials. Please try again.');
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

  return (
    <div className="min-h-screen bg-white">
      <div className="min-h-screen flex">
        <div className="flex-1 overflow-auto px-6 py-4">
          <div className="max-w-[400px] mx-auto">
            {/* Back button to home */}
            <button
              onClick={() => navigate('/')}
              className="mb-5 flex items-center text-[#1A237E] hover:text-[#00B0FF] transition-colors group"
            >
              <svg className="w-4 h-4 mr-1 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="text-sm">Back to Home</span>
            </button>

            {/* Logo and Title */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-[90px] h-[90px] bg-gradient-to-br from-[#1A237E] to-[#00B0FF] rounded-2xl shadow-lg mb-2">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-[#1A237E] mt-2">
                ADMIN LOGIN
              </h1>
              <div className="w-10 h-1 bg-[#00B0FF] mx-auto mt-2"></div>
              <p className="text-xs text-gray-500 mt-3">
                Secure access for system administrators
              </p>
            </div>

            {/* Role Badge */}
            <div className="flex justify-center mb-6">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#00B0FF]/5 rounded-full border border-[#00B0FF]/20">
                <svg className="w-4 h-4 text-[#00B0FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span className="text-xs text-gray-600">
                  Signing in as <span className="font-semibold text-[#00B0FF]">Administrator</span>
                </span>
              </div>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Field */}
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-blue-600 tracking-wider">
                  EMAIL ADDRESS
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-0 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-[#1A237E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                  </div>
                  <input
                    type="email"
                    placeholder="admin@school.edu"
                    value={formData.email}
                    onChange={(e) => {
                      setFormData({...formData, email: e.target.value});
                      if (errors.email) setErrors({...errors, email: null});
                    }}
                    className={`w-full pl-7 pr-4 py-3 bg-transparent border-b-2 text-[#1A237E] font-semibold text-base
                             placeholder-gray-400 focus:outline-none transition-colors
                             ${errors.email ? 'border-red-500' : 'border-[#1A237E] focus:border-[#00B0FF]'}`}
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-red-500 mt-1">{errors.email}</p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-blue-600 tracking-wider">
                  PASSWORD
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-0 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-[#1A237E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6-4h12a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6a2 2 0 012-2zm10-4V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) => {
                      setFormData({...formData, password: e.target.value});
                      if (errors.password) setErrors({...errors, password: null});
                    }}
                    className={`w-full pl-7 pr-10 py-3 bg-transparent border-b-2 text-[#1A237E] font-semibold text-base
                             placeholder-gray-400 focus:outline-none transition-colors
                             ${errors.password ? 'border-red-500' : 'border-[#1A237E] focus:border-[#00B0FF]'}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center text-gray-400 hover:text-[#00B0FF] transition-colors"
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-red-500 mt-1">{errors.password}</p>
                )}
              </div>

              {/* Login Button */}
              {loading ? (
                <div className="flex justify-center py-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#1A237E]"></div>
                </div>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-[55px] bg-[#1A237E] text-white font-bold tracking-wider text-base
                           hover:bg-[#00B0FF] transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  style={{ borderRadius: '6px' }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  ACCESS ADMIN PANEL
                </button>
              )}
            </form>

            {/* Security Note */}
            <div className="mt-8 pt-4 text-center border-t border-gray-100">
              <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6-4h12a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6a2 2 0 012-2zm10-4V7a4 4 0 00-8 0v4h8z" />
                </svg>
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