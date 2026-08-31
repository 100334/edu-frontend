import React, { useState, useEffect, useCallback } from 'react';
import {
  PlusIcon, PencilIcon, TrashIcon, XMarkIcon,
  VideoCameraIcon, DocumentTextIcon, BookOpenIcon, ArchiveBoxIcon,
  AcademicCapIcon, ExclamationTriangleIcon, CalendarDaysIcon,
  TrophyIcon, ChevronLeftIcon,
} from '@heroicons/react/24/outline';
import {
  ChevronRightIcon as ChevronRightIconSolid,
} from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';
import api from '../../services/api';

const inp = 'w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#00B4D8] focus:border-[#00B4D8] transition';

const WEEKS = Array.from({ length: 20 }, (_, i) => i + 1);

const folderConfig = [
  { id: 'videos',     name: 'Videos',      type: 'video'     },
  { id: 'pdfs',       name: 'Notes',       type: 'pdf'       },
  { id: 'quizzes',    name: 'Assessments', type: 'quiz'      },
  { id: 'pastpapers', name: 'Past Papers', type: 'pastpaper' },
];

// ── Basic emoji resource icon ─────────────────────────────────────────────────
const ResourceEmoji = ({ type }) => {
  if (type === 'video')     return <span className="text-base leading-none">🎬</span>;
  if (type === 'pdf')       return <span className="text-base leading-none">📄</span>;
  if (type === 'pastpaper') return <span className="text-base leading-none">📦</span>;
  if (type === 'quiz')      return <span className="text-base leading-none">📝</span>;
  return <span className="text-base leading-none">📄</span>;
};

// ── OS-style plain folder (no icon inside) ────────────────────────────────────
const FolderCard = ({ name, itemCount, onClick }) => (
  <button
    onClick={onClick}
    className="group flex flex-col items-center gap-2 p-3 rounded-xl border border-gray-200 bg-white hover:border-[#006770]/40 hover:shadow-sm transition-all duration-200 active:scale-95"
  >
    <svg viewBox="0 0 56 44" fill="none" xmlns="http://www.w3.org/2000/svg"
      className="w-14 h-11 flex-shrink-0 transition-transform group-hover:scale-105">
      <rect x="0" y="0" width="20" height="7" rx="3" fill="#F5C842" />
      <rect x="0" y="5" width="56" height="36" rx="4" fill="#F5C842" />
      <rect x="0" y="5" width="56" height="8" rx="4" fill="#F9D85A" opacity="0.6" />
    </svg>
    <div className="text-center">
      <p className="text-xs font-semibold text-slate-700 leading-tight">{name}</p>
      <p className="text-[10px] text-slate-400 mt-0.5">{itemCount} item{itemCount !== 1 ? 's' : ''}</p>
    </div>
  </button>
);

// ─────────────────────────────────────────────────────────────────────────────

const LessonManagement = () => {
  const [lessons,       setLessons]       = useState([]);
  const [subjects,      setSubjects]      = useState([]);
  const [quizzes,       setQuizzes]       = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [showModal,     setShowModal]     = useState(false);
  const [editingLesson, setEditingLesson] = useState(null);
  const [submitting,    setSubmitting]    = useState(false);
  const [uploadStatus,  setUploadStatus]  = useState({ video: false, pdf: false });
  const [confirmLesson, setConfirmLesson] = useState(null);

  // ── navigation state (mirrors LearningSpace) ─────────────────────────────
  const [activeWeek,       setActiveWeek]       = useState(null);   // null | number
  const [activeFolderId,   setActiveFolderId]   = useState(null);   // null | 'videos' | 'pdfs' | ...
  const [expandedSubjects, setExpandedSubjects] = useState({});

  const emptyForm = {
    title: '', description: '', video_url: '', pdf_url: '',
    subject_id: '', target_form: 'All', quiz_id: '',
    display_order: 0, resource_type: 'video',
    week_number: 1, is_weekend_exam: false,
  };
  const [formData, setFormData] = useState(emptyForm);

  // ── data loading ─────────────────────────────────────────────────────────
  const loadSubjects = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await api.get('/api/admin/quiz-subjects', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        const raw  = res.data.subjects || [];
        const seen = new Set();
        setSubjects(raw.filter(s => {
          const key = s.name?.trim().toLowerCase();
          if (seen.has(key)) return false;
          seen.add(key); return true;
        }));
      } else setSubjects([]);
    } catch { setSubjects([]); }
  };

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const auth  = { headers: { Authorization: `Bearer ${token}` } };
      await loadSubjects();
      try {
        const r = await api.get('/api/admin/lessons', auth);
        setLessons(r.data.success ? (r.data.lessons || []) : []);
      } catch { setLessons([]); }
      try {
        const r = await api.get('/api/admin/quizzes', auth);
        setQuizzes(r.data.success ? (r.data.quizzes || []) : []);
      } catch { setQuizzes([]); }
    } catch { toast.error('Error loading data'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadDashboardData(); }, [loadDashboardData]);

  // reset subject expansion when navigating levels
  useEffect(() => { setExpandedSubjects({}); }, [activeFolderId, activeWeek]);

  // ── helpers ───────────────────────────────────────────────────────────────
  const getSubjectName  = (id) => {
    const s = subjects.find(s => String(s.id) === String(id));
    return s ? s.name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '') : 'uncategorized';
  };
  const getSubjectLabel = (id) => subjects.find(s => String(s.id) === String(id))?.name || 'General';

  // ── week grouping ─────────────────────────────────────────────────────────
  const weekGroups = React.useMemo(() => {
    const map = {};
    lessons.forEach(l => {
      const w = l.week_number ?? 0;
      if (!map[w]) map[w] = { lessons: [], exams: [] };
      if (l.is_weekend_exam) map[w].exams.push(l);
      else                   map[w].lessons.push(l);
    });
    return Object.entries(map)
      .map(([w, data]) => ({ week: parseInt(w), ...data }))
      .sort((a, b) => (a.week === 0 ? 1 : b.week === 0 ? -1 : a.week - b.week));
  }, [lessons]);

  // items split by type for the active week's folder grid
  const weekFolderItems = React.useMemo(() => {
    if (activeWeek === null) return {};
    const wd = weekGroups.find(g => g.week === activeWeek);
    if (!wd) return {};
    const all = [...wd.lessons, ...wd.exams];
    return {
      video:     all.filter(i => i.resource_type === 'video'),
      pdf:       all.filter(i => i.resource_type === 'pdf'),
      quiz:      all.filter(i => i.resource_type === 'quiz'),
      pastpaper: all.filter(i => i.resource_type === 'pastpaper'),
    };
  }, [activeWeek, weekGroups]);

  // items in the active folder
  const currentFolderItems = React.useMemo(() => {
    if (!activeFolderId) return [];
    const type = folderConfig.find(f => f.id === activeFolderId)?.type;
    if (activeWeek !== null) return weekFolderItems[type] || [];
    if (type === 'video')     return lessons.filter(l => l.resource_type === 'video');
    if (type === 'pdf')       return lessons.filter(l => l.resource_type === 'pdf');
    if (type === 'pastpaper') return lessons.filter(l => l.resource_type === 'pastpaper');
    if (type === 'quiz')      return lessons.filter(l => l.resource_type === 'quiz');
    return [];
  }, [activeFolderId, activeWeek, weekFolderItems, lessons]);

  // breadcrumb
  const breadcrumb = () => {
    const parts = ['Lessons'];
    if (activeWeek !== null) parts.push(activeWeek === 0 ? 'Unscheduled' : `Week ${activeWeek}`);
    if (activeFolderId) parts.push(folderConfig.find(f => f.id === activeFolderId)?.name || activeFolderId);
    return parts.join(' / ');
  };

  const canGoBack = activeFolderId !== null || activeWeek !== null;
  const handleBack = () => {
    if (activeFolderId) { setActiveFolderId(null); return; }
    if (activeWeek !== null) setActiveWeek(null);
  };

  // ── upload ────────────────────────────────────────────────────────────────
  const uploadToR2 = async (file, type) => {
    if (!file) return;
    if (!formData.subject_id) { toast.error('Select a subject first.'); return; }
    const folder = `${formData.resource_type === 'video' ? 'videos' : 'pdfs'}/${getSubjectName(formData.subject_id)}`;
    setUploadStatus(p => ({ ...p, [type]: true }));
    try {
      const token = localStorage.getItem('token');
      const { data } = await api.post('/api/admin/r2-upload-url', {
        fileName: file.name, fileType: file.type, folder,
      }, { headers: { Authorization: `Bearer ${token}` } });
      const upload = await fetch(data.uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
      if (!upload.ok) throw new Error('Upload failed');
      const fileUrl = data.fileUrl || data.publicUrl || data.url;
      const field   = formData.resource_type === 'video' ? 'video_url' : 'pdf_url';
      setFormData(p => ({ ...p, [field]: fileUrl }));
      toast.success(`Uploaded to ${folder}/`);
    } catch (err) { toast.error(`Upload error: ${err.message}`); }
    finally { setUploadStatus(p => ({ ...p, [type]: false })); }
  };

  // ── submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim())  { toast.error('Lesson title is required'); return; }
    if (!formData.subject_id)    { toast.error('Please select a subject');  return; }
    if (formData.resource_type === 'video' && !formData.video_url) { toast.error('Please upload a video file'); return; }
    if (formData.resource_type === 'pdf'   && !formData.pdf_url)   { toast.error('Please upload a PDF file');   return; }
    setSubmitting(true);
    try {
      const token   = localStorage.getItem('token');
      const method  = editingLesson ? 'put' : 'post';
      const url     = editingLesson ? `/api/admin/lessons/${editingLesson.id}` : '/api/admin/lessons';
      const payload = {
        title:           formData.title.trim(),
        description:     formData.description || '',
        subject_id:      parseInt(formData.subject_id),
        target_form:     formData.target_form,
        display_order:   parseInt(formData.display_order) || 0,
        resource_type:   formData.resource_type,
        week_number:     parseInt(formData.week_number) || 1,
        is_weekend_exam: !!formData.is_weekend_exam,
        ...(formData.quiz_id ? { quiz_id: parseInt(formData.quiz_id) } : {}),
        ...(formData.resource_type === 'video' ? { video_url: formData.video_url } : { pdf_url: formData.pdf_url }),
      };
      const res = await api[method](url, payload, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.success) {
        toast.success(editingLesson ? 'Lesson updated' : 'Lesson created');
        setShowModal(false);
        setFormData(emptyForm);
        loadDashboardData();
      } else toast.error(res.data.message || 'Failed to save lesson');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save changes'); }
    finally { setSubmitting(false); }
  };

  // ── delete ────────────────────────────────────────────────────────────────
  const handleDeleteLesson = async () => {
    if (!confirmLesson) return;
    try {
      const token = localStorage.getItem('token');
      const res   = await api.delete(`/api/admin/lessons/${confirmLesson.id}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.success) { toast.success('Lesson deleted'); loadDashboardData(); }
      else toast.error(res.data.message || 'Failed to delete');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to delete'); }
    finally { setConfirmLesson(null); }
  };

  // ── open modal ────────────────────────────────────────────────────────────
  const openModal = (lesson = null) => {
    setEditingLesson(lesson);
    setFormData(lesson ? {
      title:           lesson.title           || '',
      description:     lesson.description     || '',
      video_url:       lesson.video_url       || '',
      pdf_url:         lesson.pdf_url         || '',
      subject_id:      lesson.subject_id      || '',
      target_form:     lesson.target_form     || 'All',
      quiz_id:         lesson.quiz_id         || '',
      display_order:   lesson.display_order   || 0,
      resource_type:   lesson.resource_type   || 'video',
      week_number:     lesson.week_number     || 1,
      is_weekend_exam: !!lesson.is_weekend_exam,
    } : emptyForm);
    setShowModal(true);
  };

  // ── grouped resource renderer (mirrors LearningSpace's renderGroupedResources)
  const renderGroupedResources = (items) => {
    if (!items || items.length === 0)
      return <div className="text-center py-10 text-slate-400 text-sm">No content here yet.</div>;

    const grouped = items.reduce((acc, item) => {
      const sub = getSubjectLabel(item.subject_id);
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
              <button
                onClick={() => setExpandedSubjects(p => ({ ...p, [subjectName]: !p[subjectName] }))}
                className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base leading-none">{isExpanded ? '📂' : '📁'}</span>
                  <span className="text-sm font-semibold text-slate-800">{subjectName}</span>
                  <span className="text-[10px] text-slate-400 bg-slate-200 px-1.5 py-0.5 rounded-full">{subjectItems.length}</span>
                </div>
                <ChevronRightIconSolid className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
              </button>

              {isExpanded && (
                <div className="p-3 border-t border-slate-100 space-y-1">
                  {subjectItems.map(item => (
                    <div
                      key={item.id}
                      className="group flex items-center p-3 rounded-lg border border-transparent hover:bg-[#f0faf9] hover:border-[#006770]/20 transition-all"
                    >
                      <div className="mr-3 flex-shrink-0">
                        <ResourceEmoji type={item.resource_type} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-700 truncate">{item.title}</p>
                        {item.description && (
                          <p className="text-[10px] text-slate-400 truncate mt-0.5">{item.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                        {item.is_weekend_exam && (
                          <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded">EXAM</span>
                        )}
                        <span className="px-1.5 py-0.5 bg-[#e0f7fa] text-[#006770] text-[10px] font-semibold rounded">
                          {item.target_form}
                        </span>
                        <button
                          onClick={() => openModal(item)}
                          className="p-1 text-[#006770] hover:bg-[#006770]/10 rounded-lg transition"
                          title="Edit"
                        >
                          <PencilIcon className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setConfirmLesson(item)}
                          className="p-1 text-red-400 hover:bg-red-50 rounded-lg transition"
                          title="Delete"
                        >
                          <TrashIcon className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="w-8 h-8 border-4 border-[#006770] border-t-transparent rounded-full animate-spin" />
      <p className="mt-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Loading lessons…</p>
    </div>
  );

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-5">
        <span className="text-xs text-gray-400 font-medium">
          {lessons.length} lesson{lessons.length !== 1 ? 's' : ''} across {weekGroups.length} week{weekGroups.length !== 1 ? 's' : ''}
        </span>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#006770] text-white rounded-lg text-sm font-medium hover:bg-[#005a62] transition"
        >
          <PlusIcon className="w-4 h-4" /> Add Lesson
        </button>
      </div>

      {/* ── MAIN TREE (mirrors LearningSpace) ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[500px]">

        {/* ── Top nav bar — identical to LearningSpace ── */}
        <div className="flex items-center gap-3 px-4 py-2.5 bg-[#003B46] border-b border-slate-200">
          <button
            onClick={handleBack}
            disabled={!canGoBack}
            className={`p-1.5 rounded-lg transition ${
              canGoBack
                ? 'text-white/70 hover:bg-white/10 hover:text-white'
                : 'text-white/20 cursor-default'
            }`}
          >
            <ChevronLeftIcon className="w-4 h-4" />
          </button>
          <div className="flex-1 flex items-center gap-1.5 text-[11px] font-medium text-white/60 truncate">
            <span className="text-sm flex-shrink-0">📅</span>
            <span className="truncate">{breadcrumb()}</span>
          </div>
        </div>

        {/* ── Content ── */}
        <div className="flex-1 overflow-y-auto bg-[#F5F2EB]">

          {/* ══ LEVEL 1 — Weekly timeline ═══════════════════════════════════ */}
          {activeWeek === null && !activeFolderId && (
            <div className="p-4 space-y-2.5">
              {lessons.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                  <span className="text-5xl mb-3">📅</span>
                  <p className="text-sm font-medium">No lessons yet.</p>
                  <button
                    onClick={() => openModal()}
                    className="mt-2 text-xs text-[#006770] hover:underline"
                  >
                    Add the first lesson →
                  </button>
                </div>
              ) : weekGroups.map(({ week, lessons: wLessons, exams: wExams }) => {
                const isUnscheduled = week === 0;
                const hasExam       = wExams.length > 0;
                const videoCount    = wLessons.filter(l => l.resource_type === 'video').length;
                const pdfCount      = wLessons.filter(l => l.resource_type === 'pdf').length;
                const quizCount     = [...wLessons, ...wExams].filter(l => l.resource_type === 'quiz').length;

                return (
                  <div
                    key={week}
                    onClick={() => setActiveWeek(week)}
                    className="rounded-xl border border-gray-200 bg-white hover:border-[#006770]/40 hover:shadow-sm cursor-pointer overflow-hidden transition-all duration-200"
                  >
                    <div className="flex items-center gap-4 px-4 py-3">
                      {/* Week badge */}
                      <div className="w-11 h-11 rounded-xl flex flex-col items-center justify-center flex-shrink-0 font-black bg-[#006770]/10 text-[#006770]">
                        <span className="text-[8px] font-bold leading-none opacity-70">WK</span>
                        <span className="text-base leading-none">{isUnscheduled ? '?' : week}</span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-[#003B46]">
                            {isUnscheduled ? 'Unscheduled' : `Week ${week}`}
                          </span>
                        </div>
                        {/* Resource chips */}
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
                      </div>

                      <ChevronRightIconSolid className="w-4 h-4 text-gray-300 flex-shrink-0" />
                    </div>

                    {/* Weekend exam preview strip */}
                    {hasExam && (
                      <div className="mx-4 mb-3 flex items-center gap-2.5 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                        <span className="text-base">🏆</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-amber-800 truncate">{wExams[0].title}</p>
                          <p className="text-[10px] text-amber-500">{getSubjectLabel(wExams[0].subject_id)}</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* ══ LEVEL 2 — Week detail: exam card + folder grid ══════════════ */}
          {activeWeek !== null && !activeFolderId && (
            <div className="p-4">
              {/* Weekend exam card */}
              {(() => {
                const wd = weekGroups.find(g => g.week === activeWeek);
                return (wd?.exams || []).map(exam => (
                  <div
                    key={exam.id}
                    className="mb-5 flex items-center gap-3 p-4 bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl"
                  >
                    <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-2xl">🏆</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[9px] font-black text-white/80 uppercase tracking-widest">Weekend Exam</span>
                      <p className="text-sm font-bold text-white truncate">{exam.title}</p>
                      <p className="text-[10px] text-white/70">{getSubjectLabel(exam.subject_id)}</p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => openModal(exam)}
                        className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition"
                        title="Edit"
                      >
                        <PencilIcon className="w-3.5 h-3.5 text-white" />
                      </button>
                      <button
                        onClick={() => setConfirmLesson(exam)}
                        className="p-1.5 bg-white/20 hover:bg-red-500 rounded-lg transition"
                        title="Delete"
                      >
                        <TrashIcon className="w-3.5 h-3.5 text-white" />
                      </button>
                    </div>
                  </div>
                ));
              })()}

              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Learning Materials</p>

              {/* Folder grid — same as LearningSpace */}
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
                    <button onClick={() => openModal()} className="block mx-auto mt-1 text-xs text-[#006770] hover:underline">
                      Add a lesson →
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══ LEVEL 3 — Resource folder contents ══════════════════════════ */}
          {activeFolderId && (
            <div className="p-4">
              {renderGroupedResources(currentFolderItems)}
            </div>
          )}
        </div>
      </div>

      {/* ── Add / Edit Modal ── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
              <div className="flex items-center gap-2">
                <AcademicCapIcon className="w-4 h-4 text-[#006770]" />
                <h3 className="text-sm font-bold text-[#003B46]">
                  {editingLesson ? 'Edit Lesson' : 'Add New Lesson'}
                </h3>
              </div>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded-lg transition">
                <XMarkIcon className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-5 space-y-4">
              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Lesson Title *</label>
                <input type="text" value={formData.title}
                  onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
                  placeholder="Enter lesson title…" className={inp} required autoFocus />
              </div>

              {/* Subject + Form */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Subject *</label>
                  <select value={formData.subject_id}
                    onChange={e => setFormData(p => ({ ...p, subject_id: e.target.value }))}
                    className={inp} required>
                    <option value="">Select subject…</option>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  {subjects.length === 0 && <p className="text-[10px] text-red-500 mt-1">No subjects found.</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Target Form</label>
                  <select value={formData.target_form}
                    onChange={e => setFormData(p => ({ ...p, target_form: e.target.value }))}
                    className={inp}>
                    {['All', 'Form 1', 'Form 2', 'Form 3', 'Form 4'].map(f => <option key={f}>{f}</option>)}
                  </select>
                </div>
              </div>

              {/* Week + Weekend exam */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    <CalendarDaysIcon className="w-3.5 h-3.5 inline mr-1 text-[#006770]" />
                    Week Number *
                  </label>
                  <select value={formData.week_number}
                    onChange={e => setFormData(p => ({ ...p, week_number: parseInt(e.target.value) }))}
                    className={inp}>
                    {WEEKS.map(w => <option key={w} value={w}>Week {w}</option>)}
                  </select>
                </div>
                <div className="flex flex-col justify-end">
                  <label className={`flex items-center gap-3 px-4 py-3 rounded-lg border cursor-pointer transition ${
                    formData.is_weekend_exam
                      ? 'bg-amber-50 border-amber-300'
                      : 'bg-white border-gray-200 hover:border-amber-200'
                  }`}>
                    <input
                      type="checkbox"
                      checked={formData.is_weekend_exam}
                      onChange={e => setFormData(p => ({ ...p, is_weekend_exam: e.target.checked }))}
                      className="w-4 h-4 accent-amber-500 cursor-pointer"
                    />
                    <div>
                      <p className={`text-xs font-semibold ${formData.is_weekend_exam ? 'text-amber-700' : 'text-gray-600'}`}>
                        Weekend Exam
                      </p>
                      <p className="text-[10px] text-gray-400">Shown at end of week</p>
                    </div>
                    <TrophyIcon className={`w-4 h-4 ml-auto ${formData.is_weekend_exam ? 'text-amber-500' : 'text-gray-300'}`} />
                  </label>
                </div>
              </div>

              {/* Resource type */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">Resource Type *</label>
                <div className="flex gap-3 flex-wrap">
                  {[
                    { val: 'video',     Icon: VideoCameraIcon,   label: 'Video'      },
                    { val: 'pdf',       Icon: DocumentTextIcon,  label: 'PDF'        },
                    { val: 'pastpaper', Icon: ArchiveBoxIcon,    label: 'Past Paper' },
                  ].map(({ val, Icon, label }) => (
                    <label key={val} className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition text-sm ${
                      formData.resource_type === val
                        ? 'bg-[#006770]/10 border-[#006770] text-[#006770] font-semibold'
                        : 'border-gray-200 text-gray-500 hover:border-[#006770]/40'
                    }`}>
                      <input type="radio" name="resource_type" value={val}
                        checked={formData.resource_type === val}
                        onChange={e => setFormData(p => ({ ...p, resource_type: e.target.value, video_url: '', pdf_url: '' }))}
                        className="sr-only" />
                      <Icon className="w-4 h-4" /> {label}
                    </label>
                  ))}
                </div>
              </div>

              {/* File upload */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Upload File * <span className="text-gray-400 font-normal">(or paste URL)</span>
                </label>
                <div className="flex gap-2 items-center mb-2">
                  <label className="flex items-center gap-1.5 px-3 py-2 bg-[#006770]/10 text-[#006770] rounded-lg text-xs font-semibold cursor-pointer hover:bg-[#006770]/20 transition">
                    {uploadStatus[formData.resource_type]
                      ? <><div className="w-3.5 h-3.5 border-2 border-[#006770]/30 border-t-[#006770] rounded-full animate-spin" /> Uploading…</>
                      : <><VideoCameraIcon className="w-3.5 h-3.5" /> Choose File</>}
                    <input type="file" className="hidden"
                      accept={formData.resource_type === 'video' ? 'video/*' : '.pdf'}
                      onChange={e => uploadToR2(e.target.files[0], formData.resource_type)} />
                  </label>
                  {formData.subject_id && (
                    <span className="text-[10px] text-[#006770] bg-[#e0f7fa] px-2 py-1 rounded">
                      {formData.resource_type === 'video' ? 'videos' : 'pdfs'}/{getSubjectName(formData.subject_id)}/
                    </span>
                  )}
                </div>
                <input type="text"
                  value={formData.resource_type === 'video' ? formData.video_url : formData.pdf_url}
                  onChange={e => { const f = formData.resource_type === 'video' ? 'video_url' : 'pdf_url'; setFormData(p => ({ ...p, [f]: e.target.value })); }}
                  placeholder="URL auto-filled after upload, or paste manually"
                  className={inp} required />
              </div>

              {/* Optional quiz */}
              {quizzes.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Associated Quiz <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <select value={formData.quiz_id}
                    onChange={e => setFormData(p => ({ ...p, quiz_id: e.target.value }))} className={inp}>
                    <option value="">No quiz</option>
                    {quizzes.map(q => <option key={q.id} value={q.id}>{q.title}</option>)}
                  </select>
                </div>
              )}

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Description <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <textarea value={formData.description}
                  onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                  rows={2} placeholder="Brief description…" className={inp} />
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold text-gray-500">Order</label>
                  <input type="number" value={formData.display_order}
                    onChange={e => setFormData(p => ({ ...p, display_order: parseInt(e.target.value) || 0 }))}
                    className="w-16 px-2 py-1.5 border border-gray-200 rounded-lg text-sm text-center focus:outline-none focus:ring-1 focus:ring-[#00B4D8]" />
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setShowModal(false)}
                    className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition">
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting || subjects.length === 0}
                    className="px-5 py-2 bg-[#006770] text-white rounded-lg text-sm font-semibold hover:bg-[#005a62] transition disabled:opacity-50 flex items-center gap-2">
                    {submitting && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                    {editingLesson ? 'Update Lesson' : 'Create Lesson'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete confirmation ── */}
      {confirmLesson && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
            <div className="bg-red-500 px-5 py-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                <ExclamationTriangleIcon className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-sm font-bold text-white">Delete Lesson</h3>
            </div>
            <div className="px-5 py-4">
              <p className="text-xs text-gray-500 mb-2">You are about to permanently delete:</p>
              <p className="text-sm font-semibold text-[#003B46] bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 break-words">
                "{confirmLesson.title}"
              </p>
              <p className="text-xs text-red-500 mt-3 flex items-center gap-1.5">
                <ExclamationTriangleIcon className="w-3.5 h-3.5 flex-shrink-0" />
                This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-2 px-5 pb-5">
              <button
                onClick={() => setConfirmLesson(null)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteLesson}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-semibold transition shadow-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LessonManagement;
