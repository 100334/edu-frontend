import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ClockIcon, FlagIcon, PaperAirplaneIcon, ExclamationCircleIcon,
  DocumentCheckIcon, PhotoIcon, XMarkIcon, ChevronLeftIcon,
  ChevronRightIcon, EyeIcon, DocumentArrowDownIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolid } from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';
import api from '../../services/api';
import html2pdf from 'html2pdf.js/dist/html2pdf.bundle.min.js';

function normalizeQuizIdProp(q) {
  if (q == null || q === '') return null;
  if (typeof q === 'number' && Number.isFinite(q)) return String(Math.trunc(q));
  const s = String(q).trim();
  if (!s || s === 'undefined' || s === 'null' || s === 'NaN' || s === '[object Object]') return null;
  return s;
}

const QuizTaking = ({ quizId, onComplete }) => {
  const [quiz, setQuiz] = useState(null);
  const [result, setResult] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [attemptId, setAttemptId] = useState(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);
  const pageRef = useRef(null);
  const pdfContentRef = useRef(null);
  const navigate = useNavigate();
  const resolvedQuizId = useMemo(() => normalizeQuizIdProp(quizId), [quizId]);

  const QUESTIONS_PER_PAGE = 3;

  useEffect(() => { loadQuiz(); }, [quizId]);

  useEffect(() => {
    if (timeLeft === 0 && !submitting) submitQuiz();
    const timer = setInterval(() => {
      if (timeLeft > 0 && !submitting) setTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, submitting]);

  const autoSavePage = async (page) => {
    if (!attemptId || !resolvedQuizId) return;
    const startIdx = page * QUESTIONS_PER_PAGE;
    const pageQuestions = displayQuestions.slice(startIdx, startIdx + QUESTIONS_PER_PAGE);
    for (const { questionIndex } of pageQuestions) {
      const ans = answers[questionIndex];
      if (ans !== undefined) {
        try {
          const token = localStorage.getItem('token');
          await api.post(`/api/quiz/${encodeURIComponent(resolvedQuizId)}/save-answer`, {
            question_index: questionIndex,
            answer: ans,
            attempt_id: attemptId
          }, { headers: { Authorization: `Bearer ${token}` } });
        } catch (error) {  }
      }
    }
  };

  const handlePageChange = (newPage) => {
    autoSavePage(currentPage);
    setCurrentPage(newPage);
    if (pageRef.current) pageRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const loadQuiz = async () => {
    const idParam = resolvedQuizId;
    if (!idParam) {
      toast.error('Invalid quiz link.');
      navigate('/learner/dashboard');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const startRes = await api.post(`/api/quiz/${encodeURIComponent(idParam)}/start`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (startRes.data.success) setAttemptId(startRes.data.attempt_id);
      
      const res = await api.get(`/api/quiz/${encodeURIComponent(idParam)}/questions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.already_completed) {
        toast.error('Quiz already submitted.');
        setTimeout(() => navigate('/learner/dashboard'), 1500);
        return;
      }
      setQuiz(res.data.quiz);
      const qs = (res.data.questions || []).map(q => ({
        ...q,
        section: String(q.section || 'A').toUpperCase() === 'B' ? 'B' : 'A',
        marks: q.marks ?? q.points ?? 1
      }));
      setQuestions(qs);
      setTimeLeft(res.data.quiz.duration * 60);
      if (res.data.saved_answers) setAnswers(res.data.saved_answers);
    } catch (error) {
toast.error('Failed to load quiz.');
      navigate('/learner/dashboard');
    }
  };

  const handleAnswer = (idx, val) => setAnswers(prev => ({ ...prev, [idx]: val }));
  const handleShortAnswer = (idx, text) => setAnswers(prev => ({ ...prev, [idx]: text }));

  const handleOpenReview = () => {
    autoSavePage(currentPage);
    setShowReviewModal(true);
  };

  const handleConfirmSubmit = () => setShowConfirmDialog(true);

  const submitQuiz = async () => {
    setSubmitting(true);
    setShowConfirmDialog(false);
    setShowReviewModal(false);
    await autoSavePage(currentPage);
    try {
      const token = localStorage.getItem('token');
      const answersPayload = questions.map((_, idx) => answers[idx] !== undefined ? answers[idx] : null);
      const payload = {
        attempt_id: attemptId,
        answers: answersPayload,
        time_taken: (quiz.duration * 60) - timeLeft
      };
      const response = await api.post(`/api/quiz/${encodeURIComponent(resolvedQuizId)}/submit`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setResult(response.data.attempt);
      } else throw new Error(response.data.message);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Submission failed');
      setSubmitting(false);
    }
  };

  const downloadReviewPDF = async () => {
    if (!pdfContentRef.current) return;
    const loadingToast = toast.loading('Generating PDF, please wait...');
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      const element = pdfContentRef.current;
      const opt = {
        margin: [0.5, 0.5, 0.5, 0.5],
        filename: `${quiz.title}_answers_review.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, letterRendering: true, useCORS: true, logging: false },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
      };
      await html2pdf().set(opt).from(element).save();
      toast.dismiss(loadingToast);
      toast.success('PDF generated successfully!');
    } catch (error) {
toast.dismiss(loadingToast);
      toast.error('Failed to generate PDF. Please try again.');
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
    progress: ((Object.keys(answers).length) / questions.length) * 100
  };
  const displayQuestions = useMemo(() => questions
    .map((question, questionIndex) => ({ question, questionIndex }))
    .sort((a, b) => {
      const sectionOrder = (a.question.section === 'B' ? 1 : 0) - (b.question.section === 'B' ? 1 : 0);
      return sectionOrder || a.questionIndex - b.questionIndex;
    }), [questions]);
  const totalPages = Math.ceil(questions.length / QUESTIONS_PER_PAGE);
  const startIdx = currentPage * QUESTIONS_PER_PAGE;
  const pageQuestions = displayQuestions.slice(startIdx, startIdx + QUESTIONS_PER_PAGE);

  if (!quiz || questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 to-white">
        <div className="text-center"><div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div><p className="text-sm text-gray-500">Loading assessment...</p></div>
      </div>
    );
  }

  if (result) {
    const percentage = Number(result.percentage) || 0;
    const returnToDashboard = () => {
      if (onComplete) onComplete(result);
      else navigate('/learner/dashboard');
    };

    return (
      <div className="min-h-screen bg-teal-50/60">
        <header className="bg-[#006770] px-4 py-5 text-white shadow-lg">
          <div className="mx-auto max-w-4xl">
            <p className="text-xs font-semibold uppercase tracking-wider text-white/75">Assessment complete</p>
            <h1 className="mt-1 text-xl font-bold">{quiz.title}</h1>
          </div>
        </header>
        <main className="mx-auto max-w-4xl space-y-5 px-4 py-6">
          <section className="rounded-xl border border-teal-100 bg-white p-6 text-center shadow-sm">
            <p className="text-sm font-semibold text-slate-500">Your score</p>
            <p className="my-2 text-5xl font-black text-[#006770]">{percentage}%</p>
            <p className="text-sm font-bold text-slate-700">
              {result.earned_points} / {result.total_points} marks
            </p>
            <p className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-bold ${
              result.passed ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
            }`}>
              {result.passed ? 'Passed' : 'Keep practising'}
            </p>
            <p className="mt-3 text-xs text-slate-500">
              {result.ai_graded
                ? 'Multiple-choice answers were checked automatically and written answers were marked by AI.'
                : 'Your answers were marked automatically.'}
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[#003B46]">Answer feedback</h2>
            {(result.answers || []).map((answer, idx) => (
              <article key={answer.question_id || idx} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2">
                    {answer.is_correct
                      ? <CheckCircleSolid className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600" />
                      : <XMarkIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />}
                    <div>
                      <p className="text-sm font-semibold text-slate-800">Q{idx + 1}. {answer.question_text}</p>
                      <p className="mt-1 text-xs text-slate-600">
                        Your answer: {answer.selected_answer_text || 'Not answered'}
                      </p>
                      {!answer.is_correct && answer.correct_answer && (
                        <p className="mt-1 text-xs text-teal-800">Expected answer: {answer.correct_answer}</p>
                      )}
                      {answer.feedback && <p className="mt-2 text-xs text-slate-500">{answer.feedback}</p>}
                      {answer.explanation && <p className="mt-1 text-xs text-slate-500">{answer.explanation}</p>}
                    </div>
                  </div>
                  <span className="whitespace-nowrap text-xs font-bold text-[#006770]">
                    {answer.points_obtained ?? 0}/{answer.max_points}
                  </span>
                </div>
              </article>
            ))}
          </section>

          <button
            onClick={returnToDashboard}
            className="w-full rounded-lg bg-[#006770] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#00565e]"
          >
            Back to Dashboard
          </button>
        </main>
      </div>
    );
  }

  if (submitting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-teal-50/60 px-4">
        <div className="rounded-xl bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-teal-100 border-t-[#006770]" />
          <h2 className="text-lg font-bold text-[#003B46]">Marking your answers</h2>
          <p className="mt-2 text-sm text-slate-500">Written answers are being reviewed by AI. Your results will appear shortly.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50/60 to-white">
      {/* Sticky header in the learner dashboard's teal palette */}
      <div 
        className="sticky top-0 z-30 bg-[#006770] text-white shadow-lg"
      >
        <div className="max-w-7xl mx-auto px-4 py-2 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-lg ${timeLeft < 60 ? 'bg-teal-500/30 text-teal-200' : 'bg-white/20 text-white'}`}>
                <ClockIcon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-wider opacity-80">Time Left</p>
                <p className={`text-lg font-mono font-bold tracking-tight ${timeLeft < 60 ? 'text-teal-200' : 'text-white'}`}>
                  {formatTime(timeLeft)}
                </p>
              </div>
            </div>

            <div className="flex-1 max-w-xs mx-2 hidden sm:block">
              <div className="flex justify-between text-[9px] font-medium mb-0.5 opacity-80">
                <span>Progress</span>
                <span>{Math.round(stats.progress)}%</span>
              </div>
              <div className="h-1.5 bg-white/30 rounded-full overflow-hidden">
                <div className="h-full bg-teal-400 rounded-full transition-all duration-500" style={{ width: `${stats.progress}%` }} />
              </div>
            </div>

            <div className="flex gap-2">
              <button onClick={handleOpenReview} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-semibold transition">
                <EyeIcon className="w-3.5 h-3.5" /> Review
              </button>
              <button onClick={handleConfirmSubmit} disabled={submitting} className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 rounded-lg text-sm font-semibold transition disabled:opacity-50">
                {submitting ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><PaperAirplaneIcon className="w-3.5 h-3.5" /> Submit</>}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-5 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
          {/* Questions Area – Compact Cards */}
          <div className="lg:col-span-3 space-y-4" ref={pageRef}>
            {pageQuestions.map(({ question: q, questionIndex }, idxInPage) => {
              const displayIdx = startIdx + idxInPage;
              const section = q.section === 'B' ? 'B' : 'A';
              const previousSection = idxInPage > 0
                ? (pageQuestions[idxInPage - 1].question.section === 'B' ? 'B' : 'A')
                : null;
              return (
                <React.Fragment key={questionIndex}>
                  {(idxInPage === 0 || section !== previousSection) && (
                    <div className={`rounded-lg px-4 py-3 border shadow-sm ${
                      section === 'B'
                        ? 'bg-sky-50 border-sky-200'
                        : 'bg-teal-50 border-teal-200'
                    }`}>
                      <h2 className={`text-sm font-extrabold tracking-wide ${
                        section === 'B' ? 'text-sky-900' : 'text-teal-900'
                      }`}>
                        SECTION {section}
                      </h2>
                    </div>
                  )}
                  <div id={`q-${questionIndex}`} className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition">
                  {/* Compact header */}
                  <div className="px-4 py-2 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 flex justify-between items-center">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2 py-0.5 bg-teal-700/10 text-teal-800 rounded-md text-xs font-bold">Q{displayIdx+1}</span>
                      {q.question_image && (
                        <span className="px-2 py-0.5 bg-teal/10 text-teal rounded-md text-xs font-bold flex items-center gap-1">
                          <PhotoIcon className="w-3 h-3" /> Diagram
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-500 font-medium">{q.marks} {q.marks === 1 ? 'mark' : 'marks'}</span>
                  </div>
                  {/* Body with reduced padding */}
                  <div className="p-4">
                    {q.question_text && (
                      <h2 className="text-base font-semibold text-slate-800 leading-relaxed mb-3">{q.question_text}</h2>
                    )}
                    {q.question_image && (
                      <div className="mb-4">
                        <img src={q.question_image} alt="Diagram" className="max-w-full h-auto max-h-48 mx-auto rounded-md shadow-sm cursor-pointer" onClick={() => setLightboxImage(q.question_image)} />
                      </div>
                    )}
                    <div className="space-y-2">
                      {q.options ? (
                        q.options.map((opt, optIdx) => (
                          <button
                            key={optIdx}
                            onClick={() => handleAnswer(questionIndex, optIdx)}
                            className={`w-full text-left p-2.5 rounded-lg border transition-all ${
                              answers[questionIndex] === optIdx
                                ? 'border-[#006770] bg-[#006770] text-white shadow-sm'
                                : 'border-slate-200 hover:border-teal/40 hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-start gap-2">
                              <div className={`flex-shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                                answers[questionIndex] === optIdx ? 'border-white bg-white/20' : 'border-slate-300'
                              }`}>
                                {answers[questionIndex] === optIdx && <CheckCircleSolid className="w-2.5 h-2.5 text-white" />}
                              </div>
                              <span className={`text-sm ${answers[questionIndex] === optIdx ? 'text-white font-semibold' : 'text-slate-700'}`}>{opt}</span>
                            </div>
                          </button>
                        ))
                      ) : (
                        <textarea
                          value={answers[questionIndex] || ''}
                          onChange={(e) => handleShortAnswer(questionIndex, e.target.value)}
                          placeholder="Type your answer here..."
                          className="w-full p-3 border border-slate-200 rounded-lg focus:border-teal focus:ring-1 focus:ring-teal/20 transition min-h-[100px] text-sm"
                        />
                      )}
                    </div>
                  </div>
                </div>
                </React.Fragment>
              );
            })}

            {/* Pagination – smaller */}
            <div className="flex justify-between items-center bg-white rounded-lg p-3 shadow-sm border border-slate-200">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 disabled:opacity-40 hover:text-teal transition"
              >
                <ChevronLeftIcon className="w-3.5 h-3.5" /> Previous
              </button>
              <span className="text-xs text-slate-500">Page {currentPage+1} of {totalPages}</span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage + 1 >= totalPages}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 disabled:opacity-40 hover:text-teal transition"
              >
                Next <ChevronRightIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Sidebar – Compact Navigator with GREY colors */}
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
              <h3 className="text-xs font-bold uppercase text-slate-500 mb-3 flex items-center gap-1.5">
                <DocumentCheckIcon className="w-4 h-4" /> Question Navigator
              </h3>
              <div className="grid grid-cols-5 gap-1.5">
                {displayQuestions.map(({ questionIndex }, idx) => (
                  <button
                    key={questionIndex}
                    onClick={() => {
                      const targetPage = Math.floor(idx / QUESTIONS_PER_PAGE);
                      if (targetPage !== currentPage) {
                        autoSavePage(currentPage);
                        setCurrentPage(targetPage);
                      }
                    }}
                    className={`aspect-square rounded-md text-xs font-semibold transition ${
                      Math.floor(idx / QUESTIONS_PER_PAGE) === currentPage
                        ? 'bg-teal-700 text-white shadow-sm'
                        : answers[questionIndex] !== undefined
                            ? 'bg-teal-200 text-teal-900 hover:bg-teal-300'
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    }`}
                  >
                    {idx+1}
                  </button>
                ))}
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex justify-center gap-3 text-[10px]">
                <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full bg-teal-700" /><span>Current</span></div>
                <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full bg-teal-200 border border-teal-400" /><span>Answered</span></div>
              </div>
            </div>
            <div className="bg-teal-50 rounded-lg p-3 border border-teal-200">
              <ExclamationCircleIcon className="w-6 h-6 text-teal-600 mb-2" />
              <h4 className="text-xs font-bold text-teal-700 mb-0.5">Assessment Tips</h4>
              <p className="text-[11px] text-slate-600 leading-relaxed">📸 Click images to enlarge. Answers auto-save when changing pages. Review before final submit.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Review modal uses the same teal header as the quiz screen */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-slate-900/50 transition-opacity" onClick={() => setShowReviewModal(false)} />
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              <div 
                className="px-5 py-3 flex justify-between items-center bg-[#006770]"
              >
                <h3 className="text-lg font-bold text-white">Review Your Answers</h3>
                <div className="flex gap-2">
                  <button onClick={downloadReviewPDF} className="flex items-center gap-1 px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white text-xs rounded-md transition">
                    <DocumentArrowDownIcon className="w-3.5 h-3.5" /> PDF
                  </button>
                  <button onClick={() => setShowReviewModal(false)} className="text-white/70 hover:text-white">
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="max-h-[70vh] overflow-y-auto p-4 space-y-3 bg-slate-50">
                {displayQuestions.map(({ question: q, questionIndex }, idx) => {
                  const userAnswer = answers[questionIndex];
                  let answerDisplay = '';
                  if (q.question_type === 'multiple_choice') {
                    if (userAnswer !== undefined && q.options[userAnswer]) answerDisplay = q.options[userAnswer];
                    else answerDisplay = 'Not answered';
                  } else {
                    answerDisplay = userAnswer || 'Not answered';
                  }
                  const section = q.section === 'B' ? 'B' : 'A';
                  const previousSection = idx > 0
                    ? (displayQuestions[idx - 1].question.section === 'B' ? 'B' : 'A')
                    : null;
                  return (
                    <React.Fragment key={questionIndex}>
                    {(idx === 0 || section !== previousSection) && (
                      <div className={`rounded-lg px-4 py-2 border ${
                        section === 'B' ? 'bg-sky-50 border-sky-200' : 'bg-teal-50 border-teal-200'
                      }`}>
                        <h4 className={`text-xs font-extrabold tracking-wide ${
                          section === 'B' ? 'text-sky-900' : 'text-teal-900'
                        }`}>SECTION {section}</h4>
                      </div>
                    )}
                    <div className="bg-white rounded-lg border border-slate-200 p-3 shadow-sm">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-semibold text-slate-800 text-sm">Q{idx+1}: {q.question_text}</p>
                          {q.question_image && (
                            <img src={q.question_image} alt="Diagram" className="mt-2 max-h-28 rounded border border-slate-200" />
                          )}
                          <div className="mt-2 p-2 bg-slate-50 rounded-md">
                            <span className="text-[10px] font-medium text-slate-500">Your answer:</span>
                            <p className="text-xs text-slate-700 mt-0.5 whitespace-pre-wrap">{answerDisplay}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setShowReviewModal(false);
                            const targetPage = Math.floor(idx / QUESTIONS_PER_PAGE);
                            setCurrentPage(targetPage);
                            setTimeout(() => {
                              const el = document.getElementById(`q-${questionIndex}`);
                              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            }, 100);
                          }}
                          className="ml-3 px-2 py-1 text-[10px] bg-teal/10 text-teal rounded-md hover:bg-teal/20 transition"
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                    </React.Fragment>
                  );
                })}
              </div>
              <div className="bg-white px-5 py-3 flex justify-end gap-2 border-t border-slate-200">
                <button onClick={() => setShowReviewModal(false)} className="px-3 py-1.5 bg-slate-200 text-slate-700 rounded-md text-sm hover:bg-slate-300 transition">Continue</button>
                <button onClick={() => { setShowReviewModal(false); handleConfirmSubmit(); }} className="px-3 py-1.5 bg-teal-600 text-white rounded-md text-sm hover:bg-teal-700 transition">Submit Quiz</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hidden PDF content – unchanged */}
      <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
        <div ref={pdfContentRef} className="pdf-review-content" style={{ 
          fontFamily: 'Arial, sans-serif', 
          maxWidth: '100%', 
          margin: 0, 
          padding: 0, 
          backgroundColor: '#F8FAFC', 
          color: '#0F1923' 
        }}>
          <div style={{ 
            backgroundColor: '#006770', 
            color: 'white', 
            padding: '20px', 
            textAlign: 'center', 
            margin: 0, 
            width: '100%',
            borderRadius: 0
          }}>
            <h1 style={{ fontSize: '24px', margin: 0, color: 'white' }}>{quiz.title}</h1>
            <p style={{ fontSize: '12px', marginTop: '5px', opacity: 0.8, color: 'white' }}>
              Subject Code: {quiz.subject_code || 'M073/II'} | Time: {quiz.duration} minutes | Total marks: {quiz.total_marks || 100}
            </p>
            <hr style={{ borderColor: '#2A9D8F', width: '80%', margin: '10px auto' }} />
            <p style={{ fontSize: '14px', fontWeight: 'bold', margin: 0, color: 'white' }}>CANDIDATE'S ANSWER REVIEW</p>
          </div>
          <div style={{ backgroundColor: '#E2E8F0', padding: '12px', margin: '20px 20px 0 20px', borderRadius: '6px', fontSize: '11px' }}>
            <strong>Instructions to candidates:</strong><br />
            1. This paper consists of {questions.length} questions.<br />
            2. Answer ALL questions in Section A.<br />
            3. Write your examination number on every page.<br />
            4. Marks for each part are indicated in brackets ( ).
          </div>
          <div style={{ margin: '0 20px' }}>
            {displayQuestions.map(({ question: q, questionIndex }, idx) => {
              const section = q.section === 'B' ? 'B' : 'A';
              const previousSection = idx > 0
                ? (displayQuestions[idx - 1].question.section === 'B' ? 'B' : 'A')
                : null;
              const userAnswer = answers[questionIndex];
              let answerDisplay = '';
              if (q.question_type === 'multiple_choice') {
                if (userAnswer !== undefined && q.options[userAnswer]) answerDisplay = q.options[userAnswer];
                else answerDisplay = 'Not answered';
              } else {
                answerDisplay = userAnswer || 'Not answered';
              }
              return (
                <React.Fragment key={questionIndex}>
                  {(idx === 0 || section !== previousSection) && (
                    <div style={{ margin: '20px 0 15px' }}>
                      <div style={{ backgroundColor: '#2A9D8F', display: 'inline-block', padding: '5px 15px', borderRadius: '4px', color: 'white', fontWeight: 'bold' }}>
                        SECTION {section}
                      </div>
                      <span style={{ marginLeft: '10px', fontSize: '12px', fontStyle: 'italic' }}>
                        ({section === 'A' ? quiz.section_a_marks || 75 : quiz.section_b_marks || 25} marks)
                      </span>
                      <p style={{ fontSize: '12px', marginTop: '5px' }}>
                        {section === 'A' ? 'Answer all questions in this section.' : 'Answer the questions in this section.'}
                      </p>
                    </div>
                  )}
                  <div style={{ marginBottom: '25px', pageBreakInside: 'avoid' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <h3 style={{ fontSize: '14px', fontWeight: 'bold', margin: '0 0 5px 0' }}>{idx+1}. {q.question_text}</h3>
                      <span style={{ fontSize: '11px', color: '#2A9D8F', fontStyle: 'italic' }}>({q.marks} marks)</span>
                    </div>
                    {q.question_image && (
                      <img
                        src={q.question_image}
                        alt="Diagram"
                        style={{ maxWidth: '100%', maxHeight: '200px', margin: '10px 0', border: '1px solid #CBD5E1', borderRadius: '4px' }}
                        crossOrigin="anonymous"
                      />
                    )}
                    <div style={{ backgroundColor: '#F1F5F9', padding: '10px', borderRadius: '4px', border: '1px solid #CBD5E1', marginTop: '5px' }}>
                      <strong style={{ fontSize: '11px' }}>Candidate's answer:</strong>
                      <p style={{ margin: '5px 0 0 0', fontSize: '12px', whiteSpace: 'pre-wrap' }}>{answerDisplay}</p>
                    </div>
                  </div>
                </React.Fragment>
              );
            })}
          </div>
          <div style={{ marginTop: '40px', textAlign: 'center', fontSize: '9px', color: '#64748B', borderTop: '1px solid #CBD5E1', paddingTop: '10px' }}>
            Progress Secondary School – {quiz.title} – Candidate Review
          </div>
        </div>
      </div>

      {/* Confirmation Dialog – Teal accent */}
      {showConfirmDialog && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowConfirmDialog(false)} />
          <div className="relative bg-white rounded-lg max-w-md w-full p-5 shadow-xl">
            <div className="w-12 h-12 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <FlagIcon className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-center mb-1">Submit Assessment?</h3>
            <p className="text-center text-sm text-slate-500 mb-3">
              You answered {stats.answered} of {stats.total} questions.
              {stats.total - stats.answered > 0 && ` ${stats.total - stats.answered} unanswered.`}
            </p>
            <p className="text-xs text-center text-slate-400 mb-5">Once submitted, your answers are marked and your results appear here.</p>
            <div className="flex gap-2">
              <button onClick={() => setShowConfirmDialog(false)} className="flex-1 py-1.5 bg-slate-100 text-slate-700 rounded-md text-sm hover:bg-slate-200 transition">Cancel</button>
              <button onClick={submitQuiz} disabled={submitting} className="flex-1 py-1.5 bg-teal-600 text-white rounded-md text-sm hover:bg-teal-700 transition disabled:opacity-50">
                {submitting ? 'Marking answers...' : 'Yes, Submit'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightboxImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" onClick={() => setLightboxImage(null)}>
          <div className="relative max-w-4xl max-h-[90vh] p-4">
            <img src={lightboxImage} alt="Full size" className="max-w-full max-h-full object-contain rounded-lg" />
            <button className="absolute top-4 right-4 p-2 bg-white/20 rounded-full hover:bg-white/30"><XMarkIcon className="w-5 h-5 text-white" /></button>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizTaking;