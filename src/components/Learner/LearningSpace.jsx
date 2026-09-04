import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/solid';
import { CheckCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import api from '../../services/api';
import toast from 'react-hot-toast';
import QuizResults from './QuizResults';

// ── Week helpers ───────────────────────────────────────────────────────────────
const getISOWeek = (date) => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  return Math.ceil((((d - new Date(Date.UTC(d.getUTCFullYear(), 0, 1))) / 86400000) + 1) / 7);
};
const getCurrentCurriculumWeek = () => {
  const stored = localStorage.getItem('courseStartDate');
  if (stored) {
    const diff = new Date() - new Date(stored);
    if (diff >= 0) return Math.floor(diff / (7 * 24 * 60 * 60 * 1000)) + 1;
  }
  return getISOWeek(new Date());
};

// ── Step definitions ───────────────────────────────────────────────────────────
const STEPS = [
  { id: 'intro',  emoji: '📋', label: 'Introduction'  },
  { id: 'notes',  emoji: '📄', label: 'Read Notes'    },
  { id: 'video',  emoji: '🎬', label: 'Watch Video'   },
  { id: 'quiz',   emoji: '📝', label: 'Assessment'    },
];

const normalizeLesson = (lesson) => ({
  ...lesson,
  subject_name: lesson.subject_name || lesson.subject?.name ||
    (typeof lesson.subject === 'string' ? lesson.subject : null),
});

// ── Stepper bar ───────────────────────────────────────────────────────────────
const StepperBar = ({ steps, currentStep, completedSteps, onStepClick }) => (
  <div className="flex items-center gap-0 w-full">
    {steps.map((step, i) => {
      const isDone    = completedSteps.includes(step.id);
      const isCurrent = step.id === currentStep;
      const isLocked  = !isDone && !isCurrent && i > 0 && !completedSteps.includes(steps[i - 1]?.id);
      return (
        <React.Fragment key={step.id}>
          <button
            onClick={() => !isLocked && onStepClick(step.id)}
            disabled={isLocked}
            className={`flex flex-col items-center gap-1 flex-1 py-2 transition-all ${
              isLocked ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'
            }`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
              isDone    ? 'bg-[#006770] text-white' :
              isCurrent ? 'bg-[#003B46] text-white ring-2 ring-[#2A9D8F] ring-offset-1' :
                          'bg-gray-100 text-gray-400'
            }`}>
              {isDone ? '✓' : step.emoji}
            </div>
            <span className={`text-[9px] font-semibold hidden sm:block ${
              isCurrent ? 'text-[#003B46]' : isDone ? 'text-[#006770]' : 'text-gray-400'
            }`}>
              {step.label}
            </span>
          </button>
          {i < steps.length - 1 && (
            <div className={`h-0.5 flex-1 mx-1 rounded transition-all ${
              completedSteps.includes(step.id) ? 'bg-[#006770]' : 'bg-gray-200'
            }`} />
          )}
        </React.Fragment>
      );
    })}
  </div>
);

// ── Main component ─────────────────────────────────────────────────────────────
const LearningSpace = ({ onStartQuiz }) => {
  const [lessons,       setLessons]       = useState([]);
  const [quizItems,     setQuizItems]     = useState([]);
  const [currentWeek,   setCurrentWeek]   = useState(1);

  // Navigation state
  const [activeWeek,     setActiveWeek]     = useState(null);  // null = week list
  const [activeSubject,  setActiveSubject]  = useState(null);  // null = subject folders
  const [activeLesson,   setActiveLesson]   = useState(null);  // null = folder contents
  const [activeFolderId, setActiveFolderId] = useState(null);  // 'results' only

  // Lesson stepper
  const [currentStep,    setCurrentStep]    = useState('intro');
  const [completedSteps, setCompletedSteps] = useState([]);

  // Video/PDF viewer modal (for full-screen)
  const [viewerSrc,   setViewerSrc]   = useState(null);
  const [viewerTitle, setViewerTitle] = useState('');

  useEffect(() => {
    setCurrentWeek(getCurrentCurriculumWeek());
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const token   = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const [lr, qr] = await Promise.allSettled([
        api.get('/api/learner/lessons',  { headers }),
        api.get('/api/quiz/quizzes',     { headers }),
      ]);
      if (lr.status === 'fulfilled') {
        const payload = lr.value.data;
        const lessonData = Array.isArray(payload)
          ? payload
          : payload?.lessons || (Array.isArray(payload?.data) ? payload.data : payload?.data?.lessons) || [];
        if (payload?.success !== false) setLessons(lessonData.map(normalizeLesson));
      }
      if (qr.status === 'fulfilled' && qr.value.data.success) {
        setQuizItems((qr.value.data.quizzes || []).map(q => ({
          id: q.id, quiz_id: q.id, title: q.title, description: q.description,
          resource_type: 'quiz', subject_name: q.subject_name || q.subject || null,
          week_number: q.week_number || null, is_weekend_exam: q.is_weekend_exam || false,
          disabled: q.disabled || false, attempt_status: q.attempt_status || null,
          allow_retake: q.allow_retake || false,
          scheduled_start: q.scheduled_start || null,
          scheduled_end:   q.scheduled_end   || null,
        })));
      }
    } catch {
      toast.error('Could not load learning materials');
    }
  };

  // ── Derived: week groups ───────────────────────────────────────────────────
  const weekGroups = React.useMemo(() => {
    const map = {};
    const add = (item) => {
      const w = item.week_number ?? 0;
      if (!map[w]) map[w] = { lessons: [], exams: [] };
      (item.is_weekend_exam ? map[w].exams : map[w].lessons).push(item);
    };
    lessons.forEach(add);
    quizItems.forEach(add);
    return Object.entries(map)
      .map(([w, d]) => ({ week: parseInt(w), ...d }))
      .sort((a, b) => (a.week === 0 ? 1 : b.week === 0 ? -1 : a.week - b.week));
  }, [lessons, quizItems]);

  // ── Derived: topics for the active week ───────────────────────────────────
  const weekTopics = React.useMemo(() => {
    if (activeWeek === null) return [];
    const wd = weekGroups.find(g => g.week === activeWeek);
    if (!wd) return [];
    // Only lessons that have a real subject assigned
    const lessonItems = wd.lessons.filter(l =>
      l.resource_type !== 'quiz' && l.subject_name
    );
    return lessonItems.map(lesson => {
      const linkedQuiz = lesson.quiz_id
        ? quizItems.find(q => String(q.quiz_id) === String(lesson.quiz_id))
        : quizItems.find(q =>
            q.week_number === lesson.week_number &&
            q.subject_name === lesson.subject_name &&
            !q.is_weekend_exam
          );
      return { ...lesson, linkedQuiz: linkedQuiz || null };
    });
  }, [activeWeek, weekGroups, quizItems]);

  // Weekend exams for the active week
  const weekExams = React.useMemo(() => {
    if (activeWeek === null) return [];
    return weekGroups.find(g => g.week === activeWeek)?.exams || [];
  }, [activeWeek, weekGroups]);

  // ── Determine which steps are available for the active lesson ─────────────
  const availableSteps = React.useMemo(() => {
    if (!activeLesson) return STEPS;
    return STEPS.filter(s => {
      if (s.id === 'intro')  return true; // always shown
      if (s.id === 'notes')  return !!activeLesson.pdf_url;
      if (s.id === 'video')  return !!activeLesson.video_url;
      if (s.id === 'quiz')   return !!activeLesson.linkedQuiz;
      return false;
    });
  }, [activeLesson]);

  // ── Navigation helpers ─────────────────────────────────────────────────────
  const openLesson = (lesson) => {
    if (!activeSubject) setActiveSubject(lesson.subject_name);
    setActiveLesson(lesson);
    setCurrentStep('intro');
    setCompletedSteps([]);
    setFeedbackThread([]);
    setFeedbackMsg('');
    setFeedbackOpen(false);
    loadFeedback(lesson.id);
  };

  const completeStep = (stepId) => {
    setCompletedSteps(p => p.includes(stepId) ? p : [...p, stepId]);
  };

  const goNextStep = () => {
    const idx = availableSteps.findIndex(s => s.id === currentStep);
    completeStep(currentStep);
    if (idx < availableSteps.length - 1) {
      setCurrentStep(availableSteps[idx + 1].id);
    }
  };

  const goBack = () => {
    if (viewerSrc)           { setViewerSrc(null); return; }
    if (activeLesson)        { setActiveLesson(null); setCurrentStep('intro'); setCompletedSteps([]); return; }
    if (activeSubject)       { setActiveSubject(null); return; }
    if (activeFolderId)      { setActiveFolderId(null); return; }
    if (activeWeek !== null) { setActiveWeek(null); setActiveSubject(null); }
  };

  const canGoBack = viewerSrc || activeLesson || activeSubject || activeFolderId || activeWeek !== null;

  // ── Quiz click logic ───────────────────────────────────────────────────────
  const handleQuizClick = (quiz) => {
    const start = quiz.scheduled_start ? new Date(quiz.scheduled_start) : null;
    const end   = quiz.scheduled_end   ? new Date(quiz.scheduled_end)   : null;
    const now   = new Date();
    if (end   && now > end)   { toast.error('This assessment is closed.');                          return; }
    if (start && now < start) { toast(`Opens on ${start.toLocaleString()}`, { duration: 4000 });  return; }
    if (quiz.disabled && quiz.attempt_status === 'in-progress') {
      toast('Resuming in-progress attempt…', { duration: 2000 });
      if (onStartQuiz) onStartQuiz(quiz.quiz_id); return;
    }
    if (quiz.disabled && !quiz.allow_retake) {
      toast.success('Assessment already completed.', { duration: 3000 }); return;
    }
    completeStep('quiz');
    if (onStartQuiz) onStartQuiz(quiz.quiz_id);
  };

  // ── Feedback state ────────────────────────────────────────────────────────
  const [feedbackThread,  setFeedbackThread]  = useState([]);
  const [feedbackMsg,     setFeedbackMsg]     = useState('');
  const [feedbackSending, setFeedbackSending] = useState(false);
  const [feedbackOpen,    setFeedbackOpen]    = useState(false);

  const loadFeedback = async (lessonId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await api.get(`/api/learner/lesson-feedback/${lessonId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) setFeedbackThread(res.data.feedback || []);
    } catch { /* silent */ }
  };

  const sendFeedback = async () => {
    if (!feedbackMsg.trim() || !activeLesson) return;
    setFeedbackSending(true);
    try {
      const token = localStorage.getItem('token');
      await api.post('/api/learner/lesson-feedback', {
        lesson_id:    activeLesson.id,
        lesson_title: activeLesson.title,
        subject:      activeLesson.subject_name,
        message:      feedbackMsg.trim(),
      }, { headers: { Authorization: `Bearer ${token}` } });
      setFeedbackMsg('');
      toast.success('Message sent to your teacher.');
      loadFeedback(activeLesson.id);
    } catch {
      toast.error('Could not send message. Please try again.');
    } finally {
      setFeedbackSending(false);
    }
  };
  const breadcrumb = () => {
    const p = ['Curriculum'];
    if (activeWeek !== null) p.push(activeWeek === 0 ? 'Unscheduled' : `Week ${activeWeek}`);
    if (activeSubject) p.push(activeSubject);
    if (activeLesson) p.push(activeLesson.title);
    if (activeFolderId === 'results') p.push('My Results');
    return p.join(' › ');
  };

  // ════════════════════════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════════════════════════
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[500px]">

      {/* ── Top nav bar ── */}
      <div className="flex items-center gap-3 px-4 py-2.5 bg-[#003B46] flex-shrink-0">
        <button
          onClick={goBack}
          disabled={!canGoBack}
          className={`p-1.5 rounded-lg transition ${canGoBack ? 'text-white/70 hover:bg-white/10 hover:text-white' : 'text-white/20 cursor-default'}`}
        >
          <ChevronLeftIcon className="w-4 h-4" />
        </button>
        <div className="flex-1 flex items-center gap-1.5 text-[11px] font-medium text-white/60 truncate">
          <span className="flex-shrink-0">📅</span>
          <span className="truncate">{breadcrumb()}</span>
        </div>
      </div>

      {/* ── Stepper bar — only when inside a lesson ── */}
      {activeLesson && !viewerSrc && (
        <div className="px-4 pt-3 pb-2 bg-white border-b border-slate-100 flex-shrink-0">
          <StepperBar
            steps={availableSteps}
            currentStep={currentStep}
            completedSteps={completedSteps}
            onStepClick={setCurrentStep}
          />
        </div>
      )}

      {/* ── Content ── */}
      <div className="flex-1 overflow-y-auto bg-[#F5F2EB]">

        {/* ════ LEVEL 1 — Week list ══════════════════════════════════════════ */}
        {activeWeek === null && !activeFolderId && (
          <div className="p-4 space-y-2.5">
            {weekGroups.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-2">
                <span className="text-4xl">📅</span>
                <p className="text-sm">No lessons scheduled yet.</p>
              </div>
            ) : weekGroups.map(({ week, lessons: wL, exams: wE }) => {
              const isLocked  = week > currentWeek;
              const isCurrent = week === currentWeek;
              const isPast    = week < currentWeek && week !== 0;
              const topicCount = wL.filter(l => l.resource_type !== 'quiz' && l.subject_name).length;
              const examCount  = wE.length;
              const subjectCount = new Set(wL.filter(l => l.resource_type !== 'quiz' && l.subject_name).map(l => l.subject_name)).size;
              return (
                <div
                  key={week}
                  onClick={() => !isLocked && setActiveWeek(week)}
                  className={`rounded-xl border overflow-hidden transition-all duration-200 ${
                    isLocked ? 'border-gray-200 bg-white/60 opacity-55 cursor-not-allowed' :
                    isCurrent ? 'border-[#006770] bg-white shadow-md cursor-pointer' :
                    'border-gray-200 bg-white hover:border-[#006770]/40 hover:shadow-sm cursor-pointer'
                  }`}
                >
                  <div className="flex items-center gap-3 px-4 py-3">
                    <div className={`w-11 h-11 rounded-xl flex flex-col items-center justify-center flex-shrink-0 font-black ${
                      isLocked  ? 'bg-gray-100 text-gray-300' :
                      isPast    ? 'bg-[#006770] text-white'   :
                      isCurrent ? 'bg-[#003B46] text-white'   :
                                  'bg-[#006770]/10 text-[#006770]'
                    }`}>
                      {isLocked ? <span className="text-lg">🔒</span> : (
                        <>
                          <span className="text-[8px] font-bold leading-none opacity-70">WK</span>
                          <span className="text-base leading-none">{week === 0 ? '?' : week}</span>
                        </>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-sm font-bold ${isLocked ? 'text-gray-300' : 'text-[#003B46]'}`}>
                          {week === 0 ? 'Unscheduled' : `Week ${week}`}
                        </span>
                        {isCurrent && (
                          <span className="px-2 py-0.5 bg-[#006770] text-white text-[9px] font-black rounded-full uppercase">Current</span>
                        )}
                        {isPast && <CheckCircleIcon className="w-3.5 h-3.5 text-[#006770]" />}
                      </div>
                      {!isLocked && (
                        <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                          {subjectCount > 0 && <span className="text-[10px] text-slate-400">📁 {subjectCount} subject{subjectCount !== 1 ? 's' : ''}</span>}
                          {examCount    > 0 && <span className="text-[10px] text-amber-500 font-semibold">🏆 Weekend exam</span>}
                          {topicCount === 0 && examCount === 0 && <span className="text-[10px] text-gray-400">No content yet</span>}
                        </div>
                      )}
                      {isLocked && <p className="text-[10px] text-gray-300 mt-0.5">Unlocks on week {week}</p>}
                    </div>
                    {!isLocked && <ChevronRightIcon className="w-4 h-4 text-gray-300 flex-shrink-0" />}
                  </div>
                </div>
              );
            })}

            {/* My Results */}
            <div
              onClick={() => setActiveFolderId('results')}
              className="flex items-center gap-3 px-4 py-3 bg-white border border-[#F97316]/20 rounded-xl cursor-pointer hover:shadow-sm hover:border-[#F97316]/40 transition"
            >
              <div className="w-10 h-10 rounded-xl bg-[#F97316]/10 flex items-center justify-center flex-shrink-0">
                <span className="text-lg">🏆</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-[#003B46]">My Results</p>
                <p className="text-[10px] text-gray-400 mt-0.5">View all quiz scores and progress</p>
              </div>
              <ChevronRightIcon className="w-4 h-4 text-gray-300" />
            </div>
          </div>
        )}

        {/* ════ LEVEL 2 — Subject folders ══════════════════════════════════ */}
        {activeWeek !== null && !activeSubject && !activeLesson && !activeFolderId && (
          <div className="p-4 space-y-4">

            {/* Weekend exam card */}
            {weekExams.map(exam => {
              const isQuiz      = exam.resource_type === 'quiz';
              const isTaken     = exam.disabled && exam.attempt_status !== 'in-progress';
              const isResumable = exam.attempt_status === 'in-progress';
              const start  = exam.scheduled_start ? new Date(exam.scheduled_start) : null;
              const end    = exam.scheduled_end   ? new Date(exam.scheduled_end)   : null;
              const now    = new Date();
              const isUpcoming = start && now < start;
              const isClosed   = end   && now > end;
              return (
                <div
                  key={exam.id}
                  onClick={() => isQuiz && !isClosed ? handleQuizClick(exam) : undefined}
                  className={`flex items-center gap-3 p-4 bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl transition-all ${
                    isQuiz && !isClosed ? 'cursor-pointer hover:shadow-lg' : 'cursor-default opacity-75'
                  }`}
                >
                  <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">🏆</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[9px] font-black text-white/70 uppercase tracking-widest">Weekend Exam</span>
                    <p className="text-sm font-bold text-white truncate">{exam.title}</p>
                    <p className="text-[10px] text-white/70">{exam.subject_name}</p>
                  </div>
                  <div className="flex-shrink-0">
                    {isClosed    && <span className="text-white/70 text-xs">Closed</span>}
                    {isUpcoming  && <span className="text-white/70 text-xs">⏰ {start.toLocaleDateString()}</span>}
                    {isTaken     && !isClosed && <span className="text-white text-xs">✓ Done</span>}
                    {isResumable && <span className="text-white/80 text-xs">Resume ▶</span>}
                    {!isClosed && !isUpcoming && !isTaken && !isResumable && <span className="text-white text-lg">▶</span>}
                  </div>
                </div>
              );
            })}

            {/* Subject folders */}
            {weekTopics.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-sm">No topics for this week yet.</div>
            ) : (() => {
              // Group by real subject name only — lessons without a subject are excluded upstream
              const subjectMap = {};
              weekTopics.forEach(t => {
                const s = t.subject_name;
                if (!s) return; // skip (already filtered, but belt-and-suspenders)
                if (!subjectMap[s]) subjectMap[s] = [];
                subjectMap[s].push(t);
              });

              const subjects = Object.entries(subjectMap);
              if (subjects.length === 0) {
                return <div className="text-center py-12 text-slate-400 text-sm">No topics for this week yet.</div>;
              }

              return (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {subjects.map(([subject, topics]) => {
                    // Count resources inside this subject folder
                    const noteCount  = topics.filter(t => !!t.pdf_url).length;
                    const videoCount = topics.filter(t => !!t.video_url).length;
                    const quizCount  = topics.filter(t => !!t.linkedQuiz).length;
                    const total = noteCount + videoCount + quizCount;
                    return (
                      <button
                        key={subject}
                        onClick={() => setActiveSubject(subject)}
                        className="group flex flex-col items-center gap-2 p-3 rounded-xl border border-gray-200 bg-white hover:border-[#006770]/40 hover:shadow-sm transition-all duration-200 active:scale-95"
                      >
                        {/* OS-style folder SVG */}
                        <svg viewBox="0 0 56 44" fill="none" xmlns="http://www.w3.org/2000/svg"
                          className="w-14 h-11 flex-shrink-0 transition-transform group-hover:scale-105">
                          <rect x="0" y="0" width="20" height="7" rx="3" fill="#F5C842" />
                          <rect x="0" y="5" width="56" height="36" rx="4" fill="#F5C842" />
                          <rect x="0" y="5" width="56" height="8" rx="4" fill="#F9D85A" opacity="0.6" />
                        </svg>
                        <div className="text-center w-full">
                          <p className="text-xs font-bold text-slate-700 leading-tight truncate">{subject}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{total} item{total !== 1 ? 's' : ''}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        )}

        {/* ════ LEVEL 3 — Folder contents (Notes, Video, Quiz) ════════════ */}
        {activeWeek !== null && activeSubject && !activeLesson && !activeFolderId && (() => {
          const subjectTopics = weekTopics.filter(t => t.subject_name === activeSubject);

          // Flatten into resource rows: each topic can contribute a note, video, and quiz row
          const rows = [];
          subjectTopics.forEach(topic => {
            if (topic.pdf_url)    rows.push({ type: 'notes', title: topic.title, sub: 'Lesson Notes',   emoji: '📄', topic });
            if (topic.video_url)  rows.push({ type: 'video', title: topic.title, sub: 'Lesson Video',   emoji: '🎬', topic });
            if (topic.linkedQuiz) rows.push({ type: 'quiz',  title: topic.linkedQuiz.title, sub: 'Assessment', emoji: '📝', topic, quiz: topic.linkedQuiz });
          });

          const openAt = (row) => {
            if (row.type === 'quiz') {
              handleQuizClick(row.quiz);
            } else {
              openLesson(row.topic);
              // jump straight to the right step
              setCurrentStep(row.type === 'notes' ? 'notes' : 'video');
            }
          };

          return (
            <div className="p-4 space-y-2">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">📂 {activeSubject}</p>
              {rows.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-sm">No resources in this folder yet.</div>
              ) : rows.map((row, i) => {
                const quiz = row.quiz;
                const isQuiz = row.type === 'quiz';
                const start = isQuiz && quiz?.scheduled_start ? new Date(quiz.scheduled_start) : null;
                const end   = isQuiz && quiz?.scheduled_end   ? new Date(quiz.scheduled_end)   : null;
                const now   = new Date();
                const isUpcoming  = isQuiz && start && now < start;
                const isClosed    = isQuiz && end   && now > end;
                const isDone      = isQuiz && quiz?.disabled && !quiz?.allow_retake;
                const isResumable = isQuiz && quiz?.attempt_status === 'in-progress';

                return (
                  <div
                    key={i}
                    onClick={() => !isClosed ? openAt(row) : undefined}
                    className={`flex items-center gap-3 px-4 py-3 bg-white rounded-xl border transition-all ${
                      isClosed
                        ? 'border-gray-100 opacity-50 cursor-not-allowed'
                        : 'border-slate-200 hover:border-[#006770]/40 hover:shadow-sm cursor-pointer'
                    }`}
                  >
                    <span className="text-xl flex-shrink-0">{row.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#003B46] truncate">{row.title}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{row.sub}</p>
                      {isQuiz && (start || end) && (
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          {start && <span className="text-[10px] text-slate-400">🕐 Opens {start.toLocaleString('en', { dateStyle: 'short', timeStyle: 'short' })}</span>}
                          {end   && <span className="text-[10px] text-slate-400">⏳ Closes {end.toLocaleString('en', { dateStyle: 'short', timeStyle: 'short' })}</span>}
                        </div>
                      )}
                    </div>
                    <div className="flex-shrink-0">
                      {isClosed    && <span className="text-[10px] text-red-400 font-semibold">Closed</span>}
                      {isUpcoming  && <span className="text-[10px] text-amber-500 font-semibold">⏰ Soon</span>}
                      {isDone      && <span className="text-[10px] text-green-600 font-semibold">✓ Done</span>}
                      {isResumable && <span className="text-[10px] text-amber-600 font-semibold">Resume</span>}
                      {!isClosed && !isUpcoming && !isDone && !isResumable && (
                        <ChevronRightIcon className="w-4 h-4 text-slate-300" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}

        {/* ════ LEVEL 4 — Lesson stepper ═══════════════════════════════════ */}
        {activeLesson && !viewerSrc && (
          <div className="p-4 space-y-4">

            {/* ── STEP: Introduction ── */}
            {currentStep === 'intro' && (
              <div className="space-y-4">
                {/* Title card */}
                <div className="bg-[#003B46] rounded-2xl p-5 text-white">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/50 mb-1">
                    {activeLesson.subject_name}
                  </p>
                  <h2 className="text-lg font-black leading-tight">{activeLesson.title}</h2>
                  {activeLesson.description && (
                    <p className="text-sm text-white/70 mt-2 leading-relaxed">{activeLesson.description}</p>
                  )}
                </div>

                {/* Objectives */}
                {activeLesson.objectives && (
                  <div className="bg-white rounded-xl border border-[#e2e8f0] overflow-hidden">
                    <div className="px-4 py-2.5 bg-emerald-50 border-b border-emerald-100 flex items-center gap-2">
                      <span className="text-base">🎯</span>
                      <span className="text-xs font-bold text-emerald-800 uppercase tracking-wide">Learning Objectives</span>
                    </div>
                    <div className="px-4 py-3 space-y-1.5">
                      {activeLesson.objectives.split('\n').filter(l => l.trim()).map((line, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <span className="text-emerald-500 font-bold text-sm mt-0.5 flex-shrink-0">✓</span>
                          <p className="text-sm text-slate-700 leading-relaxed">{line.trim()}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Instructions */}
                {activeLesson.instructions && (
                  <div className="bg-white rounded-xl border border-[#e2e8f0] overflow-hidden">
                    <div className="px-4 py-2.5 bg-blue-50 border-b border-blue-100 flex items-center gap-2">
                      <span className="text-base">📋</span>
                      <span className="text-xs font-bold text-blue-800 uppercase tracking-wide">Instructions</span>
                    </div>
                    <div className="px-4 py-3">
                      <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                        {activeLesson.instructions}
                      </p>
                    </div>
                  </div>
                )}

                {/* Placeholder when neither is set */}
                {!activeLesson.objectives && !activeLesson.instructions && (
                  <div className="bg-white rounded-xl border border-[#e2e8f0] px-4 py-6 text-center">
                    <p className="text-sm text-slate-400">Follow the steps above to work through this lesson.</p>
                  </div>
                )}

                {/* What's in this lesson */}
                <div className="bg-white rounded-xl border border-[#e2e8f0] px-4 py-3">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">This lesson includes</p>
                  <div className="space-y-1.5">
                    {availableSteps.filter(s => s.id !== 'intro').map(s => (
                      <div key={s.id} className="flex items-center gap-2 text-sm text-slate-600">
                        <span>{s.emoji}</span>
                        <span>{s.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── Ask a Question / Feedback ── */}
                <div className="bg-white rounded-xl border border-[#e2e8f0] overflow-hidden">
                  {/* Header — toggle */}
                  <button
                    onClick={() => setFeedbackOpen(o => !o)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">💬</span>
                      <span className="text-xs font-bold text-[#003B46] uppercase tracking-wide">Ask a Question</span>
                      {feedbackThread.length > 0 && (
                        <span className="px-1.5 py-0.5 bg-[#2A9D8F]/10 text-[#2A9D8F] text-[10px] font-bold rounded-full">
                          {feedbackThread.length}
                        </span>
                      )}
                    </div>
                    <span className="text-gray-400 text-sm">{feedbackOpen ? '▾' : '▸'}</span>
                  </button>

                  {feedbackOpen && (
                    <div className="border-t border-[#e2e8f0] p-4 space-y-3">

                      {/* Hint */}
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Didn't understand a concept? Send a message to your teacher — they'll reply here.
                      </p>

                      {/* Previous thread */}
                      {feedbackThread.length > 0 && (
                        <div className="space-y-2">
                          {feedbackThread.map((item) => (
                            <div key={item.id} className="space-y-1.5">
                              {/* Learner message */}
                              <div className="flex justify-end">
                                <div className="max-w-[85%] bg-[#003B46] text-white rounded-2xl rounded-tr-sm px-3 py-2">
                                  <p className="text-xs leading-relaxed">{item.message}</p>
                                  <p className="text-[9px] text-white/40 mt-1 text-right">
                                    {new Date(item.created_at).toLocaleString('en', { dateStyle: 'short', timeStyle: 'short' })}
                                  </p>
                                </div>
                              </div>
                              {/* Teacher reply */}
                              {item.reply && (
                                <div className="flex justify-start">
                                  <div className="max-w-[85%] bg-emerald-50 border border-emerald-100 rounded-2xl rounded-tl-sm px-3 py-2">
                                    <p className="text-[9px] font-bold text-emerald-600 mb-1">Teacher replied</p>
                                    <p className="text-xs text-slate-700 leading-relaxed">{item.reply}</p>
                                    <p className="text-[9px] text-slate-400 mt-1">
                                      {new Date(item.replied_at).toLocaleString('en', { dateStyle: 'short', timeStyle: 'short' })}
                                    </p>
                                  </div>
                                </div>
                              )}
                              {/* Awaiting reply */}
                              {!item.reply && (
                                <div className="flex justify-start">
                                  <span className="text-[10px] text-slate-400 italic px-1">⏳ Awaiting reply…</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* New message form */}
                      <div className="space-y-2">
                        <textarea
                          value={feedbackMsg}
                          onChange={e => setFeedbackMsg(e.target.value)}
                          placeholder="Type your question or describe what you didn't understand…"
                          rows={3}
                          className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#2A9D8F] focus:border-[#2A9D8F] transition resize-none"
                        />
                        <button
                          onClick={sendFeedback}
                          disabled={!feedbackMsg.trim() || feedbackSending}
                          className="w-full py-2.5 bg-[#003B46] text-white rounded-xl text-xs font-bold hover:bg-[#005060] transition disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {feedbackSending
                            ? <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Sending…</>
                            : '📤 Send Message to Teacher'
                          }
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── STEP: Read Notes ── */}
            {currentStep === 'notes' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-[#003B46]">📄 Lesson Notes</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">Read through the notes carefully before moving on.</p>
                  </div>
                  <button
                    onClick={() => { setViewerSrc(activeLesson.pdf_url); setViewerTitle(activeLesson.title + ' — Notes'); }}
                    className="px-3 py-1.5 bg-[#003B46] text-white rounded-lg text-xs font-semibold hover:bg-[#005060] transition"
                  >
                    ⛶ Full Screen
                  </button>
                </div>
                {/* Inline PDF */}
                <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-slate-900" style={{ height: '60vh' }}>
                  <iframe
                    src={activeLesson.pdf_url}
                    className="w-full h-full border-none"
                    title="Lesson Notes"
                  />
                </div>
              </div>
            )}

            {/* ── STEP: Watch Video ── */}
            {currentStep === 'video' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-[#003B46]">🎬 Lesson Video</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">Watch the video in full before proceeding.</p>
                  </div>
                  <button
                    onClick={() => { setViewerSrc(activeLesson.video_url?.includes('youtube.com') ? activeLesson.video_url.replace('watch?v=', 'embed/') : activeLesson.video_url); setViewerTitle(activeLesson.title + ' — Video'); }}
                    className="px-3 py-1.5 bg-[#003B46] text-white rounded-lg text-xs font-semibold hover:bg-[#005060] transition"
                  >
                    ⛶ Full Screen
                  </button>
                </div>
                <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-slate-900" style={{ height: '55vw', maxHeight: '60vh' }}>
                  <iframe
                    src={activeLesson.video_url?.includes('youtube.com')
                      ? activeLesson.video_url.replace('watch?v=', 'embed/')
                      : activeLesson.video_url}
                    className="w-full h-full border-none"
                    title="Lesson Video"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            )}

            {/* ── STEP: Quiz ── */}
            {currentStep === 'quiz' && (() => {
              const quiz  = activeLesson.linkedQuiz;
              if (!quiz) return <div className="text-center py-12 text-slate-400">No assessment linked to this lesson.</div>;
              const start = quiz.scheduled_start ? new Date(quiz.scheduled_start) : null;
              const end   = quiz.scheduled_end   ? new Date(quiz.scheduled_end)   : null;
              const now   = new Date();
              const isUpcoming  = start && now < start;
              const isClosed    = end   && now > end;
              const isDone      = quiz.disabled && !quiz.allow_retake;
              const isResumable = quiz.attempt_status === 'in-progress';

              return (
                <div className="space-y-4">
                  <div className="bg-white rounded-xl border border-[#e2e8f0] overflow-hidden">
                    <div className="px-4 py-3 bg-amber-50 border-b border-amber-100 flex items-center gap-2">
                      <span className="text-base">📝</span>
                      <span className="text-xs font-bold text-amber-800 uppercase tracking-wide">Assessment</span>
                      {isDone && <span className="ml-auto text-[10px] font-bold text-green-600">✓ Completed</span>}
                      {isUpcoming && <span className="ml-auto text-[10px] text-slate-400">⏰ Scheduled</span>}
                      {isClosed   && <span className="ml-auto text-[10px] text-red-400">Closed</span>}
                    </div>
                    <div className="px-4 py-4 space-y-2">
                      <h3 className="text-sm font-bold text-[#003B46]">{quiz.title}</h3>
                      {quiz.description && <p className="text-sm text-slate-500">{quiz.description}</p>}

                      {/* Schedule info */}
                      {(start || end) && (
                        <div className="flex flex-wrap gap-3 mt-2">
                          {start && (
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                              <span>🕐</span>
                              <span>Opens: <span className="font-semibold">{start.toLocaleString('en', { dateStyle: 'medium', timeStyle: 'short' })}</span></span>
                            </div>
                          )}
                          {end && (
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                              <span>⏳</span>
                              <span>Closes: <span className="font-semibold">{end.toLocaleString('en', { dateStyle: 'medium', timeStyle: 'short' })}</span></span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* CTA */}
                    <div className="px-4 pb-4">
                      {isClosed ? (
                        <div className="py-3 text-center text-sm text-slate-400 bg-gray-50 rounded-xl">This assessment is closed.</div>
                      ) : isUpcoming ? (
                        <div className="py-3 text-center text-sm text-slate-500 bg-amber-50 rounded-xl">
                          Opens on <span className="font-semibold">{start.toLocaleString('en', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                        </div>
                      ) : isDone ? (
                        <div className="py-3 text-center text-sm text-green-700 bg-green-50 rounded-xl font-semibold">
                          ✓ You have completed this assessment.
                        </div>
                      ) : (
                        <button
                          onClick={() => handleQuizClick(quiz)}
                          className="w-full py-3 bg-[#003B46] hover:bg-[#005060] text-white rounded-xl text-sm font-bold transition flex items-center justify-center gap-2"
                        >
                          {isResumable ? '▶ Resume Assessment' : '▶ Start Assessment'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* ── Step navigation footer ── */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-200">
              {/* Back step */}
              {availableSteps.findIndex(s => s.id === currentStep) > 0 ? (
                <button
                  onClick={() => {
                    const idx = availableSteps.findIndex(s => s.id === currentStep);
                    setCurrentStep(availableSteps[idx - 1].id);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 text-sm text-slate-600 hover:bg-gray-50 transition"
                >
                  ← Back
                </button>
              ) : <div />}

              {/* Next step or finish */}
              {availableSteps.findIndex(s => s.id === currentStep) < availableSteps.length - 1 ? (
                <button
                  onClick={goNextStep}
                  className="flex items-center gap-1.5 px-5 py-2 bg-[#003B46] text-white rounded-xl text-sm font-bold hover:bg-[#005060] transition"
                >
                  Next →
                </button>
              ) : (
                <button
                  onClick={() => { completeStep(currentStep); setActiveLesson(null); setCurrentStep('intro'); setCompletedSteps([]); }}
                  className="flex items-center gap-1.5 px-5 py-2 bg-[#006770] text-white rounded-xl text-sm font-bold hover:bg-[#005a62] transition"
                >
                  ✓ Finish Lesson
                </button>
              )}
            </div>
          </div>
        )}

        {/* ════ My Results ════════════════════════════════════════════════════ */}
        {activeFolderId === 'results' && !activeLesson && (
          <div className="p-4">
            <QuizResults onRetake={(quizId) => {
              setActiveFolderId(null);
              setActiveWeek(null);
              if (onStartQuiz) onStartQuiz(quizId);
            }} />
          </div>
        )}
      </div>

      {/* ── Full-screen viewer modal ── */}
      {viewerSrc && (
        <div className="fixed inset-0 bg-black/90 z-50 flex flex-col">
          <div className="flex items-center gap-3 px-4 py-3 bg-[#003B46] flex-shrink-0">
            <span className="text-sm font-medium text-white truncate flex-1">{viewerTitle}</span>
            <button
              onClick={() => setViewerSrc(null)}
              className="w-7 h-7 rounded-lg bg-white/10 hover:bg-red-500 flex items-center justify-center transition"
            >
              <XMarkIcon className="w-4 h-4 text-white" />
            </button>
          </div>
          <div className="flex-1">
            <iframe
              src={viewerSrc}
              className="w-full h-full border-none"
              title={viewerTitle}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default LearningSpace;
