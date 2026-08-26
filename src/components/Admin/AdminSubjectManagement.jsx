import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const AdminSubjectManagement = ({ user, onBack }) => {
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [selectedClassName, setSelectedClassName] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    display_order: 1,
  });
  const [submitting, setSubmitting] = useState(false);

  // ── Fetch subjects — always uses the passed classId, never stale state ──────
  const fetchSubjects = useCallback(async (classId) => {
    if (!classId) return;
    setLoadingSubjects(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await api.get(`/api/admin/subjects/${classId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        setSubjects(response.data.subjects || []);
      } else {
        setError(response.data.message || 'Failed to load subjects');
        setSubjects([]);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to load subjects');
      setSubjects([]);
    } finally {
      setLoadingSubjects(false);
    }
  }, []);

  // ── Fetch classes on mount ──────────────────────────────────────────────────
  useEffect(() => {
    const fetchClasses = async () => {
      setLoadingClasses(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        const response = await api.get('/api/admin/classes', {
          headers: { Authorization: `Bearer ${token}` },
        });

        let classesArray = [];
        if (response.data.success && Array.isArray(response.data.classes)) {
          classesArray = response.data.classes;
        } else if (Array.isArray(response.data)) {
          classesArray = response.data;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          classesArray = response.data.data;
        } else {
          throw new Error('Unexpected API response format');
        }

        setClasses(classesArray);
        if (classesArray.length > 0) {
          const first = classesArray[0];
          setSelectedClassId(first.id);
          setSelectedClassName(first.name);
          // Pass the id directly — don't rely on state update being flushed yet
          fetchSubjects(first.id);
        }
      } catch (err) {
        console.error(err);
        setError('Failed to load classes.');
      } finally {
        setLoadingClasses(false);
      }
    };
    fetchClasses();
  }, [fetchSubjects]);

  // ── Class change handler — passes new id directly ──────────────────────────
  const handleClassChange = (e) => {
    const newId = parseInt(e.target.value, 10);
    const cls = classes.find(c => c.id === newId);
    if (cls) {
      setSelectedClassId(newId);
      setSelectedClassName(cls.name);
      fetchSubjects(newId); // ← pass directly, no stale state
    }
  };

  // ── Add subject ─────────────────────────────────────────────────────────────
  const handleAddSubject = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) { toast.error('Subject name is required'); return; }
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await api.post(
        '/api/admin/subjects',
        {
          class_id: selectedClassId,
          name: formData.name.trim(),
          code: formData.code.trim() || null,
          description: formData.description.trim() || null,
          display_order: parseInt(formData.display_order, 10) || subjects.length + 1,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        toast.success('Subject added');
        setShowAddModal(false);
        setFormData({ name: '', code: '', description: '', display_order: subjects.length + 2 });
        fetchSubjects(selectedClassId);
      } else {
        toast.error(response.data.message || 'Failed to add subject');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add subject');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Edit subject ────────────────────────────────────────────────────────────
  const handleEditSubject = async (e) => {
    e.preventDefault();
    if (!selectedSubject || !formData.name.trim()) { toast.error('Subject name is required'); return; }
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await api.put(
        `/api/admin/subjects/${selectedSubject.id}`,
        {
          name: formData.name.trim(),
          code: formData.code.trim() || null,
          description: formData.description.trim() || null,
          display_order: parseInt(formData.display_order, 10),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        toast.success('Subject updated');
        setShowEditModal(false);
        setSelectedSubject(null);
        setFormData({ name: '', code: '', description: '', display_order: 1 });
        fetchSubjects(selectedClassId);
      } else {
        toast.error(response.data.message || 'Failed to update subject');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update subject');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Delete subject ──────────────────────────────────────────────────────────
  const handleDeleteSubject = async (subject) => {
    if (!window.confirm(`Delete "${subject.name}"? This will affect all report cards using this subject.`)) return;
    try {
      const token = localStorage.getItem('token');
      const response = await api.delete(`/api/admin/subjects/${subject.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        toast.success('Subject deleted');
        fetchSubjects(selectedClassId);
      } else {
        toast.error(response.data.message || 'Failed to delete subject');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete subject');
    }
  };

  const openEditModal = (subject) => {
    setSelectedSubject(subject);
    setFormData({
      name: subject.name,
      code: subject.code || '',
      description: subject.description || '',
      display_order: subject.display_order || 1,
    });
    setShowEditModal(true);
  };

  // ── Loading / error states ──────────────────────────────────────────────────
  if (loadingClasses) {
    return (
      <div className="text-center py-12">
        <div className="w-8 h-8 border-4 border-[#006770] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-gray-500">Loading classes...</p>
      </div>
    );
  }

  if (error && classes.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 mb-4 text-sm">{error}</p>
        <button onClick={() => window.location.reload()} className="px-4 py-2 bg-[#006770] text-white rounded-lg text-sm">Retry</button>
      </div>
    );
  }

  if (classes.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-sm">No classes found. Please create a class first.</p>
        {onBack && <button onClick={onBack} className="mt-3 px-4 py-2 border border-gray-300 rounded-lg text-sm">Go Back</button>}
      </div>
    );
  }

  // ── Modal shared input style ────────────────────────────────────────────────
  const inputCls = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#006770] focus:border-[#006770]';

  // ── Main render ─────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <div>
          <h2 className="text-lg font-bold text-[#003B46]">Subject Management</h2>
          <p className="text-xs text-gray-500 mt-0.5">Manage subjects per class</p>
        </div>
        {onBack && (
          <button onClick={onBack} className="text-sm text-gray-500 hover:text-[#003B46] transition flex items-center gap-1">
            ← Back
          </button>
        )}
      </div>

      {/* Class selector + Add button */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
        <div className="flex-1">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Class</label>
          <select
            value={selectedClassId ?? ''}
            onChange={handleClassChange}
            className="w-full sm:w-56 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#006770] focus:border-[#006770]"
          >
            {classes.map(cls => (
              <option key={cls.id} value={cls.id}>{cls.name}</option>
            ))}
          </select>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#006770] text-white rounded-lg text-sm font-medium hover:bg-[#005a62] transition mt-auto"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Subject
        </button>
      </div>

      {/* Subjects table */}
      {loadingSubjects ? (
        <div className="flex items-center justify-center py-10">
          <div className="w-6 h-6 border-4 border-[#006770] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-red-500 text-sm mb-3">{error}</p>
          <button onClick={() => fetchSubjects(selectedClassId)} className="px-4 py-2 bg-[#006770] text-white rounded-lg text-sm">Retry</button>
        </div>
      ) : subjects.length === 0 ? (
        <div className="text-center py-10 bg-gray-50 rounded-xl border border-gray-200">
          <p className="text-gray-400 text-sm">No subjects yet for <span className="font-semibold text-[#003B46]">{selectedClassName}</span></p>
          <button onClick={() => setShowAddModal(true)} className="mt-2 text-xs text-[#006770] hover:underline">Add the first subject →</button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between">
            <span className="text-xs font-semibold text-[#003B46]">
              {selectedClassName} — {subjects.length} subject{subjects.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[400px]">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide w-8">#</th>
                  <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Subject Name</th>
                  <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide hidden sm:table-cell">Code</th>
                  <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide hidden md:table-cell">Description</th>
                  <th className="px-4 py-2.5 text-right text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {subjects.map((subject, index) => (
                  <tr key={subject.id} className="hover:bg-[#f0faf9] transition-colors">
                    <td className="px-4 py-3 text-xs font-bold text-gray-400">{subject.display_order ?? index + 1}</td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-semibold text-[#003B46]">{subject.name}</span>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      {subject.code
                        ? <code className="px-2 py-0.5 bg-gray-100 rounded text-[10px] font-mono text-gray-600">{subject.code}</code>
                        : <span className="text-[10px] text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-xs text-gray-400 line-clamp-1">{subject.description || '—'}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(subject)}
                          className="px-3 py-1 text-[10px] font-semibold text-[#006770] bg-[#006770]/10 rounded hover:bg-[#006770]/20 transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteSubject(subject)}
                          className="px-3 py-1 text-[10px] font-semibold text-red-600 bg-red-50 rounded hover:bg-red-100 transition"
                        >
                          Delete
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

      {/* ── Add Subject Modal ─────────────────────────────────────────────── */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-5 max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-[#003B46]">Add Subject — {selectedClassName}</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleAddSubject} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Subject Name *</label>
                <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g., Mathematics" className={inputCls} required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Code <span className="text-gray-400 font-normal">(optional)</span></label>
                <input type="text" value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value })} placeholder="e.g., MATH101" className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Description <span className="text-gray-400 font-normal">(optional)</span></label>
                <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} rows={2} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Display Order</label>
                <input type="number" value={formData.display_order} onChange={e => setFormData({ ...formData, display_order: e.target.value })} className={inputCls} />
              </div>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => { setShowAddModal(false); setFormData({ name: '', code: '', description: '', display_order: 1 }); }} className="flex-1 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition">Cancel</button>
                <button type="submit" disabled={submitting} className="flex-1 py-2 bg-[#006770] text-white rounded-lg text-sm font-medium hover:bg-[#005a62] transition disabled:opacity-50">
                  {submitting ? 'Adding...' : 'Add Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Edit Subject Modal ────────────────────────────────────────────── */}
      {showEditModal && selectedSubject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-5 max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-[#003B46]">Edit — {selectedSubject.name}</h3>
              <button onClick={() => setShowEditModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleEditSubject} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Subject Name *</label>
                <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className={inputCls} required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Code <span className="text-gray-400 font-normal">(optional)</span></label>
                <input type="text" value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Description <span className="text-gray-400 font-normal">(optional)</span></label>
                <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} rows={2} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Display Order</label>
                <input type="number" value={formData.display_order} onChange={e => setFormData({ ...formData, display_order: e.target.value })} className={inputCls} />
              </div>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => { setShowEditModal(false); setSelectedSubject(null); setFormData({ name: '', code: '', description: '', display_order: 1 }); }} className="flex-1 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition">Cancel</button>
                <button type="submit" disabled={submitting} className="flex-1 py-2 bg-[#006770] text-white rounded-lg text-sm font-medium hover:bg-[#005a62] transition disabled:opacity-50">
                  {submitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSubjectManagement;
