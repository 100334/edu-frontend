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

  // Fetch classes on mount
  useEffect(() => {
    fetchClasses();
  }, []);

  // Fetch subjects when selectedClassId changes (and is not null)
  useEffect(() => {
    if (selectedClassId !== null && selectedClassId !== undefined) {
      fetchSubjects();
    } else {
      setSubjects([]);
    }
  }, [selectedClassId]); // ✅ Dependency includes selectedClassId

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
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load classes. Check console for details.');
    } finally {
      setLoadingClasses(false);
    }
  };

  const fetchSubjects = async () => {
    if (!selectedClassId) return;
    setLoadingSubjects(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await api.get(`/api/admin/subjects/${selectedClassId}`, {
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
  };

  // ✅ FIXED: handleClassChange ensures correct state update
  const handleClassChange = (e) => {
    const newClassId = parseInt(e.target.value, 10); // ensure integer
    const selectedClass = classes.find(c => c.id === newClassId);
    if (selectedClass) {
      setSelectedClassId(newClassId);
      setSelectedClassName(selectedClass.name);
    }
  };

  // ... (all other handlers: handleAddSubject, handleEditSubject, handleDeleteSubject, openEditModal)
  // They remain exactly as in your original code – no changes needed.

  const handleAddSubject = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Subject name is required');
      return;
    }
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
        toast.success('Subject added successfully');
        setShowAddModal(false);
        setFormData({ name: '', code: '', description: '', display_order: subjects.length + 2 });
        fetchSubjects();
      } else {
        toast.error(response.data.message || 'Failed to add subject');
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to add subject');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubject = async (e) => {
    e.preventDefault();
    if (!selectedSubject) return;
    if (!formData.name.trim()) {
      toast.error('Subject name is required');
      return;
    }
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
        toast.success('Subject updated successfully');
        setShowEditModal(false);
        setSelectedSubject(null);
        setFormData({ name: '', code: '', description: '', display_order: 1 });
        fetchSubjects();
      } else {
        toast.error(response.data.message || 'Failed to update subject');
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to update subject');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSubject = async (subject) => {
    if (!window.confirm(`Delete "${subject.name}"? This will affect all report cards using this subject.`)) {
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const response = await api.delete(`/api/admin/subjects/${subject.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        toast.success('Subject deleted successfully');
        fetchSubjects();
      } else {
        toast.error(response.data.message || 'Failed to delete subject');
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to delete subject');
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

  const getStatusColor = (status) => {
    if (status === 'Active') return 'bg-green-100 text-green-700';
    if (status === 'Inactive') return 'bg-red-100 text-red-700';
    return 'bg-gray-100 text-gray-700';
  };

  // Loading and error states (unchanged)
  if (loadingClasses) {
    return (
      <div className="text-center py-12">
        <div className="text-3xl mb-2 animate-pulse">📚</div>
        <p className="text-gray-500">Loading classes...</p>
      </div>
    );
  }

  if (error && classes.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <div className="text-4xl mb-3">⚠️</div>
        <p className="text-red-500 mb-2 break-words">{error}</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button onClick={fetchClasses} className="px-4 py-2 bg-[#c9933a] text-white rounded-lg hover:bg-[#b5822e] transition text-sm">
            Retry
          </button>
          {onBack && (
            <button onClick={onBack} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm">
              Go Back
            </button>
          )}
        </div>
      </div>
    );
  }

  if (classes.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <div className="text-4xl mb-3">🏫</div>
        <p className="text-gray-600 mb-2">No classes found. Please create a class first.</p>
        {onBack && (
          <button onClick={onBack} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm">
            Go Back
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-lg sm:text-xl font-serif font-bold text-[#0f1923]">Subject Management</h2>
          <p className="text-sm text-gray-500">Manage subjects for each class</p>
        </div>
        {onBack && (
          <button onClick={onBack} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm w-full sm:w-auto">
            ← Go Back
          </button>
        )}
      </div>

      {/* Class Selector - FIXED with proper value binding */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Class</label>
        <select
          value={selectedClassId ?? ''} // ✅ handle null/undefined
          onChange={handleClassChange}
          className="w-full sm:w-64 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c9933a] focus:border-transparent"
        >
          {classes.map((cls) => (
            <option key={cls.id} value={cls.id}>
              {cls.name}
            </option>
          ))}
        </select>
      </div>

      {/* Subjects Section */}
      {selectedClassId && (
        <>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
            <p className="text-sm text-gray-500">
              Managing subjects for: <span className="font-semibold text-[#c9933a]">{selectedClassName}</span>
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-[#c9933a] text-white rounded-lg hover:bg-[#b5822e] transition text-sm font-medium flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Subject
            </button>
          </div>

          {loadingSubjects ? (
            <div className="text-center py-12">
              <div className="text-3xl mb-2 animate-pulse">📚</div>
              <p className="text-gray-500">Loading subjects...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12 px-4">
              <div className="text-4xl mb-3">⚠️</div>
              <p className="text-red-500 mb-2 break-words">{error}</p>
              <button onClick={fetchSubjects} className="px-4 py-2 bg-[#c9933a] text-white rounded-lg hover:bg-[#b5822e] transition text-sm">
                Retry
              </button>
            </div>
          ) : subjects.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
              <div className="text-4xl mb-3">📚</div>
              <p className="text-gray-500 mb-2">No subjects added yet for {selectedClassName}</p>
              <button onClick={() => setShowAddModal(true)} className="text-sm text-[#c9933a] hover:text-[#0f1923] transition">
                Click here to add your first subject →
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {subjects.map((subject, index) => (
                <div key={subject.id} className="bg-white border border-gray-200 rounded-lg p-4 sm:p-5 hover:shadow-md transition-all hover:border-[#c9933a]/30">
                  <div className="flex flex-wrap justify-between items-start gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-8 h-8 rounded-full bg-[#c9933a]/10 flex items-center justify-center text-[#c9933a] font-bold text-sm">
                        {subject.display_order || index + 1}
                      </span>
                      <h3 className="font-bold text-[#0f1923] text-base sm:text-lg break-words">{subject.name}</h3>
                    </div>
                    {subject.status && (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(subject.status)}`}>
                        {subject.status}
                      </span>
                    )}
                  </div>
                  <div className="space-y-2 text-sm mb-4">
                    {subject.code && (
                      <div className="flex items-center gap-2 text-gray-600 flex-wrap">
                        <span className="font-medium">Code:</span>
                        <code className="bg-gray-100 px-2 py-0.5 rounded text-xs font-mono break-all">{subject.code}</code>
                      </div>
                    )}
                    {subject.description && (
                      <div className="text-gray-600">
                        <span className="font-medium">Description:</span>
                        <p className="text-sm text-gray-500 mt-1 break-words">{subject.description}</p>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 pt-3 border-t border-gray-100">
                    <button onClick={() => openEditModal(subject)} className="flex-1 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-50 rounded hover:bg-gray-100 transition">
                      Edit
                    </button>
                    <button onClick={() => handleDeleteSubject(subject)} className="flex-1 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded hover:bg-red-100 transition">
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Add Subject Modal (unchanged) */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-[#c9933a]/10 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-[#c9933a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-[#0f1923]">Add New Subject</h3>
            </div>
            <form onSubmit={handleAddSubject}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Subject Name *</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g., Mathematics" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c9933a] focus:border-transparent" required />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Subject Code (Optional)</label>
                <input type="text" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} placeholder="e.g., MATH101" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c9933a] focus:border-transparent" />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Description (Optional)</label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Brief description of the subject" rows="3" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c9933a] focus:border-transparent" />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Display Order</label>
                <input type="number" value={formData.display_order} onChange={(e) => setFormData({ ...formData, display_order: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c9933a] focus:border-transparent" />
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <button type="button" onClick={() => { setShowAddModal(false); setFormData({ name: '', code: '', description: '', display_order: 1 }); }} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition sm:flex-1">Cancel</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 bg-[#c9933a] text-white rounded-lg hover:bg-[#b5822e] transition disabled:opacity-50 sm:flex-1">{submitting ? 'Adding...' : 'Add Subject'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Subject Modal (unchanged) */}
      {showEditModal && selectedSubject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-[#0f1923]">Edit Subject</h3>
            </div>
            <form onSubmit={handleEditSubject}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Subject Name *</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c9933a] focus:border-transparent" required />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Subject Code (Optional)</label>
                <input type="text" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c9933a] focus:border-transparent" />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Description (Optional)</label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows="3" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c9933a] focus:border-transparent" />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Display Order</label>
                <input type="number" value={formData.display_order} onChange={(e) => setFormData({ ...formData, display_order: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c9933a] focus:border-transparent" />
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <button type="button" onClick={() => { setShowEditModal(false); setSelectedSubject(null); setFormData({ name: '', code: '', description: '', display_order: 1 }); }} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition sm:flex-1">Cancel</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 bg-[#c9933a] text-white rounded-lg hover:bg-[#b5822e] transition disabled:opacity-50 sm:flex-1">{submitting ? 'Updating...' : 'Update Subject'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSubjectManagement;