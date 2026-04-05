import React, { useState, useEffect } from 'react';
import { 
  ClockIcon, 
  TrophyIcon, 
  CheckCircleIcon,
  StarIcon,
  ShieldCheckIcon,
  LockClosedIcon,
  InformationCircleIcon,
  PhotoIcon,
  SparklesIcon,
  AcademicCapIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import api from '../../services/api';

const QuizList = ({ onStartQuiz }) => {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quizHistory, setQuizHistory] = useState({});
  const [verifyingQuiz, setVerifyingQuiz] = useState(null);
  const [regNumber, setRegNumber] = useState('');
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState('');
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
        const quizzesData = response.data.quizzes || [];
        console.log('📚 Loaded quizzes (first item):', quizzesData[0]); // DEBUG
        setQuizzes(quizzesData);
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
            feedback: attempt.feedback || null
          };
        });
        setQuizHistory(historyMap);
      }
    } catch (error) {
      console.error('Error loading history:', error);
    }
  };

  // Get the integer quiz ID (supports both int_id and id)
  const getQuizId = (quiz) => {
    // Prefer int_id if it's a number
    if (quiz.int_id && typeof quiz.int_id === 'number') return quiz.int_id;
    if (quiz.int_id && typeof quiz.int_id === 'string' && /^\d+$/.test(quiz.int_id)) 
      return parseInt(quiz.int_id, 10);
    // Fallback to id
    if (typeof quiz.id === 'number') return quiz.id;
    if (typeof quiz.id === 'string' && /^\d+$/.test(quiz.id)) 
      return parseInt(quiz.id, 10);
    console.warn('⚠️ No numeric quiz ID found. Quiz object:', quiz);
    return quiz.id; // may be UUID – will cause error
  };

  const handleStartQuiz = (quiz) => {
    const quizId = getQuizId(quiz);
    console.log('Starting quiz with ID:', quizId, '(type:', typeof quizId, ')');
    setVerifyingQuiz({ ...quiz, _startId: quizId });
    setShowVerificationModal(true);
    setRegNumber('');
    setVerificationError('');
  };

  const handleVerifyAndStart = async () => {
    if (!regNumber.trim()) {
      setVerificationError('Registration number required');
      return;
    }
    setVerifying(true);
    setVerificationError('');
    try {
      const token = localStorage.getItem('token');
      const quizId = verifyingQuiz._startId;
      const response = await api.post(`/api/quiz/${quizId}/verify`, {
        regNumber: regNumber.trim()
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        toast.success('Identity Verified');
        setShowVerificationModal(false);
        onStartQuiz(quizId);
      } else {
        setVerificationError(response.data.message || 'Verification failed');
      }
    } catch (error) {
      console.error('Verification error:', error);
      setVerificationError(error.response?.data?.message || 'Security verification error');
    } finally {
      setVerifying(false);
    }
  };

  // --- Color helpers (unchanged) ---
  const getSubjectStyles = (subject) => {
    const subjectName = typeof subject === 'string' ? subject : subject?.name || '';
    switch(subjectName) {
      case 'Geography': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'English': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Biology': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getSubjectIcon = (subject) => {
    const subjectName = typeof subject === 'string' ? subject : subject?.name || '';
    switch(subjectName) {
      case 'Geography': return '🌍';
      case 'English': return '📖';
      case 'Biology': return '🧬';
      default: return '📘';
    }
  };

  const getSubjectName = (quiz) => {
    if (typeof quiz.subject_name === 'string') return quiz.subject_name;
    if (quiz.subject && typeof quiz.subject === 'object') return quiz.subject.name;
    return 'General';
  };

  const getTargetFormColor = (targetForm) => {
    if (targetForm === 'Form 4') return 'bg-amber-100 text-amber-800 border-amber-200';
    if (targetForm === 'Form 3') return 'bg-blue-100 text-blue-800 border-blue-200';
    if (targetForm === 'Form 2') return 'bg-cyan-100 text-cyan-800 border-cyan-200';
    if (targetForm === 'Form 1') return 'bg-sky-100 text-sky-800 border-sky-200';
    return 'bg-gray-100 text-gray-600 border-gray-200';
  };

  const hasDiagrams = (quiz) => {
    return quiz.question_image || (quiz.questions && quiz.questions.some(q => q.question_image || q.answer_image));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-900"></div>
          <SparklesIcon className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 text-amber-500 animate-pulse" />
        </div>
      </div>
    );
  }

  if (!quizzes || quizzes.length === 0) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-white rounded-3xl p-12 text-center border border-blue-100 shadow-sm">
        <div className="text-6xl mb-4 opacity-60">✨</div>
        <h3 className="text-sm font-bold text-blue-900 uppercase tracking-widest mb-2">No Quizzes Available</h3>
        <p className="text-sm text-slate-500">Check back later for new assessments.</p>
        {learnerForm && (
          <p className="text-xs text-slate-400 mt-3">Your Form: <span className="font-bold text-amber-600">{learnerForm}</span></p>
        )}
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 via-white to-cyan-50 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <div className="flex justify-between items-start flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <AcademicCapIcon className="w-8 h-8 text-amber-500" />
                <h2 className="text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-blue-900 to-cyan-700 bg-clip-text text-transparent">
                  Assessment Hub
                </h2>
              </div>
              <p className="text-sm text-slate-600 max-w-2xl">
                Select a module below to begin. Each assessment is designed to challenge and help you grow.
              </p>
            </div>
            {learnerForm && (
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-800 rounded-full border border-blue-100 shadow-sm">
                <ShieldCheckIcon className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-bold uppercase tracking-wide">Form: {learnerForm}</span>
              </div>
            )}
          </div>
          <div className="mt-4 h-1 w-20 bg-gradient-to-r from-amber-500 to-blue-600 rounded-full"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quizzes.map((quiz) => {
            const quizId = getQuizId(quiz);
            const subjectName = getSubjectName(quiz);
            const attempted = quizHistory[quizId];
            const isCompleted = attempted?.status === 'completed';
            const score = attempted?.percentage ? Math.round(attempted.percentage) : 0;
            const isFormRestricted = quiz.target_form && quiz.target_form !== 'All' && quiz.target_form !== learnerForm;
            const marksDisplay = attempted?.marks_earned !== undefined && attempted?.total_marks
              ? `${attempted.marks_earned}/${attempted.total_marks} marks`
              : `${score}%`;
            
            return (
              <div key={quizId} className="group relative bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden border border-slate-100">
                {isFormRestricted && !isCompleted && (
                  <div className="absolute inset-0 bg-blue-900/60 backdrop-blur-sm z-10 flex items-center justify-center rounded-2xl">
                    <div className="bg-white/95 backdrop-blur-sm rounded-xl p-4 text-center max-w-[90%] shadow-xl border border-amber-200">
                      <LockClosedIcon className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                      <p className="text-xs font-bold text-blue-800">Form Restricted</p>
                      <p className="text-[10px] text-slate-500 mt-1">Available for {quiz.target_form} only</p>
                    </div>
                  </div>
                )}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 via-blue-600 to-cyan-500 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center text-2xl shadow-inner group-hover:scale-105 transition-transform">
                        {getSubjectIcon(subjectName)}
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getSubjectStyles(subjectName)}`}>
                          {subjectName}
                        </span>
                        {quiz.target_form && quiz.target_form !== 'All' && (
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${getTargetFormColor(quiz.target_form)}`}>
                            {quiz.target_form}
                          </span>
                        )}
                      </div>
                    </div>
                    {isCompleted && (
                      <span className="flex items-center gap-1 bg-emerald-50 text-emerald-600 px-2 py-1 rounded-full text-[10px] font-bold">
                        <CheckCircleIcon className="w-3 h-3" />
                        Completed
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-blue-900 mb-2 line-clamp-1 group-hover:text-amber-600 transition-colors">
                    {quiz.title || 'Untitled Assessment'}
                  </h3>
                  <p className="text-sm text-slate-500 mb-4 line-clamp-2">
                    {quiz.description || 'Challenge your knowledge with this interactive quiz.'}
                  </p>
                  <div className="flex items-center justify-between gap-2 mb-5 py-2 border-t border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 text-slate-500">
                        <ClockIcon className="w-4 h-4" />
                        <span className="text-xs font-medium">{quiz.duration || 30}m</span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-500">
                        <TrophyIcon className="w-4 h-4" />
                        <span className="text-xs font-medium">{quiz.question_count || 0} Qs</span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-500">
                        <StarIcon className="w-4 h-4" />
                        <span className="text-xs font-medium">{quiz.total_marks || quiz.total_points || 0} marks</span>
                      </div>
                    </div>
                    {hasDiagrams(quiz) && (
                      <div className="text-amber-500 text-sm" title="Contains diagrams">📷</div>
                    )}
                  </div>
                  {isCompleted ? (
                    <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-100">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold text-blue-800 uppercase tracking-wide">Your Score</span>
                        <span className="text-xl font-black text-amber-600">{marksDisplay}</span>
                      </div>
                      <div className="h-2 bg-white rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-amber-500 to-blue-600 rounded-full transition-all duration-500" style={{ width: `${score}%` }} />
                      </div>
                      {attempted?.feedback && (
                        <div className="mt-3 flex items-start gap-1 text-xs text-amber-700 bg-amber-50 p-2 rounded-lg">
                          <ChatBubbleLeftRightIcon className="w-3 h-3 mt-0.5 shrink-0" />
                          <span>{attempted.feedback}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => handleStartQuiz(quiz)}
                      disabled={isFormRestricted}
                      className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl transition-all duration-200 text-sm font-semibold ${
                        isFormRestricted
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          : 'bg-blue-900 text-white hover:bg-blue-800 hover:shadow-lg hover:scale-[1.02] active:scale-95 shadow-md'
                      }`}
                    >
                      {isFormRestricted ? (
                        <>
                          <LockClosedIcon className="w-4 h-4" />
                          Not Available
                        </>
                      ) : (
                        <>
                          <SparklesIcon className="w-4 h-4 text-amber-400" />
                          Start Assessment
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Verification Modal (unchanged) */}
      {showVerificationModal && verifyingQuiz && (
        <div className="fixed inset-0 bg-blue-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden transform transition-all animate-in zoom-in-95 duration-200">
            <div className="relative">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-amber-500 via-blue-600 to-cyan-500"></div>
              <div className="p-6 sm:p-8">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center mb-4 shadow-inner">
                    <ShieldCheckIcon className="w-8 h-8 text-amber-500" />
                  </div>
                  <h3 className="text-xl font-bold text-blue-900">Identity Verification</h3>
                  <p className="text-sm text-slate-500 mt-1">Confirm your identity to proceed</p>
                </div>
                <div className="mt-6 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-blue-800 uppercase tracking-wide mb-2">
                      Registration Number
                    </label>
                    <input
                      type="text"
                      value={regNumber}
                      onChange={(e) => {
                        setRegNumber(e.target.value.toUpperCase());
                        setVerificationError('');
                      }}
                      onKeyPress={(e) => e.key === 'Enter' && handleVerifyAndStart()}
                      placeholder="e.g., PSS/2026/001"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 font-mono text-sm uppercase transition-all"
                      autoFocus
                    />
                    {verificationError && (
                      <p className="mt-2 text-xs text-rose-600 flex items-center gap-1">
                        <InformationCircleIcon className="w-3 h-3" /> {verificationError}
                      </p>
                    )}
                  </div>
                  <div className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-xl p-4 border border-slate-100">
                    <div className="flex gap-3">
                      <InformationCircleIcon className="w-5 h-5 text-slate-500 shrink-0" />
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Your registration number is used to verify your identity and record your progress securely.
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 pt-4">
                    <button
                      onClick={handleVerifyAndStart}
                      disabled={verifying}
                      className="w-full py-3 bg-blue-900 text-white rounded-xl hover:bg-blue-800 transition-all font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {verifying ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        <>
                          Verify & Start Assessment
                          <SparklesIcon className="w-4 h-4 text-amber-400" />
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => setShowVerificationModal(false)}
                      className="w-full py-3 bg-white text-slate-500 rounded-xl hover:text-slate-700 transition-all font-medium text-sm border border-slate-200"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizList;