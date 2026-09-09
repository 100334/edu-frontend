import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeftIcon } from '@heroicons/react/24/solid';
import { XMarkIcon } from '@heroicons/react/24/outline';
import api from '../services/api';
import toast from 'react-hot-toast';

// ── Resource-type folder metadata ───────────────────────────────────────────
const RESOURCE_TYPES = [
  { id: 'video',     label: 'Videos',      emoji: '🎬' },
  { id: 'pdf',       label: 'Notes',       emoji: '📄' },
  { id: 'quiz',      label: 'Assessments', emoji: '📝' },
  { id: 'pastpaper', label: 'Past Papers', emoji: '🗂️' },
];
const typeMeta = (id) => RESOURCE_TYPES.find(t => t.id === id) || { label: 'Other', emoji: '📁' };

/**
 * Library — a simple, read-only, flat browsing space for ALL lesson
 * resources, organized as Subject → resource type. Unlike the Learning
 * Space, there is no week progression, deadlines, or quiz-taking stepper —
 * just folders you can open to view or download files.
 * Used by both the Learner and Teacher dashboards.
 */
const Library = () => {
  const [loading, setLoading] = useState(true);
  const [lessons, setLessons] = useState([]);

  const [activeSubject, setActiveSubject] = useState(null);   // subject name
  const [activeType, setActiveType] = useState(null);         // resource type id

  const [viewerSrc, setViewerSrc] = useState(null);
  const [viewerTitle, setViewerTitle] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const res = await api.get('/api/library/lessons', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data.success) setLessons(res.data.lessons || []);
      } catch (err) {
        toast.error('Could not load the Library.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // ── Group lessons by subject ────────────────────────────────────────────
  const subjectGroups = useMemo(() => {
    const map = {};
    lessons.forEach(l => {
      const name = l.subject_name || 'Unassigned';
      if (!map[name]) map[name] = [];
      map[name].push(l);
    });
    return Object.entries(map)
      .map(([name, items]) => ({ name, items }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [lessons]);

  const lessonsInSubject = useMemo(() => {
    if (!activeSubject) return [];
    return lessons.filter(l => (l.subject_name || 'Unassigned') === activeSubject);
  }, [lessons, activeSubject]);

  const typeGroups = useMemo(() => {
    const map = {};
    lessonsInSubject.forEach(l => {
      const t = l.resource_type || 'other';
      if (!map[t]) map[t] = [];
      map[t].push(l);
    });
    return RESOURCE_TYPES
      .map(t => ({ ...t, items: map[t.id] || [] }))
      .filter(t => t.items.length > 0);
  }, [lessonsInSubject]);

  const lessonsInType = useMemo(() => {
    if (!activeType) return [];
    return lessonsInSubject.filter(l => (l.resource_type || 'other') === activeType);
  }, [lessonsInSubject, activeType]);

  // ── Navigation ───────────────────────────────────────────────────────────
  const canGoBack = !!(activeSubject || activeType);
  const goBack = () => {
    if (activeType) return setActiveType(null);
    if (activeSubject) return setActiveSubject(null);
  };
  const breadcrumb = () => {
    const p = ['Library'];
    if (activeSubject) p.push(activeSubject);
    if (activeType) p.push(typeMeta(activeType).label);
    return p.join(' › ');
  };

  const openFile = (lesson) => {
    const src = lesson.video_url || lesson.pdf_url;
    if (!src) {
      toast.error('No file attached to this resource.');
      return;
    }
    setViewerSrc(src);
    setViewerTitle(lesson.title || 'Resource');
  };

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
          <span className="flex-shrink-0">📚</span>
          <span className="truncate">{breadcrumb()}</span>
        </div>
      </div>

      <div className="flex-1 p-5 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-64 text-slate-400 text-sm">Loading library…</div>
        ) : lessons.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-slate-400 text-sm">No lessons have been uploaded yet.</div>

        ) : !activeSubject ? (
          /* ── LEVEL 0: Subject folders ── */
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {subjectGroups.map(group => (
              <button
                key={group.name}
                onClick={() => setActiveSubject(group.name)}
                className="flex flex-col items-center gap-2 p-5 rounded-xl border border-slate-200 hover:border-[#003B46] hover:shadow-md transition bg-slate-50 hover:bg-white"
              >
                <span className="text-3xl">📁</span>
                <span className="text-sm font-semibold text-slate-700 text-center">{group.name}</span>
                <span className="text-[11px] text-slate-400">{group.items.length} item{group.items.length !== 1 ? 's' : ''}</span>
              </button>
            ))}
          </div>

        ) : !activeType ? (
          /* ── LEVEL 1: Resource-type folders within a subject ── */
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {typeGroups.map(t => (
              <button
                key={t.id}
                onClick={() => setActiveType(t.id)}
                className="flex flex-col items-center gap-2 p-5 rounded-xl border border-slate-200 hover:border-[#003B46] hover:shadow-md transition bg-slate-50 hover:bg-white"
              >
                <span className="text-3xl">{t.emoji}</span>
                <span className="text-sm font-semibold text-slate-700 text-center">{t.label}</span>
                <span className="text-[11px] text-slate-400">{t.items.length} item{t.items.length !== 1 ? 's' : ''}</span>
              </button>
            ))}
          </div>

        ) : (
          /* ── LEVEL 2: Files within a resource type ── */
          <div className="flex flex-col gap-2">
            {lessonsInType.map(lesson => {
              const src = lesson.video_url || lesson.pdf_url;
              return (
                <div
                  key={lesson.id}
                  className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-[#003B46] transition bg-slate-50 hover:bg-white"
                >
                  <span className="text-xl flex-shrink-0">{typeMeta(activeType).emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-700 truncate">{lesson.title || 'Untitled resource'}</p>
                    {lesson.week_number ? (
                      <p className="text-[11px] text-slate-400">Week {lesson.week_number}</p>
                    ) : null}
                  </div>
                  <button
                    onClick={() => openFile(lesson)}
                    disabled={!src}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#003B46] text-white hover:bg-[#00505e] disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0"
                  >
                    View
                  </button>
                  {src && (
                    <a
                      href={src}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 flex-shrink-0"
                    >
                      ⬇
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Full-screen viewer modal ── */}
      {viewerSrc && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 sm:p-8">
          <div className="w-full h-full max-w-4xl max-h-[85vh] bg-black rounded-xl overflow-hidden shadow-2xl flex flex-col">
            <div className="flex items-center gap-3 px-4 py-3 bg-[#003B46] flex-shrink-0">
              <span className="text-sm font-medium text-white truncate flex-1">{viewerTitle}</span>
              <a
                href={viewerSrc}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold transition flex-shrink-0"
              >
                ⬇ Download
              </a>
              <button
                onClick={() => setViewerSrc(null)}
                className="w-7 h-7 rounded-lg bg-white/10 hover:bg-red-500 flex items-center justify-center transition flex-shrink-0"
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
        </div>
      )}
    </div>
  );
};

export default Library;
