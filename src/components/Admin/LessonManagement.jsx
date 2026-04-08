import React, { useState, useEffect, useCallback } from 'react';
import { 
  PlusIcon, PencilIcon, TrashIcon, XMarkIcon, 
  VideoCameraIcon, DocumentIcon, ArrowsUpDownIcon,
  AcademicCapIcon, BookOpenIcon, CloudArrowUpIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import api from '../../services/api';

const LessonManagement = () => {
  const [lessons, setLessons] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingLesson, setEditingLesson] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadStatus, setUploadStatus] = useState({ video: false, pdf: false });

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    video_url: '',
    pdf_url: '',
    subject_id: '',
    target_form: 'All',
    quiz_id: '',
    display_order: 0
  });

  // Consolidated data loader
  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const authHeader = { headers: { Authorization: `Bearer ${token}` } };

      const [lessonsRes, subjectsRes, quizzesRes] = await Promise.all([
        api.get('/api/admin/lessons', authHeader),
        api.get('/api/admin/subjects/all', authHeader),
        api.get('/api/admin/quizzes', authHeader)
      ]);

      if (lessonsRes.data.success) setLessons(lessonsRes.data.lessons);
      if (subjectsRes.data.success) {
        console.log("Fetched Subjects:", subjectsRes.data.subjects);
        setSubjects(subjectsRes.data.subjects || []);
      }
      if (quizzesRes.data.success) setQuizzes(quizzesRes.data.quizzes || []);
    } catch (error) {
      console.error("Dashboard Load Error:", error);
      toast.error('Sync failed. Check database connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const uploadToR2 = async (file, type) => {
    setUploadStatus(prev => ({ ...prev, [type]: true }));
    try {
      const token = localStorage.getItem('token');
      const { data } = await api.post('/api/admin/r2-upload-url', {
        filename: file.name,
        filetype: file.type,
      }, { headers: { Authorization: `Bearer ${token}` } });

      if (!data.success) throw new Error();

      const upload = await fetch(data.uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      });

      if (!upload.ok) throw new Error();
      
      setFormData(prev => ({ ...prev, [`${type}_url`]: data.publicUrl }));
      toast.success(`${type.toUpperCase()} uploaded to storage`);
    } catch (err) {
      toast.error(`Cloudflare R2 Upload failed`);
    } finally {
      setUploadStatus(prev => ({ ...prev, [type]: false }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const method = editingLesson ? 'put' : 'post';
      const url = editingLesson ? `/api/admin/lessons/${editingLesson.id}` : '/api/admin/lessons';
      
      const submissionData = {
        ...formData,
        subject_id: formData.subject_id ? parseInt(formData.subject_id) : null,
        quiz_id: formData.quiz_id ? parseInt(formData.quiz_id) : null
      };

      const res = await api[method](url, submissionData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        toast.success(editingLesson ? 'Lesson Updated' : 'Lesson Published');
        setShowModal(false);
        loadDashboardData();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save lesson');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col h-96 items-center justify-center space-y-4">
      <div className="w-12 h-12 border-4 border-azure border-t-transparent rounded-full animate-spin"></div>
      <p className="text-xs font-black text-ink uppercase tracking-widest">Loading Library...</p>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto pb-12 px-4 space-y-8 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-ink tracking-tight">Lesson Library</h1>
          <p className="text-muted font-medium">Curate digital content for Progress Secondary students</p>
        </div>
        <button 
          onClick={() => { 
            setEditingLesson(null); 
            setFormData({ title: '', description: '', video_url: '', pdf_url: '', subject_id: '', target_form: 'All', quiz_id: '', display_order: 0 }); 
            setShowModal(true); 
          }}
          className="btn-azure px-8 py-4 rounded-2xl flex items-center gap-2 group hover:scale-[1.02] transition-all"
        >
          <PlusIcon className="w-5 h-5 group-hover:rotate-90 transition-transform" />
          <span className="font-bold">Add Lesson</span>
        </button>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-[2rem] border border-border overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-ice/30 border-b border-border">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-muted tracking-widest text-center w-20">Order</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-muted tracking-widest">Lesson Detail</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-muted tracking-widest">Scope</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-muted tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {lessons.map((lesson) => (
                <tr key={lesson.id} className="group hover:bg-ice/10 transition-colors">
                  <td className="px-6 py-4 text-center">
                    <span className="text-xs font-black text-ink bg-white border border-border px-3 py-1 rounded-lg">#{lesson.display_order}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-ink group-hover:text-azure transition-colors text-lg">{lesson.title}</span>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[10px] font-black text-muted uppercase tracking-tighter bg-ice px-2 rounded">{lesson.subject_name || 'General'}</span>
                        {lesson.video_url && <VideoCameraIcon className="w-4 h-4 text-azure" />}
                        {lesson.pdf_url && <DocumentIcon className="w-4 h-4 text-green" />}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[10px] font-black bg-ink text-white px-3 py-1 rounded-full uppercase">{lesson.target_form}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => { setEditingLesson(lesson); setFormData({...lesson}); setShowModal(true); }} className="p-2 hover:bg-azure/10 text-muted hover:text-azure rounded-xl transition-all">
                        <PencilIcon className="w-5 h-5" />
                      </button>
                      <button onClick={async () => { if(window.confirm('Remove this lesson?')) { await api.delete(`/api/admin/lessons/${lesson.id}`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }); loadDashboardData(); } }} className="p-2 hover:bg-red-50 text-muted hover:text-red-500 rounded-xl transition-all">
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {lessons.length === 0 && (
            <div className="py-24 text-center">
              <BookOpenIcon className="w-16 h-16 text-slate-100 mx-auto mb-4" />
              <p className="text-muted font-bold">The library is currently empty.</p>
            </div>
          )}
        </div>
      </div>

      {/* Editor Modal – with Navy Blue Header & Azure Bordered Inputs */}
      {showModal && (
        <div className="fixed inset-0 bg-ink/50 backdrop-blur-sm flex items-center justify-center z-50 p-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col scale-in-center">
            {/* Header: Navy Blue background */}
            <div className="p-8 border-b border-azure/20 flex justify-between items-center" style={{ background: '#0A192F' }}>
              <h3 className="text-2xl font-black text-white">{editingLesson ? 'Refine Lesson' : 'Create New Lesson'}</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <XMarkIcon className="w-6 h-6 text-white" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-8 overflow-y-auto custom-scrollbar">
              {/* Title & Description */}
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Lesson Title (e.g. Photosynthesis Part 1)"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full text-2xl font-bold border-2 border-gray-200 rounded-xl focus:border-azure focus:ring-0 p-3 placeholder:text-slate-300"
                  required
                />
                <textarea
                  placeholder="Provide a summary of the lesson content..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full text-sm text-muted border-2 border-gray-200 rounded-xl focus:border-azure focus:ring-0 p-3 placeholder:text-slate-300 resize-none"
                  rows={2}
                />
              </div>

              {/* Subject & Target Form */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted">Subject</label>
                  <select 
                    value={formData.subject_id || ""} 
                    onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })} 
                    className="w-full bg-white border-2 border-gray-200 rounded-xl font-bold text-ink text-sm py-3 px-4 focus:border-azure focus:ring-0 transition-all cursor-pointer"
                  >
                    <option value="">No Subject Linked</option>
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>{s.name || s.subject_name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted">Target Form</label>
                  <select value={formData.target_form} onChange={(e) => setFormData({ ...formData, target_form: e.target.value })} className="w-full bg-white border-2 border-gray-200 rounded-xl font-bold text-ink text-sm py-3 px-4 focus:border-azure focus:ring-0 transition-all cursor-pointer">
                    {['All', 'Form 1', 'Form 2', 'Form 3', 'Form 4'].map(f => <option key={f}>{f}</option>)}
                  </select>
                </div>
              </div>

              {/* Resource Management */}
              <div className="space-y-4 pt-4 border-t border-border/50">
                <label className="text-[10px] font-black uppercase tracking-widest text-azure flex items-center gap-2">
                  <CloudArrowUpIcon className="w-4 h-4" /> Cloud Learning Materials
                </label>
                
                <div className="grid gap-4">
                  <div className="p-6 rounded-3xl bg-ice/30 border border-border/50 group">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-xs font-black uppercase text-ink flex items-center gap-2"><VideoCameraIcon className="w-4 h-4" /> Video Content</span>
                      <label className="cursor-pointer text-xs font-black text-azure hover:underline">
                        {uploadStatus.video ? 'Uploading...' : 'Upload Video to R2'}
                        <input type="file" className="hidden" accept="video/*" onChange={(e) => uploadToR2(e.target.files[0], 'video')} />
                      </label>
                    </div>
                    <input type="text" placeholder="YouTube or R2 Public URL" value={formData.video_url} onChange={(e) => setFormData({ ...formData, video_url: e.target.value })} className="w-full bg-white border-2 border-gray-200 rounded-xl text-xs py-3 px-4 focus:border-azure focus:ring-0" />
                  </div>

                  <div className="p-6 rounded-3xl bg-ice/30 border border-border/50 group">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-xs font-black uppercase text-ink flex items-center gap-2"><DocumentIcon className="w-4 h-4" /> PDF Study Notes</span>
                      <label className="cursor-pointer text-xs font-black text-azure hover:underline">
                        {uploadStatus.pdf ? 'Uploading...' : 'Upload PDF to R2'}
                        <input type="file" className="hidden" accept="application/pdf" onChange={(e) => uploadToR2(e.target.files[0], 'pdf')} />
                      </label>
                    </div>
                    <input type="text" placeholder="PDF Public URL" value={formData.pdf_url} onChange={(e) => setFormData({ ...formData, pdf_url: e.target.value })} className="w-full bg-white border-2 border-gray-200 rounded-xl text-xs py-3 px-4 focus:border-azure focus:ring-0" />
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-between pt-6 border-t border-border">
                <div className="flex flex-col">
                   <label className="text-[10px] font-black uppercase text-muted tracking-widest">Display Priority</label>
                   <input type="number" value={formData.display_order} onChange={(e) => setFormData({...formData, display_order: parseInt(e.target.value) || 0})} className="w-16 bg-transparent border-b-2 border-gray-200 text-2xl font-black p-0 focus:border-azure focus:ring-0 text-ink" />
                </div>
                <div className="flex gap-4">
                  <button type="button" onClick={() => setShowModal(false)} className="px-6 py-3 font-bold text-muted hover:text-ink transition-colors">Discard</button>
                  <button type="submit" disabled={submitting} className="btn-azure px-12 py-3 rounded-2xl shadow-xl shadow-azure/20 flex items-center gap-3">
                    {submitting && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                    <span className="font-bold">{editingLesson ? 'Save Changes' : 'Publish Lesson'}</span>
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