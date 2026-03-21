import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';

const SUBJECTS = ["Mathematics", "English", "Science", "Social Studies", "Chichewa", "Creative Arts"];

// Grade classification function
const getGradeFromScore = (score) => {
  if (score >= 75) {
    return {
      letter: 'A',
      description: 'Excellent',
      color: '#1e7e4a',
      bgColor: '#e8f5e9'
    };
  } else if (score >= 65) {
    return {
      letter: 'B',
      description: 'Very good',
      color: '#2a9090',
      bgColor: '#e0f2f1'
    };
  } else if (score >= 55) {
    return {
      letter: 'C',
      description: 'Good',
      color: '#c9933a',
      bgColor: '#fff3e0'
    };
  } else if (score >= 40) {
    return {
      letter: 'D',
      description: 'Pass',
      color: '#f39c12',
      bgColor: '#ffe6cc'
    };
  } else {
    return {
      letter: 'F',
      description: 'Need improvement',
      color: '#c0392b',
      bgColor: '#ffebee'
    };
  }
};

export default function TeacherDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Data states
  const [learners, setLearners] = useState([]);
  const [reports, setReports] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [stats, setStats] = useState({
    totalLearners: 0,
    totalReports: 0,
    avgAttendance: 0,
    learnersByForm: {
      'Form 1': 0,
      'Form 2': 0,
      'Form 3': 0,
      'Form 4': 0
    }
  });
  
  // Form states
  const [showAddLearnerModal, setShowAddLearnerModal] = useState(false);
  const [newLearner, setNewLearner] = useState({ name: '', form: 'Form 1', status: 'Active' });
  
  // Report form states
  const [selectedLearnerId, setSelectedLearnerId] = useState('');
  const [reportTerm, setReportTerm] = useState('Term 1 – 2024');
  const [reportForm, setReportForm] = useState('Form 1');
  const [subjectScores, setSubjectScores] = useState({});
  const [teacherComment, setTeacherComment] = useState('');
  
  // Attendance form states
  const [attDate, setAttDate] = useState(new Date().toISOString().split('T')[0]);
  const [attLearnerId, setAttLearnerId] = useState('');
  const [attStatus, setAttStatus] = useState('present');
  
  // Modal states
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);

  // Load data
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [learnersRes, reportsRes, attendanceRes, statsRes] = await Promise.all([
        api.get('/api/teacher/learners'),
        api.get('/api/teacher/reports'),
        api.get('/api/teacher/attendance'),
        api.get('/api/teacher/dashboard/stats')
      ]);
      
      const learnersData = learnersRes.data || [];
      const reportsData = reportsRes.data || [];
      const attendanceData = attendanceRes.data || [];
      const statsData = statsRes.data || {};
      
      console.log('📊 Loaded data:', {
        learners: learnersData.length,
        reports: reportsData.length,
        attendance: attendanceData.length
      });
      
      setLearners(learnersData);
      setReports(reportsData);
      setAttendance(attendanceData);
      
      // Calculate attendance stats
      let totalAtt = 0, presentCount = 0;
      if (learnersData.length > 0) {
        learnersData.forEach(learner => {
          const records = attendanceData.filter(a => a.learner_id === learner.id);
          if (records.length) {
            const present = records.filter(a => a.status === 'present' || a.status === 'late').length;
            totalAtt += records.length;
            presentCount += present;
          }
        });
      }
      const avg = totalAtt ? Math.round(presentCount / totalAtt * 100) : 0;
      
      // Calculate learners by form
      const learnersByForm = {
        'Form 1': learnersData.filter(l => l?.form === 'Form 1').length,
        'Form 2': learnersData.filter(l => l?.form === 'Form 2').length,
        'Form 3': learnersData.filter(l => l?.form === 'Form 3').length,
        'Form 4': learnersData.filter(l => l?.form === 'Form 4').length
      };
      
      setStats({
        totalLearners: learnersData.length,
        totalReports: reportsData.length,
        avgAttendance: avg,
        learnersByForm: statsData.learnersByForm || learnersByForm
      });
    } catch (error) {
      console.error('Error loading dashboard:', error);
      toast.error('Failed to load dashboard data. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  // Generate preview registration number
  const generatePreviewReg = () => {
    const nextReg = learners.length + 1;
    return `EDU-${new Date().getFullYear()}-${String(nextReg).padStart(4, '0')}`;
  };

  // Add Learner
  const handleAddLearner = async () => {
    if (!newLearner.name.trim()) {
      toast.error('Please enter a name');
      return;
    }
    
    const payload = {
      name: newLearner.name.trim(),
      form: newLearner.form,
      status: newLearner.status
    };
    
    console.log('📤 Adding learner:', payload);
    
    try {
      const response = await api.post('/api/teacher/learners', payload);
      console.log('✅ Response:', response.data);
      
      if (response.data.success || response.data.learner) {
        toast.success(`Learner added! Reg#: ${response.data.learner?.reg_number || generatePreviewReg()}`);
        setShowAddLearnerModal(false);
        setNewLearner({ name: '', form: 'Form 1', status: 'Active' });
        loadDashboardData();
      } else {
        toast.error('Failed to add learner');
      }
    } catch (error) {
      console.error('❌ Error adding learner:', error.response?.data || error.message);
      
      if (error.response?.data?.error) {
        toast.error(`Server error: ${error.response.data.error}`);
        if (error.response.data.suggestion) {
          console.log('Suggestion:', error.response.data.suggestion);
        }
      } else if (error.response?.status === 500) {
        toast.error('Server error. Check the backend logs.');
      } else {
        toast.error('Failed to add learner. Please try again.');
      }
    }
  };

  // Remove Learner
  const handleRemoveLearner = async (id) => {
    if (!window.confirm('Remove this learner?')) return;
    
    try {
      await api.delete(`/api/teacher/learners/${id}`);
      toast.success('Learner removed');
      loadDashboardData();
    } catch (error) {
      console.error('Error removing learner:', error);
      toast.error('Failed to remove learner. Please try again.');
    }
  };

  // Save Report
  const handleSaveReport = async () => {
    if (!selectedLearnerId) {
      toast.error('Please select a learner');
      return;
    }
    
    const subjects = SUBJECTS.map(s => ({
      name: s,
      score: parseInt(subjectScores[s]) || 0
    }));
    
    const reportData = {
      learnerId: parseInt(selectedLearnerId),
      term: reportTerm,
      form: reportForm,
      subjects,
      comment: teacherComment
    };
    
    try {
      await api.post('/api/teacher/reports', reportData);
      toast.success('Report card saved! ✅');
      setSubjectScores({});
      setTeacherComment('');
      setSelectedLearnerId('');
      loadDashboardData();
    } catch (error) {
      console.error('Error saving report:', error);
      toast.error('Failed to save report. Please try again.');
    }
  };

  // Delete Report
  const handleDeleteReport = async (id) => {
    if (!window.confirm('Delete this report?')) return;
    
    try {
      await api.delete(`/api/teacher/reports/${id}`);
      toast.success('Report deleted');
      loadDashboardData();
    } catch (error) {
      console.error('Error deleting report:', error);
      toast.error('Failed to delete report. Please try again.');
    }
  };

  // View Report Modal
  const handleViewReport = (report) => {
    setSelectedReport(report);
    setShowReportModal(true);
  };

  // Save Attendance
  const handleSaveAttendance = async () => {
    if (!attLearnerId) {
      toast.error('Please select a learner');
      return;
    }
    
    const payload = {
      learnerId: parseInt(attLearnerId),
      date: attDate,
      status: attStatus
    };
    
    console.log('📤 Recording attendance:', payload);
    
    try {
      const response = await api.post('/api/teacher/attendance', payload);
      console.log('✅ Response:', response.data);
      toast.success('Attendance recorded ✔');
      setAttLearnerId('');
      loadDashboardData();
    } catch (error) {
      console.error('❌ Error recording attendance:', error.response?.data || error.message);
      
      if (error.response?.data?.error) {
        toast.error(`Server error: ${error.response.data.error}`);
      } else {
        toast.error('Failed to record attendance. Please try again.');
      }
    }
  };

  // Helper functions
  const formatDate = (dateStr) => {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  const getLearnerName = (learnerId) => {
    if (!learners || !Array.isArray(learners)) return 'Unknown';
    const learner = learners.find(l => l?.id === learnerId);
    return learner?.name || 'Unknown';
  };

  const getLearnerReg = (learnerId) => {
    if (!learners || !Array.isArray(learners)) return 'N/A';
    const learner = learners.find(l => l?.id === learnerId);
    return learner?.reg_number || learner?.reg || 'N/A';
  };

  const getLearnerForm = (learnerId) => {
    if (!learners || !Array.isArray(learners)) return 'N/A';
    const learner = learners.find(l => l?.id === learnerId);
    return learner?.form || 'N/A';
  };

  const getReportHTML = (report) => {
    if (!report || !report.subjects) return '<div>No report data</div>';
    
    const avg = Math.round(report.subjects.reduce((s, x) => s + x.score, 0) / report.subjects.length);
    const learner = learners?.find(l => l?.id === report.learner_id);
    const avgGrade = getGradeFromScore(avg);
    
    return `
      <div style="background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(15,25,35,0.1);">
        <div style="background: #0f1923; color: white; padding: 20px 24px;">
          <div style="font-family: 'Playfair Display', serif; font-size: 18px; font-weight: 700; color: #c9933a; margin-bottom: 4px;">EduPortal Academy</div>
          <div style="font-size: 12px; opacity: 0.6;">${report.term} · ${report.form}</div>
          <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.1);">
            <div style="font-weight: 600;">${learner?.name || 'Unknown'}</div>
            <div style="font-family: monospace; font-size: 11px; opacity: 0.6; margin-top: 2px;">${getLearnerReg(report.learner_id)}</div>
          </div>
        </div>
        <div style="padding: 20px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #6b7280;">Academic Performance</div>
            <div style="text-align: right;">
              <div style="font-size: 20px; font-weight: bold; color: ${avgGrade.color};">${avg}%</div>
              <div style="font-size: 12px; font-weight: 600; color: ${avgGrade.color};">${avgGrade.letter} - ${avgGrade.description}</div>
            </div>
          </div>
          <div style="margin-bottom: 20px;">
            <div style="display: grid; grid-template-columns: 1fr 80px 50px; gap: 8px; font-size: 12px; font-weight: 600; color: #6b7280; padding-bottom: 8px; border-bottom: 2px solid #ede9e1;">
              <div>Subject</div>
              <div style="text-align: right;">Score</div>
              <div style="text-align: right;">Grade</div>
            </div>
            ${report.subjects.map(s => {
              const grade = getGradeFromScore(s.score);
              return `
                <div style="display: grid; grid-template-columns: 1fr 80px 50px; gap: 8px; align-items: center; padding: 10px 0; border-bottom: 1px solid #ede9e1;">
                  <div style="font-size: 14px; font-weight: 500;">${s.name}</div>
                  <div style="text-align: right; font-family: monospace; font-size: 14px; font-weight: 500; color: ${grade.color};">${s.score}%</div>
                  <div style="text-align: right;">
                    <span style="display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: 600; background: ${grade.bgColor}; color: ${grade.color};">${grade.letter}</span>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
          ${report.comment ? `
            <div style="margin-top: 16px; padding: 12px; background: #f7f4ef; border-radius: 8px; border-left: 3px solid #c9933a;">
              <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #6b7280; margin-bottom: 4px;">Teacher's Comment</div>
              <div style="font-size: 13px; color: #0f1923;">${report.comment}</div>
            </div>
          ` : ''}
          <div style="margin-top: 16px; padding-top: 12px; border-top: 1px solid #ede9e1;">
            <div style="display: flex; justify-content: space-between; font-size: 12px;">
              <span style="color: #6b7280;">Overall Performance:</span>
              <span style="font-weight: 600; color: ${avgGrade.color};">${avgGrade.description}</span>
            </div>
          </div>
        </div>
      </div>
    `;
  };

  // Handle logout
  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Get user name
  const getUserName = () => {
    if (user?.name) return user.name;
    if (user?.email) return user.email.split('@')[0];
    return 'Teacher';
  };

  // Get current time greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  // Mobile tab navigation component
  const MobileTabNav = () => (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 shadow-lg">
      <div className="flex justify-around py-2">
        {['overview', 'learners', 'reports', 'attendance'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex flex-col items-center px-3 py-2 rounded-lg transition-all ${
              activeTab === tab
                ? 'text-[#c9933a]'
                : 'text-gray-500'
            }`}
          >
            <span className="text-xl">
              {tab === 'overview' && '📊'}
              {tab === 'learners' && '👥'}
              {tab === 'reports' && '📋'}
              {tab === 'attendance' && '📅'}
            </span>
            <span className="text-xs mt-1 capitalize">{tab}</span>
          </button>
        ))}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f4ef] flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-pulse">📚</div>
          <p className="text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f4ef] flex pb-16 lg:pb-0">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-[#0f1923] to-[#1a2d3f] text-white w-full fixed top-0 left-0 right-0 z-30">
        <div className="container mx-auto px-4 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#c9933a] rounded-xl flex items-center justify-center">
                <span className="text-xl font-bold text-[#0f1923]">E</span>
              </div>
              <div>
                <h1 className="text-xl font-serif font-bold">EduPortal Academy</h1>
                <p className="text-xs text-gray-300 hidden sm:block">Excellence in Education</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-3 bg-white/10 rounded-lg px-3 py-1.5">
                <div className="w-8 h-8 bg-[#c9933a] rounded-full flex items-center justify-center text-sm">
                  👨‍🏫
                </div>
                <div>
                  <div className="text-sm font-semibold">{getUserName()}</div>
                  <div className="text-xs text-gray-300">Class Teacher</div>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm"
              >
                Logout
              </button>
            </div>
          </div>
          <div className="mt-2">
            <div className="text-sm text-[#c9933a] font-semibold uppercase tracking-wide">
              Welcome Back
            </div>
            <div className="text-xl font-serif font-bold">
              {getGreeting()}, {getUserName()}! 👋
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile Header Spacer */}
      <div className="h-32 lg:hidden"></div>
      
      {/* Tab Navigation */}
      <div className="fixed top-28 lg:top-24 left-0 right-0 z-20 bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide py-2">
            {['overview', 'learners', 'reports', 'attendance'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 lg:px-5 py-2 text-sm font-medium rounded-lg transition-all whitespace-nowrap ${
                  activeTab === tab
                    ? 'bg-[#0f1923] text-white shadow-md'
                    : 'text-gray-600 hover:text-[#0f1923] hover:bg-gray-100'
                }`}
              >
                {tab === 'overview' && '📊 Overview'}
                {tab === 'learners' && '👥 Learners'}
                {tab === 'reports' && '📋 Report Cards'}
                {tab === 'attendance' && '📅 Attendance'}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      <main className="flex-1 overflow-y-auto mt-44 lg:mt-36 pb-20 lg:pb-8">
        <div className="container mx-auto px-4 lg:px-8 max-w-7xl">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <>
              <div className="mb-6 lg:mb-8">
                <p className="text-sm text-gray-500">Here's what's happening with your students today.</p>
              </div>
              
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6 mb-6 lg:mb-8">
                <div className="bg-white rounded-xl border border-[#d4cfc6] p-4 lg:p-6 shadow-sm hover:shadow-md transition">
                  <div className="text-2xl lg:text-3xl mb-2 lg:mb-3">👥</div>
                  <div className="text-xl lg:text-3xl font-bold text-[#0f1923] mb-1">{stats.totalLearners}</div>
                  <div className="text-[10px] lg:text-xs text-gray-500 font-semibold uppercase">Total Learners</div>
                </div>
                <div className="bg-white rounded-xl border border-[#d4cfc6] p-4 lg:p-6 shadow-sm hover:shadow-md transition">
                  <div className="text-2xl lg:text-3xl mb-2 lg:mb-3">📋</div>
                  <div className="text-xl lg:text-3xl font-bold text-[#0f1923] mb-1">{stats.totalReports}</div>
                  <div className="text-[10px] lg:text-xs text-gray-500 font-semibold uppercase">Reports</div>
                </div>
                <div className="bg-white rounded-xl border border-[#d4cfc6] p-4 lg:p-6 shadow-sm hover:shadow-md transition">
                  <div className="text-2xl lg:text-3xl mb-2 lg:mb-3">📅</div>
                  <div className="text-xl lg:text-3xl font-bold text-[#0f1923] mb-1">{stats.avgAttendance}%</div>
                  <div className="text-[10px] lg:text-xs text-gray-500 font-semibold uppercase">Attendance</div>
                </div>
                <div className="bg-white rounded-xl border border-[#d4cfc6] p-4 lg:p-6 shadow-sm hover:shadow-md transition">
                  <div className="text-2xl lg:text-3xl mb-2 lg:mb-3">⭐</div>
                  <div className="text-xl lg:text-3xl font-bold text-[#0f1923] mb-1">{stats.totalLearners}</div>
                  <div className="text-[10px] lg:text-xs text-gray-500 font-semibold uppercase">Active</div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl border border-[#d4cfc6] shadow-sm overflow-hidden">
                  <div className="px-4 lg:px-6 py-3 lg:py-4 border-b border-[#d4cfc6]">
                    <h2 className="font-semibold text-[#0f1923] text-sm lg:text-base">Recent Learners</h2>
                  </div>
                  <div className="p-4 lg:p-6">
                    {learners && learners.length > 0 ? (
                      learners.slice(-5).reverse().map(learner => (
                        <div key={learner.id} className="flex items-center justify-between py-2 lg:py-3 border-b border-[#ede9e1] last:border-0">
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-[#0f1923] text-sm lg:text-base truncate">{learner.name}</div>
                            <div className="font-mono text-[10px] lg:text-xs bg-[#0f1923] text-[#c9933a] px-2 py-1 rounded mt-1 inline-block">
                              {learner.reg_number || learner.reg}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-1 rounded-full text-[10px] lg:text-xs font-semibold bg-[#c9933a]/10 text-[#c9933a]">
                              {learner.form}
                            </span>
                            <span className={`ml-2 px-2 py-1 rounded-full text-[10px] lg:text-xs font-semibold whitespace-nowrap ${
                              (learner.status === 'Active' || learner.status === undefined) 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {learner.status || 'Active'}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <div className="text-3xl lg:text-4xl mb-2">👥</div>
                        <div className="text-sm">No learners yet</div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="bg-white rounded-xl border border-[#d4cfc6] shadow-sm overflow-hidden">
                  <div className="px-4 lg:px-6 py-3 lg:py-4 border-b border-[#d4cfc6]">
                    <h2 className="font-semibold text-[#0f1923] text-sm lg:text-base">Quick Actions</h2>
                  </div>
                  <div className="p-4 lg:p-6 flex flex-col gap-2 lg:gap-3">
                    <button onClick={() => setShowAddLearnerModal(true)} className="px-3 lg:px-4 py-2 lg:py-2.5 bg-[#0f1923] text-white rounded-lg hover:bg-[#1a2d3f] transition text-sm font-medium">
                      ➕ Add New Learner
                    </button>
                    <button onClick={() => setActiveTab('reports')} className="px-3 lg:px-4 py-2 lg:py-2.5 bg-[#c9933a] text-[#0f1923] rounded-lg hover:bg-[#e8b96a] transition text-sm font-medium">
                      📋 Generate Report Card
                    </button>
                    <button onClick={() => setActiveTab('attendance')} className="px-3 lg:px-4 py-2 lg:py-2.5 bg-[#1a6b6b] text-white rounded-lg hover:bg-[#2a9090] transition text-sm font-medium">
                      📅 Record Attendance
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Learners Tab */}
          {activeTab === 'learners' && (
            <>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
                <div>
                  <h1 className="font-serif text-2xl lg:text-3xl font-bold text-[#0f1923] mb-1">Learners</h1>
                  <p className="text-sm text-gray-500">Manage enrolled students</p>
                </div>
                <button onClick={() => setShowAddLearnerModal(true)} className="w-full sm:w-auto px-4 py-2 bg-[#0f1923] text-white rounded-lg hover:bg-[#1a2d3f] transition font-semibold text-sm">
                  ➕ Add Learner
                </button>
              </div>
              
              <div className="bg-white rounded-xl border border-[#d4cfc6] shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[500px]">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 lg:px-6 py-2 lg:py-3 text-left text-xs font-semibold text-gray-500 uppercase">Name</th>
                        <th className="px-3 lg:px-6 py-2 lg:py-3 text-left text-xs font-semibold text-gray-500 uppercase">Reg No</th>
                        <th className="px-3 lg:px-6 py-2 lg:py-3 text-left text-xs font-semibold text-gray-500 uppercase">Form</th>
                        <th className="px-3 lg:px-6 py-2 lg:py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                        <th className="px-3 lg:px-6 py-2 lg:py-3 text-left text-xs font-semibold text-gray-500 uppercase">Actions</th>
                       </tr>
                       </thead>
                    <tbody className="divide-y divide-gray-200">
                      {learners && learners.length > 0 ? (
                        learners.map(learner => (
                          <tr key={learner.id} className="hover:bg-gray-50 transition">
                            <td className="px-3 lg:px-6 py-3 text-sm font-medium truncate max-w-[120px] lg:max-w-none">{learner.name}    </td>
                            <td className="px-3 lg:px-6 py-3 text-xs font-mono text-gray-600">{learner.reg_number || learner.reg}    </td>
                            <td className="px-3 lg:px-6 py-3 text-sm">{learner.form}    </td>
                            <td className="px-3 lg:px-6 py-3">
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                (learner.status === 'Active' || learner.status === undefined) 
                                  ? 'bg-green-100 text-green-700' 
                                  : 'bg-red-100 text-red-700'
                              }`}>
                                {learner.status || 'Active'}
                              </span>
                            </td>
                            <td className="px-3 lg:px-6 py-3">
                              <button onClick={() => handleRemoveLearner(learner.id)} className="text-red-600 hover:text-red-800 text-sm">
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" className="px-6 py-8 text-center text-gray-500 text-sm">
                            No learners added yet
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* Reports Tab */}
          {activeTab === 'reports' && (
            <>
              <div className="mb-6">
                <h1 className="font-serif text-2xl lg:text-3xl font-bold text-[#0f1923] mb-1">Report Cards</h1>
                <p className="text-sm text-gray-500">Create and manage academic reports</p>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Generate Report Card Form */}
                <div className="bg-white rounded-xl border border-[#d4cfc6] shadow-sm overflow-hidden">
                  <div className="px-4 lg:px-6 py-3 lg:py-4 border-b border-[#d4cfc6]">
                    <h2 className="font-semibold text-[#0f1923] text-sm lg:text-base">Generate Report Card</h2>
                  </div>
                  <div className="p-4 lg:p-6">
                    <div className="mb-4">
                      <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Select Learner</label>
                      <select
                        value={selectedLearnerId}
                        onChange={(e) => {
                          const learner = learners?.find(l => l?.id === parseInt(e.target.value));
                          setSelectedLearnerId(e.target.value);
                          if (learner) setReportForm(learner.form || 'Form 1');
                        }}
                        className="w-full px-3 lg:px-4 py-2 border border-gray-300 rounded-lg text-sm"
                      >
                        <option value="">Select a learner</option>
                        {learners && learners.map(learner => (
                          <option key={learner.id} value={learner.id}>
                            {learner.name} ({learner.reg_number || learner.reg})
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 lg:gap-4 mb-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Term</label>
                        <select value={reportTerm} onChange={(e) => setReportTerm(e.target.value)} className="w-full px-3 lg:px-4 py-2 border border-gray-300 rounded-lg text-sm">
                          <option>Term 1 – 2024</option>
                          <option>Term 2 – 2024</option>
                          <option>Term 3 – 2024</option>
                          <option>Term 1 – 2025</option>
                          <option>Term 2 – 2025</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Form</label>
                        <select value={reportForm} onChange={(e) => setReportForm(e.target.value)} className="w-full px-3 lg:px-4 py-2 border border-gray-300 rounded-lg text-sm">
                          <option>Form 1</option>
                          <option>Form 2</option>
                          <option>Form 3</option>
                          <option>Form 4</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Subject Scores</label>
                      {SUBJECTS.map(subject => (
                        <div key={subject} className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mb-2">
                          <label className="w-full sm:w-32 text-sm font-medium text-[#0f1923]">{subject}</label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            placeholder="Score"
                            value={subjectScores[subject] || ''}
                            onChange={(e) => setSubjectScores({...subjectScores, [subject]: e.target.value})}
                            className="w-full sm:flex-1 px-3 lg:px-4 py-2 border border-gray-300 rounded-lg text-sm"
                          />
                        </div>
                      ))}
                    </div>
                    
                    <div className="mb-4">
                      <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Comment</label>
                      <textarea
                        value={teacherComment}
                        onChange={(e) => setTeacherComment(e.target.value)}
                        placeholder="Write a brief comment..."
                        className="w-full px-3 lg:px-4 py-2 border border-gray-300 rounded-lg text-sm"
                        rows="3"
                      />
                    </div>
                    
                    <button onClick={handleSaveReport} className="w-full px-4 py-2 bg-[#c9933a] text-[#0f1923] rounded-lg hover:bg-[#e8b96a] transition font-semibold text-sm">
                      💾 Save Report Card
                    </button>
                  </div>
                </div>
                
                {/* Saved Reports List */}
                <div className="bg-white rounded-xl border border-[#d4cfc6] shadow-sm overflow-hidden">
                  <div className="px-4 lg:px-6 py-3 lg:py-4 border-b border-[#d4cfc6]">
                    <h2 className="font-semibold text-[#0f1923] text-sm lg:text-base">Saved Reports</h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[400px]">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 lg:px-4 py-2 lg:py-3 text-left text-xs font-semibold text-gray-500 uppercase">Learner</th>
                          <th className="px-3 lg:px-4 py-2 lg:py-3 text-left text-xs font-semibold text-gray-500 uppercase">Term</th>
                          <th className="px-3 lg:px-4 py-2 lg:py-3 text-left text-xs font-semibold text-gray-500 uppercase">Avg</th>
                          <th className="px-3 lg:px-4 py-2 lg:py-3 text-left text-xs font-semibold text-gray-500 uppercase">Actions</th>
                         </tr>
                         </thead>
                      <tbody className="divide-y divide-gray-200">
                        {reports && reports.length > 0 ? (
                          reports.map(report => {
                            const learner = learners?.find(l => l?.id === report.learner_id);
                            const avg = Math.round(report.subjects.reduce((s, x) => s + x.score, 0) / report.subjects.length);
                            const grade = getGradeFromScore(avg);
                            return (
                              <tr key={report.id}>
                                <td className="px-3 lg:px-4 py-3 text-sm font-medium truncate max-w-[100px] lg:max-w-none">{learner?.name || 'Unknown'}    </td>
                                <td className="px-3 lg:px-4 py-3"><span className="px-2 py-1 rounded-full text-xs font-semibold bg-[#1a6b6b]/10 text-[#1a6b6b]">{report.term}</span>    </td>
                                <td className="px-3 lg:px-4 py-3">
                                  <span className="font-semibold" style={{ color: grade.color }}>
                                    {avg}% ({grade.letter})
                                  </span>
                                 </td>
                                <td className="px-3 lg:px-4 py-3">
                                  <button onClick={() => handleViewReport(report)} className="text-blue-600 hover:text-blue-800 text-sm mr-2">View</button>
                                  <button onClick={() => handleDeleteReport(report.id)} className="text-red-600 hover:text-red-800 text-sm">Delete</button>
                                 </td>
                               </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan="4" className="px-4 py-8 text-center text-gray-500 text-sm">No reports yet</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Attendance Tab */}
          {activeTab === 'attendance' && (
            <>
              <div className="mb-6">
                <h1 className="font-serif text-2xl lg:text-3xl font-bold text-[#0f1923] mb-1">Attendance</h1>
                <p className="text-sm text-gray-500">Record and manage daily attendance</p>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Record Attendance Form */}
                <div className="bg-white rounded-xl border border-[#d4cfc6] shadow-sm overflow-hidden">
                  <div className="px-4 lg:px-6 py-3 lg:py-4 border-b border-[#d4cfc6]">
                    <h2 className="font-semibold text-[#0f1923] text-sm lg:text-base">Record Attendance</h2>
                  </div>
                  <div className="p-4 lg:p-6">
                    <div className="mb-4">
                      <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Date</label>
                      <input type="date" value={attDate} onChange={(e) => setAttDate(e.target.value)} className="w-full px-3 lg:px-4 py-2 border border-gray-300 rounded-lg text-sm" />
                    </div>
                    <div className="mb-4">
                      <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Learner</label>
                      <select value={attLearnerId} onChange={(e) => setAttLearnerId(e.target.value)} className="w-full px-3 lg:px-4 py-2 border border-gray-300 rounded-lg text-sm">
                        <option value="">Select a learner</option>
                        {learners && learners.map(learner => (
                          <option key={learner.id} value={learner.id}>
                            {learner.name} ({learner.form})
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="mb-4">
                      <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Status</label>
                      <div className="flex flex-wrap gap-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="radio" name="status" value="present" checked={attStatus === 'present'} onChange={(e) => setAttStatus(e.target.value)} />
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">Present</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="radio" name="status" value="absent" checked={attStatus === 'absent'} onChange={(e) => setAttStatus(e.target.value)} />
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">Absent</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="radio" name="status" value="late" checked={attStatus === 'late'} onChange={(e) => setAttStatus(e.target.value)} />
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">Late</span>
                        </label>
                      </div>
                    </div>
                    
                    <button onClick={handleSaveAttendance} className="w-full px-4 py-2 bg-[#1a6b6b] text-white rounded-lg hover:bg-[#2a9090] transition font-semibold text-sm">
                      ✔ Record Attendance
                    </button>
                  </div>
                </div>
                
                {/* Attendance Log */}
                <div className="bg-white rounded-xl border border-[#d4cfc6] shadow-sm overflow-hidden">
                  <div className="px-4 lg:px-6 py-3 lg:py-4 border-b border-[#d4cfc6]">
                    <h2 className="font-semibold text-[#0f1923] text-sm lg:text-base">Attendance Log</h2>
                  </div>
                  <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                    <table className="w-full min-w-[400px]">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-3 lg:px-4 py-2 lg:py-3 text-left text-xs font-semibold text-gray-500 uppercase">Learner</th>
                          <th className="px-3 lg:px-4 py-2 lg:py-3 text-left text-xs font-semibold text-gray-500 uppercase">Form</th>
                          <th className="px-3 lg:px-4 py-2 lg:py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                          <th className="px-3 lg:px-4 py-2 lg:py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                         
                         </tr>
                         </thead>
                      <tbody className="divide-y divide-gray-200">
                        {attendance && attendance.length > 0 ? (
                          [...attendance].sort((a, b) => new Date(b.date) - new Date(a.date)).map(record => (
                            <tr key={record.id}>
                              <td className="px-3 lg:px-4 py-3 text-sm font-medium truncate max-w-[100px] lg:max-w-none">{getLearnerName(record.learner_id)}</td>
                              <td className="px-3 lg:px-4 py-3 text-sm">
                                <span className="px-2 py-1 rounded text-xs font-semibold bg-[#c9933a]/10 text-[#c9933a]">
                                  {getLearnerForm(record.learner_id)}
                                </span>
                              </td>
                              <td className="px-3 lg:px-4 py-3 text-sm">{formatDate(record.date)}</td>
                              <td className="px-3 lg:px-4 py-3">
                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                  record.status === 'present' ? 'bg-green-100 text-green-700' : 
                                  record.status === 'absent' ? 'bg-red-100 text-red-700' : 
                                  'bg-yellow-100 text-yellow-700'
                                }`}>
                                  {record.status === 'present' ? 'Present' : record.status === 'absent' ? 'Absent' : 'Late'}
                                </span>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="4" className="px-4 py-8 text-center text-gray-500 text-sm">No records yet</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileTabNav />

      {/* Add Learner Modal */}
      {showAddLearnerModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowAddLearnerModal(false)}>
          <div className="bg-white rounded-xl p-5 lg:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg lg:text-xl font-bold mb-4">Add New Learner</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Full Name *</label>
                <input
                  type="text"
                  value={newLearner.name}
                  onChange={(e) => setNewLearner({...newLearner, name: e.target.value})}
                  className="w-full px-3 lg:px-4 py-2 border border-gray-300 rounded-lg text-sm"
                  placeholder="Enter learner's full name"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Form</label>
                <select
                  value={newLearner.form}
                  onChange={(e) => setNewLearner({...newLearner, form: e.target.value})}
                  className="w-full px-3 lg:px-4 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option>Form 1</option>
                  <option>Form 2</option>
                  <option>Form 3</option>
                  <option>Form 4</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                  value={newLearner.status}
                  onChange={(e) => setNewLearner({...newLearner, status: e.target.value})}
                  className="w-full px-3 lg:px-4 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option>Active</option>
                  <option>Inactive</option>
                </select>
              </div>
            </div>
            <div className="bg-[#f7f4ef] rounded-lg p-3 lg:p-4 my-4">
              <div className="text-[10px] lg:text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Auto-Generated Reg Number</div>
              <div className="font-mono text-xs bg-[#0f1923] text-[#c9933a] px-2 lg:px-3 py-1.5 rounded inline-block">{generatePreviewReg()}</div>
              <div className="text-[10px] lg:text-xs text-gray-500 mt-2">Share this number with the learner for their login</div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowAddLearnerModal(false)} className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition text-sm">
                Cancel
              </button>
              <button onClick={handleAddLearner} className="flex-1 px-4 py-2 bg-[#0f1923] text-white rounded-lg hover:bg-[#1a2d3f] transition font-semibold text-sm">
                Add Learner
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Report Modal */}
      {showReportModal && selectedReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowReportModal(false)}>
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div dangerouslySetInnerHTML={{ __html: getReportHTML(selectedReport) }} />
            <div className="mt-4 flex justify-end">
              <button onClick={() => setShowReportModal(false)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition text-sm">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}