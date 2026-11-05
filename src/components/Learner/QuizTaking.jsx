import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ClockIcon, FlagIcon, PaperAirplaneIcon, ExclamationCircleIcon,
  DocumentCheckIcon, XMarkIcon, ChevronLeftIcon,
  ChevronRightIcon, EyeIcon, DocumentArrowDownIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolid } from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';
import api from '../../services/api';
import html2pdf from 'html2pdf.js/dist/html2pdf.bundle.min.js';

function normalizeQuizId(value) {
  if (value == null || value === '') return null;
  const id = String(value).trim();
  return ['undefined', 'null', 'NaN', '[object Object]'].includes(id)
    ? null
    : id;
}

// Keep old name as alias for internal use
const normalizeQuizIdProp = normalizeQuizId;

const QuizTaking = ({ quizId, onComplete, questionsPerPage = 1 }) => {
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

  const QUESTIONS_PER_PAGE = Number.isInteger(questionsPerPage) && questionsPerPage > 0
    ? questionsPerPage
    : 3;

  const displayQuestions = useMemo(() => questions
    .map((question, questionIndex) => ({ question, questionIndex }))
    .sort((a, b) => {
      const sectionOrder = (a.question.section === 'B' ? 1 : 0) - (b.question.section === 'B' ? 1 : 0);
      return sectionOrder || a.questionIndex - b.questionIndex;
    }), [questions]);

  const totalPages = Math.ceil(displayQuestions.length / QUESTIONS_PER_PAGE);
  const startIdx = currentPage * QUESTIONS_PER_PAGE;
  const pageQuestions = displayQuestions.slice(startIdx, startIdx + QUESTIONS_PER_PAGE);

  const answeredCount = Object.keys(answers).filter(
    key => answers[key] !== undefined && answers[key] !== null && answers[key] !== ''
  ).length;

  const stats = {
    answered: answeredCount,
    total: questions.length,
    progress: questions.length ? (answeredCount / questions.length) * 100 : 0,
  };

  const formatTime = (seconds) => {
    const safeSeconds = Math.max(0, seconds || 0);
    const mins = Math.floor(safeSeconds / 60);
    const secs = safeSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Load quiz
  useEffect(() => { loadQuiz(); }, [quizId]);

  // Timer — uses setTimeout to avoid stale closure issues
  useEffect(() => {
    if (timeLeft === null || submitting || result) return;
    if (timeLeft <= 0) { submitQuiz(); return; }
    const timer = setTimeout(() => {
      setTimeLeft(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, submitting, result]);

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

  if (!quiz || questions.length === 0) {
    return (
      <div
        className="flex min-h-screen items-center justify-center bg-cover bg-center px-4"
        style={{ backgroundImage: "url('/image4.png')" }}
      >
        <div className="rounded-2xl border-2 border-[#E9BD35] bg-white/95 px-10 py-8 text-center shadow-xl">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-[#D8EEEE] border-t-[#00777A]" />
          <p className="text-sm font-bold text-[#07575A]">Loading assessment...</p>
        </div>
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
      <div className="min-h-screen bg-cover bg-center bg-fixed px-3 py-5 sm:px-6" style={{ backgroundImage: "url('/image4.png')" }}>
        <header className="mx-auto mb-6 flex max-w-6xl items-center gap-4 rounded-2xl bg-gradient-to-r from-[#004F55] to-[#008789] px-5 py-4 text-white shadow-lg">
          <div className="rounded-xl bg-white/10 p-2"><DocumentCheckIcon className="h-8 w-8 text-[#FFD84D]" /></div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-100">Progress Schools</p>
            <h1 className="text-xl font-black sm:text-2xl">Assessment Complete</h1>
          </div>
        </header>
        <main className="mx-auto max-w-5xl space-y-5">
          <section className="rounded-2xl border-2 border-[#E9BD35] bg-white/95 p-6 text-center shadow-xl sm:p-9">
            <p className="text-sm font-bold text-[#668082]">Your score</p>
            <p className="my-2 text-5xl font-black text-[#00676B]">{percentage}%</p>
            <p className="text-sm font-bold text-[#24494B]">{result.earned_points ?? 0} / {result.total_points ?? 0} marks</p>
            <p className={`mt-4 inline-flex rounded-full px-4 py-2 text-xs font-extrabold ${result.passed ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
              {result.passed ? 'Passed' : 'Keep practising'}
            </p>
            <p className="mt-3 text-xs text-slate-500">
              {result.ai_graded ? 'Multiple-choice answers were checked automatically and written answers were marked by AI.' : 'Your answers were marked automatically.'}
            </p>
          </section>
          <section className="space-y-3">
            <h2 className="text-lg font-black text-[#07575A]">Answer feedback</h2>
            {(result.answers || []).map((answer, idx) => (
              <article key={answer.question_id || idx} className="rounded-xl border border-[#E4D18B] bg-white/95 p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2">
                    {answer.is_correct ? <CheckCircleSolid className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600" /> : <XMarkIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />}
                    <div>
                      <p className="text-sm font-semibold text-slate-800">Q{idx + 1}. {String(answer.question_text || '')}</p>
                      <p className="mt-1 text-xs text-slate-600">Your answer: {String(answer.selected_answer_text || 'Not answered')}</p>
                      {!answer.is_correct && answer.correct_answer != null && <p className="mt-1 text-xs text-[#00676B]">Expected answer: {String(answer.correct_answer)}</p>}
                      {answer.feedback && <p className="mt-2 text-xs text-slate-500">{String(answer.feedback)}</p>}
                      {answer.explanation && <p className="mt-1 text-xs text-slate-500">{String(answer.explanation)}</p>}
                    </div>
                  </div>
                  <span className="whitespace-nowrap text-xs font-bold text-[#00676B]">{answer.points_obtained ?? 0}/{answer.max_points}</span>
                </div>
              </article>
            ))}
          </section>
          <button onClick={returnToDashboard} className="w-full rounded-full bg-gradient-to-r from-[#FFD84D] to-[#F2A900] px-5 py-3 text-sm font-extrabold text-[#123F42] shadow-lg transition hover:brightness-105">Back to Dashboard</button>
        </main>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen w-full bg-[#F5FBFC] bg-cover bg-center bg-fixed"
      style={{ backgroundImage: "url('/image4.png')", backgroundRepeat: "no-repeat", backgroundSize: "100% 100%" }}
    >
      <header className="sticky top-0 z-30 border-b-[3px] border-[#F3C33D] bg-gradient-to-r from-[#004F55] via-[#00777A] to-[#008E8D] text-white shadow-lg">
        <div className="mx-auto flex max-w-[1700px] items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20">
              <DocumentCheckIcon className="h-7 w-7 text-[#FFD84D]" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#BDECE7] sm:text-xs">Progress Schools</p>
              <h1 className="truncate text-lg font-black leading-tight sm:text-2xl">Assessment</h1>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2 rounded-full border-2 border-[#F4C43E] bg-[#004F55] px-3 py-2 shadow-md sm:px-5">
            <ClockIcon className={`h-5 w-5 ${timeLeft < 60 ? 'text-amber-300' : 'text-white'}`} />
            <div>
              <p className="hidden text-[9px] font-bold uppercase tracking-wider text-teal-100 sm:block">Time remaining</p>
              <p className={`font-mono text-base font-black tabular-nums sm:text-xl ${timeLeft < 60 ? 'text-amber-300' : 'text-white'}`}>{formatTime(timeLeft)}</p>
            </div>
          </div>
        </div>
        <div className="h-1.5 bg-white/20">
          <div className="h-full bg-gradient-to-r from-[#FFE477] to-[#F4B900] transition-all duration-500" style={{ width: `${stats.progress}%` }} />
        </div>
      </header>

      <main className="mx-auto max-w-[1700px] px-3 py-5 sm:px-5 lg:px-7">
        <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[270px_minmax(0,1fr)_300px]">

          {/* Left: quiz details */}
          <aside className="overflow-hidden rounded-[22px] border-2 border-[#F0C33F] bg-white/95 shadow-[0_8px_24px_rgba(0,76,80,0.12)]">
            <div className="flex items-center gap-3 bg-gradient-to-r from-[#00565D] to-[#008487] px-4 py-4 text-white">
              <DocumentCheckIcon className="h-7 w-7 text-[#FFE16A]" />
              <h2 className="text-base font-extrabold sm:text-lg">Quiz Details</h2>
            </div>
            <div className="divide-y divide-[#D9E8E8] px-4">
              <div className="flex items-center gap-3 py-4">
                <DocumentCheckIcon className="h-7 w-7 shrink-0 text-[#00777A]" />
                <div><p className="text-xs font-semibold text-[#688183]">Subject</p><p className="text-sm font-bold text-[#123F42]">{quiz.subject || quiz.subject_name || 'Assessment'}</p></div>
              </div>
              <div className="flex items-center gap-3 py-4">
                <FlagIcon className="h-7 w-7 shrink-0 text-[#00777A]" />
                <div><p className="text-xs font-semibold text-[#688183]">Topic</p><p className="text-sm font-bold text-[#123F42]">{quiz.topic || quiz.title || 'Quiz'}</p></div>
              </div>
              <div className="flex items-center gap-3 py-4">
                <DocumentCheckIcon className="h-7 w-7 shrink-0 text-[#00777A]" />
                <div><p className="text-xs font-semibold text-[#688183]">Questions</p><p className="text-sm font-bold text-[#123F42]">{questions.length}</p></div>
              </div>
              <div className="flex items-center gap-3 py-4">
                <CheckCircleSolid className="h-7 w-7 shrink-0 text-[#00777A]" />
                <div><p className="text-xs font-semibold text-[#688183]">Total Marks</p><p className="text-sm font-bold text-[#123F42]">{quiz.total_marks || questions.reduce((sum, q) => sum + Number(q.marks || 0), 0)}</p></div>
              </div>
              <div className="flex items-center gap-3 py-4">
                <ClockIcon className="h-7 w-7 shrink-0 text-[#00777A]" />
                <div><p className="text-xs font-semibold text-[#688183]">Duration</p><p className="text-sm font-bold text-[#123F42]">{quiz.duration} Minutes</p></div>
              </div>
            </div>
            <div className="h-2 bg-gradient-to-r from-[#00777A] via-[#FFE16A] to-[#00777A]" />
          </aside>

          {/* Centre: question and answers */}
          <section ref={pageRef} className="min-w-0 overflow-hidden rounded-[24px] border-2 border-[#E9B82C] bg-white/95 shadow-[0_10px_30px_rgba(0,76,80,0.12)]">
            <div className="border-b border-[#E6EEEE] px-5 py-5 sm:px-7">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-xl font-black text-[#123F42] sm:text-2xl">Question {startIdx + 1} of {questions.length}</h2>
                <span className="rounded-full border-2 border-[#F0C33F] bg-[#005E64] px-4 py-2 font-mono text-lg font-black text-white shadow-sm">{formatTime(timeLeft)}</span>
              </div>
              <div className="mt-4 h-3 overflow-hidden rounded-full border border-[#C7D6D9] bg-[#E8EFF1]">
                <div className="h-full rounded-full bg-gradient-to-r from-[#00676B] to-[#00A3A0] transition-all duration-500" style={{ width: `${((startIdx + pageQuestions.length) / questions.length) * 100}%` }} />
              </div>
            </div>

            <div className="space-y-5 px-5 py-6 sm:px-7 sm:py-7">
              {pageQuestions.map(({ question: q, questionIndex }, idxInPage) => {
                const displayIdx = startIdx + idxInPage;
                const section = q.section === 'B' ? 'B' : 'A';
                const previousSection = idxInPage > 0 ? (pageQuestions[idxInPage - 1].question.section === 'B' ? 'B' : 'A') : null;
                return (
                  <React.Fragment key={questionIndex}>
                    {(idxInPage === 0 || section !== previousSection) && (
                      <div className="inline-flex rounded-lg border border-[#E8C75B] bg-[#FFF8DF] px-3 py-1.5">
                        <span className="text-xs font-black tracking-wider text-[#765A08]">SECTION {section}</span>
                      </div>
                    )}
                    <article id={`q-${questionIndex}`} className="border-b border-[#E7EEEE] pb-6 last:border-b-0">
                      <div className="mb-4 flex items-start justify-between gap-3">
                        <h3 className="text-base font-bold leading-relaxed text-[#123F42] sm:text-lg"><span className="mr-2">{displayIdx + 1}.</span>{q.question_text}</h3>
                        <span className="shrink-0 rounded-full bg-[#FFF4C9] px-3 py-1 text-xs font-extrabold text-[#795C08]">{q.marks} {q.marks === 1 ? 'mark' : 'marks'}</span>
                      </div>
                      {q.question_image && (
                        <div className="mb-4">
                          <img src={q.question_image} alt="Question diagram" className="mx-auto max-h-64 max-w-full cursor-zoom-in rounded-xl border border-[#DCE8E8] object-contain" onClick={() => setLightboxImage(q.question_image)} />
                        </div>
                      )}
                      {q.options ? (
                        <div className="space-y-3">
                          {q.options.map((opt, optIdx) => {
                            const selected = answers[questionIndex] === optIdx;
                            return (
                              <button key={optIdx} type="button" onClick={() => handleAnswer(questionIndex, optIdx)}
                                className={`flex w-full items-center gap-3 rounded-[17px] border-2 px-4 py-3.5 text-left transition-all sm:px-5 ${
                                  selected ? 'border-[#00898A] bg-[#C9F0EE] shadow-[0_2px_8px_rgba(0,137,138,0.12)]' : 'border-[#D5E0E4] bg-white hover:border-[#55B7B5] hover:bg-[#F5FCFB]'
                                }`}>
                                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 ${selected ? 'border-[#00777A] bg-[#00777A] text-white' : 'border-[#AEBEC4] bg-white'}`}>
                                  {selected && <CheckCircleSolid className="h-5 w-5" />}
                                </span>
                                <span className={`text-sm sm:text-base ${selected ? 'font-extrabold text-[#063F43]' : 'font-medium text-[#172F34]'}`}>
                                  <span className="mr-2 font-bold">{String.fromCharCode(65 + optIdx)}.</span>{opt}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <textarea value={answers[questionIndex] || ''} onChange={(e) => handleShortAnswer(questionIndex, e.target.value)} placeholder="Type your answer here..."
                          className="min-h-[130px] w-full rounded-2xl border-2 border-[#D5E0E4] bg-white p-4 text-sm text-[#123F42] outline-none transition focus:border-[#00898A] focus:ring-4 focus:ring-[#00898A]/10" />
                      )}
                    </article>
                  </React.Fragment>
                );
              })}

              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <button onClick={() => handlePageChange(Math.max(0, currentPage - 1))} disabled={currentPage === 0}
                  className="inline-flex items-center gap-2 rounded-full border-2 border-[#00777A] bg-white px-5 py-3 text-sm font-extrabold text-[#064F54] transition hover:bg-[#E9F8F6] disabled:cursor-not-allowed disabled:opacity-40">
                  <ChevronLeftIcon className="h-5 w-5" /> Previous
                </button>
                <button onClick={handleOpenReview} className="inline-flex items-center gap-2 rounded-full border-2 border-[#00777A] bg-white px-5 py-3 text-sm font-extrabold text-[#064F54] transition hover:bg-[#E9F8F6]">
                  <EyeIcon className="h-5 w-5" /> Review
                </button>
                <button onClick={() => handlePageChange(Math.min(totalPages - 1, currentPage + 1))} disabled={currentPage + 1 >= totalPages}
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-to-b from-[#FFE16A] to-[#F3B500] px-7 py-3 text-sm font-black text-[#173A3D] shadow-md transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-40">
                  Next <ChevronRightIcon className="h-5 w-5" />
                </button>
              </div>
              <p className="text-center text-xs font-semibold text-[#779091]">Page {currentPage + 1} of {totalPages} · {stats.answered} of {stats.total} answered</p>
            </div>
          </section>

          {/* Right: question navigator */}
          <aside className="space-y-4">
            <section className="overflow-hidden rounded-[22px] border-2 border-[#F0C33F] bg-white/95 shadow-[0_8px_24px_rgba(0,76,80,0.12)]">
              <div className="flex items-center gap-3 bg-gradient-to-r from-[#00565D] to-[#008487] px-4 py-4 text-white">
                <DocumentCheckIcon className="h-7 w-7 text-[#FFE16A]" />
                <h2 className="text-base font-extrabold sm:text-lg">Question Navigator</h2>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-5 gap-2">
                  {displayQuestions.map(({ questionIndex }, idx) => {
                    const targetPage = Math.floor(idx / QUESTIONS_PER_PAGE);
                    const isCurrent = targetPage === currentPage;
                    const isAnswered = answers[questionIndex] !== undefined && answers[questionIndex] !== null && answers[questionIndex] !== '';
                    return (
                      <button key={questionIndex} type="button"
                        onClick={() => {
                          if (targetPage !== currentPage) handlePageChange(targetPage);
                          setTimeout(() => {
                            const el = document.getElementById(`q-${questionIndex}`);
                            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          }, 80);
                        }}
                        className={`aspect-square rounded-xl border-2 text-sm font-black transition ${
                          isCurrent ? 'border-[#F0B900] bg-gradient-to-b from-[#FFD84D] to-[#F2A900] text-[#173A3D] shadow-md'
                          : isAnswered ? 'border-[#00777A] bg-[#00777A] text-white hover:bg-[#00666B]'
                          : 'border-[#BFCFD4] bg-white text-[#18383C] hover:border-[#00777A] hover:bg-[#F0FAF9]'
                        }`}>
                        {idx + 1}{isAnswered && !isCurrent && <span className="ml-0.5">✓</span>}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-5 space-y-2 border-t border-[#DCE7E8] pt-4 text-xs font-semibold text-[#29494C]">
                  <div className="flex items-center gap-2"><span className="h-3.5 w-3.5 rounded bg-[#00777A]" /> Answered <span className="ml-auto h-3.5 w-3.5 rounded bg-[#F3B500]" /> Current</div>
                  <div className="flex items-center gap-2"><span className="h-3.5 w-3.5 rounded border-2 border-[#BFCFD4] bg-white" /> Not answered</div>
                </div>
                <button onClick={handleConfirmSubmit} className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-b from-[#FFE16A] to-[#F0A900] px-4 py-3.5 text-sm font-black text-[#173A3D] shadow-md transition hover:brightness-105">
                  <PaperAirplaneIcon className="h-5 w-5" /> Submit Quiz
                </button>
                <button onClick={handleOpenReview} className="mt-3 flex w-full items-center justify-center gap-2 rounded-full border-2 border-[#00777A] bg-white px-4 py-3 text-sm font-extrabold text-[#064F54] transition hover:bg-[#E9F8F6]">
                  <EyeIcon className="h-5 w-5" /> Review Answers
                </button>
              </div>
            </section>
            <section className="rounded-[18px] border border-[#E7D58B] bg-white/90 p-4 shadow-sm">
              <div className="flex items-center gap-2 text-[#00676B]"><ExclamationCircleIcon className="h-5 w-5" /><h3 className="text-sm font-extrabold">Assessment Tips</h3></div>
              <p className="mt-2 text-xs leading-relaxed text-[#617B7D]">Your answers are saved when you move between questions. Review your answers before submitting.</p>
            </section>
          </aside>
        </div>
      </main>
      {/* Review modal uses the same teal header as the quiz screen */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-slate-900/50 transition-opacity" onClick={() => setShowReviewModal(false)} />
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
            <div className="inline-block w-full max-w-4xl overflow-hidden rounded-2xl border-2 border-[#E9BD35] bg-white text-left shadow-2xl sm:my-8 sm:align-middle">
              <div 
                className="flex items-center justify-between bg-gradient-to-r from-[#00565D] to-[#008487] px-5 py-4"
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
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#003F43]/35 p-4 backdrop-blur-sm">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowConfirmDialog(false)} />
          <div className="relative w-full max-w-md rounded-2xl border-2 border-[#E9BD35] bg-white p-6 shadow-2xl">
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
              <button onClick={submitQuiz} disabled={submitting} className="flex-1 rounded-full bg-gradient-to-b from-[#FFE16A] to-[#F0A900] py-2.5 text-sm font-extrabold text-[#173A3D] transition hover:brightness-105 disabled:opacity-50">
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