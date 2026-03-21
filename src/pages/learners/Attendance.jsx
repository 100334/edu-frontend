import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/common/Sidebar';
import StatCard from '../../components/common/StatCard';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { formatDate } from '../../utils/helpers';
import { CalendarIcon, CheckCircleIcon, XCircleIcon, ClockIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function LearnerAttendance() {
  const { user } = useAuth();
  const [attendance, setAttendance] = useState([]);
  const [stats, setStats] = useState({
    present: 0,
    absent: 0,
    late: 0,
    rate: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadAttendance();
    }
  }, [user]);

  const loadAttendance = async () => {
    try {
      // FIXED: Correct API endpoint - matches backend route
      const response = await api.get(`/api/learner/attendance`);
      
      // Handle different response structures
      const records = response.data?.records || response.data || [];
      const statsData = response.data?.stats || {};
      
      setAttendance(records);
      setStats({
        present: statsData.present || 0,
        absent: statsData.absent || 0,
        late: statsData.late || 0,
        rate: statsData.rate || 0
      });
    } catch (error) {
      console.error('Failed to load attendance:', error);
      toast.error('Failed to load attendance records');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch(status) {
      case 'present': return 'badge-green';
      case 'absent': return 'badge-red';
      case 'late': return 'badge-gold';
      default: return 'badge';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'present': return '✅';
      case 'absent': return '❌';
      case 'late': return '⏰';
      default: return '📅';
    }
  };

  const getDayName = (dateStr) => {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en', { weekday: 'long' });
  };

  const getAttendanceMessage = () => {
    if (stats.rate >= 90) return 'Excellent attendance! Keep it up! 🎯';
    if (stats.rate >= 75) return 'Good attendance record 👍';
    if (stats.rate >= 60) return 'Consider improving your attendance 📈';
    return 'Please focus on regular attendance ⚠️';
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
          <h1 className="page-title">My Attendance</h1>
          <p className="page-subtitle">Track your daily attendance record</p>
        </div>

        {/* Attendance Message */}
        <div className="mb-6 p-4 bg-[#c9933a]/5 rounded-xl border border-[#c9933a]/20">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{stats.rate >= 75 ? '🎉' : stats.rate >= 50 ? '📈' : '⚠️'}</span>
            <p className="text-gray-700">{getAttendanceMessage()}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-[#d4cfc6] p-4 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between mb-2">
              <CalendarIcon className="w-6 h-6 text-[#c9933a]" />
              <span className="text-2xl">{stats.rate}%</span>
            </div>
            <p className="text-xs text-gray-500 font-semibold uppercase">Attendance Rate</p>
            <div className="mt-2 w-full h-1 bg-gray-200 rounded-full">
              <div 
                className="h-1 bg-[#c9933a] rounded-full transition-all duration-500" 
                style={{ width: `${stats.rate}%` }}
              ></div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-[#d4cfc6] p-4 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between mb-2">
              <CheckCircleIcon className="w-6 h-6 text-green-600" />
              <span className="text-2xl font-bold text-green-600">{stats.present}</span>
            </div>
            <p className="text-xs text-gray-500 font-semibold uppercase">Days Present</p>
          </div>
          
          <div className="bg-white rounded-xl border border-[#d4cfc6] p-4 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between mb-2">
              <XCircleIcon className="w-6 h-6 text-red-600" />
              <span className="text-2xl font-bold text-red-600">{stats.absent}</span>
            </div>
            <p className="text-xs text-gray-500 font-semibold uppercase">Days Absent</p>
          </div>
          
          <div className="bg-white rounded-xl border border-[#d4cfc6] p-4 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between mb-2">
              <ClockIcon className="w-6 h-6 text-[#c9933a]" />
              <span className="text-2xl font-bold text-[#c9933a]">{stats.late}</span>
            </div>
            <p className="text-xs text-gray-500 font-semibold uppercase">Days Late</p>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Attendance Record</h2>
            <span className="text-sm text-muted">
              Total: {attendance.length} records
            </span>
          </div>
          <div className="card-body p-0">
            {attendance.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="table w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Day</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                    </tr>
                    </thead>
                  <tbody className="divide-y divide-gray-100">
                    {[...attendance]
                      .sort((a, b) => new Date(b.date) - new Date(a.date))
                      .map((record) => (
                        <tr key={record.id} className="hover:bg-gray-50 transition">
                          <td className="px-4 py-3 text-sm font-mono">{formatDate(record.date)}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{getDayName(record.date)}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{getStatusIcon(record.status)}</span>
                              <span className={`badge ${getStatusBadgeClass(record.status)}`}>
                                {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state py-12 text-center">
                <div className="text-5xl mb-4">📅</div>
                <div className="text-gray-500 font-medium mb-2">No attendance records yet</div>
                <p className="text-sm text-gray-400">Your attendance will appear here once recorded</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}