import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';

// Theme constants
const NAVY_DARK = '#0A192F';
const NAVY_PRIMARY = '#1A237E';
const AZURE_ACCENT = '#00B0FF';
const GOLD_ACCENT = '#c9933a';
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
  const [currentStep, setCurrentStep] = useState(1);
  const [stepErrors, setStepErrors] = useState({});

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

  // Validate current step
  const validateStep = useCallback((step, formDataStep) => {
    const errors = {};
    
    if (step === 1) {
      if (!formDataStep.name?.trim()) {
        errors.name = 'Class name is required';
      }
      const year = parseInt(formDataStep.year);
      if (!formDataStep.year) {
        errors.year = 'Academic year is required';
      } else if (year < 2000 || year > 2100) {
        errors.year = 'Please enter a valid year (2000-2100)';
      }
    } else if (step === 2) {
      // Teacher assignment is optional, no validation needed
    }
    
    setStepErrors(errors);
    return Object.keys(errors).length === 0;
  }, []);

  // Handle next step
  const handleNextStep = useCallback(() => {
    if (validateStep(currentStep, formData)) {
      setCurrentStep(prev => Math.min(prev + 1, 2));
    }
  }, [validateStep, currentStep, formData]);

  // Handle previous step
  const handlePrevStep = useCallback(() => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    setStepErrors({});
  }, []);

  // Check if current step can proceed
  const canProceed = useCallback(() => {
    if (currentStep === 1) {
      return formData.name?.trim() && formData.year && 
             parseInt(formData.year) >= 2000 && parseInt(formData.year) <= 2100;
    }
    return true;
  }, [currentStep, formData.name, formData.year]);

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
        setCurrentStep(1);
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
        setCurrentStep(1);
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

  // Handle add form submit
  const handleAddSubmit = useCallback((e) => {
    e.preventDefault();
    if (validateStep(1, formData)) {
      createClass(formData);
    }
  }, [formData, createClass, validateStep]);

  // Handle edit form submit
  const handleEditSubmit = useCallback((e) => {
    e.preventDefault();
    if (validateStep(1, formData)) {
      if (selectedClass) {
        updateClass(selectedClass.id, formData);
      }
    }
  }, [formData, selectedClass, updateClass, validateStep]);

  // Open edit dialog
  const openEditDialog = useCallback((classItem) => {
    setSelectedClass(classItem);
    setFormData({
      name: classItem.name,
      year: classItem.year.toString(),
      teacher_id: classItem.teacher_id?.toString() || ''
    });
    setShowEditDialog(true);
    setCurrentStep(1);
  }, []);

  // Handle manage subjects
  const handleManageSubjects = useCallback((classId, className) => {
    if (onManageSubjects) {
      onManageSubjects(classId, className);
    } else {
      navigate(`/admin/class/${classId}/subjects`, { 
        state: { className: className, classId: classId }
      });
    }
  }, [onManageSubjects, navigate]);

  // Reset form
  const resetForm = useCallback(() => {
    setFormData({
      name: '',
      year: new Date().getFullYear().toString(),
      teacher_id: ''
    });
    setStepErrors({});
  }, []);

  // Handle input change
  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (stepErrors[field]) {
      setStepErrors(prev => ({ ...prev, [field]: null }));
    }
  }, [stepErrors]);

  // Format ID for display
  const formatId = (id) => {
    if (!id) return '';
    const str = id.toString();
    if (str.length <= 12) return str;
    return `${str.slice(0, 8)}...${str.slice(-4)}`;
  };

  const getClassGradient = (year) => {
    const gradients = {
      '2024': 'from-purple-500 to-purple-600',
      '2025': 'from-blue-500 to-blue-600',
      '2026': 'from-emerald-500 to-emerald-600',
      '2027': 'from-amber-500 to-amber-600'
    };
    return gradients[year] || 'from-gray-500 to-gray-600';
  };

  // Dialog Steps Component
  const DialogSteps = ({ isEdit = false }) => {
    const steps = [
      { number: 1, title: 'Class Details', icon: '📚', color: 'blue', description: 'Name and academic year' },
      { number: 2, title: 'Teacher Assignment', icon: '👨‍🏫', color: 'purple', description: 'Optional class teacher' }
    ];

    return (
      <div className="mb-6">
        <div className="flex items-center justify-between">
          {steps.map((step) => (
            <div key={step.number} className="flex-1 relative">
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold transition-all duration-300 ${
                    currentStep >= step.number
                      ? `bg-gradient-to-r ${getClassGradient('2026')} text-white shadow-lg`
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {step.icon}
                </div>
                <p className="text-xs font-bold mt-2 text-gray-700">{step.title}</p>
                <p className="text-[10px] text-gray-400 mt-0.5 hidden sm:block">{step.description}</p>
              </div>
              {step.number < 2 && (
                <div className={`absolute top-5 left-1/2 w-full h-0.5 -translate-y-1/2 ${
                  currentStep > step.number ? 'bg-[#c9933a]' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // AddClassDialog component with steps
  const AddClassDialog = React.memo(() => (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-2xl px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <span className="text-white text-sm">📚</span>
              </div>
              <h2 className="text-xl font-bold text-gray-800">Create New Class</h2>
            </div>
            <button
              onClick={() => {
                setShowAddDialog(false);
                resetForm();
                setCurrentStep(1);
              }}
              className="w-8 h-8 rounded-full hover:bg-white/50 flex items-center justify-center transition"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">Set up a new class with academic details</p>
        </div>
        
        <div className="p-6">
          <DialogSteps isEdit={false} />
          
          <form onSubmit={handleAddSubmit}>
            {currentStep === 1 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-left-5 duration-300">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Class Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-lg">🏫</span>
                    </div>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="e.g., Form 1A"
                      autoFocus
                      className={`w-full pl-10 pr-4 py-3 rounded-xl border focus:ring-2 focus:ring-[#c9933a] focus:border-transparent transition ${
                        stepErrors.name ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    />
                  </div>
                  {stepErrors.name && (
                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                      <span>⚠️</span> {stepErrors.name}
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Academic Year <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-lg">📅</span>
                    </div>
                    <input
                      type="number"
                      value={formData.year}
                      onChange={(e) => handleInputChange('year', e.target.value)}
                      placeholder="e.g., 2026"
                      className={`w-full pl-10 pr-4 py-3 rounded-xl border focus:ring-2 focus:ring-[#c9933a] focus:border-transparent transition ${
                        stepErrors.year ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    />
                  </div>
                  {stepErrors.year && (
                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                      <span>⚠️</span> {stepErrors.year}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                    <span>💡</span> Enter a year between 2000 and 2100
                  </p>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-5 duration-300">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Assign Teacher (Optional)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-lg">👨‍🏫</span>
                    </div>
                    <select
                      value={formData.teacher_id}
                      onChange={(e) => handleInputChange('teacher_id', e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#c9933a] focus:border-transparent transition appearance-none bg-white"
                    >
                      <option value="">None (Leave unassigned)</option>
                      {teachers.map(teacher => (
                        <option key={teacher.id} value={teacher.id}>
                          {teacher.full_name || teacher.name || teacher.username || 'Unknown'}
                        </option>
                      ))}
                    </select>
                    <span className="absolute right-3 top-3.5 text-gray-400">▼</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                    <span>ℹ️</span> Teacher can be assigned later if needed
                  </p>
                </div>

                {/* Preview Card */}
                <div className="mt-6 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                  <p className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-3">Class Preview</p>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500">Class Name:</span>
                      <span className="font-medium text-gray-800">{formData.name || '—'}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500">Academic Year:</span>
                      <span className="font-medium text-gray-800">{formData.year || '—'}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500">Class Teacher:</span>
                      <span className="font-medium text-gray-800">
                        {formData.teacher_id 
                          ? teachers.find(t => t.id === formData.teacher_id)?.full_name || 'Assigned'
                          : 'Not assigned'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex gap-3 mt-6">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="flex-1 py-3 rounded-xl font-semibold transition-all duration-300 bg-gray-100 text-gray-700 hover:bg-gray-200"
                >
                  ← Back
                </button>
              )}
              
              {currentStep < 2 ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  disabled={!canProceed()}
                  className={`flex-1 py-3 rounded-xl font-semibold transition-all duration-300 ${
                    canProceed()
                      ? 'bg-gradient-to-r from-[#1A237E] to-[#0D1240] text-white hover:shadow-lg hover:scale-[1.02]'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Continue →
                </button>
              ) : (
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl font-bold text-white transition-all duration-300 hover:shadow-lg hover:scale-[1.02] active:scale-100 relative overflow-hidden group"
                  style={{ 
                    background: `linear-gradient(135deg, ${NAVY_PRIMARY}, ${NAVY_DARK})`
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                  <div className="flex items-center justify-center gap-2">
                    <span>✅</span>
                    <span>CREATE CLASS</span>
                    <span>→</span>
                  </div>
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  ));

  // EditClassDialog component with steps
  const EditClassDialog = React.memo(() => (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-t-2xl px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-amber-500 to-amber-600 rounded-xl flex items-center justify-center">
                <span className="text-white text-sm">✏️</span>
              </div>
              <h2 className="text-xl font-bold text-gray-800">Edit Class</h2>
            </div>
            <button
              onClick={() => {
                setShowEditDialog(false);
                setSelectedClass(null);
                resetForm();
                setCurrentStep(1);
              }}
              className="w-8 h-8 rounded-full hover:bg-white/50 flex items-center justify-center transition"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">Update class details and teacher assignment</p>
        </div>
        
        <div className="p-6">
          <DialogSteps isEdit={true} />
          
          <form onSubmit={handleEditSubmit}>
            {currentStep === 1 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-left-5 duration-300">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Class Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-lg">🏫</span>
                    </div>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="e.g., Form 1A"
                      autoFocus
                      className={`w-full pl-10 pr-4 py-3 rounded-xl border focus:ring-2 focus:ring-[#c9933a] focus:border-transparent transition ${
                        stepErrors.name ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    />
                  </div>
                  {stepErrors.name && (
                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                      <span>⚠️</span> {stepErrors.name}
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Academic Year <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-lg">📅</span>
                    </div>
                    <input
                      type="number"
                      value={formData.year}
                      onChange={(e) => handleInputChange('year', e.target.value)}
                      placeholder="e.g., 2026"
                      className={`w-full pl-10 pr-4 py-3 rounded-xl border focus:ring-2 focus:ring-[#c9933a] focus:border-transparent transition ${
                        stepErrors.year ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    />
                  </div>
                  {stepErrors.year && (
                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                      <span>⚠️</span> {stepErrors.year}
                    </p>
                  )}
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-5 duration-300">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Assign Teacher (Optional)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-lg">👨‍🏫</span>
                    </div>
                    <select
                      value={formData.teacher_id}
                      onChange={(e) => handleInputChange('teacher_id', e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#c9933a] focus:border-transparent transition appearance-none bg-white"
                    >
                      <option value="">None (Unassigned)</option>
                      {teachers.map(teacher => (
                        <option key={teacher.id} value={teacher.id}>
                          {teacher.full_name || teacher.name || teacher.username || 'Unknown'}
                        </option>
                      ))}
                    </select>
                    <span className="absolute right-3 top-3.5 text-gray-400">▼</span>
                  </div>
                </div>

                {/* Class ID Reference */}
                {selectedClass && selectedClass.id && (
                  <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                    <label className="block text-xs font-medium text-gray-500 mb-2">
                      Class ID (Reference)
                    </label>
                    <div className="flex items-center justify-between gap-2">
                      <code className="text-xs font-mono text-gray-600 break-all">
                        {selectedClass.id}
                      </code>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(selectedClass.id, selectedClass.name)}
                        className="p-2 text-gray-400 hover:text-[#c9933a] transition rounded-lg hover:bg-white"
                        title="Copy ID to clipboard"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}

                {/* Preview Card */}
                <div className="mt-4 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                  <p className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-3">Updated Preview</p>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500">Class Name:</span>
                      <span className="font-medium text-gray-800">{formData.name || '—'}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500">Academic Year:</span>
                      <span className="font-medium text-gray-800">{formData.year || '—'}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500">Class Teacher:</span>
                      <span className="font-medium text-gray-800">
                        {formData.teacher_id 
                          ? teachers.find(t => t.id === formData.teacher_id)?.full_name || 'Assigned'
                          : 'Not assigned'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex gap-3 mt-6">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="flex-1 py-3 rounded-xl font-semibold transition-all duration-300 bg-gray-100 text-gray-700 hover:bg-gray-200"
                >
                  ← Back
                </button>
              )}
              
              {currentStep < 2 ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  disabled={!canProceed()}
                  className={`flex-1 py-3 rounded-xl font-semibold transition-all duration-300 ${
                    canProceed()
                      ? 'bg-gradient-to-r from-[#1A237E] to-[#0D1240] text-white hover:shadow-lg hover:scale-[1.02]'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Continue →
                </button>
              ) : (
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl font-bold text-white transition-all duration-300 hover:shadow-lg hover:scale-[1.02] active:scale-100 relative overflow-hidden group"
                  style={{ 
                    background: `linear-gradient(135deg, ${NAVY_PRIMARY}, ${NAVY_DARK})`
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                  <div className="flex items-center justify-center gap-2">
                    <span>💾</span>
                    <span>UPDATE CLASS</span>
                    <span>→</span>
                  </div>
                </button>
              )}
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
          <div className="w-12 h-12 border-4 border-[#c9933a] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading classes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-[#0f1923] via-[#1a2d3f] to-[#0f1923] rounded-2xl p-6 shadow-xl">
        <div className="flex justify-between items-start flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#c9933a]/20 rounded-2xl flex items-center justify-center">
              <span className="text-3xl">📚</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Class Management</h2>
              <p className="text-gray-300 text-sm mt-1">Configure academic levels and subject templates</p>
            </div>
          </div>
          <button
            onClick={() => setShowAddDialog(true)}
            className="group relative px-6 py-3 bg-gradient-to-r from-[#c9933a] to-[#b5822e] text-white rounded-xl hover:shadow-lg transition-all duration-300 font-semibold transform hover:scale-105"
          >
            <span className="flex items-center gap-2">
              <span className="text-xl">➕</span>
              Add New Class
            </span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white shadow-lg">
          <p className="text-blue-100 text-sm font-medium">Total Classes</p>
          <p className="text-2xl font-bold mt-1">{classes.length}</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-4 text-white shadow-lg">
          <p className="text-emerald-100 text-sm font-medium">Active Years</p>
          <p className="text-2xl font-bold mt-1">{[...new Set(classes.map(c => c.year))].length}</p>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white shadow-lg">
          <p className="text-purple-100 text-sm font-medium">Teachers Assigned</p>
          <p className="text-2xl font-bold mt-1">{classes.filter(c => c.teacher_id).length}</p>
        </div>
        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-4 text-white shadow-lg">
          <p className="text-amber-100 text-sm font-medium">Total Students</p>
          <p className="text-2xl font-bold mt-1">{classes.reduce((sum, c) => sum + (c.learner_count || 0), 0)}</p>
        </div>
      </div>

      {/* Content */}
      {error ? (
        <div className="text-center py-12 bg-white rounded-2xl shadow-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={fetchClasses}
            className="px-6 py-2 rounded-lg font-semibold text-white transition hover:shadow-lg"
            style={{ backgroundColor: NAVY_PRIMARY }}
          >
            Retry
          </button>
        </div>
      ) : classes.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl shadow-md border border-gray-100">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">📭</span>
          </div>
          <h3 className="text-lg font-bold text-gray-800 mb-2">No classes found</h3>
          <p className="text-gray-500 mb-6">Click the "Add New Class" button to create your first class</p>
          <button
            onClick={() => setShowAddDialog(true)}
            className="px-6 py-2.5 bg-gradient-to-r from-[#c9933a] to-[#b5822e] text-white rounded-lg font-semibold hover:shadow-lg transition"
          >
            Create First Class
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {classes.map((classItem) => (
            <div
              key={classItem.id}
              className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg hover:border-[#c9933a]/30 transition-all duration-300 group"
            >
              <div className="flex items-center p-5">
                <div 
                  className="w-14 h-14 rounded-xl flex items-center justify-center mr-4 flex-shrink-0 shadow-md"
                  style={{ 
                    background: `linear-gradient(135deg, ${NAVY_PRIMARY}20, ${NAVY_PRIMARY}40)`
                  }}
                >
                  <span className="font-bold text-xl" style={{ color: NAVY_PRIMARY }}>
                    {classItem.year.toString().slice(-2)}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 text-lg group-hover:text-[#c9933a] transition-colors">
                    {classItem.name}
                  </h3>
                  <div className="flex flex-wrap items-center gap-3 mt-1">
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <span>📅</span> Year {classItem.year}
                    </span>
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <span>👨‍🏫</span> {classItem.teacher_name || 'Unassigned'}
                    </span>
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <span>👥</span> {classItem.learner_count || 0} students
                    </span>
                    <button
                      onClick={() => copyToClipboard(classItem.id, classItem.name)}
                      className="text-[10px] text-gray-400 hover:text-[#c9933a] transition flex items-center gap-1 font-mono bg-gray-50 px-2 py-0.5 rounded-full"
                      title="Click to copy class ID"
                    >
                      <span>🆔</span>
                      <span>{formatId(classItem.id)}</span>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                    {showIdCopiedTooltip === classItem.name && (
                      <span className="text-[10px] text-emerald-600 animate-pulse">✓ Copied!</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleManageSubjects(classItem.id, classItem.name)}
                    className="p-2 rounded-lg hover:bg-blue-50 transition group"
                    title="Manage Subjects"
                  >
                    <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </button>
                  <button
                    onClick={() => openEditDialog(classItem)}
                    className="p-2 rounded-lg hover:bg-amber-50 transition group"
                    title="Edit"
                  >
                    <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => deleteClass(classItem.id, classItem.name)}
                    className="p-2 rounded-lg hover:bg-red-50 transition group"
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