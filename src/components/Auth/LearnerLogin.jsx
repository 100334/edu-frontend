import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { UserIcon, IdentificationIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

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
    const savedReg  = localStorage.getItem('rememberedLearnerRegNumber');
    const remember  = localStorage.getItem('rememberLearner') === 'true';
    if (remember && savedName && savedReg) {
      setName(savedName);
      setRegNumber(savedReg);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !regNumber.trim()) {
      setError('Please enter your full name and registration number.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const result = await learnerLogin({
        name: name.trim(),
        regNumber: regNumber.trim().toUpperCase(),
      });
      if (result.success) {
        if (rememberMe) {
          localStorage.setItem('rememberedLearnerName', name.trim());
          localStorage.setItem('rememberedLearnerRegNumber', regNumber.trim().toUpperCase());
          localStorage.setItem('rememberLearner', 'true');
        } else {
          localStorage.removeItem('rememberedLearnerName');
          localStorage.removeItem('rememberedLearnerRegNumber');
          localStorage.removeItem('rememberLearner');
        }
        navigate('/learner/dashboard');
      } else {
        setError(result.message || 'Invalid credentials');
        toast.error(result.message || 'Login failed');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Connection failed';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center bg-cover bg-center bg-no-repeat px-4 py-8"
      style={{ backgroundImage: "url('/image2.png')" }}
    >
      <div className="w-full max-w-[520px] sm:ml-auto sm:mr-[5%]">
        <div className="rounded-[24px] border-[3px] border-[#E9B52E] bg-white/95 p-7 shadow-[0_15px_45px_rgba(0,55,60,0.25)] backdrop-blur-sm sm:p-10">

          {/* Heading */}
          <div className="mb-9 text-center">
            <div className="mb-4 flex justify-center">
              <img
                src="/school-logo.jpeg"
                alt="Progress Secondary School"
                className="w-20 h-20 object-contain"
                onError={e => { e.target.style.display = 'none'; }}
              />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-[#075B60] sm:text-4xl">
              Progress Schools
            </h1>
            <div className="mx-auto mt-4 h-[3px] w-2/3 rounded-full bg-gradient-to-r from-[#E7AD20] via-[#FFD95A] to-[#E7AD20]" />
            <p className="mt-4 text-sm font-medium text-gray-500">
              Welcome! Sign in to continue learning.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Full Name */}
            <div>
              <label className="mb-2 block text-sm font-bold text-[#075B60]">
                Full Name
              </label>
              <div className="flex h-[62px] items-center gap-4 rounded-full border-2 border-[#08676C] bg-white px-5 shadow-sm transition focus-within:border-[#E9B52E] focus-within:ring-4 focus-within:ring-[#E9B52E]/15">
                <UserIcon className="h-7 w-7 shrink-0 text-[#08777B]" />
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Enter your full name"
                  autoComplete="name"
                  disabled={loading}
                  className="h-full w-full bg-transparent text-base text-gray-800 outline-none placeholder:text-gray-400"
                  required
                />
              </div>
            </div>

            {/* Registration Number */}
            <div>
              <label className="mb-2 block text-sm font-bold text-[#075B60]">
                Registration Number
              </label>
              <div className="flex h-[62px] items-center gap-4 rounded-full border-2 border-[#08676C] bg-white px-5 shadow-sm transition focus-within:border-[#E9B52E] focus-within:ring-4 focus-within:ring-[#E9B52E]/15">
                <IdentificationIcon className="h-7 w-7 shrink-0 text-[#08777B]" />
                <input
                  type="text"
                  value={regNumber}
                  onChange={e => setRegNumber(e.target.value)}
                  placeholder="e.g. FRM3-26-XXXX"
                  autoComplete="username"
                  disabled={loading}
                  className="h-full w-full bg-transparent font-mono text-base text-gray-800 outline-none placeholder:text-gray-400"
                  required
                />
              </div>
            </div>

            {/* Remember me */}
            <div className="flex items-center justify-between px-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded accent-[#08676C] cursor-pointer"
                />
                <span className="text-sm text-gray-500">Remember me</span>
              </label>
              <button
                type="button"
                onClick={() => toast.info('Contact your class teacher or school admin for your registration number.', { duration: 5000 })}
                className="text-sm font-semibold text-[#08676C] hover:text-[#075B60] transition"
              >
                Forgot number?
              </button>
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-2xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            {/* Sign In button */}
            <button
              type="submit"
              disabled={loading || serverStatus?.status === 'offline'}
              className="group mt-4 flex h-[68px] w-full items-center justify-center gap-4 rounded-full border-[3px] border-[#E9B52E] bg-gradient-to-r from-[#00656B] to-[#008C8B] text-xl font-extrabold text-white shadow-[0_6px_12px_rgba(0,60,65,0.2)] transition duration-300 hover:-translate-y-1 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 sm:text-2xl"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-6 w-6" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRightIcon className="h-7 w-7 transition-transform group-hover:translate-x-2" />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-7 flex flex-col items-center gap-2">
            <p className="text-center text-xs text-gray-400">
              Progress Schools · Learning Management System
            </p>
            <button
              onClick={() => navigate('/teacher/login')}
              className="flex items-center gap-1 text-xs font-semibold text-[#08676C] hover:text-[#075B60] transition"
            >
              Teacher / Admin? Sign in here <ArrowRightIcon className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default LearnerLogin;
