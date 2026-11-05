import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserGroupIcon, LockClosedIcon, ArrowRightIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import api from '../services/api';

export default function TeacherLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!formData.username.trim()) e.username = 'Username is required';
    if (!formData.password)        e.password = 'Password is required';
    else if (formData.password.length < 6) e.password = 'Password must be at least 6 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (evt) => {
    evt.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const response = await api.post('/auth/teacher/login', {
        username: formData.username,
        password: formData.password,
      });
      if (response.data.success) {
        await login(response.data.user, response.data.token);
        toast.success(`Welcome back, ${response.data.user.name || 'Teacher'}!`);
        navigate('/teacher/dashboard');
      } else {
        toast.error(response.data.message || 'Login failed');
      }
    } catch (err) {
      if (err.response) toast.error(err.response.data.message || 'Invalid credentials');
      else toast.error('Cannot reach server. Please try again.');
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
        <div className="absolute inset-0 bg-gradient-to-t from-[#003B3F]/80 via-[#00676B]/20 to-transparent" />
        <div className="relative z-10 p-10 text-white">
          <h2 className="text-4xl font-black leading-tight drop-shadow">
            Educator Portal<br />Progress Secondary School
          </h2>
          <p className="mt-3 text-white/80 text-base font-medium max-w-sm">
            Manage your learners, track attendance, upload lessons and generate reports.
          </p>
        </div>
      </div>

      {/* ── Right panel: form ──────────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 relative bg-[#F2FBFC]">
        {/* Mobile: faint image bg */}
        <div
          className="absolute inset-0 lg:hidden opacity-[0.07]"
          style={{ backgroundImage: "url('/image2.png')", backgroundSize: 'cover', backgroundPosition: 'center' }}
        />

        <div className="relative z-10 w-full max-w-sm">
          {/* Back to student login */}
          <button
            onClick={() => navigate('/learner/login')}
            className="mb-6 flex items-center gap-1.5 text-sm font-bold text-[#00676B] hover:text-[#073F43] transition"
          >
            <ArrowLeftIcon className="w-4 h-4" /> Student Login
          </button>

          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-20 h-20 rounded-2xl bg-[#00676B] shadow-lg flex items-center justify-center mb-4">
              <UserGroupIcon className="w-11 h-11 text-white" />
            </div>
            <h1 className="text-2xl font-black text-[#073F43]">Teacher Sign In</h1>
            <p className="text-sm text-[#527174] mt-1">Progress Secondary School</p>
            <div className="w-16 h-1 rounded-full bg-gradient-to-r from-[#00676B] to-[#F3C34A] mt-3" />
          </div>

          {/* Card */}
          <div className="bg-white rounded-[22px] border border-[#D3EEEE] shadow-[0_8px_28px_rgba(0,91,96,0.10)] overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-[#009B9D] via-[#00777C] to-[#F3C34A]" />

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Username */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-black uppercase tracking-wider text-[#527174]">
                  Username
                </label>
                <div className="relative">
                  <UserGroupIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#00777A]" />
                  <input
                    type="text"
                    value={formData.username}
                    onChange={e => { setFormData({ ...formData, username: e.target.value }); if (errors.username) setErrors({ ...errors, username: null }); }}
                    placeholder="Enter your username"
                    className={`w-full pl-9 pr-4 py-3 rounded-xl border-2 bg-[#F6FDFD] text-[#073F43] text-sm placeholder-slate-400 focus:outline-none focus:ring-4 transition ${errors.username ? 'border-red-400 focus:border-red-400 focus:ring-red-100' : 'border-[#D3EEEE] focus:border-[#00777A] focus:ring-[#00777A]/10'}`}
                  />
                </div>
                {errors.username && <p className="text-xs text-red-500 ml-1">{errors.username}</p>}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-black uppercase tracking-wider text-[#527174]">
                  Password
                </label>
                <div className="relative">
                  <LockClosedIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#00777A]" />
                  <input
                    type="password"
                    value={formData.password}
                    onChange={e => { setFormData({ ...formData, password: e.target.value }); if (errors.password) setErrors({ ...errors, password: null }); }}
                    placeholder="Enter your password"
                    className={`w-full pl-9 pr-4 py-3 rounded-xl border-2 bg-[#F6FDFD] text-[#073F43] text-sm placeholder-slate-400 focus:outline-none focus:ring-4 transition ${errors.password ? 'border-red-400 focus:border-red-400 focus:ring-red-100' : 'border-[#D3EEEE] focus:border-[#00777A] focus:ring-[#00777A]/10'}`}
                  />
                </div>
                {errors.password && <p className="text-xs text-red-500 ml-1">{errors.password}</p>}
              </div>

              {/* Demo hint */}
              <div className="rounded-xl bg-[#F0FAF8] border border-[#D3EEEE] px-4 py-3 text-xs text-[#527174]">
                <span className="font-bold text-[#00676B]">Demo:</span> username{' '}
                <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-[#D3EEEE]">admin</code> · password{' '}
                <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-[#D3EEEE]">password123</code>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#009B9D] via-[#00777C] to-[#00585F] text-white font-black text-sm shadow-md hover:brightness-105 active:scale-[0.98] transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Signing in…
                  </>
                ) : (
                  <>
                    <UserGroupIcon className="w-5 h-5" />
                    Access Dashboard
                    <ArrowRightIcon className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Footer */}
            <div className="border-t border-[#D8EEEE] bg-[#F0FAF8] px-6 py-4 flex items-center justify-between">
              <span className="text-sm text-[#527174]">Are you a student?</span>
              <button
                onClick={() => navigate('/learner/login')}
                className="flex items-center gap-1 text-sm font-black text-[#00676B] hover:text-[#073F43] transition"
              >
                Sign in here <ArrowRightIcon className="w-4 h-4" />
              </button>
            </div>
          </div>

          <p className="text-center text-xs text-slate-400 mt-5">
            Secure access for educators only
          </p>
        </div>
      </div>
    </div>
  );
}
