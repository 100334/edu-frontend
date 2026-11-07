import React, { useState, useEffect } from 'react';
import { 
  ClockIcon, TrophyIcon, CheckCircleIcon, StarIcon,
  ShieldCheckIcon, LockClosedIcon, SparklesIcon,
  AcademicCapIcon, ChatBubbleLeftRightIcon, ChevronRightIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import api from '../../services/api';

const canAccessQuizForm = (learnerForm, targetForm) => {
  if (!targetForm || targetForm === 'All' || targetForm === learnerForm) return true;
  return learnerForm === 'Form 4' && targetForm === 'Form 3';
};

const QuizList = ({ onStartQuiz }) => {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quizHistory, setQuizHistory] = useState({});
  const [learnerForm, setLearnerForm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState(null);

  useEffect(() => {
    loadQuizzes();
    loadHistory();
    getLearnerForm();
  }, []);

  const getLearnerForm = async () => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user.form) setLearnerForm(user.form);
      }
    } catch (error) {
}
  };

  const loadQuizzes = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.get('/api/quiz/quizzes', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setQuizzes(response.data.quizzes || []);
        if (response.data.learner_form) setLearnerForm(response.data.learner_form);
      } else {
        setQuizzes([]);
      }
    } catch (error) {
setQuizzes([]);
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.get('/api/quiz/history', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success && response.data.attempts) {
        const historyMap = {};
        response.data.attempts.forEach(attempt => {
          historyMap[attempt.quiz_id] = {
            ...attempt,
            marks_earned: attempt.marks_earned ?? attempt.earned_points ?? 0,
            total_marks: attempt.total_marks ?? attempt.total_points ?? 0,
            percentage: attempt.percentage ?? (attempt.marks_earned && attempt.total_marks ? (attempt.marks_earned / attempt.total_marks * 100) : 0),
          };
        });
        setQuizHistory(historyMap);
      }
    } catch (error) {
}
  };

  const getQuizId = (quiz) => {
    const id = quiz.id || quiz.int_id;
    return (typeof id === 'string' && /^\d+$/.test(id)) ? parseInt(id, 10) : id;
  };

  const getSubjectStyles = (subject) => {
    const name = typeof subject === 'string' ? subject : subject?.name || '';
    switch(name) {
      case 'Geography': return 'bg-cyan-50 text-cyan-700 border-cyan-100';
      case 'English': return 'bg-teal-50 text-teal-700 border-teal-100';
      case 'Biology': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  const quizzesBySubject = quizzes.reduce((groups, quiz) => {
    const subject = quiz.subject_name || quiz.subject?.name ||
      (typeof quiz.subject === 'string' ? quiz.subject : 'General');
    if (!groups[subject]) groups[subject] = [];
    groups[subject].push(quiz);
    return groups;
  }, {});
  const subjects = Object.keys(quizzesBySubject).sort((a, b) => a.localeCompare(b));

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center py-24 gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-100 border-t-[#00777A]"></div>
        <p className="text-navy-900 font-medium animate-pulse">Syncing assessments...</p>
      </div>
    );
  }

  if (!quizzes.length) {
    return (
      <div className="bg-white rounded-[2rem] p-16 text-center border border-[#D3EEEE] shadow-sm">
        <SparklesIcon className="w-16 h-16 mx-auto text-[#8DE5E1] mb-6" />
        <h3 className="text-2xl font-black text-[#00565B] mb-2">No assessments yet</h3>
        <p className="text-slate-500 max-w-xs mx-auto">New assessments will appear here as they are published by your instructors.</p>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-700">
      {/* Header Section */}
      <div
        className="mb-8 flex flex-col gap-5 rounded-2xl border-b-2 border-[#F3C34A] px-5 py-6 text-white shadow-sm sm:px-7 md:flex-row md:items-center md:justify-between"
        style={{
          backgroundColor: '#003B46',
          backgroundImage: "linear-gradient(90deg, rgba(0, 59, 70, 0.96), rgba(0, 103, 112, 0.82)), url('/image2.png')",
          backgroundPosition: 'center 38%',
          backgroundSize: 'cover',
        }}
      >
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl border border-[#F3C34A]/70 bg-white/10">
              <AcademicCapIcon className="w-6 h-6 text-[#F3C34A]" />
            </div>
            <h2 className="text-3xl font-black tracking-tight text-white">
              {selectedSubject ? `Assessment / ${selectedSubject}` : 'Assessment'}
            </h2>
          </div>
        </div>

        {learnerForm && (
          <div className="flex items-center gap-3 rounded-2xl border border-white/20 bg-white/10 px-5 py-2.5 shadow-sm backdrop-blur-sm">
            <ShieldCheckIcon className="w-5 h-5 text-[#F3C34A]" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest leading-none text-white/65">Your class</p>
              <p className="text-sm font-black text-white">{learnerForm}</p>
            </div>
          </div>
        )}
        {selectedSubject && (
          <button
            type="button"
            onClick={() => setSelectedSubject(null)}
            className="rounded-full border border-white/30 bg-white/10 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/20"
          >
            ← Folders
          </button>
        )}
      </div>

      {!selectedSubject ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {subjects.map(subject => (
            <button
              key={subject}
              type="button"
              onClick={() => setSelectedSubject(subject)}
              className="group flex flex-col items-center gap-2 rounded-xl border border-gray-200 bg-white p-4 transition-all duration-200 hover:border-[#00777A]/40 hover:shadow-sm active:scale-95"
            >
              <svg viewBox="0 0 56 44" fill="none" xmlns="http://www.w3.org/2000/svg"
                className="h-11 w-14 flex-shrink-0 transition-transform group-hover:scale-105">
                <rect x="0" y="0" width="20" height="7" rx="3" fill="#F5C842" />
                <rect x="0" y="5" width="56" height="36" rx="4" fill="#F5C842" />
                <rect x="0" y="5" width="56" height="8" rx="4" fill="#F9D85A" opacity="0.6" />
              </svg>
              <div className="w-full text-center">
                <p className="truncate text-xs font-bold leading-tight text-slate-700">{subject}</p>
                <p className="mt-0.5 text-[10px] text-slate-400">
                  {quizzesBySubject[subject].length} {quizzesBySubject[subject].length === 1 ? 'quiz' : 'quizzes'}
                </p>
              </div>
            </button>
          ))}
        </div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {quizzesBySubject[selectedSubject].map((quiz) => {
          const quizId = getQuizId(quiz);
          const attempted = quizHistory[quizId];
          const isCompleted = attempted?.status === 'completed';
          const score = Math.round(attempted?.percentage || 0);
          const isRestricted = !canAccessQuizForm(learnerForm, quiz.target_form);
          const startTime = quiz.scheduled_start ? new Date(quiz.scheduled_start) : null;
          const endTime = quiz.scheduled_end ? new Date(quiz.scheduled_end) : null;
          const now = new Date();
          const isUpcoming = startTime && now < startTime;
          const isClosed = endTime && now > endTime;
          const attemptsUsed = Number(quiz.attempts_used) || 0;
          const maxAttempts = Number(quiz.max_attempts) || 2;
          const attemptsExhausted = attemptsUsed >= maxAttempts;
          const canStart = !isRestricted && !isUpcoming && !isClosed && !attemptsExhausted;

          return (
            <div key={quizId} className="group relative bg-white rounded-[2rem] border border-[#D3EEEE] shadow-sm hover:shadow-2xl hover:shadow-[#00777A]/10 transition-all duration-500 flex flex-col overflow-hidden">
              
              {/* Scheduling Tooltip */}
              {(isUpcoming || isClosed) && (
                <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                  <div className="bg-slate-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg max-w-xs">
                    <div className="font-semibold mb-1">
                      {isUpcoming ? 'Available Starting:' : 'Assessment Closed'}
                    </div>
                    {startTime && (
                      <div className="text-slate-300">
                        📅 {startTime.toLocaleDateString()} <br />
                        🕐 {startTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </div>
                    )}
                    {endTime && (
                      <div className="text-slate-300 mt-1">
                        📅 Ends: {endTime.toLocaleDateString()} <br />
                        🕐 {endTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Restricted Overlay */}
              {isRestricted && !isCompleted && (
                <div className="absolute inset-0 bg-[#0F172A]/40 backdrop-blur-[2px] z-20 flex items-center justify-center p-6">
                  <div className="bg-white rounded-2xl p-6 text-center shadow-xl transform group-hover:scale-105 transition-transform">
                    <LockClosedIcon className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm font-black text-[#0F172A] mb-1">Access Locked</p>
                    <p className="text-xs text-slate-500">Requires {quiz.target_form}</p>
                  </div>
                </div>
              )}

              <div className="p-8 flex flex-col h-full">
                {/* Subject & Status */}
                <div className="flex justify-between items-start mb-6">
                  <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${getSubjectStyles(quiz.subject_name)}`}>
                    {quiz.subject_name || 'General'}
                  </span>
                  {isCompleted && (
                    <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter">
                      <CheckCircleIcon className="w-3.5 h-3.5" />
                      Passed
                    </div>
                  )}
                </div>

                {/* Title & Info */}
                <h3 className="text-xl font-black text-[#0F172A] mb-3 line-clamp-1 group-hover:text-[#00777A] transition-colors">
                  {quiz.title}
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed line-clamp-2 mb-6 flex-grow">
                  {quiz.description || "Revise the key ideas through these practice questions."}
                </p>

                {/* Stats Row */}
                <div className="flex items-center gap-4 mb-8">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Duration</span>
                    <div className="flex items-center gap-1 text-[#0F172A] font-bold text-sm">
                      <ClockIcon className="w-3.5 h-3.5" /> {quiz.duration || 30}m
                    </div>
                  </div>
                  <div className="w-px h-8 bg-slate-100"></div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Questions</span>
                    <div className="flex items-center gap-1 text-[#0F172A] font-bold text-sm">
                      <TrophyIcon className="w-3.5 h-3.5" /> {quiz.question_count || 0}
                    </div>
                  </div>
                </div>
                {attemptsUsed > 0 && (
                  <p className="mb-4 text-xs font-medium text-slate-500">
                    Attempts used: {attemptsUsed} of {maxAttempts}
                  </p>
                )}

                {/* Action / Results Area */}
                {isCompleted ? (
                  <div className="bg-[#F8FAFC] rounded-2xl p-5 border border-slate-100">
                    <div className="flex justify-between items-end mb-3">
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Best Performance</p>
                        <p className="text-2xl font-black text-[#0F172A]">{score}%</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-[#00777A]">{attempted.marks_earned}/{attempted.total_marks} Pts</p>
                      </div>
                    </div>
                    <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-[#00777A] to-[#F3C34A] rounded-full transition-all duration-1000"
                        style={{ width: `${score}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => onStartQuiz(getQuizId(quiz))}
                    disabled={!canStart}
                    className={`w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all duration-300 ${canStart ? 'bg-[#005C62] text-white hover:bg-[#00777A] hover:shadow-[#00777A]/30' : 'bg-slate-200 text-slate-500 cursor-not-allowed'}`}
                  >
                    {attemptsExhausted ? '🔒 Attempts Used' : isUpcoming ? '⏰ Coming Soon' : isClosed ? '🔒 Closed' : 'Take Assessment'}
                    <ChevronRightIcon className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      )}
    </div>
  );
};

export default QuizList;