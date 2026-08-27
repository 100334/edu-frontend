import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import LearningSpace from './LearningSpace';
import QuizTaking from './QuizTaking';
import {
  DocumentTextIcon,
  CalendarIcon,
  ArrowDownTrayIcon,
  TrophyIcon,
  BookOpenIcon,
  BellIcon,
  ChartBarIcon,
  AcademicCapIcon,
  HomeIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  SparklesIcon,
  XMarkIcon,
  Bars3Icon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ─── Theme ───────────────────────────────────────────────────────────────────
const HEADER_BG  = '#003B46';
const NAVBAR_BG  = '#006770';
const TEAL_ACCENT = '#2A9D8F';
const AZURE_ACCENT = '#00B4D8';

// ─── Grade helpers (Form 3/4 scale) ──────────────────────────────────────────
const getGradeFromScore = (score, form = 'Form 3') => {
  if (score >= 85) return { letter: 'A*', points: 1, description: 'Distinction', color: '#1e7e4a', bgColor: '#e8f5e9' };
  if (score >= 75) return { letter: 'A',  points: 2, description: 'Distinction', color: '#2a6e2a', bgColor: '#e8f5e9' };
  if (score >= 65) return { letter: 'B',  points: 3, description: 'Credit',      color: '#2a9090', bgColor: '#e0f2f1' };
  if (score >= 56) return { letter: 'C',  points: 4, description: 'Credit',      color: TEAL_ACCENT, bgColor: '#e0f2f1' };
  if (score >= 50) return { letter: 'D',  points: 5, description: 'Credit',      color: AZURE_ACCENT, bgColor: '#e0f7fa' };
  if (score >= 45) return { letter: 'E',  points: 6, description: 'Pass',        color: AZURE_ACCENT, bgColor: '#e0f7fa' };
  if (score >= 40) return { letter: 'F',  points: 7, description: 'Pass',        color: AZURE_ACCENT, bgColor: '#e0f7fa' };
  if (score >= 35) return { letter: 'G',  points: 8, description: 'Pass',        color: AZURE_ACCENT, bgColor: '#e0f7fa' };
  return            { letter: 'U',  points: 9, description: 'Fail',        color: '#c0392b', bgColor: '#ffebee' };
};

const calculateAverage = (subjects) => {
  if (!subjects?.length) return 0;
  const valid = subjects.filter(s => s?.score != null);
  if (!valid.length) return 0;
  return Math.round(valid.reduce((a, s) => a + s.score, 0) / valid.length);
};

const calculateTotalPoints = (subjects) => {
  return subjects.reduce((sum, s) => sum + (getGradeFromScore(s.score).points || 0), 0);
};

const calculateBestSubjects = (subjects) => {
  const withPoints = subjects.map(s => ({ ...s, points: getGradeFromScore(s.score).points }));
  return [...withPoints].sort((a, b) => a.points - b.points).slice(0, Math.min(6, withPoints.length));
};

const getOverallGradeFromPoints = (pts) => {
  if (pts <= 2)  return { description: 'Distinction' };
  if (pts <= 6)  return { description: 'Credit' };
  if (pts <= 12) return { description: 'Pass' };
  return          { description: 'Fail' };
};

// ─── Small reusable stat card ─────────────────────────────────────────────────
const StatCard = ({ icon, value, label, color = TEAL_ACCENT }) => (
  <div className="bg-white rounded-xl border border-[#e2e8f0] p-4 shadow-sm">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
           style={{ backgroundColor: `${color}18`, color }}>
        {icon}
      </div>
      <div>
        <div className="text-xl font-bold text-[#0A2540]">{value}</div>
        <div className="text-[10px] text-gray-500 font-medium uppercase tracking-wide">{label}</div>
      </div>
    </div>
  </div>
);

// ─── Slide-in panel wrapper ───────────────────────────────────────────────────
const Panel = ({ title, icon, onClose, children }) => (
  <div className="fixed inset-0 z-40 flex justify-end">
    {/* Backdrop */}
    <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" onClick={onClose} />
    {/* Drawer */}
    <div className="relative z-50 w-full max-w-xl h-full bg-[#F5F2EB] shadow-2xl flex flex-col animate-slide-in-right overflow-hidden">
      {/* Panel header */}
      <div className="flex items-center justify-between px-5 py-4 bg-white border-b border-[#e2e8f0] flex-shrink-0">
        <div className="flex items-center gap-2 text-[#003B46]">
          {icon}
          <h2 className="text-base font-bold">{title}</h2>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition"
        >
          <XMarkIcon className="w-5 h-5 text-gray-500" />
        </button>
      </div>
      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-5">
        {children}
      </div>
    </div>
  </div>
);

// ─── Navbar pill button ───────────────────────────────────────────────────────
const NavBtn = ({ icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
      active
        ? 'bg-white/20 text-white'
        : 'text-white/70 hover:text-white hover:bg-white/10'
    }`}
  >
    <span className="w-4 h-4">{icon}</span>
    <span className="hidden sm:inline">{label}</span>
  </button>
);

// ─── Main component ───────────────────────────────────────────────────────────
export default function UpperFormDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Which panel is open: null | 'overview' | 'reports' | 'attendance' | 'leaderboard'
  const [openPanel, setOpenPanel] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Quiz overlay
  const [showQuiz, setShowQuiz] = useState(null);

  // Data
  const [reports, setReports]                     = useState([]);
  const [filteredReports, setFilteredReports]     = useState([]);
  const [latestReport, setLatestReport]           = useState(null);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [leaderboard, setLeaderboard]             = useState([]);
  const [currentUserRank, setCurrentUserRank]     = useState(null);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [stats, setStats] = useState({
    reportsCount: 0,
    attendanceRate: '—',
    averageScore: '—',
    presentCount: 0,
    lateCount: 0,
    absentCount: 0,
    totalDays: 0,
    quizzesCompleted: 0,
  });

  // Filters
  const [availableYears, setAvailableYears]           = useState([]);
  const [availableAssessments, setAvailableAssessments] = useState([]);
  const [selectedYear, setSelectedYear]               = useState(null);
  const [selectedAssessment, setSelectedAssessment]   = useState(null);

  // Report modal (preview)
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedReport, setSelectedReport]   = useState(null);

  // Notifications
  const [notifications, setNotifications]   = useState([]);
  const [unreadCount, setUnreadCount]       = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef(null);

  const togglePanel = (name) => setOpenPanel(p => (p === name ? null : name));

  // ── Notification outside-click ──────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (notificationRef.current && !notificationRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Fetch helpers ───────────────────────────────────────────────────────────
  const fetchNotifications = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await api.get('/api/learner/notifications', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        const notifs = res.data.notifications || [];
        setNotifications(notifs);
        setUnreadCount(notifs.filter(n => !n.is_read).length);
      }
    } catch { /* silent */ }
  }, []);

  const markAsRead = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await api.put(`/api/learner/notifications/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchNotifications();
    } catch { /* silent */ }
  };

  const extractFilters = useCallback((reportsData) => {
    const years = new Set();
    const assessments = new Set();
    reportsData.forEach(r => {
      if (r.academic_year) years.add(r.academic_year);
      else if (r.created_at) years.add(new Date(r.created_at).getFullYear());
      if (r.term) assessments.add(r.term);
    });
    const sortedYears = Array.from(years).sort((a, b) => b - a);
    const sortedAssessments = Array.from(assessments).sort();
    setAvailableYears(sortedYears);
    setAvailableAssessments(sortedAssessments);
    if (sortedYears.length > 0) setSelectedYear(y => y ?? sortedYears[0]);
    if (sortedAssessments.length > 0) setSelectedAssessment(a => a ?? sortedAssessments[0]);
  }, []);

  // Apply year/assessment filters
  useEffect(() => {
    if (!reports.length) return;
    let filtered = [...reports];
    if (selectedYear)       filtered = filtered.filter(r => (r.academic_year || new Date(r.created_at).getFullYear()) === selectedYear);
    if (selectedAssessment) filtered = filtered.filter(r => r.term === selectedAssessment);
    setFilteredReports(filtered);
    if (filtered.length) {
      const sorted = [...filtered].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setLatestReport(sorted[0]);
    } else {
      setLatestReport(null);
    }
  }, [reports, selectedYear, selectedAssessment]);

  const loadData = useCallback(async () => {
    if (!user?.id) return;

    let reportsData = [];
    let attendanceData = { stats: {}, records: [] };
    let quizHistoryData = [];

    try {
      const [reportsRes, attendanceRes, quizRes] = await Promise.allSettled([
        api.get('/api/learner/reports'),
        api.get('/api/learner/attendance'),
        api.get('/api/quiz/history'),
      ]);

      if (reportsRes.status === 'fulfilled') {
        const d = reportsRes.value.data;
        reportsData = Array.isArray(d) ? d : (d?.data || d?.reports || []);
      }
      if (attendanceRes.status === 'fulfilled') {
        const d = attendanceRes.value.data;
        attendanceData = d?.stats && d?.records ? d : (d?.data || { stats: {}, records: Array.isArray(d) ? d : [] });
      }
      if (quizRes.status === 'fulfilled' && quizRes.value.data?.attempts) {
        quizHistoryData = quizRes.value.data.attempts;
      }

      const processedReports = reportsData.map(r => ({
        ...r,
        academic_year: r.academic_year || (r.created_at ? new Date(r.created_at).getFullYear() : new Date().getFullYear()),
        form: r.form || user?.form || 'Form 3',
        subjects: (r.subjects || r.subjects_data || r.subject_scores || []).filter(s => s?.score != null),
      }));
      setReports(processedReports);
      extractFilters(processedReports);

      const processedAttendance = (attendanceData.records || []).map(r => ({
        id: r.id, date: r.date, status: r.status, term: r.term, year: r.year,
      }));
      setAttendanceRecords(processedAttendance);

      const attendanceRate = attendanceData.stats?.rate
        ? `${attendanceData.stats.rate}%`
        : attendanceData.stats?.percentage
        ? `${attendanceData.stats.percentage}%`
        : '—';

      let averageScore = '—';
      const allSubjects = processedReports.flatMap(r => r.subjects.filter(s => s?.score != null));
      if (allSubjects.length) {
        averageScore = `${Math.round(allSubjects.reduce((a, s) => a + s.score, 0) / allSubjects.length)}%`;
      }

      setStats({
        reportsCount: processedReports.length,
        attendanceRate,
        averageScore,
        totalDays:     attendanceData.stats?.total    || 0,
        presentCount:  attendanceData.stats?.present  || 0,
        lateCount:     attendanceData.stats?.late     || 0,
        absentCount:   attendanceData.stats?.absent   || 0,
        quizzesCompleted: quizHistoryData.length,
      });
    } catch (err) {
      console.error('UpperFormDashboard load error:', err);
    }
  }, [user, extractFilters]);

  const loadLeaderboard = useCallback(async () => {
    if (!user?.id) return;
    setLeaderboardLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await api.get('/api/learner/leaderboard', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        setLeaderboard(res.data.leaderboard || []);
        setCurrentUserRank(res.data.current_user_rank);
      }
    } catch { toast.error('Failed to load leaderboard'); }
    finally { setLeaderboardLoading(false); }
  }, [user]);

  // Initial load
  useEffect(() => {
    loadData();
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [loadData, fetchNotifications]);

  // Load leaderboard when that panel opens
  useEffect(() => {
    if (openPanel === 'leaderboard' && !leaderboard.length) {
      loadLeaderboard();
    }
  }, [openPanel, leaderboard.length, loadLeaderboard]);

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const getUserName = () => user?.name || user?.email?.split('@')[0] || 'Student';

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
    toast.success('Logged out');
  };

  const handleQuizComplete = (result) => {
    setShowQuiz(null);
    toast.success(`Quiz submitted! Score: ${Math.round(result.percentage)}%`);
    loadData();
  };

  // ── PDF: Report ──────────────────────────────────────────────────────────────
  const downloadReportPDF = async (report) => {
    if (!report) return;
    // Load school logo
    let logoDataUrl = null;
    try {
      const res = await fetch('/schoologo.png');
      const blob = await res.blob();
      logoDataUrl = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });
    } catch { /* continue without logo */ }
    try {
      const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
      const pw = doc.internal.pageSize.getWidth();
      const ph = doc.internal.pageSize.getHeight();
      const validSubjects = (report.subjects || []).filter(s => s?.score != null);
      const totalPoints   = calculateTotalPoints(validSubjects);
      const bestSubjects  = calculateBestSubjects(validSubjects);
      const avgScore      = calculateAverage(validSubjects);
      const avgGrade      = getGradeFromScore(avgScore);
      const darkBlue = [10, 37, 64], teal = [42, 157, 143], lightGray = [248, 250, 252], darkGray = [15, 25, 35];

      doc.setFillColor(...darkBlue); doc.rect(0, 0, pw, 50, 'F');
      doc.setFillColor(...teal);     doc.rect(0, 48, pw, 2, 'F');
      // Logo
      if (logoDataUrl) {
        try { doc.addImage(logoDataUrl, 'PNG', 8, 5, 38, 38); } catch { /* skip */ }
      }
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(15); doc.setFont('helvetica', 'bold');
      doc.text('PROGRESS SECONDARY SCHOOL', pw / 2 + (logoDataUrl ? 8 : 0), 20, { align: 'center' });
      doc.setFontSize(9); doc.setFont('helvetica', 'italic');
      doc.setTextColor(220, 220, 220);
      doc.text('Academic Report Card — ' + (report.form || user?.form || 'Form 3'), pw / 2 + (logoDataUrl ? 8 : 0), 30, { align: 'center' });

      let y = 60;
      doc.setFillColor(...lightGray); doc.roundedRect(15, y, pw - 30, 28, 3, 3, 'F');
      doc.setDrawColor(...teal);      doc.roundedRect(15, y, pw - 30, 28, 3, 3, 'S');
      doc.setTextColor(...darkGray);  doc.setFontSize(8); doc.setFont('helvetica', 'bold');
      doc.text(`Name: ${user?.name || 'N/A'}`, 20, y + 8);
      doc.text(`Registration: ${user?.reg_number || 'N/A'}`, 20, y + 15);
      doc.text(`Form: ${report?.form || user?.form || 'N/A'}`, 20, y + 22);
      doc.text(`Term: ${report?.term || 'N/A'}  Year: ${report?.academic_year || new Date().getFullYear()}`, pw - 70, y + 15);
      y += 35;

      const cw = (pw - 45) / 3;
      [{ label: 'Average', value: `${avgScore}%` }, { label: 'Grade', value: avgGrade.letter }, { label: 'Points', value: `${totalPoints} pts` }].forEach((c, i) => {
        const x = 15 + i * (cw + 7);
        doc.setFillColor(...lightGray); doc.roundedRect(x, y, cw, 30, 3, 3, 'F');
        doc.setDrawColor(...teal);      doc.roundedRect(x, y, cw, 30, 3, 3, 'S');
        doc.setTextColor(...darkGray);  doc.setFontSize(7); doc.setFont('helvetica', 'bold');
        doc.text(c.label, x + 5, y + 8);
        doc.setFontSize(16); doc.setTextColor(...teal);
        doc.text(c.value, x + 5, y + 24);
      });
      y += 40;

      const tableRows = bestSubjects.map(s => {
        const g = getGradeFromScore(s.score);
        return [s.name, `${s.score}%`, `${g.points} pts`, g.letter];
      });
      tableRows.push([
        { content: 'BEST 6 TOTAL', styles: { fontStyle: 'bold', fillColor: [255, 248, 225] } },
        '',
        { content: `${totalPoints} pts`, styles: { fontStyle: 'bold', textColor: teal } },
        { content: getOverallGradeFromPoints(totalPoints).description, styles: { fontStyle: 'bold', textColor: teal } },
      ]);

      autoTable(doc, {
        startY: y, margin: { left: 15, right: 15 },
        head: [['Subject', 'Score', 'Points', 'Grade']],
        body: tableRows,
        theme: 'grid',
        headStyles: { fillColor: darkBlue, textColor: 255, fontStyle: 'bold', halign: 'center', fontSize: 8, cellPadding: 3 },
        bodyStyles: { textColor: darkGray, fontSize: 7, cellPadding: 2.5 },
        alternateRowStyles: { fillColor: lightGray },
        columnStyles: { 0: { cellWidth: 70, fontStyle: 'bold' }, 1: { halign: 'center', cellWidth: 30 }, 2: { halign: 'center', cellWidth: 30 }, 3: { halign: 'center' } },
      });

      doc.setFontSize(6); doc.setTextColor(150, 150, 150);
      doc.text(`Generated: ${new Date().toLocaleString()}`, pw / 2, ph - 5, { align: 'center' });
      doc.save(`${user?.name?.replace(/\s+/g, '_') || 'student'}_${report?.term || 'report'}.pdf`);
      toast.success('Report downloaded!');
    } catch (e) {
      console.error(e); toast.error('Failed to generate PDF');
    }
  };

  // ── PDF: Attendance ─────────────────────────────────────────────────────────
  const downloadAttendancePDF = () => {
    if (!attendanceRecords.length) { toast.error('No attendance records'); return; }
    try {
      const doc = new jsPDF();
      const pw = doc.internal.pageSize.getWidth();
      const darkBlue = [10, 37, 64], teal = [42, 157, 143], lightGray = [248, 250, 252];
      doc.setFillColor(...darkBlue); doc.rect(0, 0, pw, 50, 'F');
      doc.setTextColor(255, 255, 255); doc.setFontSize(20); doc.setFont('helvetica', 'bold');
      doc.text('PROGRESS SECONDARY SCHOOL', pw / 2, 25, { align: 'center' });
      doc.setFontSize(11); doc.setFont('helvetica', 'normal'); doc.setTextColor(200, 200, 200);
      doc.text('Attendance Record', pw / 2, 38, { align: 'center' });
      let y = 65;
      doc.setFillColor(...lightGray); doc.roundedRect(20, y, pw - 40, 35, 3, 3, 'F');
      doc.setDrawColor(...teal);      doc.roundedRect(20, y, pw - 40, 35, 3, 3, 'S');
      doc.setTextColor(15, 25, 35);   doc.setFontSize(10); doc.setFont('helvetica', 'bold');
      doc.text(`Name: ${user?.name || 'N/A'}`, 25, y + 10);
      doc.text(`Registration: ${user?.reg_number || 'N/A'}`, 25, y + 18);
      doc.text(`Form: ${user?.form || 'N/A'}`, pw - 75, y + 10);
      doc.text(`Date: ${new Date().toLocaleDateString()}`, pw - 75, y + 18);
      y += 45;
      autoTable(doc, {
        startY: y, margin: { left: 20, right: 20 },
        head: [['Date', 'Day', 'Status']],
        body: attendanceRecords.map(r => [
          new Date(r.date).toLocaleDateString('en', { year: 'numeric', month: 'short', day: 'numeric' }),
          new Date(r.date).toLocaleDateString('en', { weekday: 'long' }),
          r.status === 'present' ? 'Present' : r.status === 'late' ? 'Late' : 'Absent',
        ]),
        theme: 'grid',
        headStyles: { fillColor: darkBlue, textColor: 255, fontStyle: 'bold', halign: 'center' },
        alternateRowStyles: { fillColor: lightGray },
      });
      doc.save(`${user?.name?.replace(/\s+/g, '_') || 'student'}_Attendance.pdf`);
      toast.success('Attendance downloaded!');
    } catch (e) { console.error(e); toast.error('Failed to generate PDF'); }
  };

  // ── Quiz overlay ─────────────────────────────────────────────────────────────
  if (showQuiz) {
    return (
      <div className="min-h-screen bg-[#F5F2EB]">
        <div className="container mx-auto px-4 py-6">
          <button
            onClick={() => setShowQuiz(null)}
            className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition text-sm"
          >
            ← Back to Dashboard
          </button>
          <QuizTaking quizId={showQuiz} onComplete={handleQuizComplete} />
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PANEL CONTENTS
  // ─────────────────────────────────────────────────────────────────────────────

  const OverviewPanelContent = () => (
    <div className="space-y-5">
      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard icon={<DocumentTextIcon className="w-5 h-5" />} value={stats.reportsCount}      label="Reports"    color={TEAL_ACCENT} />
        <StatCard icon={<CalendarIcon    className="w-5 h-5" />} value={stats.attendanceRate}  label="Attendance" color={AZURE_ACCENT} />
        <StatCard icon={<ChartBarIcon    className="w-5 h-5" />} value={stats.averageScore}    label="Average"    color={TEAL_ACCENT} />
        <StatCard icon={<BookOpenIcon    className="w-5 h-5" />} value={stats.quizzesCompleted} label="Quizzes"   color="#6C63FF" />
      </div>

      {/* Latest report preview */}
      {latestReport && (
        <div className="bg-white rounded-xl border border-[#e2e8f0] overflow-hidden shadow-sm">
          <div className="px-4 py-3 border-b border-[#e2e8f0] flex items-center justify-between">
            <h3 className="font-semibold text-[#0A2540] flex items-center gap-2">
              <DocumentTextIcon className="w-4 h-4 text-[#2A9D8F]" /> Current Report
            </h3>
            <button onClick={() => downloadReportPDF(latestReport)} className="p-1.5 text-[#2A9D8F] hover:bg-[#2A9D8F]/10 rounded-lg transition">
              <ArrowDownTrayIcon className="w-4 h-4" />
            </button>
          </div>
          <div className="p-4 space-y-2">
            {(latestReport.subjects || []).slice(0, 6).map((s, i) => {
              const g = getGradeFromScore(s.score);
              return (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-xs text-gray-600 w-28 truncate">{s.name}</span>
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${s.score}%`, backgroundColor: g.color }} />
                  </div>
                  <span className="text-xs font-bold font-mono w-10 text-right" style={{ color: g.color }}>
                    {s.score}% {g.letter}
                  </span>
                </div>
              );
            })}
            <button
              onClick={() => { setOpenPanel(null); setTimeout(() => setOpenPanel('reports'), 50); }}
              className="mt-2 w-full py-1.5 text-xs text-[#2A9D8F] font-medium bg-[#2A9D8F]/5 hover:bg-[#2A9D8F]/10 rounded-lg border border-[#2A9D8F]/20 transition"
            >
              View All Reports →
            </button>
          </div>
        </div>
      )}

      {/* Attendance summary */}
      <div className="bg-white rounded-xl border border-[#e2e8f0] overflow-hidden shadow-sm">
        <div className="px-4 py-3 border-b border-[#e2e8f0] flex items-center justify-between">
          <h3 className="font-semibold text-[#0A2540] flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-[#2A9D8F]" /> Attendance
          </h3>
          {attendanceRecords.length > 0 && (
            <button onClick={downloadAttendancePDF} className="p-1.5 text-[#2A9D8F] hover:bg-[#2A9D8F]/10 rounded-lg transition">
              <ArrowDownTrayIcon className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="p-4">
          <div className="text-center mb-3">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full border-4 border-[#2A9D8F]/20">
              <span className="text-xl font-bold text-[#2A9D8F]">{stats.attendanceRate}</span>
            </div>
          </div>
          {stats.totalDays > 0 ? (
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center p-2 bg-green-50 rounded-lg border border-green-100">
                <div className="font-bold text-green-600">{stats.presentCount}</div>
                <div className="text-[10px] text-gray-500">Present</div>
              </div>
              <div className="text-center p-2 bg-yellow-50 rounded-lg border border-yellow-100">
                <div className="font-bold text-yellow-600">{stats.lateCount}</div>
                <div className="text-[10px] text-gray-500">Late</div>
              </div>
              <div className="text-center p-2 bg-red-50 rounded-lg border border-red-100">
                <div className="font-bold text-red-500">{stats.absentCount}</div>
                <div className="text-[10px] text-gray-500">Absent</div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-gray-400 text-center">No attendance records yet</p>
          )}
        </div>
      </div>
    </div>
  );

  const ReportsPanelContent = () => (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {availableYears.length > 0 && (
          <select
            value={selectedYear || ''}
            onChange={e => setSelectedYear(e.target.value ? parseInt(e.target.value) : null)}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs bg-white focus:ring-1 focus:ring-[#2A9D8F] focus:border-transparent"
          >
            <option value="">All Years</option>
            {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        )}
        {availableAssessments.length > 0 && (
          <select
            value={selectedAssessment || ''}
            onChange={e => setSelectedAssessment(e.target.value || null)}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs bg-white focus:ring-1 focus:ring-[#2A9D8F] focus:border-transparent"
          >
            <option value="">All Terms</option>
            {availableAssessments.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        )}
      </div>

      {/* Report cards */}
      {filteredReports.length === 0 ? (
        <div className="text-center py-10 bg-white rounded-xl border border-[#e2e8f0]">
          <DocumentTextIcon className="w-10 h-10 text-gray-200 mx-auto mb-2" />
          <p className="text-sm text-gray-400">No reports available</p>
        </div>
      ) : (
        filteredReports.map(report => {
          const valid = (report.subjects || []).filter(s => s?.score != null);
          const avg   = calculateAverage(valid);
          const grade = getGradeFromScore(avg);
          const pts   = calculateTotalPoints(valid);
          return (
            <div key={report.id} className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-[#e2e8f0] flex justify-between items-center">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-[#0A2540] text-sm">{report.term || 'Report'}</span>
                  <span className="px-2 py-0.5 bg-[#2A9D8F]/10 text-[#2A9D8F] text-[10px] rounded-full">{report.form || user?.form}</span>
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-[10px] rounded-full">{report.academic_year}</span>
                </div>
                <span className="text-xs font-bold" style={{ color: grade.color }}>{avg}% ({grade.letter})</span>
              </div>
              <div className="p-4">
                <div className="space-y-1.5 mb-3">
                  {valid.slice(0, 5).map((s, i) => {
                    const g = getGradeFromScore(s.score);
                    return (
                      <div key={i} className="flex justify-between text-xs">
                        <span className="text-gray-600 truncate w-32">{s.name}</span>
                        <span className="font-mono font-semibold" style={{ color: g.color }}>{s.score}% ({g.letter})</span>
                      </div>
                    );
                  })}
                  {valid.length > 5 && <p className="text-[10px] text-gray-400 text-center">+{valid.length - 5} more</p>}
                </div>
                {/* Points summary */}
                <div className="flex items-center justify-between px-3 py-2 bg-[#F5F2EB] rounded-lg border border-[#e2e8f0] mb-3">
                  <span className="text-xs font-medium text-gray-500">Best 6 Points</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[#003B46]">{calculateTotalPoints(calculateBestSubjects(valid))} pts</span>
                    <span className="px-2 py-0.5 bg-[#2A9D8F]/10 text-[#2A9D8F] text-[10px] rounded-full font-semibold">
                      {getOverallGradeFromPoints(calculateTotalPoints(calculateBestSubjects(valid))).description}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => downloadReportPDF(report)}
                  className="w-full py-1.5 bg-[#003B46] text-white rounded-lg text-xs font-medium hover:bg-[#005060] transition flex items-center justify-center gap-1.5"
                >
                  <ArrowDownTrayIcon className="w-3.5 h-3.5" /> Download PDF
                </button>
              </div>
            </div>
          );
        })
      )}
    </div>
  );

  const AttendancePanelContent = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-xs text-gray-500">Your daily attendance history</p>
        {attendanceRecords.length > 0 && (
          <button
            onClick={downloadAttendancePDF}
            className="px-3 py-1.5 bg-[#2A9D8F] text-white rounded-lg text-xs font-medium hover:bg-[#1e7e6e] transition flex items-center gap-1.5"
          >
            <ArrowDownTrayIcon className="w-3.5 h-3.5" /> PDF
          </button>
        )}
      </div>
      <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[280px]">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-400 uppercase">Date</th>
                <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-400 uppercase hidden sm:table-cell">Day</th>
                <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-400 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {attendanceRecords.length === 0 ? (
                <tr>
                  <td colSpan="3" className="px-4 py-6 text-center text-sm text-gray-400">No attendance records yet</td>
                </tr>
              ) : (
                [...attendanceRecords]
                  .sort((a, b) => new Date(b.date) - new Date(a.date))
                  .slice(0, 20)
                  .map(record => (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2.5 text-xs">
                        {new Date(record.date).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-2.5 text-xs hidden sm:table-cell">
                        {new Date(record.date).toLocaleDateString('en', { weekday: 'short' })}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          record.status === 'present' ? 'bg-green-100 text-green-700' :
                          record.status === 'late'    ? 'bg-yellow-100 text-yellow-700' :
                                                        'bg-red-100 text-red-700'
                        }`}>
                          {record.status === 'present' ? 'Present' : record.status === 'late' ? 'Late' : 'Absent'}
                        </span>
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const LeaderboardPanelContent = () => (
    <div className="space-y-4">
      {leaderboardLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2A9D8F]" />
        </div>
      ) : leaderboard.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-[#e2e8f0]">
          <TrophyIcon className="w-10 h-10 text-gray-200 mx-auto mb-2" />
          <p className="text-sm text-gray-400">No leaderboard data yet</p>
        </div>
      ) : (
        <>
          {currentUserRank && (
            <div className="bg-gradient-to-r from-[#2A9D8F] to-[#1e6b60] text-white rounded-xl p-4 shadow-lg flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold opacity-80 mb-0.5">Your Rank</p>
                <div className="flex items-end gap-1.5">
                  <span className="text-3xl font-black">#{currentUserRank}</span>
                  <span className="text-xs opacity-80 mb-1">of {leaderboard.length}</span>
                </div>
              </div>
              <TrophyIcon className="w-10 h-10 opacity-60" />
            </div>
          )}
          <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[400px]">
                <thead className="bg-gray-50">
                  <tr>
                    {['#', 'Student', 'Quiz', 'Report', 'Overall'].map(h => (
                      <th key={h} className="px-3 py-2.5 text-left text-[10px] font-semibold text-gray-400 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {leaderboard.map(s => (
                    <tr
                      key={s.id}
                      className={`hover:bg-gray-50 ${s.id === user?.id ? 'bg-[#2A9D8F]/5 border-l-4 border-l-[#2A9D8F]' : ''}`}
                    >
                      <td className="px-3 py-2.5 text-xs font-bold text-gray-500">#{s.rank}</td>
                      <td className="px-3 py-2.5">
                        <p className="text-xs font-medium text-gray-900 leading-none">{s.name}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{s.reg_number}</p>
                      </td>
                      <td className="px-3 py-2.5 text-xs font-semibold">{s.quiz_score}%</td>
                      <td className="px-3 py-2.5 text-xs font-semibold">{s.report_score}%</td>
                      <td className="px-3 py-2.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          s.overall_score >= 80 ? 'bg-green-100 text-green-700' :
                          s.overall_score >= 60 ? 'bg-blue-100 text-blue-700'  :
                          s.overall_score >= 40 ? 'bg-yellow-100 text-yellow-700' :
                                                  'bg-red-100 text-red-700'
                        }`}>
                          {s.overall_score}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F5F2EB] flex flex-col">

      {/* ── HEADER ── */}
      <div className="w-full sticky top-0 z-30 flex-shrink-0" style={{ backgroundColor: HEADER_BG }}>
        <div className="container mx-auto px-4 py-3">
          <div className="relative flex min-h-[64px] items-center justify-between">
            {/* Logo */}
            <div className="flex items-center">
              <img
                src="/schoologo.png"
                alt="Progress Secondary School logo"
                className="w-16 h-16 object-contain rounded-xl bg-white p-1 shadow-md"
              />
            </div>
            <div className="absolute left-1/2 -translate-x-1/2 text-center">
              <h1 className="text-base font-bold text-white tracking-wide leading-none">PROGRESS</h1>
              <p className="text-[10px] text-white/60">{user?.form || 'Upper Form'} — Secondary School</p>
            </div>

            {/* Right: user pill + bell + logout */}
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-2 bg-white/10 rounded-lg px-3 py-1.5">
                <div className="w-7 h-7 bg-[#2A9D8F] rounded-full flex items-center justify-center">
                  <UserCircleIcon className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-white truncate max-w-[110px]">{getUserName()}</div>
                  <div className="text-[9px] text-white/60">{user?.form || 'Student'}</div>
                </div>
              </div>

              {/* Notification bell */}
              <div className="relative" ref={notificationRef}>
                <button
                  onClick={() => setShowNotifications(n => !n)}
                  className="relative w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center hover:bg-white/20 transition"
                >
                  <BellIcon className="w-4 h-4 text-white" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] rounded-full flex items-center justify-center font-bold">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden">
                    <div className="px-4 py-2.5 border-b border-gray-100 font-semibold text-sm text-gray-700">Notifications</div>
                    <div className="max-h-72 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="px-4 py-6 text-center text-sm text-gray-400">No notifications</div>
                      ) : notifications.map(n => (
                        <div
                          key={n.id}
                          onClick={() => { markAsRead(n.id); setShowNotifications(false); }}
                          className={`px-4 py-3 border-b border-gray-50 cursor-pointer hover:bg-gray-50 ${!n.is_read ? 'bg-teal-50' : ''}`}
                        >
                          <p className="text-xs font-medium text-gray-800">{n.title}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">{n.message}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile menu toggle */}
              <button
                onClick={() => setMobileMenuOpen(o => !o)}
                className="lg:hidden w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center hover:bg-white/20 transition"
              >
                {mobileMenuOpen ? <XMarkIcon className="w-5 h-5 text-white" /> : <Bars3Icon className="w-5 h-5 text-white" />}
              </button>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-xs font-medium flex items-center gap-1"
              >
                <ArrowRightOnRectangleIcon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>

          {/* Greeting */}
          <div className="mt-1.5">
            <p className="text-[10px] font-extrabold tracking-wider" style={{ color: AZURE_ACCENT }}>LEARNER PORTAL</p>
            <h2 className="text-lg font-bold text-white leading-tight">{getGreeting()}, {getUserName()}</h2>
          </div>
        </div>

        {/* ── NAVBAR (desktop) ── */}
        <div className="hidden lg:block border-t border-white/10" style={{ backgroundColor: NAVBAR_BG }}>
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-1 py-2">
              {/* Section panel buttons */}
              <NavBtn
                icon={<HomeIcon className="w-4 h-4" />}
                label="Overview"
                active={openPanel === 'overview'}
                onClick={() => togglePanel('overview')}
              />
              <NavBtn
                icon={<DocumentTextIcon className="w-4 h-4" />}
                label="Reports"
                active={openPanel === 'reports'}
                onClick={() => togglePanel('reports')}
              />
              <NavBtn
                icon={<CalendarIcon className="w-4 h-4" />}
                label="Attendance"
                active={openPanel === 'attendance'}
                onClick={() => togglePanel('attendance')}
              />
              <NavBtn
                icon={<TrophyIcon className="w-4 h-4" />}
                label="Leaderboard"
                active={openPanel === 'leaderboard'}
                onClick={() => togglePanel('leaderboard')}
              />

              {/* Spacer */}
              <div className="flex-1" />

              {/* Form badge */}
              <span className="px-3 py-1 bg-white/10 rounded-lg text-white/80 text-xs font-semibold">
                {user?.form || 'Upper Form'} — Senior Programme
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── MOBILE DRAWER ── */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
          <div className="absolute top-0 right-0 h-full w-60 bg-white shadow-xl flex flex-col">
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <img
                  src="/schoologo.png"
                  alt="Progress Secondary School logo"
                  className="w-10 h-10 object-contain rounded-xl bg-white p-1"
                />
                <div>
                  <p className="font-bold text-[#003B46] text-sm">PROGRESS</p>
                  <p className="text-[10px] text-gray-400">{user?.form || 'Upper Form'}</p>
                </div>
              </div>
            </div>
            <div className="p-3 space-y-1 flex-1">
              {[
                { id: 'overview',     icon: <HomeIcon         className="w-4 h-4" />, label: 'Overview'    },
                { id: 'reports',      icon: <DocumentTextIcon className="w-4 h-4" />, label: 'Reports'     },
                { id: 'attendance',   icon: <CalendarIcon     className="w-4 h-4" />, label: 'Attendance'  },
                { id: 'leaderboard',  icon: <TrophyIcon       className="w-4 h-4" />, label: 'Leaderboard' },
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => { setOpenPanel(p => p === item.id ? null : item.id); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition text-sm ${
                    openPanel === item.id ? 'bg-[#006770] text-white' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {item.icon}
                  <span className="font-medium">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── LEARNING SPACE (full-height main content) ── */}
      <main className="flex-1 container mx-auto px-4 py-4 max-w-7xl">
        <LearningSpace onStartQuiz={(quizId) => setShowQuiz(quizId)} />
      </main>

      {/* ── SLIDE-IN PANELS ── */}
      {openPanel === 'overview' && (
        <Panel
          title="Overview"
          icon={<HomeIcon className="w-5 h-5 text-[#2A9D8F]" />}
          onClose={() => setOpenPanel(null)}
        >
          <OverviewPanelContent />
        </Panel>
      )}

      {openPanel === 'reports' && (
        <Panel
          title="Report Cards"
          icon={<DocumentTextIcon className="w-5 h-5 text-[#2A9D8F]" />}
          onClose={() => setOpenPanel(null)}
        >
          <ReportsPanelContent />
        </Panel>
      )}

      {openPanel === 'attendance' && (
        <Panel
          title="Attendance"
          icon={<CalendarIcon className="w-5 h-5 text-[#2A9D8F]" />}
          onClose={() => setOpenPanel(null)}
        >
          <AttendancePanelContent />
        </Panel>
      )}

      {openPanel === 'leaderboard' && (
        <Panel
          title="Class Leaderboard"
          icon={<TrophyIcon className="w-5 h-5 text-[#2A9D8F]" />}
          onClose={() => setOpenPanel(null)}
        >
          <LeaderboardPanelContent />
        </Panel>
      )}
    </div>
  );
}
