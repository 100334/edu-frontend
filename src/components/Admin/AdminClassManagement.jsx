import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';

// Theme constants
const NAVY_DARK = '#0A192F';
const NAVY_PRIMARY = '#1A237E';
const AZURE_ACCENT = '#00B0FF';
const ICE_WHITE = '#F8FAFC';

const AdminClassManagement = ({ onManageSubjects }) => {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    year: new Date().getFullYear().toString(),
    teacher_id: ''
  });
  const [showIdCopiedTooltip, setShowIdCopiedTooltip] = useState(null);

  useEffect(() => {
    fetchClasses();
    fetchTeachers();
  }, []);

  // Fetch classes - memoized
  const fetchClasses = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      const response = await api.get('/api/admin/classes', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Classes response:', response.data);
      
      if (response.data.success) {
        setClasses(response.data.classes || []);
      } else {
        setError(response.data.message || 'Failed to load classes');
        toast.error(response.data.message || 'Failed to load classes');
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
      const errorMessage = error.response?.data?.message || 'Network error. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch teachers - memoized
  const fetchTeachers = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.get('/api/admin/teachers', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setTeachers(response.data.teachers || []);
      }
    } catch (error) {
      console.error('Error fetching teachers:', error);
      setTeachers([]);
    }
  }, []);

  // Create class - memoized
  const createClass = useCallback(async (classData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.post('/api/admin/classes', {
        name: classData.name,
        year: parseInt(classData.year),
        teacher_id: classData.teacher_id || null
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        toast.success('Class created successfully!');
        fetchClasses();
        setShowAddDialog(false);
        resetForm();
      } else {
        toast.error(response.data.message || 'Failed to create class');
      }
    } catch (error) {
      console.error('Error creating class:', error);
      toast.error(error.response?.data?.message || 'Failed to create class');
    }
  }, [fetchClasses]);

  // Update class - memoized
  const updateClass = useCallback(async (classId, classData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.put(`/api/admin/classes/${classId}`, {
        name: classData.name,
        year: parseInt(classData.year),
        teacher_id: classData.teacher_id || null
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        toast.success('Class updated successfully!');
        fetchClasses();
        setShowEditDialog(false);
        setSelectedClass(null);
        resetForm();
      } else {
        toast.error(response.data.message || 'Failed to update class');
      }
    } catch (error) {
      console.error('Error updating class:', error);
      toast.error(error.response?.data?.message || 'Failed to update class');
    }
  }, [fetchClasses]);

  // Delete class - memoized
  const deleteClass = useCallback(async (classId, className) => {
    if (window.confirm(`Are you sure you want to delete "${className}"? This will permanently delete the class and all associated data including subjects and results.`)) {
      try {
        const token = localStorage.getItem('token');
        const response = await api.delete(`/api/admin/classes/${classId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.data.success) {
          toast.success('Class deleted successfully!');
          fetchClasses();
        } else {
          toast.error(response.data.message || 'Failed to delete class');
        }
      } catch (error) {
        console.error('Error deleting class:', error);
        toast.error(error.response?.data?.message || 'Failed to delete class');
      }
    }
  }, [fetchClasses]);

  // Copy ID to clipboard
  const copyToClipboard = (id, className) => {
    navigator.clipboard.writeText(id).then(() => {
      setShowIdCopiedTooltip(className);
      toast.success(`Class ID copied to clipboard!`, { duration: 2000 });
      setTimeout(() => setShowIdCopiedTooltip(null), 2000);
    }).catch(() => {
      toast.error('Failed to copy ID');
    });
  };

  // Handle add form submit - memoized
  const handleAddSubmit = useCallback((e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Class name is required');
      return;
    }
    const year = parseInt(formData.year);
    if (year < 2000 || year > 2100) {
      toast.error('Please enter a valid year (2000-2100)');
      return;
    }
    createClass(formData);
  }, [formData, createClass]);

  // Handle edit form submit - memoized
  const handleEditSubmit = useCallback((e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Class name is required');
      return;
    }
    const year = parseInt(formData.year);
    if (year < 2000 || year > 2100) {
      toast.error('Please enter a valid year (2000-2100)');
      return;
    }
    if (selectedClass) {
      updateClass(selectedClass.id, formData);
    }
  }, [formData, selectedClass, updateClass]);

  // Open edit dialog - memoized
  const openEditDialog = useCallback((classItem) => {
    setSelectedClass(classItem);
    setFormData({
      name: classItem.name,
      year: classItem.year.toString(),
      teacher_id: classItem.teacher_id?.toString() || ''
    });
    setShowEditDialog(true);
  }, []);

  // Handle manage subjects - uses the prop from parent
  const handleManageSubjects = useCallback((classId, className) => {
    if (onManageSubjects) {
      onManageSubjects(classId, className);
    } else {
      navigate(`/admin/class/${classId}/subjects`, { 
        state: { className: className, classId: classId }
      });
    }
  }, [onManageSubjects, navigate]);

  // Reset form - memoized
  const resetForm = useCallback(() => {
    setFormData({
      name: '',
      year: new Date().getFullYear().toString(),
      teacher_id: ''
    });
  }, []);

  // Handle input change - optimized with functional update
  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  // Handle select change - memoized
  const handleSelectChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  // Format ID for display (show first 8 and last 4 characters)
  const formatId = (id) => {
    if (!id) return '';
    const str = id.toString();
    if (str.length <= 12) return str;
    return `${str.slice(0, 8)}...${str.slice(-4)}`;
  };

  // AddClassDialog component
  const AddClassDialog = React.memo(() => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-xl">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold" style={{ color: NAVY_DARK }}>Create New Class</h2>
            <button
              onClick={() => {
                setShowAddDialog(false);
                resetForm();
              }}
              className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <form onSubmit={handleAddSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Class Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="e.g. Form 1A"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#00B0FF] focus:border-transparent transition"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Academic Year *
              </label>
              <input
                type="number"
                value={formData.year}
                onChange={(e) => handleInputChange('year', e.target.value)}
                placeholder="e.g. 2026"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#00B0FF] focus:border-transparent transition"
              />
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Assign Teacher (Optional)
              </label>
              <select
                value={formData.teacher_id}
                onChange={(e) => handleSelectChange('teacher_id', e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#00B0FF] focus:border-transparent transition"
              >
                <option value="">None</option>
                {teachers.map(teacher => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.full_name || teacher.name || teacher.username || 'Unknown'}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowAddDialog(false);
                  resetForm();
                }}
                className="flex-1 px-4 py-2.5 rounded-lg font-semibold transition bg-gray-100 hover:bg-gray-200 text-gray-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2.5 rounded-lg font-semibold text-white transition hover:opacity-90"
                style={{ backgroundColor: NAVY_PRIMARY }}
              >
                Save Class
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  ));

  // EditClassDialog component
  const EditClassDialog = React.memo(() => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-xl">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold" style={{ color: NAVY_DARK }}>Edit Class</h2>
            <button
              onClick={() => {
                setShowEditDialog(false);
                setSelectedClass(null);
                resetForm();
              }}
              className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <form onSubmit={handleEditSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Class Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="e.g. Form 1A"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#00B0FF] focus:border-transparent transition"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Academic Year *
              </label>
              <input
                type="number"
                value={formData.year}
                onChange={(e) => handleInputChange('year', e.target.value)}
                placeholder="e.g. 2026"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#00B0FF] focus:border-transparent transition"
              />
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Assign Teacher (Optional)
              </label>
              <select
                value={formData.teacher_id}
                onChange={(e) => handleSelectChange('teacher_id', e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#00B0FF] focus:border-transparent transition"
              >
                <option value="">None</option>
                {teachers.map(teacher => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.full_name || teacher.name || teacher.username || 'Unknown'}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Display Class ID for reference (read-only) */}
            {selectedClass && selectedClass.id && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Class ID (Reference)
                </label>
                <div className="flex items-center justify-between gap-2">
                  <code className="text-xs font-mono text-gray-600 break-all">
                    {selectedClass.id}
                  </code>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(selectedClass.id, selectedClass.name)}
                    className="p-1 text-gray-400 hover:text-[#00B0FF] transition"
                    title="Copy ID to clipboard"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
            
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowEditDialog(false);
                  setSelectedClass(null);
                  resetForm();
                }}
                className="flex-1 px-4 py-2.5 rounded-lg font-semibold transition bg-gray-100 hover:bg-gray-200 text-gray-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2.5 rounded-lg font-semibold text-white transition hover:opacity-90"
                style={{ backgroundColor: NAVY_PRIMARY }}
              >
                Update
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  ));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: ICE_WHITE }}>
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#00B0FF] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading classes...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header Section with Add Button */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold" style={{ color: NAVY_DARK }}>Class Management</h2>
          <p className="text-sm text-gray-500 mt-1">Configure levels and subject templates</p>
        </div>
        <button
          onClick={() => setShowAddDialog(true)}
          className="px-4 py-2 rounded-lg flex items-center gap-2 transition hover:opacity-90"
          style={{ backgroundColor: AZURE_ACCENT, color: 'white' }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span className="text-sm font-medium">Add Class</span>
        </button>
      </div>

      {/* Content */}
      {error ? (
        <div className="text-center py-12">
          <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="red" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={fetchClasses}
            className="px-6 py-2 rounded-lg font-semibold text-white transition"
            style={{ backgroundColor: NAVY_PRIMARY }}
          >
            Retry
          </button>
        </div>
      ) : classes.length === 0 ? (
        <div className="text-center py-12">
          <svg className="w-16 h-16 mx-auto mb-4 opacity-30" fill="none" stroke={NAVY_DARK} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-lg font-bold mb-2" style={{ color: NAVY_DARK }}>No classes found</h3>
          <p className="text-gray-500 mb-4">Click the Add Class button to create your first class</p>
        </div>
      ) : (
        <div className="space-y-3">
          {classes.map((classItem) => (
            <div
              key={classItem.id}
              className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition"
            >
              <div className="flex items-center p-4">
                <div 
                  className="w-12 h-12 rounded-lg flex items-center justify-center mr-4 flex-shrink-0"
                  style={{ backgroundColor: `${NAVY_PRIMARY}10` }}
                >
                  <span className="font-bold text-lg" style={{ color: NAVY_PRIMARY }}>
                    {classItem.year.toString().slice(-2)}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{classItem.name}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Academic Year {classItem.year} • Teacher: {classItem.teacher_name || 'Unassigned'}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-xs text-gray-400">
                      {classItem.learner_count || 0} students enrolled
                    </p>
                    {/* Display Class ID with copy functionality */}
                    <button
                      onClick={() => copyToClipboard(classItem.id, classItem.name)}
                      className="text-[10px] text-gray-400 hover:text-[#00B0FF] transition flex items-center gap-1 font-mono bg-gray-50 px-2 py-0.5 rounded"
                      title="Click to copy class ID"
                    >
                      <span>ID: {formatId(classItem.id)}</span>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                    {showIdCopiedTooltip === classItem.name && (
                      <span className="text-[10px] text-green-600 animate-pulse">Copied!</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleManageSubjects(classItem.id, classItem.name)}
                    className="p-2 rounded-lg hover:bg-gray-100 transition"
                    title="Manage Subjects"
                  >
                    <svg className="w-5 h-5" fill="none" stroke={AZURE_ACCENT} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </button>
                  <button
                    onClick={() => openEditDialog(classItem)}
                    className="p-2 rounded-lg hover:bg-gray-100 transition"
                    title="Edit"
                  >
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => deleteClass(classItem.id, classItem.name)}
                    className="p-2 rounded-lg hover:bg-gray-100 transition"
                    title="Delete"
                  >
                    <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dialogs */}
      {showAddDialog && <AddClassDialog />}
      {showEditDialog && <EditClassDialog />}
    </div>
  );
};

export default AdminClassManagement;