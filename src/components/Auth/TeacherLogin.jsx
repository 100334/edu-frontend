import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';
import { UserIcon, LockClosedIcon, ArrowRightIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

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
    <main
      className="flex min-h-screen items-center justify-center bg-[#073F43] px-4 py-8"
      style={{
        backgroundImage: "linear-gradient(135deg, rgba(3, 43, 48, 0.76), rgba(8, 77, 78, 0.42)), url('/image2.png')",
        backgroundPosition: 'center',
        backgroundSize: 'cover',
      }}
    >
      <div className="w-full max-w-sm">
        <header className="mb-6 flex flex-col items-center text-center">
          <img
            src="/school-logo.jpeg"
            alt="Progress Schools"
            className="mb-3 h-14 w-14 rounded-2xl border border-white/50 bg-white object-contain shadow-sm"
            onError={e => { e.currentTarget.style.display = 'none'; }}
          />
          <p className="text-sm font-semibold text-white/85">Progress Schools</p>
          <h1 className="mt-1 text-2xl font-bold text-white">Staff sign in</h1>
        </header>

        <section className="overflow-hidden rounded-2xl border border-white/70 bg-white/95 shadow-[0_20px_60px_rgba(0,24,28,0.25)] backdrop-blur-md">
          <div className="h-1 bg-gradient-to-r from-[#00656B] to-[#E7AD20]" />
          <form onSubmit={handleLogin} className="space-y-5 p-6">
            <div>
              <label htmlFor="teacher-username" className="mb-1.5 block text-sm font-semibold text-[#29494b]">
                Username
              </label>
              <div className="flex h-12 items-center gap-3 rounded-xl border border-[#d7e6e5] bg-[#fbfdfd] px-3.5 transition focus-within:border-[#08777B] focus-within:ring-4 focus-within:ring-[#08777B]/10">
                <UserIcon className="h-5 w-5 shrink-0 text-[#08777B]" />
                <input
                  id="teacher-username"
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  autoComplete="username"
                  disabled={loading}
                  className="h-full w-full bg-transparent text-sm text-gray-800 outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="teacher-password" className="mb-1.5 block text-sm font-semibold text-[#29494b]">
                Password
              </label>
              <div className="flex h-12 items-center gap-3 rounded-xl border border-[#d7e6e5] bg-[#fbfdfd] px-3.5 transition focus-within:border-[#08777B] focus-within:ring-4 focus-within:ring-[#08777B]/10">
                <LockClosedIcon className="h-5 w-5 shrink-0 text-[#08777B]" />
                <input
                  id="teacher-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                  disabled={loading}
                  className="h-full w-full bg-transparent text-sm text-gray-800 outline-none"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(s => !s)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="shrink-0 text-[#08777B] transition hover:text-[#075B60]"
                >
                  {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                </button>
              </div>
            </div>

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
          onClick={() => navigate('/')}
          className="mx-auto mt-5 flex items-center gap-1.5 text-sm font-semibold text-white transition hover:text-white/75"
        >
          Student sign in <ArrowRightIcon className="h-4 w-4" />
        </button>
      </div>
    </main>
  );
}
