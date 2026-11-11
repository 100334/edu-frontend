import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ClockIcon, FlagIcon, PaperAirplaneIcon,
  DocumentCheckIcon, XMarkIcon, ChevronLeftIcon,
  ChevronRightIcon, EyeIcon, DocumentArrowDownIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolid } from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';
import api from '../../services/api';
import html2pdf from 'html2pdf.js/dist/html2pdf.bundle.min.js';
import {
  getDisplayOptionIndex,
  getOriginalOptionIndex,
  shuffleQuizQuestionOptions,
} from '../../utils/shuffleQuizQuestionOptions';

function normalizeQuizId(value) {
  if (value == null || value === '') return null;
  const id = String(value).trim();
  return ['undefined', 'null', 'NaN', '[object Object]'].includes(id)
    ? null
    : id;
}

// Keep old name as alias for internal use
const normalizeQuizIdProp = normalizeQuizId;

const QuizTaking = ({ quizId, onComplete, onExit, questionsPerPage = 1, showPrimaryGrade = false }) => {
  const [quiz, setQuiz] = useState(null);
  const [result, setResult] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [attemptId, setAttemptId] = useState(null);
  const [walletDialog, setWalletDialog] = useState(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);
  const [showDetails, setShowDetails] = useState(true); // true = details page, false = questions page
  const [voiceoverEnabled, setVoiceoverEnabled] = useState(false);
  const pageRef = useRef(null);
  const pdfContentRef = useRef(null);
  const speechUtteranceRef = useRef(null);
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
        const canonicalAnswer = getOriginalOptionIndex(questions[questionIndex], ans);
        try {
          const token = localStorage.getItem('token');
          await api.post(`/api/quiz/${encodeURIComponent(resolvedQuizId)}/save-answer`, {
            question_index: questionIndex,
            answer: canonicalAnswer,
            attempt_id: attemptId
          }, { headers: { Authorization: `Bearer ${token}` } });
        } catch (error) {  }
      }
    }
  };

  const handlePageChange = (newPage) => {
    stopSpeech();
    autoSavePage(currentPage);
    setCurrentPage(newPage);
    if (voiceoverEnabled) readPageAloud(newPage);
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
      const startRequest = api.post(`/api/quiz/${encodeURIComponent(idParam)}/start`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(startRes => ({ startRes }), startError => ({ startError }));
      const startOutcome = await startRequest;
      if (startOutcome.startError) throw startOutcome.startError;
      if (!startOutcome.startRes.data.success) {
        throw new Error(startOutcome.startRes.data.message || 'Failed to start quiz');
      }
      setAttemptId(startOutcome.startRes.data.attempt_id);
      
      const res = await api.get(`/api/quiz/${encodeURIComponent(idParam)}/questions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.already_completed) {
        toast.error('Quiz already submitted.');
        setTimeout(() => navigate('/learner/dashboard'), 1500);
        return;
      }
      setQuiz(res.data.quiz);
      const qs = (res.data.questions || []).map(q => shuffleQuizQuestionOptions({
        ...q,
        section: String(q.section || 'A').toUpperCase() === 'B' ? 'B' : 'A',
        marks: q.marks ?? q.points ?? 1
      }));
      setQuestions(qs);
      setTimeLeft(res.data.quiz.duration * 60);
      if (res.data.saved_answers) {
        const restoredAnswers = Object.fromEntries(
          Object.entries(res.data.saved_answers).map(([questionIndex, savedAnswer]) => {
            const question = qs[Number(questionIndex)];
            if (savedAnswer === null || savedAnswer === undefined || savedAnswer === '') {
              return [questionIndex, savedAnswer];
            }

            return [questionIndex, getDisplayOptionIndex(question, savedAnswer)];
          })
        );
        setAnswers(restoredAnswers);
      }
    } catch (error) {
      if (error.response?.status === 402) {
        setWalletDialog({
          message: error.response.data?.message || 'There is not enough credit in your quiz wallet to start this attempt.',
          balance: error.response.data?.balance_mwk,
          required: error.response.data?.required_mwk ?? 100,
        });
        return;
      }
      toast.error(error.response?.data?.message || error.message || 'Failed to load quiz.');
      navigate('/learner/dashboard');
    }
  };

  const handleAnswer = (idx, val) => setAnswers(prev => ({ ...prev, [idx]: val }));
  const handleShortAnswer = (idx, text) => setAnswers(prev => ({ ...prev, [idx]: text }));

  const stopSpeech = () => {
    speechUtteranceRef.current = null;
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  };

  const readSentenceAloud = (text) => {
    if (!voiceoverEnabled) return;
    if (typeof window === 'undefined' || !window.speechSynthesis || !window.SpeechSynthesisUtterance) {
      toast.error('Sentence playback is not supported by this browser.');
      return;
    }

    const utterance = new window.SpeechSynthesisUtterance(text);
    utterance.rate = 0.8;
    stopSpeech();
    speechUtteranceRef.current = utterance;
    utterance.onend = () => {
      if (speechUtteranceRef.current === utterance) speechUtteranceRef.current = null;
    };
    utterance.onerror = (event) => {
      if (speechUtteranceRef.current === utterance) {
        speechUtteranceRef.current = null;
        if (event.error !== 'canceled' && event.error !== 'interrupted') {
          toast.error('Unable to replay this sentence.');
        }
      }
    };
    window.speechSynthesis.speak(utterance);
  };

  const renderPronounceableText = (text) => {
    const sentences = String(text ?? '').match(/[^.!?]+(?:[.!?]+|$)/g) || [];
    return (
      <>
        {sentences.map((sentence, index) => (
          <span
            key={`${index}-${sentence}`}
            onMouseEnter={() => readSentenceAloud(sentence.trim())}
            onTouchStart={() => readSentenceAloud(sentence.trim())}
            title={voiceoverEnabled ? 'Hover over or tap to replay this whole sentence' : undefined}
            className={voiceoverEnabled ? 'cursor-help rounded-sm hover:bg-[#E9F8F6]' : undefined}
          >
            {sentence}
          </span>
        ))}
      </>
    );
  };

  const readPageAloud = (page) => {
    if (typeof window === 'undefined' || !window.speechSynthesis || !window.SpeechSynthesisUtterance) {
      toast.error('Read aloud is not supported by this browser.');
      setVoiceoverEnabled(false);
      return;
    }

    const questionsToRead = displayQuestions.slice(
      page * QUESTIONS_PER_PAGE,
      (page + 1) * QUESTIONS_PER_PAGE
    );
    const text = questionsToRead.map(({ question, questionIndex }) => {
      const optionText = Array.isArray(question.options)
        ? ` Choices: ${question.options.map((option, index) => `${String.fromCharCode(65 + index)}: ${option}`).join('. ')}.`
        : '';
      return `Question ${questionIndex + 1}. ${question.question_text}.${optionText}`;
    }).join(' ');

    stopSpeech();
    const utterance = new window.SpeechSynthesisUtterance(text);
    utterance.rate = 0.8;
    speechUtteranceRef.current = utterance;
    utterance.onend = () => {
      if (speechUtteranceRef.current === utterance) {
        speechUtteranceRef.current = null;
      }
    };
    utterance.onerror = () => {
      if (speechUtteranceRef.current === utterance) {
        speechUtteranceRef.current = null;
        toast.error('Unable to read this question aloud.');
      }
    };
    window.speechSynthesis.speak(utterance);
  };

  const handleVoiceoverToggle = () => {
    if (voiceoverEnabled) {
      stopSpeech();
      setVoiceoverEnabled(false);
      return;
    }
    setVoiceoverEnabled(true);
    readPageAloud(currentPage);
  };

  useEffect(() => () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }, []);

  const handleOpenReview = () => {
    stopSpeech();
    autoSavePage(currentPage);
    setShowReviewModal(true);
  };

  const handleConfirmSubmit = () => setShowConfirmDialog(true);

  if (walletDialog) {
    const balance = Number(walletDialog.balance);
    const required = Number(walletDialog.required);
    const shortfall = Number.isFinite(balance) && Number.isFinite(required)
      ? Math.max(0, required - balance)
      : null;

    return (
      <div className="quiz-taking-page fixed inset-0 z-50 flex items-center justify-center bg-[#003F43]/45 p-4 backdrop-blur-sm">
        <section
          role="dialog"
          aria-modal="true"
          aria-labelledby="wallet-required-title"
          className="w-full max-w-md overflow-hidden rounded-2xl border-2 border-[#12BFC0] bg-white shadow-2xl"
        >
          <div className="bg-gradient-to-r from-[#00565D] to-[#008487] px-6 py-5 text-white">
            <p className="text-xs font-bold uppercase tracking-widest text-teal-100">Quiz wallet</p>
            <h2 id="wallet-required-title" className="mt-1 text-xl font-black">
              You need quiz credit to start
            </h2>
          </div>
          <div className="space-y-4 p-6">
            <p className="text-sm leading-relaxed text-slate-600">{walletDialog.message}</p>
            {Number.isFinite(balance) && (
              <div className="rounded-xl border border-[#D3EEEE] bg-[#F2FBFC] p-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Your wallet balance</span>
                  <strong className="text-[#003B46]">MK{balance}</strong>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-slate-500">Needed for this attempt</span>
                  <strong className="text-[#003B46]">MK{required}</strong>
                </div>
                {shortfall > 0 && (
                  <p className="mt-3 border-t border-[#D3EEEE] pt-3 font-semibold text-amber-800">
                    Please ask a school administrator to add at least MK{shortfall} to your wallet.
                  </p>
                )}
              </div>
            )}
            <p className="text-xs leading-relaxed text-slate-500">
              Quiz credits are added by a school administrator. No real payment is processed here.
            </p>
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => {
                  if (onExit) onExit();
                  else navigate('/learner/dashboard');
                }}
                className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
              >
                Back to quizzes
              </button>
              <button
                type="button"
                onClick={() => {
                  setWalletDialog(null);
                  loadQuiz();
                }}
                className="flex-1 rounded-xl bg-[#006770] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#00565D]"
              >
                Try again
              </button>
            </div>
          </div>
        </section>
      </div>
    );
  }

  const submitQuiz = async () => {
    stopSpeech();
    setSubmitting(true);
    setShowConfirmDialog(false);
    setShowReviewModal(false);
    await autoSavePage(currentPage);
    try {
      const token = localStorage.getItem('token');
      const answersPayload = questions.map((question, idx) => {
        const answer = answers[idx];
        if (answer === undefined) return null;
        return getOriginalOptionIndex(question, answer);
      });
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
      <div className="quiz-taking-page flex min-h-screen items-center justify-center bg-[#F2FBFC] px-4">
        <div className="rounded-2xl border-2 border-[#12BFC0] bg-white px-10 py-8 text-center shadow-lg">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-[#D8EEEE] border-t-[#00777A]" />
          <p className="text-sm font-bold text-[#07575A]">Loading assessment...</p>
        </div>
      </div>
    );
  }

  if (result) {
    const percentage = Number(result.percentage) || 0;
    const primaryGrade = percentage >= 80
      ? { letter: 'A', description: 'Excellent' }
      : percentage >= 70
        ? { letter: 'B', description: 'Very Good' }
        : percentage >= 55
          ? { letter: 'C', description: 'Good' }
          : percentage >= 40
            ? { letter: 'D', description: 'Average' }
            : { letter: 'F', description: 'Fail' };
    const returnToDashboard = () => {
      if (onComplete) onComplete(result);
      else navigate('/learner/dashboard');
    };

    return (
      <div className="quiz-taking-page min-h-screen bg-[#F2FBFC] px-3 py-5 sm:px-6">
        <header className="mx-auto mb-6 flex max-w-3xl items-center gap-4 rounded-2xl bg-gradient-to-r from-[#004F55] to-[#008789] px-5 py-4 text-white shadow-lg">
          <div className="rounded-xl bg-white/10 p-2"><DocumentCheckIcon className="h-8 w-8 text-[#FFD84D]" /></div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-white">Progress Schools</p>
            <h1 className="text-xl font-black sm:text-2xl">Assessment Complete</h1>
          </div>
        </header>
        <main className="mx-auto max-w-3xl space-y-5">
          <section className="rounded-2xl border-2 border-[#12BFC0] bg-white p-6 text-center shadow-sm sm:p-9">
            <p className="text-sm font-bold text-[#668082]">Your score</p>
            <p className="my-2 text-5xl font-black text-[#00676B]">{percentage}%</p>
            <p className="text-sm font-bold text-[#24494B]">{result.earned_points ?? 0} / {result.total_points ?? 0} marks</p>
            {showPrimaryGrade && (
              <p className="mt-2 text-lg font-black text-[#07575A]" aria-label={`Grade ${primaryGrade.letter}: ${primaryGrade.description}`}>
                Grade: {primaryGrade.letter} — {primaryGrade.description}
              </p>
            )}
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
              <article key={answer.question_id || idx} className="rounded-xl border border-[#D3EEEE] bg-white p-4 shadow-sm">
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

  // ── QUIZ DETAILS PAGE ──────────────────────────────────────────────────────
  if (showDetails) {
    const totalMarks = quiz.total_marks || questions.reduce((s, q) => s + Number(q.marks || 0), 0);
    return (
      <div className="quiz-taking-page chalkboard min-h-screen w-full flex flex-col">
        {/* Header */}
        <header className="w-full border-b-[3px] border-[#F3C33D] bg-gradient-to-r from-[#004F55] via-[#00777A] to-[#008E8D] text-white shadow-lg">
          <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              {onExit && (
                <button
                  type="button"
                  onClick={onExit}
                  aria-label="Exit quiz"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 transition hover:bg-white/20"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              )}
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10">
                <DocumentCheckIcon className="h-5 w-5 text-[#FFD84D]" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-widest text-white">Progress Schools</p>
                <h1 className="text-base font-black leading-tight">Assessment</h1>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2 rounded-full border-2 border-[#F4C43E] bg-[#004F55] px-3 py-1.5">
              <ClockIcon className="h-4 w-4 text-white" />
              <p className="font-mono text-sm font-black tabular-nums">{formatTime(timeLeft)}</p>
            </div>
          </div>
        </header>

        {/* Details card — centred, full width on phone */}
        <div className="flex flex-1 items-start justify-center p-4 sm:p-6 sm:items-center">
          <div className="w-full max-w-lg overflow-hidden rounded-[22px] border-2 border-[#12BFC0] bg-white shadow-lg">
            {/* Card header */}
            <div className="bg-gradient-to-r from-[#00565D] to-[#008487] px-5 py-4 text-white">
              <div className="flex items-center gap-3">
                <DocumentCheckIcon className="h-7 w-7 text-[#FFE16A]" />
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-teal-200">Quiz Details</p>
                  <h2 className="text-lg font-black leading-tight">{quiz.title || 'Assessment'}</h2>
                </div>
              </div>
            </div>

            {/* Detail rows */}
            <div className="divide-y divide-[#E4F4F4] px-5">
              {[
                { Icon: DocumentCheckIcon, label: 'Subject', value: quiz.subject_name || quiz.subject?.name || '—' },
                { Icon: FlagIcon,          label: 'Topic',   value: quiz.topic || quiz.title || '—' },
                { Icon: DocumentCheckIcon, label: 'Questions', value: `${questions.length} question${questions.length !== 1 ? 's' : ''}` },
                { Icon: CheckCircleSolid,  label: 'Total Marks', value: `${totalMarks} marks` },
                { Icon: ClockIcon,         label: 'Time Allowed', value: `${quiz.duration} minutes` },
              ].map(({ Icon, label, value }) => (
                <div key={label} className="flex items-center gap-4 py-3.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#E4F4F4]">
                    <Icon className="h-5 w-5 text-[#00777A]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-[#688183]">{label}</p>
                    <p className="text-sm font-bold text-[#123F42]">{value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Instructions */}
            <div className="mx-5 mb-4 rounded-xl border border-[#BDECE7] bg-[#E4F4F4] px-4 py-3">
              <p className="mb-1 text-xs font-black uppercase tracking-wide text-[#00676B]">Instructions</p>
              <ul className="space-y-1 text-xs text-[#24585A]">
                <li>• Answer all questions before the time runs out.</li>
                <li>• Your answers are auto-saved as you move between questions.</li>
                <li>• You can review your answers before submitting.</li>
              </ul>
            </div>

            {/* Bottom accent + Start button */}
            <div className="h-1.5 bg-gradient-to-r from-[#00777A] via-[#FFE16A] to-[#00777A]" />
            <div className="px-5 py-5">
              <button
                onClick={() => setShowDetails(false)}
                className="flex w-full items-center justify-center gap-3 rounded-full bg-gradient-to-r from-[#00656B] to-[#008C8B] py-4 text-lg font-extrabold text-white shadow-lg transition hover:brightness-110 active:scale-[0.98]"
              >
                <ChevronRightIcon className="h-6 w-6" />
                Start Quiz
              </button>
              <p className="mt-3 text-center text-xs text-[#688183]">
                {stats.answered > 0 ? `${stats.answered} of ${stats.total} already answered — continuing from where you left off` : 'Timer starts when the quiz loads'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── QUIZ QUESTIONS PAGE ─────────────────────────────────────────────────────
  return (
    <div className="quiz-taking-page flex h-screen h-[100dvh] w-full flex-col overflow-hidden bg-[#F0F6F8]">
      <header className="quiz-taking-header relative z-30 shrink-0 bg-gradient-to-r from-[#00504F] to-[#006C68] text-white shadow-md">
        <div className="quiz-taking-header-content flex items-center justify-between gap-3 px-4 py-3 sm:px-7">
          <div className="flex min-w-0 items-center gap-3">
            {onExit && (
              <button type="button" onClick={onExit} className="rounded-xl border-2 border-white/50 p-2 hover:bg-white/10" aria-label="Exit quiz">
                <XMarkIcon className="h-5 w-5" />
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                stopSpeech();
                setShowDetails(true);
              }}
              className="rounded-xl border-2 border-white/50 p-2 hover:bg-white/10"
              aria-label="Back to quiz details"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FFD43B] sm:h-12 sm:w-12">
              <DocumentCheckIcon className="h-6 w-6 text-[#07504D] sm:h-7 sm:w-7" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-black tracking-tight sm:text-lg">PROGRESS SCHOOLS</h1>
              <p className="text-[10px] text-teal-100 sm:text-xs">ONLINE ASSESSMENT</p>
            </div>
            <div className="ml-3 hidden min-w-0 border-l border-white/50 pl-4 md:block">
              <p className="truncate text-lg font-bold">{quiz.subject_name || quiz.subject?.name || 'Assessment'}</p>
              <p className="truncate text-xs text-teal-100">{quiz.title}</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2 rounded-full border-2 border-[#FFD43B] bg-[#004541] px-3 py-2 sm:px-4">
            <ClockIcon className="h-5 w-5 text-[#FFD43B]" />
            <span className="font-mono text-base font-black text-[#FFD43B] sm:text-xl">{formatTime(timeLeft)}</span>
          </div>
        </div>
      </header>

      <div className="quiz-taking-progress shrink-0 border-b border-[#D8E8EA] bg-white px-4 py-2 sm:px-7 sm:py-3">
        <div className="flex items-center gap-3 sm:gap-4">
          <p className="whitespace-nowrap text-xs font-extrabold text-[#075B5B] sm:text-base">
            Q{startIdx + 1} of {questions.length}
          </p>
          <div className="h-3 flex-1 overflow-hidden rounded-full bg-[#D7EAF0]">
            <div className="h-full rounded-full bg-gradient-to-r from-[#FFD500] to-[#F4B900] transition-all duration-500" style={{ width: `${stats.progress}%` }} />
          </div>
          <p className="hidden whitespace-nowrap text-sm font-extrabold text-[#075B5B] sm:block">
            {Math.round(stats.progress)}% completed
          </p>
          <button
            type="button"
            role="switch"
            aria-checked={voiceoverEnabled}
            onClick={handleVoiceoverToggle}
            title="Turn on voice-over, then hover over or tap a sentence to hear it"
            className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-bold transition ${
              voiceoverEnabled ? 'border-[#006A68] bg-[#006A68] text-white' : 'border-[#006A68] bg-white text-[#006A68]'
            }`}
          >
            Voice-over {voiceoverEnabled ? 'On' : 'Off'}
          </button>
        </div>
      </div>

      <main className="quiz-taking-main mx-auto flex min-h-0 w-full max-w-[1600px] flex-1 flex-col gap-3 overflow-hidden p-2 sm:gap-4 sm:p-4">
        <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-5">
          <section ref={pageRef} className="quiz-taking-panel chalkboard relative min-h-0 min-w-0 overflow-hidden rounded-[24px] sm:rounded-[28px]">
            <div className="quiz-taking-panel-content flex h-full flex-col gap-4 overflow-hidden p-3 sm:gap-6 sm:p-6 lg:p-8">
              {pageQuestions.map(({ question: q, questionIndex }, idxInPage) => {
                const displayIdx = startIdx + idxInPage;
                const section = q.section === 'B' ? 'B' : 'A';
                return (
                  <article id={`q-${questionIndex}`} key={questionIndex} className="quiz-taking-article flex min-h-0 flex-1 flex-col border-b border-white/20 pb-4 last:border-b-0 last:pb-0 sm:pb-6">
                    <div className="mb-3 flex items-center justify-between gap-3 sm:mb-4">
                      <span className="rounded-full bg-[#FFD43B] px-4 py-1.5 text-xs font-black text-[#174333] sm:px-5 sm:py-2 sm:text-sm">
                        SECTION {section}
                      </span>
                      <span className="rounded-xl border-2 border-[#FFD500] px-3 py-1.5 text-xs font-black text-[#FFD500] sm:px-4 sm:py-2 sm:text-lg">
                        {q.marks} {q.marks === 1 ? 'MARK' : 'MARKS'}
                      </span>
                    </div>

                    <h2 className="quiz-taking-question chalk-text chalk-font mb-4 text-[22px] leading-tight sm:mb-6">
                      {displayIdx + 1}. {renderPronounceableText(q.question_text)}
                    </h2>

                    {q.question_image && (
                      <div className="mb-4 flex min-h-0 justify-center sm:mb-6">
                        <img
                          src={q.question_image}
                          alt="Question illustration"
                          onClick={() => setLightboxImage(q.question_image)}
                          className="quiz-taking-image max-h-[18vh] max-w-full cursor-zoom-in rounded-xl bg-white p-2 object-contain sm:max-h-[22vh]"
                        />
                      </div>
                    )}

                    {q.options ? (
                      <>
                        <p className="mb-2 text-[10px] font-extrabold tracking-widest text-[#F8DB70] sm:mb-3 sm:text-sm">
                          CHOOSE THE CORRECT ANSWER
                        </p>
                        <div className="quiz-taking-options grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3">
                          {q.options.map((option, optionIndex) => {
                            const selected = answers[questionIndex] === optionIndex;
                            return (
                              <button
                                key={optionIndex}
                                type="button"
                                onClick={() => handleAnswer(questionIndex, optionIndex)}
                                aria-pressed={selected}
                                className={`quiz-taking-option chalk-option flex min-h-[52px] items-center gap-2 rounded-xl p-2 text-left text-lg sm:min-h-[64px] sm:gap-3 sm:rounded-2xl sm:p-3 ${
                                  selected ? 'selected' : ''
                                }`}
                              >
                                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold sm:h-10 sm:w-10 sm:border-[3px] sm:text-lg ${
                                  selected ? 'border-[#FFD500] bg-[#FFD500] text-[#164331]' : 'border-white text-white'
                                }`}>
                                  {selected
                                    ? <CheckCircleSolid className="h-5 w-5 sm:h-6 sm:w-6" />
                                    : String.fromCharCode(65 + optionIndex)}
                                </span>
                                <span className="chalk-font leading-tight">
                                  {renderPronounceableText(option)}
                                </span>
                                {selected && <span className="flex-1" />}
                                {selected && <CheckCircleSolid className="h-6 w-6 shrink-0 text-[#FFD500]" />}
                              </button>
                            );
                          })}
                        </div>
                      </>
                    ) : (
                      <textarea
                        value={answers[questionIndex] || ''}
                        onChange={event => handleShortAnswer(questionIndex, event.target.value)}
                        placeholder="Write your answer here..."
                        className="chalk-font min-h-0 w-full flex-1 resize-none rounded-xl border-2 border-white/70 bg-[#003E2C]/50 p-3 text-base text-white outline-none placeholder:text-white/50 focus:border-[#FFD500] sm:p-4 sm:text-xl"
                      />
                    )}
                  </article>
                );
              })}

            </div>
          </section>

          <aside className="hidden min-h-0 space-y-3 overflow-hidden lg:block">
            <section className="overflow-hidden rounded-3xl border border-[#D3E7EA] bg-white shadow-sm">
              <div className="bg-gradient-to-r from-[#005451] to-[#087B73] px-5 py-4 text-white">
                <h2 className="text-lg font-black">Question Navigator</h2>
              </div>
              <div className="p-5">
                <div className="grid grid-cols-5 gap-3">
                  {displayQuestions.map(({ questionIndex }, index) => {
                    const targetPage = Math.floor(index / QUESTIONS_PER_PAGE);
                    const isCurrent = targetPage === currentPage;
                    const isAnswered = answers[questionIndex] !== undefined && answers[questionIndex] !== null && answers[questionIndex] !== '';
                    return (
                      <button
                        key={questionIndex}
                        type="button"
                        aria-label={`Go to question ${index + 1}${isAnswered ? ', answered' : ', unanswered'}`}
                        aria-current={isCurrent ? 'step' : undefined}
                        onClick={() => {
                          if (targetPage !== currentPage) handlePageChange(targetPage);
                          setTimeout(() => {
                            const element = document.getElementById(`q-${questionIndex}`);
                            if (element) element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          }, 80);
                        }}
                        className={`aspect-square rounded-xl border-2 text-base font-black transition ${
                          isCurrent
                            ? 'border-[#006A68] bg-[#006A68] text-white'
                            : isAnswered
                              ? 'border-[#A7E6A4] bg-[#A7E6A4] text-[#174333]'
                              : 'border-[#C8D4D8] bg-white text-[#24383D] hover:border-[#007A75]'
                        }`}
                      >
                        {index + 1}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-6 flex flex-wrap gap-3 text-xs font-semibold text-slate-700">
                  <span className="flex items-center gap-2"><span className="h-4 w-4 rounded bg-[#A7E6A4]" />Answered</span>
                  <span className="flex items-center gap-2"><span className="h-4 w-4 rounded border border-slate-400" />Unanswered</span>
                  <span className="flex items-center gap-2"><span className="h-4 w-4 rounded bg-[#006A68]" />Current</span>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-[#D3E7EA] bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <p className="font-extrabold text-[#183C3F]">Answered: {stats.answered} of {stats.total}</p>
                <p className="font-black text-[#075B5B]">{Math.round(stats.progress)}%</p>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-[#D7EAF0]">
                <div className="h-full rounded-full bg-[#FFD500] transition-all" style={{ width: `${stats.progress}%` }} />
              </div>
            </section>
          </aside>
        </div>

        <div className="quiz-taking-navigation grid shrink-0 grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
          <button
            type="button"
            onClick={() => handlePageChange(Math.max(0, currentPage - 1))}
            disabled={currentPage === 0}
            className="rounded-full border-2 border-[#006A68] bg-white py-2 text-sm font-bold text-[#006A68] disabled:opacity-40 sm:py-3 sm:text-base"
          >
            <ChevronLeftIcon className="inline h-5 w-5" /> Previous
          </button>
          <button
            type="button"
            onClick={handleOpenReview}
            className="rounded-full border-2 border-[#006A68] bg-white py-2 text-sm font-bold text-[#006A68] sm:py-3 sm:text-base"
          >
            <EyeIcon className="mr-1 inline h-5 w-5" /> Review
          </button>
          <button
            type="button"
            onClick={handleConfirmSubmit}
            className="rounded-full bg-[#FFD43B] py-2 text-sm font-black text-[#172F2C] sm:py-3 sm:text-base"
          >
            <PaperAirplaneIcon className="mr-1 inline h-5 w-5" /> Submit Quiz
          </button>
          <button
            type="button"
            onClick={() => handlePageChange(Math.min(totalPages - 1, currentPage + 1))}
            disabled={currentPage + 1 >= totalPages}
            className="rounded-full bg-[#006A68] py-2 text-sm font-bold text-white disabled:opacity-40 sm:py-3 sm:text-base"
          >
            Next <ChevronRightIcon className="inline h-5 w-5" />
          </button>
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