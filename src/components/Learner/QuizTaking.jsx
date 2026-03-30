import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ClockIcon, 
  ArrowLeftIcon,
  ArrowRightIcon,
  FlagIcon,
  PaperAirplaneIcon,
  ExclamationCircleIcon,
  DocumentCheckIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import api from '../../services/api';

const QuizTaking = ({ quizId, onComplete }) => {
  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [attemptId, setAttemptId] = useState(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadQuiz();
  }, [quizId]);

  useEffect(() => {
    if (timeLeft === 0 && !submitting) {
      submitQuiz(); // Auto-submit when time hits zero
    }
    
    const timer = setInterval(() => {
      if (timeLeft > 0 && !submitting) {
        setTimeLeft(prev => prev - 1);
      }
    }, 1000);
    
    return () => clearInterval(timer);
  }, [timeLeft, submitting]);

  const loadQuiz = async () => {
    try {
      const token = localStorage.getItem('token');
      const startResponse = await api.post(`/api/quiz/${quizId}/start`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (startResponse.data.success) {
        setAttemptId(startResponse.data.attempt_id);
      }
      
      const response = await api.get(`/api/quiz/${quizId}/questions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.already_completed) {
        toast.error('Session finalized.');
        navigate('/learner/dashboard');
        return;
      }
      
      setQuiz(response.data.quiz);
      setQuestions(response.data.questions || []);
      setTimeLeft(response.data.quiz.duration * 60);
      
      if (response.data.saved_answers) {
        setAnswers(response.data.saved_answers);
      }
    } catch (error) {
      toast.error('Failed to sync data');
    }
  };

  const handleAnswer = (questionIndex, answerIndex) => {
    setAnswers(prev => ({ ...prev, [questionIndex]: answerIndex }));
  };

  const handleShortAnswer = (questionIndex, answerText) => {
    setAnswers(prev => ({ ...prev, [questionIndex]: answerText }));
  };

  const handleSubmit = () => {
    if (submitting) return;
    const unansweredCount = questions.length - Object.keys(answers).length;
    if (unansweredCount > 0) {
      setShowConfirmDialog(true);
      return;
    }
    submitQuiz();
  };

  const submitQuiz = async () => {
    setSubmitting(true);
    setShowConfirmDialog(false);
    
    try {
      const token = localStorage.getItem('token');
      const answersArray = questions.map((_, idx) => answers[idx] !== undefined ? answers[idx] : null);
      
      const response = await api.post(`/api/quiz/${quizId}/submit`, {
        answers: answersArray,
        time_taken: (quiz.duration * 60) - timeLeft
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        toast.success(`Complete`, { icon: '🏆' });
        if (onComplete) onComplete(response.data);
        else navigate('/learner/dashboard');
      }
    } catch (error) {
      toast.error('Submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!quiz || questions.length === 0) {
    return (
      <div className="min-h-[300px] flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 text-xs font-medium animate-pulse">Initializing Environment...</p>
      </div>
    );
  }

  const stats = {
    answered: Object.keys(answers).length,
    total: questions.length,
    progress: ((currentQuestion + 1) / questions.length) * 100
  };

  return (
    <div className="max-w-4xl mx-auto px-3 pb-16 font-sans text-slate-900">
      
      {/* --- ELITE TOP NAV --- */}
      <div className="sticky top-0 z-30 mb-6 py-3 backdrop-blur-md bg-white/80 border-b border-slate-200">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-xl transition-colors ${timeLeft < 60 ? 'bg-red-50 text-red-600 animate-pulse' : 'bg-slate-900 text-white'}`}>
              <ClockIcon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Remaining Time</p>
              <p className={`text-base font-mono font-bold ${timeLeft < 60 ? 'text-red-600' : 'text-slate-900'}`}>
                {formatTime(timeLeft)}
              </p>
            </div>
          </div>

          <div className="hidden md:block flex-1 max-w-xs mx-6">
            <div className="flex justify-between text-[10px] font-bold mb-1 uppercase text-slate-400">
              <span>Progress</span>
              <span>{Math.round((stats.answered / stats.total) * 100)}%</span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-indigo-600 transition-all duration-500 shadow-[0_0_6px_rgba(79,70,229,0.3)]"
                style={{ width: `${(stats.answered / stats.total) * 100}%` }}
              />
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="group relative flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50"
          >
            {submitting ? 'Processing' : (
              <>
                Finish
                <PaperAirplaneIcon className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* --- QUESTION CONTENT --- */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow shadow-slate-200/50 p-6 min-h-[300px] relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-slate-50">
                <div 
                    className="h-full bg-indigo-500 transition-all duration-300" 
                    style={{ width: `${stats.progress}%` }}
                />
            </div>

            <div className="flex items-start justify-between mb-6">
              <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full text-[10px] font-bold uppercase tracking-wider">
                Question {currentQuestion + 1}
              </span>
              <span className="text-slate-400 text-xs font-medium">
                {questions[currentQuestion]?.points || 1} pts
              </span>
            </div>

            <h2 className="text-xl font-bold text-slate-800 leading-snug mb-8">
              {questions[currentQuestion]?.question_text}
            </h2>

            <div className="space-y-3">
              {questions[currentQuestion]?.options ? (
                questions[currentQuestion].options.map((option, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleAnswer(currentQuestion, idx)}
                    className={`w-full flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-all duration-150 ${
                      answers[currentQuestion] === idx
                        ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-50'
                        : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                      answers[currentQuestion] === idx ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300'
                    }`}>
                      {answers[currentQuestion] === idx && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                    </div>
                    <span className={`text-sm font-semibold ${answers[currentQuestion] === idx ? 'text-indigo-900' : 'text-slate-600'}`}>
                      {option}
                    </span>
                  </button>
                ))
              ) : (
                <textarea
                  value={answers[currentQuestion] || ''}
                  onChange={(e) => handleShortAnswer(currentQuestion, e.target.value)}
                  placeholder="Draft your response..."
                  className="w-full p-4 border-2 border-slate-100 rounded-xl focus:border-indigo-500 focus:ring-0 min-h-[150px] text-base placeholder:text-slate-300 transition-colors"
                />
              )}
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex justify-between items-center bg-slate-900 p-2 rounded-2xl shadow-lg">
            <button
              onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
              disabled={currentQuestion === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 text-white text-xs font-bold disabled:opacity-30 hover:bg-white/10 rounded-lg transition"
            >
              <ArrowLeftIcon className="w-3.5 h-3.5" />
              Back
            </button>
            <div className="text-white/40 text-xs font-mono tracking-wider hidden sm:block">
               {String(currentQuestion + 1).padStart(2, '0')} / {String(questions.length).padStart(2, '0')}
            </div>
            <button
              onClick={() => setCurrentQuestion(Math.min(questions.length - 1, currentQuestion + 1))}
              disabled={currentQuestion === questions.length - 1}
              className="flex items-center gap-1.5 px-3 py-1.5 text-white text-xs font-bold disabled:opacity-30 hover:bg-white/10 rounded-lg transition"
            >
              Next
              <ArrowRightIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* --- GRID SIDEBAR --- */}
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-1.5">
              <DocumentCheckIcon className="w-4 h-4" />
              Map
            </h4>
            <div className="grid grid-cols-4 gap-2">
              {questions.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentQuestion(idx)}
                  className={`aspect-square rounded-lg text-xs font-bold transition-all ${
                    currentQuestion === idx
                      ? 'bg-indigo-600 text-white shadow shadow-indigo-200 scale-105 z-10'
                      : answers[idx] !== undefined
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
            
            <div className="mt-6 pt-4 border-t border-slate-100 space-y-2">
                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
                    <div className="w-2.5 h-2.5 bg-emerald-100 rounded-sm" /> Answered
                </div>
                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
                    <div className="w-2.5 h-2.5 bg-indigo-600 rounded-sm" /> Current
                </div>
            </div>
          </div>

          <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl">
            <ExclamationCircleIcon className="w-6 h-6 text-indigo-400 mb-2" />
            <h5 className="font-bold text-indigo-900 mb-0.5 text-xs">Help</h5>
            <p className="text-[10px] text-indigo-700 leading-relaxed font-medium">
              Saved automatically. Refresh to resume if disconnected.
            </p>
          </div>
        </div>
      </div>

      {/* --- CONFIRMATION MODAL --- */}
      {showConfirmDialog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowConfirmDialog(false)} />
          <div className="relative bg-white rounded-3xl max-w-sm w-full p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FlagIcon className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 text-center mb-2">Incomplete</h3>
            <p className="text-slate-500 text-center text-sm mb-6 font-medium leading-relaxed">
              <span className="text-indigo-600 font-bold">{questions.length - stats.answered} questions</span> unanswered. Submit anyway?
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={submitQuiz}
                className="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition"
              >
                Yes, Submit
              </button>
              <button
                onClick={() => setShowConfirmDialog(false)}
                className="w-full py-2.5 bg-slate-50 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-100 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizTaking;