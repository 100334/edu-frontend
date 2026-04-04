import React, { useState } from 'react';
import { KeyIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import api from '../../services/api';

const QuizVerification = ({ quiz, onVerify, onCancel }) => {
  const [regNumber, setRegNumber] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');

  const handleVerify = async () => {
    if (!regNumber.trim()) {
      setError('Please enter your registration number');
      return;
    }

    setVerifying(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await api.post(
        `/api/quiz/${quiz.id}/verify`,
        { regNumber: regNumber.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        toast.success('Access granted! Starting quiz...');
        onVerify(response.data.quiz);
      } else {
        setError(response.data.message || 'Invalid registration number');
        toast.error(response.data.message || 'Access denied');
      }
    } catch (error) {
      console.error('Verification error:', error);
      const errorMsg = error.response?.data?.message || 'Failed to verify access';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        style={{ border: '2px solid #00B0FF' }} // Azure border
      >
        <div className="p-8">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-800 to-sky-600 rounded-2xl flex items-center justify-center shadow-lg">
              <ShieldCheckIcon className="w-10 h-10 text-white" />
            </div>
          </div>

          {/* Registration Number Field */}
          <div className="space-y-5">
            <div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <KeyIcon className="h-5 w-5 text-sky-500" />
                </div>
                <input
                  type="text"
                  value={regNumber}
                  onChange={(e) => {
                    setRegNumber(e.target.value.toUpperCase());
                    setError('');
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') handleVerify();
                  }}
                  placeholder="Registration Number"
                  className="w-full pl-11 pr-4 py-3 bg-white border-2 border-sky-400 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 font-mono text-sm uppercase transition-all"
                  style={{ fontFamily: "'Calibri', monospace" }}
                  autoFocus
                />
              </div>
              {error && (
                <p className="mt-2 text-xs text-red-600 flex items-center justify-center gap-1">
                  <span>⚠️</span> {error}
                </p>
              )}
            </div>

            {/* Verify Button */}
            <button
              onClick={handleVerify}
              disabled={verifying}
              className="w-full py-3 bg-gradient-to-r from-blue-800 to-sky-700 text-white rounded-xl hover:from-blue-900 hover:to-sky-800 transition-all font-bold text-sm shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {verifying ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Verifying...
                </>
              ) : (
                <>
                  <ShieldCheckIcon className="w-4 h-4" />
                  Verify Identity
                </>
              )}
            </button>

            {/* Cancel Link */}
            <div className="text-center">
              <button
                onClick={onCancel}
                className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizVerification;