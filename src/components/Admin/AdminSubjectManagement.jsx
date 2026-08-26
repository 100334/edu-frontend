import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  XMarkIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';

const inp = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#00B4D8] focus:border-[#00B4D8] transition';

// ── Modal extracted as a top-level component so it never remounts on parent re-render
const SubjectModal = ({ title, formData, setFormData, onSubmit, onClose, submitting }) => (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-xl w-full max-w-md shadow-xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <h3 className="text-sm font-bold text-[#003B46]">{title}</h3>
        <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition">
          <XMarkIcon className="w-4 h-4 text-gray-400" />
        </button>
      </div>
      <form onSubmit={onSubmit} className="p-5 space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Subject Name *</label>
          <input
            type="text"
            value={formData.name}
            onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
            placeholder="e.g., Mathematics"
            className={inp}
            required
            autoFocus
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">
            Code <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            type="text"
            value={formData.code}
            onChange={e => setFormData(p => ({ ...p, code: e.target.value }))}
            placeholder="e.g., MATH101"
            className={inp}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">
            Description <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea
            value={formData.description}
            onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
            rows={2}
            className={inp}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Display Order</label>
          <input
            type="number"
            value={formData.display_order}
            onChange={e => setFormData(p => ({ ...p, display_order: e.target.value }))}
            className={inp}
          />
        </div>
        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 py-2 bg-[#006770] text-white rounded-lg text-sm font-medium hover:bg-[#005a62] transition disabled:opacity-50"
          >
            {submitting ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  </div>
);

// ── Main component ────────────────────────────────────────────────────────────
const AdminSubjectManagement = ({ user, onBack }) => {
  const [classes,           setClasses]           = useState([]);
  const [selectedClassId,   setSelectedClassId]   = useState(null);
  const [selectedClassName, setSelectedClassName] = useState('');
  const [subjects,          setSubjects]          = useState([]);
  const [loadingClasses,    setLoadingClasses]    = useState(true);
  const [loadingSubjects,   setLoadingSubjects]   = useState(false);
  const [error,             setError]             = useState(null);
  const [showAddModal,      setShowAddModal]      = useState(false);
  const [showEditModal,     setShowEditModal]     = useState(false);
  const [selectedSubject,   setSelectedSubject]   = useState(null);
  const [submitting,        setSubmitting]        = useState(false);
  const [formData, setFormData] = useState({ name: '', code: '', description: '', display_order: 1 });

  // ── Plain async function — no useCallback, no stale closures ─────────────
  const fetchSubjects = async (classId) => {
    if (!classId) return;
    setLoadingSubjects(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const res = await api.get(`/api/admin/subjects/${classId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        setSubjects(res.data.subjects || []);
      } else {
        setError(res.data.message || 'Failed to load subjects');
        setSubjects([]);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load subjects');
      setSubjects([]);
    } finally {
      setLoadingSubjects(false);
    }
  };

  // ── Load classes once on mount ────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      setLoadingClasses(true);
      try {
        const token = localStorage.getItem('token');
        const res = await api.get('/api/admin/classes', {
          headers: { Authorization: `Bearer ${token}` },
        });
        let arr = [];
        if (res.data.success && Array.isArray(res.data.classes)) arr = res.data.classes;
        else if (Array.isArray(res.data))                          arr = res.data;
        else if (Array.isArray(res.data.data))                     arr = res.data.data;
        else throw new Error('Unexpected format');
        setClasses(arr);
        if (arr.length > 0) {
          setSelectedClassId(arr[0].id);
          setSelectedClassName(arr[0].name);
          fetchSubjects(arr[0].id);   // pass the id directly from the fresh array
        }
      } catch (err) {
        setError('Failed to load classes.');
      } finally {
        setLoadingClasses(false);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Class selector change — compare as strings (UUID or int both work) ────
  const handleClassChange = (e) => {
    const raw = e.target.value;
    const cls = classes.find(c => String(c.id) === String(raw));
    if (!cls) return;
    setSelectedClassId(cls.id);
    setSelectedClassName(cls.name);
    fetchSubjects(cls.id);          // pass the fresh id directly
  };

  // ── Add ───────────────────────────────────────────────────────────────────
  const handleAddSubject = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) { toast.error('Subject name is required'); return; }
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await api.post('/api/admin/subjects', {
        class_id:      selectedClassId,
        name:          formData.name.trim(),
        code:          formData.code.trim()        || null,
        description:   formData.description.trim() || null,
        display_order: parseInt(formData.display_order, 10) || subjects.length + 1,
      }, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.success) {
        toast.success('Subject added');
        setShowAddModal(false);
        setFormData({ name: '', code: '', description: '', display_order: subjects.length + 2 });
        fetchSubjects(selectedClassId);
      } else toast.error(res.data.message || 'Failed');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSubmitting(false); }
  };

  // ── Edit ──────────────────────────────────────────────────────────────────
  const handleEditSubject = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) { toast.error('Subject name is required'); return; }
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await api.put(`/api/admin/subjects/${selectedSubject.id}`, {
        name:          formData.name.trim(),
        code:          formData.code.trim()        || null,
        description:   formData.description.trim() || null,
        display_order: parseInt(formData.display_order, 10),
      }, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.success) {
        toast.success('Subject updated');
        setShowEditModal(false);
        setSelectedSubject(null);
        setFormData({ name: '', code: '', description: '', display_order: 1 });
        fetchSubjects(selectedClassId);
      } else toast.error(res.data.message || 'Failed');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSubmitting(false); }
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDeleteSubject = async (subject) => {
    if (!window.confirm(`Delete "${subject.name}"? This affects all report cards using this subject.`)) return;
    try {
      const token = localStorage.getItem('token');
      const res = await api.delete(`/api/admin/subjects/${subject.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) { toast.success('Subject deleted'); fetchSubjects(selectedClassId); }
      else toast.error(res.data.message || 'Failed');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const openEditModal = (subject) => {
    setSelectedSubject(subject);
    setFormData({
      name:          subject.name,
      code:          subject.code        || '',
      description:   subject.description || '',
      display_order: subject.display_order || 1,
    });
    setShowEditModal(true);
  };

  // ── Guards ────────────────────────────────────────────────────────────────
  if (loadingClasses) return (
    <div className="flex items-center justify-center py-12">
      <div className="w-7 h-7 border-4 border-[#006770] border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (error && classes.length === 0) return (
    <div className="text-center py-10">
      <p className="text-red-500 text-sm mb-3">{error}</p>
      <button onClick={() => window.location.reload()} className="px-4 py-2 bg-[#006770] text-white rounded-lg text-sm">
        Retry
      </button>
    </div>
  );
  if (classes.length === 0) return (
    <div className="text-center py-10">
      <p className="text-sm text-gray-400">No classes found. Create a class first.</p>
      {onBack && (
        <button onClick={onBack} className="mt-3 px-4 py-2 border border-gray-200 rounded-lg text-sm">
          Go Back
        </button>
      )}
    </div>
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-end gap-3 mb-5">
        {onBack && (
          <button onClick={onBack} className="flex items-center gap-1 text-xs text-gray-500 hover:text-[#003B46] transition self-start">
            <ArrowLeftIcon className="w-3.5 h-3.5" /> Back
          </button>
        )}
        <div className="flex-1 flex flex-col sm:flex-row sm:items-end gap-3">
          <div>
            <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Select Class
            </label>
            <select
              value={selectedClassId != null ? String(selectedClassId) : ''}
              onChange={handleClassChange}
              className="w-full sm:w-56 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#00B4D8] focus:border-[#00B4D8]"
            >
              {classes.map(cls => (
                <option key={cls.id} value={String(cls.id)}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={() => {
              setFormData({ name: '', code: '', description: '', display_order: subjects.length + 1 });
              setShowAddModal(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#006770] text-white rounded-lg text-sm font-medium hover:bg-[#005a62] transition"
          >
            <PlusIcon className="w-4 h-4" /> Add Subject
          </button>
        </div>
      </div>

      {/* Subjects table */}
      {loadingSubjects ? (
        <div className="flex justify-center py-10">
          <div className="w-6 h-6 border-4 border-[#006770] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-red-500 text-sm mb-3">{error}</p>
          <button onClick={() => fetchSubjects(selectedClassId)} className="px-4 py-2 bg-[#006770] text-white rounded-lg text-sm">
            Retry
          </button>
        </div>
      ) : subjects.length === 0 ? (
        <div className="text-center py-10 bg-gray-50 rounded-xl border border-gray-200">
          <p className="text-sm text-gray-400">
            No subjects for <span className="font-semibold text-[#003B46]">{selectedClassName}</span>
          </p>
          <button
            onClick={() => {
              setFormData({ name: '', code: '', description: '', display_order: 1 });
              setShowAddModal(true);
            }}
            className="mt-2 text-xs text-[#006770] hover:underline"
          >
            Add the first subject →
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="px-4 py-2.5 border-b border-gray-100">
            <span className="text-xs font-semibold text-[#003B46]">
              {selectedClassName} — {subjects.length} subject{subjects.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[360px]">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide w-8">#</th>
                  <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Name</th>
                  <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide hidden sm:table-cell">Code</th>
                  <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide hidden md:table-cell">Description</th>
                  <th className="px-4 py-2.5 text-right text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {subjects.map((s, i) => (
                  <tr key={s.id} className="hover:bg-[#f0faf9] transition-colors">
                    <td className="px-4 py-3 text-xs font-bold text-gray-300">{s.display_order ?? i + 1}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-[#003B46]">{s.name}</td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      {s.code
                        ? <code className="px-2 py-0.5 bg-[#e0f7fa] text-[#006770] rounded text-[10px] font-mono">{s.code}</code>
                        : <span className="text-[10px] text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-xs text-gray-400 line-clamp-1">{s.description || '—'}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(s)}
                          className="p-1.5 text-[#006770] hover:bg-[#006770]/10 rounded-lg transition"
                          title="Edit"
                        >
                          <PencilSquareIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteSubject(s)}
                          className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition"
                          title="Delete"
                        >
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
      )}

      {/* Modals */}
      {showAddModal && (
        <SubjectModal
          title={`Add Subject — ${selectedClassName}`}
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleAddSubject}
          onClose={() => setShowAddModal(false)}
          submitting={submitting}
        />
      )}
      {showEditModal && selectedSubject && (
        <SubjectModal
          title={`Edit — ${selectedSubject.name}`}
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleEditSubject}
          onClose={() => { setShowEditModal(false); setSelectedSubject(null); }}
          submitting={submitting}
        />
      )}
    </div>
  );
};

export default AdminSubjectManagement;
