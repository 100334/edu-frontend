import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { 
  EnvelopeIcon, 
  LockClosedIcon, 
  EyeIcon, 
  EyeSlashIcon,
  ArrowLeftIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';

export default function AdminLogin() {
  const navigate = useNavigate();
  const { adminLogin } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Enter a valid email';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      const result = await adminLogin({
        email: formData.email,
        password: formData.password
      });
      
      if (result.success) {
        toast.success(`Access Granted: ${result.user?.name || 'Admin'}`, {
          style: { background: '#0D1B2A', color: '#fff', borderRadius: '10px' }
        });
        navigate('/admin');
      } else {
        toast.error(result.message || 'Invalid admin credentials');
      }
    } catch (error) {
      toast.error('Connection failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 relative">
      
      {/* Back Button */}
      <button
        onClick={() => navigate('/')}
        className="absolute top-8 left-8 flex items-center gap-2 text-slate-400 hover:text-[#0D1B2A] transition-colors group"
      >
        <ArrowLeftIcon className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
        <span className="text-[10px] font-bold uppercase tracking-widest">Back to Home</span>
      </button>

      <div className="w-full max-w-[340px] relative z-10">
        
        {/* Header: Enlarged Logo & Admin Branding */}
        <div className="text-center mb-10">
          <div className="relative inline-block mb-6">
            <img 
              src="/school-logo.jpeg" 
              alt="Progress Schools" 
              className="w-32 h-32 mx-auto object-contain transition-transform duration-500 hover:scale-105" 
            />
            {/* Admin Shield Badge */}
            <div className="absolute bottom-2 right-2 bg-[#0D1B2A] p-1.5 rounded-full border-4 border-white shadow-lg">
              <ShieldCheckIcon className="w-4 h-4 text-[#00B0FF]" />
            </div>
          </div>
          
          <h1 className="text-2xl font-black text-[#0D1B2A] tracking-tight uppercase">
            Admin <span className="text-[#00B0FF]">Panel</span>
          </h1>
          <div className="w-10 h-1 bg-[#f6de94] mx-auto mt-2 rounded-full" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Email Field */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
              Admin Email
            </label>
            <div className={`flex items-center bg-white border rounded-lg px-4 py-3.5 transition-all
              ${errors.email ? 'border-red-500' : 'border-[#00B0FF]/40 focus-within:border-[#00B0FF] focus-within:ring-4 focus-within:ring-[#00B0FF]/5'}`}>
              <EnvelopeIcon className="w-5 h-5 text-[#00B0FF] mr-3 opacity-60" />
              <input
                type="email"
                placeholder="admin@school.edu"
                value={formData.email}
                onChange={(e) => {
                  setFormData({...formData, email: e.target.value});
                  if (errors.email) setErrors({...errors, email: null});
                }}
                className="w-full bg-transparent outline-none text-[#0D1B2A] font-semibold text-sm placeholder:text-slate-300"
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
              Secret Password
            </label>
            <div className={`flex items-center bg-white border rounded-lg px-4 py-3.5 transition-all
              ${errors.password ? 'border-red-500' : 'border-[#00B0FF]/40 focus-within:border-[#00B0FF] focus-within:ring-4 focus-within:ring-[#00B0FF]/5'}`}>
              <LockClosedIcon className="w-5 h-5 text-[#00B0FF] mr-3 opacity-60" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => {
                  setFormData({...formData, password: e.target.value});
                  if (errors.password) setErrors({...errors, password: null});
                }}
                className="w-full bg-transparent outline-none text-[#0D1B2A] font-semibold text-sm placeholder:text-slate-300"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="ml-2 text-slate-300 hover:text-[#00B0FF] transition-colors"
              >
                {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {errors.email || errors.password ? (
            <p className="text-red-500 text-[10px] font-bold text-center uppercase py-1">
              {errors.email || errors.password}
            </p>
          ) : null}

          {/* Button: Solid Navy */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-[#0D1B2A] text-white rounded-lg font-bold text-[11px] uppercase tracking-[0.2em] shadow-lg shadow-[#0D1B2A]/15 hover:bg-[#162a3f] active:transform active:scale-[0.98] transition-all disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : "Authenticate Access"}
          </button>
        </form>

        {/* Footer Security Note */}
        <div className="mt-16 text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-50 rounded-full border border-slate-100">
            <div className="w-1.5 h-1.5 bg-[#00B0FF] rounded-full animate-pulse" />
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
              Secure Admin Terminal
            </span>
          </div>
          <p className="text-[9px] font-bold text-slate-300 uppercase tracking-[0.3em]">
            System Authorization Required
          </p>
        </div>
      </div>
    </div>
  );
}