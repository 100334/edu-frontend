import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';

// Theme constants
const NAVY_DARK = '#0A192F';
const NAVY_PRIMARY = '#1A237E';
const AZURE_ACCENT = '#00B0FF';
const ICE_WHITE = '#F8FAFC';

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

// Stat Card Component
const StatCard = ({ emoji, value, label, subtitle }) => (
  <div className="bg-white rounded-xl border border-[#d4cfc6] p-4 lg:p-6 shadow-sm hover:shadow-md transition">
    <div className="text-2xl lg:text-3xl mb-2 lg:mb-3">{emoji}</div>
    <div className="text-xl lg:text-3xl font-bold text-[#0f1923] mb-1">{value}</div>
    <div className="text-[10px] lg:text-xs text-gray-500 font-semibold uppercase">{label}</div>
    {subtitle && <div className="text-[10px] text-gray-400 mt-1">{subtitle}</div>}
  </div>
);

// Navigation Item Component
const NavItem = ({ icon, label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-all duration-200 ${
      isActive
        ? 'bg-[#1A237E] text-white shadow-md'
        : 'text-gray-600 hover:bg-gray-100 hover:text-[#1A237E]'
    }`}
  >
    <span className="text-lg">{icon}</span>
    <span>{label}</span>
  </button>
);

// Learner Item Component
const LearnerItem = ({ learner }) => (
  <div className="flex items-center justify-between py-2 lg:py-3 border-b border-[#ede9e1] last:border-0">
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
    </div>
  </div>
);

export default function TeacherDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(() => {
    const saved = sessionStorage.getItem('teacherActiveTab');
    return saved || 'overview';
  });
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAllLearners, setShowAllLearners] = useState(false);
  
  // Data states
  const [myLearners, setMyLearners] = useState([]);
  const [allLearners, setAllLearners] = useState([]);
  const [reports, setReports] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [stats, setStats] = useState({
    totalLearners: 0,
    totalReports: 0,
    attendanceRate: 0
  });
  
  // Modal states
  const [showAddLearnersModal, setShowAddLearnersModal] = useState(false);
  const [selectedLearners, setSelectedLearners] = useState([]);
  const [availableLearners, setAvailableLearners] = useState([]);
  
  // Report form states
  const [selectedLearnerId, setSelectedLearnerId] = useState('');
  const [selectedLearner, setSelectedLearner] = useState(null);
  const [reportTerm, setReportTerm] = useState('Term 1 – 2026');
  const [reportForm, setReportForm] = useState('Form 1');
  const [subjectScores, setSubjectScores] = useState({});
  const [teacherComment, setTeacherComment] = useState('');
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  
  // Attendance form states
  const [attDate, setAttDate] = useState(new Date().toISOString().split('T')[0]);
  const [attLearnerId, setAttLearnerId] = useState('');
  const [attStatus, setAttStatus] = useState('present');
  
  // Modal states
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);

  // Save active tab to sessionStorage
  useEffect(() => {
    sessionStorage.setItem('teacherActiveTab', activeTab);
  }, [activeTab]);

  // Load data on mount
  useEffect(() => {
    loadDashboardData();
  }, []);

  // Fetch subjects when learner is selected for report
  useEffect(() => {
    if (selectedLearner && selectedLearner.id) {
      fetchLearnerSubjects(selectedLearner.id);
    }
  }, [selectedLearner]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [myLearnersRes, allLearnersRes, reportsRes, attendanceRes, statsRes] = await Promise.all([
        api.get('/api/teacher/my-learners'),
        api.get('/api/teacher/all-learners'),
        api.get('/api/teacher/reports'),
        api.get('/api/teacher/attendance'),
        api.get('/api/teacher/dashboard/stats')
      ]);
      
      // Extract data correctly
      const myLearnersData = myLearnersRes.data?.learners || myLearnersRes.data || [];
      const allLearnersData = allLearnersRes.data?.learners || allLearnersRes.data || [];
      const reportsData = reportsRes.data?.data || reportsRes.data || [];
      const attendanceData = attendanceRes.data?.data?.records || attendanceRes.data || [];
      const statsData = statsRes.data?.data || statsRes.data || {};
      
      setMyLearners(myLearnersData);
      setAllLearners(allLearnersData);
      setReports(reportsData);
      setAttendance(attendanceData);
      
      setStats({
        totalLearners: myLearnersData.length,
        totalReports: reportsData.length,
        attendanceRate: statsData.attendanceRate || 0
      });
      
      // Set available learners (those not already assigned)
      const assignedIds = new Set(myLearnersData.map(l => l.id));
      const available = allLearnersData.filter(l => !assignedIds.has(l.id));
      setAvailableLearners(available);
      
    } catch (error) {
      console.error('Error loading dashboard:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Fetch subjects specifically for a learner (their enrolled subjects)
  const fetchLearnerSubjects = async (learnerId) => {
    setLoadingSubjects(true);
    try {
      const response = await api.get(`/api/teacher/learner-subjects/${learnerId}`);
      const subjectsData = response.data?.subjects || response.data || [];
      setSubjects(subjectsData);
      
      // Initialize scores for each subject
      const newScores = {};
      subjectsData.forEach(subject => {
        newScores[subject.name] = '';
      });
      setSubjectScores(newScores);
      
      if (subjectsData.length === 0) {
        toast.error('No subjects found for this learner. Please ensure they are enrolled in subjects.');
      }
    } catch (error) {
      console.error('Error fetching learner subjects:', error);
      toast.error('Failed to load subjects for this learner');
      setSubjects([]);
    } finally {
      setLoadingSubjects(false);
    }
  };

  const handleAddLearners = async () => {
    if (selectedLearners.length === 0) {
      toast.error('Please select at least one learner');
      return;
    }
    
    if (isSubmitting) return;
    setIsSubmitting(true);
    
    try {
      const response = await api.post('/api/teacher/add-learners', {
        learnerIds: selectedLearners
      });
      
      if (response.data.success) {
        toast.success(response.data.message);
        setShowAddLearnersModal(false);
        setSelectedLearners([]);
        loadDashboardData();
      } else {
        toast.error(response.data.message || 'Failed to add learners');
      }
    } catch (error) {
      console.error('Error adding learners:', error);
      toast.error(error.response?.data?.message || 'Failed to add learners');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveLearner = async (learnerId, learnerName) => {
    if (!window.confirm(`Remove ${learnerName} from your class?`)) return;
    
    try {
      const response = await api.delete(`/api/teacher/remove-learner/${learnerId}`);
      
      if (response.data.success) {
        toast.success('Learner removed from your class');
        loadDashboardData();
      } else {
        toast.error(response.data.message || 'Failed to remove learner');
      }
    } catch (error) {
      console.error('Error removing learner:', error);
      toast.error('Failed to remove learner');
    }
  };

  const handleLearnerSelect = (learnerId) => {
    const learner = myLearners.find(l => l.id === parseInt(learnerId));
    setSelectedLearnerId(learnerId);
    setSelectedLearner(learner);
    if (learner) {
      setReportForm(learner.form || 'Form 1');
    }
    // Reset subjects and scores when changing learner
    setSubjects([]);
    setSubjectScores({});
  };

  const handleSaveReport = async () => {
    if (!selectedLearnerId) {
      toast.error('Please select a learner');
      return;
    }
    
    if (subjects.length === 0) {
      toast.error('No subjects found for this learner. Please ensure they are enrolled in subjects.');
      return;
    }
    
    const missingScores = subjects.filter(subject => {
      const score = subjectScores[subject.name];
      return !score || score === '' || score === null;
    });
    
    if (missingScores.length > 0) {
      toast.error(`Please enter scores for all subjects: ${missingScores.map(s => s.name).join(', ')}`);
      return;
    }
    
    if (isSubmitting) return;
    setIsSubmitting(true);
    
    const subjectsData = subjects.map(s => ({
      id: s.id,
      name: s.name,
      score: parseInt(subjectScores[s.name]) || 0
    }));
    
    const reportData = {
      learnerId: parseInt(selectedLearnerId),
      term: reportTerm,
      form: reportForm,
      subjects: subjectsData,
      comment: teacherComment
    };
    
    try {
      const response = await api.post('/api/teacher/reports', reportData);
      if (response.data.success) {
        toast.success('Report card saved! ✅');
        setSubjectScores({});
        setTeacherComment('');
        setSelectedLearnerId('');
        setSelectedLearner(null);
        setSubjects([]);
        loadDashboardData();
      } else {
        toast.error(response.data.message || 'Failed to save report');
      }
    } catch (error) {
      console.error('Error saving report:', error);
      toast.error('Failed to save report');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteReport = async (id) => {
    if (!window.confirm('Delete this report?')) return;
    
    try {
      await api.delete(`/api/teacher/reports/${id}`);
      toast.success('Report deleted');
      loadDashboardData();
    } catch (error) {
      console.error('Error deleting report:', error);
      toast.error('Failed to delete report');
    }
  };

  const handleViewReport = (report) => {
    setSelectedReport(report);
    setShowReportModal(true);
  };

  const handleSaveAttendance = async () => {
    if (!attLearnerId) {
      toast.error('Please select a learner');
      return;
    }
    
    if (isSubmitting) return;
    setIsSubmitting(true);
    
    const payload = {
      learnerId: parseInt(attLearnerId),
      date: attDate,
      status: attStatus
    };
    
    try {
      const response = await api.post('/api/teacher/attendance', payload);
      if (response.data.success) {
        toast.success('Attendance recorded ✔');
        setAttLearnerId('');
        loadDashboardData();
      } else {
        toast.error(response.data.message || 'Failed to record attendance');
      }
    } catch (error) {
      console.error('Error recording attendance:', error);
      toast.error('Failed to record attendance');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString('en', { 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric' 
      });
    } catch {
      return dateStr;
    }
  };

  const getLearnerName = (learnerId) => {
    const learner = myLearners.find(l => l?.id === learnerId);
    return learner?.name || 'Unknown';
  };

  const getLearnerReg = (learnerId) => {
    const learner = myLearners.find(l => l?.id === learnerId);
    return learner?.reg_number || learner?.reg || 'N/A';
  };

  const getLearnerForm = (learnerId) => {
    const learner = myLearners.find(l => l?.id === learnerId);
    return learner?.form || 'N/A';
  };

  const getReportHTML = (report) => {
    if (!report || !report.subjects) return '<div>No report data</div>';
    
    const avg = Math.round(report.subjects.reduce((s, x) => s + x.score, 0) / report.subjects.length);
    const learner = myLearners?.find(l => l?.id === report.learner_id);
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

  const handleLogout = async () => {
    sessionStorage.removeItem('teacherActiveTab');
    await logout();
    navigate('/');
    toast.success('Logged out successfully');
  };

  const getUserName = () => {
    if (user?.name) return user.name;
    if (user?.email) return user.email.split('@')[0];
    return 'Teacher';
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const toggleLearnerSelection = (learnerId) => {
    setSelectedLearners(prev => 
      prev.includes(learnerId) 
        ? prev.filter(id => id !== learnerId)
        : [...prev, learnerId]
    );
  };

  // Get displayed learners (limited to 3 if not expanded)
  const displayedLearners = showAllLearners ? myLearners : myLearners.slice(0, 3);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: ICE_WHITE }}>
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#00B0FF] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f4ef]">
      {/* Header Section */}
      <div 
        className="w-full"
        style={{
          background: `linear-gradient(135deg, ${NAVY_DARK}, #1E3A8A)`,
        }}
      >
        <div className="container mx-auto px-4 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#c9933a] rounded-xl flex items-center justify-center">
                <span className="text-xl font-bold text-[#0f1923]">E</span>
              </div>
              <div>
                <h1 className="text-xl font-serif font-bold text-white">EduPortal Academy</h1>
                <p className="text-xs text-white/70 hidden sm:block">Excellence in Education</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-3 bg-white/10 rounded-lg px-3 py-1.5">
                <div className="w-8 h-8 bg-[#c9933a] rounded-full flex items-center justify-center text-sm">
                  👨‍🏫
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">{getUserName()}</div>
                  <div className="text-xs text-white/70">Class Teacher</div>
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
          <div className="mt-4">
            <p className="text-xs font-extrabold tracking-wider mb-1" style={{ color: AZURE_ACCENT }}>
              TEACHER PORTAL
            </p>
            <h1 className="text-xl lg:text-2xl font-bold text-white">
              Hello, {getUserName()}
            </h1>
            <p className="text-sm text-white/70 mt-1">{getGreeting()}! Welcome back</p>
          </div>
        </div>
      </div>
      
      {/* Navigation Bar */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex gap-1 py-3">
            <NavItem
              icon="📊"
              label="Overview"
              isActive={activeTab === 'overview'}
              onClick={() => setActiveTab('overview')}
            />
            <NavItem
              icon="👥"
              label="My Learners"
              isActive={activeTab === 'learners'}
              onClick={() => setActiveTab('learners')}
            />
            <NavItem
              icon="📋"
              label="Report Cards"
              isActive={activeTab === 'reports'}
              onClick={() => setActiveTab('reports')}
            />
            <NavItem
              icon="📅"
              label="Attendance"
              isActive={activeTab === 'attendance'}
              onClick={() => setActiveTab('attendance')}
            />
          </div>
        </div>
      </div>
      
      <main className="container mx-auto px-4 lg:px-8 py-8 max-w-7xl">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <>
            <div className="mb-6 lg:mb-8">
              <p className="text-sm text-gray-500">Here's what's happening with your students today.</p>
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-6 mb-6 lg:mb-8">
              <StatCard emoji="👥" value={stats.totalLearners} label="My Learners" />
              <StatCard emoji="📋" value={stats.totalReports} label="Reports" />
              <StatCard emoji="📅" value={`${stats.attendanceRate}%`} label="Attendance Rate" />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* My Learners - Limited to 3 with expand button */}
              <div className="bg-white rounded-xl border border-[#d4cfc6] shadow-sm overflow-hidden">
                <div className="px-4 lg:px-6 py-3 lg:py-4 border-b border-[#d4cfc6] flex justify-between items-center">
                  <h2 className="font-semibold text-[#0f1923] text-sm lg:text-base">My Learners</h2>
                  <button
                    onClick={() => setShowAddLearnersModal(true)}
                    className="text-xs text-[#c9933a] hover:underline"
                  >
                    + Add Learners
                  </button>
                </div>
                <div className="p-4 lg:p-6">
                  {myLearners && myLearners.length > 0 ? (
                    <>
                      {displayedLearners.map(learner => (
                        <LearnerItem key={learner.id} learner={learner} />
                      ))}
                      
                      {/* Show "View All" button if there are more than 3 learners */}
                      {myLearners.length > 3 && (
                        <button
                          onClick={() => setShowAllLearners(!showAllLearners)}
                          className="mt-3 w-full text-center text-xs text-[#c9933a] hover:text-[#0f1923] transition font-medium py-2 border-t border-[#ede9e1]"
                        >
                          {showAllLearners ? '▲ Show Less' : `▼ View All (${myLearners.length} learners)`}
                        </button>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <div className="text-3xl lg:text-4xl mb-2">👥</div>
                      <div className="text-sm">No learners added yet</div>
                      <button
                        onClick={() => setShowAddLearnersModal(true)}
                        className="mt-3 text-sm text-[#c9933a] hover:underline"
                      >
                        Add learners to your class
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Quick Actions */}
              <div className="bg-white rounded-xl border border-[#d4cfc6] shadow-sm overflow-hidden">
                <div className="px-4 lg:px-6 py-3 lg:py-4 border-b border-[#d4cfc6]">
                  <h2 className="font-semibold text-[#0f1923] text-sm lg:text-base">Quick Actions</h2>
                </div>
                <div className="p-4 lg:p-6 flex flex-col gap-2 lg:gap-3">
                  <button onClick={() => setShowAddLearnersModal(true)} className="px-3 lg:px-4 py-2 lg:py-2.5 bg-[#0f1923] text-white rounded-lg hover:bg-[#1a2d3f] transition text-sm font-medium">
                    ➕ Add Learners to Class
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

        {/* My Learners Tab */}
        {activeTab === 'learners' && (
          <>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
              <div>
                <h1 className="font-serif text-2xl lg:text-3xl font-bold text-[#0f1923] mb-1">My Learners</h1>
                <p className="text-sm text-gray-500">Students assigned to your class</p>
              </div>
              <button onClick={() => setShowAddLearnersModal(true)} className="w-full sm:w-auto px-4 py-2 bg-[#0f1923] text-white rounded-lg hover:bg-[#1a2d3f] transition font-semibold text-sm">
                ➕ Add Learners
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
                    {myLearners && myLearners.length > 0 ? (
                      myLearners.map(learner => (
                        <tr key={learner.id} className="hover:bg-gray-50 transition">
                          <td className="px-3 lg:px-6 py-3 text-sm font-medium truncate max-w-[120px] lg:max-w-none">{learner.name}</td>
                          <td className="px-3 lg:px-6 py-3 text-xs font-mono text-gray-600">{learner.reg_number || learner.reg}</td>
                          <td className="px-3 lg:px-6 py-3 text-sm">{learner.form}</td>
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
                            <button onClick={() => handleRemoveLearner(learner.id, learner.name)} className="text-red-600 hover:text-red-800 text-sm">
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="px-6 py-8 text-center text-gray-500 text-sm">
                          No learners added yet. Click "Add Learners" to add students to your class.
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
              <p className="text-sm text-gray-500">Create and manage academic reports for your learners</p>
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
                      onChange={(e) => handleLearnerSelect(e.target.value)}
                      className="w-full px-3 lg:px-4 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="">Select a learner</option>
                      {myLearners && myLearners.map(learner => (
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
                        <option>Term 1 – 2026</option>
                        <option>Term 2 – 2026</option>
                        <option>Term 3 – 2026</option>
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
                  
                  {selectedLearner && loadingSubjects && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700 flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                      Loading subjects...
                    </div>
                  )}
                  
                  {selectedLearner && !loadingSubjects && subjects.length === 0 && (
                    <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-700">
                      ⚠️ No subjects found for this learner. Please ensure they are enrolled in subjects.
                    </div>
                  )}
                  
                  {subjects.length > 0 && (
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-xs font-semibold text-gray-500 uppercase">Subject Scores</label>
                        <span className="text-xs text-gray-400">{subjects.length} subject(s)</span>
                      </div>
                      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                        {subjects.map(subject => (
                          <div key={subject.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-2 p-2 bg-gray-50 rounded-lg">
                            <label className="w-full sm:w-36 text-sm font-medium text-[#0f1923]">{subject.name}</label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              placeholder="Enter score (0-100)"
                              value={subjectScores[subject.name] || ''}
                              onChange={(e) => {
                                let value = e.target.value;
                                if (value !== '') {
                                  const numValue = parseInt(value);
                                  if (numValue >= 0 && numValue <= 100) {
                                    setSubjectScores({...subjectScores, [subject.name]: value});
                                  }
                                } else {
                                  setSubjectScores({...subjectScores, [subject.name]: ''});
                                }
                              }}
                              className="w-full sm:flex-1 px-3 lg:px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#c9933a] focus:border-transparent"
                            />
                            {subjectScores[subject.name] && (
                              <span className="text-xs font-semibold px-2 py-1 rounded-full bg-[#c9933a]/10 text-[#c9933a]">
                                {getGradeFromScore(parseInt(subjectScores[subject.name])).letter}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="mb-4">
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Teacher's Comment</label>
                    <textarea
                      value={teacherComment}
                      onChange={(e) => setTeacherComment(e.target.value)}
                      placeholder="Write a brief comment about the learner's performance..."
                      className="w-full px-3 lg:px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#c9933a] focus:border-transparent"
                      rows="3"
                    />
                  </div>
                  
                  <button 
                    onClick={handleSaveReport} 
                    disabled={isSubmitting || !selectedLearnerId || subjects.length === 0 || loadingSubjects}
                    className="w-full px-4 py-2 bg-[#c9933a] text-[#0f1923] rounded-lg hover:bg-[#e8b96a] transition font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Saving...' : '💾 Save Report Card'}
                  </button>
                </div>
              </div>
              
              {/* Saved Reports List */}
              <div className="bg-white rounded-xl border border-[#d4cfc6] shadow-sm overflow-hidden">
                <div className="px-4 lg:px-6 py-3 lg:py-4 border-b border-[#d4cfc6]">
                  <h2 className="font-semibold text-[#0f1923] text-sm lg:text-base">Saved Reports</h2>
                </div>
                <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                  <table className="w-full min-w-[400px]">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-3 lg:px-4 py-2 lg:py-3 text-left text-xs font-semibold text-gray-500 uppercase">Learner</th>
                        <th className="px-3 lg:px-4 py-2 lg:py-3 text-left text-xs font-semibold text-gray-500 uppercase">Term</th>
                        <th className="px-3 lg:px-4 py-2 lg:py-3 text-left text-xs font-semibold text-gray-500 uppercase">Subjects</th>
                        <th className="px-3 lg:px-4 py-2 lg:py-3 text-left text-xs font-semibold text-gray-500 uppercase">Avg</th>
                        <th className="px-3 lg:px-4 py-2 lg:py-3 text-left text-xs font-semibold text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {reports && reports.length > 0 ? (
                        reports.map(report => {
                          const avg = Math.round(report.subjects.reduce((s, x) => s + x.score, 0) / report.subjects.length);
                          const grade = getGradeFromScore(avg);
                          return (
                            <tr key={report.id} className="hover:bg-gray-50">
                              <td className="px-3 lg:px-4 py-3 text-sm font-medium truncate max-w-[100px] lg:max-w-none">
                                {getLearnerName(report.learner_id)}
                              </td>
                              <td className="px-3 lg:px-4 py-3">
                                <span className="px-2 py-1 rounded-full text-xs font-semibold bg-[#1a6b6b]/10 text-[#1a6b6b]">
                                  {report.term}
                                </span>
                              </td>
                              <td className="px-3 lg:px-4 py-3 text-xs text-gray-500">
                                {report.subjects.length} subject(s)
                              </td>
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
                          <td colSpan="5" className="px-4 py-8 text-center text-gray-500 text-sm">No reports yet</td>
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
              <p className="text-sm text-gray-500">Record and manage daily attendance for your learners</p>
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
                      {myLearners && myLearners.map(learner => (
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
                  
                  <button 
                    onClick={handleSaveAttendance} 
                    disabled={isSubmitting || !attLearnerId}
                    className="w-full px-4 py-2 bg-[#1a6b6b] text-white rounded-lg hover:bg-[#2a9090] transition font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Saving...' : '✔ Record Attendance'}
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
                            <td className="px-3 lg:px-4 py-3 text-sm font-medium truncate max-w-[100px] lg:max-w-none">
                              {getLearnerName(record.learner_id)}
                            </td>
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
      </main>

      {/* Add Learners Modal */}
      {showAddLearnersModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowAddLearnersModal(false)}>
          <div className="bg-white rounded-xl p-5 lg:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg lg:text-xl font-bold">Add Learners to Your Class</h2>
              <button onClick={() => setShowAddLearnersModal(false)} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>
            
            {availableLearners.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No learners available to add.</p>
                <p className="text-sm text-gray-400 mt-2">All learners are already assigned to your class.</p>
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <p className="text-sm text-gray-600">Select learners to add to your class:</p>
                </div>
                
                <div className="space-y-2 max-h-[400px] overflow-y-auto mb-4">
                  {availableLearners.map(learner => (
                    <label key={learner.id} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedLearners.includes(learner.id)}
                        onChange={() => toggleLearnerSelection(learner.id)}
                        className="w-4 h-4 text-[#c9933a]"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-[#0f1923]">{learner.name}</div>
                        <div className="text-xs text-gray-500 font-mono">{learner.reg_number} • {learner.form}</div>
                      </div>
                    </label>
                  ))}
                </div>
                
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setShowAddLearnersModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddLearners}
                    disabled={selectedLearners.length === 0 || isSubmitting}
                    className="flex-1 px-4 py-2 bg-[#c9933a] text-white rounded-lg hover:bg-[#b5822e] transition disabled:opacity-50"
                  >
                    {isSubmitting ? 'Adding...' : `Add ${selectedLearners.length} Learner(s)`}
                  </button>
                </div>
              </>
            )}
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