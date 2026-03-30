import React, { useState, useEffect } from 'react';
import { 
  ClockIcon, 
  TrophyIcon, 
  PlayIcon,
  CheckCircleIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import api from '../../services/api';

const QuizList = ({ onStartQuiz }) => {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quizHistory, setQuizHistory] = useState({});

  useEffect(() => {
    loadQuizzes();
    loadHistory();
  }, []);

  const loadQuizzes = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.get('/api/quiz/quizzes', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setQuizzes(response.data.quizzes || []);
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
      // Don't show toast for history errors
    }
  };

  const getSubjectColor = (subject) => {
    const subjectName = typeof subject === 'string' ? subject : subject?.name || '';
    switch(subjectName) {
      case 'Geography': return 'bg-emerald-100 text-emerald-700';
      case 'English': return 'bg-blue-100 text-blue-700';
      case 'Biology': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getSubjectIcon = (subject) => {
    const subjectName = typeof subject === 'string' ? subject : subject?.name || '';
    switch(subjectName) {
      case 'Geography': return '🌍';
      case 'English': return '📚';
      case 'Biology': return '🔬';
      default: return '📖';
    }
  };

  const getSubjectName = (quiz) => {
    if (typeof quiz.subject_name === 'string') return quiz.subject_name;
    if (quiz.subject && typeof quiz.subject === 'object') return quiz.subject.name;
    return 'General';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!quizzes || quizzes.length === 0) {
    return (
      <div className="bg-gray-50 rounded-xl p-12 text-center">
        <div className="text-6xl mb-4">📝</div>
        <h3 className="text-lg font-medium text-gray-700 mb-2">No Quizzes Available</h3>
        <p className="text-gray-500">Check back later for new quizzes</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-800">Available Quizzes</h2>
        <p className="text-sm text-gray-500 mt-1">Test your knowledge in different subjects</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {quizzes.map((quiz) => {
          const subjectName = getSubjectName(quiz);
          const attempted = quizHistory[quiz.id];
          const isCompleted = attempted?.status === 'completed';
          const score = attempted?.percentage ? Math.round(attempted.percentage) : 0;
          
          return (
            <div key={quiz.id} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition">
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{getSubjectIcon(subjectName)}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSubjectColor(subjectName)}`}>
                      {subjectName}
                    </span>
                  </div>
                  {isCompleted && (
                    <span className="flex items-center gap-1 text-green-600 text-sm">
                      <CheckCircleIcon className="w-4 h-4" />
                      Completed
                    </span>
                  )}
                </div>
                
                <h3 className="text-lg font-bold text-gray-800 mb-2">{quiz.title || 'Untitled Quiz'}</h3>
                <p className="text-sm text-gray-500 mb-4">{quiz.description || 'Test your knowledge'}</p>
                
                <div className="flex items-center gap-4 mb-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <ClockIcon className="w-4 h-4" />
                    <span>{quiz.duration || 30} min</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <TrophyIcon className="w-4 h-4" />
                    <span>{quiz.question_count || 0} Questions</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <StarIcon className="w-4 h-4" />
                    <span>{quiz.total_points || 0} pts</span>
                  </div>
                </div>
                
                {isCompleted ? (
                  <div className="bg-gray-50 rounded-lg p-3 mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Your Score:</span>
                      <span className="text-lg font-bold text-indigo-600">{score}%</span>
                    </div>
                    <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          score >= 70 ? 'bg-green-500' : score >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${score}%` }}
                      />
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      Earned: {attempted?.earned_points || 0} / {attempted?.total_points || 0} points
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => onStartQuiz(quiz.id)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                  >
                    <PlayIcon className="w-4 h-4" />
                    Start Quiz
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