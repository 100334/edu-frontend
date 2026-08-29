import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { UserIcon, IdentificationIcon } from '@heroicons/react/24/outline';

const InputField = ({ icon: Icon, label, value, onChange, placeholder, type = 'text', disabled, helper, monospace }) => (
  <div className="space-y-1.5">
    <label className="block text-slate-700 text-xs font-bold uppercase tracking-wider ml-1">
      {label}
    </label>
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
        <Icon className="w-5 h-5 text-slate-400" />
      </div>
      <input
        type={type}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`w-full pl-10 pr-3 py-2 bg-[#F4F9F9] border border-slate-200 rounded-md text-slate-800 text-sm placeholder-slate-400 placeholder:font-sans focus:outline-none focus:bg-white focus:border-[#006770] focus:ring-1 focus:ring-[#006770] transition-all duration-200 ${
          monospace ? 'font-mono' : ''
        }`}
        placeholder={placeholder}
      />
    </div>
    {helper && <p className="text-[11px] text-slate-500 mt-1 ml-1">{helper}</p>}
  </div>
);

const LearnerLogin = ({ serverStatus }) => {
  const [name, setName] = useState('');
  const [regNumber, setRegNumber] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { learnerLogin } = useAuth();
  const navigate = useNavigate();

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

  const SchoolLogo = () => (
    <div className="mb-4 flex justify-center">
      <img
        src="/school-logo.jpeg"
        alt="Progress Secondary School logo"
        className="w-20 h-20 sm:w-24 sm:h-24 object-contain"
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F4F9F9] flex items-center justify-center p-3">
      <div className="w-full max-w-sm">
        {/* Main Card */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 overflow-hidden">
          
          {/* Header Section */}
          <div className="pt-4 pb-3 px-5 text-center border-b border-slate-100">
            <SchoolLogo />
            <h1 className="text-lg sm:text-xl font-bold text-slate-800 tracking-tight">
              PROGRESS SECONDARY SCHOOL
            </h1>
            <div className="flex items-center justify-center gap-2 mt-2">
              <span className="w-2 h-2 bg-[#006770] rounded-full"></span>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Student Portal</span>
            </div>
          </div>

          {/* Form Section */}
          <div className="p-3 sm:p-4">
            <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} className="space-y-3">
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
              />

              {/* Remember Me & Forgot */}
              <div className="flex items-center justify-between px-1">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 text-[#006770] border-slate-300 rounded focus:ring-0 focus:ring-offset-0 accent-[#006770] cursor-pointer"
                  />
                  <span className="text-sm text-slate-600 font-medium">Remember me</span>
                </label>

              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={loading || serverStatus?.status === 'offline'}
                className="w-full mt-1 py-2 bg-[#006770] hover:bg-[#006770] text-white font-semibold rounded-md transition-colors duration-200 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-2"
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
                    <span>Sign in</span>
                  </>
                )}
              </button>
            </form>

            {/* Error Message */}
            {error && (
              <div className="mt-4 p-3.5 bg-red-50 border border-red-200 rounded-xl">
                <div className="flex items-center gap-2.5 text-red-700 text-sm">
                  <svg className="w-5 h-5 flex-shrink-0 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-medium">{error}</span>
                </div>
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
};

export default LearnerLogin;