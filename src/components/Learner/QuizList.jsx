import React, { useState, useEffect } from 'react';
import { 
  ClockIcon, TrophyIcon, CheckCircleIcon, StarIcon,
  ShieldCheckIcon, LockClosedIcon, SparklesIcon,
  AcademicCapIcon, ChatBubbleLeftRightIcon, ChevronRightIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import api from '../../services/api';

const QuizList = ({ onStartQuiz }) => {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quizHistory, setQuizHistory] = useState({});
  const [learnerForm, setLearnerForm] = useState('');

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
      console.error('Error getting learner form:', error);
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
      console.error('Error loading quizzes:', error);
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
      console.error('Error loading history:', error);
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
      case 'English': return 'bg-indigo-50 text-indigo-700 border-indigo-100';
      case 'Biology': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center py-24 gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-100 border-t-[#007FFF]"></div>
        <p className="text-navy-900 font-medium animate-pulse">Syncing assessments...</p>
      </div>
    );
  }

  if (!quizzes.length) {
    return (
      <div className="bg-white rounded-[2rem] p-16 text-center border border-slate-100 shadow-sm">
        <SparklesIcon className="w-16 h-16 mx-auto text-slate-200 mb-6" />
        <h3 className="text-2xl font-black text-[#0F172A] mb-2">Hub Empty</h3>
        <p className="text-slate-500 max-w-xs mx-auto">New assessments will appear here as they are published by your instructors.</p>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-[#007FFF] rounded-xl shadow-lg shadow-blue-500/20">
              <AcademicCapIcon className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-3xl font-black text-[#0F172A] tracking-tight">Assessment Hub</h2>
          </div>
          <p className="text-slate-500 font-medium">Test your mastery across active modules</p>
        </div>

        {learnerForm && (
          <div className="px-5 py-2.5 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
            <ShieldCheckIcon className="w-5 h-5 text-[#007FFF]" />
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Your Level</p>
              <p className="text-sm font-black text-[#0F172A]">{learnerForm}</p>
            </div>
          </div>
        )}
      </div>

      {/* Quiz Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {quizzes.map((quiz) => {
          const quizId = getQuizId(quiz);
          const attempted = quizHistory[quizId];
          const isCompleted = attempted?.status === 'completed';
          const score = Math.round(attempted?.percentage || 0);
          const isRestricted = quiz.target_form && quiz.target_form !== 'All' && quiz.target_form !== learnerForm;

          return (
            <div key={quizId} className="group relative bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500 flex flex-col overflow-hidden">
              
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
                <h3 className="text-xl font-black text-[#0F172A] mb-3 line-clamp-1 group-hover:text-[#007FFF] transition-colors">
                  {quiz.title}
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed line-clamp-2 mb-6 flex-grow">
                  {quiz.description || "Master the core concepts of this module through this structured assessment."}
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

                {/* Action / Results Area */}
                {isCompleted ? (
                  <div className="bg-[#F8FAFC] rounded-2xl p-5 border border-slate-100">
                    <div className="flex justify-between items-end mb-3">
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Best Performance</p>
                        <p className="text-2xl font-black text-[#0F172A]">{score}%</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-[#007FFF]">{attempted.marks_earned}/{attempted.total_marks} Pts</p>
                      </div>
                    </div>
                    <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-[#007FFF] to-[#0F172A] rounded-full transition-all duration-1000"
                        style={{ width: `${score}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => onStartQuiz(getQuizId(quiz))}
                    disabled={isRestricted}
                    className="w-full py-4 bg-[#0F172A] text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-navy-900/20 hover:bg-[#007FFF] hover:shadow-blue-500/30 transition-all duration-300 group/btn"
                  >
                    Take Assessment
                    <ChevronRightIcon className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default QuizList;