import React, { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';

// Theme constants
const NAVY_PRIMARY = '#1A237E';
const NAVY_DARK = '#0D1240';
const AZURE_ACCENT = '#00B0FF';
const ICE_WHITE = '#F4F7FA';

const RegisterTeacher = ({ onSuccess }) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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

  // Validate form
  const validateForm = useCallback(() => {
    const newErrors = {};

    if (!formData.username.trim()) {
      newErrors.username = 'Full name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Enter a valid email address';
    }

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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // Show success dialog - MOVED BEFORE registerTeacher
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
    }
  }, [formData.username, formData.email, formData.department, formData.specialization, onSuccess, navigate]);

  // Register teacher - MOVED AFTER showSuccessDialog
  const registerTeacher = useCallback(async () => {
    if (!validateForm()) {
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
  }, [validateForm, formData, showSuccessDialog, onSuccess]);

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

  // Render text field
  const renderTextField = useCallback(({ 
    label, 
    field, 
    type = 'text', 
    placeholder, 
    icon,
    required = false
  }) => {
    const value = formData[field];
    const error = errors[field];
    const isPassword = type === 'password';
    const showPasswordField = field === 'password' ? showPassword : showConfirmPassword;
    const togglePassword = field === 'password' ? togglePasswordVisibility : toggleConfirmPasswordVisibility;
    
    return (
      <div key={field} className="mb-4">
        <label className="block text-sm font-medium mb-2 text-gray-700">
          {label} {required && '*'}
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
            className={`w-full pl-10 pr-10 py-2.5 rounded-lg border focus:ring-2 focus:ring-[#00B0FF] focus:border-transparent transition ${
              error ? 'border-red-500' : 'border-gray-300'
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
          <p className="text-xs text-red-500 mt-1">{error}</p>
        )}
      </div>
    );
  }, [formData, errors, showPassword, showConfirmPassword, handleInputChange, togglePasswordVisibility, toggleConfirmPasswordVisibility]);

  return (
    <div>
      <form onSubmit={(e) => { e.preventDefault(); registerTeacher(); }}>
        {/* Personal Information Section */}
        <div className="mb-6">
          <h3 className="text-xs font-bold tracking-wider text-blue-600 mb-4 border-b border-gray-200 pb-2">
            PERSONAL INFORMATION
          </h3>
          
          {renderTextField({
            label: "Full Name",
            field: "username",
            placeholder: "e.g. John Doe",
            icon: "👤",
            required: true
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

        {/* Professional Details Section */}
        <div className="mb-6">
          <h3 className="text-xs font-bold tracking-wider text-blue-600 mb-4 border-b border-gray-200 pb-2">
            PROFESSIONAL DETAILS
          </h3>
          
          {renderTextField({
            label: "Department",
            field: "department",
            placeholder: "e.g. Mathematics, Science",
            icon: "🏢"
          })}
          
          {renderTextField({
            label: "Specialization",
            field: "specialization",
            placeholder: "e.g. Physics, Literature",
            icon: "🔬"
          })}
        </div>

        {/* Account Security Section */}
        <div className="mb-8">
          <h3 className="text-xs font-bold tracking-wider text-blue-600 mb-4 border-b border-gray-200 pb-2">
            ACCOUNT SECURITY
          </h3>
          
          {renderTextField({
            label: "Password",
            field: "password",
            type: "password",
            placeholder: "••••••••",
            icon: "🔑",
            required: true
          })}
          
          {renderTextField({
            label: "Confirm Password",
            field: "confirmPassword",
            type: "password",
            placeholder: "••••••••",
            icon: "🛡️",
            required: true
          })}
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
              <span>REGISTERING...</span>
            </div>
          ) : (
            <span>REGISTER TEACHER</span>
          )}
        </button>

        {/* Help Text */}
        <p className="text-center text-xs text-gray-500 mt-4">
          All fields marked with * are required
        </p>
      </form>
    </div>
  );
};

export default RegisterTeacher;