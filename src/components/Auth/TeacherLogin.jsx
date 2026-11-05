import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';
import { UserIcon, LockClosedIcon, ArrowRightIcon, ArrowLeftIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

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
    if (!username.trim() || !password) { setError('Please enter your username and password.'); return; }
    setLoading(true);
    setError('');
    try {
      const result = await teacherLogin({ username: username.trim(), password });
      if (result.success) {
        toast.success(`Welcome, ${result.user?.name || 'Teacher'}!`, { icon: '🎓', duration: 4000 });
        navigate('/teacher/dashboard');
      } else {
        setError(result.message || 'Invalid teacher credentials');
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
    <div className="min-h-screen w-full bg-[#F0FAF9] flex flex-col">

      {/* ── Hero image with curved bottom ─────────────────────────────────── */}
      <div className="relative w-full shrink-0" style={{ height: '42vh', minHeight: 180, maxHeight: 320 }}>
        <img src="/image2.png" alt="" aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover object-center" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#003B3F]/40 via-transparent to-transparent" />
        <div className="absolute left-5 top-5 text-white drop-shadow">
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/80">Progress Schools</p>
          <h1 className="text-lg font-black leading-tight">Teacher Portal</h1>
        </div>
        <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none">
          <svg viewBox="0 0 1440 60" preserveAspectRatio="none" className="block w-full" style={{ height: 48 }}>
            <path d="M0,0 C360,60 1080,60 1440,0 L1440,60 L0,60 Z" fill="#F0FAF9" />
          </svg>
        </div>
      </div>

      {/* ── Compact card — overlaps the wave ──────────────────────────────── */}
      <div className="flex flex-1 flex-col items-center px-4 pb-6 -mt-14">
        <div className="w-full max-w-sm">

          {/* Logo + title */}
          <div className="mb-3 flex items-center gap-3">
            <img src="/school-logo.jpeg" alt="School logo"
              className="h-10 w-10 rounded-full object-contain shadow border border-[#D3EEEE]"
              onError={e => { e.target.style.display = 'none'; }} />
            <div>
              <p className="text-sm font-black text-[#075B60]">Progress Secondary School</p>
              <p className="text-[11px] text-[#527174]">Educator sign in</p>
            </div>
          </div>

          {/* Back link */}
          <button onClick={() => navigate('/')}
            className="mb-2 flex items-center gap-1 text-xs font-semibold text-[#08676C] hover:text-[#075B60] transition">
            <ArrowLeftIcon className="h-3 w-3" /> Back to student login
          </button>

          {/* Card */}
          <div className="overflow-hidden rounded-2xl border border-[#D3EEEE] bg-white shadow-[0_4px_20px_rgba(0,55,60,0.12)]">
            <div className="h-1 bg-gradient-to-r from-[#E7AD20] via-[#FFD95A] to-[#E7AD20]" />

            <form onSubmit={handleLogin} className="px-5 py-4 space-y-3.5">

              {/* Username */}
              <div>
                <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[#527174]">Staff Username</label>
                <div className="flex h-11 items-center gap-2.5 rounded-xl border border-[#C8E8E8] bg-[#F6FDFD] px-3.5 transition focus-within:border-[#08676C] focus-within:ring-2 focus-within:ring-[#08676C]/10">
                  <UserIcon className="h-4 w-4 shrink-0 text-[#08777B]" />
                  <input type="text" value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="Enter your username" autoComplete="username" disabled={loading}
                    className="h-full w-full bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-400" required />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[#527174]">Password</label>
                <div className="flex h-11 items-center gap-2.5 rounded-xl border border-[#C8E8E8] bg-[#F6FDFD] px-3.5 transition focus-within:border-[#08676C] focus-within:ring-2 focus-within:ring-[#08676C]/10">
                  <LockClosedIcon className="h-4 w-4 shrink-0 text-[#08777B]" />
                  <input type={showPassword ? 'text' : 'password'} value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter your password" autoComplete="current-password" disabled={loading}
                    className="h-full w-full bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-400" required />
                  <button type="button" onClick={() => setShowPassword(s => !s)}
                    className="shrink-0 text-[#08777B] hover:text-[#075B60] transition" tabIndex={-1}>
                    {showPassword ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="rounded-xl bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700 flex items-center gap-2">
                  <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </div>
              )}

              {/* Submit */}
              <button type="submit" disabled={loading || serverStatus?.status === 'offline'}
                className="group flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#00656B] to-[#008C8B] text-sm font-extrabold text-white shadow-md transition hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60">
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Signing in...
                  </>
                ) : (
                  <>Sign In <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" /></>
                )}
              </button>
            </form>
          </div>

          <div className="mt-3 flex items-center justify-between px-1">
            <p className="text-[11px] text-[#94ADAE]">Secure educator access</p>
            <button onClick={() => navigate('/')}
              className="flex items-center gap-1 text-[11px] font-semibold text-[#08676C] hover:text-[#075B60] transition">
              Student login <ArrowRightIcon className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
