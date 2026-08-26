import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  AcademicCapIcon,
  IdentificationIcon,
  UserIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  PencilSquareIcon,
  PlusCircleIcon,
} from '@heroicons/react/24/outline';

const inp = 'w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#00B4D8] focus:border-[#00B4D8] transition';
const TEAL = '#006770';
const AZURE = '#00B4D8';

const RegisterLearner = ({ onSuccess }) => {
  const [isEditMode,          setIsEditMode]          = useState(false);
  const [isLoading,           setIsLoading]           = useState(false);
  const [loadingClasses,      setLoadingClasses]      = useState(true);
  const [loadingLearners,     setLoadingLearners]     = useState(false);
  const [currentStep,         setCurrentStep]         = useState(1);
  const [classes,             setClasses]             = useState([]);
  const [learners,            setLearners]            = useState([]);
  const [selectedLearnerId,   setSelectedLearnerId]   = useState('');
  const [selectedLearnerData, setSelectedLearnerData] = useState(null);
  const [errors,              setErrors]              = useState({});
  const [formData, setFormData] = useState({ name: '', regNumber: '', selectedClassId: '', selectedClassName: '' });

  useEffect(() => { fetchClasses(); }, []);

  // ── reg number generation ──────────────────────────────────────────────────
  const generateRandomString = (len = 4) => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789';
    return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  };

  const getFormPrefix = (className) => {
    const lower = (className || '').toLowerCase();
    const yr    = new Date().getFullYear().toString().slice(-2);
    const match = lower.match(/form\s*(\d+)/i);
    if (match) return `FRM${match[1]}-${yr}`;
    return `STU-${yr}`;
  };

  const generateRegNumber = useCallback(() => {
    if (!formData.selectedClassName) return `STU-${new Date().getFullYear().toString().slice(-2)}-${generateRandomString()}`;
    return `${getFormPrefix(formData.selectedClassName)}-${generateRandomString()}`;
  }, [formData.selectedClassName]);

  const handleGenerateRegNumber = useCallback(() => {
    setFormData(p => ({ ...p, regNumber: generateRegNumber() }));
  }, [generateRegNumber]);

  // ── data fetching ──────────────────────────────────────────────────────────
  const fetchClasses = async () => {
    setLoadingClasses(true);
    try {
      const token = localStorage.getItem('token');
      const res = await api.get('/api/admin/classes', { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.success)      setClasses(res.data.classes || []);
      else if (Array.isArray(res.data)) setClasses(res.data);
      else { toast.error('Failed to load classes'); setClasses([]); }
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to load classes'); setClasses([]); }
    finally { setLoadingClasses(false); }
  };

  const fetchLearnersForClass = useCallback(async (classId) => {
    if (!classId) return;
    setLoadingLearners(true);
    setLearners([]); setSelectedLearnerId(''); setSelectedLearnerData(null);
    setFormData(p => ({ ...p, name: '', regNumber: '' }));
    try {
      const token = localStorage.getItem('token');
      const res = await api.get('/api/admin/learners', { headers: { Authorization: `Bearer ${token}` } });
      let all = res.data.success ? (res.data.learners || []) : (Array.isArray(res.data) ? res.data : []);
      setLearners(all.filter(l => String(l.class_id) === String(classId)));
    } catch { setLearners([]); }
    finally { setLoadingLearners(false); }
  }, []);

  // ── form helpers ───────────────────────────────────────────────────────────
  const getFormName = (className) => {
    const match = (className || '').match(/Form\s*(\d+)/i);
    return match ? `Form ${match[1]}` : 'Form 1';
  };

  const handleClassSelect = useCallback((classId) => {
    const cls = classes.find(c => String(c.id) === String(classId));
    setFormData(p => ({ ...p, selectedClassId: cls?.id || classId, selectedClassName: cls?.name || '' }));
    if (errors.classId) setErrors(p => ({ ...p, classId: null }));
    if (isEditMode) fetchLearnersForClass(classId);
    else { setLearners([]); setTimeout(handleGenerateRegNumber, 0); }
  }, [classes, isEditMode, fetchLearnersForClass, handleGenerateRegNumber, errors]);

  const handleLearnerSelect = useCallback((learnerId) => {
    if (!learnerId) { setSelectedLearnerId(''); setSelectedLearnerData(null); setFormData(p => ({ ...p, name: '', regNumber: '' })); return; }
    const l = learners.find(l => String(l.id) === String(learnerId));
    if (l) { setSelectedLearnerId(learnerId); setSelectedLearnerData(l); setFormData(p => ({ ...p, name: l.name || '', regNumber: l.reg_number || '' })); }
  }, [learners]);

  const handleModeSwitch = useCallback((editMode) => {
    setIsEditMode(editMode);
    setFormData({ name: '', regNumber: '', selectedClassId: '', selectedClassName: '' });
    setSelectedLearnerId(''); setSelectedLearnerData(null); setLearners([]); setErrors({}); setCurrentStep(1);
    if (!editMode) setTimeout(handleGenerateRegNumber, 50);
  }, [handleGenerateRegNumber]);

  const handleInputChange = useCallback((field, value) => {
    setFormData(p => ({ ...p, [field]: value }));
    if (errors[field]) setErrors(p => ({ ...p, [field]: null }));
  }, [errors]);

  // ── validation ─────────────────────────────────────────────────────────────
  const validateStep = useCallback((step) => {
    const errs = {};
    if (step === 1 && !formData.selectedClassId) errs.classId = 'Please select a class';
    if (step === 2 && !isEditMode && !formData.regNumber.trim()) errs.regNumber = 'Registration number is required';
    if (step === 3 && !formData.name.trim()) errs.name = 'Student name is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }, [formData, isEditMode]);

  const canProceed = () => {
    if (currentStep === 1) return !!formData.selectedClassId;
    if (currentStep === 2) return !!formData.regNumber;
    if (currentStep === 3) return !!formData.name;
    return false;
  };

  // ── register ───────────────────────────────────────────────────────────────
  const handleRegister = useCallback(async () => {
    if (!validateStep(3)) return;
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const cls = classes.find(c => String(c.id) === String(formData.selectedClassId));
      if (!cls) { toast.error('Selected class not found'); setIsLoading(false); return; }
      const res = await api.post('/api/admin/learners', {
        name: formData.name.trim(),
        reg_number: formData.regNumber.trim().toUpperCase(),
        class_id: cls.id,
        form: getFormName(cls.name),
        enrollment_date: new Date().toISOString().split('T')[0],
      }, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } });
      if (res.data.success) {
        toast.success(`${res.data.learner.name} registered!`);
        setFormData({ name: '', regNumber: '', selectedClassId: '', selectedClassName: '' });
        setCurrentStep(1);
        if (onSuccess) onSuccess(res.data.learner);
      } else toast.error(res.data.message || 'Registration failed');
    } catch (err) {
      const status = err.response?.status;
      if      (status === 409) toast.error('Registration number already exists');
      else if (status === 403) toast.error('You do not have permission');
      else if (status === 401) toast.error('Please login again');
      else toast.error(err.response?.data?.message || 'Registration failed');
    } finally { setIsLoading(false); }
  }, [validateStep, formData, classes, onSuccess]);

  // ── update ─────────────────────────────────────────────────────────────────
  const handleUpdate = useCallback(async () => {
    if (!selectedLearnerId || !validateStep(3)) return;
    const nameChanged  = formData.name.trim() !== (selectedLearnerData?.name || '').trim();
    const classChanged = String(formData.selectedClassId) !== String(selectedLearnerData?.class_id);
    if (!nameChanged && !classChanged) { toast.error('No changes detected'); return; }
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const body = {};
      if (nameChanged)  body.name     = formData.name.trim();
      if (classChanged) {
        const cls = classes.find(c => String(c.id) === String(formData.selectedClassId));
        if (cls) { body.class_id = cls.id; body.form = getFormName(cls.name); }
      }
      const res = await api.put(`/api/admin/learners/${selectedLearnerId}`, body, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.success) {
        toast.success('Learner updated!');
        if (formData.selectedClassId) await fetchLearnersForClass(formData.selectedClassId);
        setSelectedLearnerId(''); setSelectedLearnerData(null);
        setFormData(p => ({ ...p, name: '', regNumber: '' }));
        setCurrentStep(1);
        if (onSuccess) onSuccess();
      } else toast.error(res.data.message || 'Update failed');
    } catch (err) { toast.error(err.response?.data?.message || 'Update failed'); }
    finally { setIsLoading(false); }
  }, [selectedLearnerId, selectedLearnerData, validateStep, formData, classes, fetchLearnersForClass, onSuccess]);

  // ── step indicator ─────────────────────────────────────────────────────────
  const steps = [
    { n: 1, label: 'Class',        Icon: AcademicCapIcon    },
    { n: 2, label: 'Reg Number',   Icon: IdentificationIcon },
    { n: 3, label: 'Student Info', Icon: UserIcon           },
  ];

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-xl mx-auto">
      {/* Mode toggle */}
      <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-xl">
        {[{ edit: false, Icon: PlusCircleIcon, label: 'Add New' }, { edit: true, Icon: PencilSquareIcon, label: 'Edit Existing' }].map(({ edit, Icon, label }) => (
          <button key={String(edit)} onClick={() => handleModeSwitch(edit)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all ${
              isEditMode === edit ? 'bg-[#006770] text-white shadow-sm' : 'text-gray-500 hover:text-[#006770]'
            }`}>
            <Icon className="w-4 h-4" />{label}
          </button>
        ))}
      </div>

      {/* Step indicator */}
      <div className="flex items-center mb-6">
        {steps.map((s, i) => (
          <React.Fragment key={s.n}>
            <div className="flex flex-col items-center">
              <button onClick={() => { if (s.n <= currentStep) setCurrentStep(s.n); }}
                className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all ${
                  currentStep > s.n  ? 'bg-[#006770] border-[#006770] text-white' :
                  currentStep === s.n ? 'bg-white border-[#006770] text-[#006770]' :
                                        'bg-white border-gray-200 text-gray-300'
                }`}>
                {currentStep > s.n
                  ? <CheckCircleIcon className="w-5 h-5" />
                  : <s.Icon className="w-4 h-4" />}
              </button>
              <span className={`text-[10px] mt-1 font-semibold ${currentStep >= s.n ? 'text-[#006770]' : 'text-gray-300'}`}>{s.label}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-px mx-2 mb-4 transition-all ${currentStep > s.n ? 'bg-[#006770]' : 'bg-gray-200'}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step 1 — Class */}
      {currentStep === 1 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100 bg-[#f0faf9]">
            <p className="text-xs font-bold text-[#006770] uppercase tracking-wide">Step 1 — Academic Placement</p>
            <p className="text-[11px] text-gray-500 mt-0.5">Select the class for this student</p>
          </div>
          <div className="p-5 space-y-4">
            {loadingClasses ? (
              <div className="flex justify-center py-6"><div className="w-6 h-6 border-4 border-[#006770] border-t-transparent rounded-full animate-spin" /></div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {classes.map(cls => (
                  <button key={cls.id} type="button"
                    onClick={() => handleClassSelect(cls.id)}
                    className={`px-3 py-2.5 rounded-lg border text-sm font-medium transition-all text-left ${
                      String(formData.selectedClassId) === String(cls.id)
                        ? 'bg-[#006770] text-white border-[#006770] shadow-sm'
                        : 'bg-white text-gray-700 border-gray-200 hover:border-[#006770]/50 hover:bg-[#f0faf9]'
                    }`}>
                    {cls.name}
                    <span className={`block text-[10px] mt-0.5 ${String(formData.selectedClassId) === String(cls.id) ? 'text-white/70' : 'text-gray-400'}`}>{cls.year}</span>
                  </button>
                ))}
              </div>
            )}
            {errors.classId && <p className="text-xs text-red-500">{errors.classId}</p>}

            {/* Edit mode: learner picker */}
            {isEditMode && formData.selectedClassId && (
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Select Learner to Edit</label>
                {loadingLearners ? (
                  <div className="flex justify-center py-3"><div className="w-5 h-5 border-4 border-[#006770] border-t-transparent rounded-full animate-spin" /></div>
                ) : learners.length === 0 ? (
                  <p className="text-xs text-gray-400">No learners in this class.</p>
                ) : (
                  <select value={selectedLearnerId} onChange={e => handleLearnerSelect(e.target.value)} className={inp}>
                    <option value="">Select a learner…</option>
                    {learners.map(l => <option key={l.id} value={l.id}>{l.name} — {l.reg_number}</option>)}
                  </select>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step 2 — Registration number */}
      {currentStep === 2 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100 bg-[#f0faf9]">
            <p className="text-xs font-bold text-[#006770] uppercase tracking-wide">Step 2 — Registration Number</p>
            <p className="text-[11px] text-gray-500 mt-0.5">Auto-generated based on class. You can regenerate.</p>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Registration Number *</label>
              <div className="flex gap-2">
                <input type="text" value={formData.regNumber}
                  onChange={e => handleInputChange('regNumber', e.target.value)}
                  readOnly={isEditMode}
                  placeholder="e.g., FRM1-25-A3B7"
                  className={`${inp} flex-1 font-mono ${isEditMode ? 'bg-gray-50 text-gray-400' : ''}`} />
                {!isEditMode && (
                  <button type="button" onClick={handleGenerateRegNumber}
                    className="px-3 py-2 bg-[#006770]/10 text-[#006770] rounded-lg hover:bg-[#006770]/20 transition flex-shrink-0" title="Regenerate">
                    <ArrowPathIcon className="w-4 h-4" />
                  </button>
                )}
              </div>
              {errors.regNumber && <p className="text-xs text-red-500 mt-1">{errors.regNumber}</p>}
              {!isEditMode && (
                <p className="text-[11px] text-gray-400 mt-1.5">Initial login password = registration number</p>
              )}
            </div>
            {formData.selectedClassName && (
              <div className="flex items-center gap-2 text-xs text-[#006770] bg-[#f0faf9] px-3 py-2 rounded-lg">
                <AcademicCapIcon className="w-4 h-4 flex-shrink-0" />
                <span>Class: <strong>{formData.selectedClassName}</strong></span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step 3 — Name */}
      {currentStep === 3 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100 bg-[#f0faf9]">
            <p className="text-xs font-bold text-[#006770] uppercase tracking-wide">Step 3 — Student Information</p>
            <p className="text-[11px] text-gray-500 mt-0.5">Enter the student's full name</p>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Full Name *</label>
              <input type="text" value={formData.name} autoFocus
                onChange={e => handleInputChange('name', e.target.value)}
                placeholder="e.g., John Banda"
                className={`${inp} ${errors.name ? 'border-red-300 bg-red-50' : ''}`} />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
            </div>
            {/* Summary */}
            {formData.name && (
              <div className="p-4 bg-[#f0faf9] rounded-lg border border-[#006770]/20 space-y-2">
                <p className="text-[10px] font-bold text-[#006770] uppercase tracking-wide">Summary</p>
                {[['Class', formData.selectedClassName], ['Reg #', formData.regNumber], ['Name', formData.name]].map(([l, v]) => (
                  <div key={l} className="flex justify-between text-xs">
                    <span className="text-gray-400">{l}</span>
                    <span className="font-semibold text-[#003B46]">{v || '—'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-3 mt-5">
        {currentStep > 1 && (
          <button type="button" onClick={() => setCurrentStep(p => p - 1)}
            className="flex items-center gap-1.5 px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition">
            <ArrowLeftIcon className="w-4 h-4" /> Back
          </button>
        )}
        {currentStep < 3 ? (
          <button type="button" onClick={() => { if (validateStep(currentStep)) setCurrentStep(p => p + 1); }}
            disabled={!canProceed()}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-[#006770] text-white rounded-lg text-sm font-semibold hover:bg-[#005a62] transition disabled:opacity-40">
            Continue <ArrowRightIcon className="w-4 h-4" />
          </button>
        ) : (
          <button type="button"
            onClick={isEditMode ? handleUpdate : handleRegister}
            disabled={isLoading || !canProceed()}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-[#006770] text-white rounded-lg text-sm font-semibold hover:bg-[#005a62] transition disabled:opacity-40">
            {isLoading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Processing…</> : isEditMode ? 'Save Changes' : 'Register Learner'}
          </button>
        )}
      </div>
    </div>
  );
};

export default RegisterLearner;
