import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/common/Sidebar';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { formatDate } from '../../utils/helpers';
import { CalendarIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function LearnerAttendance() {
  const { user } = useAuth();
  const [attendance, setAttendance] = useState([]);
  const [visits, setVisits] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadAttendance();
    }
  }, [user]);

  const loadAttendance = async () => {
    try {
      const response = await api.get(`/api/learner/attendance`);
      const payload = response.data?.data || response.data;
      setAttendance(payload?.records || []);
      setVisits(payload?.stats?.visits ?? payload?.stats?.total ?? 0);
    } catch (error) {
toast.error('Failed to load visit history');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-paper flex">
        <Sidebar />
        <main className="flex-1 p-8 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#c9933a] mx-auto mb-4"></div>
            <p className="text-gray-600">Loading attendance records...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper flex">
      <Sidebar />
      
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="page-header">
          <h1 className="page-title">Visit History</h1>
          <p className="page-subtitle">Your successful learner logins</p>
        </div>

        <div className="mb-8 rounded-xl border border-[#d4cfc6] bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <CalendarIcon className="h-7 w-7 text-[#c9933a]" />
            <div>
              <p className="text-2xl font-bold text-[#0f1923]">{visits}</p>
              <p className="text-xs font-semibold uppercase text-gray-500">Successful logins</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Login History</h2>
            <span className="text-sm text-muted">
              Total: {visits} visits
            </span>
          </div>
          <div className="card-body p-0">
            {attendance.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="table w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Time</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Visit</th>
                    </tr>
                    </thead>
                  <tbody className="divide-y divide-gray-100">
                    {[...attendance]
                      .sort((a, b) => new Date(b.date) - new Date(a.date))
                      .map((record) => (
                        <tr key={record.id} className="hover:bg-gray-50 transition">
                          <td className="px-4 py-3 text-sm font-mono">{formatDate(record.logged_in_at || record.date)}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{new Date(record.logged_in_at || record.date).toLocaleTimeString()}</td>
                          <td className="px-4 py-3">
                            <span className="badge badge-green">Login</span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state py-12 text-center">
                <div className="text-5xl mb-4">📅</div>
                <div className="text-gray-500 font-medium mb-2">No visit records yet</div>
                <p className="text-sm text-gray-400">Your successful logins will appear here</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}