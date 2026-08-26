import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  LockClosedIcon,
  ShieldCheckIcon,
  BuildingOfficeIcon,
  BeakerIcon,
  EyeIcon,
  EyeSlashIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

const inp = (err) => `w-full px-3 py-2.5 border rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#00B4D8] focus:border-[#00B4D8] transition ${err ? 'border-red-300 bg-red-50' : 'border-gray-200'}`;

const RegisterTeacher = ({ onSuccess }) => {
  const navigate = useNavigate();
  const [isLoading,              setIsLoading]              = useState(false);
  const [showPassword,           setShowPassword]           = useState(false);
  const [showConfirmPassword,    setShowConfirmPassword]    = useState(false);
  const [currentStep,            setCurrentStep]            = useState(1);
  const [errors,                 setErrors]                 = useState({});
  const [formData, setFormData] = useState({
    username: '', email: '', password: '', confirmPassword: '',
    department: '', specialization: '', phone: '', address: '',
  });

  const handleInputChange = useCallback((field, value) => {
    setFormData(p => ({ ...p, [field]: value }));
    if (errors[field]) setErrors(p => ({ ...p, [field]: null }));
  }, [errors]);

  const validateStep = useCallback((step) => {
    const errs = {};
    if (step === 1) {
      if (!formData.username.trim()) errs.username = 'Full name is required';
      if (!formData.email.trim())    errs.email    = 'Email is required';
      else if (!/\S+@\S+\.\S+/.test(formData.email)) errs.email = 'Enter a valid email';
    }
    if (step === 2) {
      if (!formData.password)                   errs.password        = 'Password is required';
      else if (formData.password.length < 6)    errs.password        = 'Minimum 6 characters';
      if (!formData.confirmPassword)            errs.confirmPassword = 'Please confirm your password';
      else if (formData.password !== formData.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }, [formData]);

  const canProceed = () => {
    if (currentStep === 1) return formData.username.trim() && /\S+@\S+\.\S+/.test(formData.email);
    if (currentStep === 2) return formData.password.length >= 6 && formData.password === formData.confirmPassword;
    return true;
  };

  const registerTeacher = useCallback(async () => {
    if (!validateStep(2)) return;
    setIsLoading(true);
    try {
      const res = await api.post('/api/admin/teachers', {
        username:       formData.username.trim(),
        email:          formData.email.trim().toLowerCase(),
        password:       formData.password,
        department:     formData.department.trim(),
        specialization: formData.specialization.trim(),
        phone:          formData.phone.trim(),
        address:        formData.address.trim(),
      });
      if (res.data.success) {
        toast.success('Teacher registered!');
        const goBack = window.confirm(
          `${formData.username} registered successfully.\nClick OK to return to the dashboard, or Cancel to add another.`
        );
        setFormData({ username: '', email: '', password: '', confirmPassword: '', department: '', specialization: '', phone: '', address: '' });
        setCurrentStep(1);
        if (goBack) { if (onSuccess) onSuccess(); else navigate('/admin'); }
      } else toast.error(res.data.message || 'Registration failed');
    } catch (err) {
      if      (err.response?.status === 409) toast.error('Username or email already exists');
      else if (err.response?.status === 401) toast.error('Authentication required. Please login again.');
      else toast.error(err.response?.data?.message || 'Registration failed');
    } finally { setIsLoading(false); }
  }, [validateStep, formData, onSuccess, navigate]);

  // ── step definitions ────────────────────────────────────────────────────────
  const steps = [
    { n: 1, label: 'Personal Info',       Icon: UserIcon         },
    { n: 2, label: 'Account Security',    Icon: LockClosedIcon   },
    { n: 3, label: 'Professional Details',Icon: BuildingOfficeIcon},
  ];

  // ── labelled input helper ───────────────────────────────────────────────────
  const Field = ({ label, field, type = 'text', placeholder, Icon: FieldIcon, required, autoFocus }) => {
    const isPass    = type === 'password';
    const showState = field === 'password' ? showPassword : showConfirmPassword;
    const toggle    = field === 'password' ? () => setShowPassword(p => !p) : () => setShowConfirmPassword(p => !p);
    return (
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">
          {label}{required && <span className="text-red-400 ml-0.5">*</span>}
        </label>
        <div className="relative">
          {FieldIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FieldIcon className="w-4 h-4 text-gray-400" />
            </div>
          )}
          <input
            type={isPass ? (showState ? 'text' : 'password') : type}
            value={formData[field]}
            onChange={e => handleInputChange(field, e.target.value)}
            placeholder={placeholder}
            autoFocus={autoFocus}
            className={`${inp(errors[field])} ${FieldIcon ? 'pl-9' : ''} ${isPass ? 'pr-10' : ''}`}
          />
          {isPass && (
            <button type="button" onClick={toggle}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition">
              {showState ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
            </button>
          )}
        </div>
        {errors[field] && <p className="text-xs text-red-500 mt-1">{errors[field]}</p>}
      </div>
    );
  };

  // ── render ──────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-xl mx-auto">
      {/* Step indicator */}
      <div className="flex items-center mb-6">
        {steps.map((s, i) => (
          <React.Fragment key={s.n}>
            <div className="flex flex-col items-center">
              <button onClick={() => { if (s.n <= currentStep) setCurrentStep(s.n); }}
                className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all ${
                  currentStep > s.n   ? 'bg-[#006770] border-[#006770] text-white' :
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

      {/* Step 1 — Personal Info */}
      {currentStep === 1 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100 bg-[#f0faf9]">
            <p className="text-xs font-bold text-[#006770] uppercase tracking-wide">Step 1 — Personal Information</p>
            <p className="text-[11px] text-gray-500 mt-0.5">Basic contact details for the teacher</p>
          </div>
          <div className="p-5 space-y-4">
            <Field label="Full Name"     field="username" placeholder="e.g., John Doe"          Icon={UserIcon}    required autoFocus />
            <Field label="Email Address" field="email"    placeholder="teacher@school.edu"       Icon={EnvelopeIcon} type="email" required />
            <Field label="Phone Number"  field="phone"    placeholder="+265 888 123 456"         Icon={PhoneIcon}   />
            <Field label="Address"       field="address"  placeholder="Physical address"         Icon={MapPinIcon}  />
          </div>
        </div>
      )}

      {/* Step 2 — Security */}
      {currentStep === 2 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100 bg-[#f0faf9]">
            <p className="text-xs font-bold text-[#006770] uppercase tracking-wide">Step 2 — Account Security</p>
            <p className="text-[11px] text-gray-500 mt-0.5">Create a secure login password</p>
          </div>
          <div className="p-5 space-y-4">
            <Field label="Password"         field="password"        type="password" placeholder="••••••••" Icon={LockClosedIcon}  required autoFocus />
            <Field label="Confirm Password" field="confirmPassword" type="password" placeholder="••••••••" Icon={ShieldCheckIcon} required />
            <div className="px-3 py-2 bg-[#f0faf9] rounded-lg border border-[#006770]/20 text-[11px] text-[#006770]">
              Password must be at least 6 characters long.
            </div>
          </div>
        </div>
      )}

      {/* Step 3 — Professional */}
      {currentStep === 3 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100 bg-[#f0faf9]">
            <p className="text-xs font-bold text-[#006770] uppercase tracking-wide">Step 3 — Professional Details</p>
            <p className="text-[11px] text-gray-500 mt-0.5">Department and teaching specialization (optional)</p>
          </div>
          <div className="p-5 space-y-4">
            <Field label="Department"     field="department"     placeholder="e.g., Mathematics, Science" Icon={BuildingOfficeIcon} />
            <Field label="Specialization" field="specialization" placeholder="e.g., Physics, Algebra"     Icon={BeakerIcon}         />
            {/* Summary */}
            <div className="p-4 bg-[#f0faf9] rounded-lg border border-[#006770]/20 space-y-2">
              <p className="text-[10px] font-bold text-[#006770] uppercase tracking-wide">Registration Summary</p>
              {[
                ['Name',           formData.username],
                ['Email',          formData.email],
                ['Department',     formData.department     || 'Not specified'],
                ['Specialization', formData.specialization || 'Not specified'],
              ].map(([label, val]) => (
                <div key={label} className="flex justify-between text-xs border-b border-[#006770]/10 py-1 last:border-0">
                  <span className="text-gray-400">{label}</span>
                  <span className="font-semibold text-[#003B46]">{val || '—'}</span>
                </div>
              ))}
            </div>
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
          <button type="button"
            onClick={() => { if (validateStep(currentStep)) setCurrentStep(p => p + 1); }}
            disabled={!canProceed()}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-[#006770] text-white rounded-lg text-sm font-semibold hover:bg-[#005a62] transition disabled:opacity-40">
            Continue <ArrowRightIcon className="w-4 h-4" />
          </button>
        ) : (
          <button type="button" onClick={registerTeacher} disabled={isLoading}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-[#006770] text-white rounded-lg text-sm font-semibold hover:bg-[#005a62] transition disabled:opacity-40">
            {isLoading
              ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Registering…</>
              : 'Register Teacher'}
          </button>
        )}
      </div>
    </div>
  );
};

export default RegisterTeacher;
