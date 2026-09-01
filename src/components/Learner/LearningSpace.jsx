import React, { useState, useEffect } from 'react';
import {
  ChevronLeftIcon,
  XMarkIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/solid';
import {
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import api from '../../services/api';
import toast from 'react-hot-toast';
import QuizResults from './QuizResults';

// ── helpers ───────────────────────────────────────────────────────────────────
const getISOWeek = (date) => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
};

const getCurrentCurriculumWeek = () => {
  const stored = localStorage.getItem('courseStartDate');
  if (stored) {
    const start = new Date(stored);
    const now   = new Date();
    const diffMs = now - start;
    if (diffMs >= 0) return Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000)) + 1;
  }
  return getISOWeek(new Date());
};

// ── Basic emoji resource icon ─────────────────────────────────────────────────
const ResourceEmoji = ({ type }) => {
  if (type === 'video')     return <span className="text-base leading-none">🎬</span>;
  if (type === 'pdf')       return <span className="text-base leading-none">📄</span>;
  if (type === 'pastpaper') return <span className="text-base leading-none">📦</span>;
  if (type === 'quiz')      return <span className="text-base leading-none">📝</span>;
  return <span className="text-base leading-none">📄</span>;
};

// ── OS-style plain folder card (no icon inside, just the shape) ───────────────
const FolderCard = ({ name, itemCount, onClick }) => (
  <button
    onClick={onClick}
    className="group flex flex-col items-center gap-2 p-3 rounded-xl border border-gray-200 bg-white hover:border-[#006770]/40 hover:shadow-sm transition-all duration-200 active:scale-95"
  >
    {/* Folder SVG — plain OS look, no inner icon */}
    <svg
      viewBox="0 0 56 44"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-14 h-11 flex-shrink-0 transition-transform group-hover:scale-105"
    >
      {/* Tab */}
      <rect x="0" y="0" width="20" height="7" rx="3"
        fill="#F5C842" />
      {/* Body */}
      <rect x="0" y="5" width="56" height="36" rx="4"
        fill="#F5C842" />
      {/* Inner highlight */}
      <rect x="0" y="5" width="56" height="8" rx="4"
        fill="#F9D85A" opacity="0.6" />
    </svg>

    <div className="text-center">
      <p className="text-xs font-semibold text-slate-700 leading-tight">{name}</p>
      <p className="text-[10px] text-slate-400 mt-0.5">{itemCount} item{itemCount !== 1 ? 's' : ''}</p>
    </div>
  </button>
);

// ── main component ────────────────────────────────────────────────────────────
const LearningSpace = ({ onStartQuiz }) => {
  const [lessons,          setLessons]          = useState([]);
  const [quizItems,        setQuizItems]        = useState([]);
  const [activeFolderId,   setActiveFolderId]   = useState(null);
  const [activeWeek,       setActiveWeek]       = useState(null);
  const [selectedLesson,   setSelectedLesson]   = useState(null);
  const [showLessonModal,  setShowLessonModal]  = useState(false);
  const [viewMode,         setViewMode]         = useState('list');
  const [expandedSubjects, setExpandedSubjects] = useState({});
  const [currentWeek,      setCurrentWeek]      = useState(1);

  const folderConfig = [
    { id: 'videos',     name: 'Videos',      type: 'video'     },
    { id: 'pdfs',       name: 'Notes',       type: 'pdf'       },
    { id: 'quizzes',    name: 'Assessments', type: 'quiz'      },
    { id: 'pastpapers', name: 'Past Papers', type: 'pastpaper' },
  ];

  useEffect(() => {
    setCurrentWeek(getCurrentCurriculumWeek());
    loadLessonsAndQuizzes();
  }, []);

  useEffect(() => { setExpandedSubjects({}); }, [activeFolderId, activeWeek]);

  const loadLessonsAndQuizzes = async () => {
    try {
      const token   = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const [lessonsRes, quizzesRes] = await Promise.allSettled([
        api.get('/api/learner/lessons',  { headers }),
        api.get('/api/quiz/quizzes',     { headers }),
      ]);
      if (lessonsRes.status === 'fulfilled' && lessonsRes.value.data.success)
        setLessons(lessonsRes.value.data.lessons || []);
      if (quizzesRes.status === 'fulfilled' && quizzesRes.value.data.success) {
        setQuizItems((quizzesRes.value.data.quizzes || []).map(q => ({
          id: q.id, title: q.title, description: q.description,
          quiz_id: q.id, resource_type: 'quiz', video_url: null, pdf_url: null,
          target_form: q.target_form, already_taken: q.already_taken || false,
          attempt_status: q.attempt_status || null, disabled: q.disabled || false,
          scheduled_start: q.scheduled_start || null, scheduled_end: q.scheduled_end || null,
          subject_name: q.subject_name || 'Uncategorized',
          week_number: q.week_number || null, is_weekend_exam: q.is_weekend_exam || false,
        })));
      }
    } catch {
      toast.error('Could not load learning materials');
    }
  };

  // ── derived data ──────────────────────────────────────────────────────────────
  const weekGroups = React.useMemo(() => {
    const map = {};
    const addItem = (item) => {
      const w = item.week_number ?? 0;
      if (!map[w]) map[w] = { lessons: [], exams: [] };
      if (item.is_weekend_exam) map[w].exams.push(item);
      else                      map[w].lessons.push(item);
    };
    lessons.forEach(addItem);
    quizItems.forEach(addItem);
    return Object.entries(map)
      .map(([w, data]) => ({ week: parseInt(w), ...data }))
      .sort((a, b) => (a.week === 0 ? 1 : b.week === 0 ? -1 : a.week - b.week));
  }, [lessons, quizItems]);

  const weekFolderItems = React.useMemo(() => {
    if (activeWeek === null) return {};
    const weekData = weekGroups.find(g => g.week === activeWeek);
    if (!weekData) return {};
    const all = [...weekData.lessons, ...weekData.exams];
    return {
      video:     all.filter(i => i.resource_type === 'video'),
      pdf:       all.filter(i => i.resource_type === 'pdf'),
      quiz:      all.filter(i => i.resource_type === 'quiz'),
      pastpaper: all.filter(i => i.resource_type === 'pastpaper'),
    };
  }, [activeWeek, weekGroups]);

  // ── quiz click ────────────────────────────────────────────────────────────────
  const handleQuizClick = (item) => {
    const startTime = item.scheduled_start ? new Date(item.scheduled_start) : null;
    const endTime   = item.scheduled_end   ? new Date(item.scheduled_end)   : null;
    const now       = new Date();
    if (endTime   && now > endTime)   { toast.error('This assessment is closed.'); return; }
    if (startTime && now < startTime) { toast(`Opens on ${startTime.toLocaleString()}`, { duration: 4000 }); return; }
    if (item.disabled && item.attempt_status === 'in-progress') {
      toast('Resuming in-progress attempt…', { duration: 2000 });
      if (onStartQuiz) onStartQuiz(item.quiz_id); return;
    }
    if (item.disabled) { toast.success('Quiz already completed.', { duration: 3000 }); return; }
    if (onStartQuiz) onStartQuiz(item.quiz_id);
  };

  // ── grouped resource renderer ─────────────────────────────────────────────────
  const renderGroupedResources = (items, resourceType) => {
    if (!items || items.length === 0)
      return <div className="text-center py-10 text-slate-400 text-sm">No content available.</div>;

    const grouped = items.reduce((acc, item) => {
      const sub = item.subject_name || 'Uncategorized';
      if (!acc[sub]) acc[sub] = [];
      acc[sub].push(item);
      return acc;
    }, {});

    return (
      <div className="space-y-3">
        {Object.entries(grouped).map(([subjectName, subjectItems]) => {
          const isExpanded = expandedSubjects[subjectName] ?? false;
          return (
            <div key={subjectName} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              {/* Subject row — plain folder emoji */}
              <button
                onClick={() => setExpandedSubjects(p => ({ ...p, [subjectName]: !p[subjectName] }))}
                className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base leading-none">{isExpanded ? '📂' : '📁'}</span>
                  <span className="text-sm font-semibold text-slate-800">{subjectName}</span>
                  <span className="text-[10px] text-slate-400 bg-slate-200 px-1.5 py-0.5 rounded-full">{subjectItems.length}</span>
                </div>
                <ChevronRightIcon className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
              </button>

              {isExpanded && (
                <div className="p-3 border-t border-slate-100">
                  <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2' : 'space-y-1'}>
                    {subjectItems.map(item => {
                      const isQuiz        = resourceType === 'quiz';
                      const isDisabled    = isQuiz && item.disabled;
                      const isResumable   = isQuiz && item.attempt_status === 'in-progress';
                      const startTime     = isQuiz && item.scheduled_start ? new Date(item.scheduled_start) : null;
                      const endTime       = isQuiz && item.scheduled_end   ? new Date(item.scheduled_end)   : null;
                      const now           = new Date();
                      const isUpcoming    = isQuiz && startTime && now < startTime;
                      const isClosed      = isQuiz && endTime   && now > endTime;
                      const isUnavailable = isUpcoming || isClosed;

                      return (
                        <div
                          key={item.id}
                          onClick={() => isQuiz
                            ? handleQuizClick(item)
                            : (() => { setSelectedLesson(item); setShowLessonModal(true); })()
                          }
                          className={`group flex items-center p-3 rounded-lg border transition-all ${
                            isQuiz && (isDisabled || isUnavailable)
                              ? 'opacity-60 bg-gray-50 cursor-not-allowed border-gray-100'
                              : 'cursor-pointer border-transparent hover:bg-[#f0faf9] hover:border-[#006770]/20'
                          } ${viewMode === 'grid' ? 'flex-col text-center' : ''}`}
                        >
                          <div className={viewMode === 'grid' ? 'mb-2' : 'mr-3 flex-shrink-0'}>
                            <ResourceEmoji type={resourceType} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-700 truncate">{item.title}</p>
                            {viewMode === 'grid' && item.description && (
                              <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">{item.description}</p>
                            )}
                          </div>
                          {viewMode === 'list' && (
                            <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                              {isQuiz && isUpcoming  && <span className="text-[10px] text-slate-400">⏰ Soon</span>}
                              {isQuiz && isClosed    && <span className="text-[10px] text-slate-400">Closed</span>}
                              {isQuiz && isDisabled  && !isUnavailable && (
                                <span className={`text-[10px] font-semibold ${isResumable ? 'text-amber-600' : 'text-green-600'}`}>
                                  {isResumable ? 'Resume' : 'Done'}
                                </span>
                              )}
                              {item.is_weekend_exam && (
                                <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded">EXAM</span>
                              )}
                              <ChevronRightIcon className="w-4 h-4 text-slate-200 group-hover:text-[#006770] transition-colors" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // ── navigation ────────────────────────────────────────────────────────────────
  const handleBack = () => {
    if (activeFolderId) { setActiveFolderId(null); return; }
    if (activeWeek !== null) setActiveWeek(null);
  };
  const canGoBack = activeFolderId !== null || activeWeek !== null;

  const currentFolderItems = activeFolderId && activeWeek !== null
    ? (weekFolderItems[folderConfig.find(f => f.id === activeFolderId)?.type] || [])
    : activeFolderId
      ? (() => {
          const type = folderConfig.find(f => f.id === activeFolderId)?.type;
          if (type === 'video')     return lessons.filter(l => l.resource_type === 'video');
          if (type === 'pdf')       return lessons.filter(l => l.resource_type === 'pdf');
          if (type === 'pastpaper') return lessons.filter(l => l.resource_type === 'pastpaper');
          if (type === 'quiz')      return quizItems;
          return [];
        })()
      : [];

  const breadcrumb = () => {
    const parts = ['Curriculum'];
    if (activeWeek !== null) parts.push(activeWeek === 0 ? 'Unscheduled' : `Week ${activeWeek}`);
    if (activeFolderId) parts.push(folderConfig.find(f => f.id === activeFolderId)?.name || activeFolderId);
    return parts.join(' › ');
  };

  // ── render ────────────────────────────────────────────────────────────────────
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[500px]">

      {/* ── Top nav bar ── */}
      <div className="flex items-center gap-3 px-4 py-2.5 bg-[#003B46]">
        <button
          onClick={handleBack}
          disabled={!canGoBack}
          className={`p-1.5 rounded-lg transition ${
            canGoBack ? 'text-white/70 hover:bg-white/10 hover:text-white' : 'text-white/20 cursor-default'
          }`}
        >
          <ChevronLeftIcon className="w-4 h-4" />
        </button>

        {/* Breadcrumb */}
        <div className="flex-1 flex items-center gap-1.5 text-[11px] font-medium text-white/60 truncate">
          <span className="text-sm flex-shrink-0">📅</span>
          <span className="truncate">{breadcrumb()}</span>
        </div>

        {/* View toggle */}
        {activeFolderId && activeFolderId !== 'results' && (
          <div className="flex bg-white/10 p-0.5 rounded-lg gap-0.5">
            <button
              onClick={() => setViewMode('list')}
              className={`px-2 py-1 rounded text-xs font-medium transition ${
                viewMode === 'list' ? 'bg-white/20 text-white' : 'text-white/50 hover:text-white'
              }`}
            >
              ☰
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-2 py-1 rounded text-xs font-medium transition ${
                viewMode === 'grid' ? 'bg-white/20 text-white' : 'text-white/50 hover:text-white'
              }`}
            >
              ⊞
            </button>
          </div>
        )}
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-y-auto bg-[#F5F2EB]">

        {/* ══ LEVEL 1 — Weekly timeline ══════════════════════════════════════ */}
        {activeWeek === null && !activeFolderId && (
          <div className="p-4 space-y-2.5">
            {weekGroups.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-2">
                <span className="text-4xl">📅</span>
                <p className="text-sm font-medium">No lessons scheduled yet.</p>
              </div>
            ) : weekGroups.map(({ week, lessons: wLessons, exams: wExams }) => {
              const isLocked      = week > currentWeek;
              const isUnscheduled = week === 0;
              const isCurrent     = week === currentWeek;
              const isPast        = week < currentWeek && !isUnscheduled;
              const hasExam       = wExams.length > 0;
              const videoCount    = wLessons.filter(l => l.resource_type === 'video').length;
              const pdfCount      = wLessons.filter(l => l.resource_type === 'pdf').length;
              const quizCount     = [...wLessons, ...wExams].filter(l => l.resource_type === 'quiz').length;

              return (
                <div
                  key={week}
                  onClick={() => !isLocked && setActiveWeek(week)}
                  className={`rounded-xl border overflow-hidden transition-all duration-200 ${
                    isLocked
                      ? 'border-gray-200 bg-white/60 opacity-55 cursor-not-allowed'
                      : isCurrent
                        ? 'border-[#006770] bg-white shadow-md cursor-pointer'
                        : 'border-gray-200 bg-white hover:border-[#006770]/40 hover:shadow-sm cursor-pointer'
                  }`}
                >
                  <div className="flex items-center gap-4 px-4 py-3">
                    {/* Week badge */}
                    <div className={`w-11 h-11 rounded-xl flex flex-col items-center justify-center flex-shrink-0 font-black ${
                      isLocked  ? 'bg-gray-100 text-gray-300' :
                      isPast    ? 'bg-[#006770] text-white'   :
                      isCurrent ? 'bg-[#003B46] text-white'   :
                                  'bg-[#006770]/10 text-[#006770]'
                    }`}>
                      {isLocked ? (
                        <span className="text-lg">🔒</span>
                      ) : (
                        <>
                          <span className="text-[8px] font-bold leading-none opacity-70">WK</span>
                          <span className="text-base leading-none">{isUnscheduled ? '?' : week}</span>
                        </>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-sm font-bold ${isLocked ? 'text-gray-300' : 'text-[#003B46]'}`}>
                          {isUnscheduled ? 'Unscheduled' : `Week ${week}`}
                        </span>
                        {isCurrent && (
                          <span className="px-2 py-0.5 bg-[#006770] text-white text-[9px] font-black rounded-full tracking-wide uppercase">
                            Current
                          </span>
                        )}
                        {isPast && <CheckCircleIcon className="w-3.5 h-3.5 text-[#006770]" />}
                      </div>

                      {/* Resource chips — emoji only */}
                      {!isLocked && (
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          {videoCount > 0 && (
                            <span className="text-[10px] text-slate-500">🎬 {videoCount}</span>
                          )}
                          {pdfCount > 0 && (
                            <span className="text-[10px] text-slate-500">📄 {pdfCount}</span>
                          )}
                          {quizCount > 0 && (
                            <span className="text-[10px] text-slate-500">📝 {quizCount}</span>
                          )}
                          {hasExam && (
                            <span className="text-[10px] text-amber-600 font-semibold">🏆 Exam</span>
                          )}
                          {wLessons.length === 0 && !hasExam && (
                            <span className="text-[10px] text-gray-400">No content yet</span>
                          )}
                        </div>
                      )}
                      {isLocked && (
                        <p className="text-[10px] text-gray-300 mt-0.5">Unlocks on week {week}</p>
                      )}
                    </div>

                    {!isLocked && (
                      <ChevronRightIcon className="w-4 h-4 text-gray-300 flex-shrink-0" />
                    )}
                  </div>

                  {/* Weekend exam strip */}
                  {hasExam && !isLocked && (
                    <div className="mx-4 mb-3 flex items-center gap-2.5 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                      <span className="text-base">🏆</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-amber-800 truncate">{wExams[0].title}</p>
                        <p className="text-[10px] text-amber-500">{wExams[0].subject_name}</p>
                      </div>
                      {wExams[0].disabled && <CheckCircleIcon className="w-4 h-4 text-green-500 flex-shrink-0" />}
                    </div>
                  )}
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

        {/* ══ LEVEL 2 — Week detail: exam card + folder grid ═════════════════ */}
        {activeWeek !== null && !activeFolderId && (
          <div className="p-4">
            {/* Weekend exam card */}
            {(() => {
              const weekData = weekGroups.find(g => g.week === activeWeek);
              return (weekData?.exams || []).map(exam => {
                const isQuiz      = exam.resource_type === 'quiz';
                const isTaken     = isQuiz && exam.disabled && exam.attempt_status !== 'in-progress';
                const isResumable = isQuiz && exam.attempt_status === 'in-progress';
                return (
                  <div
                    key={exam.id}
                    onClick={() => isQuiz ? handleQuizClick(exam) : (() => { setSelectedLesson(exam); setShowLessonModal(true); })()}
                    className="mb-5 flex items-center gap-3 p-4 bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl cursor-pointer hover:shadow-lg transition-all"
                  >
                    <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-2xl">🏆</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[9px] font-black text-white/80 uppercase tracking-widest">Weekend Exam</span>
                        {isTaken     && <span className="text-white/80 text-xs">✓ Done</span>}
                        {isResumable && <span className="text-[9px] text-white/80 font-bold">In progress</span>}
                      </div>
                      <p className="text-sm font-bold text-white truncate">{exam.title}</p>
                      <p className="text-[10px] text-white/70">{exam.subject_name}</p>
                    </div>
                    <span className="text-white/60 text-lg">▶</span>
                  </div>
                );
              });
            })()}

            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Learning Materials</p>

            {/* Folder grid — plain OS folders */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {folderConfig.map(f => {
                const items = weekFolderItems[f.type] || [];
                if (items.length === 0) return null;
                return (
                  <FolderCard
                    key={f.id}
                    name={f.name}
                    itemCount={items.length}
                    onClick={() => setActiveFolderId(f.id)}
                  />
                );
              })}
              {folderConfig.every(f => (weekFolderItems[f.type] || []).length === 0) && (
                <div className="col-span-4 text-center py-10 text-slate-400 text-sm">
                  No materials for this week yet.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══ LEVEL 3 — Resource folder contents ════════════════════════════ */}
        {activeFolderId && activeFolderId !== 'results' && (
          <div className="p-4">
            {renderGroupedResources(
              currentFolderItems,
              folderConfig.find(f => f.id === activeFolderId)?.type
            )}
          </div>
        )}

        {/* ══ My Results ═════════════════════════════════════════════════════ */}
        {activeFolderId === 'results' && (
          <div className="p-4">
            <QuizResults onRetake={(quizId) => {
              setActiveFolderId(null);
              setActiveWeek(null);
              if (onStartQuiz) onStartQuiz(quizId);
            }} />
          </div>
        )}
      </div>

      {/* ── Lesson viewer modal ── */}
      {showLessonModal && selectedLesson && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[82vh] flex flex-col overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3 bg-[#003B46] flex-shrink-0">
              <ResourceEmoji type={selectedLesson.resource_type} />
              <span className="text-sm font-medium text-white truncate flex-1">{selectedLesson.title}</span>
              <button
                onClick={() => setShowLessonModal(false)}
                className="w-7 h-7 rounded-lg bg-white/10 hover:bg-red-500 flex items-center justify-center transition flex-shrink-0"
              >
                <XMarkIcon className="w-4 h-4 text-white" />
              </button>
            </div>
            <div className="flex-1 bg-slate-900">
              <iframe
                src={
                  selectedLesson.resource_type === 'video'
                    ? (selectedLesson.video_url?.includes('youtube.com')
                        ? selectedLesson.video_url.replace('watch?v=', 'embed/')
                        : selectedLesson.video_url)
                    : selectedLesson.pdf_url
                }
                className="w-full h-full border-none"
                title={selectedLesson.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LearningSpace;
