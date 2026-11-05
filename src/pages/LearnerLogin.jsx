import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { AcademicCapIcon, UserIcon, IdentificationIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

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

  const handleLogin = async () => {
    if (!name || !regNumber) { setError('Please fill in all fields.'); return; }
    setLoading(true);
    setError('');
    try {
      const result = await learnerLogin({ name, regNumber: regNumber.toUpperCase() });
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
    <div className="min-h-screen flex">
      {/* ── Left panel: hero image ─────────────────────────────────────────── */}
      <div
        className="hidden lg:flex lg:w-1/2 xl:w-3/5 relative items-end"
        style={{ backgroundImage: "url('/image2.png')", backgroundSize: 'cover', backgroundPosition: 'center' }}
      >
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#003B3F]/80 via-[#00676B]/20 to-transparent" />
        <div className="relative z-10 p-10 text-white">
          <h2 className="text-4xl font-black leading-tight drop-shadow">
            Welcome to<br />Progress Secondary School
          </h2>
          <p className="mt-3 text-white/80 text-base font-medium max-w-sm">
            Your learning journey starts here. Sign in to access lessons, results, and more.
          </p>
        </div>
      </div>

      {/* ── Right panel: form ──────────────────────────────────────────────── */}
      <div
        className="flex-1 flex items-center justify-center p-6 relative bg-[#F2FBFC]"
      >
        {/* Mobile: faint image bg */}
        <div
          className="absolute inset-0 lg:hidden opacity-[0.07]"
          style={{ backgroundImage: "url('/image2.png')", backgroundSize: 'cover', backgroundPosition: 'center' }}
        />

        <div className="relative z-10 w-full max-w-sm">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-20 h-20 rounded-2xl bg-[#00676B] shadow-lg flex items-center justify-center mb-4">
              <AcademicCapIcon className="w-11 h-11 text-white" />
            </div>
            <h1 className="text-2xl font-black text-[#073F43]">Student Sign In</h1>
            <p className="text-sm text-[#527174] mt-1">Progress Secondary School</p>
            <div className="w-16 h-1 rounded-full bg-gradient-to-r from-[#00676B] to-[#F3C34A] mt-3" />
          </div>

          {/* Card */}
          <div className="bg-white rounded-[22px] border border-[#D3EEEE] shadow-[0_8px_28px_rgba(0,91,96,0.10)] overflow-hidden">
            {/* Top accent bar */}
            <div className="h-1.5 bg-gradient-to-r from-[#009B9D] via-[#00777C] to-[#F3C34A]" />

            <form
              onSubmit={e => { e.preventDefault(); handleLogin(); }}
              className="p-6 space-y-5"
            >
              {/* Name */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-black uppercase tracking-wider text-[#527174]">
                  Full Name
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#00777A]" />
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Enter your full name"
                    disabled={loading}
                    className="w-full pl-9 pr-4 py-3 rounded-xl border-2 border-[#D3EEEE] bg-[#F6FDFD] text-[#073F43] text-sm placeholder-slate-400 focus:outline-none focus:border-[#00777A] focus:ring-4 focus:ring-[#00777A]/10 transition"
                  />
                </div>
              </div>

              {/* Reg number */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-black uppercase tracking-wider text-[#527174]">
                  Registration Number
                </label>
                <div className="relative">
                  <IdentificationIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#00777A]" />
                  <input
                    type="text"
                    value={regNumber}
                    onChange={e => setRegNumber(e.target.value)}
                    placeholder="e.g. FRM3-26-XXXX"
                    disabled={loading}
                    className="w-full pl-9 pr-4 py-3 rounded-xl border-2 border-[#D3EEEE] bg-[#F6FDFD] text-[#073F43] text-sm font-mono placeholder-slate-400 focus:outline-none focus:border-[#00777A] focus:ring-4 focus:ring-[#00777A]/10 transition"
                  />
                </div>
                <p className="text-[10px] text-slate-400 ml-1">
                  Contact your teacher if you don't know your registration number
                </p>
              </div>

              {/* Remember me / forgot */}
              <div className="flex items-center justify-between px-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded accent-[#00676B] cursor-pointer"
                  />
                  <span className="text-sm text-[#527174]">Remember me</span>
                </label>
                <button
                  type="button"
                  onClick={() => toast.info('Contact your class teacher or school admin for your registration number.', { duration: 5000 })}
                  className="text-sm font-bold text-[#00676B] hover:text-[#073F43] transition"
                >
                  Forgot number?
                </button>
              </div>

              {/* Error */}
              {error && (
                <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
                  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || serverStatus?.status === 'offline'}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#009B9D] via-[#00777C] to-[#00585F] text-white font-black text-sm shadow-md hover:brightness-105 active:scale-[0.98] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Verifying…
                  </>
                ) : (
                  <>
                    <AcademicCapIcon className="w-5 h-5" />
                    Sign In as Student
                    <ArrowRightIcon className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Footer link */}
            <div className="border-t border-[#D8EEEE] bg-[#F0FAF8] px-6 py-4 flex items-center justify-between">
              <span className="text-sm text-[#527174]">Are you a teacher?</span>
              <button
                onClick={() => navigate('/teacher/login')}
                className="flex items-center gap-1 text-sm font-black text-[#00676B] hover:text-[#073F43] transition"
              >
                Sign in here <ArrowRightIcon className="w-4 h-4" />
              </button>
            </div>
          </div>

          <p className="text-center text-xs text-slate-400 mt-5">
            Need help? Contact your class teacher or school admin
          </p>
        </div>
      </div>
    </div>
  );
};

export default LearnerLogin;
