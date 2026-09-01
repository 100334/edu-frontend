import React, { useState, useEffect, useRef } from 'react';
import { XMarkIcon, ArrowDownTrayIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import api from '../../services/api';
import html2pdf from 'html2pdf.js/dist/html2pdf.bundle.min.js';

// ── helpers ───────────────────────────────────────────────────────────────────
const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

const monthLabel = (dateStr) => {
  if (!dateStr) return 'Unknown';
  const d = new Date(dateStr);
  return `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
};

const monthKey = (dateStr) => {
  if (!dateStr) return '0000-00';
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const scoreColor = (pct) => {
  if (pct >= 75) return { text: '#2E7D32', bg: '#E8F5E9', bar: '#43A047' };
  if (pct >= 50) return { text: '#E65100', bg: '#FFF3E0', bar: '#FB8C00' };
  return               { text: '#C62828', bg: '#FFEBEE', bar: '#EF5350' };
};

// ─────────────────────────────────────────────────────────────────────────────

const QuizResults = ({ onRetake }) => {
  const [attempts,        setAttempts]        = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [error,           setError]           = useState(null);
  const [selectedAttempt, setSelectedAttempt] = useState(null);
  const [showModal,       setShowModal]       = useState(false);
  const [generatingPdf,   setGeneratingPdf]   = useState(false);
  const [collapsed,       setCollapsed]       = useState({});   // { monthKey: bool }
  const pdfRef = useRef(null);

  useEffect(() => { loadResults(); }, []);

  // ── data ──────────────────────────────────────────────────────────────────
  const loadResults = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const res   = await api.get('/api/quiz/history', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        setAttempts(res.data.attempts || []);
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
        setShowModal(true);
      } else toast.error('Could not load details');
    } catch {
      toast.error('Failed to load quiz details');
    }
  };

  const downloadPDF = async () => {
    if (!selectedAttempt || !pdfRef.current) return;
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
        .from(pdfRef.current)
        .save();
      toast.success('PDF downloaded!');
    } catch {
      toast.error('Failed to generate PDF');
    } finally {
      setGeneratingPdf(false);
    }
  };

  const handleRetake = (attempt) => {
    setShowModal(false);
    if (onRetake) onRetake(attempt.quiz_id);
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

  // ── group by month ─────────────────────────────────────────────────────────
  const grouped = React.useMemo(() => {
    const map = {};
    attempts.forEach(a => {
      const key = monthKey(a.completed_at);
      if (!map[key]) map[key] = { label: monthLabel(a.completed_at), key, items: [] };
      map[key].items.push(a);
    });
    // Sort newest month first
    return Object.values(map).sort((a, b) => b.key.localeCompare(a.key));
  }, [attempts]);

  const toggleMonth = (key) =>
    setCollapsed(p => ({ ...p, [key]: !p[key] }));

  // ── loading ────────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <div className="w-8 h-8 border-4 border-[#006770]/20 border-t-[#006770] rounded-full animate-spin" />
      <p className="text-sm text-slate-400">Loading results…</p>
    </div>
  );

  if (error && attempts.length === 0) return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center px-4">
      <span className="text-5xl">📋</span>
      <p className="text-sm text-slate-500 max-w-xs">{error}</p>
      <button onClick={loadResults}
        className="flex items-center gap-1.5 px-4 py-2 bg-[#006770] text-white rounded-lg text-sm">
        <ArrowPathIcon className="w-4 h-4" /> Retry
      </button>
    </div>
  );

  // ── main render ────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <div>
          <p className="text-sm font-bold text-[#003B46]">Quiz History</p>
          <p className="text-[11px] text-slate-400">
            {attempts.length} result{attempts.length !== 1 ? 's' : ''} across {grouped.length} month{grouped.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button onClick={loadResults}
          className="p-2 rounded-lg text-slate-400 hover:text-[#006770] hover:bg-[#006770]/10 transition"
          title="Refresh">
          <ArrowPathIcon className="w-4 h-4" />
        </button>
      </div>

      {attempts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 bg-white rounded-xl border border-slate-200 gap-2 text-center px-4">
          <span className="text-4xl">📋</span>
          <p className="text-sm text-slate-500">No graded quizzes yet.</p>
          <p className="text-[11px] text-slate-400">Complete quizzes in the Assessments folder — results appear here after marking.</p>
        </div>
      ) : grouped.map(({ key, label, items }) => {
        const isOpen = collapsed[key] !== true; // default open

        return (
          <div key={key} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">

            {/* Month header */}
            <button
              onClick={() => toggleMonth(key)}
              className="w-full flex items-center justify-between px-4 py-3 bg-[#003B46] hover:bg-[#004d5c] transition text-left"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-base">📅</span>
                <span className="text-sm font-bold text-white">{label}</span>
                <span className="text-[10px] text-white/50 bg-white/10 px-2 py-0.5 rounded-full">
                  {items.length} quiz{items.length !== 1 ? 'zes' : ''}
                </span>
              </div>
              <span className="text-white/50 text-xs">{isOpen ? '▾' : '▸'}</span>
            </button>

            {/* Quiz rows */}
            {isOpen && (
              <div className="divide-y divide-slate-100">
                {items.map(attempt => {
                  const pct  = Number(attempt.percentage || 0);
                  const col  = scoreColor(pct);
                  const date = attempt.completed_at
                    ? new Date(attempt.completed_at).toLocaleDateString('en', { day: 'numeric', month: 'short' })
                    : '—';

                  return (
                    <div key={attempt.id} className="px-4 py-3">
                      <div className="flex items-start gap-3">

                        {/* Score circle */}
                        <div
                          className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 font-black text-sm"
                          style={{ backgroundColor: col.bg, color: col.text }}
                        >
                          {pct}%
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-[#003B46] truncate">
                            {attempt.quiz_title || 'Quiz'}
                          </p>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
                            {attempt.subject && (
                              <span className="text-[11px] text-slate-400">📚 {attempt.subject}</span>
                            )}
                            <span className="text-[11px] text-slate-400">🗓 {date}</span>
                            <span className="text-[11px] text-slate-400">
                              ✏️ {attempt.marks_earned}/{attempt.total_marks}
                            </span>
                          </div>
                          {/* Progress bar */}
                          <div className="mt-1.5 h-1 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full"
                              style={{ width: `${pct}%`, backgroundColor: col.bar }} />
                          </div>
                        </div>

                        {/* Pass/Fail badge */}
                        <span
                          className="flex-shrink-0 text-[10px] font-bold px-2 py-1 rounded-full"
                          style={{ backgroundColor: col.bg, color: col.text }}
                        >
                          {pct >= 40 ? '✓ Pass' : '✗ Fail'}
                        </span>
                      </div>

                      {/* Feedback preview */}
                      {attempt.feedback && (
                        <p className="mt-1.5 text-[11px] text-slate-400 line-clamp-1 pl-14">
                          💬 {attempt.feedback}
                        </p>
                      )}

                      {/* Action buttons */}
                      <div className="flex gap-2 mt-2 pl-14">
                        <button
                          onClick={() => viewDetails(attempt.id)}
                          className="flex-1 py-1.5 rounded-lg border border-[#006770] text-[#006770] text-xs font-semibold hover:bg-[#006770]/10 transition"
                        >
                          View Details
                        </button>
                        {attempt.allow_retake && (
                          <button
                            onClick={() => handleRetake(attempt)}
                            className="flex-1 py-1.5 rounded-lg bg-amber-500 text-white text-xs font-semibold hover:bg-amber-600 transition flex items-center justify-center gap-1"
                          >
                            🔁 Retake
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* ── Detail modal ── */}
      {showModal && selectedAttempt && (() => {
        const stats = getStats(selectedAttempt);
        const col   = scoreColor(stats?.pct || 0);
        // find the matching attempt from our list to check allow_retake
        const listAttempt = attempts.find(a => a.id === selectedAttempt.id);
        const canRetake   = listAttempt?.allow_retake || false;

        return (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModal(false)} />
            <div className="relative bg-white w-full sm:rounded-2xl sm:max-w-lg max-h-[92vh] overflow-hidden flex flex-col shadow-2xl">

              {/* Modal header */}
              <div className="flex items-center gap-3 px-4 py-3 bg-[#003B46] flex-shrink-0">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">{selectedAttempt.quiz_title}</p>
                  <p className="text-[10px] text-white/60">
                    {selectedAttempt.earned_points} / {selectedAttempt.total_points} marks
                    {selectedAttempt.completed_at && (
                      <span className="ml-2">
                        · {new Date(selectedAttempt.completed_at).toLocaleDateString('en', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                    )}
                  </p>
                </div>
                <button onClick={downloadPDF} disabled={generatingPdf}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-medium transition disabled:opacity-50 flex-shrink-0">
                  <ArrowDownTrayIcon className="w-3.5 h-3.5" />
                  {generatingPdf ? '…' : 'PDF'}
                </button>
                <button onClick={() => setShowModal(false)}
                  className="w-7 h-7 rounded-lg bg-white/10 hover:bg-red-500 flex items-center justify-center transition flex-shrink-0">
                  <XMarkIcon className="w-4 h-4 text-white" />
                </button>
              </div>

              {/* Scrollable body */}
              <div className="overflow-y-auto flex-1 p-4 space-y-4">

                {/* Summary stats */}
                {stats && (
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { icon: '📊', label: 'Score',   value: `${stats.pct}%`,                   bg: col.bg,      color: col.text  },
                      { icon: '✏️', label: 'Marks',   value: `${stats.earned}/${stats.possible}`, bg: '#E3F2FD',   color: '#1565C0' },
                      { icon: '✅', label: 'Correct', value: stats.correct,                       bg: '#E8F5E9',   color: '#2E7D32' },
                      { icon: '❌', label: 'Wrong',   value: stats.incorrect,                     bg: '#FFEBEE',   color: '#C62828' },
                    ].map(c => (
                      <div key={c.label} className="rounded-xl p-2.5 text-center" style={{ backgroundColor: c.bg }}>
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

                {/* Retake banner */}
                {canRetake && (
                  <div className="bg-[#FFF8E1] border border-amber-300 rounded-xl px-4 py-3 flex items-center gap-3">
                    <span className="text-xl flex-shrink-0">🔁</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-amber-800">Retake available</p>
                      <p className="text-[11px] text-amber-600">Your teacher has allowed you to attempt this quiz again.</p>
                    </div>
                    <button
                      onClick={() => handleRetake(selectedAttempt)}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-lg transition flex-shrink-0"
                    >
                      Retake Now
                    </button>
                  </div>
                )}

                {/* Question breakdown */}
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Question Breakdown</p>
                  <div className="space-y-2">
                    {(selectedAttempt.answers || []).map((ans, idx) => {
                      const full    = ans.points_obtained === ans.max_points;
                      const partial = ans.points_obtained > 0 && ans.points_obtained < ans.max_points;
                      const icon    = full ? '✅' : partial ? '⚠️' : '❌';
                      const borderColor = full ? '#4CAF50' : partial ? '#FF9800' : '#F44336';

                      return (
                        <div key={idx} className="rounded-xl border overflow-hidden" style={{ borderColor }}>
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
                                    <span className="font-semibold">Correct: </span>{ans.correct_answer}
                                  </p>
                                )}
                                {(ans.feedback || ans.explanation) && (
                                  <p className="text-[11px] text-blue-700 bg-blue-50 rounded px-2 py-1">
                                    💡 {ans.feedback || ans.explanation}
                                  </p>
                                )}
                              </div>
                            </div>
                            <span className="flex-shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded"
                              style={{
                                backgroundColor: full ? '#E8F5E9' : partial ? '#FFF3E0' : '#FFEBEE',
                                color: full ? '#2E7D32' : partial ? '#E65100' : '#C62828',
                              }}>
                              {ans.points_obtained}/{ans.max_points}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Modal footer */}
              <div className="px-4 py-3 border-t border-slate-100 flex gap-2 flex-shrink-0">
                <button onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition font-medium">
                  Close
                </button>
                {canRetake && (
                  <button onClick={() => handleRetake(selectedAttempt)}
                    className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-bold transition flex items-center justify-center gap-1.5">
                    🔁 Retake Quiz
                  </button>
                )}
                <button onClick={downloadPDF} disabled={generatingPdf}
                  className="flex-1 py-2.5 bg-[#003B46] hover:bg-[#005060] text-white rounded-xl text-sm font-semibold transition flex items-center justify-center gap-1.5 disabled:opacity-50">
                  <ArrowDownTrayIcon className="w-4 h-4" /> PDF
                </button>
              </div>
            </div>

            {/* Hidden PDF content */}
            <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
              <div ref={pdfRef} style={{ fontFamily: 'Arial, sans-serif', padding: '20px', backgroundColor: 'white', maxWidth: '700px' }}>
                <div style={{ textAlign: 'center', borderBottom: '2px solid #003B46', paddingBottom: '10px', marginBottom: '20px' }}>
                  <h1 style={{ color: '#003B46', fontSize: '20px', margin: 0 }}>Progress Secondary School</h1>
                  <h2 style={{ color: '#006770', fontSize: '14px', margin: '4px 0 0' }}>Quiz Feedback Report</h2>
                  <p style={{ fontSize: '11px', color: '#888', margin: '4px 0 0' }}>
                    {selectedAttempt.quiz_title} — {selectedAttempt.completed_at ? new Date(selectedAttempt.completed_at).toLocaleDateString('en', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}
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
                {(selectedAttempt.answers || []).map((ans, idx) => (
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
