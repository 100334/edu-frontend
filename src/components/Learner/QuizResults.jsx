import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DocumentTextIcon, EyeIcon, XMarkIcon,
  ChatBubbleLeftRightIcon, ArrowDownTrayIcon, ArrowPathIcon,
  CheckCircleIcon, XCircleIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import api from '../../services/api';
import html2pdf from 'html2pdf.js';

const QuizResults = () => {
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAttempt, setSelectedAttempt] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const pdfContentRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadResults();
  }, []);

  const loadResults = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await api.get('/api/quiz/history', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        const data = response.data.attempts || [];
        setAttempts(data);
        if (data.length === 0) {
          setError('No graded quizzes found. Complete quizzes and wait for teacher to mark them.');
        }
      } else {
        setError(response.data.message || 'Failed to load results');
      }
    } catch (err) {
      console.error('Error loading results:', err);
      setError('Could not connect to server. Please try again later.');
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

  const downloadPDF = async () => {
    if (!selectedAttempt || !pdfContentRef.current) return;
    setGeneratingPdf(true);
    try {
      const element = pdfContentRef.current;
      const opt = {
        margin: [0.5, 0.5, 0.5, 0.5],
        filename: `${selectedAttempt.quiz_title}_feedback.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, letterRendering: true, useCORS: true },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
      };
      await html2pdf().set(opt).from(element).save();
      toast.success('Feedback PDF downloaded!');
    } catch (error) {
      console.error('PDF error:', error);
      toast.error('Failed to generate PDF');
    } finally {
      setGeneratingPdf(false);
    }
  };

  const calculateStats = (attempt) => {
    if (!attempt) return null;
    const totalQuestions = attempt.answers?.length || 0;
    const correct = attempt.answers?.filter(a => a.is_correct === true).length || 0;
    const partially = attempt.answers?.filter(a => a.points_obtained > 0 && a.points_obtained < a.max_points).length || 0;
    const incorrect = totalQuestions - correct - partially;
    const earned = attempt.earned_points || 0;
    const possible = attempt.total_points || 0;
    const percentFromScores = possible > 0 ? Math.round((earned / possible) * 100) : 0;
    const percent = attempt.percentage !== undefined && attempt.percentage !== null
      ? Number(attempt.percentage)
      : percentFromScores;
    return { totalQuestions, correct, partially, incorrect, earned, possible, percent, passed: percent >= 40 };
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-azure/20 border-t-azure"></div>
        <p className="ml-3 text-slate-500">Loading your results...</p>
      </div>
    );
  }

  if (error && attempts.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
        <DocumentTextIcon className="w-16 h-16 mx-auto text-slate-300 mb-4" />
        <p className="text-red-500 mb-2">{error}</p>
        <div className="flex justify-center gap-3 mt-4">
          <button onClick={loadResults} className="px-4 py-2 bg-azure text-white rounded-lg hover:bg-azure/90">
            Retry
          </button>
          <button onClick={() => navigate('/learner/dashboard?tab=learning')} className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700">
            Go to Learning Space
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-2 py-4">
      <div className="flex flex-wrap justify-between items-center mb-6 gap-3">
        <div>
          <h2 className="text-xl font-bold text-darkblue">My Quiz Results</h2>
          <p className="text-sm text-slate-500">View your marks and teacher feedback</p>
        </div>
        <button onClick={loadResults} className="flex items-center gap-2 px-3 py-1.5 bg-azure text-white rounded-lg text-sm hover:bg-azure/90">
          <ArrowPathIcon className="w-4 h-4" /> Refresh
        </button>
      </div>

      {attempts.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
          <DocumentTextIcon className="w-16 h-16 mx-auto text-slate-300 mb-4" />
          <p className="text-slate-500">No graded quizzes yet.</p>
          <p className="text-sm text-slate-400">Complete quizzes in the Assessments folder – results appear here after marking.</p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-xl border border-slate-300 shadow-sm">
          <table className="min-w-full border-collapse">
            <thead style={{ background: 'linear-gradient(90deg, #00B4D8 0%, #0A192F 50%, #00B4D8 100%)' }}>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider border border-white/30">Quiz Title</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider border border-white/30">Subject</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider border border-white/30">Date</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-white uppercase tracking-wider border border-white/30">Score</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-white uppercase tracking-wider border border-white/30">Percentage</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-white uppercase tracking-wider border border-white/30">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider border border-white/30">Feedback</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-white uppercase tracking-wider border border-white/30">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {attempts.map((attempt, idx) => {
                const stats = calculateStats(attempt);
                const rowBg = idx % 2 === 0 ? 'bg-white' : 'bg-slate-50';
                return (
                  <tr key={attempt.id} className={`${rowBg} hover:bg-slate-100 transition`}>
                    <td className="px-4 py-3 text-sm font-medium text-darkblue border border-slate-200">{attempt.quiz_title || 'Quiz'}</td>
                    <td className="px-4 py-3 text-sm text-slate-600 border border-slate-200">{attempt.subject || 'General'}</td>
                    <td className="px-4 py-3 text-sm text-slate-600 border border-slate-200">{new Date(attempt.completed_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-center text-sm font-semibold text-azure border border-slate-200">{attempt.marks_earned} / {attempt.total_marks}</td>
                    <td className="px-4 py-3 text-center border border-slate-200">
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-sm font-bold">{attempt.percentage || 0}%</span>
                        <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-teal-500 to-azure rounded-full" style={{ width: `${attempt.percentage || 0}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center border border-slate-200">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${stats?.passed ? 'bg-teal-100 text-teal-700' : 'bg-red-100 text-red-700'}`}>
                        {stats?.passed ? 'Passed' : 'Failed'}
                      </span>
                    </td>
                    <td className="px-4 py-3 max-w-xs border border-slate-200">
                      {attempt.feedback ? (
                        <div className="flex items-start gap-1">
                          <ChatBubbleLeftRightIcon className="w-4 h-4 text-azure mt-0.5 shrink-0" />
                          <p className="text-xs text-slate-600 line-clamp-2">{attempt.feedback}</p>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center border border-slate-200">
                      <button onClick={() => viewDetails(attempt.id)} className="p-1.5 bg-azure/10 text-azure rounded-md hover:bg-azure hover:text-white transition">
                        <EyeIcon className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Detailed Modal (unchanged) */}
      {showDetailModal && selectedAttempt && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowDetailModal(false)} />
            <div className="relative bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
              <div className="sticky top-0 bg-white border-b p-5 flex flex-wrap justify-between items-center gap-3">
                <div>
                  <h2 className="text-xl font-bold text-darkblue">{selectedAttempt.quiz_title}</h2>
                  <p className="text-sm text-slate-500">Score: {selectedAttempt.earned_points} / {selectedAttempt.total_points}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={downloadPDF} disabled={generatingPdf} className="flex items-center gap-1 px-3 py-1.5 bg-teal-600 text-white rounded-lg text-sm hover:bg-teal-700 transition disabled:opacity-50">
                    <ArrowDownTrayIcon className="w-4 h-4" /> {generatingPdf ? 'Generating...' : 'PDF'}
                  </button>
                  <button onClick={() => setShowDetailModal(false)} className="p-1 hover:bg-slate-100 rounded-full">
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {(() => {
                  const stats = calculateStats(selectedAttempt);
                  if (!stats) return null;
                  return (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                      <div className="bg-gradient-to-br from-darkblue to-darkblue/80 rounded-xl p-3 text-white text-center">
                        <div className="text-2xl font-bold">{stats.earned}/{stats.possible}</div>
                        <div className="text-xs opacity-80">Total Marks</div>
                      </div>
                      <div className={`rounded-xl p-3 text-center text-white ${stats.percent >= 70 ? 'bg-teal-600' : stats.percent >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}>
                        <div className="text-2xl font-bold">{stats.percent}%</div>
                        <div className="text-xs opacity-90">Percentage</div>
                      </div>
                      <div className="bg-white border-2 border-azure rounded-xl p-3 text-center">
                        <CheckCircleIcon className="w-6 h-6 mx-auto mb-1 text-teal-600" />
                        <div className="text-2xl font-bold text-teal-700">{stats.correct}</div>
                        <div className="text-xs text-slate-500">Correct</div>
                      </div>
                      <div className="bg-white border-2 border-red-200 rounded-xl p-3 text-center">
                        <XCircleIcon className="w-6 h-6 mx-auto mb-1 text-red-500" />
                        <div className="text-2xl font-bold text-red-600">{stats.incorrect}</div>
                        <div className="text-xs text-slate-500">Incorrect</div>
                      </div>
                    </div>
                  );
                })()}

                <h3 className="font-semibold text-lg text-darkblue mt-4 mb-2">Question Breakdown</h3>
                {selectedAttempt.answers.map((ans, idx) => (
                  <div key={idx} className="border-b pb-4 last:border-0">
                    <div className="flex justify-between items-start mb-2 flex-wrap gap-2">
                      <p className="font-semibold text-slate-800">Q{idx+1}. {ans.question_text}</p>
                      <span className={`text-sm font-bold px-2 py-1 rounded ${ans.points_obtained === ans.max_points ? 'bg-teal-100 text-teal-700' : ans.points_obtained > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                        {ans.points_obtained} / {ans.max_points} marks
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mb-2"><span className="font-medium">Your answer:</span> {ans.selected_answer_text || '(No answer provided)'}</p>
                    {ans.correct_answer && <p className="text-sm text-green-700 mb-2"><span className="font-medium">Correct answer:</span> {ans.correct_answer}</p>}
                    {ans.feedback && <div className="bg-azure/5 rounded-lg p-3 mt-2 border-l-4 border-azure"><p className="text-sm text-azure-800"><span className="font-medium">Feedback:</span> {ans.feedback}</p></div>}
                    {ans.explanation && !ans.feedback && <div className="bg-slate-50 rounded-lg p-3 mt-2"><p className="text-sm text-slate-700"><span className="font-medium">Explanation:</span> {ans.explanation}</p></div>}
                  </div>
                ))}
                {selectedAttempt.feedback && (
                  <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                    <p className="font-medium text-amber-800 mb-1">Overall Feedback</p>
                    <p className="text-amber-700">{selectedAttempt.feedback}</p>
                  </div>
                )}
              </div>

              {/* Hidden PDF content */}
              <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
                <div ref={pdfContentRef} className="pdf-feedback" style={{ fontFamily: 'Arial, sans-serif', maxWidth: '100%', padding: '20px', backgroundColor: 'white' }}>
                  <div style={{ textAlign: 'center', borderBottom: '2px solid #1E3A5F', paddingBottom: '10px', marginBottom: '20px' }}>
                    <h1 style={{ color: '#0A192F', fontSize: '22px' }}>Progress Secondary School</h1>
                    <h2 style={{ color: '#00B4D8', fontSize: '16px' }}>Quiz Feedback Report</h2>
                    <p style={{ fontSize: '12px', color: '#666' }}>{selectedAttempt.quiz_title} – {new Date().toLocaleDateString()}</p>
                  </div>
                  {(() => {
                    const stats = calculateStats(selectedAttempt);
                    return stats && (
                      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                        <div><strong>Total Marks:</strong> {stats.earned}/{stats.possible}</div>
                        <div><strong>Percentage:</strong> {stats.percent}%</div>
                        <div><strong>Correct:</strong> {stats.correct}</div>
                        <div><strong>Incorrect:</strong> {stats.incorrect}</div>
                      </div>
                    );
                  })()}
                  <hr />
                  {selectedAttempt.answers.map((ans, idx) => (
                    <div key={idx} style={{ marginBottom: '15px', pageBreakInside: 'avoid' }}>
                      <p><strong>Q{idx+1}. {ans.question_text}</strong> <span style={{ float: 'right' }}>{ans.points_obtained}/{ans.max_points} marks</span></p>
                      <p><strong>Your answer:</strong> {ans.selected_answer_text || '(No answer provided)'}</p>
                      {ans.correct_answer && <p><strong>Correct answer:</strong> {ans.correct_answer}</p>}
                      {ans.feedback && <p style={{ backgroundColor: '#E0F7FA', padding: '8px' }}><strong>Feedback:</strong> {ans.feedback}</p>}
                    </div>
                  ))}
                  {selectedAttempt.feedback && (
                    <div style={{ backgroundColor: '#FFF3E0', padding: '12px', marginTop: '20px' }}>
                      <strong>Overall Feedback:</strong> {selectedAttempt.feedback}
                    </div>
                  )}
                  <div style={{ fontSize: '10px', color: '#999', textAlign: 'center', marginTop: '30px' }}>
                    Generated on {new Date().toLocaleString()}
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

export default QuizResults;