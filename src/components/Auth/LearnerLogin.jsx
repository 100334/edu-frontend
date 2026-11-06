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
      setError('Name and Registration Number required.');
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
    } fontally {
      setLoading(false);
    }
  };

  return (
    <div className="learner-login-page min-h-screen w-full bg-[#F0FAF9] flex flex-col justify-between">
      {/* ── Background banner ─────────────────────────────────── */}
      <div className="relative w-full h-[32vh] min-h-[160px] max-h-[260px] shrink-0">
        <img
          src="/image2.png"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#003B3F]/50 via-[#003B3F]/20 to-transparent" />
        
        <div className="absolute left-6 top-6 text-white drop-shadow">
          <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">Progress Schools</p>
          <h1 className="text-xl font-black">Student Sign In</h1>
        </div>

        {/* Bottom wave */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none">
          <svg viewBox="0 0 1440 60" preserveAspectRatio="none" className="block w-full h-10">
            <path className="learner-login-wave-fill" d="M0,0 C360,60 1080,60 1440,0 L1440,60 L0,60 Z" />
          </svg>
        </div>
      </div>

      {/* ── Card Container ──────────────────────────────────── */}
      <div className="learner-login-content flex flex-1 flex-col items-center justify-center px-4 -mt-10 pb-8">
        <div className="w-full max-w-sm rounded-2xl border border-[#D3EEEE] bg-white shadow-xl overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-[#E7AD20] via-[#FFD95A] to-[#E7AD20]" />

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Full Name */}
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-[#527174]">
                Full Name
              </label>
              <div className="flex h-11 items-center gap-2.5 rounded-xl border border-[#C8E8E8] bg-[#F6FDFD] px-3.5 focus-within:border-[#08676C]">
                <UserIcon className="h-4 w-4 shrink-0 text-[#08777B]" />
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Full Name"
                  autoComplete="name"
                  disabled={loading}
                  className="h-full w-full bg-transparent text-sm text-gray-800 outline-none"
                  required
                />
              </div>
            </div>

            {/* Registration Number */}
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-[#527174]">
                Registration Number
              </label>
              <div className="flex h-11 items-center gap-2.5 rounded-xl border border-[#C8E8E8] bg-[#F6FDFD] px-3.5 focus-within:border-[#08676C]">
                <IdentificationIcon className="h-4 w-4 shrink-0 text-[#08777B]" />
                <input
                  type="text"
                  value={regNumber}
                  onChange={e => setRegNumber(e.target.value)}
                  placeholder="e.g. FRM3-26-XXXX"
                  autoComplete="username"
                  disabled={loading}
                  className="h-full w-full bg-transparent font-mono text-sm text-gray-800 outline-none"
                  required
                />
              </div>
            </div>

            {/* Checkbox */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-[#527174]">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="h-3.5 w-3.5 rounded accent-[#08676C]"
                />
                Remember me
              </label>
            </div>

            {/* Error Message */}
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || serverStatus?.status === 'offline'}
              className="group flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#00656B] to-[#008C8B] text-sm font-extrabold text-white shadow-md transition hover:brightness-105 active:scale-[0.98] disabled:opacity-60"
            >
              {loading ? (
                <span>Signing in...</span>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Portal Switch Link */}
        <button
          onClick={() => navigate('/teacher/login')}
          className="mt-4 flex items-center gap-1 text-xs font-semibold text-[#08676C] hover:underline"
        >
          Teacher / Admin Portal <ArrowRightIcon className="w-3 h-3" />
        </button>
      </div>

      <style>{`
        .learner-login-wave-fill {
          fill: #F0FAF9;
        }
        @media (orientation: portrait) {
          .learner-login-page {
            background-color: #01919F;
          }
          .learner-login-wave-fill {
            fill: #01919F;
          }
        }
      `}</style>
    </div>
  );
};

export default LearnerLogin;