import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AcademicCapIcon, UserGroupIcon } from '@heroicons/react/24/outline';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-ink relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 40px, rgba(201,147,58,0.1) 40px, rgba(201,147,58,0.1) 41px)`
        }} />
      </div>
      
      {/* Background Gradient */}
      <div className="absolute w-[600px] h-[600px] rounded-full bg-gradient-to-r from-teal/30 to-transparent -top-40 -right-40 blur-3xl" />

      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="mb-8">
            <div className="w-20 h-20 mx-auto bg-gold rounded-full flex items-center justify-center mb-6 shadow-lg shadow-gold/20">
              <span className="font-serif text-3xl font-black text-ink">E</span>
            </div>
            <h1 className="font-serif text-5xl font-black text-paper mb-2">
              EduPortal
            </h1>
            <p className="text-paper/50 text-sm tracking-[3px] uppercase">
              School Management System
            </p>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => navigate('/teacher/login')}
              className="w-full flex items-center gap-4 p-6 bg-gold rounded-xl text-left hover:translate-y-[-2px] transition-all shadow-lg shadow-gold/30 hover:shadow-xl hover:shadow-gold/50"
            >
              <div className="w-14 h-14 bg-white/20 rounded-lg flex items-center justify-center">
                <UserGroupIcon className="w-7 h-7 text-ink" />
              </div>
              <div>
                <div className="font-semibold text-lg text-ink">Teacher Login</div>
                <div className="text-sm text-ink/70">Manage learners, reports & attendance</div>
              </div>
            </button>

            <button
              onClick={() => navigate('/learner/login')}
              className="w-full flex items-center gap-4 p-6 bg-teal rounded-xl text-left hover:translate-y-[-2px] transition-all shadow-lg shadow-teal/30 hover:shadow-xl hover:shadow-teal/50"
            >
              <div className="w-14 h-14 bg-white/20 rounded-lg flex items-center justify-center">
                <AcademicCapIcon className="w-7 h-7 text-paper" />
              </div>
              <div>
                <div className="font-semibold text-lg text-paper">Learner Login</div>
                <div className="text-sm text-paper/70">View your report card & attendance</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}