import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ClockIcon, 
  ArrowLeftIcon,
  ArrowRightIcon,
  FlagIcon,
  PaperAirplaneIcon,
  ExclamationCircleIcon,
  DocumentCheckIcon,
  PhotoIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckCircleIcon,
  QuestionMarkCircleIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolid } from '@heroicons/react/24/solid';
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
  const [lightboxImage, setLightboxImage] = useState(null);
  const questionRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadQuiz();
  }, [quizId]);

  useEffect(() => {
    if (timeLeft === 0 && !submitting) {
      submitQuiz();
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
    autoSaveAnswer(questionIndex, answerIndex);
  };

  const handleShortAnswer = (questionIndex, answerText) => {
    setAnswers(prev => ({ ...prev, [questionIndex]: answerText }));
    autoSaveAnswer(questionIndex, answerText);
  };

  const autoSaveAnswer = async (questionIndex, answer) => {
    try {
      const token = localStorage.getItem('token');
      await api.post(`/api/quiz/${quizId}/save-answer`, {
        question_index: questionIndex,
        answer: answer,
        attempt_id: attemptId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      console.warn('Auto-save failed', error);
    }
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
        toast.success(`Complete! Score: ${Math.round(response.data.percentage)}%`, { icon: '🏆' });
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

  const stats = {
    answered: Object.keys(answers).length,
    total: questions.length,
    progress: ((currentQuestion + 1) / questions.length) * 100
  };

  const currentQ = questions[currentQuestion];
  const hasDiagram = currentQ?.question_image;

  useEffect(() => {
    if (questionRef.current) {
      questionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [currentQuestion]);

  const Lightbox = ({ image, onClose }) => {
    if (!image) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm" onClick={onClose}>
        <div className="relative max-w-5xl max-h-[90vh] p-4">
          <img src={image} alt="Full size" className="max-w-full max-h-full object-contain rounded-lg" />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-white/20 rounded-full hover:bg-white/30 transition"
          >
            <XMarkIcon className="w-6 h-6 text-white" />
          </button>
        </div>
      </div>
    );
  };

  if (!quiz || questions.length === 0) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-900 rounded-full animate-spin"></div>
        <p className="text-slate-500 text-sm font-medium">Preparing your assessment...</p>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white dark:from-slate-900 dark:to-slate-800">
        {/* Header with glass effect */}
        <div className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl transition-all ${timeLeft < 60 ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 animate-pulse' : 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400'}`}>
                  <ClockIcon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Time Remaining</p>
                  <p className={`text-xl font-mono font-bold tracking-tight ${timeLeft < 60 ? 'text-red-600 dark:text-red-400' : 'text-slate-800 dark:text-slate-200'}`}>
                    {formatTime(timeLeft)}
                  </p>
                </div>
              </div>

              <div className="flex-1 max-w-md mx-4 hidden sm:block">
                <div className="flex justify-between text-xs font-medium mb-1 text-slate-400 dark:text-slate-500">
                  <span>Progress</span>
                  <span>{Math.round((stats.answered / stats.total) * 100)}% answered</span>
                </div>
                <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-amber-500 to-blue-600 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${(stats.answered / stats.total) * 100}%` }}
                  />
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="group relative flex items-center gap-2 px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-sm font-semibold shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <PaperAirplaneIcon className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    Submit
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Main content area */}
            <div className="lg:col-span-3 space-y-6">
              <div ref={questionRef} className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden transition-all">
                {/* Question header */}
                <div className="px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-700">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-full text-xs font-bold uppercase tracking-wider">
                        Question {currentQuestion + 1}
                      </span>
                      {hasDiagram && (
                        <span className="px-3 py-1 bg-cyan-50 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                          <PhotoIcon className="w-3 h-3" />
                          Diagram
                        </span>
                      )}
                    </div>
                    <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                      {currentQ?.points || 1} {currentQ?.points === 1 ? 'point' : 'points'}
                    </span>
                  </div>
                </div>

                {/* Question body */}
                <div className="p-6">
                  {currentQ?.question_text && (
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 leading-relaxed mb-6">
                      {currentQ.question_text}
                    </h2>
                  )}

                  {currentQ?.question_image && (
                    <div className="mb-6">
                      <img 
                        src={currentQ.question_image} 
                        alt="Question diagram" 
                        className="max-w-full h-auto max-h-64 mx-auto rounded-xl shadow-md cursor-pointer transition-transform hover:scale-105"
                        onClick={() => setLightboxImage(currentQ.question_image)}
                      />
                      <p className="text-center text-xs text-slate-400 mt-2">Click to enlarge</p>
                    </div>
                  )}

                  {/* Answer options */}
                  <div className="space-y-3">
                    {currentQ?.options ? (
                      currentQ.options.map((option, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleAnswer(currentQuestion, idx)}
                          className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-150 group ${
                            answers[currentQuestion] === idx
                              ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20 shadow-md'
                              : 'border-slate-200 dark:border-slate-700 hover:border-amber-300 dark:hover:border-amber-700 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                              answers[currentQuestion] === idx
                                ? 'border-amber-500 bg-amber-500'
                                : 'border-slate-300 dark:border-slate-600 group-hover:border-amber-400'
                            }`}>
                              {answers[currentQuestion] === idx && (
                                <CheckCircleSolid className="w-3 h-3 text-white" />
                              )}
                            </div>
                            <div className="flex-1">
                              <span className={`text-sm font-medium ${
                                answers[currentQuestion] === idx
                                  ? 'text-amber-800 dark:text-amber-200'
                                  : 'text-slate-700 dark:text-slate-300'
                              }`}>
                                {option}
                              </span>
                              {currentQ.option_images?.[idx] && (
                                <div className="mt-2">
                                  <img 
                                    src={currentQ.option_images[idx]} 
                                    alt={`Option ${String.fromCharCode(65 + idx)}`}
                                    className="max-h-24 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setLightboxImage(currentQ.option_images[idx]);
                                    }}
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="space-y-4">
                        {currentQ?.answer_image && (
                          <div className="mb-4 p-4 bg-cyan-50 dark:bg-cyan-900/20 rounded-xl border border-cyan-200 dark:border-cyan-800">
                            <p className="text-xs font-medium text-cyan-700 dark:text-cyan-300 mb-2">Reference Image:</p>
                            <img 
                              src={currentQ.answer_image} 
                              alt="Answer reference"
                              className="max-h-32 rounded-lg mx-auto cursor-pointer"
                              onClick={() => setLightboxImage(currentQ.answer_image)}
                            />
                          </div>
                        )}
                        <textarea
                          value={answers[currentQuestion] || ''}
                          onChange={(e) => handleShortAnswer(currentQuestion, e.target.value)}
                          placeholder="Type your answer here..."
                          className="w-full p-4 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:border-amber-500 focus:ring-2 focus:ring-amber-200 dark:focus:ring-amber-800 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 transition-colors min-h-[120px]"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Navigation buttons */}
                <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center">
                  <button
                    onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
                    disabled={currentQuestion === 0}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 disabled:opacity-40 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
                  >
                    <ChevronLeftIcon className="w-4 h-4" />
                    Previous
                  </button>
                  <div className="text-sm text-slate-400 dark:text-slate-500 font-mono">
                    {currentQuestion + 1} / {questions.length}
                  </div>
                  <button
                    onClick={() => setCurrentQuestion(Math.min(questions.length - 1, currentQuestion + 1))}
                    disabled={currentQuestion === questions.length - 1}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 disabled:opacity-40 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
                  >
                    Next
                    <ChevronRightIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Mobile progress indicator */}
              <div className="block sm:hidden">
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-600 dark:text-slate-400">Answered</span>
                    <span className="font-semibold text-amber-600 dark:text-amber-400">
                      {stats.answered}/{stats.total}
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-amber-500 rounded-full transition-all duration-500"
                      style={{ width: `${(stats.answered / stats.total) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-5">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-4 flex items-center gap-2">
                  <DocumentCheckIcon className="w-5 h-5" />
                  Question Navigator
                </h3>
                <div className="grid grid-cols-5 gap-2">
                  {questions.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentQuestion(idx)}
                      className={`aspect-square rounded-xl text-sm font-semibold transition-all duration-200 ${
                        currentQuestion === idx
                          ? 'bg-blue-900 text-white shadow-lg scale-105 ring-2 ring-amber-400 ring-offset-2 dark:ring-offset-slate-800'
                          : answers[idx] !== undefined
                          ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-900/50'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  ))}
                </div>
                <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-700">
                  <div className="flex items-center gap-3 text-xs">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-amber-100 dark:bg-amber-900/30 ring-1 ring-amber-200 dark:ring-amber-800" />
                      <span className="text-slate-500 dark:text-slate-400">Answered</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-blue-900 ring-1 ring-amber-400" />
                      <span className="text-slate-500 dark:text-slate-400">Current</span>
                    </div>
                    {hasDiagram && (
                      <div className="flex items-center gap-1.5">
                        <PhotoIcon className="w-3 h-3 text-cyan-500" />
                        <span className="text-slate-500 dark:text-slate-400">Diagram</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-amber-50 to-cyan-50 dark:from-amber-900/20 dark:to-cyan-900/20 rounded-2xl p-5 border border-amber-100 dark:border-amber-800">
                <ExclamationCircleIcon className="w-8 h-8 text-amber-500 dark:text-amber-400 mb-3" />
                <h4 className="text-sm font-bold text-amber-800 dark:text-amber-300 mb-1">Assessment Tips</h4>
                <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                  {hasDiagram 
                    ? "📸 Click on images to enlarge. Your answers are saved automatically as you type."
                    : "💡 Answers are auto-saved. You can resume if disconnected. Review all questions before submitting."
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox modal */}
      {lightboxImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm" onClick={() => setLightboxImage(null)}>
          <div className="relative max-w-5xl max-h-[90vh] p-4">
            <img src={lightboxImage} alt="Full size" className="max-w-full max-h-full object-contain rounded-lg" />
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute top-4 right-4 p-2 bg-white/20 rounded-full hover:bg-white/30 transition"
            >
              <XMarkIcon className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>
      )}

      {/* Confirmation dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowConfirmDialog(false)} />
          <div className="relative bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FlagIcon className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 text-center mb-2">Incomplete Assessment</h3>
            <p className="text-slate-500 dark:text-slate-400 text-center text-sm mb-6">
              You have <span className="font-bold text-amber-600 dark:text-amber-400">{questions.length - stats.answered}</span> unanswered {questions.length - stats.answered === 1 ? 'question' : 'questions'}. Submit anyway?
            </p>
            <div className="flex gap-3">
              <button
                onClick={submitQuiz}
                className="flex-1 py-2.5 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-sm font-semibold transition"
              >
                Yes, Submit
              </button>
              <button
                onClick={() => setShowConfirmDialog(false)}
                className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-semibold hover:bg-slate-200 dark:hover:bg-slate-600 transition"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default QuizTaking;