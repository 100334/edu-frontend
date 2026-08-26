import React, { useState, useEffect, useCallback } from 'react';
import {
  PlusIcon, PencilIcon, TrashIcon, XMarkIcon,
  VideoCameraIcon, DocumentIcon,
  AcademicCapIcon, BookOpenIcon, FolderIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import api from '../../services/api';

// ── shared input style ────────────────────────────────────────────────────────
const inp = 'w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#00B4D8] focus:border-[#00B4D8] transition';

const LessonManagement = () => {
  const [lessons,       setLessons]       = useState([]);
  const [subjects,      setSubjects]      = useState([]);
  const [quizzes,       setQuizzes]       = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [showModal,     setShowModal]     = useState(false);
  const [editingLesson, setEditingLesson] = useState(null);
  const [submitting,    setSubmitting]    = useState(false);
  const [uploadStatus,  setUploadStatus]  = useState({ video: false, pdf: false });

  const emptyForm = {
    title: '', description: '', video_url: '', pdf_url: '',
    subject_id: '', target_form: 'All', quiz_id: '',
    display_order: 0, resource_type: 'video',
  };
  const [formData, setFormData] = useState(emptyForm);

  // ── data loading ────────────────────────────────────────────────────────────
  const loadSubjects = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await api.get('/api/admin/quiz-subjects', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        // Deduplicate by name — keep first occurrence of each unique subject name
        const raw = res.data.subjects || [];
        const seen = new Set();
        const unique = raw.filter(s => {
          const key = s.name?.trim().toLowerCase();
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        setSubjects(unique);
      } else setSubjects([]);
    } catch { setSubjects([]); }
  };

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const auth = { headers: { Authorization: `Bearer ${token}` } };
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

  // ── helpers ─────────────────────────────────────────────────────────────────
  const getSubjectName = (subjectId) => {
    const s = subjects.find(s => String(s.id) === String(subjectId));
    return s ? s.name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '') : 'uncategorized';
  };

  const getSubjectLabel = (subjectId) => {
    const s = subjects.find(s => String(s.id) === String(subjectId));
    return s?.name || 'General';
  };

  // ── upload ──────────────────────────────────────────────────────────────────
  const uploadToR2 = async (file, type) => {
    if (!file) return;
    if (!formData.subject_id) { toast.error('Select a subject first before uploading.'); return; }
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

  // ── submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim())                              { toast.error('Lesson title is required'); return; }
    if (!formData.subject_id)                                { toast.error('Please select a subject');  return; }
    if (formData.resource_type === 'video' && !formData.video_url) { toast.error('Please upload a video file'); return; }
    if (formData.resource_type === 'pdf'   && !formData.pdf_url)   { toast.error('Please upload a PDF file');   return; }

    setSubmitting(true);
    try {
      const token   = localStorage.getItem('token');
      const method  = editingLesson ? 'put' : 'post';
      const url     = editingLesson ? `/api/admin/lessons/${editingLesson.id}` : '/api/admin/lessons';
      const payload = {
        title:         formData.title.trim(),
        description:   formData.description || '',
        subject_id:    parseInt(formData.subject_id),
        target_form:   formData.target_form,
        display_order: parseInt(formData.display_order) || 0,
        resource_type: formData.resource_type,
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

  // ── delete ──────────────────────────────────────────────────────────────────
  const handleDeleteLesson = async (lesson) => {
    if (!window.confirm(`Delete "${lesson.title}"? This cannot be undone.`)) return;
    try {
      const token = localStorage.getItem('token');
      const res   = await api.delete(`/api/admin/lessons/${lesson.id}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.success) { toast.success('Lesson deleted'); loadDashboardData(); }
      else toast.error(res.data.message || 'Failed to delete');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to delete'); }
  };

  // ── open modal ──────────────────────────────────────────────────────────────
  const openModal = (lesson = null) => {
    setEditingLesson(lesson);
    setFormData(lesson ? {
      title:         lesson.title         || '',
      description:   lesson.description   || '',
      video_url:     lesson.video_url     || '',
      pdf_url:       lesson.pdf_url       || '',
      subject_id:    lesson.subject_id    || '',
      target_form:   lesson.target_form   || 'All',
      quiz_id:       lesson.quiz_id       || '',
      display_order: lesson.display_order || 0,
      resource_type: lesson.resource_type || 'video',
    } : emptyForm);
    setShowModal(true);
  };

  // ── loading ─────────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="w-8 h-8 border-4 border-[#006770] border-t-transparent rounded-full animate-spin" />
      <p className="mt-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Loading lessons…</p>
    </div>
  );

  // ── render ──────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-5">
        <span className="text-xs text-gray-400 font-medium">
          {lessons.length} lesson{lessons.length !== 1 ? 's' : ''}
        </span>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#006770] text-white rounded-lg text-sm font-medium hover:bg-[#005a62] transition"
        >
          <PlusIcon className="w-4 h-4" /> Add Lesson
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px]">
            <thead className="bg-gray-50">
              <tr>
                {['#', 'Lesson', 'Subject', 'Form', 'Type', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {lessons.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <BookOpenIcon className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">No lessons yet.</p>
                    <button onClick={() => openModal()} className="mt-1 text-xs text-[#006770] hover:underline">
                      Add the first lesson →
                    </button>
                  </td>
                </tr>
              ) : lessons.map(lesson => (
                <tr key={lesson.id} className="hover:bg-[#f0faf9] transition-colors">
                  <td className="px-4 py-3 text-xs font-bold text-gray-300">#{lesson.display_order}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-[#006770]/10 flex items-center justify-center flex-shrink-0">
                        {lesson.resource_type === 'video'
                          ? <VideoCameraIcon className="w-4 h-4 text-[#006770]" />
                          : <DocumentIcon    className="w-4 h-4 text-[#006770]" />}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#003B46]">{lesson.title}</p>
                        {lesson.description && (
                          <p className="text-[10px] text-gray-400 line-clamp-1">{lesson.description}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <FolderIcon className="w-3.5 h-3.5 text-[#00B4D8]" />
                      {getSubjectLabel(lesson.subject_id)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 bg-[#e0f7fa] text-[#006770] text-[10px] font-semibold rounded">
                      {lesson.target_form}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      lesson.resource_type === 'video'
                        ? 'bg-purple-50 text-purple-600'
                        : 'bg-green-50 text-green-600'
                    }`}>
                      {lesson.resource_type === 'video' ? 'Video' : 'PDF'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openModal(lesson)}
                        className="p-1.5 text-[#006770] hover:bg-[#006770]/10 rounded-lg transition" title="Edit">
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDeleteLesson(lesson)}
                        className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition" title="Delete">
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">

            {/* Modal header */}
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

            {/* Modal form */}
            <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-5 space-y-4">

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Lesson Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
                  placeholder="Enter lesson title…"
                  className={inp}
                  required
                  autoFocus
                />
              </div>

              {/* Subject + Form row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Subject *</label>
                  <select
                    value={formData.subject_id}
                    onChange={e => setFormData(p => ({ ...p, subject_id: e.target.value }))}
                    className={inp}
                    required
                  >
                    <option value="">Select subject…</option>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  {subjects.length === 0 && (
                    <p className="text-[10px] text-red-500 mt-1">No subjects found. Create one in Quiz Management first.</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Target Form</label>
                  <select
                    value={formData.target_form}
                    onChange={e => setFormData(p => ({ ...p, target_form: e.target.value }))}
                    className={inp}
                  >
                    {['All', 'Form 1', 'Form 2', 'Form 3', 'Form 4'].map(f => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Resource type */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">Resource Type *</label>
                <div className="flex gap-4">
                  {[{ val: 'video', Icon: VideoCameraIcon, label: 'Video' }, { val: 'pdf', Icon: DocumentIcon, label: 'PDF' }, { val: 'pastpaper', Icon: DocumentIcon, label: 'Past Paper' }].map(({ val, Icon, label }) => (
                    <label key={val} className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition text-sm ${
                      formData.resource_type === val
                        ? 'bg-[#006770]/10 border-[#006770] text-[#006770] font-semibold'
                        : 'border-gray-200 text-gray-500 hover:border-[#006770]/40'
                    }`}>
                      <input
                        type="radio" name="resource_type" value={val}
                        checked={formData.resource_type === val}
                        onChange={e => setFormData(p => ({ ...p, resource_type: e.target.value, video_url: '', pdf_url: '' }))}
                        className="sr-only"
                      />
                      <Icon className="w-4 h-4" /> {label}
                    </label>
                  ))}
                </div>
              </div>

              {/* File upload */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Upload File * <span className="text-gray-400 font-normal">(or paste URL below)</span>
                </label>
                <div className="flex gap-2 items-center mb-2">
                  <label className="flex items-center gap-1.5 px-3 py-2 bg-[#006770]/10 text-[#006770] rounded-lg text-xs font-semibold cursor-pointer hover:bg-[#006770]/20 transition">
                    {uploadStatus[formData.resource_type] ? (
                      <><div className="w-3.5 h-3.5 border-2 border-[#006770]/30 border-t-[#006770] rounded-full animate-spin" /> Uploading…</>
                    ) : (
                      <><VideoCameraIcon className="w-3.5 h-3.5" /> Choose File</>
                    )}
                    <input
                      type="file"
                      className="hidden"
                      accept={formData.resource_type === 'video' ? 'video/*' : '.pdf'}
                      onChange={e => uploadToR2(e.target.files[0], formData.resource_type)}
                    />
                  </label>
                  {formData.subject_id && (
                    <span className="text-[10px] text-[#006770] bg-[#e0f7fa] px-2 py-1 rounded">
                      {formData.resource_type === 'video' ? 'videos' : 'pdfs'}/{getSubjectName(formData.subject_id)}/
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  value={formData.resource_type === 'video' ? formData.video_url : formData.pdf_url}
                  onChange={e => {
                    const field = formData.resource_type === 'video' ? 'video_url' : 'pdf_url';
                    setFormData(p => ({ ...p, [field]: e.target.value }));
                  }}
                  placeholder="File URL (auto-filled after upload, or paste manually)"
                  className={inp}
                  required
                />
              </div>

              {/* Optional quiz */}
              {quizzes.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Associated Quiz <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <select
                    value={formData.quiz_id}
                    onChange={e => setFormData(p => ({ ...p, quiz_id: e.target.value }))}
                    className={inp}
                  >
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
                <textarea
                  value={formData.description}
                  onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                  rows={3}
                  placeholder="Brief description of this lesson…"
                  className={inp}
                />
              </div>

              {/* Display order + actions */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold text-gray-500">Display Order</label>
                  <input
                    type="number"
                    value={formData.display_order}
                    onChange={e => setFormData(p => ({ ...p, display_order: parseInt(e.target.value) || 0 }))}
                    className="w-16 px-2 py-1.5 border border-gray-200 rounded-lg text-sm text-center focus:outline-none focus:ring-1 focus:ring-[#00B4D8] focus:border-[#00B4D8]"
                  />
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setShowModal(false)}
                    className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition">
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || subjects.length === 0}
                    className="px-5 py-2 bg-[#006770] text-white rounded-lg text-sm font-semibold hover:bg-[#005a62] transition disabled:opacity-50 flex items-center gap-2"
                  >
                    {submitting && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                    {editingLesson ? 'Update Lesson' : 'Create Lesson'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LessonManagement;
