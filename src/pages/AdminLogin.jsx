import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheckIcon, EnvelopeIcon, LockClosedIcon, ArrowRightIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import api from '../../services/api';

export default function AdminLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  const validate = () => {
    const e = {};
    if (!formData.email.trim())            e.email    = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) e.email = 'Enter a valid email address';
    if (!formData.password)                e.password = 'Password is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (evt) => {
    evt.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const response = await api.post('/api/auth/admin/login', {
        email: formData.email,
        password: formData.password,
      });
      if (response.data.success) {
        const { token, user } = response.data;
        await login(user, token);
        toast.success(`Welcome back, ${user.name || 'Administrator'}!`);
        navigate('/admin');
      } else {
        toast.error('Invalid admin credentials. Please try again.');
      }
    } catch (err) {
      if (err.response?.status === 401)      toast.error('Invalid email or password');
      else if (err.response?.status === 403) toast.error('Access denied. Admin privileges required.');
      else                                   toast.error('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = () => { setFormData({ email: 'admin@eduportal.com', password: 'admin123' }); setErrors({}); };

  return (
    <div className="min-h-screen flex">
      {/* ── Left panel: hero image ─────────────────────────────────────────── */}
      <div
        className="hidden lg:flex lg:w-1/2 xl:w-3/5 relative items-end"
        style={{ backgroundImage: "url('/image2.png')", backgroundSize: 'cover', backgroundPosition: 'center' }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A1929]/85 via-[#00676B]/15 to-transparent" />
        <div className="relative z-10 p-10 text-white">
          <h2 className="text-4xl font-black leading-tight drop-shadow">
            Admin Portal<br />Progress Secondary School
          </h2>
          <p className="mt-3 text-white/80 text-base font-medium max-w-sm">
            Full system control — manage learners, teachers, content, and reports from one place.
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
          {/* Back */}
          <button
            onClick={() => navigate('/')}
            className="mb-6 flex items-center gap-1.5 text-sm font-bold text-[#00676B] hover:text-[#073F43] transition"
          >
            <ArrowLeftIcon className="w-4 h-4" /> Back to Home
          </button>

          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-20 h-20 rounded-2xl bg-[#073F43] shadow-lg flex items-center justify-center mb-4">
              <ShieldCheckIcon className="w-11 h-11 text-[#F3C34A]" />
            </div>
            <h1 className="text-2xl font-black text-[#073F43]">Admin Sign In</h1>
            <p className="text-sm text-[#527174] mt-1">Progress Secondary School</p>
            <div className="w-16 h-1 rounded-full bg-gradient-to-r from-[#073F43] to-[#F3C34A] mt-3" />
          </div>

          {/* Card */}
          <div className="bg-white rounded-[22px] border border-[#D3EEEE] shadow-[0_8px_28px_rgba(0,91,96,0.10)] overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-[#073F43] via-[#00676B] to-[#F3C34A]" />

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Email */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-black uppercase tracking-wider text-[#527174]">
                  Email Address
                </label>
                <div className="relative">
                  <EnvelopeIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#00777A]" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => { setFormData({ ...formData, email: e.target.value }); if (errors.email) setErrors({ ...errors, email: null }); }}
                    placeholder="admin@eduportal.com"
                    className={`w-full pl-9 pr-4 py-3 rounded-xl border-2 bg-[#F6FDFD] text-[#073F43] text-sm placeholder-slate-400 focus:outline-none focus:ring-4 transition ${errors.email ? 'border-red-400 focus:border-red-400 focus:ring-red-100' : 'border-[#D3EEEE] focus:border-[#00777A] focus:ring-[#00777A]/10'}`}
                  />
                </div>
                {errors.email && <p className="text-xs text-red-500 ml-1">{errors.email}</p>}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-black uppercase tracking-wider text-[#527174]">
                  Password
                </label>
                <div className="relative">
                  <LockClosedIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#00777A]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={e => { setFormData({ ...formData, password: e.target.value }); if (errors.password) setErrors({ ...errors, password: null }); }}
                    placeholder="Enter your password"
                    className={`w-full pl-9 pr-10 py-3 rounded-xl border-2 bg-[#F6FDFD] text-[#073F43] text-sm placeholder-slate-400 focus:outline-none focus:ring-4 transition ${errors.password ? 'border-red-400 focus:border-red-400 focus:ring-red-100' : 'border-[#D3EEEE] focus:border-[#00777A] focus:ring-[#00777A]/10'}`}
                  />
                  <button type="button" onClick={() => setShowPassword(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#00676B] transition">
                    {showPassword ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    )}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-red-500 ml-1">{errors.password}</p>}
              </div>

              {/* Demo credentials */}
              <div className="rounded-xl bg-[#F0FAF8] border border-[#D3EEEE] px-4 py-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-black text-[#073F43]">Demo Access</span>
                  <button type="button" onClick={fillDemo}
                    className="text-xs font-bold text-[#00676B] hover:text-[#073F43] transition">
                    Fill credentials
                  </button>
                </div>
                <div className="space-y-1 text-xs text-[#527174]">
                  <div className="flex items-center gap-2">
                    <span className="w-16 text-slate-400">Email:</span>
                    <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-[#D3EEEE] text-[#073F43]">admin@eduportal.com</code>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-16 text-slate-400">Password:</span>
                    <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-[#D3EEEE] text-[#073F43]">admin123</code>
                  </div>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#073F43] via-[#00676B] to-[#00565B] text-white font-black text-sm shadow-md hover:brightness-110 active:scale-[0.98] transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Authenticating…
                  </>
                ) : (
                  <>
                    <ShieldCheckIcon className="w-5 h-5" />
                    Access Admin Panel
                    <ArrowRightIcon className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Footer */}
            <div className="border-t border-[#D8EEEE] bg-[#F0FAF8] px-6 py-4 text-center">
              <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
                <LockClosedIcon className="w-3.5 h-3.5" />
                <span>256-bit encrypted · Admin only access</span>
              </div>
            </div>
          </div>

          <p className="text-center text-xs text-slate-400 mt-5">
            Authorised personnel only
          </p>
        </div>
      </div>
    </div>
  );
}
