import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';

// Theme constants
const NAVY_PRIMARY = '#1A237E';
const NAVY_DARK = '#0D1240';
const AZURE_ACCENT = '#00B0FF';

const RegisterLearner = ({ onSuccess }) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingLearners, setLoadingLearners] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState({
    name: '',
    regNumber: '',
    selectedClassId: '',
    selectedClassName: ''
  });
  
  // Data lists
  const [classes, setClasses] = useState([]);
  const [learners, setLearners] = useState([]);
  const [selectedLearnerId, setSelectedLearnerId] = useState('');
  const [selectedLearnerData, setSelectedLearnerData] = useState(null);
  
  // Form validation errors
  const [errors, setErrors] = useState({});
  
  const inputRefs = useRef({});

  useEffect(() => {
    fetchClasses();
    handleGenerateRegNumber();
  }, []);

  // Generate random alphanumeric string excluding O, I, L
  const generateRandomString = useCallback((length = 4) => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }, []);

  // Get form prefix based on class name
  const getFormPrefix = useCallback((className) => {
    if (!className) return 'STU';
    
    const lowercaseName = className.toLowerCase();
    const currentYear = new Date().getFullYear();
    const yearSuffix = currentYear.toString().slice(-2);
    
    if (lowercaseName.includes('form 1') || lowercaseName === 'form 1' || 
        lowercaseName.includes('1a') || lowercaseName.includes('1b')) {
      return `FRM1-${yearSuffix}`;
    }
    else if (lowercaseName.includes('form 2') || lowercaseName === 'form 2' ||
             lowercaseName.includes('2a') || lowercaseName.includes('2b')) {
      return `FRM2-${yearSuffix}`;
    }
    else if (lowercaseName.includes('form 3') || lowercaseName === 'form 3' ||
             lowercaseName.includes('3a') || lowercaseName.includes('3b')) {
      return `FRM3-${yearSuffix}`;
    }
    else if (lowercaseName.includes('form 4') || lowercaseName === 'form 4' ||
             lowercaseName.includes('4a') || lowercaseName.includes('4b')) {
      return `FRM4-${yearSuffix}`;
    }
    
    const formMatch = lowercaseName.match(/form\s*(\d+)/i);
    if (formMatch) {
      const formNumber = formMatch[1];
      return `FRM${formNumber}-${yearSuffix}`;
    }
    
    return `STU-${yearSuffix}`;
  }, []);

  // Generate registration number
  const generateRegNumber = useCallback(() => {
    if (!formData.selectedClassId || !formData.selectedClassName) {
      const currentYear = new Date().getFullYear();
      const yearSuffix = currentYear.toString().slice(-2);
      const randomPart = generateRandomString(4);
      return `STU-${yearSuffix}-${randomPart}`;
    }
    
    const prefix = getFormPrefix(formData.selectedClassName);
    const randomPart = generateRandomString(4);
    return `${prefix}-${randomPart}`;
  }, [formData.selectedClassId, formData.selectedClassName, generateRandomString, getFormPrefix]);

  // Generate new registration number
  const handleGenerateRegNumber = useCallback(() => {
    const newRegNumber = generateRegNumber();
    setFormData(prev => ({ ...prev, regNumber: newRegNumber }));
  }, [generateRegNumber]);

  // Fetch classes from database
  const fetchClasses = async () => {
    setLoadingClasses(true);
    try {
      const token = localStorage.getItem('token');
      const response = await api.get('/api/admin/classes', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Classes response:', response.data);
      
      if (response.data.success) {
        setClasses(response.data.classes || []);
      } else if (Array.isArray(response.data)) {
        setClasses(response.data);
      } else {
        toast.error('Failed to load classes');
        setClasses([]);
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
      toast.error(error.response?.data?.message || 'Failed to load classes');
      setClasses([]);
    } finally {
      setLoadingClasses(false);
    }
  };

  // Fetch learners for a class
  const fetchLearnersForClass = useCallback(async (classId) => {
    if (!classId) return;
    
    setLoadingLearners(true);
    setLearners([]);
    setSelectedLearnerId('');
    setSelectedLearnerData(null);
    setFormData(prev => ({ 
      ...prev, 
      name: '', 
      regNumber: ''
    }));
    
    try {
      const token = localStorage.getItem('token');
      const response = await api.get(`/api/teacher/learners/${classId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success !== false) {
        const learnersData = Array.isArray(response.data) ? response.data : (response.data.learners || []);
        setLearners(learnersData);
      }
    } catch (error) {
      console.error('Error fetching learners:', error);
      if (error.response?.status !== 404) {
        toast.error('Failed to load learners');
      }
      setLearners([]);
    } finally {
      setLoadingLearners(false);
    }
  }, []);

  // Handle learner selection
  const handleLearnerSelect = useCallback((learnerId) => {
    if (!learnerId) {
      setSelectedLearnerId('');
      setSelectedLearnerData(null);
      setFormData(prev => ({ 
        ...prev, 
        name: '', 
        regNumber: ''
      }));
      return;
    }
    
    const learner = learners.find(l => l.id === parseInt(learnerId));
    if (learner) {
      setSelectedLearnerId(learnerId);
      setSelectedLearnerData(learner);
      setFormData(prev => ({
        ...prev,
        name: learner.name || '',
        regNumber: learner.reg_number || ''
      }));
    }
  }, [learners]);

  // Validate form
  const validateForm = useCallback(() => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Student name is required';
    }
    
    if (!isEditMode && !formData.regNumber.trim()) {
      newErrors.regNumber = 'Registration number is required';
    }
    
    if (!formData.selectedClassId) {
      newErrors.classId = 'Please select a class';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData.name, formData.regNumber, formData.selectedClassId, isEditMode]);

  // Helper to extract form name from class name
  const getFormName = (className) => {
    if (!className) return 'Form 1';
    const match = className.match(/Form\s*(\d+)/i);
    if (match) {
      return `Form ${match[1]}`;
    }
    const numMatch = className.match(/^(\d+)/);
    if (numMatch) {
      return `Form ${numMatch[1]}`;
    }
    return 'Form 1';
  };

  // Register learner - FIXED to send UUID for class_id
  const handleRegister = useCallback(async () => {
    if (!validateForm()) {
      console.log('Validation failed:', errors);
      return;
    }
    
    setIsLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      
      // Find the selected class - IMPORTANT: Get the actual UUID
      const selectedClass = classes.find(c => 
        c.id.toString() === formData.selectedClassId.toString() ||
        c.id === formData.selectedClassId
      );
      
      if (!selectedClass) {
        toast.error('Selected class not found. Please try again.');
        setIsLoading(false);
        return;
      }
      
      const formName = getFormName(selectedClass.name);
      const today = new Date().toISOString().split('T')[0];
      
      // Prepare request body - Send the UUID as string
      const requestBody = {
        name: formData.name.trim(),
        reg_number: formData.regNumber.trim().toUpperCase(),
        class_id: selectedClass.id, // This should be the UUID string
        form: formName,
        enrollment_date: today
      };
      
      console.log('📤 SAVING LEARNER TO DATABASE');
      console.log('Selected Class:', selectedClass);
      console.log('Class ID (UUID):', requestBody.class_id);
      console.log('Request Body:', JSON.stringify(requestBody, null, 2));
      console.log('Token present:', !!token);
      
      const response = await api.post('/api/admin/learners', requestBody, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Registration response:', response.data);
      
      if (response.data.success) {
        const learner = response.data.learner;
        toast.success(`Learner ${learner.name} registered successfully!`);
        
        // Reset form
        setFormData({
          name: '',
          regNumber: generateRegNumber(),
          selectedClassId: '',
          selectedClassName: ''
        });
        
        if (onSuccess) onSuccess(learner);
      } else {
        toast.error(response.data.message || 'Registration failed');
      }
    } catch (error) {
      console.error('❌ Error registering learner:', error);
      
      if (error.response) {
        console.error('Error response data:', error.response.data);
        console.error('Error response status:', error.response.status);
        
        if (error.response.data.message) {
          toast.error(error.response.data.message);
        } else if (error.response.status === 400) {
          toast.error('Invalid data format. Please check all fields.');
        } else if (error.response.status === 409) {
          toast.error('Registration number already exists');
        } else if (error.response.status === 403) {
          toast.error('You do not have permission to register learners');
        } else if (error.response.status === 401) {
          toast.error('Please login again');
        } else {
          toast.error(`Registration failed: ${error.response.status}`);
        }
      } else if (error.request) {
        toast.error('No response from server. Please check your connection.');
      } else {
        toast.error(error.message || 'Registration failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [validateForm, formData, classes, generateRegNumber, onSuccess]);

  // Update learner
  const handleUpdate = useCallback(async () => {
    if (!selectedLearnerId) {
      toast.error('Please select a learner');
      return;
    }
    
    if (!validateForm()) return;
    
    if (selectedLearnerData) {
      const nameChanged = formData.name.trim() !== (selectedLearnerData.name || '').trim();
      const classChanged = formData.selectedClassId !== selectedLearnerData.class_id;
      
      if (!nameChanged && !classChanged) {
        toast.error('No changes detected');
        return;
      }
    }
    
    setIsLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      const requestBody = {};
      
      if (formData.name.trim() !== (selectedLearnerData.name || '').trim()) {
        requestBody.name = formData.name.trim();
      }
      
      if (formData.selectedClassId !== selectedLearnerData.class_id) {
        const selectedClass = classes.find(c => c.id === formData.selectedClassId);
        if (selectedClass) {
          requestBody.class_id = selectedClass.id;
          requestBody.form = getFormName(selectedClass.name);
        }
      }
      
      if (Object.keys(requestBody).length === 0) {
        toast.error('No changes to update');
        setIsLoading(false);
        return;
      }
      
      const response = await api.put(`/api/admin/learners/${selectedLearnerId}`, requestBody, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        toast.success('Learner updated successfully!');
        
        if (formData.selectedClassId) {
          await fetchLearnersForClass(formData.selectedClassId);
        }
        
        setSelectedLearnerId('');
        setSelectedLearnerData(null);
        setFormData(prev => ({ ...prev, name: '', regNumber: '' }));
        
        if (onSuccess) onSuccess();
      } else {
        toast.error(response.data.message || 'Update failed');
      }
    } catch (error) {
      console.error('Error updating learner:', error);
      toast.error(error.response?.data?.message || 'Update failed');
    } finally {
      setIsLoading(false);
    }
  }, [selectedLearnerId, selectedLearnerData, validateForm, formData, classes, fetchLearnersForClass, onSuccess]);

  // Handle mode switch
  const handleModeSwitch = useCallback((editMode) => {
    setIsEditMode(editMode);
    setFormData({
      name: '',
      regNumber: '',
      selectedClassId: '',
      selectedClassName: ''
    });
    setSelectedLearnerId('');
    setSelectedLearnerData(null);
    setLearners([]);
    setErrors({});
    
    if (!editMode) {
      handleGenerateRegNumber();
    }
  }, [handleGenerateRegNumber]);

  // Handle class selection
  const handleClassSelect = useCallback((classId) => {
    const selectedClass = classes.find(c => c.id === classId || c.id.toString() === classId);
    setFormData(prev => ({
      ...prev,
      selectedClassId: selectedClass?.id || classId,
      selectedClassName: selectedClass?.name || ''
    }));
    
    if (isEditMode) {
      fetchLearnersForClass(classId);
    } else {
      setLearners([]);
      setSelectedLearnerId('');
      setSelectedLearnerData(null);
      setFormData(prev => ({ ...prev, name: '' }));
      handleGenerateRegNumber();
    }
  }, [classes, isEditMode, fetchLearnersForClass, handleGenerateRegNumber]);

  // Input change handler
  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  }, [errors]);

  const ModeChip = ({ label, isEditMode: isEdit }) => (
    <button
      onClick={() => handleModeSwitch(isEdit)}
      className={`px-4 py-2 rounded-full text-xs font-bold transition ${
        isEditMode === isEdit
          ? 'bg-[#1A237E] text-white'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div>
      {/* Mode Toggle */}
      <div className="flex justify-end mb-6">
        <div className="flex gap-2 bg-gray-100 rounded-full p-1">
          <ModeChip label="ADD" isEditMode={false} />
          <ModeChip label="EDIT" isEditMode={true} />
        </div>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); isEditMode ? handleUpdate() : handleRegister(); }}>
        {/* Learner Identity Section */}
        <div className="mb-6">
          <h3 className="text-xs font-bold tracking-wider text-blue-600 mb-4 border-b border-gray-200 pb-2">
            LEARNER IDENTITY
          </h3>
          
          {/* Student Name Field */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2 text-gray-700">
              Student Full Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="e.g., John Doe"
              className={`w-full px-4 py-2.5 rounded-lg border focus:ring-2 focus:ring-[#00B0FF] focus:border-transparent transition ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.name && (
              <p className="text-xs text-red-500 mt-1">{errors.name}</p>
            )}
          </div>

          {/* Registration Number Field */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2 text-gray-700">
              {isEditMode ? 'Registration Number (read-only)' : 'Registration Number'}
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={formData.regNumber}
                onChange={(e) => handleInputChange('regNumber', e.target.value.toUpperCase())}
                placeholder="Auto-generated"
                readOnly={isEditMode}
                className={`flex-1 px-4 py-2.5 rounded-lg border focus:ring-2 focus:ring-[#00B0FF] focus:border-transparent transition ${
                  errors.regNumber ? 'border-red-500' : 'border-gray-300'
                } ${isEditMode ? 'bg-gray-50' : ''}`}
                style={{ fontFamily: 'monospace' }}
              />
              {!isEditMode && (
                <button
                  type="button"
                  onClick={handleGenerateRegNumber}
                  className="px-4 py-2.5 rounded-lg transition bg-gray-100 hover:bg-gray-200 text-gray-700"
                  title="Generate new registration number"
                >
                  🔄
                </button>
              )}
            </div>
            {!isEditMode && (
              <p className="text-xs text-gray-500 mt-1 italic">
                Format: FRM1-26-XXXX (Form 1, 2026) or FRM2-26-XXXX (Form 2, 2026)
              </p>
            )}
            {errors.regNumber && (
              <p className="text-xs text-red-500 mt-1">{errors.regNumber}</p>
            )}
          </div>
        </div>

        {/* Academic Placement Section */}
        <div className="mb-8">
          <h3 className="text-xs font-bold tracking-wider text-blue-600 mb-4 border-b border-gray-200 pb-2">
            ACADEMIC PLACEMENT
          </h3>

          {/* Class Dropdown */}
          {loadingClasses ? (
            <div className="flex justify-center py-4">
              <div className="w-6 h-6 border-2 border-[#00B0FF] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Assign Class *
              </label>
              <select
                value={formData.selectedClassId}
                onChange={(e) => handleClassSelect(e.target.value)}
                className={`w-full px-4 py-2.5 rounded-lg border focus:ring-2 focus:ring-[#00B0FF] focus:border-transparent transition ${
                  errors.classId ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select a class (required)</option>
                {classes.map((classItem) => (
                  <option key={classItem.id} value={classItem.id}>
                    {classItem.name} ({classItem.year})
                  </option>
                ))}
              </select>
              {errors.classId && (
                <p className="text-xs text-red-500 mt-1">{errors.classId}</p>
              )}
            </div>
          )}

          {/* Learner Dropdown (Edit Mode) */}
          {isEditMode && formData.selectedClassId && (
            <div className="mt-4">
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Select Learner to Edit
              </label>
              {loadingLearners ? (
                <div className="flex justify-center py-4">
                  <div className="w-6 h-6 border-2 border-[#00B0FF] border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                <select
                  value={selectedLearnerId}
                  onChange={(e) => handleLearnerSelect(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#00B0FF] focus:border-transparent transition"
                >
                  <option value="">Select a learner</option>
                  {learners.map((learner) => (
                    <option key={learner.id} value={learner.id}>
                      {learner.name} ({learner.reg_number})
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 rounded-lg font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: NAVY_PRIMARY }}
        >
          {isLoading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>{isEditMode ? 'UPDATING...' : 'REGISTERING...'}</span>
            </div>
          ) : (
            <span>{isEditMode ? 'UPDATE LEARNER' : 'COMPLETE REGISTRATION'}</span>
          )}
        </button>
      </form>
    </div>
  );
};

export default RegisterLearner;