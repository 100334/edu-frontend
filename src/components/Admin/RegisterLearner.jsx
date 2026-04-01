import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';

// Theme constants
const NAVY_PRIMARY = '#1A237E';
const NAVY_DARK = '#0D1240';
const AZURE_ACCENT = '#00B0FF';
const GOLD_ACCENT = '#c9933a';

const RegisterLearner = ({ onSuccess }) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingLearners, setLoadingLearners] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  
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

  // Generate registration number based on selected class
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
      const response = await api.get(`/api/admin/learners`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('All learners response:', response.data);
      
      let allLearners = [];
      if (response.data.success) {
        allLearners = response.data.learners || [];
      } else if (Array.isArray(response.data)) {
        allLearners = response.data;
      }
      
      const filteredLearners = allLearners.filter(learner => 
        learner.class_id === classId || learner.class_id?.toString() === classId.toString()
      );
      
      setLearners(filteredLearners);
      console.log(`Found ${filteredLearners.length} learners for class ${classId}`);
      
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

  // Validate current step
  const validateStep = useCallback((step) => {
    const newErrors = {};
    
    if (step === 1) {
      if (!formData.selectedClassId) {
        newErrors.classId = 'Please select a class';
      }
    } else if (step === 2) {
      if (!isEditMode && !formData.regNumber.trim()) {
        newErrors.regNumber = 'Registration number is required';
      }
    } else if (step === 3) {
      if (!formData.name.trim()) {
        newErrors.name = 'Student name is required';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData.selectedClassId, formData.regNumber, formData.name, isEditMode]);

  // Handle next step
  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 3));
    }
  };

  // Handle previous step
  const handlePrevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

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

  // Register learner
  const handleRegister = useCallback(async () => {
    if (!validateStep(3)) return;
    
    setIsLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      
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
      
      const requestBody = {
        name: formData.name.trim(),
        reg_number: formData.regNumber.trim().toUpperCase(),
        class_id: selectedClass.id,
        form: formName,
        enrollment_date: today
      };
      
      console.log('📤 SAVING LEARNER TO DATABASE');
      console.log('Selected Class:', selectedClass);
      console.log('Class ID (UUID):', requestBody.class_id);
      console.log('Request Body:', JSON.stringify(requestBody, null, 2));
      
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
        
        setFormData({
          name: '',
          regNumber: '',
          selectedClassId: '',
          selectedClassName: ''
        });
        setCurrentStep(1);
        
        if (onSuccess) onSuccess(learner);
      } else {
        toast.error(response.data.message || 'Registration failed');
      }
    } catch (error) {
      console.error('❌ Error registering learner:', error);
      
      if (error.response) {
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
  }, [validateStep, formData, classes, onSuccess]);

  // Update learner
  const handleUpdate = useCallback(async () => {
    if (!selectedLearnerId) {
      toast.error('Please select a learner');
      return;
    }
    
    if (!validateStep(3)) return;
    
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
        setCurrentStep(1);
        
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
  }, [selectedLearnerId, selectedLearnerData, validateStep, formData, classes, fetchLearnersForClass, onSuccess]);

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
    setCurrentStep(1);
    
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
      setTimeout(() => {
        handleGenerateRegNumber();
      }, 0);
    }
    
    // Clear class error if exists
    if (errors.classId) {
      setErrors(prev => ({ ...prev, classId: null }));
    }
  }, [classes, isEditMode, fetchLearnersForClass, handleGenerateRegNumber, errors]);

  // Input change handler
  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  }, [errors]);

  const getFormGradient = (form) => {
    const gradients = {
      'Form 1': 'from-emerald-500 to-emerald-600',
      'Form 2': 'from-sky-500 to-sky-600',
      'Form 3': 'from-amber-500 to-amber-600',
      'Form 4': 'from-purple-500 to-purple-600'
    };
    return gradients[form] || 'from-gray-500 to-gray-600';
  };

  const ModeChip = ({ label, isEdit: isEdit }) => (
    <button
      onClick={() => handleModeSwitch(isEdit)}
      className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
        isEditMode === isEdit
          ? `bg-gradient-to-r ${getFormGradient('Form 1')} text-white shadow-lg transform scale-105`
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:shadow-md'
      }`}
    >
      {label}
    </button>
  );

  const steps = [
    { number: 1, title: 'Academic Placement', icon: '🏫', color: 'amber' },
    { number: 2, title: 'Registration Number', icon: '🔢', color: 'blue' },
    { number: 3, title: 'Student Information', icon: '👤', color: 'purple' }
  ];

  const canProceed = () => {
    if (currentStep === 1) return !!formData.selectedClassId;
    if (currentStep === 2) return !!formData.regNumber;
    if (currentStep === 3) return !!formData.name;
    return false;
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-[#0f1923] via-[#1a2d3f] to-[#0f1923] rounded-2xl p-6 mb-8 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-[#c9933a]/20 rounded-2xl flex items-center justify-center">
            <span className="text-3xl">🎓</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">
              {isEditMode ? 'Edit Learner Information' : 'Register New Learner'}
            </h2>
            <p className="text-gray-300 text-sm mt-1">
              {isEditMode 
                ? 'Update student details and academic placement' 
                : 'Enroll a new student into the system'}
            </p>
          </div>
        </div>
      </div>

      {/* Mode Toggle */}
      <div className="flex justify-center mb-8">
        <div className="bg-gray-100 rounded-2xl p-1 flex gap-2 shadow-inner">
          <ModeChip label="➕ ADD NEW" isEdit={false} />
          <ModeChip label="✏️ EDIT EXISTING" isEdit={true} />
        </div>
      </div>

      {/* Step Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step) => (
            <div key={step.number} className="flex-1 relative">
              <div className="flex flex-col items-center">
                <button
                  onClick={() => {
                    if (step.number <= currentStep || validateStep(currentStep)) {
                      setCurrentStep(step.number);
                    }
                  }}
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                    currentStep >= step.number
                      ? `bg-gradient-to-r ${getFormGradient('Form 1')} text-white shadow-lg`
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {step.number}
                </button>
                <p className="text-xs font-medium mt-2 text-gray-600">{step.title}</p>
              </div>
              {step.number < 3 && (
                <div className={`absolute top-5 left-1/2 w-full h-0.5 -translate-y-1/2 ${
                  currentStep > step.number ? 'bg-[#c9933a]' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); }}>
        {/* Step 1: ACADEMIC PLACEMENT */}
        {currentStep === 1 && (
          <div className="bg-white rounded-2xl shadow-md mb-6 overflow-hidden border border-gray-100 animate-in fade-in slide-in-from-left-5 duration-300">
            <div className="bg-gradient-to-r from-amber-50 to-yellow-50 px-6 py-4 border-b border-gray-200">
              <h3 className="text-sm font-bold text-amber-800 uppercase tracking-wider flex items-center gap-2">
                <span>🏫</span> STEP 1: ACADEMIC PLACEMENT
              </h3>
              <p className="text-xs text-amber-600 mt-1">Select the class to determine registration format</p>
            </div>
            
            <div className="p-6">
              {loadingClasses ? (
                <div className="flex justify-center py-8">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-8 h-8 border-3 border-[#c9933a] border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-xs text-gray-500">Loading classes...</p>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Assign Class <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={formData.selectedClassId}
                      onChange={(e) => handleClassSelect(e.target.value)}
                      className={`w-full px-4 py-3 pl-11 rounded-xl border focus:ring-2 focus:ring-[#c9933a] focus:border-transparent transition appearance-none bg-white ${
                        errors.classId ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <option value="">Select a class (required)</option>
                      {classes.map((classItem) => (
                        <option key={classItem.id} value={classItem.id}>
                          {classItem.name} ({classItem.year}) - {classItem.learner_count || 0} students
                        </option>
                      ))}
                    </select>
                    <span className="absolute left-3 top-3.5 text-gray-400">📚</span>
                    <span className="absolute right-3 top-3.5 text-gray-400">▼</span>
                  </div>
                  {errors.classId && (
                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                      <span>⚠️</span> {errors.classId}
                    </p>
                  )}
                  {formData.selectedClassName && !isEditMode && (
                    <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                      <span>✅</span> Registration number will be formatted for {formData.selectedClassName}
                    </p>
                  )}
                </div>
              )}

              {/* Learner Dropdown (Edit Mode) */}
              {isEditMode && formData.selectedClassId && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Select Learner to Edit
                  </label>
                  {loadingLearners ? (
                    <div className="flex justify-center py-6">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-6 h-6 border-2 border-[#c9933a] border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-xs text-gray-500">Loading learners...</p>
                      </div>
                    </div>
                  ) : learners.length > 0 ? (
                    <div className="relative">
                      <select
                        value={selectedLearnerId}
                        onChange={(e) => handleLearnerSelect(e.target.value)}
                        className="w-full px-4 py-3 pl-11 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#c9933a] focus:border-transparent transition appearance-none bg-white"
                      >
                        <option value="">Select a learner</option>
                        {learners.map((learner) => (
                          <option key={learner.id} value={learner.id}>
                            {learner.name} ({learner.reg_number})
                          </option>
                        ))}
                      </select>
                      <span className="absolute left-3 top-3.5 text-gray-400">👥</span>
                      <span className="absolute right-3 top-3.5 text-gray-400">▼</span>
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-gray-50 rounded-xl border border-gray-200">
                      <span className="text-3xl mb-2 block">📭</span>
                      <p className="text-sm text-gray-500">No learners found in this class</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 2: REGISTRATION NUMBER */}
        {currentStep === 2 && (
          <div className="bg-white rounded-2xl shadow-md mb-6 overflow-hidden border border-gray-100 animate-in fade-in slide-in-from-right-5 duration-300">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
              <h3 className="text-sm font-bold text-blue-800 uppercase tracking-wider flex items-center gap-2">
                <span>🔢</span> STEP 2: REGISTRATION NUMBER
              </h3>
              <p className="text-xs text-blue-600 mt-1">Auto-generated based on selected class</p>
            </div>
            
            <div className="p-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {isEditMode ? 'Registration Number (Read-only)' : 'Registration Number'}
                </label>
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={formData.regNumber}
                      onChange={(e) => handleInputChange('regNumber', e.target.value.toUpperCase())}
                      placeholder="Select a class first to generate number"
                      readOnly={isEditMode}
                      className={`w-full px-4 py-3 pl-11 rounded-xl border focus:ring-2 focus:ring-[#c9933a] focus:border-transparent transition font-mono ${
                        errors.regNumber ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                      } ${isEditMode ? 'bg-gray-50 text-gray-600' : ''} ${!formData.selectedClassId && !isEditMode ? 'bg-gray-50 text-gray-400' : ''}`}
                    />
                    <span className="absolute left-3 top-3.5 text-gray-400">🆔</span>
                  </div>
                  {!isEditMode && formData.selectedClassId && (
                    <button
                      type="button"
                      onClick={handleGenerateRegNumber}
                      className="px-4 py-3 rounded-xl bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700 transition-all duration-300 font-medium flex items-center gap-2"
                      title="Generate new registration number"
                    >
                      <span>🔄</span> Generate
                    </button>
                  )}
                </div>
                {!isEditMode && formData.selectedClassId && (
                  <div className="mt-2 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                    <p className="text-xs text-green-700 flex items-center gap-2">
                      <span>💡</span>
                      <span>Format: <strong className="font-mono">{getFormPrefix(formData.selectedClassName)}-XXXX</strong> where XXXX is a unique 4-character code</span>
                    </p>
                  </div>
                )}
                {!isEditMode && !formData.selectedClassId && (
                  <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                    <span>⚠️</span> Please select a class first to generate the registration number
                  </p>
                )}
                {errors.regNumber && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <span>⚠️</span> {errors.regNumber}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: STUDENT NAME */}
        {currentStep === 3 && (
          <div className="bg-white rounded-2xl shadow-md mb-8 overflow-hidden border border-gray-100 animate-in fade-in slide-in-from-right-5 duration-300">
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-6 py-4 border-b border-gray-200">
              <h3 className="text-sm font-bold text-purple-800 uppercase tracking-wider flex items-center gap-2">
                <span>👤</span> STEP 3: STUDENT INFORMATION
              </h3>
              <p className="text-xs text-purple-600 mt-1">Enter the learner's full name</p>
            </div>
            
            <div className="p-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Student Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter full name (e.g., John Doe)"
                    className={`w-full px-4 py-3 pl-11 rounded-xl border focus:ring-2 focus:ring-[#c9933a] focus:border-transparent transition ${
                      errors.name ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    autoFocus={!!formData.selectedClassId && !!formData.regNumber}
                  />
                  <span className="absolute left-3 top-3.5 text-gray-400">📝</span>
                </div>
                {errors.name && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <span>⚠️</span> {errors.name}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                  <span>ℹ️</span> This will be the username used for login
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex gap-3 mt-4">
          {currentStep > 1 && (
            <button
              type="button"
              onClick={handlePrevStep}
              className="flex-1 py-3 rounded-xl font-semibold transition-all duration-300 bg-gray-100 text-gray-700 hover:bg-gray-200"
            >
              ← Back
            </button>
          )}
          
          {currentStep < 3 ? (
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
              type="button"
              onClick={isEditMode ? handleUpdate : handleRegister}
              disabled={isLoading || !canProceed()}
              className="flex-1 py-3 rounded-xl font-bold text-white transition-all duration-300 hover:shadow-lg hover:scale-[1.02] active:scale-100 disabled:opacity-50 disabled:hover:scale-100 relative overflow-hidden group"
              style={{ 
                background: `linear-gradient(135deg, ${NAVY_PRIMARY}, ${NAVY_DARK})`
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
              {isLoading ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>{isEditMode ? 'UPDATING...' : 'REGISTERING...'}</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <span>{isEditMode ? '✏️' : '✅'}</span>
                  <span>{isEditMode ? 'UPDATE LEARNER' : 'COMPLETE REGISTRATION'}</span>
                  <span>→</span>
                </div>
              )}
            </button>
          )}
        </div>

        {/* Registration Summary Card (only shows on step 3 when all fields are filled) */}
        {!isEditMode && currentStep === 3 && formData.selectedClassId && formData.regNumber && formData.name && (
          <div className="mt-6 p-5 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-xl">📋</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-green-800">Registration Summary</p>
                <div className="mt-2 space-y-1">
                  <p className="text-xs text-green-700">
                    <span className="font-semibold">Class:</span> {formData.selectedClassName}
                  </p>
                  <p className="text-xs text-green-700">
                    <span className="font-semibold">Registration Number:</span> <code className="bg-white px-2 py-0.5 rounded font-mono">{formData.regNumber}</code>
                  </p>
                  <p className="text-xs text-green-700">
                    <span className="font-semibold">Student Name:</span> {formData.name}
                  </p>
                </div>
                <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                  <span>🔐</span> Initial login password will be the registration number
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Info Note */}
        <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
          <div className="flex items-start gap-3">
            <span className="text-lg">ℹ️</span>
            <div className="flex-1">
              <p className="text-xs text-gray-600 font-medium">Registration Process</p>
              <p className="text-xs text-gray-500 mt-1">
                Step 1: Select the learner's class → Registration number auto-generates based on class format<br/>
                Step 2: Registration number can be regenerated if needed<br/>
                Step 3: Enter the student's full name (this will be their username)<br/>
                Step 4: Complete registration
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default RegisterLearner;