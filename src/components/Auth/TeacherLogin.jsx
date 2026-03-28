import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  LockClosedIcon, 
  UserIcon, 
  AcademicCapIcon,
  ChevronRightIcon 
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function TeacherLogin() {
  const navigate = useNavigate();
  const { teacherLogin } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
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
      const result = await teacherLogin({
        username: formData.username,
        password: formData.password
      });

      if (result.success) {
        toast.success(`Welcome back, ${result.user?.name || 'Educator'}!`, {
          style: { background: '#0D1B2A', color: '#fff', borderRadius: '10px' }
        });
        navigate('/teacher/dashboard');
      } else {
        toast.error(result.message || 'Login failed');
      }
    } catch (error) {
      toast.error('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-[340px]">
        
        {/* Header: Enlarged Logo & Teacher Branding */}
        <div className="text-center mb-10">
          <div className="relative inline-block mb-6">
            <img 
              src="/school-logo.jpeg" 
              alt="Progress Schools" 
              className="w-32 h-32 mx-auto object-contain transition-transform duration-500 hover:scale-105" 
            />
            {/* Educator Badge */}
            <div className="absolute bottom-2 right-2 bg-[#00B0FF] p-1.5 rounded-full border-4 border-white shadow-lg">
              <AcademicCapIcon className="w-4 h-4 text-white" />
            </div>
          </div>
          
          <h1 className="text-2xl font-black text-[#0D1B2A] tracking-tight uppercase">
            Teacher <span className="text-[#00B0FF]">Login</span>
          </h1>
          <div className="w-10 h-1 bg-[#f6de94] mx-auto mt-2 rounded-full" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Username Field */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
              Staff Username
            </label>
            <div className={`flex items-center bg-white border rounded-lg px-4 py-3.5 transition-all
              ${errors.username ? 'border-red-500' : 'border-[#00B0FF]/40 focus-within:border-[#00B0FF] focus-within:ring-4 focus-within:ring-[#00B0FF]/5'}`}>
              <UserIcon className="w-5 h-5 text-[#00B0FF] mr-3 opacity-60" />
              <input
                type="text"
                placeholder="Enter username"
                value={formData.username}
                onChange={(e) => {
                  setFormData({...formData, username: e.target.value});
                  if (errors.username) setErrors({...errors, username: null});
                }}
                className="w-full bg-transparent outline-none text-[#0D1B2A] font-semibold text-sm placeholder:text-slate-300"
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
              Password
            </label>
            <div className={`flex items-center bg-white border rounded-lg px-4 py-3.5 transition-all
              ${errors.password ? 'border-red-500' : 'border-[#00B0FF]/40 focus-within:border-[#00B0FF] focus-within:ring-4 focus-within:ring-[#00B0FF]/5'}`}>
              <LockClosedIcon className="w-5 h-5 text-[#00B0FF] mr-3 opacity-60" />
              <input
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => {
                  setFormData({...formData, password: e.target.value});
                  if (errors.password) setErrors({...errors, password: null});
                }}
                className="w-full bg-transparent outline-none text-[#0D1B2A] font-semibold text-sm placeholder:text-slate-300"
              />
            </div>
          </div>

          {errors.username || errors.password ? (
            <p className="text-red-500 text-[10px] font-bold text-center uppercase py-1">
              {errors.username || errors.password}
            </p>
          ) : null}

          {/* Button: Midnight Navy */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-[#0D1B2A] text-white rounded-lg font-bold text-[11px] uppercase tracking-[0.2em] shadow-lg shadow-[#0D1B2A]/15 hover:bg-[#162a3f] active:transform active:scale-[0.98] transition-all disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                Access Dashboard
                <ChevronRightIcon className="w-3 h-3 stroke-[3px]" />
              </>
            )}
          </button>
        </form>

        {/* Footer Security Note */}
        <div className="mt-16 text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-50 rounded-full border border-slate-100">
            <div className="w-1.5 h-1.5 bg-[#00B0FF] rounded-full animate-pulse" />
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
              Educator Portal Active
            </span>
          </div>
          <p className="text-[9px] font-bold text-slate-300 uppercase tracking-[0.3em]">
            Progress Secondary School
          </p>
        </div>
      </div>
    </div>
  );
}