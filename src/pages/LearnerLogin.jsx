import React, { useState } from 'react';
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { learnerLogin } = useAuth();
  const navigate = useNavigate();

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
                <AcademicCapIcon className="w-12 h-12 text-white" />
              </div>
              <h1 className="text-xl font-bold text-[#1A237E] mt-2">
                STUDENT LOGIN
              </h1>
              <div className="w-10 h-1 bg-[#00B0FF] mx-auto mt-2"></div>
            </div>

            {/* Login Form */}
            <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} className="space-y-6">
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
                    className="w-full pl-7 pr-4 py-3 bg-transparent border-b-2 text-[#1A237E] font-semibold text-base
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
                    className="w-full pl-7 pr-4 py-3 bg-transparent border-b-2 text-[#1A237E] font-semibold text-base
                             placeholder-gray-400 focus:outline-none transition-colors uppercase
                             border-[#1A237E] focus:border-[#00B0FF]"
                  />
                </div>
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
                  className="w-full h-[55px] bg-[#1A237E] text-white font-bold tracking-wider text-base
                           hover:bg-[#00B0FF] transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  style={{ borderRadius: '6px' }}
                  onClick={handleLogin}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  SIGN IN AS STUDENT
                </button>
              )}
            </form>

            {error && (
              <div style={{ 
                color: '#c0392b', 
                fontSize: '13px', 
                marginTop: '10px', 
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
                fontSize: '12px',
                color: '#721c24',
                textAlign: 'center'
              }}>
                🔌 Server is offline. Please check your connection.
              </div>
            )}

            {/* Teacher Login Forward Link - With Enhanced Arrow */}
            <div className="mt-8 text-center">
              <div className="inline-flex items-center justify-center gap-3 px-6 py-3 bg-gray-50 rounded-xl border border-gray-200 hover:border-[#00B0FF] transition-all duration-300">
                <span className="text-sm text-gray-600">Are you a teacher?</span>
                <button
                  onClick={() => navigate('/teacher/login')}
                  className="flex items-center gap-2 text-[#00B0FF] font-semibold hover:gap-3 transition-all duration-300 group"
                >
                  <span>Sign in here</span>
                  <svg 
                    className="w-5 h-5 transform group-hover:translate-x-1 transition-transform duration-300" 
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
            <div className="mt-8 pt-4 text-center border-t border-gray-100">
              <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6-4h12a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6a2 2 0 012-2zm10-4V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>Secure student portal</span>
                <span>•</span>
                <span>Personalized learning</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LearnerLogin;