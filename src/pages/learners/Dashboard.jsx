import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/common/Sidebar';
import StatCard from '../../components/common/StatCard';
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
import { getGradeFromScore } from '../../utils/constants';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Theme constants - Matching Admin Dashboard
const NAVY_DARK = '#0A192F';
const NAVY_PRIMARY = '#1A237E';
const AZURE_ACCENT = '#00B0FF';
const ICE_WHITE = '#F8FAFC';

export default function LearnerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
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
        api.get(`/reports/learner/${user.id}`).catch(err => {
          console.error('Reports fetch error:', err);
          return { data: [] };
        }),
        api.get(`/attendance/learner/${user.id}`).catch(err => {
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
  }, [user]);

  useEffect(() => {
    if (user?.id) {
      loadDashboardData();
    } else {
      navigate('/learner/login');
    }
  }, [user, navigate, loadDashboardData]);

  const calculateAverage = (subjects) => {
    if (!subjects || subjects.length === 0) return 0;
    const sum = subjects.reduce((acc, subj) => acc + subj.score, 0);
    return Math.round(sum / subjects.length);
  };

  const getGradeDescription = (score) => {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Very Good';
    if (score >= 70) return 'Good';
    if (score >= 60) return 'Satisfactory';
    if (score >= 50) return 'Pass';
    return 'Needs Improvement';
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

  const downloadReportPDF = (report) => {
    if (!report) return;

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // Header with admin theme colors
      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, pageWidth, 50, 'F');
      
      doc.setFillColor(26, 35, 126); // NAVY_PRIMARY
      doc.rect(0, 50, pageWidth, 2, 'F');
      
      doc.setTextColor(10, 25, 47);
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('EduPortal Academy', pageWidth / 2, 25, { align: 'center' });
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text('Excellence in Education', pageWidth / 2, 35, { align: 'center' });

      doc.setTextColor(26, 35, 126);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('STUDENT REPORT CARD', pageWidth / 2, 70, { align: 'center' });

      // Student Info
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(20, 80, pageWidth - 40, 45, 3, 3, 'F');
      
      doc.setDrawColor(26, 35, 126);
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
      doc.text(`Grade: ${report?.grade || 'N/A'}`, 25, 116);
      
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
        { content: avgScore.toString(), styles: { fontStyle: 'bold', textColor: [26, 35, 126] } },
        { content: avgGrade.letter, styles: { fontStyle: 'bold', textColor: [26, 35, 126] } },
        { content: getGradeDescription(avgScore), styles: { fontStyle: 'bold' } }
      ]);

      autoTable(doc, {
        startY: 135,
        head: [tableColumn],
        body: tableRows,
        theme: 'grid',
        headStyles: {
          fillColor: [26, 35, 126],
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
        
        doc.setFillColor(26, 35, 126);
        doc.rect(20, finalY, 4, 40, 'F');
        
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(26, 35, 126);
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
      
      // Header with admin theme
      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, pageWidth, 50, 'F');
      
      doc.setFillColor(26, 35, 126);
      doc.rect(0, 50, pageWidth, 2, 'F');
      
      doc.setTextColor(10, 25, 47);
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('EduPortal Academy', pageWidth / 2, 25, { align: 'center' });
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text('Attendance Record', pageWidth / 2, 35, { align: 'center' });

      // Student Info
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(20, 65, pageWidth - 40, 40, 3, 3, 'F');
      
      doc.setDrawColor(26, 35, 126);
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
      doc.text(`Grade: ${user?.grade}`, pageWidth - 80, 88);
      doc.text(`Report Date: ${new Date().toLocaleDateString()}`, pageWidth - 80, 95);

      // Stats
      let yPos = 120;
      
      doc.setDrawColor(26, 35, 126);
      doc.setLineWidth(0.3);
      
      doc.roundedRect(20, yPos, (pageWidth - 50) / 2, 40, 3, 3, 'S');
      doc.roundedRect(pageWidth / 2 + 5, yPos, (pageWidth - 50) / 2, 40, 3, 3, 'S');
      
      doc.setTextColor(26, 35, 126);
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
        { label: 'Present', count: stats.presentCount, color: [34, 197, 94] },
        { label: 'Late', count: stats.lateCount, color: [26, 35, 126] },
        { label: 'Absent', count: stats.absentCount, color: [239, 68, 68] }
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
          fillColor: [26, 35, 126],
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
      <div className="min-h-screen bg-white flex">
        <Sidebar />
        <main className="flex-1 p-8 flex items-center justify-center">
          <LoadingSpinner />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: ICE_WHITE }}>
      <Sidebar />
      
      <main className="flex-1 ml-0 lg:ml-64 p-6 lg:p-8 overflow-y-auto">
        {/* Header with Admin Theme */}
        <div 
          className="w-full rounded-xl mb-8 overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${NAVY_DARK}, #1E3A8A)`,
          }}
        >
          <div className="relative p-6 lg:p-8">
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <SparklesIcon className="w-5 h-5" style={{ color: AZURE_ACCENT }} />
                  <span className="text-xs font-extrabold tracking-wider" style={{ color: AZURE_ACCENT }}>
                    LEARNER PORTAL
                  </span>
                </div>
                <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">
                  Hello, {user?.name?.split(' ')[0] || 'Student'}
                  <span className="ml-3 text-2xl inline-block animate-wave">👋</span>
                </h1>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="px-3 py-1 bg-white/10 backdrop-blur rounded-full text-xs font-medium text-white/90 border border-white/20 flex items-center gap-1">
                    <AcademicCapIcon className="w-3 h-3" />
                    {user?.reg_number || 'N/A'}
                  </span>
                  <span className="px-3 py-1 bg-white/10 backdrop-blur rounded-full text-xs font-medium text-white/90 border border-white/20">
                    {user?.grade || 'Grade N/A'}
                  </span>
                </div>
              </div>
              
              <div className="hidden lg:block">
                <div className="text-right">
                  <p className="text-sm text-white/60">Member since</p>
                  <p className="text-lg font-medium text-white">
                    {new Date().toLocaleDateString('en', { month: 'long', year: 'numeric' })}
                  </p>
                  <div className="mt-2 flex items-center gap-1 justify-end">
                    <ChartBarIcon className="w-4 h-4" style={{ color: AZURE_ACCENT }} />
                    <span className="text-xs" style={{ color: AZURE_ACCENT }}>Active Student</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid - Using Admin Theme Colors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={<DocumentTextIcon className="w-8 h-8" style={{ color: AZURE_ACCENT }} />}
            value={stats.reportsCount}
            label="Reports Available"
            color="azure"
          />
          <StatCard
            icon={<CalendarIcon className="w-8 h-8" style={{ color: AZURE_ACCENT }} />}
            value={stats.attendanceRate}
            label="Attendance Rate"
            color="azure"
          />
          <StatCard
            icon={<StarIcon className="w-8 h-8" style={{ color: AZURE_ACCENT }} />}
            value={stats.averageScore}
            label="Average Score"
            color="azure"
          />
          <StatCard
            icon={<ClockIcon className="w-8 h-8" style={{ color: AZURE_ACCENT }} />}
            value={stats.totalDays}
            label="Total Days"
            color="azure"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Report Card Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border-2" style={{ borderColor: `${AZURE_ACCENT}20` }}>
              <div className="px-6 py-4 border-b-2" style={{ borderColor: `${AZURE_ACCENT}20`, background: 'linear-gradient(to right, white, #F0F9FF)' }}>
                <div className="flex items-center justify-between">
                  <h2 className="font-serif text-lg font-bold" style={{ color: NAVY_DARK }}>
                    <span className="text-xl mr-2" style={{ color: AZURE_ACCENT }}>📋</span>
                    Latest Report Card
                  </h2>
                  {latestReport && (
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 rounded-full text-xs font-medium border" style={{ backgroundColor: `${AZURE_ACCENT}10`, color: AZURE_ACCENT, borderColor: `${AZURE_ACCENT}30` }}>
                        {latestReport.term}
                      </span>
                      <button
                        onClick={() => downloadReportPDF(latestReport)}
                        className="p-2 rounded-lg transition-all hover:scale-110"
                        style={{ color: AZURE_ACCENT }}
                        title="Download PDF"
                      >
                        <ArrowDownTrayIcon className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className="p-6">
                {latestReport ? (
                  <div className="space-y-4">
                    {/* Performance Summary Cards */}
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="p-4 rounded-xl border" style={{ backgroundColor: '#F9FAFB', borderColor: `${AZURE_ACCENT}20` }}>
                        <p className="text-xs text-gray-500 mb-1">Subjects</p>
                        <p className="text-2xl font-bold" style={{ color: NAVY_DARK }}>{latestReport.subjects.length}</p>
                        <div className="mt-2 w-full h-1 bg-gray-200 rounded-full">
                          <div className="w-full h-1 rounded-full" style={{ backgroundColor: AZURE_ACCENT }}></div>
                        </div>
                      </div>
                      <div className="p-4 rounded-xl border" style={{ backgroundColor: '#F9FAFB', borderColor: `${AZURE_ACCENT}20` }}>
                        <p className="text-xs text-gray-500 mb-1">Average Score</p>
                        <p className="text-2xl font-bold" style={{ color: AZURE_ACCENT }}>
                          {calculateAverage(latestReport.subjects)}%
                        </p>
                        <div className="mt-2 w-full h-1 bg-gray-200 rounded-full">
                          <div 
                            className="h-1 rounded-full" 
                            style={{ width: `${calculateAverage(latestReport.subjects)}%`, backgroundColor: AZURE_ACCENT }}
                          ></div>
                        </div>
                      </div>
                      <div className="p-4 rounded-xl border" style={{ backgroundColor: '#F9FAFB', borderColor: `${AZURE_ACCENT}20` }}>
                        <p className="text-xs text-gray-500 mb-1">Term</p>
                        <p className="text-xl font-bold" style={{ color: NAVY_DARK }}>{latestReport.term}</p>
                        <p className="text-xs mt-2" style={{ color: AZURE_ACCENT }}>Current Period</p>
                      </div>
                    </div>

                    {/* Subject Grades */}
                    <div className="rounded-xl p-4 border" style={{ backgroundColor: '#F9FAFB', borderColor: `${AZURE_ACCENT}10` }}>
                      <h3 className="text-sm font-medium mb-3 flex items-center gap-2" style={{ color: NAVY_DARK }}>
                        <span className="w-1 h-4 rounded-full" style={{ backgroundColor: AZURE_ACCENT }}></span>
                        Subject Performance
                      </h3>
                      <div className="space-y-3">
                        {latestReport.subjects.map((subject, index) => {
                          const grade = getGradeFromScore(subject.score);
                          return (
                            <div key={index} className="flex items-center py-2 border-b border-gray-200 last:border-0 group">
                              <div className="flex-1 text-sm text-gray-700 group-hover:text-[#0a192f] font-medium">
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
                      <div className="p-4 rounded-xl border-l-4" style={{ backgroundColor: '#F9FAFB', borderLeftColor: AZURE_ACCENT }}>
                        <div className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: AZURE_ACCENT }}>
                          Teacher's Note
                        </div>
                        <p className="text-sm text-gray-700 italic">"{latestReport.comment}"</p>
                      </div>
                    )}
                    
                    {/* View Full Report Button */}
                    <button
                      onClick={() => handleNavigation('/learner/report-card')}
                      className="w-full mt-4 py-3 text-sm font-medium transition-all rounded-lg flex items-center justify-center gap-2 group"
                      style={{ 
                        backgroundColor: `${AZURE_ACCENT}10`, 
                        color: AZURE_ACCENT,
                        border: `1px solid ${AZURE_ACCENT}30`
                      }}
                    >
                      <DocumentTextIcon className="w-4 h-4 group-hover:animate-pulse" />
                      View Full Report
                      <span className="group-hover:translate-x-1 transition-transform">→</span>
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center border-2" style={{ backgroundColor: `${AZURE_ACCENT}10`, borderColor: `${AZURE_ACCENT}20` }}>
                      <DocumentTextIcon className="w-10 h-10" style={{ color: AZURE_ACCENT }} />
                    </div>
                    <div className="font-medium mb-2" style={{ color: NAVY_DARK }}>
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
            <div className="bg-white rounded-xl border-2" style={{ borderColor: `${AZURE_ACCENT}20` }}>
              <div className="px-6 py-4 border-b-2" style={{ borderColor: `${AZURE_ACCENT}20`, background: 'linear-gradient(to right, white, #F0F9FF)' }}>
                <div className="flex items-center justify-between">
                  <h2 className="font-serif text-lg font-bold" style={{ color: NAVY_DARK }}>
                    <span className="text-xl mr-2" style={{ color: AZURE_ACCENT }}>📊</span>
                    Attendance Summary
                  </h2>
                  {attendanceRecords.length > 0 && (
                    <button
                      onClick={downloadAttendancePDF}
                      className="p-2 rounded-lg transition-all hover:scale-110"
                      style={{ color: AZURE_ACCENT }}
                      title="Download Attendance PDF"
                    >
                      <ArrowDownTrayIcon className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              <div className="p-6">
                <div className="text-center mb-6">
                  <div className="relative inline-flex items-center justify-center mb-4">
                    <div className="w-24 h-24 rounded-full border-4 flex items-center justify-center" style={{ borderColor: `${AZURE_ACCENT}20` }}>
                      <span className="text-2xl font-bold" style={{ color: AZURE_ACCENT }}>{stats.attendanceRate}</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 py-2 px-4 rounded-full inline-block border border-gray-200" style={{ backgroundColor: '#F9FAFB' }}>
                    {getAttendanceMessage()}
                  </p>
                </div>
                
                {stats.totalDays > 0 ? (
                  <div className="grid grid-cols-3 gap-3 mt-4">
                    <div className="text-center p-3 rounded-xl border" style={{ backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }}>
                      <div className="w-8 h-8 mx-auto mb-2 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#BBF7D0' }}>
                        <CheckCircleIcon className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="text-green-600 font-bold text-xl">{stats.presentCount}</div>
                      <div className="text-xs text-gray-500">Present</div>
                    </div>
                    <div className="text-center p-3 rounded-xl border" style={{ backgroundColor: `${AZURE_ACCENT}10`, borderColor: `${AZURE_ACCENT}30` }}>
                      <div className="w-8 h-8 mx-auto mb-2 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${AZURE_ACCENT}20` }}>
                        <ClockIcon className="w-5 h-5" style={{ color: AZURE_ACCENT }} />
                      </div>
                      <div className="font-bold text-xl" style={{ color: AZURE_ACCENT }}>{stats.lateCount}</div>
                      <div className="text-xs text-gray-500">Late</div>
                    </div>
                    <div className="text-center p-3 rounded-xl border" style={{ backgroundColor: '#FEF2F2', borderColor: '#FECACA' }}>
                      <div className="w-8 h-8 mx-auto mb-2 bg-red-100 rounded-lg flex items-center justify-center">
                        <span className="text-red-600 text-xl font-bold">✕</span>
                      </div>
                      <div className="text-red-600 font-bold text-xl">{stats.absentCount}</div>
                      <div className="text-xs text-gray-500">Absent</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center border-2 border-gray-200">
                      <CalendarIcon className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-500">No attendance records yet</p>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions Card */}
            <div className="bg-white rounded-xl border-2" style={{ borderColor: `${AZURE_ACCENT}20` }}>
              <div className="px-6 py-4 border-b-2" style={{ borderColor: `${AZURE_ACCENT}20`, background: 'linear-gradient(to right, white, #F0F9FF)' }}>
                <h2 className="font-serif text-lg font-bold" style={{ color: NAVY_DARK }}>
                  <span className="text-xl mr-2" style={{ color: AZURE_ACCENT }}>⚡</span>
                  Quick Actions
                </h2>
              </div>
              <div className="p-6 space-y-3">
                <button 
                  onClick={() => handleNavigation('/learner/report-card')}
                  className="w-full text-left p-4 rounded-xl transition-all group border" 
                  style={{ backgroundColor: '#F9FAFB', borderColor: '#E5E7EB' }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${AZURE_ACCENT}10`, border: `1px solid ${AZURE_ACCENT}20` }}>
                      <DocumentTextIcon className="w-5 h-5" style={{ color: AZURE_ACCENT }} />
                    </div>
                    <div className="flex-1">
                      <span className="font-medium group-hover:transition-colors" style={{ color: NAVY_DARK }}>
                        View All Reports
                      </span>
                      <p className="text-xs text-gray-500 mt-1">Access your complete academic history</p>
                    </div>
                  </div>
                </button>
                
                {stats.reportsCount > 0 && latestReport && (
                  <button 
                    onClick={() => downloadReportPDF(latestReport)}
                    className="w-full text-left p-4 rounded-xl transition-all group border" 
                    style={{ backgroundColor: `${AZURE_ACCENT}10`, borderColor: `${AZURE_ACCENT}30` }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform" style={{ backgroundColor: AZURE_ACCENT }}>
                        <ArrowDownTrayIcon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <span className="font-medium" style={{ color: AZURE_ACCENT }}>
                          Download Latest Report
                        </span>
                        <p className="text-xs text-gray-500 mt-1">Save as PDF</p>
                      </div>
                    </div>
                  </button>
                )}
                
                <button 
                  onClick={() => handleNavigation('/learner/attendance')}
                  className="w-full text-left p-4 rounded-xl transition-all group border" 
                  style={{ backgroundColor: '#F9FAFB', borderColor: '#E5E7EB' }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${AZURE_ACCENT}10`, border: `1px solid ${AZURE_ACCENT}20` }}>
                      <CalendarIcon className="w-5 h-5" style={{ color: AZURE_ACCENT }} />
                    </div>
                    <div className="flex-1">
                      <span className="font-medium group-hover:transition-colors" style={{ color: NAVY_DARK }}>
                        Attendance Details
                      </span>
                      <p className="text-xs text-gray-500 mt-1">See your daily attendance record</p>
                    </div>
                  </div>
                </button>

                {attendanceRecords.length > 0 && (
                  <button 
                    onClick={downloadAttendancePDF}
                    className="w-full text-left p-4 rounded-xl transition-all group border" 
                    style={{ backgroundColor: '#F9FAFB', borderColor: '#E5E7EB' }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${AZURE_ACCENT}10`, border: `1px solid ${AZURE_ACCENT}20` }}>
                        <ArrowDownTrayIcon className="w-5 h-5" style={{ color: AZURE_ACCENT }} />
                      </div>
                      <div className="flex-1">
                        <span className="font-medium group-hover:transition-colors" style={{ color: NAVY_DARK }}>
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
              <div className="bg-white rounded-xl border-2" style={{ borderColor: `${AZURE_ACCENT}20` }}>
                <div className="px-6 py-4 border-b-2" style={{ borderColor: `${AZURE_ACCENT}20`, background: 'linear-gradient(to right, white, #F0F9FF)' }}>
                  <h2 className="font-serif text-lg font-bold" style={{ color: NAVY_DARK }}>
                    <span className="text-xl mr-2" style={{ color: AZURE_ACCENT }}>🕒</span>
                    Recent Activity
                  </h2>
                </div>
                <div className="p-0">
                  <div className="divide-y divide-gray-100">
                    {recentActivity.map((activity) => (
                      <div key={activity.id} className="p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <span className={`text-xl ${activity.color || 'text-azure'}`}>{activity.icon}</span>
                          <div className="flex-1">
                            <p className="text-sm font-medium" style={{ color: NAVY_DARK }}>{activity.title}</p>
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