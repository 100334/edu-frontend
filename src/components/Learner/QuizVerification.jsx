import React, { useState } from 'react';
import { 
  KeyIcon, 
  ShieldCheckIcon,
  XMarkIcon,
  InformationCircleIcon,
  LockClosedIcon,
  TrophyIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import api from '../../services/api';

const QuizVerification = ({ quiz, onVerify, onCancel }) => {
  const [regNumber, setRegNumber] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');

  const handleVerify = async () => {
    if (!regNumber.trim()) {
      setError('Please enter your registration number');
      return;
    }

    setVerifying(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await api.post(`/api/quiz/${quiz.id}/verify`, {
        regNumber: regNumber.trim()
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        toast.success('Access granted! Starting quiz...', {
          style: { background: '#e6fffa', color: '#0d9488' }
        });
        onVerify(response.data.quiz);
      } else {
        setError(response.data.message || 'Invalid registration number');
        toast.error(response.data.message || 'Access denied');
      }
    } catch (error) {
      console.error('Verification error:', error);
      const errorMsg = error.response?.data?.message || 'Failed to verify access';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setVerifying(false);
    }
  };

  const getSubjectStyles = (subject) => {
    const subjectName = typeof subject === 'string' ? subject : subject?.name || '';
    switch(subjectName) {
      case 'Geography': return 'bg-cyan-50 text-cyan-700 border-cyan-100';
      case 'English': return 'bg-teal-50 text-teal-700 border-teal-100';
      case 'Biology': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  const getSubjectName = () => {
    if (typeof quiz.subject_name === 'string') return quiz.subject_name;
    if (quiz.subject && typeof quiz.subject === 'object') return quiz.subject.name;
    return 'General';
  };

  const getTargetFormColor = (targetForm) => {
    if (targetForm === 'Form 4') return 'bg-teal-100 text-teal-700 border-teal-200';
    if (targetForm === 'Form 3') return 'bg-cyan-100 text-cyan-700 border-cyan-200';
    if (targetForm === 'Form 2') return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    if (targetForm === 'Form 1') return 'bg-green-100 text-green-700 border-green-200';
    return 'bg-gray-100 text-gray-600 border-gray-200';
  };

  const subjectName = getSubjectName();

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[2rem] max-w-md w-full shadow-2xl border border-teal-100 overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-8">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 bg-teal-50 rounded-2xl flex items-center justify-center border border-teal-100">
                <ShieldCheckIcon className="w-7 h-7 text-teal-600" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-800 tracking-tight">Identity Check</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Access Protocol Required</p>
              </div>
            </div>
            <button
              onClick={onCancel}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors"
            >
              <XMarkIcon className="w-5 h-5 text-slate-400 hover:text-slate-600" />
            </button>
          </div>
          
          <div className="mb-6">
            <p className="text-sm text-slate-600 mb-2">
              You are about to start: <strong className="text-teal-600">{quiz.title}</strong>
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-tighter border ${getSubjectStyles(subjectName)}`}>
                {subjectName}
              </span>
              {quiz.target_form && quiz.target_form !== 'All' && (
                <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-tighter border ${getTargetFormColor(quiz.target_form)}`}>
                  {quiz.target_form}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-3">
              Please enter your registration number to verify your identity.
            </p>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">
                Registration Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <KeyIcon className="h-4 w-4 text-teal-400" />
                </div>
                <input
                  type="text"
                  value={regNumber}
                  onChange={(e) => {
                    setRegNumber(e.target.value.toUpperCase());
                    setError('');
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') handleVerify();
                  }}
                  placeholder="E.G., PSS/2026/001"
                  className="w-full pl-10 pr-4 py-3 bg-[#fcfdfe] border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-400 focus:border-teal-400 font-mono text-xs uppercase transition-all"
                  autoFocus
                />
              </div>
              {error && (
                <p className="mt-2 text-[10px] text-teal-600 font-bold flex items-center gap-1 px-1">
                  <InformationCircleIcon className="w-3 h-3" /> {error}
                </p>
              )}
            </div>

            {quiz.target_form === 'Form 4' && (
              <div className="bg-teal-50 rounded-2xl p-4 border border-teal-100">
                <div className="flex gap-3">
                  <TrophyIcon className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] text-teal-800 font-bold mb-1">⭐ Form 4 Assessment</p>
                    <p className="text-[9px] text-teal-700 leading-relaxed">
                      This is a Form 4 quiz. Good luck with your final examinations preparation!
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-teal-50 rounded-2xl p-4 border border-teal-100">
              <div className="flex gap-3">
                <LockClosedIcon className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] text-teal-800 font-bold mb-1">Why do we need this?</p>
                  <p className="text-[9px] text-teal-700 leading-relaxed">
                    Your unique ID ensures assessment integrity and secures your progress record.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={onCancel}
                className="flex-1 px-4 py-3 bg-white text-slate-500 rounded-xl hover:text-slate-700 transition-all font-bold text-xs border border-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleVerify}
                disabled={verifying}
                className="flex-1 px-4 py-3 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-all font-black text-xs shadow-lg shadow-teal-100 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {verifying ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Validating...
                  </>
                ) : (
                  <>
                    <ShieldCheckIcon className="w-4 h-4" />
                    Verify Identity
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizVerification;