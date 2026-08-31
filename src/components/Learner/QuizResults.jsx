import React, { useState, useEffect, useRef } from 'react';
import { XMarkIcon, ArrowDownTrayIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import api from '../../services/api';
import html2pdf from 'html2pdf.js/dist/html2pdf.bundle.min.js';

const QuizResults = () => {
  const [attempts,         setAttempts]         = useState([]);
  const [loading,          setLoading]          = useState(true);
  const [error,            setError]            = useState(null);
  const [selectedAttempt,  setSelectedAttempt]  = useState(null);
  const [showDetailModal,  setShowDetailModal]  = useState(false);
  const [generatingPdf,    setGeneratingPdf]    = useState(false);
  const pdfContentRef = useRef(null);

  useEffect(() => { loadResults(); }, []);

  const loadResults = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const res   = await api.get('/api/quiz/history', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        const data = res.data.attempts || [];
        setAttempts(data);
        if (data.length === 0)
          setError('No graded quizzes yet. Complete quizzes — results appear here after marking.');
      } else {
        setError(res.data.message || 'Failed to load results');
      }
    } catch {
      setError('Could not connect. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const viewDetails = async (attemptId) => {
    try {
      const token = localStorage.getItem('token');
      const res   = await api.get(`/api/quiz/attempt/${attemptId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        setSelectedAttempt(res.data.attempt);
        setShowDetailModal(true);
      } else {
        toast.error('Could not load details');
      }
    } catch {
      toast.error('Failed to load quiz details');
    }
  };

  const downloadPDF = async () => {
    if (!selectedAttempt || !pdfContentRef.current) return;
    setGeneratingPdf(true);
    try {
      await html2pdf()
        .set({
          margin: [0.5, 0.5, 0.5, 0.5],
          filename: `${selectedAttempt.quiz_title}_feedback.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' },
        })
        .from(pdfContentRef.current)
        .save();
      toast.success('PDF downloaded!');
    } catch {
      toast.error('Failed to generate PDF');
    } finally {
      setGeneratingPdf(false);
    }
  };

  const getStats = (attempt) => {
    if (!attempt) return null;
    const total     = attempt.answers?.length || 0;
    const correct   = attempt.answers?.filter(a => a.is_correct === true).length || 0;
    const incorrect = total - correct;
    const earned    = attempt.earned_points  || 0;
    const possible  = attempt.total_points   || 0;
    const pct = attempt.percentage !== undefined && attempt.percentage !== null
      ? Number(attempt.percentage)
      : (possible > 0 ? Math.round((earned / possible) * 100) : 0);
    return { total, correct, incorrect, earned, possible, pct, passed: pct >= 40 };
  };

  // ── score colour ────────────────────────────────────────────────────────────
  const scoreColor = (pct) => {
    if (pct >= 75) return { text: '#2E7D32', bg: '#E8F5E9' };
    if (pct >= 50) return { text: '#F57C00', bg: '#FFF3E0' };
    return               { text: '#C62828', bg: '#FFEBEE' };
  };

  // ── loading ─────────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <div className="w-8 h-8 border-4 border-[#006770]/20 border-t-[#006770] rounded-full animate-spin" />
      <p className="text-sm text-slate-400">Loading results…</p>
    </div>
  );

  // ── empty / error ───────────────────────────────────────────────────────────
  if (error && attempts.length === 0) return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center px-4">
      <span className="text-5xl">📋</span>
      <p className="text-sm text-slate-500 max-w-xs">{error}</p>
      <button
        onClick={loadResults}
        className="flex items-center gap-1.5 px-4 py-2 bg-[#006770] text-white rounded-lg text-sm"
      >
        <ArrowPathIcon className="w-4 h-4" /> Retry
      </button>
    </div>
  );

  // ── main list ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-3">

      {/* Header row */}
      <div className="flex items-center justify-between px-1">
        <div>
          <p className="text-sm font-bold text-[#003B46]">My Results</p>
          <p className="text-[11px] text-slate-400">{attempts.length} quiz{attempts.length !== 1 ? 'zes' : ''} graded</p>
        </div>
        <button
          onClick={loadResults}
          className="p-2 rounded-lg text-slate-400 hover:text-[#006770] hover:bg-[#006770]/10 transition"
          title="Refresh"
        >
          <ArrowPathIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Cards */}
      {attempts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 bg-white rounded-xl border border-slate-200 gap-2 text-center px-4">
          <span className="text-4xl">📋</span>
          <p className="text-sm text-slate-500">No graded quizzes yet.</p>
          <p className="text-[11px] text-slate-400">Complete quizzes in the Assessments folder — results appear here after marking.</p>
        </div>
      ) : (
        attempts.map((attempt) => {
          const pct    = Number(attempt.percentage || 0);
          const passed = pct >= 40;
          const col    = scoreColor(pct);
          return (
            <div
              key={attempt.id}
              className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
            >
              {/* Top strip — coloured by score */}
              <div className="h-1" style={{ backgroundColor: col.text }} />

              <div className="px-4 py-3 flex items-start gap-3">
                {/* Score badge */}
                <div
                  className="w-12 h-12 rounded-xl flex flex-col items-center justify-center flex-shrink-0 font-black"
                  style={{ backgroundColor: col.bg, color: col.text }}
                >
                  <span className="text-base leading-none">{pct}%</span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[#003B46] truncate">
                    {attempt.quiz_title || 'Quiz'}
                  </p>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
                    {attempt.subject && (
                      <span className="text-[11px] text-slate-400">
                        📚 {attempt.subject}
                      </span>
                    )}
                    <span className="text-[11px] text-slate-400">
                      🗓 {new Date(attempt.completed_at).toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      ✏️ {attempt.marks_earned} / {attempt.total_marks}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, backgroundColor: col.text }}
                    />
                  </div>
                </div>

                {/* Pass / Fail badge */}
                <span
                  className="flex-shrink-0 text-[10px] font-bold px-2 py-1 rounded-full mt-0.5"
                  style={{ backgroundColor: col.bg, color: col.text }}
                >
                  {passed ? '✓ Pass' : '✗ Fail'}
                </span>
              </div>

              {/* Feedback preview */}
              {attempt.feedback && (
                <div className="px-4 pb-2">
                  <p className="text-[11px] text-slate-500 line-clamp-1">
                    💬 {attempt.feedback}
                  </p>
                </div>
              )}

              {/* View button */}
              <div className="px-4 pb-3">
                <button
                  onClick={() => viewDetails(attempt.id)}
                  className="w-full py-2 rounded-lg border border-[#006770] text-[#006770] text-xs font-semibold hover:bg-[#006770]/10 transition"
                >
                  View Details
                </button>
              </div>
            </div>
          );
        })
      )}

      {/* ── Detail modal ── */}
      {showDetailModal && selectedAttempt && (() => {
        const stats = getStats(selectedAttempt);
        const col   = scoreColor(stats?.pct || 0);
        return (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowDetailModal(false)} />
            <div className="relative bg-white w-full sm:rounded-2xl sm:max-w-lg max-h-[92vh] overflow-hidden flex flex-col shadow-2xl">

              {/* Modal header */}
              <div className="flex items-center gap-3 px-4 py-3 bg-[#003B46] flex-shrink-0">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">{selectedAttempt.quiz_title}</p>
                  <p className="text-[10px] text-white/60">
                    {selectedAttempt.earned_points} / {selectedAttempt.total_points} marks
                  </p>
                </div>
                <button
                  onClick={downloadPDF}
                  disabled={generatingPdf}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-medium transition disabled:opacity-50 flex-shrink-0"
                >
                  <ArrowDownTrayIcon className="w-3.5 h-3.5" />
                  {generatingPdf ? '…' : 'PDF'}
                </button>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="w-7 h-7 rounded-lg bg-white/10 hover:bg-red-500 flex items-center justify-center transition flex-shrink-0"
                >
                  <XMarkIcon className="w-4 h-4 text-white" />
                </button>
              </div>

              {/* Scrollable body */}
              <div className="overflow-y-auto flex-1 p-4 space-y-4">

                {/* Stats row */}
                {stats && (
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { icon: '📊', label: 'Score',    value: `${stats.pct}%`,            bg: col.bg,      color: col.text },
                      { icon: '✏️', label: 'Marks',    value: `${stats.earned}/${stats.possible}`, bg: '#E3F2FD', color: '#1565C0' },
                      { icon: '✅', label: 'Correct',  value: stats.correct,               bg: '#E8F5E9',   color: '#2E7D32' },
                      { icon: '❌', label: 'Wrong',    value: stats.incorrect,             bg: '#FFEBEE',   color: '#C62828' },
                    ].map(c => (
                      <div
                        key={c.label}
                        className="rounded-xl p-2.5 text-center"
                        style={{ backgroundColor: c.bg }}
                      >
                        <div className="text-base mb-0.5">{c.icon}</div>
                        <div className="text-sm font-black" style={{ color: c.color }}>{c.value}</div>
                        <div className="text-[9px] font-semibold uppercase text-slate-400">{c.label}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Overall feedback */}
                {selectedAttempt.feedback && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                    <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wide mb-1">💬 Teacher Feedback</p>
                    <p className="text-sm text-amber-800">{selectedAttempt.feedback}</p>
                  </div>
                )}

                {/* Question breakdown */}
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Question Breakdown</p>
                  <div className="space-y-3">
                    {selectedAttempt.answers.map((ans, idx) => {
                      const full    = ans.points_obtained === ans.max_points;
                      const partial = ans.points_obtained > 0 && ans.points_obtained < ans.max_points;
                      const none    = ans.points_obtained === 0;
                      const icon    = full ? '✅' : partial ? '⚠️' : '❌';
                      const borderColor = full ? '#4CAF50' : partial ? '#FF9800' : '#F44336';

                      return (
                        <div
                          key={idx}
                          className="rounded-xl border overflow-hidden"
                          style={{ borderColor }}
                        >
                          <div className="flex items-start gap-2 px-3 py-2.5">
                            <span className="text-base flex-shrink-0 mt-0.5">{icon}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-[#003B46]">
                                Q{idx + 1}. {ans.question_text}
                              </p>
                              <div className="mt-1.5 space-y-1">
                                <p className="text-[11px] text-slate-600">
                                  <span className="font-semibold">Your answer: </span>
                                  {ans.selected_answer_text || '(no answer)'}
                                </p>
                                {ans.correct_answer && !full && (
                                  <p className="text-[11px] text-green-700">
                                    <span className="font-semibold">Correct: </span>
                                    {ans.correct_answer}
                                  </p>
                                )}
                                {(ans.feedback || ans.explanation) && (
                                  <p className="text-[11px] text-blue-700 bg-blue-50 rounded px-2 py-1">
                                    💡 {ans.feedback || ans.explanation}
                                  </p>
                                )}
                              </div>
                            </div>
                            <span
                              className="flex-shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded"
                              style={{
                                backgroundColor: full ? '#E8F5E9' : partial ? '#FFF3E0' : '#FFEBEE',
                                color: full ? '#2E7D32' : partial ? '#E65100' : '#C62828',
                              }}
                            >
                              {ans.points_obtained}/{ans.max_points}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Hidden PDF content */}
            <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
              <div ref={pdfContentRef} style={{ fontFamily: 'Arial, sans-serif', padding: '20px', backgroundColor: 'white', maxWidth: '700px' }}>
                <div style={{ textAlign: 'center', borderBottom: '2px solid #003B46', paddingBottom: '10px', marginBottom: '20px' }}>
                  <h1 style={{ color: '#003B46', fontSize: '20px', margin: 0 }}>Progress Secondary School</h1>
                  <h2 style={{ color: '#006770', fontSize: '14px', margin: '4px 0 0' }}>Quiz Feedback Report</h2>
                  <p style={{ fontSize: '11px', color: '#888', margin: '4px 0 0' }}>
                    {selectedAttempt.quiz_title} — {new Date().toLocaleDateString()}
                  </p>
                </div>
                {stats && (
                  <div style={{ display: 'flex', gap: '30px', marginBottom: '16px', fontSize: '12px' }}>
                    <div><strong>Marks:</strong> {stats.earned}/{stats.possible}</div>
                    <div><strong>Score:</strong> {stats.pct}%</div>
                    <div><strong>Correct:</strong> {stats.correct}</div>
                    <div><strong>Incorrect:</strong> {stats.incorrect}</div>
                    <div><strong>Result:</strong> {stats.passed ? 'PASS' : 'FAIL'}</div>
                  </div>
                )}
                {selectedAttempt.feedback && (
                  <div style={{ background: '#FFF3E0', padding: '10px', borderRadius: '6px', marginBottom: '16px', fontSize: '12px' }}>
                    <strong>Teacher Feedback:</strong> {selectedAttempt.feedback}
                  </div>
                )}
                <hr style={{ margin: '10px 0' }} />
                {selectedAttempt.answers.map((ans, idx) => (
                  <div key={idx} style={{ marginBottom: '14px', pageBreakInside: 'avoid', fontSize: '12px' }}>
                    <p><strong>Q{idx + 1}. {ans.question_text}</strong>
                      <span style={{ float: 'right' }}>{ans.points_obtained}/{ans.max_points} marks</span>
                    </p>
                    <p><strong>Your answer:</strong> {ans.selected_answer_text || '(no answer)'}</p>
                    {ans.correct_answer && <p><strong>Correct:</strong> {ans.correct_answer}</p>}
                    {(ans.feedback || ans.explanation) && (
                      <p style={{ background: '#E0F7FA', padding: '6px', borderRadius: '4px' }}>
                        <strong>Feedback:</strong> {ans.feedback || ans.explanation}
                      </p>
                    )}
                    <hr style={{ margin: '8px 0', borderColor: '#eee' }} />
                  </div>
                ))}
                <div style={{ fontSize: '10px', color: '#aaa', textAlign: 'center', marginTop: '20px' }}>
                  Generated on {new Date().toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default QuizResults;
