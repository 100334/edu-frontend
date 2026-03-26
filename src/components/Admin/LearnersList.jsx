import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function LearnersList() {
  const [learners, setLearners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [showCredentials, setShowCredentials] = useState(null);
  const [selectedForm, setSelectedForm] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLearner, setSelectedLearner] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Get unique forms for filter
  const forms = ['all', ...new Set(learners.map(l => l.form).filter(Boolean))];
  const statuses = ['all', 'Active', 'Inactive', 'Graduated', 'Transferred'];

  useEffect(() => {
    fetchLearners();
  }, []);

  const fetchLearners = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.get('/api/admin/learners', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Learners response:', response.data);
      
      if (response.data.success) {
        setLearners(response.data.learners || []);
      } else if (Array.isArray(response.data)) {
        setLearners(response.data);
      } else {
        setLearners([]);
      }
    } catch (error) {
      console.error('Error fetching learners:', error);
      toast.error('Failed to load learners');
      setLearners([]);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (learnerId, currentStatus) => {
    setActionLoading(learnerId);
    try {
      const token = localStorage.getItem('token');
      const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
      
      const response = await api.patch(
        `/api/admin/learners/${learnerId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        toast.success(`Learner ${newStatus === 'Active' ? 'activated' : 'deactivated'}`);
        fetchLearners();
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

  const handleResetPassword = async (learnerId, learnerName, regNumber) => {
    if (!window.confirm(`Reset password for ${learnerName}? The new password will be their registration number: ${regNumber}`)) return;
    
    setActionLoading(learnerId);
    try {
      const token = localStorage.getItem('token');
      const response = await api.post(
        `/api/admin/learners/${learnerId}/reset-password`,
        { password: regNumber },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setShowCredentials({
        name: learnerName,
        password: regNumber,
        regNumber: regNumber
      });
      toast.success('Password reset successfully');
      
      setTimeout(() => setShowCredentials(null), 10000);
    } catch (error) {
      console.error('Error resetting password:', error);
      toast.error(error.response?.data?.message || 'Failed to reset password');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (learnerId, learnerName) => {
    if (!window.confirm(`Delete ${learnerName}? This action cannot be undone. This will also delete all associated attendance and report records.`)) return;
    
    setActionLoading(learnerId);
    try {
      const token = localStorage.getItem('token');
      const response = await api.delete(`/api/admin/learners/${learnerId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        toast.success('Learner deleted successfully');
        fetchLearners();
      } else {
        toast.error(response.data.message || 'Failed to delete learner');
      }
    } catch (error) {
      console.error('Error deleting learner:', error);
      toast.error(error.response?.data?.message || 'Failed to delete learner');
    } finally {
      setActionLoading(null);
    }
  };

  const handleEdit = (learnerId) => {
    window.location.href = `/admin/edit-learner/${learnerId}`;
  };

  const handleViewDetails = (learner) => {
    setSelectedLearner(learner);
    setShowDetailsModal(true);
  };

  // Filter learners based on form, status, and search term
  const filteredLearners = learners.filter(learner => {
    const matchesForm = selectedForm === 'all' || learner.form === selectedForm;
    const matchesStatus = selectedStatus === 'all' || learner.status === selectedStatus;
    const matchesSearch = searchTerm === '' || 
      learner.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      learner.reg_number?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesForm && matchesStatus && matchesSearch;
  });

  // Statistics
  const stats = {
    total: learners.length,
    active: learners.filter(l => l.status === 'Active').length,
    inactive: learners.filter(l => l.status === 'Inactive').length,
    byForm: forms.slice(1).map(form => ({
      form,
      count: learners.filter(l => l.form === form).length
    }))
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="text-3xl mb-2 animate-pulse">🎓</div>
        <p className="text-gray-500">Loading learners...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header with Stats */}
      <div className="flex justify-between items-start mb-6 flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-serif font-bold text-[#0f1923]">Learners Management</h2>
          <p className="text-sm text-gray-500">Manage all enrolled students and their records</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => window.location.href = '/admin/register-learner'}
            className="px-4 py-2 bg-[#c9933a] text-white rounded-lg hover:bg-[#b5822e] transition text-sm font-medium"
          >
            + Register New Learner
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">Total Learners</p>
              <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
            </div>
            <div className="text-3xl">🎓</div>
          </div>
        </div>
        <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">Active Learners</p>
              <p className="text-2xl font-bold text-green-900">{stats.active}</p>
            </div>
            <div className="text-3xl">✅</div>
          </div>
        </div>
        <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-600 font-medium">Inactive Learners</p>
              <p className="text-2xl font-bold text-orange-900">{stats.inactive}</p>
            </div>
            <div className="text-3xl">⏸️</div>
          </div>
        </div>
      </div>

      {/* Password Reset Success Message */}
      {showCredentials && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg animate-fade-in">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold text-green-800 mb-2">✅ Password Reset Successful</h3>
              <p className="text-sm text-green-700 mb-2">
                New login credentials for <strong>{showCredentials.name}</strong>:
              </p>
              <div className="bg-white p-3 rounded border border-green-200">
                <p className="text-sm">
                  <span className="font-medium">Username/Registration Number:</span>{' '}
                  <code className="bg-gray-100 px-2 py-1 rounded font-mono text-sm">{showCredentials.regNumber}</code>
                </p>
                <p className="text-sm mt-1">
                  <span className="font-medium">Password:</span>{' '}
                  <code className="bg-gray-100 px-2 py-1 rounded font-mono text-sm">{showCredentials.password}</code>
                </p>
              </div>
              <p className="text-xs text-green-600 mt-2">
                ⚠️ Please share these credentials with the learner. They can change their password after first login.
              </p>
            </div>
            <button
              onClick={() => setShowCredentials(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-[#f7f4ef] rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Search</label>
            <input
              type="text"
              placeholder="Name or Reg Number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-[#d4cfc6] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#c9933a]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Form</label>
            <select
              value={selectedForm}
              onChange={(e) => setSelectedForm(e.target.value)}
              className="w-full px-3 py-2 border border-[#d4cfc6] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#c9933a]"
            >
              {forms.map(form => (
                <option key={form} value={form}>
                  {form === 'all' ? 'All Forms' : form}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 border border-[#d4cfc6] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#c9933a]"
            >
              {statuses.map(status => (
                <option key={status} value={status}>
                  {status === 'all' ? 'All Status' : status}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <div className="text-sm text-gray-500">
              Showing {filteredLearners.length} of {learners.length} learners
            </div>
          </div>
        </div>
      </div>

      {/* Learners Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[#f7f4ef] border-b border-[#d4cfc6]">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Student Name</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Reg Number</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Form</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Enrollment Date</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#ede9e1]">
            {filteredLearners.map((learner) => (
              <tr key={learner.id} className="hover:bg-[#f7f4ef]/50 transition">
                <td className="px-4 py-3">
                  <div className="font-medium text-[#0f1923] text-sm">{learner.name}</div>
                  {learner.gender && (
                    <div className="text-xs text-gray-400 mt-0.5">{learner.gender}</div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <code className="text-sm font-mono text-gray-600 bg-gray-50 px-2 py-1 rounded">
                    {learner.reg_number}
                  </code>
                </td>
                <td className="px-4 py-3">
                  <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                    {learner.form}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    learner.status === 'Active' ? 'bg-green-100 text-green-700' :
                    learner.status === 'Inactive' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {learner.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {new Date(learner.enrollment_date).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleViewDetails(learner)}
                      className="text-xs px-2 py-1 rounded bg-gray-50 text-gray-600 hover:bg-gray-100 transition"
                      title="View Details"
                    >
                      👁️
                    </button>
                    <button
                      onClick={() => handleEdit(learner.id)}
                      className="text-xs px-2 py-1 rounded bg-gray-50 text-gray-600 hover:bg-gray-100 transition"
                      title="Edit"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleResetPassword(learner.id, learner.name, learner.reg_number)}
                      disabled={actionLoading === learner.id}
                      className="text-xs px-2 py-1 rounded bg-yellow-50 text-yellow-600 hover:bg-yellow-100 transition disabled:opacity-50"
                      title="Reset Password"
                    >
                      🔑
                    </button>
                    <button
                      onClick={() => handleToggleStatus(learner.id, learner.status)}
                      disabled={actionLoading === learner.id}
                      className={`text-xs px-2 py-1 rounded transition disabled:opacity-50 ${
                        learner.status === 'Active'
                          ? 'bg-orange-50 text-orange-600 hover:bg-orange-100'
                          : 'bg-green-50 text-green-600 hover:bg-green-100'
                      }`}
                      title={learner.status === 'Active' ? 'Deactivate' : 'Activate'}
                    >
                      {learner.status === 'Active' ? '🔴' : '🟢'}
                    </button>
                    <button
                      onClick={() => handleDelete(learner.id, learner.name)}
                      disabled={actionLoading === learner.id}
                      className="text-xs px-2 py-1 rounded bg-red-50 text-red-600 hover:bg-red-100 transition disabled:opacity-50"
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {filteredLearners.length === 0 && (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">🎓</div>
            <p className="text-gray-500 mb-2">
              {searchTerm || selectedForm !== 'all' || selectedStatus !== 'all' 
                ? 'No learners match your filters' 
                : 'No learners registered yet'}
            </p>
            {searchTerm || selectedForm !== 'all' || selectedStatus !== 'all' ? (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedForm('all');
                  setSelectedStatus('all');
                }}
                className="text-sm text-[#c9933a] hover:text-[#0f1923] transition"
              >
                Clear all filters
              </button>
            ) : (
              <button
                onClick={() => window.location.href = '/admin/register-learner'}
                className="text-sm text-[#c9933a] hover:text-[#0f1923] transition"
              >
                Click here to register your first learner
              </button>
            )}
          </div>
        )}
      </div>

      {/* Learner Details Modal */}
      {showDetailsModal && selectedLearner && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-[#0f1923]">Learner Details</h3>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase">Full Name</label>
                    <p className="text-gray-900 font-medium">{selectedLearner.name}</p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase">Registration Number</label>
                    <p className="text-gray-900 font-mono">{selectedLearner.reg_number}</p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase">Form</label>
                    <p className="text-gray-900">{selectedLearner.form}</p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase">Status</label>
                    <p className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                      selectedLearner.status === 'Active' ? 'bg-green-100 text-green-700' :
                      selectedLearner.status === 'Inactive' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {selectedLearner.status}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase">Gender</label>
                    <p className="text-gray-900">{selectedLearner.gender || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase">Date of Birth</label>
                    <p className="text-gray-900">{selectedLearner.date_of_birth ? new Date(selectedLearner.date_of_birth).toLocaleDateString() : 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase">Enrollment Date</label>
                    <p className="text-gray-900">{new Date(selectedLearner.enrollment_date).toLocaleDateString()}</p>
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs font-semibold text-gray-500 uppercase">Address</label>
                    <p className="text-gray-900">{selectedLearner.address || 'Not provided'}</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 pt-4 border-t border-gray-200 flex justify-end gap-3">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    handleEdit(selectedLearner.id);
                  }}
                  className="px-4 py-2 bg-[#c9933a] text-white rounded-lg hover:bg-[#b5822e] transition"
                >
                  Edit Learner
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}