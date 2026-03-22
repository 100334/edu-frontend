import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  
  // Persist active tab in sessionStorage
  const [activeTab, setActiveTab] = useState(() => {
    const saved = sessionStorage.getItem('teacherActiveTab');
    return saved || 'overview';
  });
  
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dataLoadedRef = useRef(false);
  
  // Data states
  const [learners, setLearners] = useState([]);
  const [reports, setReports] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [stats, setStats] = useState({
    totalLearners: 0,
    totalReports: 0,
    avgAttendance: 0
  });
  
  // Form states - persist in sessionStorage
  const [showAddLearnerModal, setShowAddLearnerModal] = useState(false);
  const [newLearner, setNewLearner] = useState(() => {
    const saved = sessionStorage.getItem('newLearner');
    return saved ? JSON.parse(saved) : { name: '', form: 'Form 1', status: 'Active' };
  });
  
  // Report form states - persist in sessionStorage
  const [selectedLearnerId, setSelectedLearnerId] = useState(() => {
    return sessionStorage.getItem('selectedLearnerId') || '';
  });
  const [reportTerm, setReportTerm] = useState(() => {
    return sessionStorage.getItem('reportTerm') || 'Term 1 – 2024';
  });
  const [reportForm, setReportForm] = useState(() => {
    return sessionStorage.getItem('reportForm') || 'Form 1';
  });
  const [subjectScores, setSubjectScores] = useState(() => {
    const saved = sessionStorage.getItem('subjectScores');
    return saved ? JSON.parse(saved) : {};
  });
  const [teacherComment, setTeacherComment] = useState(() => {
    return sessionStorage.getItem('teacherComment') || '';
  });
  
  // Attendance form states
  const [attDate, setAttDate] = useState(() => {
    return sessionStorage.getItem('attDate') || new Date().toISOString().split('T')[0];
  });
  const [attLearnerId, setAttLearnerId] = useState(() => {
    return sessionStorage.getItem('attLearnerId') || '';
  });
  const [attStatus, setAttStatus] = useState(() => {
    return sessionStorage.getItem('attStatus') || 'present';
  });
  
  // Modal states
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);

  // Save form data to sessionStorage
  useEffect(() => {
    sessionStorage.setItem('teacherActiveTab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    sessionStorage.setItem('newLearner', JSON.stringify(newLearner));
  }, [newLearner]);

  useEffect(() => {
    sessionStorage.setItem('selectedLearnerId', selectedLearnerId);
  }, [selectedLearnerId]);

  useEffect(() => {
    sessionStorage.setItem('reportTerm', reportTerm);
  }, [reportTerm]);

  useEffect(() => {
    sessionStorage.setItem('reportForm', reportForm);
  }, [reportForm]);

  useEffect(() => {
    sessionStorage.setItem('subjectScores', JSON.stringify(subjectScores));
  }, [subjectScores]);

  useEffect(() => {
    sessionStorage.setItem('teacherComment', teacherComment);
  }, [teacherComment]);

  useEffect(() => {
    sessionStorage.setItem('attDate', attDate);
  }, [attDate]);

  useEffect(() => {
    sessionStorage.setItem('attLearnerId', attLearnerId);
  }, [attLearnerId]);

  useEffect(() => {
    sessionStorage.setItem('attStatus', attStatus);
  }, [attStatus]);

  // Load data with AbortController for cleanup
  const loadDashboardData = useCallback(async () => {
    const abortController = new AbortController();
    
    setLoading(true);
    try {
      const [learnersRes, reportsRes, attendanceRes] = await Promise.all([
        api.get('/api/teacher/learners', { signal: abortController.signal }),
        api.get('/api/teacher/reports', { signal: abortController.signal }),
        api.get('/api/teacher/attendance', { signal: abortController.signal })
      ]);
      
      const learnersData = learnersRes.data || [];
      const reportsData = reportsRes.data || [];
      const attendanceData = attendanceRes.data || [];
      
      setLearners(learnersData);
      setReports(reportsData);
      setAttendance(attendanceData);
      
      // Calculate attendance stats
      let totalAtt = 0, presentCount = 0;
      learnersData.forEach(learner => {
        const records = attendanceData.filter(a => a.learner_id === learner.id);
        if (records.length) {
          const present = records.filter(a => a.status === 'present' || a.status === 'late').length;
          totalAtt += records.length;
          presentCount += present;
        }
      });
      const avg = totalAtt ? Math.round(presentCount / totalAtt * 100) : 0;
      
      setStats({
        totalLearners: learnersData.length,
        totalReports: reportsData.length,
        avgAttendance: avg
      });
      
      dataLoadedRef.current = true;
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error loading dashboard:', error);
        toast.error('Failed to load dashboard data. Please check your connection.');
      }
    } finally {
      setLoading(false);
    }
    
    return () => abortController.abort();
  }, []);

  // Check auth and load data on mount
  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    
    loadDashboardData();
    
    // Handle visibility change (when user returns to tab after refresh)
    const handleVisibilityChange = () => {
      if (!document.hidden && !dataLoadedRef.current) {
        loadDashboardData();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [navigate, loadDashboardData]);

  // Generate preview registration number
  const generatePreviewReg = useCallback(() => {
    const nextReg = learners.length + 1;
    return `EDU-${new Date().getFullYear()}-${String(nextReg).padStart(4, '0')}`;
  }, [learners.length]);

  // Add Learner
  const handleAddLearner = async () => {
    if (!newLearner.name.trim()) {
      toast.error('Please enter a name');
      return;
    }
    
    try {
      const response = await api.post('/api/teacher/learners', newLearner);
      if (response.data.success || response.data.learner) {
        toast.success(`Learner added! Reg#: ${response.data.learner?.reg_number || generatePreviewReg()}`);
        setShowAddLearnerModal(false);
        setNewLearner({ name: '', form: 'Form 1', status: 'Active' });
        await loadDashboardData();
      }
    } catch (error) {
      console.error('Error adding learner:', error);
      toast.error('Failed to add learner. Please try again.');
    }
  };

  // Remove Learner
  const handleRemoveLearner = async (id) => {
    if (!window.confirm('Remove this learner?')) return;
    
    try {
      await api.delete(`/api/teacher/learners/${id}`);
      toast.success('Learner removed');
      await loadDashboardData();
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
      await loadDashboardData();
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
      await loadDashboardData();
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
    
    try {
      await api.post('/api/teacher/attendance', {
        learnerId: parseInt(attLearnerId),
        date: attDate,
        status: attStatus
      });
      toast.success('Attendance recorded ✔');
      setAttLearnerId('');
      await loadDashboardData();
    } catch (error) {
      console.error('Error recording attendance:', error);
      toast.error('Failed to record attendance. Please try again.');
    }
  };

  // Helper functions
  const formatDate = useCallback((dateStr) => {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  }, []);

  const getLearnerName = useCallback((learnerId) => {
    const learner = learners.find(l => l.id === learnerId);
    return learner ? learner.name : 'Unknown';
  }, [learners]);

  const getLearnerReg = useCallback((learnerId) => {
    const learner = learners.find(l => l.id === learnerId);
    return learner?.reg_number || learner?.reg || 'N/A';
  }, [learners]);

  const getReportHTML = useCallback((report) => {
    if (!report || !report.subjects) return '<div>No report data</div>';
    
    const avg = Math.round(report.subjects.reduce((s, x) => s + x.score, 0) / report.subjects.length);
    const learner = learners.find(l => l.id === report.learner_id);
    const avgGrade = getGradeFromScore(avg);
    
    return `
      <div style="background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(15,25,35,0.1);">
        <div style="background: #0f1923; color: white; padding: 20px 24px;">
          <div style="font-family: 'Playfair Display', serif; font-size: 18px; font-weight: 700; color: #c9933a; margin-bottom: 4px;">EduPortal Academy</div>
          <div style="font-size: 12px; opacity: 0.6;">${report.term} · ${report.form || report.grade}</div>
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
  }, [learners, getLearnerReg]);

  // Handle logout
  const handleLogout = () => {
    // Clear sessionStorage on logout
    const keysToKeep = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (!key.startsWith('teacher')) {
        keysToKeep.push(key);
      }
    }
    sessionStorage.clear();
    keysToKeep.forEach(key => {
      const value = localStorage.getItem(key);
      if (value) sessionStorage.setItem(key, value);
    });
    
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

  // Handle tab change with scroll to top
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    // Scroll to top when changing tabs on mobile
    if (window.innerWidth < 1024) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Mobile tab navigation component
  const MobileTabNav = () => (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 shadow-lg">
      <div className="flex justify-around py-2">
        {['overview', 'learners', 'reports', 'attendance'].map(tab => (
          <button
            key={tab}
            onClick={() => handleTabChange(tab)}
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

  if (loading && !dataLoadedRef.current) {
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
                onClick={() => handleTabChange(tab)}
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
          {/* Keep your existing JSX for Overview, Learners, Reports, and Attendance tabs - they remain the same */}
          {/* ... (rest of your JSX remains unchanged) ... */}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileTabNav />

      {/* Keep your existing Modals */}
      {/* ... (modals remain unchanged) ... */}
    </div>
  );
}