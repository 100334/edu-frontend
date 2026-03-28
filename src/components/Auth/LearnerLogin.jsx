import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { UserIcon, IdentificationIcon } from '@heroicons/react/24/outline';

const LearnerLogin = ({ serverStatus }) => {
  const [name, setName] = useState('');
  const [regNumber, setRegNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { learnerLogin } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    if (!name || !regNumber) {
      setError('Credentials required');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const result = await learnerLogin({ name, regNumber: regNumber.toUpperCase() });
      if (result.success) {
        toast.success(`Welcome, ${result.user.name}`, {
          style: { background: '#0D1B2A', color: '#fff' }
        });
        navigate('/learner/dashboard');
      } else {
        setError(result.message || 'Invalid credentials');
      }
    } catch (err) {
      setError('Connection failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-[340px]">
        
        {/* Header: Enlarged Logo & Branding */}
        <div className="text-center mb-10">
          <div className="relative inline-block mb-6">
            <img 
              src="/school-logo.jpeg" 
              alt="Progress Schools" 
              className="w-32 h-32 mx-auto object-contain transition-transform duration-500 hover:scale-105" 
            />
            {/* Subtle Gold Accent Dot */}
            <div className="absolute bottom-2 right-2 w-3 h-3 bg-[#f6de94] rounded-full border-2 border-white shadow-sm" />
          </div>
          
          <h1 className="text-2xl font-black text-[#0D1B2A] tracking-tight uppercase">
            Student <span className="text-[#00B0FF]">Portal</span>
          </h1>
          <div className="w-10 h-1 bg-[#f6de94] mx-auto mt-2 rounded-full" />
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          {/* Input 1: Azure Border */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
              Full Name
            </label>
            <div className="flex items-center bg-white border border-[#00B0FF]/40 rounded-lg px-4 py-3.5 focus-within:border-[#00B0FF] focus-within:ring-4 focus-within:ring-[#00B0FF]/5 transition-all">
              <UserIcon className="w-5 h-5 text-[#00B0FF] mr-3 opacity-60" />
              <input
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-transparent outline-none text-[#0D1B2A] font-semibold text-sm placeholder:text-slate-300"
              />
            </div>
          </div>

          {/* Input 2: Azure Border */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
              Registration Number
            </label>
            <div className="flex items-center bg-white border border-[#00B0FF]/40 rounded-lg px-4 py-3.5 focus-within:border-[#00B0FF] focus-within:ring-4 focus-within:ring-[#00B0FF]/5 transition-all">
              <IdentificationIcon className="w-5 h-5 text-[#00B0FF] mr-3 opacity-60" />
              <input
                type="text"
                placeholder="PSS/000/00"
                value={regNumber}
                onChange={(e) => setRegNumber(e.target.value.toUpperCase())}
                className="w-full bg-transparent outline-none text-[#0D1B2A] font-mono font-bold text-sm placeholder:text-slate-300 tracking-wider"
              />
            </div>
          </div>

          {error && (
            <p className="text-red-500 text-[10px] font-bold text-center uppercase py-2 bg-red-50 rounded-md">
              {error}
            </p>
          )}

          {/* Button: Navy Blue */}
          <button
            type="submit"
            disabled={loading || serverStatus?.status === 'offline'}
            className="w-full py-4 bg-[#0D1B2A] text-white rounded-lg font-bold text-[11px] uppercase tracking-[0.2em] shadow-lg shadow-[#0D1B2A]/15 hover:bg-[#162a3f] active:transform active:scale-[0.98] transition-all disabled:opacity-40"
          >
            {loading ? "Verifying..." : "Login"}
          </button>
        </form>

        <p className="mt-16 text-center text-[9px] font-bold text-slate-300 uppercase tracking-[0.3em]">
          Progress Secondary School
        </p>
      </div>
    </div>
  );
};

export default LearnerLogin;