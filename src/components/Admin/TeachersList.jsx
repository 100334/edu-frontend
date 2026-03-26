import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function TeachersList() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [showCredentials, setShowCredentials] = useState(null);

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.get('/api/admin/teachers', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Teachers response:', response.data);
      
      // Handle the response structure correctly
      if (response.data.success) {
        setTeachers(response.data.teachers || []);
      } else if (Array.isArray(response.data)) {
        setTeachers(response.data);
      } else {
        setTeachers([]);
      }
    } catch (error) {
      console.error('Error fetching teachers:', error);
      toast.error('Failed to load teachers');
      setTeachers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    setActionLoading(userId);
    try {
      const token = localStorage.getItem('token');
      // Use the correct endpoint for updating teacher status
      const response = await api.put(
        `/api/admin/teachers/${userId}`,
        { is_active: !currentStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        toast.success(`Teacher ${!currentStatus ? 'activated' : 'deactivated'}`);
        fetchTeachers();
      } else {
        toast.error(response.data.message || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error(error.response?.data?.message || 'Failed to update status');
    } finally {
      setActionLoading(null);
    }
  };

  const handleResetPassword = async (userId, teacherName) => {
    if (!window.confirm(`Reset password for ${teacherName}? The new password will be sent to their email.`)) return;
    
    setActionLoading(userId);
    try {
      const token = localStorage.getItem('token');
      // Generate a random temporary password
      const tempPassword = Math.random().toString(36).slice(-8);
      
      const response = await api.put(
        `/api/admin/teachers/${userId}`,
        { password: tempPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        setShowCredentials({
          name: teacherName,
          password: tempPassword
        });
        toast.success('Password reset successfully');
        
        // Auto-hide after 10 seconds
        setTimeout(() => setShowCredentials(null), 10000);
      } else {
        toast.error(response.data.message || 'Failed to reset password');
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      toast.error(error.response?.data?.message || 'Failed to reset password');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (userId, teacherName) => {
    if (!window.confirm(`Delete ${teacherName}? This action cannot be undone.`)) return;
    
    setActionLoading(userId);
    try {
      const token = localStorage.getItem('token');
      const response = await api.delete(`/api/admin/teachers/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        toast.success('Teacher deleted successfully');
        fetchTeachers();
      } else {
        toast.error(response.data.message || 'Failed to delete teacher');
      }
    } catch (error) {
      console.error('Error deleting teacher:', error);
      toast.error(error.response?.data?.message || 'Failed to delete teacher');
    } finally {
      setActionLoading(null);
    }
  };

  const getDepartmentBadgeColor = (department) => {
    const colors = {
      'Mathematics': 'bg-blue-100 text-blue-700',
      'English': 'bg-green-100 text-green-700',
      'Science': 'bg-purple-100 text-purple-700',
      'Social Studies': 'bg-yellow-100 text-yellow-700',
      'Chichewa': 'bg-orange-100 text-orange-700',
      'Creative Arts': 'bg-pink-100 text-pink-700'
    };
    return colors[department] || 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="text-3xl mb-2 animate-pulse">👨‍🏫</div>
        <p className="text-gray-500">Loading teachers...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-serif font-bold text-[#0f1923]">Teachers List</h2>
          <p className="text-sm text-gray-500">Manage faculty members and their credentials</p>
        </div>
        <button
          onClick={() => window.location.href = '/admin/register-teacher'}
          className="px-4 py-2 bg-[#c9933a] text-white rounded-lg hover:bg-[#b5822e] transition text-sm font-medium"
        >
          + Add New Teacher
        </button>
      </div>
      
      {showCredentials && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg animate-fade-in">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold text-green-800 mb-2">✅ Password Reset Successful</h3>
              <p className="text-sm text-green-700 mb-2">
                New temporary password for <strong>{showCredentials.name}</strong>:
              </p>
              <div className="bg-white p-3 rounded border border-green-200">
                <code className="font-mono text-sm bg-gray-50 px-2 py-1 rounded">
                  {showCredentials.password}
                </code>
              </div>
              <p className="text-xs text-green-600 mt-2">
                ⚠️ Please share this temporary password with the teacher. They will be prompted to change it on first login.
              </p>
            </div>
            <button
              onClick={() => setShowCredentials(null)}
              className="text-gray-400 hover:text-gray-600 transition"
            >
              ✕
            </button>
          </div>
        </div>
      )}
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[#f7f4ef] border-b-2 border-[#d4cfc6]">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Department</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Employee ID</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#ede9e1]">
            {teachers.map((teacher) => (
              <tr key={teacher.id} className="hover:bg-[#f7f4ef]/50 transition duration-150">
                <td className="px-4 py-3">
                  <div className="font-medium text-[#0f1923] text-sm">{teacher.full_name || teacher.name}</div>
                  {teacher.qualification && (
                    <div className="text-xs text-gray-400 mt-0.5">{teacher.qualification}</div>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{teacher.email}</td>
                <td className="px-4 py-3">
                  {teacher.department ? (
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getDepartmentBadgeColor(teacher.department)}`}>
                      {teacher.department}
                    </span>
                  ) : (
                    <span className="text-sm text-gray-400">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <code className="text-xs font-mono bg-[#f7f4ef] px-2 py-1 rounded text-[#0f1923]">
                    {teacher.employee_id || '—'}
                  </code>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    teacher.is_active !== false
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {teacher.is_active !== false ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => handleToggleStatus(teacher.id, teacher.is_active)}
                      disabled={actionLoading === teacher.id}
                      className="text-xs px-2 py-1 rounded bg-blue-50 text-blue-600 hover:bg-blue-100 transition disabled:opacity-50"
                    >
                      {teacher.is_active !== false ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => handleResetPassword(teacher.id, teacher.full_name || teacher.name)}
                      disabled={actionLoading === teacher.id}
                      className="text-xs px-2 py-1 rounded bg-yellow-50 text-yellow-600 hover:bg-yellow-100 transition disabled:opacity-50"
                    >
                      Reset PW
                    </button>
                    <button
                      onClick={() => handleDelete(teacher.id, teacher.full_name || teacher.name)}
                      disabled={actionLoading === teacher.id}
                      className="text-xs px-2 py-1 rounded bg-red-50 text-red-600 hover:bg-red-100 transition disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {teachers.length === 0 && (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">👨‍🏫</div>
            <p className="text-gray-500 mb-2">No teachers added yet</p>
            <button
              onClick={() => window.location.href = '/admin/register-teacher'}
              className="text-sm text-[#c9933a] hover:text-[#0f1923] transition font-medium"
            >
              Click here to add your first teacher →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}