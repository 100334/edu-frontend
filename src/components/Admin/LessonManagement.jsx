import React, { useState, useEffect, useCallback } from 'react';
import { 
  PlusIcon, PencilIcon, TrashIcon, XMarkIcon, 
  VideoCameraIcon, DocumentIcon,
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
    display_order: 0,
    resource_type: 'video'
  });

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
      if (subjectsRes.data.success) setSubjects(subjectsRes.data.subjects || []);
      if (quizzesRes.data.success) setQuizzes(quizzesRes.data.quizzes || []);
    } catch (error) {
      toast.error('Sync failed');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadDashboardData(); }, [loadDashboardData]);

  const uploadToR2 = async (file, type) => {
    if (!file) return;
    setUploadStatus(prev => ({ ...prev, [type]: true }));
    try {
      const token = localStorage.getItem('token');
      const folder = formData.resource_type === 'video' ? 'videos' : 'pdfs';
      const { data } = await api.post('/api/admin/r2-upload-url', {
        fileName: file.name,
        fileType: file.type,
        folder: folder,
      }, { headers: { Authorization: `Bearer ${token}` } });

      const upload = await fetch(data.uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      });

      if (!upload.ok) throw new Error('Upload failed');
      const fileUrl = data.fileUrl || data.publicUrl || data.url;
      const urlField = formData.resource_type === 'video' ? 'video_url' : 'pdf_url';
      setFormData(prev => ({ ...prev, [urlField]: fileUrl }));
      toast.success(`${type.toUpperCase()} uploaded to ${folder}/`);
    } catch (err) {
      toast.error(`Upload error: ${err.message}`);
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
      
      const payload = {
        title: formData.title,
        description: formData.description,
        subject_id: formData.subject_id ? parseInt(formData.subject_id) : null,
        target_form: formData.target_form,
        display_order: parseInt(formData.display_order) || 0,
        resource_type: formData.resource_type,
        quiz_id: formData.quiz_id || null,
      };
      if (formData.resource_type === 'video') {
        payload.video_url = formData.video_url;
      } else {
        payload.pdf_url = formData.pdf_url;
      }

      const res = await api[method](url, payload, { headers: { Authorization: `Bearer ${token}` } });

      if (res.data.success) {
        toast.success(editingLesson ? 'Lesson Refined' : 'Lesson Published');
        setShowModal(false);
        loadDashboardData();
      }
    } catch (error) {
      toast.error('Failed to save changes');
    } finally {
      setSubmitting(false);
    }
  };

  // 🗑️ DELETE LESSON FUNCTION
  const handleDeleteLesson = async (lesson) => {
    if (!window.confirm(`Delete "${lesson.title}" permanently? This action cannot be undone.`)) return;
    try {
      const token = localStorage.getItem('token');
      const response = await api.delete(`/api/admin/lessons/${lesson.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        toast.success('Lesson deleted successfully');
        loadDashboardData(); // refresh the list
      } else {
        toast.error(response.data.message || 'Failed to delete lesson');
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to delete lesson');
    }
  };

  const openModal = (lesson = null) => {
    if (lesson) {
      setEditingLesson(lesson);
      setFormData({
        title: lesson.title || '',
        description: lesson.description || '',
        video_url: lesson.video_url || '',
        pdf_url: lesson.pdf_url || '',
        subject_id: lesson.subject_id || '',
        target_form: lesson.target_form || 'All',
        quiz_id: lesson.quiz_id || '',
        display_order: lesson.display_order || 0,
        resource_type: lesson.resource_type || 'video'
      });
    } else {
      setEditingLesson(null);
      setFormData({
        title: '',
        description: '',
        video_url: '',
        pdf_url: '',
        subject_id: '',
        target_form: 'All',
        quiz_id: '',
        display_order: 0,
        resource_type: 'video'
      });
    }
    setShowModal(true);
  };

  if (loading) return (
    <div className="flex flex-col h-screen items-center justify-center bg-[#FDFDFD]">
      <div className="w-12 h-12 border-4 border-azure/20 border-t-azure rounded-full animate-spin"></div>
      <p className="mt-4 text-xs font-bold text-slate-400 tracking-widest uppercase">Loading Modules...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FDFDFD] font-sans text-slate-900">
      {/* Header Bar */}
      <div className="bg-gradient-to-r from-[#001F3F] to-[#007FFF] px-8 py-10 shadow-lg">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Lesson Management</h1>
            <p className="text-white/70 text-sm mt-1 font-medium">Configure your digital curriculum and assets</p>
          </div>
          <button 
            onClick={() => openModal()}
            className="bg-white text-[#007FFF] hover:bg-slate-50 px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-md active:scale-95"
          >
            <PlusIcon className="w-5 h-5" /> Add New Module
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-8">
        <div className="bg-white rounded-2xl border border-[#D4AF37]/30 shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-[11px] font-bold uppercase text-slate-500 tracking-wider w-20 text-center">Order</th>
                <th className="px-6 py-4 text-[11px] font-bold uppercase text-slate-500 tracking-wider">Lesson Detail</th>
                <th className="px-6 py-4 text-[11px] font-bold uppercase text-slate-500 tracking-wider">Scope</th>
                <th className="px-6 py-4 text-[11px] font-bold uppercase text-slate-500 tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {lessons.map((lesson) => (
                <tr key={lesson.id} className="hover:bg-azure/5 transition-colors group">
                  <td className="px-6 py-4 text-center">
                    <span className="text-sm font-bold text-[#D4AF37]">#{lesson.display_order}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-azure/10 flex items-center justify-center text-azure">
                        {lesson.resource_type === 'video' ? <VideoCameraIcon className="w-5 h-5" /> : <DocumentIcon className="w-5 h-5" />}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">{lesson.title}</p>
                        <p className="text-xs text-slate-400 font-medium">{lesson.subject?.name || 'General'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 rounded-full text-[10px] font-black bg-white border border-[#D4AF37] text-[#D4AF37] uppercase">
                      {lesson.target_form}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => openModal(lesson)} className="p-2 text-slate-400 hover:text-azure transition-colors">
                      <PencilIcon className="w-5 h-5" />
                    </button>
                    <button onClick={() => handleDeleteLesson(lesson)} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Editor Modal (unchanged) */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl border border-[#D4AF37]/20 flex flex-col overflow-hidden animate-in zoom-in-95">
            
            <div className="bg-gradient-to-r from-[#001F3F] to-[#007FFF] p-6 flex justify-between items-center">
              <h3 className="text-lg font-bold text-white flex items-center gap-3">
                <AcademicCapIcon className="w-6 h-6" /> {editingLesson ? 'Refine Module' : 'Create New Module'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-white/80 hover:text-white transition-colors">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto max-h-[80vh]">
              <div className="space-y-4">
                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase ml-1 mb-1 block">Lesson Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full bg-white border-2 border-azure/30 rounded-xl px-4 py-3 text-slate-800 font-bold focus:border-azure focus:ring-2 focus:ring-azure/10 outline-none transition-all"
                    placeholder="Enter title..."
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase ml-1 mb-1 block">Subject Category</label>
                    <select 
                      value={formData.subject_id}
                      onChange={(e) => setFormData({...formData, subject_id: e.target.value})}
                      className="w-full bg-white border-2 border-azure/30 rounded-xl px-4 py-3 text-slate-700 font-bold focus:border-azure outline-none cursor-pointer"
                    >
                      <option value="">Select Subject</option>
                      {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase ml-1 mb-1 block">Target Form</label>
                    <select 
                      value={formData.target_form}
                      onChange={(e) => setFormData({...formData, target_form: e.target.value})}
                      className="w-full bg-white border-2 border-azure/30 rounded-xl px-4 py-3 text-slate-700 font-bold focus:border-azure outline-none"
                    >
                      {['All', 'Form 1', 'Form 2', 'Form 3', 'Form 4'].map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Resource Type Selector */}
              <div className="space-y-4 border-t border-slate-100 pt-6">
                <p className="text-[11px] font-black text-azure uppercase tracking-widest">Resource Type</p>
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="resource_type" 
                      value="video"
                      checked={formData.resource_type === 'video'}
                      onChange={(e) => setFormData({...formData, resource_type: e.target.value, video_url: '', pdf_url: ''})}
                      className="w-4 h-4 text-azure focus:ring-azure"
                    />
                    <VideoCameraIcon className="w-5 h-5 text-azure" />
                    <span className="text-sm font-medium">Video Lesson</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="resource_type" 
                      value="pdf"
                      checked={formData.resource_type === 'pdf'}
                      onChange={(e) => setFormData({...formData, resource_type: e.target.value, video_url: '', pdf_url: ''})}
                      className="w-4 h-4 text-azure focus:ring-azure"
                    />
                    <DocumentIcon className="w-5 h-5 text-azure" />
                    <span className="text-sm font-medium">PDF Document</span>
                  </label>
                </div>
              </div>

              {/* Dynamic Resource Upload */}
              <div className="space-y-4">
                <p className="text-[11px] font-black text-azure uppercase tracking-widest">Upload Resource</p>
                <div className="p-4 rounded-xl border-2 border-azure/20 bg-slate-50/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                      {formData.resource_type === 'video' ? <VideoCameraIcon className="w-4 h-4" /> : <DocumentIcon className="w-4 h-4" />}
                      {formData.resource_type === 'video' ? 'Video File' : 'PDF File'}
                    </span>
                    <label className="text-[10px] font-black text-azure cursor-pointer hover:underline uppercase">
                      {uploadStatus[formData.resource_type] ? 'Uploading...' : 'Upload to R2'}
                      <input 
                        type="file" 
                        className="hidden" 
                        accept={formData.resource_type === 'video' ? 'video/*' : 'application/pdf'} 
                        onChange={(e) => uploadToR2(e.target.files[0], formData.resource_type)} 
                      />
                    </label>
                  </div>
                  <input 
                    type="text" 
                    value={formData.resource_type === 'video' ? formData.video_url : formData.pdf_url} 
                    onChange={(e) => {
                      if (formData.resource_type === 'video') {
                        setFormData({...formData, video_url: e.target.value});
                      } else {
                        setFormData({...formData, pdf_url: e.target.value});
                      }
                    }}
                    className="w-full text-xs bg-white border border-azure/20 rounded p-2 focus:border-azure outline-none" 
                    placeholder="File URL (auto-filled after upload)" 
                  />
                  <p className="text-[9px] text-slate-400 mt-1">Upload directly to designated folder: /{formData.resource_type === 'video' ? 'videos' : 'pdfs'}/</p>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase">Sort order:</span>
                  <input type="number" value={formData.display_order} onChange={(e) => setFormData({...formData, display_order: parseInt(e.target.value)})} className="w-12 border-b-2 border-azure/30 text-center font-bold text-azure focus:border-azure outline-none" />
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2 text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors">Discard</button>
                  <button 
                    disabled={submitting}
                    className="bg-[#007FFF] text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-azure/20 hover:bg-[#0066CC] transition-all flex items-center gap-2"
                  >
                    {submitting && <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>}
                    Save Changes
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