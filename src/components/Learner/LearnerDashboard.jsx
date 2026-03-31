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
  Bars3Icon,
  XMarkIcon,
  PlayIcon,
  TrophyIcon,
  BookOpenIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Import Quiz Components
import QuizList from './QuizList';
import QuizTaking from './QuizTaking';

// Theme constants
const NAVY_DARK = '#0A192F';
const NAVY_PRIMARY = '#1A237E';
const AZURE_ACCENT = '#00B0FF';
const ICE_WHITE = '#F8FAFC';

// Grade classification function with dual system for Forms 3-4
const getGradeFromScore = (score, form = 'Form 1') => {
  const isUpperForm = form === 'Form 3' || form === 'Form 4';
  
  if (isUpperForm) {
    if (score >= 85) return { letter: 'A*', points: 1, description: 'Distinction', color: '#1e7e4a', bgColor: '#e8f5e9' };
    else if (score >= 75) return { letter: 'A', points: 2, description: 'Distinction', color: '#2a6e2a', bgColor: '#e8f5e9' };
    else if (score >= 65) return { letter: 'B', points: 3, description: 'Credit', color: '#2a9090', bgColor: '#e0f2f1' };
    else if (score >= 56) return { letter: 'C', points: 4, description: 'Credit', color: '#c9933a', bgColor: '#fff3e0' };
    else if (score >= 50) return { letter: 'D', points: 5, description: 'Credit', color: '#f39c12', bgColor: '#ffe6cc' };
    else if (score >= 45) return { letter: 'E', points: 6, description: 'Pass', color: '#f39c12', bgColor: '#ffe6cc' };
    else if (score >= 40) return { letter: 'F', points: 7, description: 'Pass', color: '#f39c12', bgColor: '#ffe6cc' };
    else if (score >= 35) return { letter: 'G', points: 8, description: 'Pass', color: '#f39c12', bgColor: '#ffe6cc' };
    else return { letter: 'U', points: 9, description: 'Fail', color: '#c0392b', bgColor: '#ffebee' };
  } else {
    if (score >= 75) return { letter: 'A', description: 'Excellent', points: null, color: '#1e7e4a', bgColor: '#e8f5e9' };
    else if (score >= 65) return { letter: 'B', description: 'Very good', points: null, color: '#2a9090', bgColor: '#e0f2f1' };
    else if (score >= 55) return { letter: 'C', description: 'Good', points: null, color: '#c9933a', bgColor: '#fff3e0' };
    else if (score >= 40) return { letter: 'D', description: 'Pass', points: null, color: '#f39c12', bgColor: '#ffe6cc' };
    else return { letter: 'F', description: 'Need improvement', points: null, color: '#c0392b', bgColor: '#ffebee' };
  }
};

// Calculate average
const calculateAverage = (subjects, form = 'Form 1') => {
  if (!subjects || subjects.length === 0) return 0;
  const validSubjects = subjects.filter(s => s && s.score !== undefined && s.score !== null && s.score !== '');
  if (validSubjects.length === 0) return 0;
  const sum = validSubjects.reduce((acc, subj) => acc + (subj.score || 0), 0);
  return Math.round(sum / validSubjects.length);
};

// Calculate total points for Form 3/4
const calculateTotalPoints = (subjects, form) => {
  if (!subjects || subjects.length === 0) return 0;
  const isUpperForm = form === 'Form 3' || form === 'Form 4';
  if (!isUpperForm) return null;
  
  const totalPoints = subjects.reduce((sum, subject) => {
    const grade = getGradeFromScore(subject.score, form);
    return sum + (grade.points || 0);
  }, 0);
  return totalPoints;
};

// Calculate best 6 subjects for Form 3/4
const calculateBestSubjects = (subjects, form) => {
  const isUpperForm = form === 'Form 3' || form === 'Form 4';
  if (!isUpperForm) return subjects;
  
  const subjectsWithPoints = subjects.map(subject => ({
    ...subject,
    points: getGradeFromScore(subject.score, form).points
  }));
  
  const sortedSubjects = [...subjectsWithPoints].sort((a, b) => a.points - b.points);
  return sortedSubjects.slice(0, Math.min(6, sortedSubjects.length));
};

// Get overall grade based on total points
const getOverallGradeFromPoints = (totalPoints) => {
  if (totalPoints <= 2) return { description: 'Distinction' };
  if (totalPoints <= 6) return { description: 'Credit' };
  if (totalPoints <= 12) return { description: 'Pass' };
  return { description: 'Fail' };
};

// Get final status
const getFinalStatus = (englishPassed, totalPoints) => {
  if (!englishPassed) return { status: 'FAIL', message: 'Failed English - Overall Result: FAIL', color: '#c0392b' };
  if (totalPoints <= 2) return { status: 'DISTINCTION', message: 'Distinction - Excellent Performance!', color: '#1e7e4a' };
  if (totalPoints <= 6) return { status: 'CREDIT', message: 'Credit - Good Performance!', color: '#2a9090' };
  if (totalPoints <= 12) return { status: 'PASS', message: 'Pass - Satisfactory Performance', color: '#f39c12' };
  return { status: 'FAIL', message: 'Fail - Needs Improvement', color: '#c0392b' };
};

// Stat Card Component
const StatCard = ({ emoji, value, label }) => (
  <div className="bg-white rounded-xl border border-[#d4cfc6] p-2.5 sm:p-3 md:p-4 lg:p-6 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
    <div className="text-xl sm:text-2xl md:text-3xl mb-1 sm:mb-2">{emoji}</div>
    <div className="text-base sm:text-lg md:text-xl lg:text-3xl font-bold text-[#0f1923] mb-0.5 sm:mb-1 truncate">{value}</div>
    <div className="text-[10px] sm:text-xs md:text-sm text-gray-500 font-semibold uppercase tracking-wide">{label}</div>
  </div>
);

// Navigation Item Component
const NavItem = ({ icon, label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 md:px-5 py-2 sm:py-2.5 rounded-lg font-medium transition-all duration-200 text-xs sm:text-sm md:text-base whitespace-nowrap touch-manipulation ${
      isActive
        ? 'bg-[#1A237E] text-white shadow-md'
        : 'text-gray-600 hover:bg-gray-100 hover:text-[#1A237E]'
    }`}
  >
    <span className="text-sm sm:text-base md:text-lg">{icon}</span>
    <span className="text-xs sm:text-sm">{label}</span>
  </button>
);

// Mobile Menu Button
const MobileMenuButton = ({ isOpen, onClick }) => (
  <button
    onClick={onClick}
    className="lg:hidden p-2 rounded-lg bg-white/10 hover:bg-white/20 transition touch-manipulation"
    aria-label="Toggle menu"
  >
    {isOpen ? (
      <XMarkIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
    ) : (
      <Bars3Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
    )}
  </button>
);

export default function LearnerDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(() => {
    const saved = sessionStorage.getItem('learnerActiveTab');
    return saved || 'overview';
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Quiz states
  const [showQuiz, setShowQuiz] = useState(null);
  const [quizResult, setQuizResult] = useState(null);
  
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
    absentCount: 0,
    quizScore: '—',
    quizzesCompleted: 0
  });
  const [latestReport, setLatestReport] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  
  // Filter states
  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [availableYears, setAvailableYears] = useState([]);
  const [availableAssessments, setAvailableAssessments] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  
  // Modal state
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);

  // Save active tab to sessionStorage
  useEffect(() => {
    sessionStorage.setItem('learnerActiveTab', activeTab);
  }, [activeTab]);

  // Close mobile menu when tab changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [activeTab]);

  // Extract available years and assessments from reports
  const extractFilters = useCallback((reportsData) => {
    const years = new Set();
    const assessments = new Set();
    
    reportsData.forEach(report => {
      if (report.academic_year) {
        years.add(report.academic_year);
      } else if (report.created_at) {
        years.add(new Date(report.created_at).getFullYear());
      }
      if (report.term) {
        assessments.add(report.term);
      }
    });
    
    const sortedYears = Array.from(years).sort((a, b) => b - a);
    const sortedAssessments = Array.from(assessments).sort();
    
    setAvailableYears(sortedYears);
    setAvailableAssessments(sortedAssessments);
    
    if (sortedYears.length > 0 && !selectedYear) {
      setSelectedYear(sortedYears[0]);
    }
    if (sortedAssessments.length > 0 && !selectedAssessment) {
      setSelectedAssessment(sortedAssessments[0]);
    }
  }, [selectedYear, selectedAssessment]);

  // Filter reports based on selected year and assessment
  useEffect(() => {
    if (reports.length > 0) {
      let filtered = [...reports];
      
      if (selectedYear) {
        filtered = filtered.filter(report => {
          const reportYear = report.academic_year || (report.created_at ? new Date(report.created_at).getFullYear() : null);
          return reportYear === selectedYear;
        });
      }
      
      if (selectedAssessment) {
        filtered = filtered.filter(report => report.term === selectedAssessment);
      }
      
      setFilteredReports(filtered);
      
      if (filtered.length > 0) {
        const sorted = [...filtered].sort((a, b) => {
          if (a.created_at && b.created_at) {
            return new Date(b.created_at) - new Date(a.created_at);
          }
          return 0;
        });
        setLatestReport(sorted[0]);
      } else {
        setLatestReport(null);
      }
    }
  }, [reports, selectedYear, selectedAssessment]);

  const loadDashboardData = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // Fetch reports
      let reportsData = [];
      try {
        const reportsRes = await api.get('/api/learner/reports');
        if (reportsRes.data && Array.isArray(reportsRes.data)) {
          reportsData = reportsRes.data;
        } else if (reportsRes.data && reportsRes.data.data && Array.isArray(reportsRes.data.data)) {
          reportsData = reportsRes.data.data;
        } else if (reportsRes.data && reportsRes.data.reports && Array.isArray(reportsRes.data.reports)) {
          reportsData = reportsRes.data.reports;
        }
      } catch (reportError) {
        console.error('Error fetching reports:', reportError);
        toast.error('Could not load reports');
      }
      
      // Fetch attendance
      let attendanceData = { stats: {}, records: [] };
      try {
        const attendanceRes = await api.get('/api/learner/attendance');
        if (attendanceRes.data) {
          if (attendanceRes.data.stats && attendanceRes.data.records) {
            attendanceData = attendanceRes.data;
          } else if (attendanceRes.data.data) {
            attendanceData = attendanceRes.data.data;
          } else if (Array.isArray(attendanceRes.data)) {
            attendanceData = { stats: {}, records: attendanceRes.data };
          }
        }
      } catch (attendanceError) {
        console.error('Error fetching attendance:', attendanceError);
        toast.error('Could not load attendance');
      }

      // Fetch quiz history
      let quizHistoryData = [];
      let totalQuizScore = 0;
      let quizzesCompleted = 0;
      try {
        const quizRes = await api.get('/api/quiz/history');
        if (quizRes.data && quizRes.data.attempts) {
          quizHistoryData = quizRes.data.attempts;
          quizzesCompleted = quizHistoryData.length;
          if (quizzesCompleted > 0) {
            const validScores = quizHistoryData.filter(q => q.percentage > 0);
            if (validScores.length > 0) {
              const avgQuizScore = validScores.reduce((sum, q) => sum + (q.percentage || 0), 0) / validScores.length;
              totalQuizScore = Math.round(avgQuizScore);
            }
          }
        }
      } catch (quizError) {
        console.error('Error fetching quiz history:', quizError);
      }

      // Process reports
      const processedReports = reportsData.map(report => ({
        ...report,
        academic_year: report.academic_year || (report.created_at ? new Date(report.created_at).getFullYear() : new Date().getFullYear()),
        form: report.form || user?.form || 'Form 1',
        subjects: (report.subjects || report.subjects_data || report.subject_scores || []).filter(s => s && (s.score !== undefined || s.score !== null))
      }));
      
      setReports(processedReports);
      extractFilters(processedReports);

      // Process attendance records
      const processedAttendance = (attendanceData.records || []).map(record => ({
        id: record.id,
        date: record.date,
        status: record.status,
        term: record.term,
        year: record.year,
        recorded_at: record.recorded_at || record.created_at
      }));
      
      setAttendanceRecords(processedAttendance);

      // Calculate stats
      const reportsCount = processedReports.length;
      const attendanceRate = attendanceData.stats?.rate ? `${attendanceData.stats.rate}%` : 
                            attendanceData.stats?.percentage ? `${attendanceData.stats.percentage}%` : '—';
      
      let averageScore = '—';
      
      if (processedReports.length > 0) {
        let allValidSubjects = [];
        processedReports.forEach(report => {
          if (report.subjects && report.subjects.length > 0) {
            const validSubjects = report.subjects.filter(s => s && s.score !== undefined && s.score !== null);
            allValidSubjects = [...allValidSubjects, ...validSubjects];
          }
        });
        
        if (allValidSubjects.length > 0) {
          const totalScore = allValidSubjects.reduce((sum, s) => sum + (s.score || 0), 0);
          const avg = Math.round(totalScore / allValidSubjects.length);
          averageScore = `${avg}%`;
        }
      }

      setStats({
        reportsCount,
        attendanceRate,
        averageScore,
        totalDays: attendanceData.stats?.total || 0,
        presentCount: attendanceData.stats?.present || 0,
        lateCount: attendanceData.stats?.late || 0,
        absentCount: attendanceData.stats?.absent || 0,
        quizScore: totalQuizScore > 0 ? `${totalQuizScore}%` : '—',
        quizzesCompleted
      });

      // Build recent activity
      const activity = [];
      
      if (processedReports.length > 0) {
        const latest = [...processedReports].sort((a, b) => {
          if (a.created_at && b.created_at) {
            return new Date(b.created_at) - new Date(a.created_at);
          }
          return 0;
        })[0];
        
        activity.push({
          id: 'latest-report',
          type: 'report',
          title: 'New Report Available',
          description: `Your ${latest.term || 'latest'} report (${latest.academic_year}) is ready`,
          date: latest.created_at || new Date().toISOString(),
          icon: '📋',
          color: 'text-[#c9933a]'
        });
      }
      
      // Add quiz activity
      if (quizHistoryData.length > 0) {
        const latestQuiz = quizHistoryData[0];
        activity.push({
          id: 'latest-quiz',
          type: 'quiz',
          title: `Quiz Completed: ${latestQuiz.quiz?.title || latestQuiz.subject}`,
          description: `Score: ${Math.round(latestQuiz.percentage || 0)}%`,
          date: latestQuiz.completed_at || new Date().toISOString(),
          icon: '📝',
          color: 'text-purple-600'
        });
      }
      
      const recentRecords = processedAttendance.slice(0, 2);
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
  }, [user, extractFilters]);

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

  // REDESIGNED REPORT CARD PDF DOWNLOAD
   // REDESIGNED REPORT CARD PDF DOWNLOAD - SINGLE PAGE WITH LOGO
  const downloadReportPDF = (report) => {
    if (!report) {
      toast.error('No report data available');
      return;
    }

    try {
      const doc = new jsPDF({
        unit: 'mm',
        format: 'a4',
        orientation: 'portrait'
      });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const validSubjects = (report.subjects || []).filter(s => s && s.score !== undefined && s.score !== null);
      const isUpperForm = report.form === 'Form 3' || report.form === 'Form 4';
      const totalPoints = isUpperForm ? calculateTotalPoints(validSubjects, report.form) : null;
      const bestSubjects = isUpperForm ? calculateBestSubjects(validSubjects, report.form) : validSubjects;
      const avgScore = calculateAverage(validSubjects);
      const avgGrade = getGradeFromScore(avgScore, report.form);
      
      // Colors
      const navy = [26, 35, 126];
      const gold = [201, 147, 58];
      const lightGray = [248, 250, 252];
      const darkGray = [15, 25, 35];
      
      let currentY = 10; // Start position tracker
      
      // 1. Header with Logo Area and Gradient Effect
      doc.setFillColor(navy[0], navy[1], navy[2]);
      doc.rect(0, 0, pageWidth, 50, 'F');
      
      // Decorative gold bar
      doc.setFillColor(gold[0], gold[1], gold[2]);
      doc.rect(0, 47, pageWidth, 3, 'F');
      
      // Logo Area (Placeholder Circle with P)
      doc.setFillColor(255, 255, 255);
      doc.circle(25, 25, 8, 'F');
      doc.setTextColor(navy[0], navy[1], navy[2]);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('P', 25, 29, { align: 'center' });
      
      // School Name
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('PROGRESS SECONDARY SCHOOL', pageWidth / 2, 22, { align: 'center' });
      
      // Motto
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(220, 220, 220);
      doc.text('Scholastica, Excellentia et Disciplina', pageWidth / 2, 30, { align: 'center' });
      
      // Report Title
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(gold[0], gold[1], gold[2]);
      doc.text('ACADEMIC REPORT CARD', pageWidth / 2, 40, { align: 'center' });
      
      currentY = 58;
      
      // 2. Student Information Card (Compact)
      doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
      doc.roundedRect(15, currentY, pageWidth - 30, 32, 3, 3, 'F');
      doc.setDrawColor(gold[0], gold[1], gold[2]);
      doc.setLineWidth(0.3);
      doc.roundedRect(15, currentY, pageWidth - 30, 32, 3, 3, 'S');
      
      // Student Info - Two column layout
      doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('STUDENT INFORMATION', 20, currentY + 8);
      
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      // Left column
      doc.text(`Name: ${user?.name || user?.full_name || 'N/A'}`, 20, currentY + 16);
      doc.text(`Registration: ${user?.reg_number || user?.registration_number || 'N/A'}`, 20, currentY + 22);
      doc.text(`Form: ${report?.form || user?.form || 'N/A'}`, 20, currentY + 28);
      
      // Right column
      doc.text(`Assessment: ${report?.term || 'N/A'}`, pageWidth - 65, currentY + 16);
      doc.text(`Year: ${report?.academic_year || new Date().getFullYear()}`, pageWidth - 65, currentY + 22);
      doc.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth - 65, currentY + 28);
      
      currentY += 38;
      
      // 3. Performance Summary Cards (Compact)
      const cardWidth = (pageWidth - 45) / 3;
      const cardSpacing = 7;
      const summaryY = currentY;
      const cardHeight = 38;
      
      // Card 1: Average Score
      doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
      doc.roundedRect(15, summaryY, cardWidth, cardHeight, 3, 3, 'F');
      doc.setDrawColor(gold[0], gold[1], gold[2]);
      doc.roundedRect(15, summaryY, cardWidth, cardHeight, 3, 3, 'S');
      
      doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.text('AVERAGE SCORE', 20, summaryY + 10);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(gold[0], gold[1], gold[2]);
      doc.text(`${avgScore}%`, 20, summaryY + 28);
      
      // Card 2: Grade
      doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
      doc.roundedRect(15 + cardWidth + cardSpacing, summaryY, cardWidth, cardHeight, 3, 3, 'F');
      doc.setDrawColor(gold[0], gold[1], gold[2]);
      doc.roundedRect(15 + cardWidth + cardSpacing, summaryY, cardWidth, cardHeight, 3, 3, 'S');
      
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
      doc.text('GRADE', 20 + cardWidth + cardSpacing, summaryY + 10);
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(gold[0], gold[1], gold[2]);
      doc.text(avgGrade.letter, 20 + cardWidth + cardSpacing, summaryY + 32);
      
      // Card 3: Status
      doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
      doc.roundedRect(15 + (cardWidth + cardSpacing) * 2, summaryY, cardWidth, cardHeight, 3, 3, 'F');
      doc.setDrawColor(gold[0], gold[1], gold[2]);
      doc.roundedRect(15 + (cardWidth + cardSpacing) * 2, summaryY, cardWidth, cardHeight, 3, 3, 'S');
      
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
      doc.text('STATUS', 20 + (cardWidth + cardSpacing) * 2, summaryY + 10);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      const statusColor = avgScore >= 50 ? [30, 126, 74] : [192, 57, 43];
      doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
      doc.text(avgScore >= 50 ? 'PASS' : 'FAIL', 20 + (cardWidth + cardSpacing) * 2, summaryY + 30);
      
      currentY = summaryY + cardHeight + 10;
      
      // 4. Subjects Table (Compact with smaller fonts)
      const tableColumn = isUpperForm ? ["Subject", "Score", "Points", "Grade"] : ["Subject", "Score", "Grade", "Remarks"];
      const tableRows = bestSubjects.map((subject) => {
        const grade = getGradeFromScore(subject.score, report.form);
        if (isUpperForm) {
          return [subject.name, `${subject.score}%`, grade.points + ' pts', grade.letter];
        } else {
          return [subject.name, `${subject.score}%`, grade.letter, grade.description];
        }
      });
      
      // Add Summary Row
      if (isUpperForm && totalPoints !== null) {
        tableRows.push([
          { content: 'BEST 6 TOTAL', styles: { fontStyle: 'bold', fillColor: [255, 248, 225] } },
          { content: '', styles: { fontStyle: 'bold' } },
          { content: totalPoints + ' pts', styles: { fontStyle: 'bold', textColor: gold } },
          { content: getOverallGradeFromPoints(totalPoints).description, styles: { fontStyle: 'bold', textColor: gold } }
        ]);
      } else {
        tableRows.push([
          { content: 'OVERALL AVERAGE', styles: { fontStyle: 'bold', fillColor: [255, 248, 225] } },
          { content: `${avgScore}%`, styles: { fontStyle: 'bold', textColor: gold } },
          { content: avgGrade.letter, styles: { fontStyle: 'bold', textColor: gold } },
          { content: avgGrade.description, styles: { fontStyle: 'bold' } }
        ]);
      }
      
      // Calculate available space for table
      const remainingSpace = pageHeight - currentY - 35; // Reserve space for comment and footer
      const tableStartY = currentY;
      
      autoTable(doc, {
        startY: tableStartY,
        margin: { left: 15, right: 15 },
        head: [tableColumn],
        body: tableRows,
        theme: 'grid',
        headStyles: {
          fillColor: navy,
          textColor: 255,
          fontStyle: 'bold',
          halign: 'center',
          fontSize: 8,
          cellPadding: 3
        },
        bodyStyles: {
          textColor: darkGray,
          fontSize: 7,
          cellPadding: 2.5
        },
        alternateRowStyles: {
          fillColor: lightGray
        },
        columnStyles: {
          0: { cellWidth: 70, fontStyle: 'bold' },
          1: { halign: 'center', cellWidth: 30 },
          2: { halign: 'center', cellWidth: 30 },
          3: { halign: 'center' }
        },
        didDrawPage: (data) => {
          // Store final Y for comment placement
          window.tableFinalY = data.cursor.y;
        }
      });
      
      const finalTableY = window.tableFinalY || (currentY + (tableRows.length * 8) + 15);
      currentY = finalTableY + 8;
      
      // 5. Teacher's Comment (Compact)
      if (report?.comment) {
        const commentHeight = 35;
        if (currentY + commentHeight + 25 <= pageHeight) {
          doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
          doc.roundedRect(15, currentY, pageWidth - 30, commentHeight, 3, 3, 'F');
          doc.setDrawColor(gold[0], gold[1], gold[2]);
          doc.setLineWidth(0.3);
          doc.roundedRect(15, currentY, pageWidth - 30, commentHeight, 3, 3, 'S');
          
          // Gold accent bar
          doc.setFillColor(gold[0], gold[1], gold[2]);
          doc.rect(15, currentY, 3, commentHeight, 'F');
          
          doc.setFontSize(7);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(gold[0], gold[1], gold[2]);
          doc.text("Teacher's Remarks", 23, currentY + 8);
          
          doc.setFontSize(7);
          doc.setFont('helvetica', 'italic');
          doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
          const splitComment = doc.splitTextToSize(report.comment, pageWidth - 55);
          // Limit comment to fit within available space
          const maxLines = Math.floor(commentHeight / 5) - 1;
          const displayComment = splitComment.slice(0, maxLines);
          doc.text(displayComment, 23, currentY + 16);
          
          currentY += commentHeight + 8;
        } else {
          // If not enough space, skip comment or add a note
          doc.setFontSize(6);
          doc.setTextColor(gold[0], gold[1], gold[2]);
          doc.text('* Teacher\'s comment available in full report', pageWidth / 2, pageHeight - 25, { align: 'center' });
        }
      }
      
      // 6. Footer (Always at bottom)
      const footerY = pageHeight - 12;
      doc.setDrawColor(gold[0], gold[1], gold[2]);
      doc.setLineWidth(0.2);
      doc.line(15, footerY - 5, pageWidth - 15, footerY - 5);
      
      doc.setFontSize(6);
      doc.setTextColor(150, 150, 150);
      doc.text('This is an official academic document. Results are final.', pageWidth / 2, footerY, { align: 'center' });
      doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, footerY + 4, { align: 'center' });
      
      // Add points system guide for upper form if space allows
      if (isUpperForm && currentY < pageHeight - 28) {
        doc.setFontSize(6);
        doc.setTextColor(100, 100, 100);
        doc.text('Points Guide: 85-100%=1pt | 75-84%=2pts | 65-74%=3pts | 56-64%=4pts | 50-55%=5pts | 45-49%=6pts | 40-44%=7pts | 35-39%=8pts | <35%=9pts', 
                 pageWidth / 2, pageHeight - 22, { align: 'center' });
      }
      
      // Save PDF
      const fileName = `${user?.name?.replace(/\s+/g, '_') || 'student'}_${report?.term?.replace(/\s+/g, '_') || 'report'}_${report?.academic_year || ''}.pdf`;
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
      const navy = [26, 35, 126];
      const gold = [201, 147, 58];
      const lightGray = [248, 250, 252];
      
      // Header
      doc.setFillColor(navy[0], navy[1], navy[2]);
      doc.rect(0, 0, pageWidth, 50, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('PROGRESS SECONDARY SCHOOL', pageWidth / 2, 25, { align: 'center' });
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(200, 200, 200);
      doc.text('Attendance Record', pageWidth / 2, 38, { align: 'center' });
      
      // Student Info
      doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
      doc.roundedRect(20, 65, pageWidth - 40, 45, 3, 3, 'F');
      doc.setDrawColor(gold[0], gold[1], gold[2]);
      doc.roundedRect(20, 65, pageWidth - 40, 45, 3, 3, 'S');
      
      doc.setTextColor(15, 25, 35);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Student Information', 25, 78);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`Name: ${user?.name || user?.full_name || 'N/A'}`, 25, 88);
      doc.text(`Registration: ${user?.reg_number || user?.registration_number || 'N/A'}`, 25, 95);
      doc.text(`Form: ${user?.form || 'N/A'}`, pageWidth - 85, 88);
      doc.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth - 85, 95);
      
      // Stats
      let yPos = 125;
      doc.setFontSize(10);
      doc.setTextColor(gold[0], gold[1], gold[2]);
      doc.setFont('helvetica', 'bold');
      doc.text(`Total Days: ${stats.totalDays}`, 20, yPos);
      doc.text(`Attendance Rate: ${stats.attendanceRate}`, 20, yPos + 7);
      doc.text(`Present: ${stats.presentCount}`, 20, yPos + 14);
      doc.text(`Late: ${stats.lateCount}`, 20, yPos + 21);
      doc.text(`Absent: ${stats.absentCount}`, 20, yPos + 28);
      
      yPos += 45;
      
      // Attendance Table
      const tableRows = attendanceRecords.map(record => [
        new Date(record.date).toLocaleDateString('en', { year: 'numeric', month: 'short', day: 'numeric' }),
        new Date(record.date).toLocaleDateString('en', { weekday: 'long' }),
        record.status === 'present' ? 'Present' : record.status === 'late' ? 'Late' : 'Absent'
      ]);

      autoTable(doc, {
        startY: yPos,
        margin: { left: 20, right: 20 },
        head: [['Date', 'Day', 'Status']],
        body: tableRows,
        theme: 'grid',
        headStyles: {
          fillColor: navy,
          textColor: 255,
          fontStyle: 'bold',
          halign: 'center'
        },
        alternateRowStyles: {
          fillColor: lightGray
        }
      });

      // Footer
      const footerY = doc.internal.pageSize.getHeight() - 15;
      doc.setDrawColor(gold[0], gold[1], gold[2]);
      doc.setLineWidth(0.3);
      doc.line(20, footerY - 5, pageWidth - 20, footerY - 5);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text('Official Attendance Record', pageWidth / 2, footerY, { align: 'center' });

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

  const handleQuizComplete = (result) => {
    setQuizResult(result);
    setShowQuiz(null);
    toast.success(`Quiz submitted! Score: ${Math.round(result.percentage)}%`);
    loadDashboardData(); 
  };

  const getReportHTML = (report) => {
    if (!report || !report.subjects) return '<div>No report data</div>';
    
    const validSubjects = (report.subjects || []).filter(s => s && s.score !== undefined && s.score !== null);
    const isUpperForm = report.form === 'Form 3' || report.form === 'Form 4';
    const totalPoints = isUpperForm ? calculateTotalPoints(validSubjects, report.form) : null;
    const bestSubjects = isUpperForm ? calculateBestSubjects(validSubjects, report.form) : validSubjects;
    const avg = calculateAverage(validSubjects);
    const avgGrade = getGradeFromScore(avg, report.form);
    const pointsGrade = isUpperForm && totalPoints ? getOverallGradeFromPoints(totalPoints) : null;
    const englishPassed = isUpperForm ? (validSubjects.find(s => s.name.toLowerCase().includes('english'))?.score >= 35) : true;
    const finalStatus = isUpperForm ? getFinalStatus(englishPassed, totalPoints) : null;
    
    return `
      <div style="background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(15,25,35,0.1);">
        <div style="background: linear-gradient(135deg, #0f1923, #1a2d3f); color: white; padding: 20px;">
          <div style="font-family: 'Playfair Display', serif; font-size: 18px; font-weight: 700; color: #c9933a; margin-bottom: 4px;">PROGRESS SECONDARY SCHOOL</div>
          <div style="font-size: 11px; opacity: 0.7;">Scholastica, Excellentia et Disciplina</div>
          <div style="font-size: 10px; opacity: 0.6; margin-top: 4px;">${report.term || 'Report'} · ${report.academic_year || new Date().getFullYear()} · ${report.form || user?.form || 'N/A'}</div>
          <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.1);">
            <div style="font-weight: 600; font-size: 14px;">${user?.name || user?.full_name || 'Unknown'}</div>
            <div style="font-family: monospace; font-size: 10px; opacity: 0.7; margin-top: 2px;">${user?.reg_number || user?.registration_number || 'N/A'}</div>
          </div>
        </div>
        <div style="padding: 20px;">
          <!-- Performance Summary -->
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 24px;">
            <div style="background: #f8fafc; padding: 12px; border-radius: 12px; text-align: center; border: 1px solid #e2e8f0;">
              <div style="font-size: 11px; color: #64748b; font-weight: 600;">AVERAGE</div>
              <div style="font-size: 24px; font-weight: bold; color: #c9933a;">${avg}%</div>
            </div>
            <div style="background: #f8fafc; padding: 12px; border-radius: 12px; text-align: center; border: 1px solid #e2e8f0;">
              <div style="font-size: 11px; color: #64748b; font-weight: 600;">GRADE</div>
              <div style="font-size: 32px; font-weight: bold; color: #c9933a;">${avgGrade.letter}</div>
            </div>
            <div style="background: #f8fafc; padding: 12px; border-radius: 12px; text-align: center; border: 1px solid #e2e8f0;">
              <div style="font-size: 11px; color: #64748b; font-weight: 600;">STATUS</div>
              <div style="font-size: 16px; font-weight: bold; color: ${avg >= 50 ? '#10b981' : '#ef4444'};">${avg >= 50 ? 'PASS' : 'FAIL'}</div>
            </div>
          </div>
          
          <!-- Subjects Table -->
          <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background: #f1f5f9; border-bottom: 2px solid #cbd5e1;">
                  <th style="padding: 10px; text-align: left; font-size: 12px; font-weight: 600;">Subject</th>
                  <th style="padding: 10px; text-align: center; font-size: 12px; font-weight: 600;">Score</th>
                  <th style="padding: 10px; text-align: center; font-size: 12px; font-weight: 600;">Grade</th>
                </tr>
              </thead>
              <tbody>
                ${bestSubjects.map(s => {
                  const grade = getGradeFromScore(s.score, report.form);
                  return `
                    <tr style="border-bottom: 1px solid #e2e8f0;">
                      <td style="padding: 10px; font-size: 13px; font-weight: 500;">${s.name}</td>
                      <td style="padding: 10px; text-align: center; font-family: monospace; font-weight: 600; color: ${grade.color};">${s.score}%</td>
                      <td style="padding: 10px; text-align: center;">
                        <span style="display: inline-block; padding: 4px 8px; border-radius: 6px; font-size: 11px; font-weight: 600; background: ${grade.bgColor}; color: ${grade.color};">${grade.letter}</span>
                      </td>
                    </tr>
                  `;
                }).join('')}
                <tr style="background: #fef9e6; border-top: 2px solid #c9933a;">
                  <td style="padding: 10px; font-weight: 700;">${isUpperForm ? 'BEST 6 TOTAL' : 'OVERALL AVERAGE'}</td>
                  <td style="padding: 10px; text-align: center; font-weight: 700; color: #c9933a;">${isUpperForm ? `${totalPoints} pts` : `${avg}%`}</td>
                  <td style="padding: 10px; text-align: center;">
                    <span style="display: inline-block; padding: 4px 8px; border-radius: 6px; font-size: 11px; font-weight: 600; background: #c9933a15; color: #c9933a;">${isUpperForm ? pointsGrade?.description : avgGrade.description}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          
          ${report.comment ? `
            <div style="margin-top: 20px; padding: 16px; background: #fef9e6; border-radius: 12px; border-left: 4px solid #c9933a;">
              <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #c9933a; margin-bottom: 6px;">Teacher's Comment</div>
              <div style="font-size: 12px; color: #334155; line-height: 1.5;">${report.comment}</div>
            </div>
          ` : ''}
          
          ${isUpperForm ? `
            <div style="margin-top: 16px; padding: 12px; background: #f0fdf4; border-radius: 8px; border-left: 3px solid #10b981;">
              <div style="font-size: 9px; font-weight: 700; text-transform: uppercase; color: #10b981;">Points System Guide</div>
              <div style="font-size: 9px; color: #166534; margin-top: 6px;">
                85-100% = 1pt | 75-84% = 2pts | 65-74% = 3pts | 56-64% = 4pts | 50-55% = 5pts | 45-49% = 6pts | 40-44% = 7pts | 35-39% = 8pts | Below 35% = 9pts
              </div>
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
          <div className="w-10 h-10 sm:w-12 sm:h-12 border-4 border-[#00B0FF] border-t-transparent rounded-full animate-spin mx-auto mb-3 sm:mb-4"></div>
          <p className="text-xs sm:text-sm text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: ICE_WHITE }}>
        <div className="text-center max-w-md p-4 sm:p-6 md:p-8 bg-white rounded-xl shadow-lg mx-3">
          <div className="text-4xl sm:text-5xl md:text-6xl mb-3 sm:mb-4">⚠️</div>
          <h2 className="text-base sm:text-lg md:text-xl font-bold text-[#0f1923] mb-2">Error Loading Dashboard</h2>
          <p className="text-xs sm:text-sm md:text-base text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => loadDashboardData()}
            className="px-3 sm:px-4 py-1.5 sm:py-2 bg-[#c9933a] text-white rounded-lg hover:bg-[#b5822e] transition text-xs sm:text-sm"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // If showing a quiz
  if (showQuiz) {
    return (
      <div className="min-h-screen bg-[#f7f4ef]">
        <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 md:py-8">
          <button
            onClick={() => setShowQuiz(null)}
            className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
          >
            ← Back to Dashboard
          </button>
          <QuizTaking quizId={showQuiz} onComplete={handleQuizComplete} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f4ef]">
      {/* Header Section */}
      <div 
        className="w-full sticky top-0 z-30"
        style={{
          background: `linear-gradient(135deg, ${NAVY_DARK}, #1E3A8A)`,
        }}
      >
        <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-2.5 sm:py-3 md:py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 bg-[#c9933a] rounded-xl flex items-center justify-center shadow-md">
                <span className="text-base sm:text-lg md:text-xl font-bold text-[#0f1923]">P</span>
              </div>
              <div>
                <h1 className="text-sm sm:text-base md:text-xl font-serif font-bold text-white">PROGRESS</h1>
                <p className="text-[8px] sm:text-[10px] text-white/70 hidden sm:block">Secondary School</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="hidden sm:flex items-center gap-2 sm:gap-3 bg-white/10 rounded-lg px-2 sm:px-3 py-1 sm:py-1.5">
                <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 bg-[#c9933a] rounded-full flex items-center justify-center text-xs sm:text-sm">
                  🎓
                </div>
                <div>
                  <div className="text-xs sm:text-sm font-semibold text-white truncate max-w-[100px] sm:max-w-none">{getUserName()}</div>
                  <div className="text-[8px] sm:text-[10px] text-white/70">Student</div>
                </div>
              </div>
              <MobileMenuButton isOpen={mobileMenuOpen} onClick={() => setMobileMenuOpen(!mobileMenuOpen)} />
              <button
                onClick={handleLogout}
                className="px-2 sm:px-3 py-1 sm:py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-xs sm:text-sm touch-manipulation"
              >
                Logout
              </button>
            </div>
          </div>
          <div className="mt-1.5 sm:mt-2 md:mt-3 lg:mt-4">
            <p className="text-[8px] sm:text-[10px] md:text-xs font-extrabold tracking-wider mb-0.5 sm:mb-1" style={{ color: AZURE_ACCENT }}>
              LEARNER PORTAL
            </p>
            <h1 className="text-sm sm:text-base md:text-xl lg:text-2xl font-bold text-white truncate">
              Hello, {getUserName()}
            </h1>
            <p className="text-[10px] sm:text-xs md:text-sm text-white/70 mt-0.5 sm:mt-1">{getGreeting()}! Welcome back</p>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
          <div className="fixed top-0 right-0 h-full w-64 bg-white shadow-xl animate-slide-in-right">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-[#c9933a] rounded-xl flex items-center justify-center">
                  <span className="text-lg font-bold text-[#0f1923]">P</span>
                </div>
                <div>
                  <div className="font-bold text-[#0f1923] text-sm">PROGRESS</div>
                  <div className="text-xs text-gray-500">Secondary School</div>
                </div>
              </div>
            </div>
            <div className="p-2">
              <button
                onClick={() => {
                  setActiveTab('overview');
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-left px-3 py-2.5 rounded-lg mb-1 transition ${
                  activeTab === 'overview' ? 'bg-[#1A237E] text-white' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="mr-2">📊</span> Overview
              </button>
              <button
                onClick={() => {
                  setActiveTab('quizzes');
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-left px-3 py-2.5 rounded-lg mb-1 transition ${
                  activeTab === 'quizzes' ? 'bg-[#1A237E] text-white' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="mr-2">📝</span> Quizzes
              </button>
              <button
                onClick={() => {
                  setActiveTab('reports');
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-left px-3 py-2.5 rounded-lg mb-1 transition ${
                  activeTab === 'reports' ? 'bg-[#1A237E] text-white' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="mr-2">📋</span> Reports
              </button>
              <button
                onClick={() => {
                  setActiveTab('attendance');
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-left px-3 py-2.5 rounded-lg mb-1 transition ${
                  activeTab === 'attendance' ? 'bg-[#1A237E] text-white' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="mr-2">📅</span> Attendance
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Bar - Desktop */}
      <div className="hidden lg:block sticky top-[72px] sm:top-[88px] md:top-[96px] z-20 bg-white border-b border-gray-200 shadow-sm overflow-x-auto">
        <div className="container mx-auto px-3 sm:px-4 lg:px-6">
          <div className="flex gap-0.5 sm:gap-1 py-2 sm:py-3 min-w-max">
            <NavItem
              icon="📊"
              label="Overview"
              isActive={activeTab === 'overview'}
              onClick={() => setActiveTab('overview')}
            />
            <NavItem
              icon="📝"
              label="Quizzes"
              isActive={activeTab === 'quizzes'}
              onClick={() => setActiveTab('quizzes')}
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

      <main className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 md:py-8 max-w-7xl">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <>
            <div className="mb-3 sm:mb-4 md:mb-6 lg:mb-8">
              <p className="text-xs sm:text-sm text-gray-500">Track your academic progress and performance</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 md:gap-4 lg:gap-6 mb-4 sm:mb-6 md:mb-8">
              <StatCard emoji="📋" value={stats.reportsCount} label="Reports" />
              <StatCard emoji="📅" value={stats.attendanceRate} label="Attendance" />
              <StatCard emoji="⭐" value={stats.averageScore} label="Average" />
              <StatCard emoji="📝" value={stats.quizzesCompleted} label="Quizzes" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
              {/* Latest Report Card Section */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-xl border border-[#d4cfc6] shadow-sm overflow-hidden h-full">
                  <div className="px-3 sm:px-4 md:px-5 lg:px-6 py-2.5 sm:py-3 md:py-4 border-b border-[#d4cfc6] bg-gradient-to-r from-white to-[#f7f4ef]">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <h2 className="font-serif text-sm sm:text-base md:text-lg font-bold text-[#0f1923] flex items-center gap-2">
                        <span className="text-[#c9933a] text-base sm:text-lg md:text-xl">📋</span>
                        Current Report
                      </h2>
                      {latestReport && (
                        <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3">
                          <span className="px-1.5 sm:px-2 md:px-3 py-0.5 sm:py-1 bg-[#c9933a]/10 text-[#c9933a] rounded-full text-[9px] sm:text-[10px] md:text-xs font-medium border border-[#c9933a]/30 truncate max-w-[120px] sm:max-w-none">
                            {latestReport.term || 'Current'} {latestReport.academic_year ? `(${latestReport.academic_year})` : ''}
                          </span>
                          <button
                            onClick={() => downloadReportPDF(latestReport)}
                            className="p-1.5 sm:p-2 text-[#c9933a] hover:bg-[#c9933a]/10 rounded-lg transition-all hover:scale-110 border border-[#d4cfc6] hover:border-[#c9933a]/40"
                            title="Download PDF"
                          >
                            <ArrowDownTrayIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="p-3 sm:p-4 md:p-5 lg:p-6">
                    {latestReport && latestReport.subjects && latestReport.subjects.length > 0 ? (
                      <div className="space-y-3 sm:space-y-4">
                        <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4 mb-3 sm:mb-4">
                          <div className="bg-[#f7f4ef] p-2 sm:p-3 md:p-4 rounded-xl border border-[#d4cfc6]">
                            <p className="text-[8px] sm:text-[9px] md:text-[10px] lg:text-xs text-gray-500 mb-0.5">Subjects</p>
                            <p className="text-xs sm:text-sm md:text-base lg:text-2xl font-bold text-[#0f1923]">{latestReport.subjects.length}</p>
                          </div>
                          <div className="bg-[#f7f4ef] p-2 sm:p-3 md:p-4 rounded-xl border border-[#d4cfc6]">
                            <p className="text-[8px] sm:text-[9px] md:text-[10px] lg:text-xs text-gray-500 mb-0.5">Average</p>
                            <p className="text-xs sm:text-sm md:text-base lg:text-2xl font-bold text-[#c9933a]">
                              {calculateAverage(latestReport.subjects)}%
                            </p>
                            <div className="mt-1 sm:mt-2 w-full h-1 bg-gray-200 rounded-full">
                              <div 
                                className="h-1 bg-[#c9933a] rounded-full" 
                                style={{ width: `${calculateAverage(latestReport.subjects)}%` }}
                              />
                            </div>
                          </div>
                          <div className="bg-[#f7f4ef] p-2 sm:p-3 md:p-4 rounded-xl border border-[#d4cfc6]">
                            <p className="text-[8px] sm:text-[9px] md:text-[10px] lg:text-xs text-gray-500 mb-0.5">Year</p>
                            <p className="text-[10px] sm:text-xs md:text-sm lg:text-xl font-bold text-[#0f1923]">{latestReport.academic_year || new Date().getFullYear()}</p>
                          </div>
                        </div>

                        <div className="bg-[#f7f4ef] rounded-xl p-3 sm:p-4 border border-[#d4cfc6] overflow-x-auto">
                          <h3 className="text-[10px] sm:text-xs md:text-sm font-medium text-[#0f1923] mb-2 sm:mb-3 flex items-center gap-2">
                            <span className="w-1 h-3 sm:h-4 bg-[#c9933a] rounded-full" />
                            Subject Performance
                          </h3>
                          <div className="min-w-[280px] space-y-2 sm:space-y-3">
                            {latestReport.subjects.map((subject, index) => {
                              const grade = getGradeFromScore(subject.score, latestReport.form);
                              return (
                                <div key={index} className="flex items-center py-1.5 sm:py-2 border-b border-[#ede9e1] last:border-0 group">
                                  <div className="flex-1 text-[10px] sm:text-xs md:text-sm text-gray-700 group-hover:text-[#0f1923] font-medium truncate">
                                    {subject.name}
                                  </div>
                                  <div className="flex-1 max-w-[80px] sm:max-w-[120px] md:max-w-[200px] mx-2 sm:mx-4">
                                    <div className="h-1 sm:h-1.5 md:h-2 bg-gray-200 rounded-full overflow-hidden">
                                      <div 
                                        className="h-full rounded-full transition-all duration-500" 
                                        style={{ 
                                          width: `${subject.score}%`,
                                          background: `linear-gradient(90deg, ${grade.color}80, ${grade.color})`
                                        }}
                                      />
                                    </div>
                                  </div>
                                  <div className="font-mono text-[10px] sm:text-xs md:text-sm w-8 sm:w-10 md:w-12 text-right font-bold" style={{ color: grade.color }}>
                                    {subject.score}
                                  </div>
                                  <div className="w-5 sm:w-6 md:w-8 text-center font-bold px-1 sm:px-2 py-0.5 rounded ml-1 sm:ml-2 text-[10px] sm:text-xs md:text-sm" style={{ 
                                    color: grade.color,
                                    backgroundColor: `${grade.color}10`
                                  }}>
                                    {latestReport.form === 'Form 3' || latestReport.form === 'Form 4' ? grade.points + 'pts' : grade.letter}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {latestReport.comment && (
                          <div className="bg-[#f7f4ef] p-3 sm:p-4 rounded-xl border-l-4 border-[#c9933a]">
                            <div className="text-[#c9933a] text-[9px] sm:text-[10px] md:text-xs font-bold uppercase tracking-wider mb-1">
                              Teacher's Note
                            </div>
                            <p className="text-[10px] sm:text-xs md:text-sm text-gray-700 italic">"{latestReport.comment}"</p>
                          </div>
                        )}
                        
                        <button
                          onClick={() => setActiveTab('reports')}
                          className="w-full mt-3 sm:mt-4 py-2 sm:py-3 text-[10px] sm:text-xs md:text-sm text-[#c9933a] font-medium transition-all 
                                     bg-[#c9933a]/5 hover:bg-[#c9933a]/10 rounded-lg border border-[#d4cfc6] 
                                     hover:border-[#c9933a]/60 flex items-center justify-center gap-2 group"
                        >
                          <DocumentTextIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:animate-pulse" />
                          <span className="hidden xs:inline">View All Reports</span>
                          <span className="xs:hidden">All Reports</span>
                          <span className="group-hover:translate-x-1 transition-transform">→</span>
                        </button>
                      </div>
                    ) : (
                      <div className="text-center py-6 sm:py-8 md:py-12 lg:py-16">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 mx-auto mb-2 sm:mb-3 md:mb-4 bg-[#c9933a]/5 rounded-full flex items-center justify-center border-2 border-[#d4cfc6]">
                          <DocumentTextIcon className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 text-[#c9933a]" />
                        </div>
                        <div className="font-medium text-[#0f1923] mb-2 text-xs sm:text-sm md:text-base">
                          No Report Card Available
                        </div>
                        <p className="text-[10px] sm:text-xs md:text-sm text-gray-500 max-w-xs mx-auto">
                          Your teacher hasn't generated any reports yet. 
                          Check back after your next assessment.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Side Panel - Quiz Performance Card, Attendance Summary, Quick Actions, Recent Activity */}
              <div className="space-y-3 sm:space-y-4 md:space-y-5 lg:space-y-6">
                {/* Quiz Performance Card */}
                <div className="bg-white rounded-xl border border-[#d4cfc6] shadow-sm overflow-hidden">
                  <div className="px-3 sm:px-4 md:px-5 lg:px-6 py-2 sm:py-2.5 md:py-3 lg:py-4 border-b border-[#d4cfc6] bg-gradient-to-r from-white to-[#f7f4ef]">
                    <div className="flex items-center justify-between">
                      <h2 className="font-serif text-sm sm:text-base md:text-lg font-bold text-[#0f1923] flex items-center gap-2">
                        <span className="text-purple-600">📝</span>
                        Quiz Performance
                      </h2>
                      <button
                        onClick={() => setActiveTab('quizzes')}
                        className="text-xs text-purple-600 hover:text-purple-700"
                      >
                        Take Quiz →
                      </button>
                    </div>
                  </div>
                  <div className="p-3 sm:p-4 md:p-5 lg:p-6">
                    <div className="text-center mb-3 sm:mb-4">
                      <div className="relative inline-flex items-center justify-center mb-2 sm:mb-3">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full border-4 border-purple-200 flex items-center justify-center">
                          <span className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-purple-600">
                            {stats.quizScore}
                          </span>
                        </div>
                      </div>
                      <p className="text-[10px] sm:text-xs text-gray-600">
                        {stats.quizzesCompleted > 0 
                          ? `Completed ${stats.quizzesCompleted} quiz(zes)` 
                          : "No quizzes taken yet"}
                      </p>
                    </div>
                    {stats.quizzesCompleted === 0 && (
                      <button
                        onClick={() => setActiveTab('quizzes')}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-xs sm:text-sm"
                      >
                        <PlayIcon className="w-4 h-4" />
                        Start a Quiz
                      </button>
                    )}
                  </div>
                </div>

                {/* Attendance Summary Card */}
                <div className="bg-white rounded-xl border border-[#d4cfc6] shadow-sm overflow-hidden">
                  <div className="px-3 sm:px-4 md:px-5 lg:px-6 py-2 sm:py-2.5 md:py-3 lg:py-4 border-b border-[#d4cfc6] bg-gradient-to-r from-white to-[#f7f4ef]">
                    <div className="flex items-center justify-between">
                      <h2 className="font-serif text-sm sm:text-base md:text-lg font-bold text-[#0f1923] flex items-center gap-2">
                        <span className="text-[#c9933a]">📊</span>
                        <span className="hidden xs:inline">Attendance</span>
                        <span className="xs:hidden">Attend</span>
                      </h2>
                      {attendanceRecords.length > 0 && (
                        <button
                          onClick={downloadAttendancePDF}
                          className="p-1.5 sm:p-2 text-[#c9933a] hover:bg-[#c9933a]/10 rounded-lg transition-all hover:scale-110 border border-[#d4cfc6] hover:border-[#c9933a]/40"
                          title="Download Attendance PDF"
                        >
                          <ArrowDownTrayIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="p-3 sm:p-4 md:p-5 lg:p-6">
                    <div className="text-center mb-3 sm:mb-4 md:mb-5 lg:mb-6">
                      <div className="relative inline-flex items-center justify-center mb-2 sm:mb-3 md:mb-4">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full border-4 border-[#c9933a]/20 flex items-center justify-center">
                          <span className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-[#c9933a]">{stats.attendanceRate}</span>
                        </div>
                      </div>
                      <p className="text-[10px] sm:text-xs md:text-sm text-gray-600 bg-[#f7f4ef] py-1 sm:py-1.5 md:py-2 px-2 sm:px-3 md:px-4 rounded-full inline-block border border-[#d4cfc6]">
                        {getAttendanceMessage()}
                      </p>
                    </div>
                    
                    {stats.totalDays > 0 ? (
                      <div className="grid grid-cols-3 gap-1.5 sm:gap-2 md:gap-3 mt-2 sm:mt-3 md:mt-4">
                        <div className="text-center p-1.5 sm:p-2 md:p-3 bg-green-50 rounded-xl border border-green-200">
                          <div className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 mx-auto mb-0.5 sm:mb-1 md:mb-2 bg-green-100 rounded-lg flex items-center justify-center">
                            <CheckCircleIcon className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-green-600" />
                          </div>
                          <div className="text-green-600 font-bold text-xs sm:text-sm md:text-base lg:text-xl">{stats.presentCount}</div>
                          <div className="text-[8px] sm:text-[9px] md:text-[10px] lg:text-xs text-gray-500">Present</div>
                        </div>
                        <div className="text-center p-1.5 sm:p-2 md:p-3 bg-[#c9933a]/5 rounded-xl border border-[#d4cfc6]">
                          <div className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 mx-auto mb-0.5 sm:mb-1 md:mb-2 bg-[#c9933a]/10 rounded-lg flex items-center justify-center">
                            <ClockIcon className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-[#c9933a]" />
                          </div>
                          <div className="text-[#c9933a] font-bold text-xs sm:text-sm md:text-base lg:text-xl">{stats.lateCount}</div>
                          <div className="text-[8px] sm:text-[9px] md:text-[10px] lg:text-xs text-gray-500">Late</div>
                        </div>
                        <div className="text-center p-1.5 sm:p-2 md:p-3 bg-red-50 rounded-xl border border-red-200">
                          <div className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 mx-auto mb-0.5 sm:mb-1 md:mb-2 bg-red-100 rounded-lg flex items-center justify-center">
                            <span className="text-red-600 text-xs sm:text-sm md:text-base lg:text-xl font-bold">✕</span>
                          </div>
                          <div className="text-red-600 font-bold text-xs sm:text-sm md:text-base lg:text-xl">{stats.absentCount}</div>
                          <div className="text-[8px] sm:text-[9px] md:text-[10px] lg:text-xs text-gray-500">Absent</div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4 sm:py-5 md:py-6 lg:py-8">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 mx-auto mb-1.5 sm:mb-2 md:mb-3 bg-[#f7f4ef] rounded-full flex items-center justify-center border-2 border-[#d4cfc6]">
                          <CalendarIcon className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-gray-400" />
                        </div>
                        <p className="text-[10px] sm:text-xs md:text-sm text-gray-500">No attendance records yet</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick Actions Card */}
                <div className="bg-white rounded-xl border border-[#d4cfc6] shadow-sm overflow-hidden">
                  <div className="px-3 sm:px-4 md:px-5 lg:px-6 py-2 sm:py-2.5 md:py-3 lg:py-4 border-b border-[#d4cfc6] bg-gradient-to-r from-white to-[#f7f4ef]">
                    <h2 className="font-serif text-sm sm:text-base md:text-lg font-bold text-[#0f1923] flex items-center gap-2">
                      <span className="text-[#c9933a]">⚡</span>
                      Quick Actions
                    </h2>
                  </div>
                  <div className="p-3 sm:p-4 md:p-5 lg:p-6 space-y-2 sm:space-y-2.5 md:space-y-3">
                    <button 
                      onClick={() => setActiveTab('quizzes')}
                      className="w-full text-left p-2.5 sm:p-3 md:p-4 bg-purple-50 rounded-xl hover:bg-purple-100 transition-all group border border-purple-200 hover:border-purple-400"
                    >
                      <div className="flex items-center gap-2 sm:gap-2.5 md:gap-3">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200">
                          <BookOpenIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <span className="text-[11px] sm:text-xs md:text-sm font-medium text-purple-700 group-hover:text-purple-800 transition-colors">
                            Take a Quiz
                          </span>
                          <p className="text-[9px] sm:text-[10px] md:text-xs text-gray-500 mt-0.5 hidden sm:block">Test your knowledge</p>
                        </div>
                        <span className="text-xs text-gray-400 group-hover:translate-x-1 transition-transform">→</span>
                      </div>
                    </button>
                    
                    <button 
                      onClick={() => setActiveTab('reports')}
                      className="w-full text-left p-2.5 sm:p-3 md:p-4 bg-[#f7f4ef] rounded-xl hover:bg-[#ede9e1] transition-all group border border-[#d4cfc6] hover:border-[#c9933a]/30"
                    >
                      <div className="flex items-center gap-2 sm:gap-2.5 md:gap-3">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-[#c9933a]/5 rounded-lg flex items-center justify-center group-hover:bg-[#c9933a]/10 border border-[#d4cfc6]">
                          <DocumentTextIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-[#c9933a]" />
                        </div>
                        <div className="flex-1">
                          <span className="text-[11px] sm:text-xs md:text-sm font-medium text-[#0f1923] group-hover:text-[#c9933a] transition-colors">
                            View All Reports
                          </span>
                          <p className="text-[9px] sm:text-[10px] md:text-xs text-gray-500 mt-0.5 hidden sm:block">Access your complete academic history</p>
                        </div>
                        <span className="text-xs text-gray-400 group-hover:translate-x-1 transition-transform">→</span>
                      </div>
                    </button>
                    
                    {stats.reportsCount > 0 && latestReport && (
                      <button 
                        onClick={() => downloadReportPDF(latestReport)}
                        className="w-full text-left p-2.5 sm:p-3 md:p-4 bg-[#c9933a]/5 rounded-xl hover:bg-[#c9933a]/10 transition-all group border border-[#c9933a]/30"
                      >
                        <div className="flex items-center gap-2 sm:gap-2.5 md:gap-3">
                          <div className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-[#c9933a] rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                            <ArrowDownTrayIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <span className="text-[11px] sm:text-xs md:text-sm font-medium text-[#c9933a]">
                              Download Latest Report
                            </span>
                            <p className="text-[9px] sm:text-[10px] md:text-xs text-gray-500 mt-0.5 hidden sm:block">Save as PDF</p>
                          </div>
                        </div>
                      </button>
                    )}
                  </div>
                </div>

                {/* Recent Activity Card */}
                {recentActivity.length > 0 && (
                  <div className="bg-white rounded-xl border border-[#d4cfc6] shadow-sm overflow-hidden">
                    <div className="px-3 sm:px-4 md:px-5 lg:px-6 py-2 sm:py-2.5 md:py-3 lg:py-4 border-b border-[#d4cfc6] bg-gradient-to-r from-white to-[#f7f4ef]">
                      <h2 className="font-serif text-sm sm:text-base md:text-lg font-bold text-[#0f1923] flex items-center gap-2">
                        <span className="text-[#c9933a]">🕒</span>
                        Recent Activity
                      </h2>
                    </div>
                    <div className="p-0">
                      <div className="divide-y divide-[#ede9e1]">
                        {recentActivity.slice(0, 4).map((activity) => (
                          <div key={activity.id} className="p-2.5 sm:p-3 md:p-4 hover:bg-[#f7f4ef] transition-colors">
                            <div className="flex items-center gap-2 sm:gap-2.5 md:gap-3">
                              <span className={`text-base sm:text-lg md:text-xl ${activity.color || 'text-[#c9933a]'}`}>{activity.icon}</span>
                              <div className="flex-1 min-w-0">
                                <p className="text-[10px] sm:text-xs md:text-sm font-medium text-[#0f1923] truncate">{activity.title}</p>
                                <p className="text-[8px] sm:text-[9px] md:text-[10px] text-gray-500 mt-0.5 truncate">{activity.description}</p>
                              </div>
                              <span className="text-[8px] sm:text-[9px] md:text-[10px] text-gray-400 flex-shrink-0">
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

        {/* Quizzes Tab */}
        {activeTab === 'quizzes' && (
          <div className="space-y-6">
            {!showQuiz ? (
              <QuizList 
                onStartQuiz={(quizId) => setShowQuiz(quizId)} 
              />
            ) : (
              <div>
                <button
                  onClick={() => setShowQuiz(null)}
                  className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
                >
                  ← Back to Quizzes
                </button>
                <QuizTaking 
                  quizId={showQuiz} 
                  onComplete={handleQuizComplete}
                />
              </div>
            )}
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <>
            <div className="mb-3 sm:mb-4 md:mb-5 lg:mb-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-2">
                <div>
                  <h1 className="font-serif text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-bold text-[#0f1923] mb-1">Report Cards</h1>
                  <p className="text-[10px] sm:text-xs md:text-sm text-gray-500">Your academic performance overview</p>
                </div>
                
                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                  {availableYears.length > 0 && (
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <label className="text-[9px] sm:text-[10px] md:text-xs font-semibold text-gray-500 uppercase">Year:</label>
                      <select
                        value={selectedYear || ''}
                        onChange={(e) => setSelectedYear(e.target.value ? parseInt(e.target.value) : null)}
                        className="px-2 sm:px-3 py-1 sm:py-1.5 border border-gray-300 rounded-lg text-[10px] sm:text-xs bg-white focus:ring-2 focus:ring-[#c9933a] focus:border-transparent"
                      >
                        <option value="">All</option>
                        {availableYears.map(year => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  
                  {availableAssessments.length > 0 && (
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <label className="text-[9px] sm:text-[10px] md:text-xs font-semibold text-gray-500 uppercase">Assessment:</label>
                      <select
                        value={selectedAssessment || ''}
                        onChange={(e) => setSelectedAssessment(e.target.value || null)}
                        className="px-2 sm:px-3 py-1 sm:py-1.5 border border-gray-300 rounded-lg text-[10px] sm:text-xs bg-white focus:ring-2 focus:ring-[#c9933a] focus:border-transparent"
                      >
                        <option value="">All</option>
                        {availableAssessments.map(assessment => (
                          <option key={assessment} value={assessment}>{assessment.length > 15 ? assessment.substring(0, 12) + '...' : assessment}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
              
              {(selectedYear || selectedAssessment) && (
                <div className="mt-2 flex flex-wrap gap-1.5 sm:gap-2">
                  <span className="text-[9px] sm:text-[10px] text-gray-500">Active filters:</span>
                  {selectedYear && (
                    <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded text-[9px] sm:text-[10px] bg-[#c9933a]/10 text-[#c9933a]">
                      Year: {selectedYear}
                      <button onClick={() => setSelectedYear(null)} className="ml-1 hover:text-[#b5822e]">✕</button>
                    </span>
                  )}
                  {selectedAssessment && (
                    <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded text-[9px] sm:text-[10px] bg-[#c9933a]/10 text-[#c9933a]">
                      {selectedAssessment.length > 20 ? selectedAssessment.substring(0, 18) + '...' : selectedAssessment}
                      <button onClick={() => setSelectedAssessment(null)} className="ml-1 hover:text-[#b5822e]">✕</button>
                    </span>
                  )}
                  {(selectedYear || selectedAssessment) && (
                    <button
                      onClick={() => {
                        setSelectedYear(null);
                        setSelectedAssessment(null);
                      }}
                      className="text-[9px] sm:text-[10px] text-blue-600 hover:text-blue-800"
                    >
                      Clear all
                    </button>
                  )}
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
              {filteredReports && filteredReports.length > 0 ? (
                filteredReports.map(report => {
                  const validSubjects = (report.subjects || []).filter(s => s && s.score !== undefined && s.score !== null);
                  const isUpperForm = report.form === 'Form 3' || report.form === 'Form 4';
                  const bestSubjects = isUpperForm ? calculateBestSubjects(validSubjects, report.form) : validSubjects;
                  const avg = calculateAverage(validSubjects);
                  const grade = getGradeFromScore(avg, report.form);
                  const totalPoints = isUpperForm ? calculateTotalPoints(validSubjects, report.form) : null;
                  
                  return (
                    <div key={report.id} className="bg-white rounded-xl border border-[#d4cfc6] shadow-sm overflow-hidden hover:shadow-md transition">
                      <div className="p-2.5 sm:p-3 md:p-4 border-b flex justify-between items-center flex-wrap gap-2">
                        <div>
                          <span className="font-bold text-[#0f1923] text-xs sm:text-sm md:text-base">{report.term || 'Report'}</span>
                          <span className="ml-1.5 sm:ml-2 px-1.5 sm:px-2 py-0.5 bg-[#c9933a]/10 text-[#c9933a] text-[9px] sm:text-[10px] rounded-full">
                            {report.form || user?.form || 'N/A'}
                          </span>
                          <span className="ml-1.5 sm:ml-2 px-1.5 sm:px-2 py-0.5 bg-gray-100 text-gray-600 text-[9px] sm:text-[10px] rounded-full">
                            {report.academic_year || new Date().getFullYear()}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] sm:text-xs md:text-sm font-bold" style={{ color: grade.color }}>
                            {isUpperForm ? `${totalPoints} pts` : `${avg}% (${grade.letter})`}
                          </span>
                        </div>
                      </div>
                      <div className="p-2.5 sm:p-3 md:p-4">
                        <div className="space-y-1.5 sm:space-y-2 max-h-32 sm:max-h-36 md:max-h-40 overflow-y-auto">
                          {bestSubjects.slice(0, 5).map((s, idx) => {
                            const g = getGradeFromScore(s.score, report.form);
                            return (
                              <div key={idx} className="flex justify-between items-center text-[10px] sm:text-xs md:text-sm">
                                <span className="truncate">{s.name}</span>
                                <span style={{ color: g.color }} className="font-mono font-medium ml-2">
                                  {s.score}% {isUpperForm ? `(${g.points} pts)` : `(${g.letter})`}
                                </span>
                              </div>
                            );
                          })}
                          {bestSubjects.length > 5 && (
                            <div className="text-[9px] sm:text-[10px] text-gray-400 text-center pt-1">
                              +{bestSubjects.length - 5} more subjects
                            </div>
                          )}
                          {isUpperForm && bestSubjects.length < validSubjects.length && (
                            <div className="text-[8px] sm:text-[9px] text-gray-400 text-center">
                              * Best {bestSubjects.length} subjects shown
                            </div>
                          )}
                        </div>
                        {report.comment && (
                          <div className="mt-2 sm:mt-3 p-1.5 sm:p-2 bg-[#f7f4ef] rounded text-[9px] sm:text-[10px] italic">
                            💬 {report.comment.substring(0, 50)}{report.comment.length > 50 ? '…' : ''}
                          </div>
                        )}
                        <div className="mt-2.5 sm:mt-3 md:mt-4 flex gap-2">
                          <button 
                            onClick={() => handleViewReport(report)} 
                            className="flex-1 px-2 sm:px-3 py-1 sm:py-1.5 border border-[#c9933a] text-[#c9933a] rounded-lg text-[10px] sm:text-xs hover:bg-[#c9933a]/10 transition"
                          >
                            Preview
                          </button>
                          <button 
                            onClick={() => downloadReportPDF(report)} 
                            className="flex-1 px-2 sm:px-3 py-1 sm:py-1.5 bg-[#0f1923] text-white rounded-lg text-[10px] sm:text-xs hover:bg-[#1a2d3f] transition"
                          >
                            <ArrowDownTrayIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3 inline mr-1" />
                            PDF
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-2 text-center py-6 sm:py-8 md:py-10 lg:py-12 bg-white rounded-xl border border-[#d4cfc6]">
                  <DocumentTextIcon className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-xs sm:text-sm md:text-base text-gray-500">
                    {selectedYear || selectedAssessment 
                      ? `No reports match your filters` 
                      : 'No reports available yet'}
                  </p>
                  {(selectedYear || selectedAssessment) && (
                    <button
                      onClick={() => {
                        setSelectedYear(null);
                        setSelectedAssessment(null);
                      }}
                      className="mt-2 text-xs sm:text-sm text-[#c9933a] hover:underline"
                    >
                      Clear filters
                    </button>
                  )}
                  <p className="text-[9px] sm:text-[10px] text-gray-400 mt-1">Reports will appear here once your teacher generates them</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* Attendance Tab */}
        {activeTab === 'attendance' && (
          <>
            <div className="mb-3 sm:mb-4 md:mb-5 lg:mb-6">
              <h1 className="font-serif text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-bold text-[#0f1923] mb-1">Attendance Records</h1>
              <p className="text-[10px] sm:text-xs md:text-sm text-gray-500">Your daily attendance history</p>
            </div>
            
            <div className="bg-white rounded-xl border border-[#d4cfc6] shadow-sm overflow-hidden">
              <div className="px-3 sm:px-4 md:px-5 lg:px-6 py-2 sm:py-2.5 md:py-3 lg:py-4 border-b border-[#d4cfc6] flex justify-between items-center flex-wrap gap-2">
                <h2 className="font-semibold text-[#0f1923] text-xs sm:text-sm md:text-base">📅 Attendance Log</h2>
                {attendanceRecords.length > 0 && (
                  <button 
                    onClick={downloadAttendancePDF} 
                    className="px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs bg-[#c9933a] text-white rounded-lg hover:bg-[#b5822e] transition"
                  >
                    <ArrowDownTrayIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3 inline mr-1" />
                    <span className="hidden xs:inline">PDF</span>
                  </button>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[350px] sm:min-w-[400px] md:min-w-[500px]">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-2 sm:px-3 lg:px-4 py-2 sm:py-2.5 lg:py-3 text-left text-[9px] sm:text-[10px] lg:text-xs font-semibold text-gray-500 uppercase">Date</th>
                      <th className="px-2 sm:px-3 lg:px-4 py-2 sm:py-2.5 lg:py-3 text-left text-[9px] sm:text-[10px] lg:text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">Day</th>
                      <th className="px-2 sm:px-3 lg:px-4 py-2 sm:py-2.5 lg:py-3 text-left text-[9px] sm:text-[10px] lg:text-xs font-semibold text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {attendanceRecords && attendanceRecords.length > 0 ? (
                      [...attendanceRecords]
                        .sort((a, b) => new Date(b.date) - new Date(a.date))
                        .slice(0, 15)
                        .map(record => (
                          <tr key={record.id} className="hover:bg-gray-50">
                            <td className="px-2 sm:px-3 lg:px-4 py-2 sm:py-2.5 lg:py-3 text-[9px] sm:text-[10px] lg:text-sm whitespace-nowrap">
                              {new Date(record.date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                            </td>
                            <td className="px-2 sm:px-3 lg:px-4 py-2 sm:py-2.5 lg:py-3 text-[9px] sm:text-[10px] lg:text-sm hidden sm:table-cell">
                              {new Date(record.date).toLocaleDateString('en', { weekday: 'short' })}
                            </td>
                            <td className="px-2 sm:px-3 lg:px-4 py-2 sm:py-2.5 lg:py-3">
                              <span className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[8px] sm:text-[9px] font-semibold ${
                                record.status === 'present' ? 'bg-green-100 text-green-700' : 
                                record.status === 'late' ? 'bg-yellow-100 text-yellow-700' : 
                                'bg-red-100 text-red-700'
                              }`}>
                                {record.status === 'present' ? 'P' : record.status === 'late' ? 'L' : 'A'}
                              </span>
                            </td>
                          </tr>
                        ))
                    ) : (
                      <tr>
                        <td colSpan="3" className="px-3 sm:px-4 py-6 sm:py-8 text-center text-gray-500 text-xs sm:text-sm">
                          No attendance records yet
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                {attendanceRecords.length > 15 && (
                  <div className="px-4 py-2 text-center text-[10px] text-gray-400 border-t border-gray-100">
                    Showing last 15 of {attendanceRecords.length} records
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </main>

      {/* View Report Modal */}
      {showReportModal && selectedReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-3 md:p-4" onClick={() => setShowReportModal(false)}>
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div dangerouslySetInnerHTML={{ __html: getReportHTML(selectedReport) }} />
            <div className="mt-3 sm:mt-4 flex justify-end">
              <button 
                onClick={() => setShowReportModal(false)} 
                className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition text-xs sm:text-sm"
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