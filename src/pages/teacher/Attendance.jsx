import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/common/Sidebar';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { formatDate } from '../../utils/helpers';

export default function TeacherAttendance() {
  const [learners, setLearners] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    learnerId: '',
    date: new Date().toISOString().split('T')[0],
    status: 'present'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [learnersRes, attendanceRes] = await Promise.all([
        api.get('/api/teacher/learners'),
        api.get('/api/teacher/attendance')
      ]);
      
      // FIXED: Handle different response structures
      const learnersData = learnersRes.data?.learners || learnersRes.data || [];
      const attendanceData = attendanceRes.data?.data?.records || attendanceRes.data || [];
      
      console.log('📊 Loaded learners:', learnersData.length);
      console.log('📊 Loaded attendance:', attendanceData.length);
      console.log('📊 Sample learner ID:', learnersData[0]?.id, typeof learnersData[0]?.id);
      
      setLearners(learnersData);
      setAttendance(attendanceData);
    } catch (error) {
      console.error('Error loading attendance data:', error);
      toast.error('Failed to load data. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleRecordAttendance = async () => {
    if (!formData.learnerId) {
      toast.error('Please select a learner');
      return;
    }

    // Validate date is not in the future
    const selectedDate = new Date(formData.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate > today) {
      toast.error('Cannot record attendance for future dates');
      return;
    }

    // Check if attendance already recorded for this learner on this date
    const existingRecord = attendance.find(
      record => record.learner_id === formData.learnerId && record.date === formData.date
    );
    
    if (existingRecord) {
      toast.error(`Attendance already recorded for this learner on ${formData.date}`);
      return;
    }

    const payload = {
      learnerId: formData.learnerId,
      date: formData.date,
      status: formData.status
    };
    
    console.log('📤 Sending attendance payload:', payload);
    
    try {
      const response = await api.post('/api/teacher/attendance', payload);
      console.log('✅ Attendance response:', response.data);
      
      if (response.data.success) {
        // FIXED: Handle different response structures
        const newRecord = response.data.attendance || response.data.data;
        
        // Add the new record to the list (display at top)
        setAttendance([newRecord, ...attendance]);
        toast.success(`Attendance recorded: ${getLearnerName(formData.learnerId)} - ${formData.status}`);
        
        // Reset form but keep current date
        setFormData({
          ...formData,
          learnerId: '',
          status: 'present'
        });
      } else {
        toast.error(response.data.message || 'Failed to record attendance');
      }
    } catch (error) {
      console.error('❌ Error recording attendance:', error);
      console.error('Error details:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      // Handle specific error cases
      if (error.response?.status === 409) {
        toast.error('Attendance already recorded for this learner on this date');
      } else if (error.response?.status === 400) {
        toast.error(error.response?.data?.message || 'Invalid data provided');
      } else if (error.response?.status === 404) {
        toast.error('Learner not found');
      } else if (error.response?.status === 500) {
        toast.error('Server error. Please try again later.');
      } else {
        const errorMsg = error.response?.data?.message || 'Failed to record attendance';
        toast.error(errorMsg);
      }
    }
  };

  const getStatusBadgeClass = (status) => {
    switch(status?.toLowerCase()) {
      case 'present': return 'badge-green';
      case 'absent': return 'badge-red';
      case 'late': return 'badge-gold';
      default: return 'badge';
    }
  };

  const getStatusDisplayText = (status) => {
    switch(status?.toLowerCase()) {
      case 'present': return 'Present';
      case 'absent': return 'Absent';
      case 'late': return 'Late';
      default: return status || 'Unknown';
    }
  };

  const getLearnerName = (learnerId) => {
    const learner = learners.find(l => l.id === learnerId);
    return learner?.name || learner?.full_name || 'Unknown';
  };

  const getLearnerReg = (learnerId) => {
    const learner = learners.find(l => l.id === learnerId);
    return learner?.reg_number || learner?.reg || '';
  };

  const getLearnerForm = (learnerId) => {
    const learner = learners.find(l => l.id === learnerId);
    return learner?.form || learner?.class || 'N/A';
  };

  // Calculate today's attendance summary
  const today = new Date().toISOString().split('T')[0];
  const todayAttendance = attendance.filter(record => record.date === today);
  const todayPresent = todayAttendance.filter(r => r.status?.toLowerCase() === 'present').length;
  const todayAbsent = todayAttendance.filter(r => r.status?.toLowerCase() === 'absent').length;
  const todayLate = todayAttendance.filter(r => r.status?.toLowerCase() === 'late').length;

  if (loading) {
    return (
      <div className="min-h-screen bg-paper flex">
        <Sidebar />
        <main className="flex-1 p-8 flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl mb-4 animate-pulse">📅</div>
            <p className="text-muted">Loading attendance records...</p>
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
          <h1 className="page-title">Attendance</h1>
          <p className="page-subtitle">Record and manage daily attendance</p>
        </div>

        {/* Today's Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-[#d4cfc6] p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">Today's Present</div>
                <div className="text-2xl font-bold text-green-600">{todayPresent}</div>
              </div>
              <div className="text-3xl">✅</div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-[#d4cfc6] p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">Today's Absent</div>
                <div className="text-2xl font-bold text-red-600">{todayAbsent}</div>
              </div>
              <div className="text-3xl">❌</div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-[#d4cfc6] p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">Today's Late</div>
                <div className="text-2xl font-bold text-yellow-600">{todayLate}</div>
              </div>
              <div className="text-3xl">⏰</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Record Attendance Form */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Record Attendance</h2>
            </div>
            <div className="card-body">
              <div className="space-y-4">
                <div className="form-group">
                  <label className="form-label">Date</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    className="form-input w-full"
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Learner</label>
                  <select
                    value={formData.learnerId}
                    onChange={(e) => setFormData({...formData, learnerId: e.target.value})}
                    className="form-select w-full"
                  >
                    <option value="">Select learner</option>
                    {learners.map(learner => (
                      <option key={learner.id} value={learner.id}>
                        {learner.name || learner.full_name} ({learner.form || learner.class}) - {learner.reg_number || learner.reg}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Status</label>
                  <div className="flex gap-4 mt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="status"
                        value="present"
                        checked={formData.status === 'present'}
                        onChange={(e) => setFormData({...formData, status: e.target.value})}
                        className="w-4 h-4 text-green-600"
                      />
                      <span className="badge badge-green">Present</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="status"
                        value="absent"
                        checked={formData.status === 'absent'}
                        onChange={(e) => setFormData({...formData, status: e.target.value})}
                        className="w-4 h-4 text-red-600"
                      />
                      <span className="badge badge-red">Absent</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="status"
                        value="late"
                        checked={formData.status === 'late'}
                        onChange={(e) => setFormData({...formData, status: e.target.value})}
                        className="w-4 h-4 text-yellow-600"
                      />
                      <span className="badge badge-gold">Late</span>
                    </label>
                  </div>
                </div>

                <button
                  onClick={handleRecordAttendance}
                  className="btn btn-teal w-full mt-4"
                  disabled={!formData.learnerId}
                >
                  ✔ Record Attendance
                </button>
              </div>
            </div>
          </div>

          {/* Attendance Log */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Attendance Log</h2>
              <span className="text-sm text-muted">
                Total: {attendance.length} records
              </span>
            </div>
            <div className="card-body p-0 max-h-[500px] overflow-y-auto">
              {attendance.length > 0 ? (
                <table className="table w-full">
                  <thead className="sticky top-0 bg-white border-b border-gray-200">
                    <tr>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Learner</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Form</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Reg No</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Date</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {[...attendance]
                      .sort((a, b) => new Date(b.date) - new Date(a.date))
                      .map((record) => (
                        <tr key={record.id} className="hover:bg-gray-50 transition">
                          <td className="py-3 px-4 text-sm font-medium">{getLearnerName(record.learner_id)}</td>
                          <td className="py-3 px-4 text-sm">
                            <span className="px-2 py-1 rounded text-xs font-semibold bg-[#c9933a]/10 text-[#c9933a]">
                              {getLearnerForm(record.learner_id)}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-xs font-mono text-gray-500">
                            {getLearnerReg(record.learner_id)}
                          </td>
                          <td className="py-3 px-4 text-sm">{formatDate(record.date)}</td>
                          <td className="py-3 px-4">
                            <span className={`badge ${getStatusBadgeClass(record.status)}`}>
                              {getStatusDisplayText(record.status)}
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-12 text-muted">
                  <div className="text-4xl mb-2">📅</div>
                  <p>No attendance records yet</p>
                  <p className="text-sm mt-1">Record attendance using the form on the left</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}