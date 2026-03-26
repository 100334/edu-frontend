import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { 
  DocumentTextIcon, 
  CalendarIcon, 
  ArrowDownTrayIcon,
  ClockIcon,
  CheckCircleIcon,
  HomeIcon,
  AcademicCapIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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
const StatCard = ({ emoji, value, label }) => (
  <div className="bg-white rounded-xl border border-[#d4cfc6] p-3 lg:p-6 shadow-sm hover:shadow-md transition">
    <div className="text-xl lg:text-3xl mb-1 lg:mb-3">{emoji}</div>
    <div className="text-lg lg:text-3xl font-bold text-[#0f1923] mb-1">{value}</div>
    <div className="text-[8px] lg:text-xs text-gray-500 font-semibold uppercase">{label}</div>
  </div>
);

// Navigation Item Component
const NavItem = ({ icon, label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg font-medium transition-all duration-200 text-xs lg:text-sm ${
      isActive
        ? 'bg-[#1A237E] text-white shadow-md'
        : 'text-gray-600 hover:bg-gray-100 hover:text-[#1A237E]'
    }`}
  >
    <span className="text-lg lg:text-xl">{icon}</span>
    <span className="hidden sm:inline">{label}</span>
    <span className="sm:hidden text-[10px]">{label}</span>
  </button>
);

export default function LearnerDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(() => {
    const saved = sessionStorage.getItem('learnerActiveTab');
    return saved || 'overview';
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Data states
  const [reports, setReports] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [stats, setStats] = useState({
    reportsCount: 0,
    attendanceRate: '—',
    averageScore: '—',
    totalDays: 0,
    presentCount: 0,
    lateCount: 0,
    absentCount: 0
  });
  const [latestReport, setLatestReport] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  
  // Modal state
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Save active tab to sessionStorage
  useEffect(() => {
    sessionStorage.setItem('learnerActiveTab', activeTab);
  }, [activeTab]);

  const calculateAverage = useCallback((subjects) => {
    if (!subjects || subjects.length === 0) return 0;
    const sum = subjects.reduce((acc, subj) => acc + (subj.score || 0), 0);
    return Math.round(sum / subjects.length);
  }, []);

  const loadDashboardData = useCallback(async () => {
    if (!user?.id) {
      console.log('No user ID available');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      console.log('Loading dashboard data for learner:', user.id);
      
      // Fetch reports with better error handling
      let reportsData = [];
      try {
        console.log('Fetching reports from: /api/learner/reports');
        const reportsRes = await api.get('/api/learner/reports');
        console.log('Reports response:', reportsRes.data);
        
        if (reportsRes.data && Array.isArray(reportsRes.data)) {
          reportsData = reportsRes.data;
        } else if (reportsRes.data && reportsRes.data.data && Array.isArray(reportsRes.data.data)) {
          reportsData = reportsRes.data.data;
        } else if (reportsRes.data && reportsRes.data.reports && Array.isArray(reportsRes.data.reports)) {
          reportsData = reportsRes.data.reports;
        } else {
          console.warn('Unexpected reports response structure:', reportsRes.data);
          reportsData = [];
        }
      } catch (reportError) {
        console.error('Error fetching reports:', reportError);
        toast.error('Could not load reports');
        reportsData = [];
      }
      
      // Fetch attendance with better error handling
      let attendanceData = { stats: {}, records: [] };
      try {
        console.log('Fetching attendance from: /api/learner/attendance');
        const attendanceRes = await api.get('/api/learner/attendance');
        console.log('Attendance response:', attendanceRes.data);
        
        if (attendanceRes.data) {
          if (attendanceRes.data.stats && attendanceRes.data.records) {
            attendanceData = attendanceRes.data;
          } else if (attendanceRes.data.data) {
            attendanceData = attendanceRes.data.data;
          } else if (Array.isArray(attendanceRes.data)) {
            attendanceData = { stats: {}, records: attendanceRes.data };
          } else {
            attendanceData = { stats: attendanceRes.data, records: [] };
          }
        }
      } catch (attendanceError) {
        console.error('Error fetching attendance:', attendanceError);
        toast.error('Could not load attendance');
        attendanceData = { stats: {}, records: [] };
      }

      const processedReports = reportsData.map(report => ({
        ...report,
        subjects: report.subjects || report.subjects_data || report.subject_scores || []
      }));
      
      setReports(processedReports);

      const processedAttendance = (attendanceData.records || []).map(record => ({
        id: record.id,
        date: record.date,
        status: record.status,
        term: record.term,
        year: record.year,
        recorded_at: record.recorded_at || record.created_at
      }));
      
      setAttendanceRecords(processedAttendance);

      const reportsCount = processedReports.length;
      const attendanceRate = attendanceData.stats?.rate ? `${attendanceData.stats.rate}%` : 
                            attendanceData.stats?.percentage ? `${attendanceData.stats.percentage}%` : '—';
      
      let averageScore = '—';
      let latest = null;
      
      if (processedReports.length > 0) {
        const sortedReports = [...processedReports].sort((a, b) => {
          if (a.created_at && b.created_at) {
            return new Date(b.created_at) - new Date(a.created_at);
          }
          const termOrder = { 'Term 1': 1, 'Term 2': 2, 'Term 3': 3 };
          const aTerm = termOrder[a.term] || 0;
          const bTerm = termOrder[b.term] || 0;
          return bTerm - aTerm;
        });
        latest = sortedReports[0];
        const avg = calculateAverage(latest.subjects);
        averageScore = `${avg}%`;
      }

      setStats({
        reportsCount,
        attendanceRate,
        averageScore,
        totalDays: attendanceData.stats?.total || 0,
        presentCount: attendanceData.stats?.present || 0,
        lateCount: attendanceData.stats?.late || 0,
        absentCount: attendanceData.stats?.absent || 0
      });

      if (latest) {
        setLatestReport(latest);
      }

      const activity = [];
      
      if (processedReports.length > 0 && latest) {
        activity.push({
          id: 'latest-report',
          type: 'report',
          title: 'New Report Available',
          description: `Your ${latest.term || 'latest'} report is ready`,
          date: latest.created_at || new Date().toISOString(),
          icon: '📋',
          color: 'text-[#c9933a]'
        });
      }
      
      const recentRecords = processedAttendance.slice(0, 3);
      recentRecords.forEach(record => {
        const statusDisplay = record.status === 'present' ? 'Present' : 
                              record.status === 'late' ? 'Late' : 'Absent';
        activity.push({
          id: record.id,
          type: 'attendance',
          title: `Attendance: ${statusDisplay}`,
          description: `Marked as ${record.status} on ${new Date(record.date).toLocaleDateString('en', { 
            month: 'short', 
            day: 'numeric',
            year: 'numeric'
          })}`,
          date: record.date,
          icon: record.status === 'present' ? '✅' : record.status === 'late' ? '⏰' : '❌',
          color: record.status === 'present' ? 'text-green-600' : record.status === 'late' ? 'text-[#c9933a]' : 'text-red-500'
        });
      });
      
      const sortedActivity = activity.sort((a, b) => 
        new Date(b.date) - new Date(a.date)
      ).slice(0, 5);
      
      setRecentActivity(sortedActivity);

    } catch (error) {
      console.error('Dashboard error:', error);
      setError(error.message);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [user, calculateAverage]);

  useEffect(() => {
    if (user?.id) {
      loadDashboardData();
    } else {
      const timer = setTimeout(() => {
        if (!user?.id) {
          setLoading(false);
          toast.error('Please login again');
        }
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [user, loadDashboardData]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const getUserName = () => {
    if (user?.name) return user.name;
    if (user?.email) return user.email.split('@')[0];
    if (user?.full_name) return user.full_name;
    return 'Student';
  };

  const getAttendanceMessage = () => {
    if (stats.attendanceRate === '—') return 'No attendance records yet';
    const rate = parseInt(stats.attendanceRate);
    if (isNaN(rate)) return 'Attendance data loading...';
    if (rate >= 90) return 'Excellent attendance! Keep it up! 🎯';
    if (rate >= 75) return 'Good attendance record 👍';
    if (rate >= 60) return 'Consider improving your attendance 📈';
    return 'Please focus on regular attendance ⚠️';
  };

  const downloadReportPDF = (report) => {
    if (!report) {
      toast.error('No report data available');
      return;
    }

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // Header
      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, pageWidth, 50, 'F');
      doc.setFillColor(0, 127, 255);
      doc.rect(0, 50, pageWidth, 2, 'F');
      doc.setTextColor(10, 25, 47);
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('PROGRESS SECONDARY SCHOOL', pageWidth / 2, 25, { align: 'center' });
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text('Scholastica, Excellentia et Disciplina', pageWidth / 2, 35, { align: 'center' });
      doc.setTextColor(0, 127, 255);
      doc.setFontSize(18);
      doc.text('STUDENT REPORT CARD', pageWidth / 2, 70, { align: 'center' });

      // Student Info
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(20, 80, pageWidth - 40, 45, 3, 3, 'F');
      doc.setDrawColor(0, 127, 255);
      doc.setLineWidth(0.5);
      doc.roundedRect(20, 80, pageWidth - 40, 45, 3, 3, 'S');
      doc.setTextColor(10, 25, 47);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Student Information', 25, 92);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`Name: ${user?.name || user?.full_name || 'N/A'}`, 25, 102);
      doc.text(`Registration: ${user?.reg_number || user?.registration_number || 'N/A'}`, 25, 109);
      doc.text(`Form: ${report?.form || user?.form || 'N/A'}`, 25, 116);
      doc.text(`Term: ${report?.term || 'N/A'}`, pageWidth - 80, 102);
      doc.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth - 80, 109);

      // Subjects table
      if (report.subjects && report.subjects.length > 0) {
        const tableColumn = ["Subject", "Score", "Grade", "Remarks"];
        const tableRows = report.subjects.map((subject) => {
          const grade = getGradeFromScore(subject.score);
          return [subject.name, subject.score.toString(), grade.letter, grade.description];
        });

        const avgScore = calculateAverage(report.subjects);
        const avgGrade = getGradeFromScore(avgScore);
        
        tableRows.push([
          'AVERAGE',
          { content: avgScore.toString(), styles: { fontStyle: 'bold', textColor: [0, 127, 255] } },
          { content: avgGrade.letter, styles: { fontStyle: 'bold', textColor: [0, 127, 255] } },
          { content: avgGrade.description, styles: { fontStyle: 'bold' } }
        ]);

        autoTable(doc, {
          startY: 135,
          head: [tableColumn],
          body: tableRows,
          theme: 'grid',
          headStyles: {
            fillColor: [0, 127, 255],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            halign: 'center',
            fontSize: 11
          },
          bodyStyles: {
            textColor: [10, 25, 47],
            fontSize: 10
          },
          alternateRowStyles: {
            fillColor: [248, 250, 252]
          }
        });
      }

      // Teacher's Comment
      if (report?.comment) {
        const finalY = doc.lastAutoTable?.finalY + 15 || 200;
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(20, finalY, pageWidth - 40, 40, 3, 3, 'F');
        doc.setFillColor(0, 127, 255);
        doc.rect(20, finalY, 4, 40, 'F');
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 127, 255);
        doc.text("Teacher's Comment", 30, finalY + 10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(10, 25, 47);
        doc.setFontSize(9);
        const splitComment = doc.splitTextToSize(report.comment, pageWidth - 70);
        doc.text(splitComment, 30, finalY + 20);
      }

      // Footer
      const footerY = doc.internal.pageSize.getHeight() - 15;
      doc.setFontSize(8);
      doc.setTextColor(156, 163, 175);
      doc.text('This is a computer-generated document.', pageWidth / 2, footerY, { align: 'center' });

      const fileName = `${user?.name?.replace(/\s+/g, '_') || 'student'}_${report?.term?.replace(/\s+/g, '_') || 'report'}.pdf`;
      doc.save(fileName);
      
      toast.success('Report downloaded successfully!');
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('Failed to generate PDF: ' + error.message);
    }
  };

  const downloadAttendancePDF = () => {
    if (attendanceRecords.length === 0) {
      toast.error('No attendance records to download');
      return;
    }

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // Header
      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, pageWidth, 50, 'F');
      doc.setFillColor(0, 127, 255);
      doc.rect(0, 50, pageWidth, 2, 'F');
      doc.setTextColor(10, 25, 47);
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('PROGRESS SECONDARY SCHOOL', pageWidth / 2, 25, { align: 'center' });
      doc.setFontSize(11);
      doc.text('Attendance Record', pageWidth / 2, 35, { align: 'center' });

      // Student Info
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(20, 65, pageWidth - 40, 40, 3, 3, 'F');
      doc.setTextColor(10, 25, 47);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Student Information', 25, 78);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`Name: ${user?.name || user?.full_name || 'N/A'}`, 25, 88);
      doc.text(`Registration: ${user?.reg_number || user?.registration_number || 'N/A'}`, 25, 95);
      doc.text(`Form: ${user?.form || 'N/A'}`, pageWidth - 80, 88);
      doc.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth - 80, 95);

      // Stats summary
      let yPos = 115;
      doc.setFontSize(10);
      doc.setTextColor(0, 127, 255);
      doc.text(`Total Days: ${stats.totalDays}`, 20, yPos);
      doc.text(`Attendance Rate: ${stats.attendanceRate}`, 20, yPos + 7);
      doc.text(`Present: ${stats.presentCount}`, 20, yPos + 14);
      doc.text(`Late: ${stats.lateCount}`, 20, yPos + 21);
      doc.text(`Absent: ${stats.absentCount}`, 20, yPos + 28);
      
      yPos += 40;
      
      // Attendance records table
      const tableRows = attendanceRecords.map(record => [
        new Date(record.date).toLocaleDateString('en', { year: 'numeric', month: 'short', day: 'numeric' }),
        new Date(record.date).toLocaleDateString('en', { weekday: 'long' }),
        record.status === 'present' ? 'Present' : record.status === 'late' ? 'Late' : 'Absent'
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [['Date', 'Day', 'Status']],
        body: tableRows,
        theme: 'grid',
        headStyles: {
          fillColor: [0, 127, 255],
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252]
        }
      });

      doc.save(`${user?.name?.replace(/\s+/g, '_') || 'student'}_Attendance_Record.pdf`);
      toast.success('Attendance record downloaded successfully!');
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('Failed to generate PDF: ' + error.message);
    }
  };

  const handleLogout = async () => {
    sessionStorage.removeItem('learnerActiveTab');
    await logout();
    navigate('/');
    toast.success('Logged out successfully');
  };

  const handleViewReport = (report) => {
    setSelectedReport(report);
    setShowReportModal(true);
  };

  const getReportHTML = (report) => {
    if (!report || !report.subjects) return '<div>No report data</div>';
    
    const avg = calculateAverage(report.subjects);
    const avgGrade = getGradeFromScore(avg);
    
    return `
      <div style="background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(15,25,35,0.1);">
        <div style="background: #0f1923; color: white; padding: 20px 24px;">
          <div style="font-family: 'Playfair Display', serif; font-size: 18px; font-weight: 700; color: #c9933a; margin-bottom: 4px;">PROGRESS SECONDARY SCHOOL</div>
          <div style="font-size: 12px; opacity: 0.6;">Scholastica, Excellentia et Disciplina</div>
          <div style="font-size: 11px; opacity: 0.6; margin-top: 4px;">${report.term || 'Report'} · ${report.form || user?.form || 'N/A'}</div>
          <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.1);">
            <div style="font-weight: 600;">${user?.name || user?.full_name || 'Unknown'}</div>
            <div style="font-family: monospace; font-size: 11px; opacity: 0.6; margin-top: 2px;">${user?.reg_number || user?.registration_number || 'N/A'}</div>
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
        </div>
      </div>
    `;
  };

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

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: ICE_WHITE }}>
        <div className="text-center max-w-md p-8 bg-white rounded-xl shadow-lg mx-4">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-[#0f1923] mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => loadDashboardData()}
            className="px-4 py-2 bg-[#c9933a] text-white rounded-lg hover:bg-[#b5822e] transition"
          >
            Retry
          </button>
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
        <div className="container mx-auto px-4 py-3 lg:py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 lg:gap-3">
              {/* School Logo - Replace with actual logo image */}
              <div className="w-8 h-8 lg:w-10 lg:h-10 bg-[#c9933a] rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-lg lg:text-xl font-bold text-[#0f1923]">P</span>
              </div>
              <div>
                <h1 className="text-sm lg:text-xl font-serif font-bold text-white leading-tight">
                  PROGRESS<br className="block sm:hidden" />
                  <span className="hidden sm:inline"> SECONDARY SCHOOL</span>
                </h1>
                <p className="text-[8px] lg:text-xs text-white/70 hidden sm:block">Scholastica, Excellentia et Disciplina</p>
              </div>
            </div>
            <div className="flex items-center gap-2 lg:gap-4">
              <div className="hidden sm:flex items-center gap-2 lg:gap-3 bg-white/10 rounded-lg px-2 py-1 lg:px-3 lg:py-1.5">
                <div className="w-6 h-6 lg:w-8 lg:h-8 bg-[#c9933a] rounded-full flex items-center justify-center text-xs lg:text-sm">
                  🎓
                </div>
                <div>
                  <div className="text-xs lg:text-sm font-semibold text-white">{getUserName()}</div>
                  <div className="text-[8px] lg:text-xs text-white/70">Student</div>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="px-2 py-1 lg:px-3 lg:py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-xs lg:text-sm"
              >
                Logout
              </button>
            </div>
          </div>
          <div className="mt-2 lg:mt-4">
            <p className="text-[8px] lg:text-xs font-extrabold tracking-wider mb-0.5 lg:mb-1" style={{ color: AZURE_ACCENT }}>
              LEARNER PORTAL
            </p>
            <h1 className="text-base lg:text-2xl font-bold text-white">
              Hello, {getUserName()}
            </h1>
            <p className="text-xs lg:text-sm text-white/70 mt-0.5 lg:mt-1">{getGreeting()}! Welcome back</p>
          </div>
        </div>
      </div>

      {/* Navigation Bar - Mobile Responsive */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex justify-around sm:justify-start sm:gap-1 py-2 lg:py-3">
            <NavItem
              icon="📊"
              label="Overview"
              isActive={activeTab === 'overview'}
              onClick={() => setActiveTab('overview')}
            />
            <NavItem
              icon="📋"
              label="Reports"
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

      <main className="container mx-auto px-4 py-6 lg:py-8 max-w-7xl">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <>
            <div className="mb-4 lg:mb-6">
              <p className="text-xs lg:text-sm text-gray-500">Track your academic progress and performance</p>
            </div>

            {/* Stats Grid - Responsive */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 lg:gap-6 mb-4 lg:mb-8">
              <StatCard emoji="📋" value={stats.reportsCount} label="Reports" />
              <StatCard emoji="📅" value={stats.attendanceRate} label="Attendance" />
              <StatCard emoji="⭐" value={stats.averageScore} label="Avg Score" />
              <StatCard emoji="📆" value={stats.totalDays} label="Days" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
              {/* Latest Report Card Section */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-xl border border-[#d4cfc6] shadow-sm overflow-hidden h-full">
                  <div className="px-3 lg:px-6 py-2 lg:py-4 border-b border-[#d4cfc6] bg-gradient-to-r from-white to-[#f7f4ef]">
                    <div className="flex items-center justify-between">
                      <h2 className="font-serif text-sm lg:text-lg font-bold text-[#0f1923] flex items-center gap-2">
                        <span className="text-[#c9933a] text-base lg:text-xl">📋</span>
                        Latest Report
                      </h2>
                      {latestReport && (
                        <div className="flex items-center gap-2 lg:gap-3">
                          <span className="px-2 py-0.5 lg:px-3 lg:py-1 bg-[#c9933a]/10 text-[#c9933a] rounded-full text-[10px] lg:text-xs font-medium border border-[#c9933a]/30">
                            {latestReport.term || 'Current'}
                          </span>
                          <button
                            onClick={() => downloadReportPDF(latestReport)}
                            className="p-1 lg:p-2 text-[#c9933a] hover:bg-[#c9933a]/10 rounded-lg transition-all hover:scale-110 border border-[#d4cfc6] hover:border-[#c9933a]/40"
                            title="Download PDF"
                          >
                            <ArrowDownTrayIcon className="w-4 h-4 lg:w-5 lg:h-5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="p-3 lg:p-6">
                    {latestReport && latestReport.subjects && latestReport.subjects.length > 0 ? (
                      <div className="space-y-3 lg:space-y-4">
                        {/* Performance Summary Cards */}
                        <div className="grid grid-cols-3 gap-2 lg:gap-4 mb-3 lg:mb-4">
                          <div className="bg-[#f7f4ef] p-2 lg:p-4 rounded-xl border border-[#d4cfc6]">
                            <p className="text-[8px] lg:text-xs text-gray-500 mb-0.5 lg:mb-1">Subjects</p>
                            <p className="text-sm lg:text-2xl font-bold text-[#0f1923]">{latestReport.subjects.length}</p>
                          </div>
                          <div className="bg-[#f7f4ef] p-2 lg:p-4 rounded-xl border border-[#d4cfc6]">
                            <p className="text-[8px] lg:text-xs text-gray-500 mb-0.5 lg:mb-1">Average</p>
                            <p className="text-sm lg:text-2xl font-bold text-[#c9933a]">
                              {calculateAverage(latestReport.subjects)}%
                            </p>
                            <div className="mt-1 lg:mt-2 w-full h-0.5 lg:h-1 bg-gray-200 rounded-full">
                              <div 
                                className="h-0.5 lg:h-1 bg-[#c9933a] rounded-full" 
                                style={{ width: `${calculateAverage(latestReport.subjects)}%` }}
                              />
                            </div>
                          </div>
                          <div className="bg-[#f7f4ef] p-2 lg:p-4 rounded-xl border border-[#d4cfc6]">
                            <p className="text-[8px] lg:text-xs text-gray-500 mb-0.5 lg:mb-1">Term</p>
                            <p className="text-xs lg:text-xl font-bold text-[#0f1923]">{latestReport.term || 'Current'}</p>
                          </div>
                        </div>

                        {/* Subject Grades - Responsive */}
                        <div className="bg-[#f7f4ef] rounded-xl p-3 lg:p-4 border border-[#d4cfc6]">
                          <h3 className="text-xs lg:text-sm font-medium text-[#0f1923] mb-2 lg:mb-3 flex items-center gap-2">
                            <span className="w-0.5 lg:w-1 h-3 lg:h-4 bg-[#c9933a] rounded-full" />
                            Subjects
                          </h3>
                          <div className="space-y-2 lg:space-y-3">
                            {latestReport.subjects.slice(0, 4).map((subject, index) => {
                              const grade = getGradeFromScore(subject.score);
                              return (
                                <div key={index} className="flex items-center py-1 lg:py-2 border-b border-[#ede9e1] last:border-0 group">
                                  <div className="flex-1 text-xs lg:text-sm text-gray-700 group-hover:text-[#0f1923] font-medium truncate">
                                    {subject.name}
                                  </div>
                                  <div className="hidden sm:block flex-1 max-w-[200px] mx-2 lg:mx-4">
                                    <div className="h-1.5 lg:h-2 bg-gray-200 rounded-full overflow-hidden">
                                      <div 
                                        className="h-full rounded-full transition-all duration-500" 
                                        style={{ 
                                          width: `${subject.score}%`,
                                          background: `linear-gradient(90deg, ${grade.color}80, ${grade.color})`
                                        }}
                                      />
                                    </div>
                                  </div>
                                  <div className="font-mono text-xs lg:text-sm w-8 lg:w-12 text-right font-bold" style={{ color: grade.color }}>
                                    {subject.score}
                                  </div>
                                  <div className="w-6 lg:w-8 text-center font-bold px-1 lg:px-2 py-0.5 rounded ml-1 lg:ml-2 text-xs" style={{ 
                                    color: grade.color,
                                    backgroundColor: `${grade.color}10`
                                  }}>
                                    {grade.letter}
                                  </div>
                                </div>
                              );
                            })}
                            {latestReport.subjects.length > 4 && (
                              <p className="text-[10px] lg:text-xs text-gray-400 text-center pt-1">
                                +{latestReport.subjects.length - 4} more subjects
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Teacher's Comment */}
                        {latestReport.comment && (
                          <div className="bg-[#f7f4ef] p-3 lg:p-4 rounded-xl border-l-4 border-[#c9933a]">
                            <div className="text-[#c9933a] text-[10px] lg:text-xs font-bold uppercase tracking-wider mb-1 lg:mb-2">
                              Teacher's Note
                            </div>
                            <p className="text-xs lg:text-sm text-gray-700 italic line-clamp-2 lg:line-clamp-none">
                              "{latestReport.comment}"
                            </p>
                          </div>
                        )}
                        
                        {/* View Full Report Button */}
                        <button
                          onClick={() => setActiveTab('reports')}
                          className="w-full mt-2 lg:mt-4 py-2 lg:py-3 text-xs lg:text-sm text-[#c9933a] font-medium transition-all 
                                     bg-[#c9933a]/5 hover:bg-[#c9933a]/10 rounded-lg border border-[#d4cfc6] 
                                     hover:border-[#c9933a]/60 flex items-center justify-center gap-2 group"
                        >
                          <DocumentTextIcon className="w-3 h-3 lg:w-4 lg:h-4 group-hover:animate-pulse" />
                          View All Reports
                          <span className="group-hover:translate-x-1 transition-transform">→</span>
                        </button>
                      </div>
                    ) : (
                      <div className="text-center py-8 lg:py-16">
                        <div className="w-12 h-12 lg:w-20 lg:h-20 mx-auto mb-2 lg:mb-4 bg-[#c9933a]/5 rounded-full flex items-center justify-center border-2 border-[#d4cfc6]">
                          <DocumentTextIcon className="w-6 h-6 lg:w-10 lg:h-10 text-[#c9933a]" />
                        </div>
                        <div className="font-medium text-[#0f1923] mb-1 lg:mb-2 text-sm lg:text-base">
                          No Report Card Available
                        </div>
                        <p className="text-xs lg:text-sm text-gray-500 max-w-xs mx-auto">
                          Your teacher hasn't generated any reports yet.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Side Panel */}
              <div className="space-y-4 lg:space-y-6">
                {/* Attendance Summary Card */}
                <div className="bg-white rounded-xl border border-[#d4cfc6] shadow-sm overflow-hidden">
                  <div className="px-3 lg:px-6 py-2 lg:py-4 border-b border-[#d4cfc6] bg-gradient-to-r from-white to-[#f7f4ef]">
                    <div className="flex items-center justify-between">
                      <h2 className="font-serif text-sm lg:text-lg font-bold text-[#0f1923] flex items-center gap-2">
                        <span className="text-[#c9933a]">📊</span>
                        Attendance
                      </h2>
                      {attendanceRecords.length > 0 && (
                        <button
                          onClick={downloadAttendancePDF}
                          className="p-1 lg:p-2 text-[#c9933a] hover:bg-[#c9933a]/10 rounded-lg transition-all hover:scale-110 border border-[#d4cfc6] hover:border-[#c9933a]/40"
                          title="Download Attendance PDF"
                        >
                          <ArrowDownTrayIcon className="w-3 h-3 lg:w-4 lg:h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="p-3 lg:p-6">
                    <div className="text-center mb-3 lg:mb-6">
                      <div className="relative inline-flex items-center justify-center mb-2 lg:mb-4">
                        <div className="w-16 h-16 lg:w-24 lg:h-24 rounded-full border-4 border-[#c9933a]/20 flex items-center justify-center">
                          <span className="text-lg lg:text-2xl font-bold text-[#c9933a]">{stats.attendanceRate}</span>
                        </div>
                      </div>
                      <p className="text-[10px] lg:text-sm text-gray-600 bg-[#f7f4ef] py-1 px-2 lg:py-2 lg:px-4 rounded-full inline-block border border-[#d4cfc6]">
                        {getAttendanceMessage()}
                      </p>
                    </div>
                    
                    {stats.totalDays > 0 ? (
                      <div className="grid grid-cols-3 gap-1 lg:gap-3 mt-2 lg:mt-4">
                        <div className="text-center p-1 lg:p-3 bg-green-50 rounded-lg lg:rounded-xl border border-green-200">
                          <div className="w-5 h-5 lg:w-8 lg:h-8 mx-auto mb-1 lg:mb-2 bg-green-100 rounded-lg flex items-center justify-center">
                            <CheckCircleIcon className="w-3 h-3 lg:w-5 lg:h-5 text-green-600" />
                          </div>
                          <div className="text-green-600 font-bold text-sm lg:text-xl">{stats.presentCount}</div>
                          <div className="text-[8px] lg:text-xs text-gray-500">Present</div>
                        </div>
                        <div className="text-center p-1 lg:p-3 bg-[#c9933a]/5 rounded-lg lg:rounded-xl border border-[#d4cfc6]">
                          <div className="w-5 h-5 lg:w-8 lg:h-8 mx-auto mb-1 lg:mb-2 bg-[#c9933a]/10 rounded-lg flex items-center justify-center">
                            <ClockIcon className="w-3 h-3 lg:w-5 lg:h-5 text-[#c9933a]" />
                          </div>
                          <div className="text-[#c9933a] font-bold text-sm lg:text-xl">{stats.lateCount}</div>
                          <div className="text-[8px] lg:text-xs text-gray-500">Late</div>
                        </div>
                        <div className="text-center p-1 lg:p-3 bg-red-50 rounded-lg lg:rounded-xl border border-red-200">
                          <div className="w-5 h-5 lg:w-8 lg:h-8 mx-auto mb-1 lg:mb-2 bg-red-100 rounded-lg flex items-center justify-center">
                            <span className="text-red-600 text-xs lg:text-xl font-bold">✕</span>
                          </div>
                          <div className="text-red-600 font-bold text-sm lg:text-xl">{stats.absentCount}</div>
                          <div className="text-[8px] lg:text-xs text-gray-500">Absent</div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4 lg:py-8">
                        <div className="w-10 h-10 lg:w-16 lg:h-16 mx-auto mb-1 lg:mb-3 bg-[#f7f4ef] rounded-full flex items-center justify-center border-2 border-[#d4cfc6]">
                          <CalendarIcon className="w-5 h-5 lg:w-8 lg:h-8 text-gray-400" />
                        </div>
                        <p className="text-[10px] lg:text-sm text-gray-500">No attendance records yet</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick Actions Card */}
                <div className="bg-white rounded-xl border border-[#d4cfc6] shadow-sm overflow-hidden">
                  <div className="px-3 lg:px-6 py-2 lg:py-4 border-b border-[#d4cfc6] bg-gradient-to-r from-white to-[#f7f4ef]">
                    <h2 className="font-serif text-sm lg:text-lg font-bold text-[#0f1923] flex items-center gap-2">
                      <span className="text-[#c9933a]">⚡</span>
                      Quick Actions
                    </h2>
                  </div>
                  <div className="p-3 lg:p-6 space-y-2 lg:space-y-3">
                    <button 
                      onClick={() => setActiveTab('reports')}
                      className="w-full text-left p-2 lg:p-4 bg-[#f7f4ef] rounded-lg lg:rounded-xl hover:bg-[#ede9e1] transition-all group border border-[#d4cfc6] hover:border-[#c9933a]/30"
                    >
                      <div className="flex items-center gap-2 lg:gap-3">
                        <div className="w-7 h-7 lg:w-10 lg:h-10 bg-[#c9933a]/5 rounded-lg flex items-center justify-center group-hover:bg-[#c9933a]/10 border border-[#d4cfc6]">
                          <DocumentTextIcon className="w-4 h-4 lg:w-5 lg:h-5 text-[#c9933a]" />
                        </div>
                        <div className="flex-1">
                          <span className="text-xs lg:text-sm font-medium text-[#0f1923] group-hover:text-[#c9933a] transition-colors">
                            View All Reports
                          </span>
                          <p className="text-[8px] lg:text-xs text-gray-500 mt-0.5 lg:mt-1">Complete academic history</p>
                        </div>
                      </div>
                    </button>
                    
                    {stats.reportsCount > 0 && latestReport && (
                      <button 
                        onClick={() => downloadReportPDF(latestReport)}
                        className="w-full text-left p-2 lg:p-4 bg-[#c9933a]/5 rounded-lg lg:rounded-xl hover:bg-[#c9933a]/10 transition-all group border border-[#c9933a]/30"
                      >
                        <div className="flex items-center gap-2 lg:gap-3">
                          <div className="w-7 h-7 lg:w-10 lg:h-10 bg-[#c9933a] rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                            <ArrowDownTrayIcon className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <span className="text-xs lg:text-sm font-medium text-[#c9933a]">
                              Download Latest Report
                            </span>
                            <p className="text-[8px] lg:text-xs text-gray-500 mt-0.5 lg:mt-1">Save as PDF</p>
                          </div>
                        </div>
                      </button>
                    )}
                    
                    <button 
                      onClick={() => setActiveTab('attendance')}
                      className="w-full text-left p-2 lg:p-4 bg-[#f7f4ef] rounded-lg lg:rounded-xl hover:bg-[#ede9e1] transition-all group border border-[#d4cfc6] hover:border-[#c9933a]/30"
                    >
                      <div className="flex items-center gap-2 lg:gap-3">
                        <div className="w-7 h-7 lg:w-10 lg:h-10 bg-[#c9933a]/5 rounded-lg flex items-center justify-center group-hover:bg-[#c9933a]/10 border border-[#d4cfc6]">
                          <CalendarIcon className="w-4 h-4 lg:w-5 lg:h-5 text-[#c9933a]" />
                        </div>
                        <div className="flex-1">
                          <span className="text-xs lg:text-sm font-medium text-[#0f1923] group-hover:text-[#c9933a] transition-colors">
                            Attendance Details
                          </span>
                          <p className="text-[8px] lg:text-xs text-gray-500 mt-0.5 lg:mt-1">Daily attendance record</p>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Recent Activity Card */}
                {recentActivity.length > 0 && (
                  <div className="bg-white rounded-xl border border-[#d4cfc6] shadow-sm overflow-hidden">
                    <div className="px-3 lg:px-6 py-2 lg:py-4 border-b border-[#d4cfc6] bg-gradient-to-r from-white to-[#f7f4ef]">
                      <h2 className="font-serif text-sm lg:text-lg font-bold text-[#0f1923] flex items-center gap-2">
                        <span className="text-[#c9933a]">🕒</span>
                        Recent Activity
                      </h2>
                    </div>
                    <div className="p-0">
                      <div className="divide-y divide-[#ede9e1]">
                        {recentActivity.slice(0, 3).map((activity) => (
                          <div key={activity.id} className="p-2 lg:p-4 hover:bg-[#f7f4ef] transition-colors">
                            <div className="flex items-center gap-2 lg:gap-3">
                              <span className={`text-sm lg:text-xl ${activity.color || 'text-[#c9933a]'}`}>{activity.icon}</span>
                              <div className="flex-1">
                                <p className="text-xs lg:text-sm font-medium text-[#0f1923]">{activity.title}</p>
                                <p className="text-[8px] lg:text-xs text-gray-500 mt-0.5 lg:mt-1 truncate">{activity.description}</p>
                              </div>
                              <span className="text-[8px] lg:text-xs text-gray-400">
                                {new Date(activity.date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <>
            <div className="mb-4 lg:mb-6">
              <h1 className="font-serif text-xl lg:text-3xl font-bold text-[#0f1923] mb-1">Report Cards</h1>
              <p className="text-xs lg:text-sm text-gray-500">Your academic performance overview</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 lg:gap-6">
              {reports && reports.length > 0 ? (
                reports.map(report => {
                  const avg = calculateAverage(report.subjects);
                  const grade = getGradeFromScore(avg);
                  return (
                    <div key={report.id} className="bg-white rounded-xl border border-[#d4cfc6] shadow-sm overflow-hidden hover:shadow-md transition">
                      <div className="p-3 lg:p-4 border-b flex justify-between items-center">
                        <div>
                          <span className="font-bold text-sm lg:text-base text-[#0f1923]">{report.term || 'Report'}</span>
                          <span className="ml-2 px-1.5 py-0.5 lg:px-2 lg:py-0.5 bg-[#c9933a]/10 text-[#c9933a] text-[10px] lg:text-xs rounded-full">
                            {report.form || user?.form || 'N/A'}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs lg:text-sm font-bold" style={{ color: grade.color }}>
                            {avg}% ({grade.letter})
                          </span>
                        </div>
                      </div>
                      <div className="p-3 lg:p-4">
                        <div className="space-y-1 lg:space-y-2 max-h-32 lg:max-h-48 overflow-y-auto">
                          {report.subjects && report.subjects.slice(0, 5).map((s, idx) => {
                            const g = getGradeFromScore(s.score);
                            return (
                              <div key={idx} className="flex justify-between items-center text-xs lg:text-sm">
                                <span className="truncate">{s.name}</span>
                                <span style={{ color: g.color }} className="font-mono font-medium">
                                  {s.score}% ({g.letter})
                                </span>
                              </div>
                            );
                          })}
                          {report.subjects.length > 5 && (
                            <p className="text-[10px] lg:text-xs text-gray-400 text-center">+{report.subjects.length - 5} more</p>
                          )}
                        </div>
                        {report.comment && (
                          <div className="mt-2 lg:mt-3 p-1.5 lg:p-2 bg-[#f7f4ef] rounded text-[10px] lg:text-xs italic line-clamp-2">
                            💬 {report.comment.substring(0, 60)}{report.comment.length > 60 ? '…' : ''}
                          </div>
                        )}
                        <div className="mt-2 lg:mt-4 flex gap-2">
                          <button 
                            onClick={() => handleViewReport(report)} 
                            className="flex-1 px-2 py-1 lg:px-3 lg:py-1.5 border border-[#c9933a] text-[#c9933a] rounded-lg text-[10px] lg:text-sm hover:bg-[#c9933a]/10"
                          >
                            Preview
                          </button>
                          <button 
                            onClick={() => downloadReportPDF(report)} 
                            className="flex-1 px-2 py-1 lg:px-3 lg:py-1.5 bg-[#0f1923] text-white rounded-lg text-[10px] lg:text-sm hover:bg-[#1a2d3f]"
                          >
                            <ArrowDownTrayIcon className="w-3 h-3 lg:w-4 lg:h-4 inline mr-1" />
                            PDF
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-2 text-center py-8 lg:py-12 bg-white rounded-xl border border-[#d4cfc6]">
                  <DocumentTextIcon className="w-8 h-8 lg:w-12 lg:h-12 text-gray-300 mx-auto mb-2 lg:mb-3" />
                  <p className="text-sm lg:text-base text-gray-500">No reports available yet</p>
                  <p className="text-xs text-gray-400 mt-1 lg:mt-2">Reports will appear here once your teacher generates them</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* Attendance Tab */}
        {activeTab === 'attendance' && (
          <>
            <div className="mb-4 lg:mb-6">
              <h1 className="font-serif text-xl lg:text-3xl font-bold text-[#0f1923] mb-1">Attendance Records</h1>
              <p className="text-xs lg:text-sm text-gray-500">Your daily attendance history</p>
            </div>
            
            <div className="bg-white rounded-xl border border-[#d4cfc6] shadow-sm overflow-hidden">
              <div className="px-3 lg:px-6 py-2 lg:py-4 border-b border-[#d4cfc6] flex justify-between items-center flex-wrap gap-2">
                <h2 className="font-semibold text-[#0f1923] text-xs lg:text-sm">📅 Attendance Log</h2>
                {attendanceRecords.length > 0 && (
                  <button 
                    onClick={downloadAttendancePDF} 
                    className="px-2 py-1 lg:px-3 lg:py-1.5 text-[10px] lg:text-sm bg-[#c9933a] text-white rounded-lg hover:bg-[#b5822e] transition"
                  >
                    <ArrowDownTrayIcon className="w-3 h-3 lg:w-4 lg:h-4 inline mr-1" />
                    Download PDF
                  </button>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[400px]">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-2 lg:px-4 py-2 lg:py-3 text-left text-[10px] lg:text-xs font-semibold text-gray-500 uppercase">Date</th>
                      <th className="px-2 lg:px-4 py-2 lg:py-3 text-left text-[10px] lg:text-xs font-semibold text-gray-500 uppercase">Day</th>
                      <th className="px-2 lg:px-4 py-2 lg:py-3 text-left text-[10px] lg:text-xs font-semibold text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {attendanceRecords && attendanceRecords.length > 0 ? (
                      [...attendanceRecords]
                        .sort((a, b) => new Date(b.date) - new Date(a.date))
                        .slice(0, 10)
                        .map(record => (
                          <tr key={record.id} className="hover:bg-gray-50">
                            <td className="px-2 lg:px-4 py-2 lg:py-3 text-[10px] lg:text-sm">
                              {new Date(record.date).toLocaleDateString('en', { year: 'numeric', month: 'short', day: 'numeric' })}
                            </td>
                            <td className="px-2 lg:px-4 py-2 lg:py-3 text-[10px] lg:text-sm">
                              {new Date(record.date).toLocaleDateString('en', { weekday: 'long' })}
                            </td>
                            <td className="px-2 lg:px-4 py-2 lg:py-3">
                              <span className={`px-1.5 py-0.5 lg:px-2 lg:py-1 rounded-full text-[8px] lg:text-xs font-semibold ${
                                record.status === 'present' ? 'bg-green-100 text-green-700' : 
                                record.status === 'late' ? 'bg-yellow-100 text-yellow-700' : 
                                'bg-red-100 text-red-700'
                              }`}>
                                {record.status === 'present' ? 'Present' : record.status === 'late' ? 'Late' : 'Absent'}
                              </span>
                            </td>
                          </tr>
                        ))
                    ) : (
                      <tr>
                        <td colSpan="3" className="px-2 lg:px-4 py-4 lg:py-8 text-center text-gray-500 text-[10px] lg:text-sm">
                          No attendance records yet
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                {attendanceRecords.length > 10 && (
                  <p className="text-center text-[8px] lg:text-xs text-gray-400 py-2 lg:py-3">
                    Showing last 10 of {attendanceRecords.length} records
                  </p>
                )}
              </div>
            </div>
          </>
        )}
      </main>

      {/* View Report Modal */}
      {showReportModal && selectedReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 lg:p-4" onClick={() => setShowReportModal(false)}>
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div dangerouslySetInnerHTML={{ __html: getReportHTML(selectedReport) }} />
            <div className="mt-2 lg:mt-4 flex justify-end">
              <button 
                onClick={() => setShowReportModal(false)} 
                className="px-3 py-1.5 lg:px-4 lg:py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition text-xs lg:text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}