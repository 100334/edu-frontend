import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { AcademicCapIcon, UserIcon, IdentificationIcon } from '@heroicons/react/24/outline';

// Theme constants
const DARK_BLUE = '#1A237E';
const AZURE = '#00B0FF';

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
                {/* Name Field */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    <UserIcon className="w-4 h-4 text-[#1A237E]" />
                    Full Name
                  </label>
                  <div className="relative group">
                    <input
                      type="text"
                      placeholder="Enter your full name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={loading}
                      className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl 
                               text-gray-800 font-medium text-sm focus:outline-none focus:border-[#00B0FF] 
                               focus:bg-white transition-all duration-200 group-hover:border-gray-300"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      {name && <div className="w-2 h-2 bg-green-500 rounded-full"></div>}
                    </div>
                  </div>
                </div>

                {/* Registration Number Field */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    <IdentificationIcon className="w-4 h-4 text-[#1A237E]" />
                    Registration Number
                  </label>
                  <div className="relative group">
                    <input
                      type="text"
                      placeholder="e.g., PSS/2024/001"
                      value={regNumber}
                      onChange={(e) => setRegNumber(e.target.value.toUpperCase())}
                      style={{ fontFamily: 'monospace' }}
                      disabled={loading}
                      className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl 
                               text-gray-800 font-mono text-sm uppercase focus:outline-none 
                               focus:border-[#00B0FF] focus:bg-white transition-all duration-200 
                               group-hover:border-gray-300"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      {regNumber && <div className="text-[10px] text-gray-400">✓</div>}
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-400">Contact your teacher if you don't know your registration number</p>
                </div>

                {/* Remember Me Checkbox */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 text-[#1A237E] border-2 border-gray-300 rounded 
                               focus:ring-2 focus:ring-[#00B0FF] focus:ring-offset-0 
                               cursor-pointer transition-all"
                    />
                    <span className="text-sm text-gray-600 group-hover:text-[#1A237E] transition-colors">
                      Remember me
                    </span>
                  </label>
                  
                  <button
                    type="button"
                    onClick={() => toast.info(
                      'Please contact your class teacher or the school administration for your registration number.',
                      { duration: 5000, icon: '📞' }
                    )}
                    className="text-sm text-[#00B0FF] hover:text-[#1A237E] transition-colors"
                  >
                    Forgot number?
                  </button>
                </div>

                {/* Login Button */}
                <button
                  type="submit"
                  disabled={loading || serverStatus?.status === 'offline'}
                  className="w-full py-3.5 bg-gradient-to-r from-[#1A237E] to-[#00B0FF] text-white 
                           font-bold tracking-wider text-sm rounded-xl hover:shadow-lg 
                           transform hover:scale-[1.02] transition-all duration-300 
                           disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                           flex items-center justify-center gap-2"
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

              {/* Error Message */}
              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl">
                  <div className="flex items-center gap-2 text-red-700 text-sm">
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{error}</span>
                  </div>
                </div>
              )}
              
              {/* Server Offline Warning */}
              {serverStatus?.status === 'offline' && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
                  <div className="flex items-center gap-2 text-yellow-800 text-sm">
                    <span className="text-lg">🔌</span>
                    <span>Server is offline. Please check your connection.</span>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Section */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-100">
              {/* Teacher Login Link */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Are you a teacher?</span>
                <button
                  onClick={() => navigate('/teacher/login')}
                  className="group flex items-center gap-2 text-[#00B0FF] font-semibold hover:text-[#1A237E] transition-all duration-300"
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
                <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6-4h12a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6a2 2 0 012-2zm10-4V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Secure portal
                  </span>
                  <span className="hidden xs:inline text-gray-300">•</span>
                  <span>Progress tracking</span>
                  <span className="hidden xs:inline text-gray-300">•</span>
                  <span>Academic reports</span>
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