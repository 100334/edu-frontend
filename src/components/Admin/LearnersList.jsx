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

  const getFormColor = (form) => {
    const colors = {
      'Form 1': 'from-emerald-100 to-emerald-50 text-emerald-700',
      'Form 2': 'from-sky-100 to-sky-50 text-sky-700',
      'Form 3': 'from-amber-100 to-amber-50 text-amber-700',
      'Form 4': 'from-purple-100 to-purple-50 text-purple-700'
    };
    return colors[form] || 'from-gray-100 to-gray-50 text-gray-700';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#c9933a] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading learners...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-[#0f1923] via-[#1a2d3f] to-[#0f1923] rounded-2xl p-8 shadow-xl">
        <div className="flex justify-between items-start flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-[#c9933a]/20 rounded-2xl flex items-center justify-center">
                <span className="text-3xl">🎓</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Learners Management</h2>
                <p className="text-gray-300 text-sm mt-1">Manage all enrolled students and their academic records</p>
              </div>
            </div>
          </div>
          <button
            onClick={() => window.location.href = '/admin/register-learner'}
            className="group relative px-6 py-3 bg-[#c9933a] text-white rounded-xl hover:bg-[#b5822e] transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <span className="flex items-center gap-2">
              <span className="text-xl">➕</span>
              Register New Learner
            </span>
          </button>
        </div>
      </div>

      {/* Statistics Cards - Enhanced */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 text-white shadow-lg transform hover:scale-105 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Learners</p>
              <p className="text-3xl font-bold mt-1">{stats.total}</p>
            </div>
            <div className="text-4xl opacity-80">🎓</div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-5 text-white shadow-lg transform hover:scale-105 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-sm font-medium">Active Learners</p>
              <p className="text-3xl font-bold mt-1">{stats.active}</p>
            </div>
            <div className="text-4xl opacity-80">✅</div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-5 text-white shadow-lg transform hover:scale-105 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-100 text-sm font-medium">Inactive Learners</p>
              <p className="text-3xl font-bold mt-1">{stats.inactive}</p>
            </div>
            <div className="text-4xl opacity-80">⏸️</div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-5 text-white shadow-lg transform hover:scale-105 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Forms Available</p>
              <p className="text-3xl font-bold mt-1">{stats.byForm.length}</p>
            </div>
            <div className="text-4xl opacity-80">📚</div>
          </div>
        </div>
      </div>

      {/* Form Distribution Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.byForm.map(({ form, count }) => (
          <div key={form} className={`bg-gradient-to-r ${getFormColor(form)} rounded-lg p-3 cursor-pointer hover:shadow-md transition-all`}
               onClick={() => setSelectedForm(form)}>
            <p className="text-xs font-medium opacity-75">Form</p>
            <p className="text-lg font-bold">{form}</p>
            <p className="text-sm font-semibold mt-1">{count} Learners</p>
          </div>
        ))}
      </div>

      {/* Password Reset Success Message */}
      {showCredentials && (
        <div className="bg-gradient-to-r from-emerald-50 to-green-50 border-l-4 border-emerald-500 rounded-lg p-4 shadow-md animate-in slide-in-from-top duration-300">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                  <span className="text-lg">✅</span>
                </div>
                <h3 className="font-bold text-emerald-800">Password Reset Successful</h3>
              </div>
              <p className="text-sm text-emerald-700 mb-3">
                New login credentials for <strong className="text-emerald-900">{showCredentials.name}</strong>:
              </p>
              <div className="bg-white rounded-lg p-4 border border-emerald-200 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Username / Registration Number</p>
                    <code className="text-sm font-mono font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded mt-1 inline-block">
                      {showCredentials.regNumber}
                    </code>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Password</p>
                    <code className="text-sm font-mono font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded mt-1 inline-block">
                      {showCredentials.password}
                    </code>
                  </div>
                </div>
              </div>
              <p className="text-xs text-emerald-600 mt-3 flex items-center gap-1">
                <span>⚠️</span> Please share these credentials with the learner. They can change their password after first login.
              </p>
            </div>
            <button
              onClick={() => setShowCredentials(null)}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Filters - Enhanced */}
      <div className="bg-white rounded-xl shadow-md p-5 border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">🔍 Search</label>
            <input
              type="text"
              placeholder="Name or Registration Number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#c9933a] focus:border-transparent transition"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">📚 Form</label>
            <select
              value={selectedForm}
              onChange={(e) => setSelectedForm(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#c9933a] focus:border-transparent transition bg-white"
            >
              {forms.map(form => (
                <option key={form} value={form}>
                  {form === 'all' ? 'All Forms' : form}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">📊 Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#c9933a] focus:border-transparent transition bg-white"
            >
              {statuses.map(status => (
                <option key={status} value={status}>
                  {status === 'all' ? 'All Status' : status}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <div className="bg-gray-100 px-4 py-2.5 rounded-lg w-full text-center">
              <span className="text-sm font-semibold text-gray-700">
                {filteredLearners.length} of {learners.length} learners
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Learners Table - Enhanced */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Student</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Reg Number</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Form</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Enrollment</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredLearners.map((learner, index) => (
                <tr key={learner.id} className="hover:bg-gradient-to-r hover:from-amber-50 hover:to-transparent transition-all duration-200 group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getFormColor(learner.form)} flex items-center justify-center text-lg font-bold`}>
                        {learner.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 text-sm group-hover:text-[#c9933a] transition-colors">
                          {learner.name}
                        </div>
                        {learner.gender && (
                          <div className="text-xs text-gray-400 mt-0.5">{learner.gender}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <code className="text-sm font-mono bg-gray-50 px-2 py-1 rounded text-gray-700 border border-gray-200">
                      {learner.reg_number}
                    </code>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r ${getFormColor(learner.form)}`}>
                      {learner.form}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                      learner.status === 'Active' ? 'bg-emerald-100 text-emerald-700' :
                      learner.status === 'Inactive' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        learner.status === 'Active' ? 'bg-emerald-500' :
                        learner.status === 'Inactive' ? 'bg-red-500' :
                        'bg-gray-500'
                      }`}></span>
                      {learner.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(learner.enrollment_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleViewDetails(learner)}
                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        title="View Details"
                      >
                        👁️
                      </button>
                      <button
                        onClick={() => handleEdit(learner.id)}
                        className="p-2 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleResetPassword(learner.id, learner.name, learner.reg_number)}
                        disabled={actionLoading === learner.id}
                        className="p-2 text-gray-500 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-all disabled:opacity-50"
                        title="Reset Password"
                      >
                        🔑
                      </button>
                      <button
                        onClick={() => handleToggleStatus(learner.id, learner.status)}
                        disabled={actionLoading === learner.id}
                        className={`p-2 rounded-lg transition-all ${
                          learner.status === 'Active'
                            ? 'text-gray-500 hover:text-red-600 hover:bg-red-50'
                            : 'text-gray-500 hover:text-emerald-600 hover:bg-emerald-50'
                        } disabled:opacity-50`}
                        title={learner.status === 'Active' ? 'Deactivate' : 'Activate'}
                      >
                        {learner.status === 'Active' ? '🔴' : '🟢'}
                      </button>
                      <button
                        onClick={() => handleDelete(learner.id, learner.name)}
                        disabled={actionLoading === learner.id}
                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50"
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
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">🎓</span>
              </div>
              <p className="text-gray-500 font-medium text-lg mb-2">
                {searchTerm || selectedForm !== 'all' || selectedStatus !== 'all' 
                  ? 'No learners match your filters' 
                  : 'No learners registered yet'}
              </p>
              <p className="text-gray-400 text-sm mb-6">
                {searchTerm || selectedForm !== 'all' || selectedStatus !== 'all' 
                  ? 'Try adjusting your search criteria' 
                  : 'Get started by registering your first learner'}
              </p>
              {searchTerm || selectedForm !== 'all' || selectedStatus !== 'all' ? (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedForm('all');
                    setSelectedStatus('all');
                  }}
                  className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
                >
                  Clear all filters
                </button>
              ) : (
                <button
                  onClick={() => window.location.href = '/admin/register-learner'}
                  className="px-6 py-2.5 bg-gradient-to-r from-[#c9933a] to-[#b5822e] text-white rounded-lg hover:shadow-lg transition-all font-medium"
                >
                  Register Your First Learner
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Learner Details Modal - Enhanced */}
      {showDetailsModal && selectedLearner && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="relative">
              {/* Modal Header */}
              <div className={`bg-gradient-to-r ${getFormColor(selectedLearner.form)} p-6 rounded-t-2xl`}>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-3xl font-bold shadow-lg">
                      {selectedLearner.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{selectedLearner.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">Learner Profile</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="p-2 bg-white/20 hover:bg-white/30 rounded-xl transition-colors"
                  >
                    <span className="text-xl">✕</span>
                  </button>
                </div>
              </div>
              
              {/* Modal Content */}
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-4 border border-gray-100">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">📝 Full Name</label>
                    <p className="text-gray-900 font-semibold text-lg mt-1">{selectedLearner.name}</p>
                  </div>
                  <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-4 border border-gray-100">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">🆔 Registration Number</label>
                    <p className="text-gray-900 font-mono text-lg mt-1">{selectedLearner.reg_number}</p>
                  </div>
                  <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-4 border border-gray-100">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">📚 Form</label>
                    <p className="text-gray-900 font-semibold text-lg mt-1">{selectedLearner.form}</p>
                  </div>
                  <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-4 border border-gray-100">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">📊 Status</label>
                    <p className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold mt-2 ${
                      selectedLearner.status === 'Active' ? 'bg-emerald-100 text-emerald-700' :
                      selectedLearner.status === 'Inactive' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${
                        selectedLearner.status === 'Active' ? 'bg-emerald-500' :
                        selectedLearner.status === 'Inactive' ? 'bg-red-500' :
                        'bg-gray-500'
                      }`}></span>
                      {selectedLearner.status}
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-4 border border-gray-100">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">👤 Gender</label>
                    <p className="text-gray-900 text-lg mt-1">{selectedLearner.gender || 'Not specified'}</p>
                  </div>
                  <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-4 border border-gray-100">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">🎂 Date of Birth</label>
                    <p className="text-gray-900 text-lg mt-1">{selectedLearner.date_of_birth ? new Date(selectedLearner.date_of_birth).toLocaleDateString() : 'Not provided'}</p>
                  </div>
                  <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-4 border border-gray-100">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">📅 Enrollment Date</label>
                    <p className="text-gray-900 text-lg mt-1">{new Date(selectedLearner.enrollment_date).toLocaleDateString()}</p>
                  </div>
                  <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-4 border border-gray-100 md:col-span-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">📍 Address</label>
                    <p className="text-gray-900 text-lg mt-1">{selectedLearner.address || 'Not provided'}</p>
                  </div>
                </div>
              </div>
              
              {/* Modal Footer */}
              <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 rounded-b-2xl">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-5 py-2.5 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-100 transition font-medium"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    handleEdit(selectedLearner.id);
                  }}
                  className="px-5 py-2.5 bg-gradient-to-r from-[#c9933a] to-[#b5822e] text-white rounded-xl hover:shadow-lg transition-all font-medium"
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