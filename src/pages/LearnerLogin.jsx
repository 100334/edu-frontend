import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { AcademicCapIcon, UserIcon, IdentificationIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

const InputField = ({ icon: Icon, label, value, onChange, placeholder, type = 'text', disabled, helper, monospace }) => (
  <div className="space-y-1.5">
    <label className="block text-slate-700 text-xs font-semibold uppercase tracking-wider ml-1">
      <span className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-[#006770]" />
        {label}
      </span>
    </label>
    <div className="relative group">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-all group-focus-within:scale-110">
        <Icon className="w-5 h-5 text-slate-400 group-focus-within:text-[#006770] transition-colors duration-200" />
      </div>
      <input
        type={type}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`w-full pl-10 pr-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-slate-800 text-sm placeholder-slate-400 placeholder:font-sans focus:outline-none focus:border-[#006770] focus:ring-4 focus:ring-[#006770]/10 transition-all duration-200 ${
          monospace ? 'font-mono' : ''
        }`}
        placeholder={placeholder}
      />
      {value && (
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
          <div className="w-2 h-2 bg-green-500 rounded-full absolute"></div>
        </div>
      )}
    </div>
    {helper && <p className="text-[10px] text-slate-400 mt-1 ml-1">{helper}</p>}
  </div>
);

// Theme constants
const DARK_BLUE = '#1A237E';
const AZURE = '#00B0FF';
const TEAL = '#006770';

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
      setError('');
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
    <div className="relative mb-6 flex justify-center">
      <div className="relative group">
        {/* Animated background glow */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#1A237E] to-[#00B0FF] rounded-full blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-700"></div>
        
        {/* Main logo container */}
        <div className="relative w-24 h-24 sm:w-28 sm:h-28 bg-gradient-to-br from-[#1A237E] to-[#00B0FF] rounded-2xl shadow-2xl flex items-center justify-center transform transition-all duration-500 group-hover:scale-105 group-hover:rotate-3 group-hover:shadow-3xl">
          <AcademicCapIcon className="w-12 h-12 sm:w-14 sm:h-14 text-white drop-shadow-lg" />
          
          {/* Decorative accent dots */}
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#FFD700] rounded-full animate-pulse shadow-lg shadow-[#FFD700]/50"></div>
          <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-[#FFD700] rounded-full shadow-lg shadow-[#FFD700]/50"></div>
          <div className="absolute top-1/2 -right-2 w-2 h-2 bg-[#00B0FF] rounded-full animate-bounce"></div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Main Card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl overflow-hidden border border-white/50">
            {/* Animated Top Bar */}
            <div className="h-1.5 bg-gradient-to-r from-[#1A237E] via-[#00B0FF] to-[#1A237E] bg-[length:200%_100%] animate-gradient-x"></div>
            
            {/* Header Section */}
            <div className="pt-8 pb-6 px-6 text-center border-b border-slate-100/80">
              <SchoolLogo />
              
              <h1 className="text-xl sm:text-2xl font-extrabold bg-gradient-to-r from-[#1A237E] to-[#00B0FF] bg-clip-text text-transparent">
                Progress Secondary School
              </h1>
              <div className="w-20 h-1 bg-gradient-to-r from-[#1A237E] to-[#00B0FF] mx-auto mt-3 rounded-full"></div>
              <div className="flex items-center justify-center gap-2 mt-3">
                <span className="inline-block w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                <span className="text-xs font-medium text-slate-500 tracking-wide">Student Portal Access</span>
              </div>
            </div>

            {/* Form Section */}
            <div className="p-6 sm:p-8">
              <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} className="space-y-5">
                <InputField
                  icon={UserIcon}
                  label="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  disabled={loading}
                />

                <InputField
                  icon={IdentificationIcon}
                  label="Registration Number"
                  value={regNumber}
                  onChange={(e) => setRegNumber(e.target.value)}
                  placeholder="Enter registration number"
                  disabled={loading}
                  monospace
                  helper="Contact your teacher if you don't know your registration number"
                />

                {/* Remember Me & Forgot */}
                <div className="flex items-center justify-between pt-1 px-1">
                  <label className="flex items-center gap-2.5 cursor-pointer group">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-4 h-4 text-[#006770] border-2 border-slate-300 rounded-md focus:ring-2 focus:ring-[#006770]/20 focus:ring-offset-0 accent-[#006770] cursor-pointer transition-all"
                      />
                    </div>
                    <span className="text-sm font-medium text-slate-600 group-hover:text-slate-800 transition-colors">Remember me</span>
                  </label>
                  
                  <button
                    type="button"
                    onClick={() => toast.info(
                      'Please contact your class teacher or the school administration for your registration number.',
                      { duration: 5000, icon: '📞' }
                    )}
                    className="text-sm font-semibold text-[#006770] hover:text-[#1A237E] transition-colors"
                  >
                    Forgot number?
                  </button>
                </div>

                {/* Login Button */}
                <button
                  type="submit"
                  disabled={loading || serverStatus?.status === 'offline'}
                  className="w-full mt-3 py-3.5 bg-gradient-to-r from-[#006770] to-[#00B0FF] text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 text-sm flex items-center justify-center gap-2 group"
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
                      <AcademicCapIcon className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
                      <span>SIGN IN AS STUDENT</span>
                      <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                    </>
                  )}
                </button>
              </form>

              {/* Error Message */}
              {error && (
                <div className="mt-4 p-3.5 bg-red-50/80 backdrop-blur-sm border border-red-100 rounded-xl animate-slideDown">
                  <div className="flex items-center gap-2.5 text-red-700 text-sm">
                    <svg className="w-5 h-5 flex-shrink-0 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-medium">{error}</span>
                  </div>
                </div>
              )}
              
            </div>

            {/* Footer */}
            <div className="bg-slate-50/80 backdrop-blur-sm px-6 py-5 border-t border-slate-100/80">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-600">Are you a teacher?</span>
                <button
                  onClick={() => navigate('/teacher/login')}
                  className="group flex items-center gap-2 text-[#006770] font-bold hover:text-[#1A237E] transition-all duration-300"
                >
                  <span>Sign in here</span>
                  <ArrowRightIcon className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-300" />
                </button>
              </div>

            </div>
          </div>

          {/* Help Text */}
          <p className="text-center text-xs text-slate-400 mt-6 font-medium">
            Need help? Contact your class teacher or the school administration office
          </p>
        </div>
      </div>

      {/* Add custom CSS for animations */}
      <style jsx>{`
        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient-x {
          animation: gradient-x 3s ease infinite;
        }
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slideDown {
          animation: slideDown 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default LearnerLogin;