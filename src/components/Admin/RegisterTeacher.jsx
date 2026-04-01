import React, { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';

// Theme constants
const NAVY_PRIMARY = '#1A237E';
const NAVY_DARK = '#0D1240';
const AZURE_ACCENT = '#00B0FF';
const GOLD_ACCENT = '#c9933a';
const ICE_WHITE = '#F4F7FA';

const RegisterTeacher = ({ onSuccess }) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    department: '',
    specialization: '',
    phone: '',
    address: ''
  });
  const [errors, setErrors] = useState({});

  // Validate current step
  const validateStep = useCallback((step) => {
    const newErrors = {};

    if (step === 1) {
      if (!formData.username.trim()) {
        newErrors.username = 'Full name is required';
      }
      if (!formData.email.trim()) {
        newErrors.email = 'Email is required';
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = 'Enter a valid email address';
      }
    } else if (step === 2) {
      if (!formData.password) {
        newErrors.password = 'Password is required';
      } else if (formData.password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters';
      }
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Please confirm your password';
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    } else if (step === 3) {
      // Professional details are optional, no validation needed
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // Handle next step
  const handleNextStep = useCallback(() => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 3));
      // Clear errors for next step
      setErrors({});
    }
  }, [validateStep, currentStep]);

  // Handle previous step
  const handlePrevStep = useCallback(() => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    // Clear errors when going back
    setErrors({});
  }, []);

  // Check if current step can proceed
  const canProceed = useCallback(() => {
    if (currentStep === 1) {
      return formData.username.trim() && formData.email.trim() && 
             /\S+@\S+\.\S+/.test(formData.email);
    }
    if (currentStep === 2) {
      return formData.password && formData.password.length >= 6 && 
             formData.confirmPassword && formData.password === formData.confirmPassword;
    }
    return true;
  }, [currentStep, formData.username, formData.email, formData.password, formData.confirmPassword]);

  // Show success dialog
  const showSuccessDialog = useCallback((teacherData) => {
    const confirm = window.confirm(
      `Registration Successful!\n\nTeacher ${formData.username} has been added successfully.\n\n` +
      `Email: ${formData.email}\n` +
      `${formData.department ? `Department: ${formData.department}\n` : ''}` +
      `${formData.specialization ? `Specialization: ${formData.specialization}` : ''}\n\n` +
      `Click OK to return to dashboard or Cancel to add another teacher`
    );

    if (confirm) {
      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/admin');
      }
    } else {
      setFormData({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        department: '',
        specialization: '',
        phone: '',
        address: ''
      });
      setCurrentStep(1);
    }
  }, [formData.username, formData.email, formData.department, formData.specialization, onSuccess, navigate]);

  // Register teacher
  const registerTeacher = useCallback(async () => {
    if (!validateStep(2)) {
      return;
    }

    setIsLoading(true);

    try {
      const requestBody = {
        username: formData.username.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        department: formData.department.trim(),
        specialization: formData.specialization.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
      };

      console.log('Registering teacher:', requestBody);

      const response = await api.post('/api/admin/teachers', requestBody);
      console.log('Response:', response.data);

      if (response.data.success) {
        setFormData({
          username: '',
          email: '',
          password: '',
          confirmPassword: '',
          department: '',
          specialization: '',
          phone: '',
          address: ''
        });

        toast.success('Teacher registered successfully!');
        
        showSuccessDialog(response.data.teacher || requestBody);
        
        if (onSuccess) onSuccess();
      } else {
        toast.error(response.data.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Error registering teacher:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Registration failed';
      
      if (error.response?.status === 409) {
        toast.error('Username or email already exists');
      } else if (error.response?.status === 401) {
        toast.error('Authentication required. Please login again.');
      } else if (error.message?.includes('timeout')) {
        toast.error('Connection timeout. Check your network.');
      } else if (error.message?.includes('SocketException')) {
        toast.error('Cannot connect to server. Verify the server is running.');
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  }, [validateStep, formData, showSuccessDialog, onSuccess]);

  // Handle input change
  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  }, [errors]);

  // Toggle password visibility
  const togglePasswordVisibility = useCallback(() => {
    setShowPassword(prev => !prev);
  }, []);

  const toggleConfirmPasswordVisibility = useCallback(() => {
    setShowConfirmPassword(prev => !prev);
  }, []);

  // Get form gradient for step indicator
  const getFormGradient = (step) => {
    const gradients = {
      1: 'from-blue-500 to-blue-600',
      2: 'from-purple-500 to-purple-600',
      3: 'from-teal-500 to-teal-600'
    };
    return gradients[step] || 'from-gray-500 to-gray-600';
  };

  // Render text field
  const renderTextField = useCallback(({ 
    label, 
    field, 
    type = 'text', 
    placeholder, 
    icon,
    required = false,
    autoFocus = false
  }) => {
    const value = formData[field];
    const error = errors[field];
    const isPassword = type === 'password';
    const showPasswordField = field === 'password' ? showPassword : showConfirmPassword;
    const togglePassword = field === 'password' ? togglePasswordVisibility : toggleConfirmPasswordVisibility;
    
    return (
      <div key={field} className="mb-5">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-lg">{icon}</span>
          </div>
          <input
            type={isPassword ? (showPasswordField ? 'text' : 'password') : type}
            value={value}
            onChange={(e) => handleInputChange(field, e.target.value)}
            placeholder={placeholder}
            autoFocus={autoFocus}
            className={`w-full pl-10 pr-10 py-3 rounded-xl border focus:ring-2 focus:ring-[#c9933a] focus:border-transparent transition ${
              error ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-gray-300'
            }`}
          />
          {isPassword && (
            <button
              type="button"
              onClick={togglePassword}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
            >
              {showPasswordField ? '👁️' : '👁️‍🗨️'}
            </button>
          )}
        </div>
        {error && (
          <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
            <span>⚠️</span> {error}
          </p>
        )}
      </div>
    );
  }, [formData, errors, showPassword, showConfirmPassword, handleInputChange, togglePasswordVisibility, toggleConfirmPasswordVisibility]);

  const steps = [
    { number: 1, title: 'Personal Info', icon: '👤', color: 'blue', description: 'Name and contact details' },
    { number: 2, title: 'Account Security', icon: '🔐', color: 'purple', description: 'Create secure password' },
    { number: 3, title: 'Professional Details', icon: '🏫', color: 'teal', description: 'Department & specialization' }
  ];

  return (
    <div className="max-w-2xl mx-auto">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-[#0f1923] via-[#1a2d3f] to-[#0f1923] rounded-2xl p-6 mb-8 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-[#c9933a]/20 rounded-2xl flex items-center justify-center">
            <span className="text-3xl">👨‍🏫</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Register New Teacher</h2>
            <p className="text-gray-300 text-sm mt-1">Add a new educator to the school system</p>
          </div>
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
                      setErrors({});
                    }
                  }}
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold transition-all duration-300 ${
                    currentStep >= step.number
                      ? `bg-gradient-to-r ${getFormGradient(step.number)} text-white shadow-lg transform scale-105`
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {step.icon}
                </button>
                <p className="text-xs font-bold mt-2 text-gray-700">{step.title}</p>
                <p className="text-[10px] text-gray-400 mt-0.5 hidden sm:block">{step.description}</p>
              </div>
              {step.number < 3 && (
                <div className={`absolute top-6 left-1/2 w-full h-0.5 -translate-y-1/2 ${
                  currentStep > step.number ? 'bg-[#c9933a]' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); currentStep === 3 ? registerTeacher() : handleNextStep(); }}>
        
        {/* Step 1: Personal Information */}
        {currentStep === 1 && (
          <div className="bg-white rounded-2xl shadow-md mb-6 overflow-hidden border border-gray-100 animate-in fade-in slide-in-from-left-5 duration-300">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <span className="text-2xl">👤</span>
                <div>
                  <h3 className="text-sm font-bold text-blue-800 uppercase tracking-wider">STEP 1: PERSONAL INFORMATION</h3>
                  <p className="text-xs text-blue-600 mt-0.5">Enter the teacher's basic details</p>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              {renderTextField({
                label: "Full Name",
                field: "username",
                placeholder: "e.g., John Doe",
                icon: "👤",
                required: true,
                autoFocus: true
              })}
              
              {renderTextField({
                label: "Email Address",
                field: "email",
                type: "email",
                placeholder: "teacher@school.edu",
                icon: "📧",
                required: true
              })}
              
              {renderTextField({
                label: "Phone Number",
                field: "phone",
                placeholder: "+265 888 123 456",
                icon: "📱"
              })}
              
              {renderTextField({
                label: "Address",
                field: "address",
                placeholder: "Physical address",
                icon: "📍"
              })}
            </div>
          </div>
        )}

        {/* Step 2: Account Security */}
        {currentStep === 2 && (
          <div className="bg-white rounded-2xl shadow-md mb-6 overflow-hidden border border-gray-100 animate-in fade-in slide-in-from-right-5 duration-300">
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🔐</span>
                <div>
                  <h3 className="text-sm font-bold text-purple-800 uppercase tracking-wider">STEP 2: ACCOUNT SECURITY</h3>
                  <p className="text-xs text-purple-600 mt-0.5">Create a secure password for the teacher</p>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              {renderTextField({
                label: "Password",
                field: "password",
                type: "password",
                placeholder: "••••••••",
                icon: "🔑",
                required: true,
                autoFocus: true
              })}
              
              {renderTextField({
                label: "Confirm Password",
                field: "confirmPassword",
                type: "password",
                placeholder: "••••••••",
                icon: "🛡️",
                required: true
              })}
              
              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-xs text-blue-700 flex items-center gap-2">
                  <span>💡</span>
                  <span>Password must be at least 6 characters long</span>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Professional Details */}
        {currentStep === 3 && (
          <div className="bg-white rounded-2xl shadow-md mb-8 overflow-hidden border border-gray-100 animate-in fade-in slide-in-from-right-5 duration-300">
            <div className="bg-gradient-to-r from-teal-50 to-emerald-50 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🏫</span>
                <div>
                  <h3 className="text-sm font-bold text-teal-800 uppercase tracking-wider">STEP 3: PROFESSIONAL DETAILS</h3>
                  <p className="text-xs text-teal-600 mt-0.5">Department and teaching specialization</p>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              {renderTextField({
                label: "Department",
                field: "department",
                placeholder: "e.g., Mathematics, Science, Languages",
                icon: "🏢"
              })}
              
              {renderTextField({
                label: "Specialization",
                field: "specialization",
                placeholder: "e.g., Physics, Literature, Algebra",
                icon: "🔬"
              })}
              
              {/* Summary Card */}
              <div className="mt-6 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                <p className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-3">Registration Summary</p>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Name:</span>
                    <span className="font-medium text-gray-800">{formData.username || '—'}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Email:</span>
                    <span className="font-medium text-gray-800">{formData.email || '—'}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Department:</span>
                    <span className="font-medium text-gray-800">{formData.department || 'Not specified'}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Specialization:</span>
                    <span className="font-medium text-gray-800">{formData.specialization || 'Not specified'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex gap-3">
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
              type="submit"
              disabled={isLoading}
              className="flex-1 py-3 rounded-xl font-bold text-white transition-all duration-300 hover:shadow-lg hover:scale-[1.02] active:scale-100 disabled:opacity-50 disabled:hover:scale-100 relative overflow-hidden group"
              style={{ 
                background: `linear-gradient(135deg, ${NAVY_PRIMARY}, ${NAVY_DARK})`
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
              {isLoading ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>REGISTERING...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <span>✅</span>
                  <span>COMPLETE REGISTRATION</span>
                  <span>→</span>
                </div>
              )}
            </button>
          )}
        </div>

        {/* Help Text */}
        <p className="text-center text-xs text-gray-500 mt-6 flex items-center justify-center gap-2">
          <span className="text-red-500">*</span> Required fields
          <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
          <span>All information is confidential</span>
        </p>
      </form>
    </div>
  );
};

export default RegisterTeacher;