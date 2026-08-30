import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import LearningSpace from './LearningSpace';
import QuizTaking from './QuizTaking';
import UpperFormDashboard from './UpperFormDashboard';
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
  BookOpenIcon,
  ChatBubbleLeftRightIcon,
  BellIcon,
  ChartBarIcon,
  AcademicCapIcon,
  UserGroupIcon,
  ClipboardDocumentCheckIcon,
  HomeIcon,
  BookmarkIcon,
  NewspaperIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// THEME CONSTANTS
const DARK_BLUE = '#0A2540';
const NAVY_PRIMARY = '#1E3A5F';
const AZURE_ACCENT = '#00B4D8';
const TEAL_ACCENT = '#2A9D8F';
const ICE_WHITE = '#F8FAFC';
const PAPER = '#F5F2EB';
const HEADER_BG = '#003B46';
const NAVBAR_BG = '#006770';

// --- Helper functions (unchanged) ---
const normalizeScore = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const numericValue = Number(String(value).replace(/%/g, '').trim());
  return Number.isFinite(numericValue) ? numericValue : null;
};

const normalizeForm = (form) => String(form ?? '').trim().toLowerCase();

const isUpperForm = (form) => {
  const normalizedForm = normalizeForm(form);
  return normalizedForm === 'form 3' || normalizedForm === 'form 4' || normalizedForm.includes('upper');
};

const getGradeFromScore = (score, form = 'Form 1') => {
  const numericScore = normalizeScore(score);
  const upperForm = isUpperForm(form);

  if (numericScore === null) {
    return { letter: 'N/A', points: null, description: 'No score', color: '#64748b', bgColor: '#f8fafc' };
  }

  if (upperForm) {
    if (numericScore >= 85) return { letter: 'A*', points: 1, description: 'Distinction', color: '#1e7e4a', bgColor: '#e8f5e9' };
    else if (numericScore >= 75) return { letter: 'A', points: 2, description: 'Distinction', color: '#2a6e2a', bgColor: '#e8f5e9' };
    else if (numericScore >= 65) return { letter: 'B', points: 3, description: 'Credit', color: '#2a9090', bgColor: '#e0f2f1' };
    else if (numericScore >= 56) return { letter: 'C', points: 4, description: 'Credit', color: TEAL_ACCENT, bgColor: '#e0f2f1' };
    else if (numericScore >= 50) return { letter: 'D', points: 5, description: 'Credit', color: AZURE_ACCENT, bgColor: '#e0f7fa' };
    else if (numericScore >= 45) return { letter: 'E', points: 6, description: 'Pass', color: AZURE_ACCENT, bgColor: '#e0f7fa' };
    else if (numericScore >= 40) return { letter: 'F', points: 7, description: 'Pass', color: AZURE_ACCENT, bgColor: '#e0f7fa' };
    else if (numericScore >= 35) return { letter: 'G', points: 8, description: 'Pass', color: AZURE_ACCENT, bgColor: '#e0f7fa' };
    else return { letter: 'U', points: 9, description: 'Fail', color: '#c0392b', bgColor: '#ffebee' };
  } else {
    if (numericScore >= 75) return { letter: 'A', description: 'Excellent', points: null, color: '#1e7e4a', bgColor: '#e8f5e9' };
    else if (numericScore >= 65) return { letter: 'B', description: 'Very good', points: null, color: '#2a9090', bgColor: '#e0f2f1' };
    else if (numericScore >= 55) return { letter: 'C', description: 'Good', points: null, color: TEAL_ACCENT, bgColor: '#e0f2f1' };
    else if (numericScore >= 40) return { letter: 'D', description: 'Pass', points: null, color: AZURE_ACCENT, bgColor: '#e0f7fa' };
    else return { letter: 'F', description: 'Need improvement', points: null, color: '#c0392b', bgColor: '#ffebee' };
  }
};

const calculateAverage = (subjects) => {
  if (!subjects || subjects.length === 0) return 0;
  const validSubjects = subjects.filter(s => {
    const normalizedScore = normalizeScore(s?.score);
    return s && normalizedScore !== null;
  });
  if (validSubjects.length === 0) return 0;
  const sum = validSubjects.reduce((acc, subj) => acc + (normalizeScore(subj.score) || 0), 0);
  return Math.round(sum / validSubjects.length);
};

const calculateTotalPoints = (subjects, form) => {
  if (!subjects || subjects.length === 0) return 0;
  const upperForm = isUpperForm(form);
  if (!upperForm) return null;
  const totalPoints = subjects.reduce((sum, subject) => {
    const normalizedScore = normalizeScore(subject?.score);
    if (normalizedScore === null) return sum;
    const grade = getGradeFromScore(normalizedScore, form);
    return sum + (grade.points || 0);
  }, 0);
  return totalPoints;
};

const calculateBestSubjects = (subjects, form) => {
  const upperForm = isUpperForm(form);
  if (!upperForm) return subjects;

  const subjectsWithPoints = subjects.map(subject => ({
    ...subject,
    score: normalizeScore(subject?.score) ?? 0,
    points: getGradeFromScore(subject?.score, form).points
  }));

  // English must be included if present — find it first
  const english = subjectsWithPoints.find(s =>
    s.name?.toLowerCase().includes('english')
  );
  const others = subjectsWithPoints.filter(s =>
    !s.name?.toLowerCase().includes('english')
  );

  // Sort others by points ascending (lower = better) and take best 5 to fill up to 6
  const sortedOthers = [...others].sort((a, b) => a.points - b.points);
  const best = english
    ? [english, ...sortedOthers.slice(0, 5)]   // English + best 5 others
    : sortedOthers.slice(0, 6);                  // No English — just best 6

  return best.slice(0, 6); // Always max 6
};

// ── Points-to-grade boundary ────────────────────────────────────────────────
// Points: A*(1), A(2), B(3), C(4), D(5), E(6), F(7), G(8), U(9)
// Distinction: 1–2 | Credit: 3–5 | Pass: 6–8 | Fail: 9
const getOverallGradeFromPoints = (totalPoints) => {
  if (totalPoints <= 2)  return { description: 'Distinction', color: '#1e7e4a' };
  if (totalPoints <= 5)  return { description: 'Credit',      color: '#2a9090' };
  if (totalPoints <= 8)  return { description: 'Pass',        color: '#f39c12' };
  return                        { description: 'Fail',        color: '#c0392b' };
};

// ── Full upper-form result calculation ───────────────────────────────────────
// Rules:
//   • Select best 6 subjects — English is compulsory in the six
//   • Pass requires Pass or Distinction grades in at least 5 of the best 6 subjects
//   • No assessed subjects → Complete Fail
const calculateUpperFormResult = (subjects) => {
  if (!subjects || subjects.length === 0)
    return { status: 'FAIL', aggregate: null, grade: 'Fail', message: 'No subjects assessed', color: '#c0392b', bestSix: [] };

  const withPoints = subjects
    .map(s => {
      const numericScore = normalizeScore(s?.score);
      return {
        ...s,
        score: numericScore ?? 0,
        points: getGradeFromScore(numericScore ?? 0, 'Form 3').points,
      };
    })
    .filter(s => s.score !== 0 || normalizeScore(s?.score) !== null);

  const english = withPoints.find(s => s.name?.toLowerCase().includes('english'));
  const others  = withPoints.filter(s => !s.name?.toLowerCase().includes('english'));
  const sortedOthers = [...others].sort((a, b) => a.points - b.points);

  // Build best six (English mandatory if present)
  let bestSix = english
    ? [english, ...sortedOthers.slice(0, 5)]
    : sortedOthers.slice(0, 6);
  bestSix = bestSix.slice(0, 6);

  // Only Pass (E–G) and Distinction (A*/A) count toward the overall result.
  const passedInBestSix = bestSix.filter(s => s.points <= 2 || (s.points >= 6 && s.points <= 8)).length;

  if (passedInBestSix < 5) {
    const aggregate = bestSix.reduce((t, s) => t + s.points, 0);
    return {
      status: 'FAIL',
      aggregate,
      grade: 'Fail',
      message: `Only ${passedInBestSix} subject${passedInBestSix !== 1 ? 's' : ''} passed (need 5 Pass or Distinction grades) — Overall: FAIL`,
      color: '#c0392b',
      bestSix,
    };
  }

  // Aggregate is retained for report display, but does not determine pass/fail.
  const aggregate = bestSix.reduce((t, s) => t + s.points, 0);

  return {
    status: 'PASS',
    aggregate,
    grade: 'Pass',
    message: `${passedInBestSix} subjects achieved Pass or Distinction — Overall: PASS`,
    color: '#f39c12',
    bestSix,
  };
};

const getFinalStatus = (englishPassed, totalPoints) => {
  if (!englishPassed) return { status: 'FAIL', message: 'Failed English — Overall: FAIL', color: '#c0392b' };
  const g = getOverallGradeFromPoints(totalPoints);
  return { status: g.description === 'Fail' ? 'FAIL' : 'PASS', message: `${g.description} (${totalPoints} pts)`, color: g.color };
};

// ── Lower form: PASS = A/B/C/D (score ≥ 40) in at least 6 subjects ───────────
const calculateStatusByPassedSubjects = (subjects) => {
  if (!subjects || subjects.length === 0)
    return { status: 'FAIL', message: 'No subjects assessed', color: '#c0392b' };
  const passedCount = subjects.filter(s => {
    const score = normalizeScore(s?.score);
    return score !== null && score >= 40;
  }).length;
  if (passedCount >= 6)
    return { status: 'PASS', message: `Passed ${passedCount} subject${passedCount !== 1 ? 's' : ''} (A–D) — Overall: PASS`, color: '#10b981' };
  return { status: 'FAIL', message: `Passed only ${passedCount} subject${passedCount !== 1 ? 's' : ''} (need 6) — Overall: FAIL`, color: '#c0392b' };
};

// Returns the ordinal suffix for a number: 1→"st", 2→"nd", 3→"rd", 4+→"th"
const getOrdinalSuffix = (n) => {
  if (!Number.isInteger(n) || n <= 0) return '';
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
};

// --- Stat Card ---
const StatCard = ({ icon, value, label, color = TEAL_ACCENT }) => (
  <div className="bg-white rounded-xl border border-[#e2e8f0] p-4 shadow-sm hover:shadow transition-all duration-200">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: `${color}15`, color }}>
        {icon}
      </div>
      <div>
        <div className="text-2xl font-bold text-[#0A2540]">{value}</div>
        <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</div>
      </div>
    </div>
  </div>
);

// --- Navigation Item ---
const NavItem = ({ icon, label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-2 font-medium text-sm transition-all duration-200 border-b-2 ${
      isActive
        ? 'border-[#2A9D8F] text-white'
        : 'border-transparent text-slate-100/70 hover:text-white hover:border-white/30'
    }`}
  >
    <span className="w-5 h-5">{icon}</span>
    <span>{label}</span>
  </button>
);

const MobileMenuButton = ({ isOpen, onClick }) => (
  <button
    onClick={onClick}
    className="lg:hidden p-2 rounded-lg bg-white/10 hover:bg-white/20 transition"
    aria-label="Toggle menu"
  >
    {isOpen ? (
      <XMarkIcon className="w-6 h-6 text-white" />
    ) : (
      <Bars3Icon className="w-6 h-6 text-white" />
    )}
  </button>
);

function LowerFormDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(() => {
    const saved = sessionStorage.getItem('learnerActiveTab');
    return saved || 'overview';
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Quiz states
  const [showQuiz, setShowQuiz] = useState(null);
  const [quizResult, setQuizResult] = useState(null);

  // Data states
  const [reports, setReports] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [quizAttempts, setQuizAttempts] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [currentUserRank, setCurrentUserRank] = useState(null);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [stats, setStats] = useState({
    reportsCount: 0,
    attendanceRate: '—',
    averageScore: '—',
    totalDays: 0,
    presentCount: 0,
    lateCount: 0,
    absentCount: 0,
    quizScore: '—',
    quizzesCompleted: 0,
    totalMarks: 0,
    totalPossibleMarks: 0
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

  // Notification states
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef(null);

  // Save active tab
  useEffect(() => {
    sessionStorage.setItem('learnerActiveTab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [activeTab]);

  // --- Filter extraction and application (unchanged) ---
  const extractFilters = useCallback((reportsData) => {
    const years = new Set();
    const assessments = new Set();
    reportsData.forEach(report => {
      if (report.academic_year) years.add(report.academic_year);
      else if (report.created_at) years.add(new Date(report.created_at).getFullYear());
      if (report.term) assessments.add(report.term);
    });
    const sortedYears = Array.from(years).sort((a, b) => b - a);
    const sortedAssessments = Array.from(assessments).sort();
    setAvailableYears(sortedYears);
    setAvailableAssessments(sortedAssessments);
    if (sortedYears.length > 0 && !selectedYear) setSelectedYear(sortedYears[0]);
    if (sortedAssessments.length > 0 && !selectedAssessment) setSelectedAssessment(sortedAssessments[0]);
  }, [selectedYear, selectedAssessment]);

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
        const sorted = [...filtered].sort((a, b) => (new Date(b.created_at) - new Date(a.created_at)));
        setLatestReport(sorted[0]);
      } else {
        setLatestReport(null);
      }
    }
  }, [reports, selectedYear, selectedAssessment]);

  // --- Data loading (unchanged) ---
  const loadDashboardData = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    let reportsData = [];
    let attendanceData = { stats: {}, records: [] };
    let quizHistoryData = [];
    try {
      try {
        const reportsRes = await api.get('/api/learner/reports');
        if (reportsRes.data && Array.isArray(reportsRes.data)) reportsData = reportsRes.data;
        else if (reportsRes.data?.data && Array.isArray(reportsRes.data.data)) reportsData = reportsRes.data.data;
        else if (reportsRes.data?.reports && Array.isArray(reportsRes.data.reports)) reportsData = reportsRes.data.reports;
      } catch (reportError) {
}
      try {
        const attendanceRes = await api.get('/api/learner/attendance');
        if (attendanceRes.data) {
          if (attendanceRes.data.stats && attendanceRes.data.records) attendanceData = attendanceRes.data;
          else if (attendanceRes.data.data) attendanceData = attendanceRes.data.data;
          else if (Array.isArray(attendanceRes.data)) attendanceData = { stats: {}, records: attendanceRes.data };
        }
      } catch (attendanceError) {
}
      try {
        const quizRes = await api.get('/api/quiz/history');
        if (quizRes.data && quizRes.data.attempts) {
          quizHistoryData = quizRes.data.attempts;
          setQuizAttempts(quizHistoryData);
        } else {
          setQuizAttempts([]);
        }
      } catch (quizError) {
setQuizAttempts([]);
      }
      const processedReports = reportsData.map(report => ({
        ...report,
        academic_year: report.academic_year || (report.created_at ? new Date(report.created_at).getFullYear() : new Date().getFullYear()),
        form: report.form || user?.form || 'Form 1',
        subjects: (report.subjects || report.subjects_data || report.subject_scores || []).filter(s => s && (s.score !== undefined || s.score !== null))
      }));
      setReports(processedReports);
      extractFilters(processedReports);
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
      let totalQuizScore = 0;
      let quizzesCompleted = quizHistoryData.length;
      let totalMarks = 0;
      let totalPossibleMarks = 0;
      if (quizzesCompleted > 0) {
        const validScores = quizHistoryData.filter(q => q.percentage > 0);
        if (validScores.length > 0) {
          const avgQuizScore = validScores.reduce((sum, q) => sum + (q.percentage || 0), 0) / validScores.length;
          totalQuizScore = Math.round(avgQuizScore);
        }
        totalMarks = quizHistoryData.reduce((sum, q) => sum + (q.marks_earned || 0), 0);
        totalPossibleMarks = quizHistoryData.reduce((sum, q) => sum + (q.total_marks || 0), 0);
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
        quizzesCompleted,
        totalMarks,
        totalPossibleMarks
      });
      // Build recent activity (simplified)
      const activity = [];
      if (processedReports.length > 0) {
        const latest = [...processedReports].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
        activity.push({
          id: 'latest-report',
          type: 'report',
          title: 'New Report Available',
          description: `${latest.term || 'latest'} report (${latest.academic_year})`,
          date: latest.created_at || new Date().toISOString(),
          icon: '📋',
          color: 'text-[#2A9D8F]'
        });
      }
      if (quizHistoryData.length > 0) {
        const latestQuiz = quizHistoryData[0];
        activity.push({
          id: 'latest-quiz',
          type: 'quiz',
          title: `Quiz: ${latestQuiz.quiz?.title || latestQuiz.subject}`,
          description: `Score: ${Math.round(latestQuiz.percentage || 0)}%`,
          date: latestQuiz.completed_at || new Date().toISOString(),
          icon: '📝',
          color: 'text-purple-600'
        });
      }
      const sortedActivity = activity.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 3);
      setRecentActivity(sortedActivity);
    } catch (error) {
} finally {
      setLoading(false);
    }
  }, [user, extractFilters]);

  const loadLeaderboardData = useCallback(async () => {
    if (!user?.id) return;
    setLeaderboardLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await api.get('/api/learner/leaderboard', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setLeaderboard(res.data.leaderboard || []);
        setCurrentUserRank(res.data.current_user_rank);
      }
    } catch (error) {
toast.error('Failed to load leaderboard');
    } finally {
      setLeaderboardLoading(false);
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await api.get('/api/learner/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        const notifs = res.data.notifications || [];
        setNotifications(notifs);
        setUnreadCount(notifs.filter((n) => n.is_read === false || n.is_read === 'false' || n.is_read === null || n.is_read === undefined).length);
      }
    } catch (error) {
}
  };

  const markAsRead = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await api.put(`/api/learner/notifications/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchNotifications();
    } catch (error) {
}
  };

  useEffect(() => {
    if (showNotifications) {
      fetchNotifications();
    }
  }, [showNotifications]);

  useEffect(() => {
    if (user?.id) {
      loadDashboardData();
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
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

  useEffect(() => {
    if (user?.id) {
      loadLeaderboardData();
    }
  }, [user, loadLeaderboardData]);

  // --- Helpers ---
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

  // --- PDF generation (simplified) ---
  const downloadReportPDF = async (report) => {
    if (!report) {
      toast.error('No report data available');
      return;
    }
    try {
      // Load school logo as base64 for embedding in PDF
      let logoDataUrl = null;
      try {
        const res = await fetch('/schoologo.png');
        const blob = await res.blob();
        logoDataUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(blob);
        });
      } catch {
        // Logo fetch failed — continue without it
      }
      const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const validSubjects = (report.subjects || []).filter(s => s && s.score !== undefined && s.score !== null);
      const isUpperForm = report.form === 'Form 3' || report.form === 'Form 4';

      // ── Upper form: use new comprehensive result calculation ─────────────────
      const upperResult  = isUpperForm ? calculateUpperFormResult(validSubjects) : null;
      const bestSubjects = isUpperForm ? upperResult.bestSix : validSubjects;
      const totalPoints  = isUpperForm ? upperResult.aggregate : null;

      // ── Lower form helpers ───────────────────────────────────────────────────
      const avgScore      = calculateAverage(validSubjects);
      const avgGrade      = getGradeFromScore(avgScore, report.form);
      const passedSubjects = !isUpperForm ? validSubjects.filter(s => s.score >= 40).length : 0;
      // Prefer stored values from the report; fall back to live session data
      const classPosition = report.class_rank
        ? `${report.class_rank}${getOrdinalSuffix(parseInt(report.class_rank))}`
        : (currentUserRank ? `${currentUserRank}${getOrdinalSuffix(currentUserRank)}` : 'N/A');
      const regNumber = report.learner_reg_number
        || user?.reg_number
        || user?.registration_number
        || 'N/A';
      const reportRemarks = report.remarks || report.comment || report.teacher_comment || report.principal_comment || '';
      const darkBlue = [10, 37, 64];
      const teal = [42, 157, 143];
      const lightGray = [248, 250, 252];
      const darkGray = [15, 25, 35];
      let currentY = 10;
      // Header background
      doc.setFillColor(darkBlue[0], darkBlue[1], darkBlue[2]);
      doc.rect(0, 0, pageWidth, 50, 'F');
      doc.setFillColor(teal[0], teal[1], teal[2]);
      doc.rect(0, 48, pageWidth, 2, 'F');
      // Logo (left side of header)
      if (logoDataUrl) {
        try {
          doc.addImage(logoDataUrl, 'PNG', 8, 5, 38, 38);
        } catch { /* skip if image format unsupported */ }
      }
      // School name (centred in remaining space)
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(15);
      doc.setFont('helvetica', 'bold');
      doc.text('PROGRESS SECONDARY SCHOOL', pageWidth / 2 + (logoDataUrl ? 8 : 0), 20, { align: 'center' });
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(220, 220, 220);
      doc.text('Academic Report Card', pageWidth / 2 + (logoDataUrl ? 8 : 0), 30, { align: 'center' });
      currentY = 60;
      // Student info
      doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
      doc.roundedRect(15, currentY, pageWidth - 30, 28, 3, 3, 'F');
      doc.setDrawColor(teal[0], teal[1], teal[2]);
      doc.roundedRect(15, currentY, pageWidth - 30, 28, 3, 3, 'S');
      doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text(`Name: ${user?.name || user?.full_name || 'N/A'}`, 20, currentY + 8);
      doc.text(`Reg #: ${regNumber}`, 20, currentY + 15);
      doc.text(`Form: ${report?.form || user?.form || 'N/A'}`, 20, currentY + 22);
      doc.text(`Position: ${classPosition}`, pageWidth - 20, currentY + 8, { align: 'right' });
      doc.text(`Term: ${report?.term || 'N/A'}  |  Year: ${report?.academic_year || new Date().getFullYear()}`, pageWidth - 20, currentY + 15, { align: 'right' });
      currentY += 35;
      // Summary cards
      const cardWidth = (pageWidth - 45) / 3;
      const cardSpacing = 7;
      const summaryY = currentY;
      const cardHeight = 30;
      const cards = [
        { label: 'Average', value: `${avgScore}%` },
        { label: 'Grade',   value: avgGrade.letter },
        {
          label: 'Status',
          value: isUpperForm
            ? (upperResult.grade || '—').toUpperCase()
            : (passedSubjects >= 6 ? 'PASS' : 'FAIL'),
          color: isUpperForm
            ? (upperResult.color === '#c0392b' ? [192, 57, 43] : upperResult.color === '#f39c12' ? [243, 156, 18] : [30, 126, 74])
            : (passedSubjects >= 6 ? [30, 126, 74] : [192, 57, 43]),
        }
      ];
      cards.forEach((card, i) => {
        const x = 15 + i * (cardWidth + cardSpacing);
        doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
        doc.roundedRect(x, summaryY, cardWidth, cardHeight, 3, 3, 'F');
        doc.setDrawColor(teal[0], teal[1], teal[2]);
        doc.roundedRect(x, summaryY, cardWidth, cardHeight, 3, 3, 'S');
        doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.text(card.label, x + 5, summaryY + 8);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(card.color ? card.color[0] : teal[0], card.color ? card.color[1] : teal[1], card.color ? card.color[2] : teal[2]);
        doc.text(card.value, x + 5, summaryY + 24);
      });
      currentY = summaryY + cardHeight + 10;
      // Subjects table
      const tableColumn = isUpperForm ? ["Subject", "Score", "Points", "Grade"] : ["Subject", "Score", "Grade", "Remarks"];
      const tableRows = bestSubjects.map((subject) => {
        const grade = getGradeFromScore(subject.score, report.form);
        if (isUpperForm) return [subject.name, `${subject.score}%`, grade.points + ' pts', grade.letter];
        else return [subject.name, `${subject.score}%`, grade.letter, grade.description];
      });
      if (isUpperForm && totalPoints !== null) {
        const resultColor = upperResult.color === '#c0392b' ? [192,57,43] : upperResult.color === '#f39c12' ? [243,156,18] : [42,157,143];
        tableRows.push([
          { content: `BEST 6 AGGREGATE`, styles: { fontStyle: 'bold', fillColor: [255, 248, 225] } },
          '',
          { content: `${totalPoints} pts`, styles: { fontStyle: 'bold', textColor: resultColor } },
          { content: upperResult.grade, styles: { fontStyle: 'bold', textColor: resultColor } }
        ]);
        tableRows.push([{
          content: upperResult.message,
          colSpan: 4,
          styles: {
            fontStyle: 'bold',
            fillColor: upperResult.status === 'PASS' ? [232,245,233] : [255,235,238],
            textColor: resultColor,
            halign: 'center'
          }
        }]);
      } else {
        tableRows.push([{ content: 'OVERALL AVERAGE', styles: { fontStyle: 'bold', fillColor: [255, 248, 225] } }, { content: `${avgScore}%`, styles: { fontStyle: 'bold', textColor: teal } }, { content: avgGrade.letter, styles: { fontStyle: 'bold', textColor: teal } }, { content: avgGrade.description, styles: { fontStyle: 'bold' } }]);
        // Lower form pass rule row
        const passColor = passedSubjects >= 6 ? [30, 126, 74] : [192, 57, 43];
        tableRows.push([{
          content: `OVERALL RESULT: ${passedSubjects >= 6 ? 'PASS' : 'FAIL'} (${passedSubjects} of ${validSubjects.length} subjects passed with A–D)`,
          colSpan: 4,
          styles: { fontStyle: 'bold', fillColor: passedSubjects >= 6 ? [232, 245, 233] : [255, 235, 238], textColor: passColor, halign: 'center' }
        }]);
      }
      autoTable(doc, {
        startY: currentY,
        margin: { left: 15, right: 15 },
        head: [tableColumn],
        body: tableRows,
        theme: 'grid',
        headStyles: { fillColor: darkBlue, textColor: 255, fontStyle: 'bold', halign: 'center', fontSize: 8, cellPadding: 3 },
        bodyStyles: { textColor: darkGray, fontSize: 7, cellPadding: 2.5 },
        alternateRowStyles: { fillColor: lightGray },
        columnStyles: { 0: { cellWidth: 70, fontStyle: 'bold' }, 1: { halign: 'center', cellWidth: 30 }, 2: { halign: 'center', cellWidth: 30 }, 3: { halign: 'center' } },
      });
      const finalY = doc.lastAutoTable.finalY + 8;
      if (reportRemarks) {
        const wrappedRemarks = doc.splitTextToSize(reportRemarks, pageWidth - 40);
        const remarkHeight = wrappedRemarks.length * 5 + 16;
        const remarkY = finalY + 10;
        if (remarkY + remarkHeight < pageHeight - 18) {
          doc.setFillColor(255, 249, 230);
          doc.roundedRect(15, remarkY, pageWidth - 30, remarkHeight, 3, 3, 'F');
          doc.setDrawColor(42, 157, 143);
          doc.roundedRect(15, remarkY, pageWidth - 30, remarkHeight, 3, 3, 'S');
          doc.setTextColor(42, 157, 143);
          doc.setFontSize(8);
          doc.setFont('helvetica', 'bold');
          doc.text('REMARKS', 20, remarkY + 8);
          doc.setTextColor(15, 25, 35);
          doc.setFontSize(7);
          doc.setFont('helvetica', 'normal');
          doc.text(wrappedRemarks, 20, remarkY + 16);
        }
      }
      // Footer
      doc.setDrawColor(teal[0], teal[1], teal[2]);
      doc.setLineWidth(0.2);
      doc.line(15, pageHeight - 10, pageWidth - 15, pageHeight - 10);
      doc.setFontSize(6);
      doc.setTextColor(150, 150, 150);
      doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, pageHeight - 5, { align: 'center' });
      doc.save(`${user?.name?.replace(/\s+/g, '_') || 'student'}_${report?.term || 'report'}.pdf`);
      toast.success('Report downloaded!');
    } catch (error) {
toast.error('Failed to generate PDF');
    }
  };

  const downloadAttendancePDF = () => {
    if (attendanceRecords.length === 0) {
      toast.error('No attendance records');
      return;
    }
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const darkBlue = [10, 37, 64];
      const teal = [42, 157, 143];
      const lightGray = [248, 250, 252];
      doc.setFillColor(darkBlue[0], darkBlue[1], darkBlue[2]);
      doc.rect(0, 0, pageWidth, 50, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('PROGRESS SECONDARY SCHOOL', pageWidth / 2, 25, { align: 'center' });
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(200, 200, 200);
      doc.text('Attendance Record', pageWidth / 2, 38, { align: 'center' });
      let yPos = 65;
      doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
      doc.roundedRect(20, yPos, pageWidth - 40, 35, 3, 3, 'F');
      doc.setDrawColor(teal[0], teal[1], teal[2]);
      doc.roundedRect(20, yPos, pageWidth - 40, 35, 3, 3, 'S');
      doc.setTextColor(15, 25, 35);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(`Name: ${user?.name || user?.full_name || 'N/A'}`, 25, yPos + 10);
      doc.text(`Registration: ${user?.reg_number || user?.registration_number || 'N/A'}`, 25, yPos + 18);
      doc.text(`Form: ${user?.form || 'N/A'}`, pageWidth - 75, yPos + 10);
      doc.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth - 75, yPos + 18);
      yPos += 45;
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
        headStyles: { fillColor: darkBlue, textColor: 255, fontStyle: 'bold', halign: 'center' },
        alternateRowStyles: { fillColor: lightGray }
      });
      doc.save(`${user?.name?.replace(/\s+/g, '_') || 'student'}_Attendance.pdf`);
      toast.success('Attendance downloaded!');
    } catch (error) {
toast.error('Failed to generate PDF');
    }
  };

  const handleLogout = async () => {
    sessionStorage.removeItem('learnerActiveTab');
    await logout();
    navigate('/');
    toast.success('Logged out');
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

  // --- Report HTML ---
  const getReportHTML = (report) => {
    if (!report || !report.subjects) return '<div>No report data</div>';
    const validSubjects = (report.subjects || []).filter(s => s && s.score !== undefined && s.score !== null);
    const isUpperForm = report.form === 'Form 3' || report.form === 'Form 4';

    // ── Upper form: use the comprehensive result calculator ─────────────────
    const upperResult  = isUpperForm ? calculateUpperFormResult(validSubjects) : null;
    const bestSubjects = isUpperForm ? upperResult.bestSix : validSubjects;
    const totalPoints  = isUpperForm ? upperResult.aggregate : null;

    const avg     = calculateAverage(validSubjects);
    const avgGrade = getGradeFromScore(avg, report.form);
    // Prefer the per-report rank stored in DB; fall back to live leaderboard rank
    const classPosition = report.class_rank
      ? `${report.class_rank}`
      : (currentUserRank ? `${currentUserRank}` : 'N/A');
    // Prefer reg number stored on the report; fall back to auth context
    const regNumber = report.learner_reg_number
      || user?.reg_number
      || user?.registration_number
      || 'N/A';
    const reportRemarks = report.remarks || report.comment || report.teacher_comment || report.principal_comment || 'No remarks provided';

    // Lower form
    const passedSubjectsCount = !isUpperForm ? validSubjects.filter(s => s.score >= 40).length : 0;
    const lowerFormPassed = !isUpperForm && passedSubjectsCount >= 6;
    return `
      <div style="background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(10,37,64,0.1);">
        <div style="background: #0A2540; color: white; padding: 20px;">
          <div style="font-size: 18px; font-weight: 700; color: #2A9D8F;">PROGRESS SECONDARY SCHOOL</div>
          <div style="font-size: 11px; opacity: 0.7;">Scholastica, Excellentia et Disciplina</div>
          <div style="font-size: 10px; opacity: 0.6; margin-top: 4px;">${report.term || 'Report'} · ${report.academic_year || new Date().getFullYear()}</div>
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.1); gap: 24px;">
            <div>
              <div style="font-weight: 600; font-size: 14px;">${user?.name || user?.full_name || 'Unknown'}</div>
              <div style="font-family: monospace; font-size: 10px; opacity: 0.7; margin-top: 2px;">Reg #: ${regNumber}</div>
            </div>
            <div style="text-align: right; font-size: 10px; opacity: 0.85; line-height: 1.7;">
              <div>Class Position: <strong style="font-size: 13px;">${classPosition === 'N/A' ? 'N/A' : classPosition + getOrdinalSuffix(parseInt(classPosition))}</strong></div>
              <div>Term: ${report.term || 'N/A'} · Year: ${report.academic_year || new Date().getFullYear()}</div>
            </div>
          </div>
        </div>
        <div style="padding: 20px;">
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 24px;">
            <div style="background: #F8FAFC; padding: 12px; border-radius: 12px; text-align: center; border: 1px solid #e2e8f0;">
              <div style="font-size: 10px; color: #64748b; font-weight: 600;">AVERAGE</div>
              <div style="font-size: 24px; font-weight: bold; color: #2A9D8F;">${avg}%</div>
            </div>
            <div style="background: #F8FAFC; padding: 12px; border-radius: 12px; text-align: center; border: 1px solid #e2e8f0;">
              <div style="font-size: 10px; color: #64748b; font-weight: 600;">GRADE</div>
              <div style="font-size: 32px; font-weight: bold; color: #2A9D8F;">${avgGrade.letter}</div>
            </div>
              <div style="background: #F8FAFC; padding: 12px; border-radius: 12px; text-align: center; border: 1px solid #e2e8f0;">
              <div style="font-size: 10px; color: #64748b; font-weight: 600;">STATUS</div>
              <div style="font-size: 16px; font-weight: bold; color: ${
                isUpperForm ? upperResult.color : (lowerFormPassed ? '#1e7e4a' : '#c0392b')
              };">
                ${isUpperForm ? upperResult.grade.toUpperCase() : (lowerFormPassed ? 'PASS' : 'FAIL')}
              </div>
              ${isUpperForm
                ? `<div style="font-size: 9px; color: #64748b; margin-top: 3px;">${totalPoints} pts · ${upperResult.bestSix.length} subjects</div>`
                : `<div style="font-size: 9px; color: #64748b; margin-top: 3px;">${passedSubjectsCount}/6 subjects passed</div>`
              }
            </div>
          </div>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: #F1F5F9; border-bottom: 2px solid #CBD5E1;">
                <th style="padding: 10px; text-align: left; font-size: 11px; font-weight: 600;">Subject</th>
                <th style="padding: 10px; text-align: center; font-size: 11px; font-weight: 600;">Score</th>
                <th style="padding: 10px; text-align: center; font-size: 11px; font-weight: 600;">Grade</th>
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
                      <span style="display: inline-block; padding: 2px 8px; border-radius: 6px; font-size: 11px; font-weight: 600; background: ${grade.bgColor}; color: ${grade.color};">${grade.letter}</span>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
          <div style="margin-top: 20px; padding: 14px; background: #FEF9E6; border-radius: 12px; border-left: 4px solid #2A9D8F;">
            <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #2A9D8F; margin-bottom: 4px;">Remarks</div>
            <div style="font-size: 12px; color: #334155;">${reportRemarks}</div>
          </div>
        </div>
      </div>
    `;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: ICE_WHITE }}>
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#00B4D8] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (showQuiz) {
    return (
      <div className="min-h-screen bg-[#F5F2EB]">
        <div className="container mx-auto px-4 py-6">
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

  // --- Main Render ---
  return (
    <div className="min-h-screen bg-[#F5F2EB] font-roboto">
      {/* Header with darker teal (#003B46) - REDESIGNED */}
      <div
        className="w-full sticky top-0 z-30 shadow-[0_10px_30px_rgba(10,37,64,0.18)]"
        style={{
          background: `linear-gradient(135deg, ${HEADER_BG} 0%, #0b4a59 42%, ${NAVBAR_BG} 100%)`
        }}
      >
        <div className="absolute inset-0 opacity-80" style={{ background: 'radial-gradient(circle at top left, rgba(0,180,216,0.22), transparent 30%)' }} />
        <div className="relative container mx-auto px-4 py-3">
          <div className="flex items-center justify-between min-h-[68px]">
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="relative">
                <img
                  src="/schoologo.png"
                  alt="Progress Secondary School logo"
                  className="w-14 h-14 object-contain rounded-2xl bg-white p-1.5 shadow-lg ring-2 ring-white/10"
                />
                <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-[#003B46] bg-[#2A9D8F] text-[9px] font-bold text-white shadow-sm">
                  ✓
                </span>
              </div>
              <div className="hidden sm:block">
                <div className="flex items-center gap-2 text-white/80">
                  <span className="text-[9px] font-bold tracking-[0.24em] uppercase">Learner portal</span>
                </div>
                <h1 className="text-base font-black text-white tracking-[0.16em] leading-tight">PROGRESS</h1>
                <p className="text-[9px] text-white/70 leading-tight">Secondary School</p>
              </div>
            </div>

            <div className="sm:hidden text-center flex-1">
              <h1 className="text-sm font-black text-white tracking-[0.14em]">PROGRESS</h1>
              <p className="text-[8px] text-white/70">Secondary School</p>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="hidden md:flex items-center gap-3 rounded-2xl border border-white/10 bg-white/10 px-3 py-1.5 backdrop-blur-sm shadow-sm">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#2A9D8F] to-[#00B4D8] shadow-inner">
                  <UserCircleIcon className="h-4 w-4 text-white" />
                </div>
                <div>
                  <div className="text-[11px] font-semibold text-white truncate max-w-[120px]">{getUserName()}</div>
                  <div className="text-[9px] text-white/70">Student · {user?.form || 'Form 1'}</div>
                </div>
              </div>

              <div className="relative" ref={notificationRef}>
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-white shadow-sm transition hover:bg-white/20"
                >
                  <BellIcon className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white ring-2 ring-[#003B46]">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-gray-200 bg-white shadow-2xl z-50 overflow-hidden">
                    <div className="border-b border-gray-200 bg-gray-50 px-4 py-3 font-semibold text-gray-700 text-sm">Notifications</div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="px-4 py-6 text-center text-gray-500 text-sm">No notifications</div>
                      ) : (
                        notifications.map(notif => (
                          <div
                            key={notif.id}
                            className={`cursor-pointer border-b border-gray-100 px-4 py-3 transition hover:bg-gray-50 ${!notif.is_read ? 'bg-blue-50/60' : ''}`}
                            onClick={() => {
                              markAsRead(notif.id);
                              setShowNotifications(false);
                            }}
                          >
                            <div className="font-medium text-gray-800 text-sm">{notif.title}</div>
                            <div className="mt-0.5 text-xs text-gray-500">{notif.message}</div>
                            <div className="mt-1 text-[11px] text-gray-400">{new Date(notif.created_at).toLocaleString()}</div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              <MobileMenuButton isOpen={mobileMenuOpen} onClick={() => setMobileMenuOpen(!mobileMenuOpen)} />
              <button
                onClick={handleLogout}
                className="hidden sm:flex items-center gap-1.5 rounded-xl bg-red-600/95 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-red-700"
              >
                <ArrowRightOnRectangleIcon className="h-3.5 w-3.5" />
                <span>Logout</span>
              </button>
            </div>
          </div>

          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="inline-flex items-center rounded-full border border-[#7DE3FF]/30 bg-white/5 px-2.5 py-1 text-[10px] font-bold tracking-[0.2em] text-[#7DE3FF]">
                LEARNER PORTAL
              </div>
              <h2 className="mt-2 text-xl font-bold text-white sm:text-2xl">Hello, {getUserName()} <span className="text-[#7DE3FF]">👋</span></h2>
              <p className="text-sm text-white/75">{getGreeting()}! Welcome back to your dashboard.</p>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <div className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-right backdrop-blur-sm">
                <div className="text-[9px] uppercase tracking-[0.18em] text-white/70">Form</div>
                <div className="text-sm font-bold text-white">{user?.form || 'Form 1'}</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-right backdrop-blur-sm">
                <div className="text-[9px] uppercase tracking-[0.18em] text-white/70">Status</div>
                <div className="text-sm font-bold text-[#7DE3FF]">Active</div>
              </div>
            </div>
          </div>
        </div>
        {/* Desktop Navigation - lighter teal (#006770) */}
        <div className="hidden lg:block" style={{ background: NAVBAR_BG, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <div className="container mx-auto px-4">
            <div className="flex gap-1 py-2">
              <NavItem icon={<HomeIcon className="w-5 h-5" />} label="Overview" isActive={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
              <NavItem icon={<AcademicCapIcon className="w-5 h-5" />} label="Learning" isActive={activeTab === 'learning'} onClick={() => setActiveTab('learning')} />
              <NavItem icon={<DocumentTextIcon className="w-5 h-5" />} label="Reports" isActive={activeTab === 'reports'} onClick={() => setActiveTab('reports')} />
              <NavItem icon={<CalendarIcon className="w-5 h-5" />} label="Attendance" isActive={activeTab === 'attendance'} onClick={() => setActiveTab('attendance')} />
              <NavItem icon={<TrophyIcon className="w-5 h-5" />} label="Leaderboard" isActive={activeTab === 'leaderboard'} onClick={() => setActiveTab('leaderboard')} />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
          <div className="fixed top-0 right-0 h-full w-64 bg-white shadow-xl">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <img
                  src="/schoologo.png"
                  alt="Progress Secondary School logo"
                  className="w-12 h-12 object-contain rounded-xl bg-white p-1"
                />
                <div>
                  <div className="font-bold text-[#0A2540]">PROGRESS</div>
                  <div className="text-xs text-gray-500">Secondary School</div>
                </div>
              </div>
            </div>
            <div className="p-2">
              <button onClick={() => { setActiveTab('overview'); setMobileMenuOpen(false); }} className={`w-full text-left px-3 py-2.5 rounded-lg mb-1 transition ${activeTab === 'overview' ? 'bg-[#2A9D8F] text-white' : 'text-gray-700 hover:bg-gray-100'}`}>
                <HomeIcon className="w-4 h-4 inline mr-2" /> Overview
              </button>
              <button onClick={() => { setActiveTab('learning'); setMobileMenuOpen(false); }} className={`w-full text-left px-3 py-2.5 rounded-lg mb-1 transition ${activeTab === 'learning' ? 'bg-[#2A9D8F] text-white' : 'text-gray-700 hover:bg-gray-100'}`}>
                <AcademicCapIcon className="w-4 h-4 inline mr-2" /> Learning
              </button>
              <button onClick={() => { setActiveTab('reports'); setMobileMenuOpen(false); }} className={`w-full text-left px-3 py-2.5 rounded-lg mb-1 transition ${activeTab === 'reports' ? 'bg-[#2A9D8F] text-white' : 'text-gray-700 hover:bg-gray-100'}`}>
                <DocumentTextIcon className="w-4 h-4 inline mr-2" /> Reports
              </button>
              <button onClick={() => { setActiveTab('attendance'); setMobileMenuOpen(false); }} className={`w-full text-left px-3 py-2.5 rounded-lg mb-1 transition ${activeTab === 'attendance' ? 'bg-[#2A9D8F] text-white' : 'text-gray-700 hover:bg-gray-100'}`}>
                <CalendarIcon className="w-4 h-4 inline mr-2" /> Attendance
              </button>
              <button onClick={() => { setActiveTab('leaderboard'); setMobileMenuOpen(false); }} className={`w-full text-left px-3 py-2.5 rounded-lg mb-1 transition ${activeTab === 'leaderboard' ? 'bg-[#2A9D8F] text-white' : 'text-gray-700 hover:bg-gray-100'}`}>
                <TrophyIcon className="w-4 h-4 inline mr-2" /> Leaderboard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Cards - using Heroicons instead of emojis */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatCard icon={<DocumentTextIcon className="w-5 h-5" />} value={stats.reportsCount} label="Reports" color={TEAL_ACCENT} />
              <StatCard icon={<CalendarIcon className="w-5 h-5" />} value={stats.attendanceRate} label="Attendance" color={AZURE_ACCENT} />
              <StatCard icon={<ChartBarIcon className="w-5 h-5" />} value={stats.averageScore} label="Average" color={TEAL_ACCENT} />
              <StatCard icon={<BookOpenIcon className="w-5 h-5" />} value={stats.quizzesCompleted} label="Quizzes" color="#6C63FF" />
            </div>

            {/* Two-column layout: Report + Side panel */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Latest Report */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm overflow-hidden">
                  <div className="px-5 py-3 border-b border-[#e2e8f0] flex items-center justify-between">
                    <h2 className="text-lg font-bold text-[#0A2540] flex items-center gap-2">
                      <DocumentTextIcon className="w-5 h-5 text-[#2A9D8F]" />
                      Current Report
                    </h2>
                    {latestReport && (
                      <button
                        onClick={() => downloadReportPDF(latestReport)}
                        className="p-2 text-[#2A9D8F] hover:bg-[#2A9D8F]/10 rounded-lg transition"
                      >
                        <ArrowDownTrayIcon className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                  <div className="p-5">
                    {latestReport && latestReport.subjects?.length > 0 ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-4">
                          <div className="bg-[#F8FAFC] p-3 rounded-xl border border-[#e2e8f0]">
                            <p className="text-xs text-gray-500">Subjects</p>
                            <p className="text-2xl font-bold text-[#0A2540]">{latestReport.subjects.length}</p>
                          </div>
                          <div className="bg-[#F8FAFC] p-3 rounded-xl border border-[#e2e8f0]">
                            <p className="text-xs text-gray-500">Average</p>
                            <p className="text-2xl font-bold text-[#2A9D8F]">{calculateAverage(latestReport.subjects)}%</p>
                          </div>
                          <div className="bg-[#F8FAFC] p-3 rounded-xl border border-[#e2e8f0]">
                            <p className="text-xs text-gray-500">Year</p>
                            <p className="text-2xl font-bold text-[#0A2540]">{latestReport.academic_year || new Date().getFullYear()}</p>
                          </div>
                        </div>
                        <div className="bg-[#F8FAFC] rounded-xl p-4 border border-[#e2e8f0]">
                          <h3 className="text-sm font-medium text-[#0A2540] mb-3">Subject Performance</h3>
                          <div className="space-y-3">
                            {latestReport.subjects.slice(0, 5).map((subject, idx) => {
                              const grade = getGradeFromScore(subject.score, latestReport.form);
                              return (
                                <div key={idx} className="flex items-center">
                                  <span className="text-sm text-gray-700 w-24 truncate">{subject.name}</span>
                                  <div className="flex-1 mx-3">
                                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                      <div className="h-full rounded-full" style={{ width: `${subject.score}%`, background: `linear-gradient(90deg, ${grade.color}80, ${grade.color})` }} />
                                    </div>
                                  </div>
                                  <span className="font-mono text-sm font-bold" style={{ color: grade.color }}>{subject.score}%</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                        <button
                          onClick={() => setActiveTab('reports')}
                          className="w-full py-2 text-sm text-[#2A9D8F] font-medium bg-[#2A9D8F]/5 hover:bg-[#2A9D8F]/10 rounded-lg border border-[#e2e8f0] hover:border-[#2A9D8F]/60 transition flex items-center justify-center gap-2"
                        >
                          View All Reports →
                        </button>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 mx-auto mb-3 bg-[#2A9D8F]/5 rounded-full flex items-center justify-center border-2 border-[#e2e8f0]">
                          <DocumentTextIcon className="w-8 h-8 text-[#2A9D8F]" />
                        </div>
                        <p className="font-medium text-[#0A2540]">No Report Card Available</p>
                        <p className="text-sm text-gray-500">Check back after your next assessment.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Side Panel */}
              <div className="space-y-5">
                {/* Quick Actions */}
                <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm overflow-hidden">
                  <div className="px-4 py-3 border-b border-[#e2e8f0]">
                    <h2 className="text-lg font-bold text-[#0A2540] flex items-center gap-2">
                      <SparklesIcon className="w-5 h-5 text-[#2A9D8F]" />
                      Quick Actions
                    </h2>
                  </div>
                  <div className="p-4 space-y-3">
                    <button onClick={() => setActiveTab('learning')} className="w-full text-left p-3 bg-purple-50 rounded-xl hover:bg-purple-100 transition border border-purple-200">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                          <AcademicCapIcon className="w-4 h-4 text-purple-600" />
                        </div>
                        <span className="text-sm font-medium text-purple-700">Learning Space</span>
                      </div>
                    </button>
                    <button onClick={() => setActiveTab('reports')} className="w-full text-left p-3 bg-[#F8FAFC] rounded-xl hover:bg-[#e2e8f0] transition border border-[#e2e8f0]">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-[#2A9D8F]/10 rounded-lg flex items-center justify-center">
                          <DocumentTextIcon className="w-4 h-4 text-[#2A9D8F]" />
                        </div>
                        <span className="text-sm font-medium text-[#0A2540]">All Reports</span>
                      </div>
                    </button>
                    {stats.reportsCount > 0 && latestReport && (
                      <button onClick={() => downloadReportPDF(latestReport)} className="w-full text-left p-3 bg-[#2A9D8F]/5 rounded-xl hover:bg-[#2A9D8F]/10 transition border border-[#2A9D8F]/30">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-[#2A9D8F] rounded-lg flex items-center justify-center">
                            <ArrowDownTrayIcon className="w-4 h-4 text-white" />
                          </div>
                          <span className="text-sm font-medium text-[#2A9D8F]">Download Latest Report</span>
                        </div>
                      </button>
                    )}
                  </div>
                </div>

                {/* Attendance Summary */}
                <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm overflow-hidden">
                  <div className="px-4 py-3 border-b border-[#e2e8f0] flex justify-between items-center">
                    <h2 className="text-lg font-bold text-[#0A2540] flex items-center gap-2">
                      <ChartBarIcon className="w-5 h-5 text-[#2A9D8F]" />
                      Attendance
                    </h2>
                    {attendanceRecords.length > 0 && (
                      <button onClick={downloadAttendancePDF} className="p-2 text-[#2A9D8F] hover:bg-[#2A9D8F]/10 rounded-lg transition">
                        <ArrowDownTrayIcon className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="text-center mb-4">
                      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full border-4 border-[#2A9D8F]/20">
                        <span className="text-2xl font-bold text-[#2A9D8F]">{stats.attendanceRate}</span>
                      </div>
                    </div>
                    {stats.totalDays > 0 ? (
                      <div className="grid grid-cols-3 gap-3">
                        <div className="text-center p-2 bg-green-50 rounded-xl border border-green-200">
                          <div className="text-green-600 font-bold text-lg">{stats.presentCount}</div>
                          <div className="text-xs text-gray-500">Present</div>
                        </div>
                        <div className="text-center p-2 bg-[#2A9D8F]/5 rounded-xl border border-[#e2e8f0]">
                          <div className="text-[#2A9D8F] font-bold text-lg">{stats.lateCount}</div>
                          <div className="text-xs text-gray-500">Late</div>
                        </div>
                        <div className="text-center p-2 bg-red-50 rounded-xl border border-red-200">
                          <div className="text-red-600 font-bold text-lg">{stats.absentCount}</div>
                          <div className="text-xs text-gray-500">Absent</div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 text-center">No attendance records yet</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Learning Space Tab */}
        {activeTab === 'learning' && (
          <LearningSpace onStartQuiz={(quizId) => setShowQuiz(quizId)} />
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h1 className="text-2xl font-bold text-[#0A2540]">Report Cards</h1>
                <p className="text-sm text-gray-500">Your academic performance overview</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {availableYears.length > 0 && (
                  <select value={selectedYear || ''} onChange={(e) => setSelectedYear(e.target.value ? parseInt(e.target.value) : null)} className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-[#2A9D8F] focus:border-transparent">
                    <option value="">All Years</option>
                    {availableYears.map(year => <option key={year} value={year}>{year}</option>)}
                  </select>
                )}
                {availableAssessments.length > 0 && (
                  <select value={selectedAssessment || ''} onChange={(e) => setSelectedAssessment(e.target.value || null)} className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-[#2A9D8F] focus:border-transparent">
                    <option value="">All Assessments</option>
                    {availableAssessments.map(assessment => <option key={assessment} value={assessment}>{assessment}</option>)}
                  </select>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filteredReports && filteredReports.length > 0 ? (
                filteredReports.map(report => {
                  const validSubjects = (report.subjects || []).filter(s => s && s.score !== undefined && s.score !== null);
                  const avg = calculateAverage(validSubjects);
                  const grade = getGradeFromScore(avg, report.form);
                  return (
                    <div key={report.id} className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm overflow-hidden hover:shadow transition">
                      <div className="p-4 border-b border-[#e2e8f0] flex justify-between items-center">
                        <div>
                          <span className="font-bold text-[#0A2540]">{report.term || 'Report'}</span>
                          <span className="ml-2 px-2 py-0.5 bg-[#2A9D8F]/10 text-[#2A9D8F] text-xs rounded-full">{report.form || user?.form}</span>
                          <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">{report.academic_year}</span>
                        </div>
                        <span className="text-sm font-bold" style={{ color: grade.color }}>{avg}% ({grade.letter})</span>
                      </div>
                      <div className="p-4">
                        <div className="space-y-2">
                          {validSubjects.slice(0, 4).map((s, idx) => {
                            const g = getGradeFromScore(s.score, report.form);
                            return (
                              <div key={idx} className="flex justify-between text-sm">
                                <span>{s.name}</span>
                                <span style={{ color: g.color }} className="font-mono font-medium">{s.score}% ({g.letter})</span>
                              </div>
                            );
                          })}
                          {validSubjects.length > 4 && <div className="text-xs text-gray-400 text-center">+{validSubjects.length - 4} more</div>}
                        </div>
                        <div className="mt-4 flex gap-2">
                          <button onClick={() => handleViewReport(report)} className="flex-1 px-3 py-1.5 border border-[#2A9D8F] text-[#2A9D8F] rounded-lg text-sm hover:bg-[#2A9D8F]/10 transition">Preview</button>
                          <button onClick={() => downloadReportPDF(report)} className="flex-1 px-3 py-1.5 bg-[#0A2540] text-white rounded-lg text-sm hover:bg-[#1E3A5F] transition">PDF</button>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-2 text-center py-10 bg-white rounded-xl border border-[#e2e8f0]">
                  <DocumentTextIcon className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">No reports available</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Attendance Tab */}
        {activeTab === 'attendance' && (
          <div className="space-y-5">
            <div>
              <h1 className="text-2xl font-bold text-[#0A2540]">Attendance Records</h1>
              <p className="text-sm text-gray-500">Your daily attendance history</p>
            </div>
            <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-[#e2e8f0] flex justify-between items-center">
                <h2 className="font-semibold text-[#0A2540] flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5" />
                  Attendance Log
                </h2>
                {attendanceRecords.length > 0 && (
                  <button onClick={downloadAttendancePDF} className="px-3 py-1.5 text-sm bg-[#2A9D8F] text-white rounded-lg hover:bg-[#1e6b60] transition">PDF</button>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[400px]">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">Day</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {attendanceRecords.length > 0 ? (
                      [...attendanceRecords].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 15).map(record => (
                        <tr key={record.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm">{new Date(record.date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}</td>
                          <td className="px-4 py-3 text-sm hidden sm:table-cell">{new Date(record.date).toLocaleDateString('en', { weekday: 'short' })}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
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
                      <tr><td colSpan="3" className="px-4 py-6 text-center text-gray-500">No attendance records yet</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Leaderboard Tab */}
        {activeTab === 'leaderboard' && (
          <div className="space-y-5">
            <div>
              <h1 className="text-2xl font-bold text-[#0A2540]">Class Leaderboard</h1>
              <p className="text-sm text-gray-500">See how you rank against your classmates</p>
            </div>
            {leaderboardLoading ? (
              <div className="bg-white rounded-xl border border-[#e2e8f0] p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2A9D8F] mx-auto mb-4"></div>
                <p className="text-gray-500">Loading leaderboard...</p>
              </div>
            ) : leaderboard.length === 0 ? (
              <div className="bg-white rounded-xl border border-[#e2e8f0] p-8 text-center">
                <TrophyIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No leaderboard data available yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {currentUserRank && (
                  <div className="bg-gradient-to-r from-[#2A9D8F] to-[#1e6b60] text-white rounded-xl p-5 shadow-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-lg mb-1">Your Rank</h3>
                        <div className="flex items-center gap-2">
                          <span className="text-3xl font-bold">#{currentUserRank}</span>
                          <span className="text-sm opacity-90">of {leaderboard.length} students</span>
                        </div>
                      </div>
                      <TrophyIcon className="w-10 h-10 opacity-80" />
                    </div>
                  </div>
                )}
                <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm overflow-hidden">
                  <div className="px-5 py-3 border-b border-[#e2e8f0]">
                    <h2 className="font-semibold text-[#0A2540] flex items-center gap-2">
                      <ChartBarIcon className="w-5 h-5" />
                      Rankings
                    </h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[600px]">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Rank</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Student</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Quiz</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Report</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Attendance</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Overall</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {leaderboard.map((student) => (
                          <tr key={student.id} className={`hover:bg-gray-50 ${student.id === user?.id ? 'bg-[#2A9D8F]/5 border-l-4 border-l-[#2A9D8F]' : ''}`}>
                            <td className="px-4 py-3">
                              <span className="text-sm font-semibold text-gray-600">#{student.rank}</span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="font-medium text-sm text-gray-900">{student.name}</div>
                              <div className="text-xs text-gray-500">{student.reg_number}</div>
                            </td>
                            <td className="px-4 py-3 text-sm font-semibold">{student.quiz_score}%</td>
                            <td className="px-4 py-3 text-sm font-semibold">{student.report_score}%</td>
                            <td className="px-4 py-3 text-sm font-semibold">{student.attendance_rate}%</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                student.overall_score >= 80 ? 'bg-green-100 text-green-700' :
                                student.overall_score >= 60 ? 'bg-blue-100 text-blue-700' :
                                student.overall_score >= 40 ? 'bg-yellow-100 text-yellow-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {student.overall_score}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Report Modal */}
      {showReportModal && selectedReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowReportModal(false)}>
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div dangerouslySetInnerHTML={{ __html: getReportHTML(selectedReport) }} />
            <div className="mt-4 flex justify-end">
              <button onClick={() => setShowReportModal(false)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition text-sm">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Router: Form 3/4 → UpperFormDashboard, Form 1/2 → LowerFormDashboard
export default function LearnerDashboard() {
  const { user } = useAuth();
  const isUpperForm = user?.form === 'Form 3' || user?.form === 'Form 4';
  return isUpperForm ? <UpperFormDashboard /> : <LowerFormDashboard />;
}
