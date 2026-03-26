import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { AcademicCapIcon } from '@heroicons/react/24/outline';

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

  return (
    <div className="min-h-screen bg-white">
      <div className="min-h-screen flex">
        <div className="flex-1 overflow-auto px-4 sm:px-6 py-4 sm:py-6">
          <div className="max-w-[400px] mx-auto">
            {/* Logo and Title */}
            <div className="text-center mb-6 sm:mb-8">
              <div className="inline-flex items-center justify-center w-[70px] h-[70px] sm:w-[90px] sm:h-[90px] bg-gradient-to-br from-[#1A237E] to-[#00B0FF] rounded-2xl shadow-lg mb-2">
                <AcademicCapIcon className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
              </div>
              <h1 className="text-lg sm:text-xl font-bold text-[#1A237E] mt-2">
                STUDENT LOGIN
              </h1>
              <div className="w-8 sm:w-10 h-1 bg-[#00B0FF] mx-auto mt-2"></div>
            </div>

            {/* Login Form */}
            <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} className="space-y-5 sm:space-y-6">
              {/* Name Field */}
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-blue-600 tracking-wider">
                  FULL NAME
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-0 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-[#1A237E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={loading}
                    onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                    className="w-full pl-7 pr-4 py-2.5 sm:py-3 bg-transparent border-b-2 text-[#1A237E] font-semibold text-sm sm:text-base
                             placeholder-gray-400 focus:outline-none transition-colors
                             border-[#1A237E] focus:border-[#00B0FF]"
                  />
                </div>
              </div>

              {/* Registration Number Field */}
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-blue-600 tracking-wider">
                  REGISTRATION NUMBER
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-0 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-[#1A237E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Enter your registration number"
                    value={regNumber}
                    onChange={(e) => setRegNumber(e.target.value.toUpperCase())}
                    style={{ fontFamily: 'monospace' }}
                    disabled={loading}
                    onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                    className="w-full pl-7 pr-4 py-2.5 sm:py-3 bg-transparent border-b-2 text-[#1A237E] font-semibold text-sm sm:text-base
                             placeholder-gray-400 focus:outline-none transition-colors uppercase
                             border-[#1A237E] focus:border-[#00B0FF]"
                  />
                </div>
              </div>

              {/* Remember Me Checkbox */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 sm:w-5 sm:h-5 text-[#1A237E] border-gray-300 rounded focus:ring-[#00B0FF] cursor-pointer"
                  />
                  <span className="text-xs sm:text-sm text-gray-600 group-hover:text-[#1A237E] transition-colors">
                    Remember me
                  </span>
                </label>
                
                {/* Optional: Forgot Password Link (if you have that feature) */}
                <button
                  type="button"
                  onClick={() => toast.info('Contact your teacher for registration number assistance', { duration: 4000 })}
                  className="text-xs sm:text-sm text-[#00B0FF] hover:text-[#1A237E] transition-colors"
                >
                  Forgot registration number?
                </button>
              </div>

              {/* Login Button */}
              {loading ? (
                <div className="flex justify-center py-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#1A237E]"></div>
                </div>
              ) : (
                <button
                  type="submit"
                  disabled={loading || serverStatus?.status === 'offline'}
                  className="w-full h-[48px] sm:h-[55px] bg-[#1A237E] text-white font-bold tracking-wider text-sm sm:text-base
                           hover:bg-[#00B0FF] transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  style={{ borderRadius: '6px' }}
                  onClick={handleLogin}
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  SIGN IN AS STUDENT
                </button>
              )}
            </form>

            {error && (
              <div style={{ 
                color: '#c0392b', 
                fontSize: '12px', 
                marginTop: '12px', 
                textAlign: 'center' 
              }}>
                {error}
              </div>
            )}
            
            {serverStatus?.status === 'offline' && (
              <div style={{ 
                marginTop: '16px', 
                padding: '10px', 
                background: '#f8d7da', 
                borderRadius: '8px',
                fontSize: '11px',
                color: '#721c24',
                textAlign: 'center'
              }}>
                🔌 Server is offline. Please check your connection.
              </div>
            )}

            {/* Teacher Login Forward Link */}
            <div className="mt-6 sm:mt-8 text-center">
              <div className="inline-flex items-center justify-center gap-2 sm:gap-3 px-4 sm:px-6 py-2 sm:py-3 bg-gray-50 rounded-xl border border-gray-200 hover:border-[#00B0FF] transition-all duration-300">
                <span className="text-xs sm:text-sm text-gray-600">Are you a teacher?</span>
                <button
                  onClick={() => navigate('/teacher/login')}
                  className="flex items-center gap-1 sm:gap-2 text-[#00B0FF] font-semibold hover:gap-2 sm:hover:gap-3 transition-all duration-300 group"
                >
                  <span className="text-xs sm:text-sm">Sign in here</span>
                  <svg 
                    className="w-4 h-4 sm:w-5 sm:h-5 transform group-hover:translate-x-1 transition-transform duration-300" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Security Note */}
            <div className="mt-6 sm:mt-8 pt-4 text-center border-t border-gray-100">
              <div className="flex flex-wrap items-center justify-center gap-1 sm:gap-2 text-[10px] sm:text-xs text-gray-400">
                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6-4h12a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6a2 2 0 012-2zm10-4V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>Secure student portal</span>
                <span className="hidden xs:inline">•</span>
                <span>Personalized learning</span>
                <span className="hidden xs:inline">•</span>
                <span>Progress tracking</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LearnerLogin;