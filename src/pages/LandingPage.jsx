import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AcademicCapIcon, UserGroupIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0f1923] relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 40px, rgba(201,147,58,0.1) 40px, rgba(201,147,58,0.1) 41px)`
        }} />
      </div>
      
      {/* Background Gradient */}
      <div className="absolute w-[600px] h-[600px] rounded-full bg-gradient-to-r from-[#2a9090]/30 to-transparent -top-40 -right-40 blur-3xl" />

      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="mb-8">
            <div className="w-20 h-20 mx-auto bg-[#c9933a] rounded-full flex items-center justify-center mb-6 shadow-lg shadow-[#c9933a]/20">
              <span className="font-serif text-3xl font-black text-[#0f1923]">E</span>
            </div>
            <h1 className="font-serif text-5xl font-black text-white mb-2">
              EduPortal
            </h1>
            <p className="text-white/50 text-sm tracking-[3px] uppercase">
              School Management System
            </p>
          </div>

          <div className="space-y-4">
            {/* Teacher Login */}
            <button
              onClick={() => navigate('/teacher/login')}
              className="w-full flex items-center gap-4 p-6 bg-[#c9933a] rounded-xl text-left hover:translate-y-[-2px] transition-all shadow-lg shadow-[#c9933a]/30 hover:shadow-xl hover:shadow-[#c9933a]/50"
            >
              <div className="w-14 h-14 bg-white/20 rounded-lg flex items-center justify-center">
                <UserGroupIcon className="w-7 h-7 text-[#0f1923]" />
              </div>
              <div>
                <div className="font-semibold text-lg text-[#0f1923]">Teacher Login</div>
                <div className="text-sm text-[#0f1923]/70">Manage learners, reports & attendance</div>
              </div>
            </button>

            {/* Learner Login */}
            <button
              onClick={() => navigate('/learner/login')}
              className="w-full flex items-center gap-4 p-6 bg-[#2a9090] rounded-xl text-left hover:translate-y-[-2px] transition-all shadow-lg shadow-[#2a9090]/30 hover:shadow-xl hover:shadow-[#2a9090]/50"
            >
              <div className="w-14 h-14 bg-white/20 rounded-lg flex items-center justify-center">
                <AcademicCapIcon className="w-7 h-7 text-white" />
              </div>
              <div>
                <div className="font-semibold text-lg text-white">Learner Login</div>
                <div className="text-sm text-white/70">View your report card & attendance</div>
              </div>
            </button>

            {/* Admin Login - NEW BUTTON */}
            <button
              onClick={() => navigate('/admin/login')}
              className="w-full flex items-center gap-4 p-6 bg-[#0f1923] border border-[#c9933a]/30 rounded-xl text-left hover:translate-y-[-2px] transition-all shadow-lg hover:shadow-[#c9933a]/20 hover:border-[#c9933a]/50"
            >
              <div className="w-14 h-14 bg-[#c9933a]/10 rounded-lg flex items-center justify-center">
                <ShieldCheckIcon className="w-7 h-7 text-[#c9933a]" />
              </div>
              <div>
                <div className="font-semibold text-lg text-white">Admin Login</div>
                <div className="text-sm text-white/60">Manage teachers, learners & credentials</div>
              </div>
            </button>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-white/10">
            <p className="text-xs text-white/40">
              Secure portal for EduPortal School Management System
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}