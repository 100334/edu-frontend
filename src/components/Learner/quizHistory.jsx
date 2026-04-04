import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const QuizHistory = () => {
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAttempt, setSelectedAttempt] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => { fetchHistory(); }, []);

  const fetchHistory = async () => {
    try {
      const response = await api.get('/api/quiz/history');
      if (response.data.success) setAttempts(response.data.attempts);
    } catch (error) {
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

  // Small SVG Progress Circle Component
  const ScoreCircle = ({ percentage, size = 45 }) => {
    const radius = size * 0.4;
    const stroke = 4;
    const normalizedRadius = radius - stroke * 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;
    const color = percentage >= 50 ? '#10B981' : '#EF4444';

    return (
      <svg height={size} width={size} className="transform -rotate-90">
        <circle stroke="#E5E7EB" fill="transparent" strokeWidth={stroke} r={normalizedRadius} cx={size / 2} cy={size / 2} />
        <circle stroke={color} fill="transparent" strokeDasharray={circumference + ' ' + circumference} style={{ strokeDashoffset }} strokeLinecap="round" strokeWidth={stroke} r={normalizedRadius} cx={size / 2} cy={size / 2} />
      </svg>
    );
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 space-y-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      <p className="text-indigo-600 font-medium">Fetching your achievements...</p>
    </div>
  );

  if (attempts.length === 0) return (
    <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-gray-200">
      <div className="text-5xl mb-4">📚</div>
      <h3 className="text-lg font-bold text-gray-700">No Quizzes Found</h3>
      <p className="text-gray-500">Your academic journey starts here. Take your first quiz!</p>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <header className="mb-8">
        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Quiz History</h2>
        <p className="text-gray-500 mt-1">Review your performance and track your growth.</p>
      </header>

      <div className="grid gap-6">
        {attempts.map(attempt => (
          <div key={attempt.id} className="group bg-white hover:bg-indigo-50/30 transition-all duration-300 rounded-2xl shadow-sm hover:shadow-md border border-gray-100 p-5 flex items-center gap-6">
            <div className="relative flex-shrink-0">
              <ScoreCircle percentage={attempt.percentage} size={60} />
              <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-700">
                {Math.round(attempt.percentage)}%
              </div>
            </div>

            <div className="flex-grow">
              <h3 className="text-lg font-bold text-gray-800 group-hover:text-indigo-700 transition-colors">{attempt.quiz_title}</h3>
              <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                   {new Date(attempt.completed_at).toLocaleDateString()}
                </span>
                <span className={`px-2 py-0.5 rounded-md font-medium text-xs uppercase tracking-wider ${attempt.passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {attempt.passed ? 'Pass' : 'Fail'}
                </span>
              </div>
            </div>

            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-400 uppercase tracking-tighter">Score</p>
              <p className="text-xl font-black text-gray-800">{attempt.marks_earned}<span className="text-gray-300 mx-1">/</span>{attempt.total_marks}</p>
            </div>

            <button
              onClick={() => viewRevision(attempt.id)}
              className="bg-gray-50 hover:bg-indigo-600 hover:text-white p-3 rounded-xl transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        ))}
      </div>

      {/* Revision Modal */}
      {showModal && selectedAttempt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[85vh] overflow-hidden shadow-2xl flex flex-col scale-in" onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="p-6 bg-gradient-to-r from-indigo-600 to-indigo-800 text-white">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-bold">{selectedAttempt.quiz_title}</h3>
                  <p className="opacity-80">Revision & Feedback</p>
                </div>
                <div className="text-right bg-white/20 px-4 py-2 rounded-2xl">
                  <span className="block text-xs uppercase opacity-70">Final Result</span>
                  <span className="text-2xl font-black">{Math.round(selectedAttempt.percentage)}%</span>
                </div>
              </div>
            </div>

            {/* Questions List */}
            <div className="flex-grow overflow-y-auto p-6 space-y-8 bg-gray-50">
              {selectedAttempt.answers.map((q, idx) => {
                const isCorrect = q.points_obtained > 0;
                return (
                  <div key={idx} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                    <div className="flex items-start gap-3">
                      <span className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${isCorrect ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                        {idx + 1}
                      </span>
                      <p className="font-bold text-gray-800 text-lg leading-tight">{q.question_text}</p>
                    </div>

                    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className={`p-3 rounded-xl border ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                        <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Your Answer</p>
                        <p className={`text-sm font-semibold ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>{q.selected_answer_text || 'Skipped'}</p>
                      </div>
                      {!isCorrect && (
                        <div className="p-3 rounded-xl border border-indigo-100 bg-indigo-50/30">
                          <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Correct Answer</p>
                          <p className="text-sm font-semibold text-indigo-700">{q.correct_answer}</p>
                        </div>
                      )}
                    </div>

                    {q.explanation && (
                      <div className="mt-4 p-4 bg-amber-50 rounded-xl flex gap-3 border border-amber-100">
                        <span className="text-xl">💡</span>
                        <div>
                          <p className="text-xs font-bold text-amber-800 uppercase tracking-widest mb-1">Explanation</p>
                          <p className="text-sm text-amber-900 leading-relaxed">{q.explanation}</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="p-4 bg-white border-t flex justify-center">
              <button 
                onClick={() => setShowModal(false)}
                className="bg-gray-900 text-white px-8 py-3 rounded-2xl font-bold hover:bg-gray-800 transition-all shadow-lg active:scale-95"
              >
                Close Review
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizHistory;