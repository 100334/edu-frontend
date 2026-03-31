import React, { useState, useEffect } from 'react';
import { 
  ClockIcon, 
  TrophyIcon, 
  CheckCircleIcon,
  StarIcon,
  ShieldCheckIcon,
  LockClosedIcon,
  InformationCircleIcon,
  PhotoIcon
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
  const [showFormInfo, setShowFormInfo] = useState(false);

  useEffect(() => {
    loadQuizzes();
    loadHistory();
    getLearnerForm();
  }, []);

  const getLearnerForm = async () => {
    try {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user.form) {
          setLearnerForm(user.form);
        }
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
        if (response.data.learner_form) {
          setLearnerForm(response.data.learner_form);
        }
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
          historyMap[attempt.quiz_id] = attempt;
        });
        setQuizHistory(historyMap);
      }
    } catch (error) {
      console.error('Error loading history:', error);
    }
  };

  const handleStartQuiz = (quiz) => {
    setVerifyingQuiz(quiz);
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
      const response = await api.post(`/api/quiz/${verifyingQuiz.id}/verify`, {
        regNumber: regNumber.trim()
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        toast.success('Identity Verified', {
          style: { background: '#e6fffa', color: '#0d9488' }
        });
        setShowVerificationModal(false);
        onStartQuiz(verifyingQuiz.id);
      } else {
        setVerificationError(response.data.message || 'Verification failed');
      }
    } catch (error) {
      setVerificationError('Security verification error');
    } finally {
      setVerifying(false);
    }
  };

  // --- THEME HELPERS ---
  const getSubjectStyles = (subject) => {
    const subjectName = typeof subject === 'string' ? subject : subject?.name || '';
    switch(subjectName) {
      case 'Geography': return 'bg-cyan-50 text-cyan-700 border-cyan-100';
      case 'English': return 'bg-teal-50 text-teal-700 border-teal-100';
      case 'Biology': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  const getSubjectIcon = (subject) => {
    const subjectName = typeof subject === 'string' ? subject : subject?.name || '';
    switch(subjectName) {
      case 'Geography': return '🌍';
      case 'English': return '📚';
      case 'Biology': return '🧬';
      default: return '📝';
    }
  };

  const getSubjectName = (quiz) => {
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

  // Helper to check if quiz has diagrams
  const hasDiagrams = (quiz) => {
    return quiz.question_image || (quiz.questions && quiz.questions.some(q => q.question_image || q.answer_image));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  if (!quizzes || quizzes.length === 0) {
    return (
      <div className="bg-[#f0f8ff] rounded-3xl p-12 text-center border border-teal-100">
        <div className="text-5xl mb-4 opacity-50">✨</div>
        <h3 className="text-sm font-bold text-slate-600 uppercase tracking-widest mb-2">No Quizzes</h3>
        <p className="text-xs text-slate-400">The exam hall is currently empty.</p>
        {learnerForm && (
          <p className="text-xs text-slate-400 mt-3">Your Form: {learnerForm}</p>
        )}
      </div>
    );
  }

  return (
    <div className="bg-[#fcfdfe] min-h-screen">
      <div className="space-y-6">
        <div className="mb-8">
          <div className="flex justify-between items-start flex-wrap gap-3">
            <div>
              <h2 className="text-lg font-black text-slate-800 tracking-tight">Available Assessments</h2>
              <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-semibold">Select a module to begin</p>
            </div>
            {learnerForm && (
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal-50 text-teal-700 rounded-full border border-teal-100">
                <ShieldCheckIcon className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold">Form: {learnerForm}</span>
              </div>
            )}
          </div>
          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-teal-50 text-teal-700 rounded-full border border-teal-100">
            <ShieldCheckIcon className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold">Encrypted Session Ready</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {quizzes.map((quiz) => {
            const subjectName = getSubjectName(quiz);
            const attempted = quizHistory[quiz.id];
            const isCompleted = attempted?.status === 'completed';
            const score = attempted?.percentage ? Math.round(attempted.percentage) : 0;
            const isFormRestricted = quiz.target_form && quiz.target_form !== 'All' && quiz.target_form !== learnerForm;
            const hasDiagram = quiz.question_image || (quiz.questions && quiz.questions.some(q => q.question_image));
            
            return (
              <div key={quiz.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:border-teal-200 hover:shadow-md transition-all duration-300 group overflow-hidden relative">
                {/* Form Restriction Overlay */}
                {isFormRestricted && !isCompleted && (
                  <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm z-10 flex items-center justify-center">
                    <div className="bg-white rounded-xl p-3 text-center max-w-[85%] shadow-lg">
                      <LockClosedIcon className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                      <p className="text-[10px] font-bold text-slate-700">Form Restricted</p>
                      <p className="text-[8px] text-slate-500 mt-0.5">Only for {quiz.target_form}</p>
                    </div>
                  </div>
                )}
                
                <div className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="w-10 h-10 rounded-xl bg-[#f0f8ff] flex items-center justify-center text-xl shadow-inner">
                        {getSubjectIcon(subjectName)}
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-tighter border ${getSubjectStyles(subjectName)}`}>
                        {subjectName}
                      </span>
                      {quiz.target_form && quiz.target_form !== 'All' && (
                        <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-tighter border ${getTargetFormColor(quiz.target_form)}`}>
                          {quiz.target_form}
                        </span>
                      )}
                      {hasDiagram && (
                        <span className="px-2 py-0.5 rounded-lg text-[9px] font-bold bg-teal-50 text-teal-600 border-teal-100">
                          📷 Diagram
                        </span>
                      )}
                    </div>
                    {isCompleted && (
                      <span className="flex items-center gap-1 text-emerald-600 text-[10px] font-bold uppercase">
                        <CheckCircleIcon className="w-3.5 h-3.5" />
                        Finalized
                      </span>
                    )}
                  </div>
                  
                  <h3 className="text-sm font-bold text-slate-800 mb-1 leading-tight">{quiz.title || 'Untitled Assessment'}</h3>
                  <p className="text-[11px] text-slate-400 mb-4 line-clamp-1">{quiz.description || 'Verified module content.'}</p>
                  
                  <div className="flex items-center gap-3 mb-5 py-2 border-y border-slate-50">
                    <div className="flex items-center gap-1 text-slate-500">
                      <ClockIcon className="w-3 h-3" />
                      <span className="text-[10px] font-bold">{quiz.duration || 30}m</span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-500">
                      <TrophyIcon className="w-3 h-3" />
                      <span className="text-[10px] font-bold">{quiz.question_count || 0} Qs</span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-500">
                      <StarIcon className="w-3 h-3" />
                      <span className="text-[10px] font-bold">{quiz.total_points || 0} pts</span>
                    </div>
                  </div>
                  
                  {isCompleted ? (
                    <div className="bg-teal-50 rounded-xl p-3 border border-teal-100">
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-[10px] font-black text-teal-700 uppercase tracking-widest">Efficiency</span>
                        <span className="text-sm font-black text-teal-800">{score}%</span>
                      </div>
                      <div className="h-1.5 bg-white rounded-full overflow-hidden border border-teal-50">
                        <div 
                          className="h-full bg-teal-500 rounded-full transition-all duration-500 shadow-sm"
                          style={{ width: `${score}%` }}
                        />
                      </div>
                      <div className="mt-2 text-[9px] text-slate-500">
                        Earned: {attempted?.earned_points || 0} / {attempted?.total_points || 0} pts
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleStartQuiz(quiz)}
                      disabled={isFormRestricted}
                      className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl transition-all active:scale-95 text-xs font-bold ${
                        isFormRestricted
                          ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                          : 'bg-teal-600 text-white hover:bg-teal-700 shadow-lg shadow-teal-100'
                      }`}
                    >
                      <LockClosedIcon className="w-3.5 h-3.5" />
                      {isFormRestricted ? 'Not Available' : 'Unlock & Start'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Verification Modal */}
      {showVerificationModal && verifyingQuiz && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2rem] max-w-sm w-full shadow-2xl border border-teal-100 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8">
              <div className="flex flex-col items-center text-center mb-6">
                <div className="w-14 h-14 bg-teal-50 rounded-2xl flex items-center justify-center mb-4 border border-teal-100">
                  <ShieldCheckIcon className="w-7 h-7 text-teal-600" />
                </div>
                <h3 className="text-lg font-black text-slate-800 tracking-tight">Identity Check</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Access Protocol Required</p>
                <div className="mt-3 flex flex-wrap gap-2 justify-center">
                  <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase border ${getSubjectStyles(verifyingQuiz.subject_name)}`}>
                    {getSubjectName(verifyingQuiz)}
                  </span>
                  {verifyingQuiz.target_form && verifyingQuiz.target_form !== 'All' && (
                    <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase border ${getTargetFormColor(verifyingQuiz.target_form)}`}>
                      {verifyingQuiz.target_form}
                    </span>
                  )}
                  {verifyingQuiz.question_image && (
                    <span className="px-2 py-0.5 rounded-lg text-[9px] font-bold bg-teal-50 text-teal-600 border-teal-100">
                      📷 Diagram
                    </span>
                  )}
                </div>
              </div>
              
              <div className="space-y-5">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">
                    Registration No.
                  </label>
                  <input
                    type="text"
                    value={regNumber}
                    onChange={(e) => {
                      setRegNumber(e.target.value.toUpperCase());
                      setVerificationError('');
                    }}
                    onKeyPress={(e) => e.key === 'Enter' && handleVerifyAndStart()}
                    placeholder="E.G., PSS/2026/001"
                    className="w-full px-4 py-3 bg-[#fcfdfe] border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-400 focus:border-teal-400 font-mono text-xs uppercase transition-all"
                    autoFocus
                  />
                  {verificationError && (
                    <p className="mt-2 text-[10px] text-teal-600 font-bold flex items-center gap-1 px-1">
                      <InformationCircleIcon className="w-3 h-3" /> {verificationError}
                    </p>
                  )}
                </div>

                {verifyingQuiz.target_form === 'Form 4' && (
                  <div className="bg-teal-50 rounded-2xl p-4 border border-teal-100">
                    <div className="flex gap-3">
                      <TrophyIcon className="w-4 h-4 text-teal-600 shrink-0" />
                      <div>
                        <p className="text-[10px] text-teal-800 font-bold mb-1">⭐ Form 4 Assessment</p>
                        <p className="text-[9px] text-teal-700 leading-relaxed">
                          This is a Form 4 quiz. Good luck with your final examinations preparation!
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {verifyingQuiz.question_image && (
                  <div className="bg-cyan-50 rounded-2xl p-4 border border-cyan-100">
                    <div className="flex gap-3">
                      <PhotoIcon className="w-4 h-4 text-cyan-600 shrink-0" />
                      <div>
                        <p className="text-[10px] text-cyan-800 font-bold mb-1">📷 Diagram-Based Question</p>
                        <p className="text-[9px] text-cyan-700 leading-relaxed">
                          This quiz includes diagrams. Please analyze them carefully before answering.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-teal-50 rounded-2xl p-4 border border-teal-100">
                  <div className="flex gap-3">
                    <InformationCircleIcon className="w-4 h-4 text-teal-600 shrink-0" />
                    <p className="text-[10px] text-teal-800 leading-relaxed font-medium">
                      Your unique ID ensures assessment integrity and secures your progress record.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-2 pt-2">
                  <button
                    onClick={handleVerifyAndStart}
                    disabled={verifying}
                    className="w-full py-3 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-all font-black text-xs shadow-lg shadow-teal-100 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {verifying ? 'Validating...' : 'Verify Identity'}
                  </button>
                  <button
                    onClick={() => setShowVerificationModal(false)}
                    className="w-full py-3 bg-white text-slate-400 rounded-xl hover:text-slate-600 transition-all font-bold text-xs"
                  >
                    Cancel
                  </button>
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