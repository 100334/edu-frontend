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
    loadAttendance();
  }, []);

  const loadAttendance = async () => {
    try {
      const response = await api.get(`/attendance/learner/${user.id}`);
      setAttendance(response.data.records);
      setStats(response.data.stats);
    } catch (error) {
      toast.error('Failed to load attendance');
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

  const getDayName = (dateStr) => {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en', { weekday: 'long' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-paper flex">
        <Sidebar />
        <main className="flex-1 p-8 flex items-center justify-center">
          <div className="spinner w-12 h-12"></div>
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

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={<CalendarIcon className="w-6 h-6" />}
            value={`${stats.rate}%`}
            label="Attendance Rate"
            color={stats.rate >= 80 ? 'green' : stats.rate >= 60 ? 'gold' : 'red'}
          />
          <StatCard
            icon={<CheckCircleIcon className="w-6 h-6" />}
            value={stats.present}
            label="Days Present"
            color="green"
          />
          <StatCard
            icon={<XCircleIcon className="w-6 h-6" />}
            value={stats.absent}
            label="Days Absent"
            color="red"
          />
          <StatCard
            icon={<ClockIcon className="w-6 h-6" />}
            value={stats.late}
            label="Days Late"
            color="gold"
          />
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Attendance Record</h2>
          </div>
          <div className="card-body p-0">
            {attendance.length > 0 ? (
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Day</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {attendance.map((record) => (
                    <tr key={record.id}>
                      <td>{formatDate(record.date)}</td>
                      <td className="text-muted">{getDayName(record.date)}</td>
                      <td>
                        <span className={`badge ${getStatusBadgeClass(record.status)}`}>
                          {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">📅</div>
                <div className="empty-state-text">
                  No attendance records yet.
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}