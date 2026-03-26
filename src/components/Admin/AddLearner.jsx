import React, { useState } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function AddLearner({ onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    student_id: '',
    enrollment_date: new Date().toISOString().split('T')[0],
    form: 'Form 1',
    guardian_name: '',
    guardian_phone: '',
    address: '',
    date_of_birth: ''
  });
  const [generatedCredentials, setGeneratedCredentials] = useState(null);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setGeneratedCredentials(null);
    
    try {
      const token = localStorage.getItem('token');
      const response = await api.post('/api/admin/learners', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setGeneratedCredentials({
          email: response.data.learner.email,
          password: response.data.temporary_password,
          name: response.data.learner.full_name,
          reg_number: response.data.learner.reg_number
        });
        toast.success('Learner created successfully!');
        setFormData({
          email: '',
          full_name: '',
          student_id: '',
          enrollment_date: new Date().toISOString().split('T')[0],
          form: 'Form 1',
          guardian_name: '',
          guardian_phone: '',
          address: '',
          date_of_birth: ''
        });
        if (onSuccess) setTimeout(onSuccess, 3000);
      }
    } catch (error) {
      console.error('Error creating learner:', error);
      toast.error(error.response?.data?.error || 'Failed to create learner');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4 text-[#0f1923]">Add New Learner</h2>
      
      {generatedCredentials && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h3 className="font-semibold text-green-800 mb-2">✅ Learner Created Successfully!</h3>
          <div className="space-y-2 text-sm">
            <p><strong>Name:</strong> {generatedCredentials.name}</p>
            <p><strong>Registration Number:</strong> <code className="bg-gray-100 px-2 py-1 rounded">{generatedCredentials.reg_number}</code></p>
            <p><strong>Email:</strong> {generatedCredentials.email}</p>
            <p><strong>Temporary Password:</strong> <code className="bg-gray-100 px-2 py-1 rounded">{generatedCredentials.password}</code></p>
          </div>
          <p className="text-xs text-gray-600 mt-2">⚠️ Please share these credentials with the learner. They will be prompted to change password on first login.</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
            <input
              type="text"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-[#d4cfc6] rounded-lg focus:ring-[#c9933a] focus:border-[#c9933a]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-[#d4cfc6] rounded-lg focus:ring-[#c9933a] focus:border-[#c9933a]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Student ID</label>
            <input
              type="text"
              name="student_id"
              value={formData.student_id}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-[#d4cfc6] rounded-lg focus:ring-[#c9933a] focus:border-[#c9933a]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Form *</label>
            <select
              name="form"
              value={formData.form}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-[#d4cfc6] rounded-lg focus:ring-[#c9933a] focus:border-[#c9933a]"
            >
              <option>Form 1</option>
              <option>Form 2</option>
              <option>Form 3</option>
              <option>Form 4</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Enrollment Date</label>
            <input
              type="date"
              name="enrollment_date"
              value={formData.enrollment_date}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-[#d4cfc6] rounded-lg focus:ring-[#c9933a] focus:border-[#c9933a]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
            <input
              type="date"
              name="date_of_birth"
              value={formData.date_of_birth}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-[#d4cfc6] rounded-lg focus:ring-[#c9933a] focus:border-[#c9933a]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Guardian Name</label>
            <input
              type="text"
              name="guardian_name"
              value={formData.guardian_name}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-[#d4cfc6] rounded-lg focus:ring-[#c9933a] focus:border-[#c9933a]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Guardian Phone</label>
            <input
              type="tel"
              name="guardian_phone"
              value={formData.guardian_phone}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-[#d4cfc6] rounded-lg focus:ring-[#c9933a] focus:border-[#c9933a]"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              rows="2"
              className="w-full px-3 py-2 border border-[#d4cfc6] rounded-lg focus:ring-[#c9933a] focus:border-[#c9933a]"
            />
          </div>
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 px-4 bg-[#c9933a] text-[#0f1923] font-semibold rounded-lg hover:bg-[#e8b96a] transition disabled:opacity-50"
        >
          {loading ? 'Creating...' : '👨‍🎓 Create Learner & Generate Credentials'}
        </button>
      </form>
    </div>
  );
}