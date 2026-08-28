import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';
import { UserIcon, LockClosedIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

const InputField = ({ icon: Icon, label, value, onChange, placeholder, type = 'text', disabled, rightElement }) => (
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
        className="w-full pl-11 pr-10 py-2.5 bg-[#F4F9F9] border border-slate-200 rounded-md text-slate-800 text-sm placeholder-slate-400 placeholder:font-sans focus:outline-none focus:bg-white focus:border-[#006770] focus:ring-1 focus:ring-[#006770] transition-all duration-200"
        placeholder={placeholder}
      />
      {rightElement && (
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
          {rightElement}
        </div>
      )}
    </div>
  </div>
);

export default function TeacherLogin({ serverStatus }) {
  const navigate = useNavigate();
  const { teacherLogin } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Please enter your username and password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await teacherLogin({ username, password });

      if (result.success) {
        toast.success(`Welcome, ${result.user?.name || 'Teacher'}!`, {
          icon: '🎓',
          duration: 4000
        });
        navigate('/teacher/dashboard');
      } else {
        setError(result.message || 'Invalid teacher credentials');
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
    <div className="min-h-screen bg-[#F4F9F9] flex items-center justify-center p-3">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 overflow-hidden">
          <div className="pt-5 pb-4 px-6 text-center border-b border-slate-100">
            <div className="mb-4 flex justify-center">
              <img
                src="/school-logo.jpeg"
                alt="Progress Secondary School logo"
                className="w-20 h-20 sm:w-24 sm:h-24 object-contain"
              />
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-800 tracking-tight">
              PROGRESS SECONDARY SCHOOL
            </h1>
            <div className="flex items-center justify-center gap-2 mt-2">
              <span className="w-2 h-2 bg-[#006770] rounded-full"></span>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Teacher Portal</span>
            </div>
          </div>

          <div className="p-4 sm:p-5">
            <form onSubmit={handleLogin} className="space-y-3.5">
              <InputField
                icon={UserIcon}
                label="Staff Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                disabled={loading}
              />

              <InputField
                icon={LockClosedIcon}
                label="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                type={showPassword ? 'text' : 'password'}
                disabled={loading}
                rightElement={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-slate-400 hover:text-slate-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword
                      ? <EyeSlashIcon className="w-5 h-5" />
                      : <EyeIcon className="w-5 h-5" />
                    }
                  </button>
                }
              />

              <button
                type="submit"
                disabled={loading || serverStatus?.status === 'offline'}
                className="w-full mt-1 py-2.5 bg-[#006770] hover:bg-[#005a62] text-white font-semibold rounded-md transition-colors duration-200 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-2"
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
                  <span>Sign in</span>
                )}
              </button>
            </form>

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
}
