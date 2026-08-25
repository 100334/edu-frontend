import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { AcademicCapIcon, UserIcon, IdentificationIcon } from '@heroicons/react/24/outline';

// Theme constants
const DARK_BLUE = '#1A237E';
const AZURE = '#00B0FF';
const TEAL = '#008080';

const LearnerLogin = ({ serverStatus }) => {
  const [name, setName] = useState('');
  const [regNumber, setRegNumber] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { learnerLogin } = useAuth();
  const navigate = useNavigate();

  // Load saved credentials on mount if remember me was checked
  useEffect(() => {
    const savedName = localStorage.getItem('rememberedLearnerName');
    const savedRegNumber = localStorage.getItem('rememberedLearnerRegNumber');
    const remember = localStorage.getItem('rememberLearner') === 'true';
    
    if (remember && savedName && savedRegNumber) {
      setName(savedName);
      setRegNumber(savedRegNumber);
      setRememberMe(true);
    }
  }, []);

  const handleLogin = async () => {
    if (!name || !regNumber) {
      setError('Please enter both name and registration number');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await learnerLogin({
        name: name,
        regNumber: regNumber.toUpperCase()
      });
      
      if (result.success) {
        // Handle remember me
        if (rememberMe) {
          localStorage.setItem('rememberedLearnerName', name);
          localStorage.setItem('rememberedLearnerRegNumber', regNumber.toUpperCase());
          localStorage.setItem('rememberLearner', 'true');
        } else {
          localStorage.removeItem('rememberedLearnerName');
          localStorage.removeItem('rememberedLearnerRegNumber');
          localStorage.removeItem('rememberLearner');
        }
        
        toast.success(`Welcome back, ${result.user.name}!`, {
          icon: '🎒',
          duration: 4000
        });
        navigate('/learner/dashboard');
      } else {
        setError(result.message || 'Invalid credentials');
        toast.error(result.message || 'Login failed');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Connection failed';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Logo component with school emblem
  const SchoolLogo = () => (
    <div className="relative mb-6">
      <div className="flex justify-center">
        <div className="relative">
          {/* Outer ring */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#1A237E] to-[#00B0FF] rounded-full blur-md opacity-50"></div>
          {/* Main logo container */}
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 bg-gradient-to-br from-[#1A237E] to-[#00B0FF] rounded-2xl shadow-2xl flex items-center justify-center transform transition-transform hover:scale-105 duration-300">
            <AcademicCapIcon className="w-12 h-12 sm:w-14 sm:h-14 text-white" />
          </div>
          {/* Decorative elements */}
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#FFD700] rounded-full animate-pulse"></div>
          <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-[#FFD700] rounded-full"></div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Main Card */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            {/* Decorative Top Bar */}
            <div className="h-2 bg-gradient-to-r from-[#1A237E] via-[#00B0FF] to-[#1A237E]"></div>
            
            {/* Logo and Header Section */}
            <div className="pt-8 pb-4 px-6 text-center border-b border-gray-100">
              <SchoolLogo />
              
              <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-[#1A237E] to-[#00B0FF] bg-clip-text text-transparent mt-2">
                PROGRESS SECONDARY SCHOOL
              </h1>
              <div className="w-16 h-1 bg-gradient-to-r from-[#1A237E] to-[#00B0FF] mx-auto mt-3 rounded-full"></div>
              <p className="text-sm text-gray-500 mt-3 flex items-center justify-center gap-2">
                <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                Student Portal Access
              </p>
            </div>

            {/* Login Form Section */}
            <div className="p-6 sm:p-8">
              <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} className="space-y-6">
                {/* Name Field - Redesigned with theme */}
                <div className="space-y-2">
                  <label className="block text-slate-700 text-sm font-semibold ml-1">
                    <span className="flex items-center gap-2">
                      <UserIcon className="w-4 h-4 text-[#008080]" />
                      Full Name
                    </span>
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-all group-focus-within:scale-110">
                      <svg className="w-5 h-5 text-slate-400 group-focus-within:text-[#008080] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={loading}
                      className="w-full pl-10 pr-3 py-2.5 bg-white border-2 border-slate-200 rounded-md text-slate-800 text-sm placeholder-slate-400 focus:outline-none focus:border-[#008080] focus:ring-2 focus:ring-[#008080]/10 transition-all duration-200"
                      placeholder="Enter your full name"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      {name && <div className="w-2 h-2 bg-green-500 rounded-full"></div>}
                    </div>
                  </div>
                </div>

                {/* Registration Number Field - Redesigned with theme */}
                <div className="space-y-2">
                  <label className="block text-slate-700 text-sm font-semibold ml-1">
                    <span className="flex items-center gap-2">
                      <IdentificationIcon className="w-4 h-4 text-[#008080]" />
                      Registration Number
                    </span>
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-all group-focus-within:scale-110">
                      <svg className="w-5 h-5 text-slate-400 group-focus-within:text-[#008080] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 20h10M7 4h10M7 8h10M7 12h10M7 16h10" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      value={regNumber}
                      onChange={(e) => setRegNumber(e.target.value.toUpperCase())}
                      style={{ fontFamily: 'monospace' }}
                      disabled={loading}
                      className="w-full pl-10 pr-3 py-2.5 bg-white border-2 border-slate-200 rounded-md text-slate-800 font-mono text-sm uppercase placeholder-slate-400 focus:outline-none focus:border-[#008080] focus:ring-2 focus:ring-[#008080]/10 transition-all duration-200"
                      placeholder="e.g., PSS/2024/001"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      {regNumber && <div className="text-[10px] text-gray-400">✓</div>}
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">Contact your teacher if you don't know your registration number</p>
                </div>

                {/* Remember Me Checkbox - Updated with theme */}
                <div className="flex items-center justify-between pt-1 px-1">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-4 h-4 text-[#008080] border-2 border-slate-300 rounded focus:ring-0 focus:ring-offset-0 accent-[#008080] cursor-pointer transition-all"
                      />
                    </div>
                    <span className="text-sm text-slate-600 group-hover:text-slate-800 transition-colors font-medium">Remember me</span>
                  </label>
                  
                  <button
                    type="button"
                    onClick={() => toast.info(
                      'Please contact your class teacher or the school administration for your registration number.',
                      { duration: 5000, icon: '📞' }
                    )}
                    className="text-sm text-[#008080] hover:text-[#1A237E] transition-colors font-medium"
                  >
                    Forgot number?
                  </button>
                </div>

                {/* Login Button - Updated with theme */}
                <button
                  type="submit"
                  disabled={loading || serverStatus?.status === 'offline'}
                  className="w-full mt-2 py-2.5 bg-[#008080] text-white font-bold rounded-md shadow-md hover:shadow-lg transform hover:scale-[1.02] transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 text-sm flex items-center justify-center gap-2"
                  onClick={handleLogin}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Verifying credentials...</span>
                    </>
                  ) : (
                    <>
                      <AcademicCapIcon className="w-5 h-5" />
                      <span>SIGN IN AS STUDENT</span>
                    </>
                  )}
                </button>
              </form>

              {/* Error Message - Updated with theme */}
              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-md">
                  <div className="flex items-center gap-2 text-red-700 text-sm">
                    <svg className="w-4 h-4 flex-shrink-0 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-medium">{error}</span>
                  </div>
                </div>
              )}
              
              {/* Server Offline Warning - Updated with theme */}
              {serverStatus?.status === 'offline' && (
                <div className="mt-4 p-3 bg-amber-50 border border-amber-100 rounded-md">
                  <div className="flex items-center gap-2 text-amber-700 text-sm">
                    <span className="text-base">⚠</span>
                    <span className="font-medium">Server is offline. Please check your connection.</span>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Section - Updated with theme */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-100">
              {/* Teacher Login Link */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Are you a teacher?</span>
                <button
                  onClick={() => navigate('/teacher/login')}
                  className="group flex items-center gap-2 text-[#008080] font-semibold hover:text-[#1A237E] transition-all duration-300"
                >
                  <span>Sign in here</span>
                  <svg 
                    className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-300" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
              </div>

              {/* Security Note */}
              <div className="mt-4 pt-3 border-t border-gray-200">
                <div className="flex flex-wrap items-center justify-center gap-3 text-xs">
                  <span className="flex items-center gap-1.5 font-medium text-slate-400 hover:text-[#1A237E] transition-colors cursor-pointer">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6-4h12a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6a2 2 0 012-2zm10-4V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Secure portal
                  </span>
                  <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
                  <span className="text-slate-400 hover:text-[#008080] transition-colors cursor-pointer font-medium">Progress tracking</span>
                  <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
                  <span className="text-slate-400 hover:text-[#008080] transition-colors cursor-pointer font-medium">Academic reports</span>
                </div>
              </div>
            </div>
          </div>

          {/* Help Text */}
          <p className="text-center text-xs text-gray-400 mt-6">
            Need help? Contact your class teacher or the school administration office
          </p>
        </div>
      </div>
    </div>
  );
};

export default LearnerLogin;