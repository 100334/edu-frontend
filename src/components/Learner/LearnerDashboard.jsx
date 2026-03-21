import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { 
  DocumentTextIcon, 
  CalendarIcon, 
  StarIcon, 
  AcademicCapIcon,
  ArrowDownTrayIcon,
  ClockIcon,
  CheckCircleIcon,
  SparklesIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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

export default function LearnerDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
  const [attendanceRecords, setAttendanceRecords] = useState([]);

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      
      const [reportsRes, attendanceRes] = await Promise.all([
        api.get(`/api/learner/reports`).catch(err => {
          console.error('Reports fetch error:', err);
          return { data: [] };
        }),
        api.get(`/api/learner/attendance`).catch(err => {
          console.error('Attendance fetch error:', err);
          return { data: { stats: {}, records: [] } };
        })
      ]);

      const reports = reportsRes.data || [];
      const attendance = attendanceRes.data?.stats || {};
      const records = attendanceRes.data?.records || [];

      setAttendanceRecords(records);

      const reportsCount = reports.length;
      const attendanceRate = attendance?.rate ? `${attendance.rate}%` : '—';
      
      let averageScore = '—';
      let latest = null;
      
      if (reports.length > 0) {
        latest = reports[reports.length - 1];
        const avg = Math.round(
          latest.subjects.reduce((sum, s) => sum + s.score, 0) / latest.subjects.length
        );
        averageScore = `${avg}%`;
      }

      setStats({
        reportsCount,
        attendanceRate,
        averageScore,
        totalDays: attendance.total || 0,
        presentCount: attendance.present || 0,
        lateCount: attendance.late || 0,
        absentCount: attendance.absent || 0
      });

      if (latest) {
        setLatestReport(latest);
      }

      const activity = [];
      
      if (reports.length > 0) {
        activity.push({
          id: 'latest-report',
          type: 'report',
          title: 'New Report Available',
          description: `Your ${reports[reports.length - 1].term} report is ready`,
          date: new Date().toISOString(),
          icon: '📋',
          color: 'text-azure'
        });
      }
      
      if (records.length > 0) {
        const recentRecords = records.slice(0, 3);
        recentRecords.forEach(record => {
          activity.push({
            id: record.id,
            type: 'attendance',
            title: `Attendance: ${record.status.charAt(0).toUpperCase() + record.status.slice(1)}`,
            description: `Marked as ${record.status} on ${new Date(record.date).toLocaleDateString('en', { 
              month: 'short', 
              day: 'numeric',
              year: 'numeric'
            })}`,
            date: record.date,
            icon: record.status === 'present' ? '✅' : record.status === 'late' ? '⏰' : '❌',
            color: record.status === 'present' ? 'text-green' : record.status === 'late' ? 'text-azure' : 'text-red'
          });
        });
      }
      
      const sortedActivity = activity.sort((a, b) => 
        new Date(b.date) - new Date(a.date)
      ).slice(0, 5);
      
      setRecentActivity(sortedActivity);

    } catch (error) {
      console.error('Dashboard error:', error);
      toast.error('Failed to load some dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.id) {
      loadDashboardData();
    } else {
      navigate('/');
    }
  }, [user, navigate, loadDashboardData]);

  const calculateAverage = (subjects) => {
    if (!subjects || subjects.length === 0) return 0;
    const sum = subjects.reduce((acc, subj) => acc + subj.score, 0);
    return Math.round(sum / subjects.length);
  };

  const getGradeDescription = (score) => {
    if (score >= 75) return 'Excellent';
    if (score >= 65) return 'Very Good';
    if (score >= 55) return 'Good';
    if (score >= 40) return 'Pass';
    return 'Need improvement';
  };

  const getAttendanceMessage = () => {
    if (stats.attendanceRate === '—') return 'No attendance records yet';
    const rate = parseInt(stats.attendanceRate);
    if (rate >= 90) return 'Excellent attendance! Keep it up! 🎯';
    if (rate >= 75) return 'Good attendance record 👍';
    if (rate >= 60) return 'Consider improving your attendance 📈';
    return 'Please focus on regular attendance ⚠️';
  };

  const handleNavigation = (path) => {
    navigate(path);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getUserName = () => {
    if (user?.name) return user.name;
    if (user?.email) return user.email.split('@')[0];
    return 'Student';
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const downloadReportPDF = (report) => {
    if (!report) return;

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
      doc.text('EduPortal Academy', pageWidth / 2, 25, { align: 'center' });
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text('Excellence in Education', pageWidth / 2, 35, { align: 'center' });

      doc.setTextColor(0, 127, 255);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('STUDENT REPORT CARD', pageWidth / 2, 70, { align: 'center' });

      // Student Info - UPDATED to show Form
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
      doc.text(`Name: ${user?.name || 'N/A'}`, 25, 102);
      doc.text(`Registration: ${user?.reg_number || 'N/A'}`, 25, 109);
      doc.text(`Form: ${report?.form || user?.form || 'N/A'}`, 25, 116);
      
      doc.text(`Term: ${report?.term || 'N/A'}`, pageWidth - 80, 102);
      doc.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth - 80, 109);

      // Table data
      const tableColumn = ["Subject", "Score", "Grade", "Remarks"];
      const tableRows = [];

      report?.subjects.forEach((subject) => {
        const grade = getGradeFromScore(subject.score);
        const remarks = getGradeDescription(subject.score);
        tableRows.push([
          subject.name,
          subject.score.toString(),
          grade.letter,
          remarks
        ]);
      });

      const avgScore = calculateAverage(report?.subjects);
      const avgGrade = getGradeFromScore(avgScore);
      
      tableRows.push([
        'AVERAGE',
        { content: avgScore.toString(), styles: { fontStyle: 'bold', textColor: [0, 127, 255] } },
        { content: avgGrade.letter, styles: { fontStyle: 'bold', textColor: [0, 127, 255] } },
        { content: getGradeDescription(avgScore), styles: { fontStyle: 'bold' } }
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
        },
        columnStyles: {
          0: { cellWidth: 60 },
          1: { cellWidth: 30, halign: 'center' },
          2: { cellWidth: 30, halign: 'center' },
          3: { cellWidth: 60, halign: 'center' }
        }
      });

      // Teacher's Comment
      if (report?.comment) {
        const finalY = doc.lastAutoTable.finalY + 15;
        
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
      doc.text('This is a computer-generated document. No signature required.', pageWidth / 2, footerY, { align: 'center' });

      const fileName = `${user?.name.replace(/\s+/g, '_')}_${report?.term.replace(/\s+/g, '_')}_Report.pdf`;
      doc.save(fileName);
      
      toast.success('Report downloaded successfully!');
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('Failed to generate PDF');
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
      doc.text('EduPortal Academy', pageWidth / 2, 25, { align: 'center' });
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text('Attendance Record', pageWidth / 2, 35, { align: 'center' });

      // Student Info - UPDATED to show Form
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(20, 65, pageWidth - 40, 40, 3, 3, 'F');
      
      doc.setDrawColor(0, 127, 255);
      doc.setLineWidth(0.5);
      doc.roundedRect(20, 65, pageWidth - 40, 40, 3, 3, 'S');
      
      doc.setTextColor(10, 25, 47);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Student Information', 25, 78);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`Name: ${user?.name}`, 25, 88);
      doc.text(`Registration: ${user?.reg_number}`, 25, 95);
      doc.text(`Form: ${user?.form || 'N/A'}`, pageWidth - 80, 88);
      doc.text(`Report Date: ${new Date().toLocaleDateString()}`, pageWidth - 80, 95);

      // Stats
      let yPos = 120;
      
      doc.setDrawColor(0, 127, 255);
      doc.setLineWidth(0.3);
      
      doc.roundedRect(20, yPos, (pageWidth - 50) / 2, 40, 3, 3, 'S');
      doc.roundedRect(pageWidth / 2 + 5, yPos, (pageWidth - 50) / 2, 40, 3, 3, 'S');
      
      doc.setTextColor(0, 127, 255);
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text(stats.totalDays.toString(), 40, yPos + 25);
      doc.text(stats.attendanceRate, pageWidth / 2 + 25, yPos + 25);
      
      doc.setTextColor(10, 25, 47);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text('Total Days', 40, yPos + 33);
      doc.text('Attendance Rate', pageWidth / 2 + 25, yPos + 33);

      // Status breakdown
      yPos += 55;
      
      const statusData = [
        { label: 'Present', count: stats.presentCount, color: [45, 212, 135] },
        { label: 'Late', count: stats.lateCount, color: [0, 127, 255] },
        { label: 'Absent', count: stats.absentCount, color: [230, 57, 70] }
      ];

      statusData.forEach((item, index) => {
        const xPos = 20 + (index * ((pageWidth - 60) / 3));
        doc.setDrawColor(item.color[0], item.color[1], item.color[2]);
        doc.roundedRect(xPos, yPos, 50, 40, 3, 3, 'S');
        
        doc.setTextColor(item.color[0], item.color[1], item.color[2]);
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text(item.count.toString(), xPos + 15, yPos + 22);
        
        doc.setTextColor(100, 116, 139);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(item.label, xPos + 15, yPos + 32);
      });

      // Attendance Records Table
      yPos += 55;
      
      const tableColumn = ["Date", "Day", "Status"];
      const tableRows = attendanceRecords.map(record => {
        let statusColor = '';
        if (record.status === 'present') statusColor = 'Present';
        else if (record.status === 'late') statusColor = 'Late';
        else statusColor = 'Absent';
        
        return [
          new Date(record.date).toLocaleDateString('en', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
          }),
          new Date(record.date).toLocaleDateString('en', { weekday: 'long' }),
          statusColor
        ];
      });

      autoTable(doc, {
        startY: yPos,
        head: [tableColumn],
        body: tableRows,
        theme: 'grid',
        headStyles: {
          fillColor: [0, 127, 255],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 10
        },
        bodyStyles: {
          textColor: [10, 25, 47],
          fontSize: 9
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252]
        },
        columnStyles: {
          0: { cellWidth: 60 },
          1: { cellWidth: 70 },
          2: { cellWidth: 40, halign: 'center' }
        }
      });

      doc.save(`${user?.name.replace(/\s+/g, '_')}_Attendance_Record.pdf`);
      toast.success('Attendance record downloaded successfully!');
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('Failed to generate PDF');
    }
  };

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
    <div className="min-h-screen bg-[#f7f4ef]">
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
                  🎓
                </div>
                <div>
                  <div className="text-sm font-semibold">{getUserName()}</div>
                  <div className="text-xs text-gray-300">Student</div>
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
            {['overview', 'reports', 'attendance'].map(tab => (
              <button
                key={tab}
                onClick={() => handleNavigation(tab === 'overview' ? '/learner/dashboard' : `/learner/${tab}`)}
                className={`px-4 lg:px-5 py-2 text-sm font-medium rounded-lg transition-all whitespace-nowrap ${
                  (tab === 'overview' && window.location.pathname === '/learner/dashboard') ||
                  (tab !== 'overview' && window.location.pathname.includes(tab))
                    ? 'bg-[#0f1923] text-white shadow-md'
                    : 'text-gray-600 hover:text-[#0f1923] hover:bg-gray-100'
                }`}
              >
                {tab === 'overview' && '📊 Overview'}
                {tab === 'reports' && '📋 Report Cards'}
                {tab === 'attendance' && '📅 Attendance'}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      <main className="flex-1 overflow-y-auto mt-44 lg:mt-36 pb-20 lg:pb-8">
        <div className="container mx-auto px-4 lg:px-8 max-w-7xl">
          {/* Welcome Message */}
          <div className="mb-6">
            <p className="text-sm text-gray-500">Track your academic progress and performance</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6 mb-6 lg:mb-8">
            <div className="bg-white rounded-xl border border-[#d4cfc6] p-4 lg:p-6 shadow-sm hover:shadow-md transition">
              <div className="text-2xl lg:text-3xl mb-2 lg:mb-3">📋</div>
              <div className="text-xl lg:text-3xl font-bold text-[#0f1923] mb-1">{stats.reportsCount}</div>
              <div className="text-[10px] lg:text-xs text-gray-500 font-semibold uppercase">Reports Available</div>
            </div>
            <div className="bg-white rounded-xl border border-[#d4cfc6] p-4 lg:p-6 shadow-sm hover:shadow-md transition">
              <div className="text-2xl lg:text-3xl mb-2 lg:mb-3">📅</div>
              <div className="text-xl lg:text-3xl font-bold text-[#0f1923] mb-1">{stats.attendanceRate}</div>
              <div className="text-[10px] lg:text-xs text-gray-500 font-semibold uppercase">Attendance Rate</div>
            </div>
            <div className="bg-white rounded-xl border border-[#d4cfc6] p-4 lg:p-6 shadow-sm hover:shadow-md transition">
              <div className="text-2xl lg:text-3xl mb-2 lg:mb-3">⭐</div>
              <div className="text-xl lg:text-3xl font-bold text-[#0f1923] mb-1">{stats.averageScore}</div>
              <div className="text-[10px] lg:text-xs text-gray-500 font-semibold uppercase">Average Score</div>
            </div>
            <div className="bg-white rounded-xl border border-[#d4cfc6] p-4 lg:p-6 shadow-sm hover:shadow-md transition">
              <div className="text-2xl lg:text-3xl mb-2 lg:mb-3">📆</div>
              <div className="text-xl lg:text-3xl font-bold text-[#0f1923] mb-1">{stats.totalDays}</div>
              <div className="text-[10px] lg:text-xs text-gray-500 font-semibold uppercase">Total Days</div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Report Card Section */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl border border-[#d4cfc6] shadow-sm overflow-hidden h-full">
                <div className="px-4 lg:px-6 py-3 lg:py-4 border-b border-[#d4cfc6] bg-gradient-to-r from-white to-[#f7f4ef]">
                  <div className="flex items-center justify-between">
                    <h2 className="font-serif text-lg font-bold text-[#0f1923] flex items-center gap-2">
                      <span className="text-[#c9933a] text-xl">📋</span>
                      Latest Report Card
                    </h2>
                    {latestReport && (
                      <div className="flex items-center gap-3">
                        <span className="px-3 py-1 bg-[#c9933a]/10 text-[#c9933a] rounded-full text-xs font-medium border border-[#c9933a]/30">
                          {latestReport.term}
                        </span>
                        <button
                          onClick={() => downloadReportPDF(latestReport)}
                          className="p-2 text-[#c9933a] hover:bg-[#c9933a]/10 rounded-lg transition-all hover:scale-110 border border-[#d4cfc6] hover:border-[#c9933a]/40"
                          title="Download PDF"
                        >
                          <ArrowDownTrayIcon className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="p-4 lg:p-6">
                  {latestReport ? (
                    <div className="space-y-4">
                      {/* Performance Summary Cards */}
                      <div className="grid grid-cols-3 gap-3 lg:gap-4 mb-4">
                        <div className="bg-[#f7f4ef] p-3 lg:p-4 rounded-xl border border-[#d4cfc6] hover:border-[#c9933a]/40 transition-all">
                          <p className="text-[10px] lg:text-xs text-gray-500 mb-1">Subjects</p>
                          <p className="text-xl lg:text-2xl font-bold text-[#0f1923]">{latestReport.subjects.length}</p>
                          <div className="mt-2 w-full h-1 bg-gray-200 rounded-full">
                            <div className="w-full h-1 bg-[#c9933a] rounded-full"></div>
                          </div>
                        </div>
                        <div className="bg-[#f7f4ef] p-3 lg:p-4 rounded-xl border border-[#d4cfc6] hover:border-[#c9933a]/40 transition-all">
                          <p className="text-[10px] lg:text-xs text-gray-500 mb-1">Average Score</p>
                          <p className="text-xl lg:text-2xl font-bold text-[#c9933a]">
                            {calculateAverage(latestReport.subjects)}%
                          </p>
                          <div className="mt-2 w-full h-1 bg-gray-200 rounded-full">
                            <div 
                              className="h-1 bg-[#c9933a] rounded-full" 
                              style={{ width: `${calculateAverage(latestReport.subjects)}%` }}
                            ></div>
                          </div>
                        </div>
                        <div className="bg-[#f7f4ef] p-3 lg:p-4 rounded-xl border border-[#d4cfc6] hover:border-[#c9933a]/40 transition-all">
                          <p className="text-[10px] lg:text-xs text-gray-500 mb-1">Term</p>
                          <p className="text-base lg:text-xl font-bold text-[#0f1923]">{latestReport.term}</p>
                          <p className="text-[10px] text-[#c9933a] mt-2">Current Period</p>
                        </div>
                      </div>

                      {/* Subject Grades */}
                      <div className="bg-[#f7f4ef] rounded-xl p-4 border border-[#d4cfc6]">
                        <h3 className="text-sm font-medium text-[#0f1923] mb-3 flex items-center gap-2">
                          <span className="w-1 h-4 bg-[#c9933a] rounded-full"></span>
                          Subject Performance
                        </h3>
                        <div className="space-y-3">
                          {latestReport.subjects.map((subject, index) => {
                            const grade = getGradeFromScore(subject.score);
                            return (
                              <div key={index} className="flex items-center py-2 border-b border-[#ede9e1] last:border-0 group">
                                <div className="flex-1 text-sm text-gray-700 group-hover:text-[#0f1923] font-medium">
                                  {subject.name}
                                </div>
                                <div className="flex-1 max-w-[200px] mx-4">
                                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div 
                                      className="h-full rounded-full transition-all duration-500" 
                                      style={{ 
                                        width: `${subject.score}%`,
                                        background: `linear-gradient(90deg, ${grade.color}80, ${grade.color})`
                                      }}
                                    />
                                  </div>
                                </div>
                                <div className="font-mono text-sm w-12 text-right font-bold" style={{ color: grade.color }}>
                                  {subject.score}
                                </div>
                                <div className="w-8 text-center font-bold px-2 py-0.5 rounded ml-2" style={{ 
                                  color: grade.color,
                                  backgroundColor: `${grade.color}10`
                                }}>
                                  {grade.letter}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Teacher's Comment */}
                      {latestReport.comment && (
                        <div className="bg-[#f7f4ef] p-4 rounded-xl border-l-4 border-[#c9933a]">
                          <div className="text-[#c9933a] text-xs font-bold uppercase tracking-wider mb-2">
                            Teacher's Note
                          </div>
                          <p className="text-sm text-gray-700 italic">"{latestReport.comment}"</p>
                        </div>
                      )}
                      
                      {/* View Full Report Button */}
                      <button
                        onClick={() => handleNavigation('/learner/report-card')}
                        className="w-full mt-4 py-3 text-sm text-[#c9933a] font-medium transition-all 
                                   bg-[#c9933a]/5 hover:bg-[#c9933a]/10 rounded-lg border border-[#d4cfc6] 
                                   hover:border-[#c9933a]/60 flex items-center justify-center gap-2 group"
                      >
                        <DocumentTextIcon className="w-4 h-4 group-hover:animate-pulse" />
                        View All Reports
                        <span className="group-hover:translate-x-1 transition-transform">→</span>
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-16">
                      <div className="w-20 h-20 mx-auto mb-4 bg-[#c9933a]/5 rounded-full flex items-center justify-center border-2 border-[#d4cfc6]">
                        <DocumentTextIcon className="w-10 h-10 text-[#c9933a]" />
                      </div>
                      <div className="font-medium text-[#0f1923] mb-2">
                        No Report Card Available
                      </div>
                      <p className="text-sm text-gray-500 max-w-xs mx-auto">
                        Your teacher hasn't generated any reports yet. 
                        Check back after your next assessment.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Side Panel */}
            <div className="space-y-6">
              {/* Attendance Summary Card */}
              <div className="bg-white rounded-xl border border-[#d4cfc6] shadow-sm overflow-hidden">
                <div className="px-4 lg:px-6 py-3 lg:py-4 border-b border-[#d4cfc6] bg-gradient-to-r from-white to-[#f7f4ef]">
                  <div className="flex items-center justify-between">
                    <h2 className="font-serif text-lg font-bold text-[#0f1923] flex items-center gap-2">
                      <span className="text-[#c9933a]">📊</span>
                      Attendance Summary
                    </h2>
                    {attendanceRecords.length > 0 && (
                      <button
                        onClick={downloadAttendancePDF}
                        className="p-2 text-[#c9933a] hover:bg-[#c9933a]/10 rounded-lg transition-all hover:scale-110 border border-[#d4cfc6] hover:border-[#c9933a]/40"
                        title="Download Attendance PDF"
                      >
                        <ArrowDownTrayIcon className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="p-4 lg:p-6">
                  <div className="text-center mb-6">
                    <div className="relative inline-flex items-center justify-center mb-4">
                      <div className="w-24 h-24 rounded-full border-4 border-[#c9933a]/20 flex items-center justify-center">
                        <span className="text-2xl font-bold text-[#c9933a]">{stats.attendanceRate}</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 bg-[#f7f4ef] py-2 px-4 rounded-full inline-block border border-[#d4cfc6]">
                      {getAttendanceMessage()}
                    </p>
                  </div>
                  
                  {stats.totalDays > 0 ? (
                    <div className="grid grid-cols-3 gap-3 mt-4">
                      <div className="text-center p-3 bg-green-50 rounded-xl border border-green-200 hover:border-green-400 transition-all">
                        <div className="w-8 h-8 mx-auto mb-2 bg-green-100 rounded-lg flex items-center justify-center">
                          <CheckCircleIcon className="w-5 h-5 text-green-600" />
                        </div>
                        <div className="text-green-600 font-bold text-xl">{stats.presentCount}</div>
                        <div className="text-xs text-gray-500">Present</div>
                      </div>
                      <div className="text-center p-3 bg-[#c9933a]/5 rounded-xl border border-[#d4cfc6] hover:border-[#c9933a]/40 transition-all">
                        <div className="w-8 h-8 mx-auto mb-2 bg-[#c9933a]/10 rounded-lg flex items-center justify-center">
                          <ClockIcon className="w-5 h-5 text-[#c9933a]" />
                        </div>
                        <div className="text-[#c9933a] font-bold text-xl">{stats.lateCount}</div>
                        <div className="text-xs text-gray-500">Late</div>
                      </div>
                      <div className="text-center p-3 bg-red-50 rounded-xl border border-red-200 hover:border-red-400 transition-all">
                        <div className="w-8 h-8 mx-auto mb-2 bg-red-100 rounded-lg flex items-center justify-center">
                          <span className="text-red-600 text-xl font-bold">✕</span>
                        </div>
                        <div className="text-red-600 font-bold text-xl">{stats.absentCount}</div>
                        <div className="text-xs text-gray-500">Absent</div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 mx-auto mb-3 bg-[#f7f4ef] rounded-full flex items-center justify-center border-2 border-[#d4cfc6]">
                        <CalendarIcon className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-sm text-gray-500">No attendance records yet</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Actions Card */}
              <div className="bg-white rounded-xl border border-[#d4cfc6] shadow-sm overflow-hidden">
                <div className="px-4 lg:px-6 py-3 lg:py-4 border-b border-[#d4cfc6] bg-gradient-to-r from-white to-[#f7f4ef]">
                  <h2 className="font-serif text-lg font-bold text-[#0f1923] flex items-center gap-2">
                    <span className="text-[#c9933a]">⚡</span>
                    Quick Actions
                  </h2>
                </div>
                <div className="p-4 lg:p-6 space-y-3">
                  <button 
                    onClick={() => handleNavigation('/learner/report-card')}
                    className="w-full text-left p-4 bg-[#f7f4ef] rounded-xl hover:bg-[#ede9e1] transition-all group border border-[#d4cfc6] hover:border-[#c9933a]/30"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#c9933a]/5 rounded-lg flex items-center justify-center group-hover:bg-[#c9933a]/10 border border-[#d4cfc6]">
                        <DocumentTextIcon className="w-5 h-5 text-[#c9933a]" />
                      </div>
                      <div className="flex-1">
                        <span className="font-medium text-[#0f1923] group-hover:text-[#c9933a] transition-colors">
                          View All Reports
                        </span>
                        <p className="text-xs text-gray-500 mt-1">Access your complete academic history</p>
                      </div>
                    </div>
                  </button>
                  
                  {stats.reportsCount > 0 && latestReport && (
                    <button 
                      onClick={() => downloadReportPDF(latestReport)}
                      className="w-full text-left p-4 bg-[#c9933a]/5 rounded-xl hover:bg-[#c9933a]/10 transition-all group border border-[#c9933a]/30"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#c9933a] rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                          <ArrowDownTrayIcon className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <span className="font-medium text-[#c9933a]">
                            Download Latest Report
                          </span>
                          <p className="text-xs text-gray-500 mt-1">Save as PDF</p>
                        </div>
                      </div>
                    </button>
                  )}
                  
                  <button 
                    onClick={() => handleNavigation('/learner/attendance')}
                    className="w-full text-left p-4 bg-[#f7f4ef] rounded-xl hover:bg-[#ede9e1] transition-all group border border-[#d4cfc6] hover:border-[#c9933a]/30"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#c9933a]/5 rounded-lg flex items-center justify-center group-hover:bg-[#c9933a]/10 border border-[#d4cfc6]">
                        <CalendarIcon className="w-5 h-5 text-[#c9933a]" />
                      </div>
                      <div className="flex-1">
                        <span className="font-medium text-[#0f1923] group-hover:text-[#c9933a] transition-colors">
                          Attendance Details
                        </span>
                        <p className="text-xs text-gray-500 mt-1">See your daily attendance record</p>
                      </div>
                    </div>
                  </button>

                  {attendanceRecords.length > 0 && (
                    <button 
                      onClick={downloadAttendancePDF}
                      className="w-full text-left p-4 bg-[#f7f4ef] rounded-xl hover:bg-[#ede9e1] transition-all group border border-[#d4cfc6] hover:border-[#c9933a]/30"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#c9933a]/5 rounded-lg flex items-center justify-center group-hover:bg-[#c9933a]/10 border border-[#d4cfc6]">
                          <ArrowDownTrayIcon className="w-5 h-5 text-[#c9933a]" />
                        </div>
                        <div className="flex-1">
                          <span className="font-medium text-[#0f1923] group-hover:text-[#c9933a] transition-colors">
                            Download Attendance
                          </span>
                          <p className="text-xs text-gray-500 mt-1">Save attendance record as PDF</p>
                        </div>
                      </div>
                    </button>
                  )}
                </div>
              </div>

              {/* Recent Activity Card */}
              {recentActivity.length > 0 && (
                <div className="bg-white rounded-xl border border-[#d4cfc6] shadow-sm overflow-hidden">
                  <div className="px-4 lg:px-6 py-3 lg:py-4 border-b border-[#d4cfc6] bg-gradient-to-r from-white to-[#f7f4ef]">
                    <h2 className="font-serif text-lg font-bold text-[#0f1923] flex items-center gap-2">
                      <span className="text-[#c9933a]">🕒</span>
                      Recent Activity
                    </h2>
                  </div>
                  <div className="p-0">
                    <div className="divide-y divide-[#ede9e1]">
                      {recentActivity.map((activity) => (
                        <div key={activity.id} className="p-4 hover:bg-[#f7f4ef] transition-colors">
                          <div className="flex items-center gap-3">
                            <span className={`text-xl ${activity.color || 'text-[#c9933a]'}`}>{activity.icon}</span>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-[#0f1923]">{activity.title}</p>
                              <p className="text-xs text-gray-500 mt-1">{activity.description}</p>
                            </div>
                            <span className="text-xs text-gray-400">
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
        </div>
      </main>

      <style jsx>{`
        @keyframes wave {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(20deg); }
          75% { transform: rotate(-10deg); }
        }
        .animate-wave {
          animation: wave 2s ease-in-out infinite;
          display: inline-block;
        }
      `}</style>
    </div>
  );
}