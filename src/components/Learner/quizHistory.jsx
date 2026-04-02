import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const QuizHistory = () => {
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAttempt, setSelectedAttempt] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await api.get('/api/quiz/history');
      if (response.data.success) {
        setAttempts(response.data.attempts);
      }
    } catch (error) {
      console.error('Failed to fetch quiz history:', error);
      toast.error('Could not load quiz history');
    } finally {
      setLoading(false);
    }
  };

  const viewRevision = async (attemptId) => {
    try {
      const response = await api.get(`/api/quiz/attempt/${attemptId}`);
      if (response.data.success) {
        setSelectedAttempt(response.data.attempt);
        setShowModal(true);
      }
    } catch (error) {
      toast.error('Failed to load quiz details');
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedAttempt(null);
  };

  if (loading) return <div className="text-center py-8">Loading quiz history...</div>;
  if (attempts.length === 0) return <div className="text-center py-8 text-gray-500">You haven't taken any quizzes yet.</div>;

  return (
    <>
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">My Quiz History</h2>
        <div className="grid gap-4">
          {attempts.map(attempt => (
            <div key={attempt.id} className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
              <div className="flex justify-between items-start flex-wrap gap-2">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">{attempt.quiz_title}</h3>
                  <p className="text-sm text-gray-500">Completed: {new Date(attempt.completed_at).toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${attempt.passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {attempt.passed ? 'Passed' : 'Failed'}
                  </span>
                  <p className="text-sm mt-1">
                    Score: {attempt.marks_earned} / {attempt.total_marks} ({attempt.percentage}%)
                  </p>
                </div>
              </div>
              <div className="mt-3">
                <button
                  onClick={() => viewRevision(attempt.id)}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  Review Answers
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Revision Modal */}
      {showModal && selectedAttempt && (
        <div className="fixed inset-0 z-50 overflow-y-auto" onClick={closeModal}>
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="fixed inset-0 bg-black/50" onClick={closeModal}></div>
            <div className="relative bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-xl" onClick={e => e.stopPropagation()}>
              <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold">{selectedAttempt.quiz_title}</h3>
                  <p className="text-sm text-gray-500">
                    Score: {selectedAttempt.earned_points} / {selectedAttempt.total_points} ({Math.round(selectedAttempt.percentage)}%)
                  </p>
                </div>
                <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-6 space-y-6">
                {selectedAttempt.answers.map((q, idx) => (
                  <div key={idx} className="border-b border-gray-200 pb-4 last:border-0">
                    <p className="font-semibold text-gray-800">Q{idx+1}. {q.question_text}</p>
                    <div className="mt-2 pl-4 space-y-1 text-sm">
                      <p><span className="font-medium">Your answer:</span> {q.selected_answer_text || 'Not answered'}</p>
                      <p><span className="font-medium">Correct answer:</span> {q.correct_answer}</p>
                      <p><span className="font-medium">Marks:</span> {q.points_obtained} / {q.max_points}</p>
                      {q.explanation && <p className="text-gray-600 text-xs mt-1">💡 {q.explanation}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default QuizHistory;