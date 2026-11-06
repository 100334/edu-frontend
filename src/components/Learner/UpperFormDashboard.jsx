import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import LearningSpace from './LearningSpace';
import Library from '../Library';
import QuizTaking from './QuizTaking';
import {
  DocumentTextIcon,
  CalendarIcon,
  ArrowDownTrayIcon,
  TrophyIcon,
  BookOpenIcon,
  BellIcon,
  ChartBarIcon,
  HomeIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  XMarkIcon,
  Bars3Icon,
  AcademicCapIcon,
  RectangleStackIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ─── Theme (matches PrimaryLearnerDashboard) ──────────────────────────────────
const HEADER_BG    = '#00676B';
const NAVBAR_BG    = '#005C62';
const TEAL_ACCENT  = '#00777A';
const GOLD_ACCENT  = '#F3C34A';
const PAGE_BG      = '#F2FBFC';

// ─── Grade helpers ────────────────────────────────────────────────────────────
const getGradeFromScore = (score) => {
  if (score >= 85) return { letter: 'A*', points: 1, description: 'Distinction', color: '#1e7e4a', bgColor: '#e8f5e9' };
  if (score >= 75) return { letter: 'A',  points: 2, description: 'Distinction', color: '#2a6e2a', bgColor: '#e8f5e9' };
  if (score >= 65) return { letter: 'B',  points: 3, description: 'Credit',      color: '#2a9090', bgColor: '#e0f2f1' };
  if (score >= 56) return { letter: 'C',  points: 4, description: 'Credit',      color: TEAL_ACCENT, bgColor: '#e0f2f1' };
  if (score >= 50) return { letter: 'D',  points: 5, description: 'Credit',      color: '#0097A7', bgColor: '#e0f7fa' };
  if (score >= 45) return { letter: 'E',  points: 6, description: 'Pass',        color: '#0097A7', bgColor: '#e0f7fa' };
  if (score >= 40) return { letter: 'F',  points: 7, description: 'Pass',        color: '#0097A7', bgColor: '#e0f7fa' };
  if (score >= 35) return { letter: 'G',  points: 8, description: 'Pass',        color: '#0097A7', bgColor: '#e0f7fa' };
  return            { letter: 'U',  points: 9, description: 'Fail',        color: '#c0392b', bgColor: '#ffebee' };
};

const calculateAverage = (subjects) => {
  if (!subjects?.length) return 0;
  const valid = subjects.filter(s => s?.score != null);
  if (!valid.length) return 0;
  return Math.round(valid.reduce((a, s) => a + s.score, 0) / valid.length);
};
const calculateTotalPoints = (subjects) =>
  subjects.reduce((sum, s) => sum + (getGradeFromScore(s.score).points || 0), 0);
const calculateBestSubjects = (subjects) => {
  const w = subjects.map(s => ({ ...s, points: getGradeFromScore(s.score).points }));
  return [...w].sort((a, b) => a.points - b.points).slice(0, Math.min(6, w.length));
};
const getOverallGradeFromPoints = (pts) => {
  if (pts <= 2)  return { description: 'Distinction' };
  if (pts <= 6)  return { description: 'Credit' };
  if (pts <= 12) return { description: 'Pass' };
  return          { description: 'Fail' };
};

// ─── Slide-in panel (kept for potential future use, themed) ──────────────────
const Panel = ({ title, icon, onClose, children }) => (
  <div className="fixed inset-0 z-40 flex justify-end">
    <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" onClick={onClose} />
    <div className="relative z-50 w-full max-w-lg h-full bg-[#F2FBFC] shadow-2xl flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 bg-[#00676B] flex-shrink-0">
        <div className="flex items-center gap-2 text-white">
          {icon}
          <h2 className="text-sm font-bold">{title}</h2>
        </div>
        <button onClick={onClose} className="w-7 h-7 rounded-lg bg-white/10 hover:bg-red-500 flex items-center justify-center transition">
          <XMarkIcon className="w-4 h-4 text-white" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-5">{children}</div>
    </div>
  </div>
);

// ─── Quick-action card ────────────────────────────────────────────────────────
const QuickCard = ({ emoji, label, sub, onClick, accent = '#00777A' }) => (
  <button
    onClick={onClick}
    className="flex items-center gap-3 px-4 py-3 bg-white rounded-xl border border-[#D3EEEE] shadow-sm hover:shadow-md hover:border-[#12BFC0]/40 transition-all text-left w-full active:scale-[0.98]"
  >
    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-xl"
      style={{ backgroundColor: `${accent}18` }}>
      {emoji}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-bold text-[#00565B]">{label}</p>
      {sub && <p className="text-[10px] text-slate-400 mt-0.5 truncate">{sub}</p>}
    </div>
    <span className="text-slate-300 text-sm flex-shrink-0">›</span>
  </button>
);

// ─── Main component ───────────────────────────────────────────────────────────
export default function UpperFormDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [openPanel,      setOpenPanel]      = useState(null);
  const [mainView,       setMainView]       = useState('learning'); // 'learning' | 'library'
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showQuiz,       setShowQuiz]       = useState(null);

  // Data
  const [reports,          setReports]          = useState([]);
  const [filteredReports,  setFilteredReports]  = useState([]);
  const [latestReport,     setLatestReport]     = useState(null);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [leaderboard,      setLeaderboard]      = useState([]);
  const [currentUserRank,  setCurrentUserRank]  = useState(null);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [stats, setStats] = useState({
    reportsCount: 0, attendanceRate: '—', averageScore: '—',
    presentCount: 0, lateCount: 0, absentCount: 0, totalDays: 0, quizzesCompleted: 0,
  });

  const [availableYears,       setAvailableYears]       = useState([]);
  const [availableAssessments, setAvailableAssessments] = useState([]);
  const [selectedYear,         setSelectedYear]         = useState(null);
  const [selectedAssessment,   setSelectedAssessment]   = useState(null);

  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedReport,  setSelectedReport]  = useState(null);

  const [notifications,      setNotifications]      = useState([]);
  const [unreadCount,        setUnreadCount]        = useState(0);
  const [showNotifications,  setShowNotifications]  = useState(false);
  const notificationRef = useRef(null);

  const togglePanel = (name) => setOpenPanel(p => (p === name ? null : name));

  // ── Outside-click for notification bell ──────────────────────────────────
  useEffect(() => {
    const h = (e) => {
      if (notificationRef.current && !notificationRef.current.contains(e.target))
        setShowNotifications(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  // ── Notifications ─────────────────────────────────────────────────────────
  const fetchNotifications = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await api.get('/api/learner/notifications', { headers: { Authorization: `Bearer ${token}` } });
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
      await api.put(`/api/learner/notifications/${id}/read`, {}, { headers: { Authorization: `Bearer ${token}` } });
      fetchNotifications();
    } catch { /* silent */ }
  };

  // ── Filters ───────────────────────────────────────────────────────────────
  const extractFilters = useCallback((data) => {
    const years = new Set(), assessments = new Set();
    data.forEach(r => {
      if (r.academic_year) years.add(r.academic_year);
      else if (r.created_at) years.add(new Date(r.created_at).getFullYear());
      if (r.term) assessments.add(r.term);
    });
    const sy = Array.from(years).sort((a, b) => b - a);
    const sa = Array.from(assessments).sort();
    setAvailableYears(sy);
    setAvailableAssessments(sa);
    if (sy.length) setSelectedYear(y => y ?? sy[0]);
    if (sa.length) setSelectedAssessment(a => a ?? sa[0]);
  }, []);

  useEffect(() => {
    if (!reports.length) return;
    let f = [...reports];
    if (selectedYear)       f = f.filter(r => (r.academic_year || new Date(r.created_at).getFullYear()) === selectedYear);
    if (selectedAssessment) f = f.filter(r => r.term === selectedAssessment);
    setFilteredReports(f);
    if (f.length) {
      const sorted = [...f].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setLatestReport(sorted[0]);
    } else setLatestReport(null);
  }, [reports, selectedYear, selectedAssessment]);

  // ── Data load ─────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    if (!user?.id) return;
    try {
      const [rr, ar, qr] = await Promise.allSettled([
        api.get('/api/learner/reports'),
        api.get('/api/learner/attendance'),
        api.get('/api/quiz/history'),
      ]);

      let reportsData = [];
      let attendanceData = { stats: {}, records: [] };
      let quizData = [];

      if (rr.status === 'fulfilled') {
        const d = rr.value.data;
        reportsData = Array.isArray(d) ? d : (d?.data || d?.reports || []);
      }
      if (ar.status === 'fulfilled') {
        const d = ar.value.data;
        attendanceData = d?.stats && d?.records ? d : (d?.data || { stats: {}, records: Array.isArray(d) ? d : [] });
      }
      if (qr.status === 'fulfilled' && qr.value.data?.attempts) quizData = qr.value.data.attempts;

      const processedReports = reportsData.map(r => ({
        ...r,
        academic_year: r.academic_year || (r.created_at ? new Date(r.created_at).getFullYear() : new Date().getFullYear()),
        form: r.form || user?.form || 'Form 3',
        subjects: (r.subjects || r.subjects_data || r.subject_scores || []).filter(s => s?.score != null),
      }));
      setReports(processedReports);
      extractFilters(processedReports);

      setAttendanceRecords((attendanceData.records || []).map(r => ({
        id: r.id, date: r.date, status: r.status, term: r.term, year: r.year,
      })));

      const attendanceRate = attendanceData.stats?.rate
        ? `${attendanceData.stats.rate}%`
        : attendanceData.stats?.percentage
        ? `${attendanceData.stats.percentage}%`
        : '—';

      const allSubjects = processedReports.flatMap(r => r.subjects.filter(s => s?.score != null));
      const averageScore = allSubjects.length
        ? `${Math.round(allSubjects.reduce((a, s) => a + s.score, 0) / allSubjects.length)}%`
        : '—';

      setStats({
        reportsCount:     processedReports.length,
        attendanceRate,
        averageScore,
        totalDays:        attendanceData.stats?.total   || 0,
        presentCount:     attendanceData.stats?.present || 0,
        lateCount:        attendanceData.stats?.late    || 0,
        absentCount:      attendanceData.stats?.absent  || 0,
        quizzesCompleted: quizData.length,
      });
    } catch { /* silent */ }
  }, [user, extractFilters]);

  const loadLeaderboard = useCallback(async () => {
    if (!user?.id) return;
    setLeaderboardLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await api.get('/api/learner/leaderboard', { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.success) {
        setLeaderboard(res.data.leaderboard || []);
        setCurrentUserRank(res.data.current_user_rank);
      }
    } catch { toast.error('Failed to load leaderboard'); }
    finally { setLeaderboardLoading(false); }
  }, [user]);

  useEffect(() => {
    loadData();
    fetchNotifications();
    const iv = setInterval(fetchNotifications, 30000);
    return () => clearInterval(iv);
  }, [loadData, fetchNotifications]);

  useEffect(() => {
    if (openPanel === 'leaderboard' && !leaderboard.length) loadLeaderboard();
  }, [openPanel, leaderboard.length, loadLeaderboard]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const getUserName = () => user?.name || user?.email?.split('@')[0] || 'Student';
  const getGreeting = () => {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
  };
  const handleLogout = async () => { await logout(); navigate('/'); toast.success('Logged out'); };
  const handleQuizComplete = (result) => {
    setShowQuiz(null);
    toast.success(`Quiz submitted! Score: ${Math.round(result.percentage)}%`);
    loadData();
  };

  // ── PDFs ──────────────────────────────────────────────────────────────────
  const downloadReportPDF = async (report) => {
    if (!report) return;
    let logoDataUrl = null;
    try {
      const res = await fetch('/schoologo.png');
      const blob = await res.blob();
      logoDataUrl = await new Promise(resolve => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });
    } catch { /* no logo */ }
    try {
      const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
      const pw = doc.internal.pageSize.getWidth();
      const ph = doc.internal.pageSize.getHeight();
      const valid = (report.subjects || []).filter(s => s?.score != null);
      const totalPoints = calculateTotalPoints(valid);
      const best = calculateBestSubjects(valid);
      const avg = calculateAverage(valid);
      const avgGrade = getGradeFromScore(avg);
      const darkBlue = [10, 37, 64], teal = [42, 157, 143], lightGray = [248, 250, 252], darkGray = [15, 25, 35];

      doc.setFillColor(...darkBlue); doc.rect(0, 0, pw, 50, 'F');
      doc.setFillColor(...teal);     doc.rect(0, 48, pw, 2, 'F');
      if (logoDataUrl) { try { doc.addImage(logoDataUrl, 'PNG', 8, 5, 38, 38); } catch { /* skip */ } }
      doc.setTextColor(255, 255, 255); doc.setFontSize(15); doc.setFont('helvetica', 'bold');
      doc.text('PROGRESS SECONDARY SCHOOL', pw / 2 + (logoDataUrl ? 8 : 0), 20, { align: 'center' });
      doc.setFontSize(9); doc.setFont('helvetica', 'italic'); doc.setTextColor(220, 220, 220);
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
      [{ label: 'Average', value: `${avg}%` }, { label: 'Grade', value: avgGrade.letter }, { label: 'Points', value: `${totalPoints} pts` }].forEach((c, i) => {
        const x = 15 + i * (cw + 7);
        doc.setFillColor(...lightGray); doc.roundedRect(x, y, cw, 30, 3, 3, 'F');
        doc.setDrawColor(...teal);      doc.roundedRect(x, y, cw, 30, 3, 3, 'S');
        doc.setTextColor(...darkGray);  doc.setFontSize(7); doc.setFont('helvetica', 'bold');
        doc.text(c.label, x + 5, y + 8);
        doc.setFontSize(16); doc.setTextColor(...teal);
        doc.text(c.value, x + 5, y + 24);
      });
      y += 40;

      const rows = best.map(s => { const g = getGradeFromScore(s.score); return [s.name, `${s.score}%`, `${g.points} pts`, g.letter]; });
      rows.push([
        { content: 'BEST 6 TOTAL', styles: { fontStyle: 'bold', fillColor: [255, 248, 225] } }, '',
        { content: `${totalPoints} pts`, styles: { fontStyle: 'bold', textColor: teal } },
        { content: getOverallGradeFromPoints(totalPoints).description, styles: { fontStyle: 'bold', textColor: teal } },
      ]);
      autoTable(doc, {
        startY: y, margin: { left: 15, right: 15 },
        head: [['Subject', 'Score', 'Points', 'Grade']],
        body: rows, theme: 'grid',
        headStyles: { fillColor: darkBlue, textColor: 255, fontStyle: 'bold', halign: 'center', fontSize: 8, cellPadding: 3 },
        bodyStyles: { textColor: darkGray, fontSize: 7, cellPadding: 2.5 },
        alternateRowStyles: { fillColor: lightGray },
        columnStyles: { 0: { cellWidth: 70, fontStyle: 'bold' }, 1: { halign: 'center', cellWidth: 30 }, 2: { halign: 'center', cellWidth: 30 }, 3: { halign: 'center' } },
      });
      doc.setFontSize(6); doc.setTextColor(150, 150, 150);
      doc.text(`Generated: ${new Date().toLocaleString()}`, pw / 2, ph - 5, { align: 'center' });
      doc.save(`${user?.name?.replace(/\s+/g, '_') || 'student'}_${report?.term || 'report'}.pdf`);
      toast.success('Report downloaded!');
    } catch { toast.error('Failed to generate PDF'); }
  };

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
    } catch { /* silent */ }
  };

  // ── Quiz overlay ──────────────────────────────────────────────────────────
  if (showQuiz) {
    return (
      <QuizTaking
        quizId={showQuiz}
        onComplete={handleQuizComplete}
        onExit={() => setShowQuiz(null)}
      />
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PANEL CONTENTS
  // ══════════════════════════════════════════════════════════════════════════

  // ── Overview ──────────────────────────────────────────────────────────────
  const OverviewPanelContent = () => (
    <div className="space-y-4">

      {/* Profile */}
      <div className="bg-white rounded-xl border border-[#D3EEEE] overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-[#009B9D] via-[#00777C] to-[#00585F]" />
        <div className="flex items-center gap-3 p-4">
          <div className="w-11 h-11 rounded-full bg-[#C9F5F3] flex items-center justify-center flex-shrink-0">
            <UserCircleIcon className="w-6 h-6 text-[#00686D]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black text-[#00565B] truncate">{getUserName()}</p>
            <p className="text-[10px] text-slate-400">{user?.reg_number || user?.regNumber || '—'}</p>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="px-2 py-0.5 bg-[#DDF6F2] text-[#00666B] text-[10px] font-bold rounded-full">
                {user?.form || 'Upper Form'}
              </span>
              {user?.phone
                ? <span className="text-[10px] text-slate-500">{user.phone}</span>
                : <span className="text-[10px] text-slate-400 italic">No phone on record</span>
              }
            </div>
          </div>
        </div>
      </div>

      {/* Latest report preview */}
      {latestReport && (() => {
        const valid = (latestReport.subjects || []).filter(s => s?.score != null);
        return (
          <div className="bg-white rounded-xl border border-[#D3EEEE] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#D8EEEE] bg-gradient-to-r from-[#E7F8F7] to-[#F7FCFA]">
              <span className="text-xs font-black text-[#00565B]">Latest Report — {latestReport.term}</span>
              <button onClick={() => downloadReportPDF(latestReport)} className="p-1 text-[#00777A] hover:bg-[#DDF6F2] rounded transition">
                <ArrowDownTrayIcon className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-2">
              {valid.slice(0, 5).map((s, i) => {
                const g = getGradeFromScore(s.score);
                return (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-500 w-28 truncate flex-shrink-0">{s.name}</span>
                    <div className="flex-1 h-1.5 bg-[#E4FAFA] rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${s.score}%`, backgroundColor: g.color }} />
                    </div>
                    <span className="text-[11px] font-bold w-14 text-right flex-shrink-0" style={{ color: g.color }}>
                      {s.score}% {g.letter}
                    </span>
                  </div>
                );
              })}
              {valid.length > 5 && <p className="text-[10px] text-slate-400 text-center">+{valid.length - 5} more</p>}
            </div>
          </div>
        );
      })()}

      {/* Attendance summary */}
      <div className="bg-white rounded-xl border border-[#D3EEEE] overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#D8EEEE] bg-gradient-to-r from-[#E7F8F7] to-[#F7FCFA]">
          <span className="text-xs font-black text-[#00565B]">Attendance Summary</span>
          {attendanceRecords.length > 0 && (
            <button onClick={downloadAttendancePDF} className="p-1 text-[#00777A] hover:bg-[#DDF6F2] rounded transition">
              <ArrowDownTrayIcon className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="p-4">
          <div className="flex items-center justify-center mb-3">
            <div className="w-16 h-16 rounded-full border-4 border-[#12BFC0]/30 flex items-center justify-center">
              <span className="text-lg font-black text-[#00666B]">{stats.attendanceRate}</span>
            </div>
          </div>
          {stats.totalDays > 0 ? (
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-green-50 rounded-lg p-2 border border-green-100">
                <p className="font-bold text-green-600">{stats.presentCount}</p>
                <p className="text-[10px] text-slate-500">Present</p>
              </div>
              <div className="bg-amber-50 rounded-lg p-2 border border-amber-100">
                <p className="font-bold text-amber-600">{stats.lateCount}</p>
                <p className="text-[10px] text-slate-500">Late</p>
              </div>
              <div className="bg-red-50 rounded-lg p-2 border border-red-100">
                <p className="font-bold text-red-500">{stats.absentCount}</p>
                <p className="text-[10px] text-slate-500">Absent</p>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400 text-center">No attendance records yet</p>
          )}
        </div>
      </div>
    </div>
  );

  // ── Reports ───────────────────────────────────────────────────────────────
  const ReportsPanelContent = () => {
    const sorted = [...filteredReports].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    const [selectedId, setSelectedId] = React.useState(sorted[0]?.id ?? null);
    const report = sorted.find(r => r.id === selectedId) || sorted[0] || null;

    if (sorted.length === 0) return (
      <div className="text-center py-12 bg-white rounded-xl border border-[#D3EEEE]">
        <DocumentTextIcon className="w-10 h-10 text-[#D3EEEE] mx-auto mb-2" />
        <p className="text-sm text-slate-400">No reports available</p>
      </div>
    );

    const valid       = (report.subjects || []).filter(s => s?.score != null);
    const avg         = calculateAverage(valid);
    const grade       = getGradeFromScore(avg);
    const best6pts    = calculateTotalPoints(calculateBestSubjects(valid));
    const overallDesc = getOverallGradeFromPoints(best6pts).description;

    return (
      <div className="space-y-4">
        {/* Term pills */}
        {sorted.length > 1 && (
          <div className="flex flex-wrap gap-2">
            {sorted.map((r, idx) => {
              const isSel = r.id === selectedId;
              return (
                <button key={r.id} onClick={() => setSelectedId(r.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                    isSel
                      ? 'bg-gradient-to-b from-[#FFE77B] to-[#FFBF19] text-[#073F43] border-[#F3C34A]'
                      : 'bg-white text-slate-500 border-[#D3EEEE] hover:border-[#12BFC0] hover:text-[#00666B]'
                  }`}>
                  {r.term || `Report ${idx + 1}`}
                  {idx === 0 && <span className={`ml-1 text-[9px] ${isSel ? 'text-[#073F43]/60' : 'text-[#12BFC0]'}`}>●</span>}
                </button>
              );
            })}
          </div>
        )}

        {/* Card */}
        <div className="bg-white rounded-xl border border-[#D3EEEE] shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-[#D8EEEE] bg-gradient-to-r from-[#E7F8F7] to-[#F7FCFA] flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-sm font-black text-[#00565B] truncate">{report.term || 'Report'}</span>
              <span className="text-[10px] text-slate-400">{report.academic_year}</span>
              <span className="px-2 py-0.5 bg-[#DDF6F2] text-[#00666B] text-[10px] font-bold rounded-full">{report.form || user?.form}</span>
            </div>
            <span className="text-xs font-black flex-shrink-0 ml-2" style={{ color: grade.color }}>{avg}% · {grade.letter}</span>
          </div>
          <div className="px-4 pt-4 pb-3 space-y-2">
            {valid.map((s, i) => {
              const g = getGradeFromScore(s.score);
              return (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-500 w-28 truncate flex-shrink-0">{s.name}</span>
                  <div className="flex-1 h-1.5 bg-[#E4FAFA] rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${s.score}%`, backgroundColor: g.color }} />
                  </div>
                  <span className="text-[11px] font-bold font-mono w-16 text-right flex-shrink-0" style={{ color: g.color }}>
                    {s.score}% {g.letter}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="mx-4 mb-4 px-3 py-2 bg-[#F0FAF8] rounded-lg border border-[#D3EEEE] flex items-center justify-between">
            <span className="text-[11px] text-slate-500">Best 6: <span className="font-bold text-[#00565B]">{best6pts} pts</span></span>
            <span className="text-[11px] font-bold text-[#00666B]">{overallDesc}</span>
          </div>
          <div className="flex border-t border-[#D8EEEE]">
            <button onClick={() => { setSelectedReport(report); setShowReportModal(true); }}
              className="flex-1 py-2.5 text-xs font-bold text-[#00666B] hover:bg-[#F0FAF8] transition border-r border-[#D8EEEE] flex items-center justify-center gap-1.5">
              View Report
            </button>
            <button onClick={() => downloadReportPDF(report)}
              className="flex-1 py-2.5 text-xs font-bold text-slate-500 hover:bg-[#F0FAF8] transition flex items-center justify-center gap-1.5">
              <ArrowDownTrayIcon className="w-3.5 h-3.5" /> Download PDF
            </button>
          </div>
        </div>

        {/* View modal */}
        {showReportModal && selectedReport && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="flex items-center justify-between px-5 py-3 bg-[#00676B] flex-shrink-0">
                <span className="text-sm font-black text-white truncate">
                  {selectedReport.term} — {selectedReport.form || user?.form} {selectedReport.academic_year}
                </span>
                <button onClick={() => setShowReportModal(false)}
                  className="w-7 h-7 rounded-lg bg-white/10 hover:bg-red-500 flex items-center justify-center transition ml-2 flex-shrink-0">
                  <XMarkIcon className="w-4 h-4 text-white" />
                </button>
              </div>
              <div className="overflow-y-auto flex-1 p-5 space-y-4">
                {(() => {
                  const v   = (selectedReport.subjects || []).filter(s => s?.score != null);
                  const a   = calculateAverage(v);
                  const g   = getGradeFromScore(a);
                  const b6  = calculateBestSubjects(v);
                  const pts = calculateTotalPoints(b6);
                  return (
                    <>
                      <div className="grid grid-cols-3 gap-3">
                        {[{ label: 'Average', value: `${a}%` }, { label: 'Grade', value: g.letter }, { label: 'Points', value: `${pts} pts` }].map(c => (
                          <div key={c.label} className="text-center bg-[#F0FAF8] rounded-xl p-3 border border-[#D3EEEE]">
                            <p className="text-lg font-black text-[#00565B]">{c.value}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase">{c.label}</p>
                          </div>
                        ))}
                      </div>
                      <div className="space-y-1.5">
                        {v.map((s, i) => {
                          const sg = getGradeFromScore(s.score);
                          return (
                            <div key={i} className="flex items-center gap-2">
                              <span className="text-xs text-slate-600 w-32 truncate flex-shrink-0">{s.name}</span>
                              <div className="flex-1 h-1.5 bg-[#E4FAFA] rounded-full overflow-hidden">
                                <div className="h-full rounded-full" style={{ width: `${s.score}%`, backgroundColor: sg.color }} />
                              </div>
                              <span className="text-xs font-bold font-mono w-16 text-right flex-shrink-0" style={{ color: sg.color }}>
                                {s.score}% {sg.letter}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                      <div className="flex items-center justify-between px-3 py-2.5 bg-[#F0FAF8] rounded-lg border border-[#D3EEEE]">
                        <span className="text-xs text-slate-500">Best 6 Aggregate</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-[#00565B]">{pts} pts</span>
                          <span className="px-2 py-0.5 bg-[#DDF6F2] text-[#00666B] text-[10px] rounded-full font-bold">
                            {getOverallGradeFromPoints(pts).description}
                          </span>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
              <div className="px-5 py-3 border-t border-[#D8EEEE] flex gap-2 flex-shrink-0">
                <button onClick={() => setShowReportModal(false)}
                  className="flex-1 py-2.5 border border-[#D3EEEE] rounded-xl text-sm font-bold text-slate-500 hover:bg-[#F0FAF8] transition">
                  Close
                </button>
                <button onClick={() => { downloadReportPDF(selectedReport); setShowReportModal(false); }}
                  className="flex-1 py-2.5 bg-[#00676B] text-white rounded-xl text-sm font-bold hover:bg-[#005060] transition flex items-center justify-center gap-2">
                  <ArrowDownTrayIcon className="w-4 h-4" /> Download PDF
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ── Attendance ────────────────────────────────────────────────────────────
  const AttendancePanelContent = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500">Your daily attendance history</p>
        {attendanceRecords.length > 0 && (
          <button onClick={downloadAttendancePDF}
            className="px-3 py-1.5 bg-[#00676B] text-white rounded-lg text-xs font-bold hover:bg-[#005060] transition flex items-center gap-1.5">
            <ArrowDownTrayIcon className="w-3.5 h-3.5" /> PDF
          </button>
        )}
      </div>
      <div className="bg-white rounded-xl border border-[#D3EEEE] shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-[#E7F8F7] to-[#F7FCFA]">
            <tr>
              <th className="px-4 py-2.5 text-left text-[10px] font-black text-[#00565B] uppercase tracking-wide">Date</th>
              <th className="px-4 py-2.5 text-left text-[10px] font-black text-[#00565B] uppercase tracking-wide hidden sm:table-cell">Day</th>
              <th className="px-4 py-2.5 text-left text-[10px] font-black text-[#00565B] uppercase tracking-wide">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E4FAFA]">
            {attendanceRecords.length === 0 ? (
              <tr><td colSpan="3" className="px-4 py-6 text-center text-sm text-slate-400">No attendance records yet</td></tr>
            ) : [...attendanceRecords].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 20).map(record => (
              <tr key={record.id} className="hover:bg-[#F0FAF8]">
                <td className="px-4 py-2.5 text-xs text-[#073F43]">
                  {new Date(record.date).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}
                </td>
                <td className="px-4 py-2.5 text-xs text-slate-400 hidden sm:table-cell">
                  {new Date(record.date).toLocaleDateString('en', { weekday: 'short' })}
                </td>
                <td className="px-4 py-2.5">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    record.status === 'present' ? 'bg-green-100 text-green-700' :
                    record.status === 'late'    ? 'bg-amber-100 text-amber-700' :
                                                  'bg-red-100 text-red-700'
                  }`}>
                    {record.status === 'present' ? 'Present' : record.status === 'late' ? 'Late' : 'Absent'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // ── Leaderboard ───────────────────────────────────────────────────────────
  const LeaderboardPanelContent = () => (
    <div className="space-y-4">
      {leaderboardLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-4 border-[#12BFC0]/20 border-t-[#12BFC0] rounded-full animate-spin" />
        </div>
      ) : leaderboard.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-[#D3EEEE]">
          <TrophyIcon className="w-10 h-10 text-[#D3EEEE] mx-auto mb-2" />
          <p className="text-sm text-slate-400 mt-2">No leaderboard data yet</p>
        </div>
      ) : (
        <>
          {currentUserRank && (
            <div className="bg-gradient-to-r from-[#009B9D] via-[#00777C] to-[#00585F] text-white rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-xs opacity-80 mb-0.5">Your Rank</p>
                <div className="flex items-end gap-1.5">
                  <span className="text-3xl font-black">#{currentUserRank}</span>
                  <span className="text-xs opacity-70 mb-1">of {leaderboard.length}</span>
                </div>
              </div>
              <TrophyIcon className="w-8 h-8 text-[#FFE77B]" />
            </div>
          )}
          <div className="bg-white rounded-xl border border-[#D3EEEE] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[380px]">
                <thead className="bg-gradient-to-r from-[#E7F8F7] to-[#F7FCFA]">
                  <tr>
                    {['#', 'Student', 'Quiz', 'Report', 'Overall'].map(h => (
                      <th key={h} className="px-3 py-2.5 text-left text-[10px] font-black text-[#00565B] uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E4FAFA]">
                  {leaderboard.map(s => (
                    <tr key={s.id} className={`hover:bg-[#F0FAF8] ${s.id === user?.id ? 'bg-[#DDF6F2] border-l-4 border-l-[#12BFC0]' : ''}`}>
                      <td className="px-3 py-2.5 text-xs font-black text-[#00565B]">#{s.rank}</td>
                      <td className="px-3 py-2.5">
                        <p className="text-xs font-bold text-[#073F43] leading-none">{s.name}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{s.reg_number}</p>
                      </td>
                      <td className="px-3 py-2.5 text-xs font-bold text-[#073F43]">{s.quiz_score}%</td>
                      <td className="px-3 py-2.5 text-xs font-bold text-[#073F43]">{s.report_score}%</td>
                      <td className="px-3 py-2.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          s.overall_score >= 80 ? 'bg-green-100 text-green-700' :
                          s.overall_score >= 60 ? 'bg-[#DDF6F2] text-[#00666B]'  :
                          s.overall_score >= 40 ? 'bg-amber-100 text-amber-700' :
                                                  'bg-red-100 text-red-700'
                        }`}>{s.overall_score}%</span>
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

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-[#F2FBFC] flex flex-col text-[#073F43]">

      {/* ── HEADER ────────────────────────────────────────────────────────────── */}
      <header
        className="dashboard-brand-header w-full flex-shrink-0"
        style={{
          backgroundColor: HEADER_BG,
          backgroundImage: "linear-gradient(90deg, rgba(0, 59, 70, 0.94) 0%, rgba(0, 76, 82, 0.78) 52%, rgba(0, 103, 112, 0.68) 100%), url('/image3.png')",
          backgroundPosition: 'center 44%',
          backgroundSize: 'cover',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 pb-4">

          {/* Top row */}
          <div className="flex justify-between items-start mb-3">
            <div>
              <p className="text-[10px] font-extrabold tracking-wider text-[#8EE5E1] mb-0.5 uppercase">
                Learner Portal
              </p>
              <h1 className="text-lg lg:text-2xl font-black text-white leading-tight">
                {getGreeting()}, {getUserName()}
              </h1>
              <p className="text-xs text-white/70 mt-0.5">
                {user?.form || 'Upper Form'} — Secondary School
                {user?.phone && <span className="ml-2 text-white/40">{user.phone}</span>}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {/* Bell */}
              <div className="relative" ref={notificationRef}>
                <button onClick={() => setShowNotifications(n => !n)}
                  className="relative w-9 h-9 lg:w-11 lg:h-11 border border-[#25D2CE] bg-[#004F54]/80 rounded-xl flex items-center justify-center hover:bg-[#004F54] transition text-[#FFD84D]">
                  <BellIcon className="w-4 h-4 lg:w-5 lg:h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 lg:w-5 lg:h-5 bg-red-500 text-white text-[10px] lg:text-xs rounded-full flex items-center justify-center font-bold border border-[#005C61]">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-72 lg:w-80 bg-white rounded-xl shadow-xl border border-[#D3EEEE] z-50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-[#D3EEEE] bg-[#F0FAF8] font-semibold text-sm text-[#00565B]">Notifications</div>
                    <div className="max-h-64 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="px-4 py-6 text-center text-sm text-slate-500">No notifications</div>
                      ) : notifications.map(n => (
                        <div key={n.id} onClick={() => { markAsRead(n.id); setShowNotifications(false); }}
                          className={`px-4 py-3 border-b border-slate-100 cursor-pointer hover:bg-[#F3FAF9] ${!n.is_read ? 'bg-[#E8F8F7]' : ''}`}>
                          <p className="text-xs font-medium text-[#073F43]">{n.title}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">{n.message}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              {/* User chip */}
              <div className="flex items-center gap-1.5 rounded-full border border-[#25D2CE] bg-[#004F54]/75 py-0.5 pl-0.5 pr-2">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-[#F7D34D] bg-[#EAFBFA] text-[#00858A]">
                  <UserCircleIcon className="h-6 w-6" />
                </div>
                <div className="hidden sm:block min-w-0 text-left">
                  <p className="truncate text-[10px] font-black text-white leading-tight max-w-[100px]">{getUserName()}</p>
                  <p className="truncate text-[9px] font-semibold text-[#D7F6F3]">{user?.form || 'Upper Form'}</p>
                </div>
                <button onClick={handleLogout} title="Log out" aria-label="Log out"
                  className="ml-1 text-white/70 hover:text-white transition">
                  <ArrowRightOnRectangleIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

        </div>
      </header>

      {/* ── DESKTOP NAV BAR ──────────────────────────────────────────────────── */}
      <div className="hidden lg:block sticky top-0 z-20 shadow-sm" style={{ backgroundColor: NAVBAR_BG }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex overflow-x-auto scrollbar-none gap-0.5 py-1.5">
            {[
              { id: 'learning',    Icon: AcademicCapIcon,   label: 'Learning',     onClick: () => setMainView('learning'),   active: mainView === 'learning' && !openPanel },
              { id: 'library',     Icon: RectangleStackIcon, label: 'Library',      onClick: () => setMainView('library'),    active: mainView === 'library' && !openPanel  },
              { id: 'overview',    Icon: HomeIcon,           label: 'Overview',     onClick: () => togglePanel('overview'),   active: openPanel === 'overview'    },
              { id: 'reports',     Icon: DocumentTextIcon,  label: 'Report Cards', onClick: () => togglePanel('reports'),    active: openPanel === 'reports'     },
              { id: 'attendance',  Icon: CalendarIcon,      label: 'Attendance',   onClick: () => togglePanel('attendance'), active: openPanel === 'attendance'  },
              { id: 'leaderboard', Icon: TrophyIcon,         label: 'Leaderboard',  onClick: () => togglePanel('leaderboard'), active: openPanel === 'leaderboard' },
            ].map(item => (
              <button key={item.id} onClick={item.onClick}
                className={`flex items-center gap-1.5 px-3 lg:px-4 py-2.5 rounded-full text-[11px] lg:text-xs font-black transition-all duration-200 whitespace-nowrap ${
                  item.active
                    ? 'bg-gradient-to-b from-[#FFE77B] to-[#FFBF19] text-[#073F43] shadow-md'
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                }`}>
                <item.Icon className="w-4 h-4 lg:w-5 lg:h-5 shrink-0 stroke-[2]" />
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── MOBILE NAV ───────────────────────────────────────────────────────── */}
      <div className="lg:hidden flex-shrink-0 border-b border-[#004F54]" style={{ backgroundColor: NAVBAR_BG }}>
        <div className="px-3">
          <div className="flex gap-1 py-2 overflow-x-auto scrollbar-none">
            {[
              { id: 'learning',    Icon: AcademicCapIcon,   label: 'Learning',    onClick: () => setMainView('learning'),   active: mainView === 'learning' && !openPanel },
              { id: 'library',     Icon: RectangleStackIcon, label: 'Library',     onClick: () => setMainView('library'),    active: mainView === 'library' && !openPanel  },
              { id: 'overview',    Icon: HomeIcon,           label: 'Overview',    onClick: () => togglePanel('overview'),   active: openPanel === 'overview'    },
              { id: 'reports',     Icon: DocumentTextIcon,  label: 'Reports',     onClick: () => togglePanel('reports'),    active: openPanel === 'reports'     },
              { id: 'attendance',  Icon: CalendarIcon,      label: 'Attendance',  onClick: () => togglePanel('attendance'), active: openPanel === 'attendance'  },
              { id: 'leaderboard', Icon: TrophyIcon,         label: 'Leaderboard', onClick: () => togglePanel('leaderboard'), active: openPanel === 'leaderboard' },
            ].map(item => (
              <button key={item.id} onClick={item.onClick}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full flex-shrink-0 text-[9px] font-black transition-all ${
                  item.active
                    ? 'bg-gradient-to-b from-[#FFE77B] to-[#FFBF19] text-[#073F43] shadow-sm'
                    : 'bg-white/10 text-white/80 hover:bg-white/20 hover:text-white'
                }`}>
                <item.Icon className="w-3.5 h-3.5 shrink-0 stroke-[2]" />
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ─────────────────────────────────────────────────────── */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-4 lg:px-6 py-4 lg:py-6" style={{ backgroundColor: PAGE_BG }}>
        <div className="overflow-hidden rounded-[26px] border border-[#D3EEEE] bg-white shadow-[0_8px_28px_rgba(0,91,96,0.08)]">
          {openPanel ? (
            <>
              {/* Inner panel header — matches PrimaryLearnerDashboard inner page header */}
              <div className="flex items-center gap-3 border-b border-[#D8EEEE] bg-gradient-to-r from-[#E7F8F7] to-[#F7FCFA] px-4 py-4 sm:px-6">
                <button
                  onClick={() => setOpenPanel(null)}
                  className="rounded-full bg-white px-4 py-2 text-sm font-bold text-[#00666B] shadow-sm ring-1 ring-[#D2E9E8] transition hover:bg-[#FFF3C5]"
                >
                  ← Back
                </button>
                <h2 className="text-lg font-black text-[#00565B]">
                  {openPanel === 'overview'    ? 'Overview'     :
                   openPanel === 'reports'     ? 'Report Cards' :
                   openPanel === 'attendance'  ? 'Attendance'   : 'Leaderboard'}
                </h2>
              </div>
              <div className="p-3 sm:p-4 lg:p-6">
                {openPanel === 'overview'    && <OverviewPanelContent />}
                {openPanel === 'reports'     && <ReportsPanelContent />}
                {openPanel === 'attendance'  && <AttendancePanelContent />}
                {openPanel === 'leaderboard' && <LeaderboardPanelContent />}
              </div>
            </>
          ) : (
            <div className="p-3 sm:p-4 lg:p-6">
              {mainView === 'library' ? (
                <Library />
              ) : (
                <LearningSpace onStartQuiz={(quizId) => setShowQuiz(quizId)} />
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
