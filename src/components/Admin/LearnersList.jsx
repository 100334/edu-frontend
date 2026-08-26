import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  MagnifyingGlassIcon,
  EyeIcon,
  PencilSquareIcon,
  KeyIcon,
  TrashIcon,
  ArrowDownTrayIcon,
  XMarkIcon,
  UserCircleIcon,
  CheckCircleIcon,
  NoSymbolIcon,
} from '@heroicons/react/24/outline';

const TEAL = '#006770';
const DARK_TEAL = '#003B46';

export default function LearnersList() {
  const [learners,         setLearners]         = useState([]);
  const [loading,          setLoading]          = useState(true);
  const [actionLoading,    setActionLoading]    = useState(null);
  const [showCredentials,  setShowCredentials]  = useState(null);
  const [selectedForm,     setSelectedForm]     = useState('all');
  const [selectedStatus,   setSelectedStatus]   = useState('all');
  const [searchTerm,       setSearchTerm]       = useState('');
  const [selectedLearner,  setSelectedLearner]  = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const forms    = ['all', ...new Set(learners.map(l => l.form).filter(Boolean))];
  const statuses = ['all', 'Active', 'Inactive', 'Graduated', 'Transferred'];

  useEffect(() => { fetchLearners(); }, []);

  const fetchLearners = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await api.get('/api/admin/learners', { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.success) setLearners(res.data.learners || []);
      else if (Array.isArray(res.data)) setLearners(res.data);
      else setLearners([]);
    } catch { toast.error('Failed to load learners'); setLearners([]); }
    finally { setLoading(false); }
  };

  const handleToggleStatus = async (id, current) => {
    setActionLoading(id);
    try {
      const token = localStorage.getItem('token');
      const newStatus = current === 'Active' ? 'Inactive' : 'Active';
      const res = await api.patch(`/api/admin/learners/${id}/status`, { status: newStatus }, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.success) { toast.success(`Learner ${newStatus.toLowerCase()}`); fetchLearners(); }
      else toast.error(res.data.message || 'Failed');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setActionLoading(null); }
  };

  const handleResetPassword = async (id, name, reg) => {
    if (!window.confirm(`Reset password for ${name}? New password will be their registration number: ${reg}`)) return;
    setActionLoading(id);
    try {
      const token = localStorage.getItem('token');
      await api.post(`/api/admin/learners/${id}/reset-password`, { password: reg }, { headers: { Authorization: `Bearer ${token}` } });
      setShowCredentials({ name, password: reg, regNumber: reg });
      toast.success('Password reset');
      setTimeout(() => setShowCredentials(null), 10000);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setActionLoading(null); }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete ${name}? This cannot be undone and will remove all their records.`)) return;
    setActionLoading(id);
    try {
      const token = localStorage.getItem('token');
      const res = await api.delete(`/api/admin/learners/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.success) { toast.success('Learner deleted'); fetchLearners(); }
      else toast.error(res.data.message || 'Failed');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setActionLoading(null); }
  };

  const handleDownload = () => {
    if (!filteredLearners.length) return;
    const csv = [
      ['Name', 'Registration Number', 'Form'].join(','),
      ...filteredLearners.map(l => [l.name, l.reg_number, l.form].map(v => `"${v ?? ''}"`).join(',')),
    ].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `learners_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const filteredLearners = learners.filter(l => {
    const matchForm   = selectedForm   === 'all' || l.form   === selectedForm;
    const matchStatus = selectedStatus === 'all' || l.status === selectedStatus;
    const matchSearch = !searchTerm ||
      l.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.reg_number?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchForm && matchStatus && matchSearch;
  });

  const stats = {
    total:    learners.length,
    active:   learners.filter(l => l.status === 'Active').length,
    inactive: learners.filter(l => l.status === 'Inactive').length,
    forms:    [...new Set(learners.map(l => l.form).filter(Boolean))].length,
  };

  const formBadge = (form) => {
    const map = { 'Form 1': 'bg-teal-50 text-teal-700', 'Form 2': 'bg-sky-50 text-sky-700', 'Form 3': 'bg-indigo-50 text-indigo-700', 'Form 4': 'bg-purple-50 text-purple-700' };
    return map[form] || 'bg-gray-100 text-gray-600';
  };

  if (loading) return (
    <div className="flex justify-center py-12">
      <div className="w-7 h-7 border-4 border-[#006770] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-4">

      {/* Stat strip */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total',    value: stats.total,    color: 'bg-[#003B46] text-white' },
          { label: 'Active',   value: stats.active,   color: 'bg-green-600 text-white' },
          { label: 'Inactive', value: stats.inactive, color: 'bg-red-500 text-white'   },
          { label: 'Forms',    value: stats.forms,    color: 'bg-[#00B4D8] text-white' },
        ].map(s => (
          <div key={s.label} className={`${s.color} rounded-xl px-4 py-3`}>
            <p className="text-xl font-black leading-none">{s.value}</p>
            <p className="text-[10px] font-semibold opacity-80 mt-0.5 uppercase tracking-wide">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Password reset banner */}
      {showCredentials && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-green-800 mb-1">Password reset for {showCredentials.name}</p>
            <div className="flex gap-4 text-xs text-green-700">
              <span>Reg #: <code className="bg-green-100 px-1.5 py-0.5 rounded font-mono">{showCredentials.regNumber}</code></span>
              <span>Password: <code className="bg-green-100 px-1.5 py-0.5 rounded font-mono">{showCredentials.password}</code></span>
            </div>
            <p className="text-[10px] text-green-600 mt-1.5">Share these with the learner. Auto-dismiss in 10 s.</p>
          </div>
          <button onClick={() => setShowCredentials(null)} className="text-green-400 hover:text-green-600 flex-shrink-0">
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="relative sm:col-span-2">
            <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search name or reg number…" value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#00B4D8] focus:border-[#00B4D8] transition" />
          </div>
          <select value={selectedForm} onChange={e => setSelectedForm(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#00B4D8] focus:border-[#00B4D8]">
            {forms.map(f => <option key={f} value={f}>{f === 'all' ? 'All Forms' : f}</option>)}
          </select>
          <select value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#00B4D8] focus:border-[#00B4D8]">
            {statuses.map(s => <option key={s} value={s}>{s === 'all' ? 'All Status' : s}</option>)}
          </select>
        </div>
        <div className="flex items-center justify-between mt-3">
          <span className="text-xs text-gray-400">{filteredLearners.length} of {learners.length} learners</span>
          <button onClick={handleDownload} disabled={!filteredLearners.length}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#006770] bg-[#006770]/10 rounded-lg hover:bg-[#006770]/20 transition disabled:opacity-40">
            <ArrowDownTrayIcon className="w-3.5 h-3.5" /> Download CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead className="bg-gray-50">
              <tr>
                {['Student', 'Reg #', 'Form', 'Status', 'Enrolled', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredLearners.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <UserCircleIcon className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">No learners match your filters.</p>
                  </td>
                </tr>
              ) : filteredLearners.map(l => (
                <tr key={l.id} className="hover:bg-[#f0faf9] transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-[#006770]/10 flex items-center justify-center text-xs font-bold text-[#006770] flex-shrink-0">
                        {l.name?.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-semibold text-[#003B46]">{l.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <code className="text-xs font-mono bg-gray-50 px-2 py-0.5 rounded border border-gray-200 text-gray-600">{l.reg_number}</code>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${formBadge(l.form)}`}>{l.form || '—'}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      l.status === 'Active'   ? 'bg-green-100 text-green-700' :
                      l.status === 'Inactive' ? 'bg-red-100 text-red-600'    : 'bg-gray-100 text-gray-600'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        l.status === 'Active' ? 'bg-green-500' : l.status === 'Inactive' ? 'bg-red-500' : 'bg-gray-400'
                      }`} />
                      {l.status || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">
                    {l.enrollment_date ? new Date(l.enrollment_date).toLocaleDateString('en', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => { setSelectedLearner(l); setShowDetailsModal(true); }}
                        className="p-1.5 text-[#00B4D8] hover:bg-[#00B4D8]/10 rounded-lg transition" title="View">
                        <EyeIcon className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleResetPassword(l.id, l.name, l.reg_number)} disabled={actionLoading === l.id}
                        className="p-1.5 text-amber-500 hover:bg-amber-50 rounded-lg transition disabled:opacity-40" title="Reset Password">
                        <KeyIcon className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleToggleStatus(l.id, l.status)} disabled={actionLoading === l.id}
                        className={`p-1.5 rounded-lg transition disabled:opacity-40 ${
                          l.status === 'Active' ? 'text-red-400 hover:bg-red-50' : 'text-green-500 hover:bg-green-50'
                        }`} title={l.status === 'Active' ? 'Deactivate' : 'Activate'}>
                        {l.status === 'Active' ? <NoSymbolIcon className="w-4 h-4" /> : <CheckCircleIcon className="w-4 h-4" />}
                      </button>
                      <button onClick={() => handleDelete(l.id, l.name)} disabled={actionLoading === l.id}
                        className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition disabled:opacity-40" title="Delete">
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details modal */}
      {showDetailsModal && selectedLearner && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100" style={{ background: '#003B46' }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-sm font-bold text-white">
                  {selectedLearner.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-bold text-white">{selectedLearner.name}</p>
                  <p className="text-[10px] text-white/60">{selectedLearner.form}</p>
                </div>
              </div>
              <button onClick={() => setShowDetailsModal(false)} className="p-1 rounded-lg hover:bg-white/10 transition">
                <XMarkIcon className="w-4 h-4 text-white/70" />
              </button>
            </div>
            <div className="p-5 space-y-2">
              {[
                ['Registration #', selectedLearner.reg_number],
                ['Form',          selectedLearner.form],
                ['Status',        selectedLearner.status],
                ['Gender',        selectedLearner.gender],
                ['Date of Birth', selectedLearner.date_of_birth],
                ['Enrolled',      selectedLearner.enrollment_date ? new Date(selectedLearner.enrollment_date).toLocaleDateString() : null],
                ['Address',       selectedLearner.address],
              ].map(([label, val]) => val ? (
                <div key={label} className="flex justify-between text-sm py-1.5 border-b border-gray-50 last:border-0">
                  <span className="text-gray-400 text-xs">{label}</span>
                  <span className="font-medium text-[#003B46] text-xs">{val}</span>
                </div>
              ) : null)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
