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
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#edf6f5] via-[#f8faf9] to-[#e8f1f0] px-4 py-8">
      <div className="w-full max-w-sm">
        <header className="mb-6 flex flex-col items-center text-center">
          <img
            src="/school-logo.jpeg"
            alt="Progress Secondary School"
            className="mb-3 h-14 w-14 rounded-2xl border border-white object-contain shadow-sm"
          />
          <p className="text-sm font-semibold text-[#527174]">Progress Secondary School</p>
          <h1 className="mt-1 text-2xl font-bold text-[#073F43]">Student sign in</h1>
        </header>

        <section className="overflow-hidden rounded-2xl border border-[#dcebea] bg-white shadow-[0_16px_48px_rgba(0,55,60,0.10)]">
          <div className="h-1 bg-gradient-to-r from-[#00656B] to-[#E7AD20]" />
          <form onSubmit={handleSubmit} className="space-y-5 p-6">
            <div>
              <label htmlFor="learner-name" className="mb-1.5 block text-sm font-semibold text-[#29494b]">
                Full name
              </label>
              <div className="flex h-12 items-center gap-3 rounded-xl border border-[#d7e6e5] bg-[#fbfdfd] px-3.5 transition focus-within:border-[#08777B] focus-within:ring-4 focus-within:ring-[#08777B]/10">
                <UserIcon className="h-5 w-5 shrink-0 text-[#08777B]" />
                <input
                  id="learner-name"
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  autoComplete="name"
                  disabled={loading}
                  className="h-full w-full bg-transparent text-sm text-gray-800 outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="learner-reg-number" className="mb-1.5 block text-sm font-semibold text-[#29494b]">
                Registration number
              </label>
              <div className="flex h-12 items-center gap-3 rounded-xl border border-[#d7e6e5] bg-[#fbfdfd] px-3.5 transition focus-within:border-[#08777B] focus-within:ring-4 focus-within:ring-[#08777B]/10">
                <IdentificationIcon className="h-5 w-5 shrink-0 text-[#08777B]" />
                <input
                  id="learner-reg-number"
                  type="text"
                  value={regNumber}
                  onChange={e => setRegNumber(e.target.value)}
                  placeholder="FRM3-26-XXXX"
                  autoComplete="username"
                  disabled={loading}
                  className="h-full w-full bg-transparent font-mono text-sm text-gray-800 outline-none placeholder:text-gray-400"
                  required
                />
              </div>
            </div>

            <label className="flex cursor-pointer items-center gap-2 text-sm text-[#527174]">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded accent-[#08676C]"
              />
              Remember me
            </label>

            {error && (
              <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || serverStatus?.status === 'offline'}
              className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#006b70] text-sm font-bold text-white shadow-sm transition hover:bg-[#00585d] focus:outline-none focus:ring-4 focus:ring-[#08777B]/20 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Signing in…' : <>Sign in <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" /></>}
            </button>
          </form>
        </section>

        <button
          type="button"
          onClick={() => navigate('/teacher/login')}
          className="mx-auto mt-5 flex items-center gap-1.5 text-sm font-semibold text-[#08676C] transition hover:text-[#043f43]"
        >
          Staff sign in <ArrowRightIcon className="h-4 w-4" />
        </button>
      </div>
    </main>
  );
};

export default LearnerLogin;