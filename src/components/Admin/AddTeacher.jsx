import React, { useState } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function AddTeacher({ onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    employee_id: '',
    department: '',
    qualification: '',
    specialization: '',
    joining_date: '',
    phone_number: '',
    address: ''
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
      const response = await api.post('/api/admin/teachers', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setGeneratedCredentials({
          email: response.data.teacher.email,
          password: response.data.temporary_password,
          name: response.data.teacher.full_name
        });
        toast.success('Teacher created successfully!');
        setFormData({
          email: '',
          full_name: '',
          employee_id: '',
          department: '',
          qualification: '',
          specialization: '',
          joining_date: '',
          phone_number: '',
          address: ''
        });
        if (onSuccess) setTimeout(onSuccess, 3000);
      }
    } catch (error) {
      console.error('Error creating teacher:', error);
      toast.error(error.response?.data?.error || 'Failed to create teacher');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4 text-[#0f1923]">Add New Teacher</h2>
      
      {generatedCredentials && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h3 className="font-semibold text-green-800 mb-2">✅ Teacher Created Successfully!</h3>
          <div className="space-y-2 text-sm">
            <p><strong>Name:</strong> {generatedCredentials.name}</p>
            <p><strong>Email:</strong> {generatedCredentials.email}</p>
            <p><strong>Temporary Password:</strong> <code className="bg-gray-100 px-2 py-1 rounded">{generatedCredentials.password}</code></p>
          </div>
          <p className="text-xs text-gray-600 mt-2">⚠️ Please share these credentials with the teacher. They will be prompted to change password on first login.</p>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID</label>
            <input
              type="text"
              name="employee_id"
              value={formData.employee_id}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-[#d4cfc6] rounded-lg focus:ring-[#c9933a] focus:border-[#c9933a]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
            <input
              type="text"
              name="department"
              value={formData.department}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-[#d4cfc6] rounded-lg focus:ring-[#c9933a] focus:border-[#c9933a]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Qualification</label>
            <input
              type="text"
              name="qualification"
              value={formData.qualification}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-[#d4cfc6] rounded-lg focus:ring-[#c9933a] focus:border-[#c9933a]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Specialization</label>
            <input
              type="text"
              name="specialization"
              value={formData.specialization}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-[#d4cfc6] rounded-lg focus:ring-[#c9933a] focus:border-[#c9933a]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Joining Date</label>
            <input
              type="date"
              name="joining_date"
              value={formData.joining_date}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-[#d4cfc6] rounded-lg focus:ring-[#c9933a] focus:border-[#c9933a]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
            <input
              type="tel"
              name="phone_number"
              value={formData.phone_number}
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
          {loading ? 'Creating...' : '👨‍🏫 Create Teacher & Generate Credentials'}
        </button>
      </form>
    </div>
  );
}