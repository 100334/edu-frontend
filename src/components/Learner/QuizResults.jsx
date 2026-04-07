import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  DocumentTextIcon, TrophyIcon, EyeIcon, XMarkIcon,
  CheckCircleIcon, ChatBubbleLeftRightIcon, ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import api from '../../services/api';

const QuizResults = () => {
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAttempt, setSelectedAttempt] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadCompletedAttempts();
  }, []);

  const loadCompletedAttempts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.get('/api/quiz/history', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        // Only show completed (graded) attempts
        const completed = (response.data.attempts || []).filter(a => a.status === 'completed');
        setAttempts(completed);
      }
    } catch (error) {
      console.error('Error loading results:', error);
      toast.error('Failed to load quiz results');
    } finally {
      setLoading(false);
    }
  };

  const viewDetails = async (attemptId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.get(`/api/quiz/attempt/${attemptId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setSelectedAttempt(response.data.attempt);
        setShowDetailModal(true);
      } else {
        toast.error('Could not load details');
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to load quiz details');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-900"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-blue-900">My Quiz Results</h1>
        <p className="text-slate-500 mt-1">View feedback and marks for completed assessments</p>
      </div>

      {attempts.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl shadow-sm border">
          <DocumentTextIcon className="w-16 h-16 mx-auto text-slate-300 mb-4" />
          <p className="text-slate-500">No graded quizzes yet.</p>
          <button
            onClick={() => navigate('/learner/dashboard')}
            className="mt-4 px-4 py-2 bg-blue-800 text-white rounded-lg hover:bg-blue-700"
          >
            Go to Dashboard
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {attempts.map((attempt) => (
            <div key={attempt.id} className="bg-white rounded-2xl shadow-md border border-slate-200 p-6 hover:shadow-lg transition">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-blue-800">{attempt.quiz_title}</h3>
                  <p className="text-sm text-slate-500 mt-1">{attempt.subject}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  attempt.passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {attempt.passed ? 'Passed' : 'Failed'}
                </span>
              </div>
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600">Your Score</span>
                  <span className="font-bold text-amber-600">{attempt.marks_earned} / {attempt.total_marks} marks</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-amber-500 to-blue-600 rounded-full transition-all"
                    style={{ width: `${attempt.percentage}%` }}
                  />
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  Completed: {new Date(attempt.completed_at).toLocaleDateString()}
                </p>
              </div>
              {attempt.feedback && (
                <div className="bg-blue-50 rounded-xl p-3 mb-4 flex items-start gap-2">
                  <ChatBubbleLeftRightIcon className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-blue-800">{attempt.feedback}</p>
                </div>
              )}
              <button
                onClick={() => viewDetails(attempt.id)}
                className="w-full flex items-center justify-center gap-2 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition text-sm font-medium"
              >
                <EyeIcon className="w-4 h-4" />
                View Detailed Feedback
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Detailed Feedback Modal */}
      {showDetailModal && selectedAttempt && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowDetailModal(false)} />
            <div className="relative bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
              <div className="sticky top-0 bg-white border-b p-5 flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-blue-900">{selectedAttempt.quiz_title}</h2>
                  <p className="text-sm text-slate-500">Score: {selectedAttempt.earned_points} / {selectedAttempt.total_points}</p>
                </div>
                <button onClick={() => setShowDetailModal(false)} className="p-1 hover:bg-slate-100 rounded-full">
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
              <div className="p-6 space-y-6">
                {selectedAttempt.answers.map((ans, idx) => (
                  <div key={idx} className="border-b pb-4 last:border-0">
                    <div className="flex justify-between items-start mb-2">
                      <p className="font-semibold text-slate-800">Q{idx+1}. {ans.question_text}</p>
                      <span className={`text-sm font-bold px-2 py-1 rounded ${
                        ans.points_obtained === ans.max_points 
                          ? 'bg-green-100 text-green-700'
                          : ans.points_obtained > 0 
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                      }`}>
                        {ans.points_obtained} / {ans.max_points} marks
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mb-2">
                      <span className="font-medium">Your answer:</span> {ans.selected_answer_text}
                    </p>
                    {ans.correct_answer && (
                      <p className="text-sm text-green-700 mb-2">
                        <span className="font-medium">Correct answer:</span> {ans.correct_answer}
                      </p>
                    )}
                    {ans.feedback && (
                      <div className="bg-blue-50 rounded-lg p-3 mt-2">
                        <p className="text-sm text-blue-800">
                          <span className="font-medium">Feedback:</span> {ans.feedback}
                        </p>
                      </div>
                    )}
                    {ans.explanation && !ans.feedback && (
                      <div className="bg-gray-50 rounded-lg p-3 mt-2">
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">Explanation:</span> {ans.explanation}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
                {selectedAttempt.feedback && (
                  <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                    <p className="font-medium text-amber-800 mb-1">Overall Feedback</p>
                    <p className="text-amber-700">{selectedAttempt.feedback}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizResults;