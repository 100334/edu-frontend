import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ClockIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  FlagIcon
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
  const navigate = useNavigate();

  useEffect(() => {
    loadQuiz();
  }, [quizId]);

  useEffect(() => {
    if (timeLeft === 0) {
      handleSubmit();
    }
    
    const timer = setInterval(() => {
      if (timeLeft > 0) {
        setTimeLeft(timeLeft - 1);
      }
    }, 1000);
    
    return () => clearInterval(timer);
  }, [timeLeft]);

  const loadQuiz = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Start the quiz
      const startResponse = await api.post(`/api/quiz/${quizId}/start`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (startResponse.data.success) {
        setAttemptId(startResponse.data.attempt_id);
      }
      
      // Load quiz questions
      const response = await api.get(`/api/quiz/${quizId}/questions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.already_completed) {
        toast.error('You have already completed this quiz!');
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
      console.error('Error loading quiz:', error);
      toast.error('Failed to load quiz');
    }
  };

  const handleAnswer = (questionIndex, answerIndex) => {
    setAnswers({
      ...answers,
      [questionIndex]: answerIndex
    });
  };

  const handleSubmit = async () => {
    if (submitting) return;
    
    const unansweredCount = questions.length - Object.keys(answers).length;
    if (unansweredCount > 0) {
      if (!window.confirm(`You have ${unansweredCount} unanswered question(s). Submit anyway?`)) {
        return;
      }
    }
    
    setSubmitting(true);
    
    try {
      const token = localStorage.getItem('token');
      const answersArray = questions.map((_, idx) => answers[idx] !== undefined ? answers[idx] : -1);
      
      const response = await api.post(`/api/quiz/${quizId}/submit`, {
        answers: answersArray,
        time_taken: (quiz.duration * 60) - timeLeft
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        toast.success(`Quiz submitted! Score: ${response.data.score}/${response.data.total_possible}`);
        if (onComplete) {
          onComplete(response.data);
        } else {
          navigate('/learner/dashboard');
        }
      }
    } catch (error) {
      console.error('Error submitting quiz:', error);
      toast.error('Failed to submit quiz');
    } finally {
      setSubmitting(false);
    }
  };

  if (!quiz || questions.length === 0) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Quiz Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4 sticky top-0 z-10">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-gray-800">{quiz.title}</h2>
            <p className="text-sm text-gray-500">Question {currentQuestion + 1} of {questions.length}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <ClockIcon className="w-5 h-5 text-orange-500" />
              <span className={`font-mono font-bold ${timeLeft < 60 ? 'text-red-600' : 'text-gray-700'}`}>
                {formatTime(timeLeft)}
              </span>
            </div>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit Quiz'}
            </button>
          </div>
        </div>
        <div className="mt-3">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-indigo-600 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
              {currentQuestion + 1}
            </span>
            <h3 className="text-lg font-medium text-gray-800">{questions[currentQuestion]?.question_text}</h3>
          </div>
          
          <div className="space-y-3 ml-10">
            {questions[currentQuestion]?.options.map((option, idx) => (
              <label
                key={idx}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition ${
                  answers[currentQuestion] === idx
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
                }`}
              >
                <input
                  type="radio"
                  name={`question-${currentQuestion}`}
                  value={idx}
                  checked={answers[currentQuestion] === idx}
                  onChange={() => handleAnswer(currentQuestion, idx)}
                  className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-4 border-t border-gray-200">
          <button
            onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
            disabled={currentQuestion === 0}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Previous
          </button>
          
          <div className="flex gap-2">
            {questions.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentQuestion(idx)}
                className={`w-8 h-8 rounded-full text-sm font-medium transition ${
                  currentQuestion === idx
                    ? 'bg-indigo-600 text-white'
                    : answers[idx] !== undefined
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {idx + 1}
              </button>
            ))}
          </div>
          
          <button
            onClick={() => setCurrentQuestion(Math.min(questions.length - 1, currentQuestion + 1))}
            disabled={currentQuestion === questions.length - 1}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
            <ArrowRightIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress Summary */}
      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Progress:</span>
          <span className="text-sm font-medium text-gray-800">
            {Object.keys(answers).length} of {questions.length} answered
          </span>
        </div>
      </div>
    </div>
  );
};

export default QuizTaking;