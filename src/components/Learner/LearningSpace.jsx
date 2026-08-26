import React, { useState, useEffect } from 'react';
import {
  VideoCameraIcon,
  DocumentTextIcon,
  BookOpenIcon,
  Squares2X2Icon,
  ListBulletIcon,
  ArrowRightCircleIcon,
  ChevronLeftIcon,
  XMarkIcon,
  ArchiveBoxIcon,
  TrophyIcon,
  FolderIcon,
  ChevronRightIcon,
  LockClosedIcon,
  CalendarDaysIcon,
  PlayIcon,
  DocumentIcon,
} from '@heroicons/react/24/solid';
import {
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import api from '../../services/api';
import toast from 'react-hot-toast';
import QuizResults from './QuizResults';

// ── helpers ───────────────────────────────────────────────────────────────────

/** Returns the ISO week number for a given date (Mon = start of week). */
const getISOWeek = (date) => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
};

/**
 * Derive the "current curriculum week" relative to a course start date stored
 * in localStorage (set on first login). Falls back to the calendar ISO week
 * so the feature works even without explicit start-date tracking.
 */
const getCurrentCurriculumWeek = () => {
  const stored = localStorage.getItem('courseStartDate');
  if (stored) {
    const start = new Date(stored);
    const now   = new Date();
    const diffMs = now - start;
    if (diffMs >= 0) {
      return Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000)) + 1;
    }
  }
  // Fallback: ISO week of the year (so learners always have at least some weeks open)
  return getISOWeek(new Date());
};

// ── sub-components ────────────────────────────────────────────────────────────

const ResourceIcon = ({ type, className = 'w-4 h-4' }) => {
  if (type === 'video')     return <VideoCameraIcon  className={`${className} text-sky-500`}    />;
  if (type === 'pdf')       return <DocumentTextIcon className={`${className} text-emerald-500`} />;
  if (type === 'pastpaper') return <ArchiveBoxIcon   className={`${className} text-purple-500`}  />;
  if (type === 'quiz')      return <BookOpenIcon     className={`${className} text-amber-500`}   />;
  return null;
};

// ── main component ────────────────────────────────────────────────────────────

const LearningSpace = ({ onStartQuiz }) => {
  const [loading,          setLoading]          = useState(true);
  const [lessons,          setLessons]          = useState([]);   // raw lessons
  const [quizItems,        setQuizItems]        = useState([]);   // quiz items
  const [activeFolderId,   setActiveFolderId]   = useState(null); // null = weekly root
  const [activeWeek,       setActiveWeek]       = useState(null); // null = week list
  const [selectedLesson,   setSelectedLesson]   = useState(null);
  const [showLessonModal,  setShowLessonModal]  = useState(false);
  const [viewMode,         setViewMode]         = useState('list');
  const [expandedSubjects, setExpandedSubjects] = useState({});
  const [currentWeek,      setCurrentWeek]      = useState(1);

  // folder config — used when drilling into a resource-type folder from a week
  const folderConfig = [
    { id: 'videos',     name: 'Video Lessons',      type: 'video',     icon: VideoCameraIcon,  folderColor: '#0EA5E9' },
    { id: 'pdfs',       name: 'Lesson Notes',        type: 'pdf',       icon: DocumentTextIcon, folderColor: '#10B981' },
    { id: 'quizzes',    name: 'Assessments',         type: 'quiz',      icon: BookOpenIcon,     folderColor: '#FBBF24' },
    { id: 'pastpapers', name: 'Solved Past Papers',  type: 'pastpaper', icon: ArchiveBoxIcon,   folderColor: '#8B5CF6' },
    { id: 'results',    name: 'My Results',          type: 'results',   icon: TrophyIcon,       folderColor: '#F97316' },
  ];

  useEffect(() => {
    setCurrentWeek(getCurrentCurriculumWeek());
    loadLessonsAndQuizzes();
  }, []);

  useEffect(() => { setExpandedSubjects({}); }, [activeFolderId, activeWeek]);

  const loadLessonsAndQuizzes = async () => {
    setLoading(true);
    try {
      const token   = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [lessonsRes, quizzesRes] = await Promise.allSettled([
        api.get('/api/learner/lessons',  { headers }),
        api.get('/api/quiz/quizzes',     { headers }),
      ]);

      if (lessonsRes.status === 'fulfilled' && lessonsRes.value.data.success) {
        setLessons(lessonsRes.value.data.lessons || []);
      }

      if (quizzesRes.status === 'fulfilled' && quizzesRes.value.data.success) {
        const quizzes = quizzesRes.value.data.quizzes || [];
        setQuizItems(quizzes.map(q => ({
          id:             q.id,
          title:          q.title,
          description:    q.description,
          quiz_id:        q.id,
          resource_type:  'quiz',
          video_url:      null,
          pdf_url:        null,
          target_form:    q.target_form,
          already_taken:  q.already_taken  || false,
          attempt_status: q.attempt_status || null,
          disabled:       q.disabled       || false,
          scheduled_start: q.scheduled_start || null,
          scheduled_end:   q.scheduled_end   || null,
          subject_name:   q.subject_name   || 'Uncategorized',
          week_number:    q.week_number    || null,
          is_weekend_exam: q.is_weekend_exam || false,
        })));
      }
    } catch (err) {
      console.error('LearningSpace load error:', err);
      toast.error('Could not load learning materials');
    } finally {
      setLoading(false);
    }
  };

  // ── derived data ────────────────────────────────────────────────────────────

  /** All content grouped by week_number. Week 0 = unscheduled. */
  const weekGroups = React.useMemo(() => {
    const map = {};
    const addItem = (item) => {
      const w = item.week_number ?? 0;
      if (!map[w]) map[w] = { lessons: [], exams: [] };
      if (item.is_weekend_exam) map[w].exams.push(item);
      else                       map[w].lessons.push(item);
    };
    lessons.forEach(addItem);
    quizItems.forEach(addItem);
    return Object.entries(map)
      .map(([w, data]) => ({ week: parseInt(w), ...data }))
      .sort((a, b) => (a.week === 0 ? 1 : b.week === 0 ? -1 : a.week - b.week));
  }, [lessons, quizItems]);

  /** Items for the currently selected week, split by folder type */
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

  // ── quiz click handler ──────────────────────────────────────────────────────
  const handleQuizClick = (item) => {
    const startTime = item.scheduled_start ? new Date(item.scheduled_start) : null;
    const endTime   = item.scheduled_end   ? new Date(item.scheduled_end)   : null;
    const now       = new Date();

    if (endTime && now > endTime)                        { toast.error('This assessment is closed.');                                              return; }
    if (startTime && now < startTime)                    { toast(`Opens on ${startTime.toLocaleString()}`, { duration: 4000 });                    return; }
    if (item.disabled && item.attempt_status === 'in-progress') {
      toast('You have an in-progress attempt. Resuming…', { duration: 2000 });
      if (onStartQuiz) onStartQuiz(item.quiz_id);
      return;
    }
    if (item.disabled)                                   { toast.success('You have already completed this quiz.', { duration: 3000 });             return; }
    if (onStartQuiz) onStartQuiz(item.quiz_id);
  };

  // ── grouped resource renderer (used inside folder view) ────────────────────
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
            <div key={subjectName} className="bg-white rounded-lg border border-slate-200 overflow-hidden">
              <button
                onClick={() => setExpandedSubjects(p => ({ ...p, [subjectName]: !p[subjectName] }))}
                className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 transition"
              >
                <div className="flex items-center gap-2">
                  <FolderIcon className="w-4 h-4 text-amber-500" />
                  <span className="text-sm font-medium text-slate-800">{subjectName}</span>
                  <span className="text-xs text-slate-400">({subjectItems.length})</span>
                </div>
                <ChevronRightIcon className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
              </button>

              {isExpanded && (
                <div className="p-3 border-t border-slate-100">
                  <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2' : 'space-y-1'}>
                    {subjectItems.map(item => {
                      const isQuiz       = resourceType === 'quiz';
                      const isDisabled   = isQuiz && item.disabled;
                      const isResumable  = isQuiz && item.attempt_status === 'in-progress';
                      const startTime    = isQuiz && item.scheduled_start ? new Date(item.scheduled_start) : null;
                      const endTime      = isQuiz && item.scheduled_end   ? new Date(item.scheduled_end)   : null;
                      const now          = new Date();
                      const isUpcoming   = isQuiz && startTime && now < startTime;
                      const isClosed     = isQuiz && endTime   && now > endTime;
                      const isUnavailable = isUpcoming || isClosed;

                      return (
                        <div
                          key={item.id}
                          onClick={() => isQuiz ? handleQuizClick(item) : (() => { setSelectedLesson(item); setShowLessonModal(true); })()}
                          className={`group flex items-center p-3 rounded border transition-all ${
                            isQuiz && (isDisabled || isUnavailable) ? 'opacity-60 bg-gray-100 cursor-not-allowed' : 'cursor-pointer'
                          } ${viewMode === 'grid'
                              ? 'flex-col text-center border-slate-100 hover:bg-sky-50'
                              : 'border-transparent hover:bg-slate-100 hover:border-slate-200'}`}
                        >
                          <div className={viewMode === 'grid' ? 'mb-2' : 'mr-3'}>
                            <ResourceIcon type={resourceType} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-slate-700 truncate">{item.title}</h4>
                            {viewMode === 'grid' && item.description && (
                              <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">{item.description}</p>
                            )}
                          </div>
                          {viewMode === 'list' && (
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {isQuiz && (isUpcoming || isClosed) && (
                                <span className="text-xs text-slate-500">{isUpcoming ? 'Upcoming' : 'Closed'}</span>
                              )}
                              {isQuiz && isDisabled && !isUnavailable && (
                                <span className="text-xs text-amber-600">{isResumable ? 'Resume' : 'Taken'}</span>
                              )}
                              {item.is_weekend_exam && (
                                <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded">EXAM</span>
                              )}
                              <ArrowRightCircleIcon className="w-4 h-4 text-slate-300 group-hover:text-slate-500" />
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

  // ── loading ─────────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="h-64 flex flex-col items-center justify-center gap-3">
      <div className="w-7 h-7 border-4 border-[#006770] border-t-transparent rounded-full animate-spin" />
      <p className="text-xs text-slate-400 font-medium">Loading your curriculum…</p>
    </div>
  );

  // ── breadcrumb label ────────────────────────────────────────────────────────
  const breadcrumb = () => {
    const parts = ['Curriculum'];
    if (activeWeek !== null) parts.push(`Week ${activeWeek}`);
    if (activeFolderId)      parts.push(folderConfig.find(f => f.id === activeFolderId)?.name || activeFolderId);
    return parts.join(' / ');
  };

  // ── back handler ────────────────────────────────────────────────────────────
  const handleBack = () => {
    if (activeFolderId) { setActiveFolderId(null); return; }
    if (activeWeek !== null) { setActiveWeek(null); }
  };

  const canGoBack = activeFolderId !== null || activeWeek !== null;

  // ── folder items for current view ───────────────────────────────────────────
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

  // ── render ──────────────────────────────────────────────────────────────────
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[500px]">

      {/* Navigation bar */}
      <div className="bg-slate-50 border-b border-slate-200 px-4 py-2 flex items-center gap-3">
        <button
          onClick={handleBack}
          disabled={!canGoBack}
          className={`p-1 rounded hover:bg-slate-200 transition ${!canGoBack ? 'text-slate-300' : 'text-slate-600'}`}
        >
          <ChevronLeftIcon className="w-5 h-5" />
        </button>

        {/* Breadcrumb path */}
        <div className="flex-1 flex items-center bg-white border border-slate-200 rounded px-2 py-1 text-[11px] font-mono text-slate-500 overflow-hidden truncate">
          <CalendarDaysIcon className="w-3 h-3 mr-1.5 text-[#006770] flex-shrink-0" />
          {breadcrumb()}
        </div>

        {/* View toggle — only when inside a resource folder */}
        {activeFolderId && activeFolderId !== 'results' && (
          <div className="flex bg-slate-200 p-0.5 rounded">
            <button onClick={() => setViewMode('list')} className={`p-1 rounded ${viewMode === 'list' ? 'bg-white shadow-sm' : 'text-slate-500'}`}>
              <ListBulletIcon className="w-4 h-4" />
            </button>
            <button onClick={() => setViewMode('grid')} className={`p-1 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm' : 'text-slate-500'}`}>
              <Squares2X2Icon className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-y-auto p-5">

        {/* ── LEVEL 1: Weekly timeline ──────────────────────────────────────── */}
        {activeWeek === null && !activeFolderId && (
          <div className="space-y-3">
            {weekGroups.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                <CalendarDaysIcon className="w-10 h-10 mb-3 opacity-30" />
                <p className="text-sm">No lessons scheduled yet.</p>
              </div>
            ) : weekGroups.map(({ week, lessons: wLessons, exams: wExams }) => {
              const isLocked    = week > currentWeek;
              const isUnscheduled = week === 0;
              const totalItems  = wLessons.length + wExams.length;
              const hasExam     = wExams.length > 0;

              return (
                <div
                  key={week}
                  onClick={() => !isLocked && setActiveWeek(week)}
                  className={`group rounded-xl border transition-all overflow-hidden ${
                    isLocked
                      ? 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
                      : 'border-[#006770]/20 bg-white hover:border-[#006770]/50 hover:shadow-md cursor-pointer'
                  }`}
                >
                  <div className="flex items-center gap-4 px-4 py-3.5">
                    {/* Week badge */}
                    <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center flex-shrink-0 ${
                      isLocked        ? 'bg-gray-200'         :
                      isUnscheduled   ? 'bg-gray-100'         :
                      week < currentWeek ? 'bg-[#006770]'    :
                                          'bg-[#006770]/10'
                    }`}>
                      {isLocked ? (
                        <LockClosedIcon className="w-5 h-5 text-gray-400" />
                      ) : (
                        <>
                          <span className={`text-[10px] font-bold leading-none ${week < currentWeek ? 'text-white/70' : 'text-[#006770]'}`}>WK</span>
                          <span className={`text-lg font-black leading-none ${week < currentWeek ? 'text-white' : 'text-[#003B46]'}`}>
                            {isUnscheduled ? '?' : week}
                          </span>
                        </>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-sm font-bold ${isLocked ? 'text-gray-400' : 'text-[#003B46]'}`}>
                          {isUnscheduled ? 'Unscheduled Lessons' : `Week ${week}`}
                        </span>
                        {week === currentWeek && (
                          <span className="px-2 py-0.5 bg-[#006770] text-white text-[10px] font-bold rounded-full">CURRENT</span>
                        )}
                        {week < currentWeek && !isUnscheduled && (
                          <CheckCircleIcon className="w-4 h-4 text-[#006770]" />
                        )}
                        {isLocked && (
                          <span className="text-[10px] text-gray-400">Unlocks on week {week}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <span className="text-xs text-gray-400">
                          {wLessons.length} lesson{wLessons.length !== 1 ? 's' : ''}
                        </span>
                        {hasExam && (
                          <span className="flex items-center gap-1 text-xs text-amber-600 font-semibold">
                            <TrophyIcon className="w-3.5 h-3.5" />
                            Weekend Exam
                          </span>
                        )}
                        {/* Resource type chips */}
                        <div className="flex gap-1.5 flex-wrap">
                          {wLessons.filter(l => l.resource_type === 'video').length > 0 && (
                            <span className="flex items-center gap-0.5 px-1.5 py-0.5 bg-sky-50 text-sky-600 text-[10px] rounded font-medium">
                              <VideoCameraIcon className="w-3 h-3" />
                              {wLessons.filter(l => l.resource_type === 'video').length}
                            </span>
                          )}
                          {wLessons.filter(l => l.resource_type === 'pdf').length > 0 && (
                            <span className="flex items-center gap-0.5 px-1.5 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] rounded font-medium">
                              <DocumentIcon className="w-3 h-3" />
                              {wLessons.filter(l => l.resource_type === 'pdf').length}
                            </span>
                          )}
                          {[...wLessons, ...wExams].filter(l => l.resource_type === 'quiz').length > 0 && (
                            <span className="flex items-center gap-0.5 px-1.5 py-0.5 bg-amber-50 text-amber-600 text-[10px] rounded font-medium">
                              <BookOpenIcon className="w-3 h-3" />
                              {[...wLessons, ...wExams].filter(l => l.resource_type === 'quiz').length}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {!isLocked && (
                      <ChevronRightIcon className="w-4 h-4 text-[#006770] opacity-0 group-hover:opacity-100 transition flex-shrink-0" />
                    )}
                  </div>

                  {/* Weekend exam preview strip */}
                  {hasExam && !isLocked && (
                    <div className="mx-4 mb-3 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2">
                      <TrophyIcon className="w-4 h-4 text-amber-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-amber-800 truncate">{wExams[0].title}</p>
                        <p className="text-[10px] text-amber-500">Weekend Exam · {wExams[0].subject_name}</p>
                      </div>
                      {wExams[0].disabled && (
                        <CheckCircleIcon className="w-4 h-4 text-green-500 flex-shrink-0" />
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* My Results link */}
            <div
              onClick={() => setActiveFolderId('results')}
              className="flex items-center gap-3 px-4 py-3 bg-[#F97316]/5 border border-[#F97316]/20 rounded-xl cursor-pointer hover:bg-[#F97316]/10 transition group"
            >
              <div className="w-10 h-10 rounded-xl bg-[#F97316]/10 flex items-center justify-center flex-shrink-0">
                <TrophyIcon className="w-5 h-5 text-[#F97316]" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-[#003B46]">My Results</p>
                <p className="text-[10px] text-gray-400">View all quiz scores and progress</p>
              </div>
              <ChevronRightIcon className="w-4 h-4 text-[#F97316] opacity-0 group-hover:opacity-100 transition" />
            </div>
          </div>
        )}

        {/* ── LEVEL 2: Week detail — resource-type folders ──────────────────── */}
        {activeWeek !== null && !activeFolderId && (
          <div>
            {/* Weekend exam card — always first and prominent */}
            {(() => {
              const weekData = weekGroups.find(g => g.week === activeWeek);
              const exams = weekData?.exams || [];
              return exams.map(exam => {
                const isQuiz      = exam.resource_type === 'quiz';
                const isTaken     = isQuiz && exam.disabled && exam.attempt_status !== 'in-progress';
                const isResumable = isQuiz && exam.attempt_status === 'in-progress';
                return (
                  <div
                    key={exam.id}
                    onClick={() => isQuiz ? handleQuizClick(exam) : (() => { setSelectedLesson(exam); setShowLessonModal(true); })()}
                    className={`mb-4 p-4 rounded-xl border-2 border-amber-300 bg-amber-50 cursor-pointer hover:bg-amber-100 transition group`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-amber-200 flex items-center justify-center flex-shrink-0">
                        <TrophyIcon className="w-6 h-6 text-amber-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-amber-500 text-white text-[10px] font-black rounded-full">WEEKEND EXAM</span>
                          {isTaken && <CheckCircleIcon className="w-4 h-4 text-green-500" />}
                          {isResumable && <span className="text-[10px] text-amber-700 font-bold">In progress — Resume</span>}
                        </div>
                        <p className="text-sm font-bold text-amber-900 mt-0.5">{exam.title}</p>
                        <p className="text-[11px] text-amber-600">{exam.subject_name}</p>
                      </div>
                      <PlayIcon className="w-5 h-5 text-amber-500 opacity-0 group-hover:opacity-100 transition" />
                    </div>
                  </div>
                );
              });
            })()}

            {/* Resource-type folder grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {folderConfig.filter(f => f.id !== 'results').map(f => {
                const items = weekFolderItems[f.type] || [];
                if (items.length === 0) return null;
                return (
                  <div
                    key={f.id}
                    onClick={() => setActiveFolderId(f.id)}
                    className="group flex flex-col items-center cursor-pointer py-2"
                  >
                    {/* Folder icon */}
                    <div className="relative w-16 h-12 mb-2 transition-transform group-hover:scale-105 group-active:scale-95">
                      <div className="absolute top-0 left-0 w-6 h-2 rounded-t-sm" style={{ backgroundColor: f.folderColor, filter: 'brightness(0.8)' }} />
                      <div className="absolute top-1 left-0 w-full h-11 rounded-sm shadow-sm flex items-center justify-center" style={{ backgroundColor: f.folderColor }}>
                        <span className="text-white text-xs font-bold">{items.length}</span>
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-600 text-center group-hover:underline">{f.name}</span>
                    <span className="text-[10px] text-slate-400">{items.length} item{items.length !== 1 ? 's' : ''}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── LEVEL 3: Resource folder contents ────────────────────────────── */}
        {activeFolderId && activeFolderId !== 'results' && (() => {
          const folderType = folderConfig.find(f => f.id === activeFolderId)?.type;
          return renderGroupedResources(currentFolderItems, folderType);
        })()}

        {/* ── My Results ───────────────────────────────────────────────────── */}
        {activeFolderId === 'results' && <QuizResults />}

      </div>

      {/* Lesson viewer modal */}
      {showLessonModal && selectedLesson && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col border border-slate-300">
            <div className="bg-slate-100 px-4 py-2 border-b flex justify-between items-center select-none rounded-t-xl">
              <div className="flex items-center gap-2">
                <ResourceIcon type={selectedLesson.resource_type} className="w-4 h-4" />
                <span className="text-[11px] font-mono text-slate-600 truncate max-w-[300px]">{selectedLesson.title}</span>
              </div>
              <button
                onClick={() => setShowLessonModal(false)}
                className="hover:bg-red-500 hover:text-white text-slate-500 rounded p-0.5 transition-colors"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 bg-slate-900 rounded-b-xl overflow-hidden">
              <iframe
                src={selectedLesson.resource_type === 'video'
                  ? (selectedLesson.video_url?.includes('youtube.com')
                      ? selectedLesson.video_url.replace('watch?v=', 'embed/')
                      : selectedLesson.video_url)
                  : selectedLesson.pdf_url}
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
