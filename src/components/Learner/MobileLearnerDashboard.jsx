import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import LearningSpace from './LearningSpace';
import Library from '../Library';
import QuizList from './QuizList';
import QuizTaking from './QuizTaking';
import {
  ArrowRightOnRectangleIcon,
  AcademicCapIcon,
  ChartBarIcon,
  DocumentTextIcon,
  HomeIcon,
  UserCircleIcon,
  BookOpenIcon,
  ClipboardDocumentCheckIcon,
  BellIcon,
} from '@heroicons/react/24/outline';

const getAverage = (subjects = []) => {
  const scores = subjects
    .map(subject => Number(subject?.score))
    .filter(score => Number.isFinite(score));
  return scores.length ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : '—';
};

const getGrade = (score, form) => {
  if (form === 'Form 3' || form === 'Form 4') {
    if (score >= 85) return { letter: 'A*', points: 1, description: 'Distinction' };
    if (score >= 75) return { letter: 'A', points: 2, description: 'Distinction' };
    if (score >= 65) return { letter: 'B', points: 3, description: 'Credit' };
    if (score >= 56) return { letter: 'C', points: 4, description: 'Credit' };
    if (score >= 50) return { letter: 'D', points: 5, description: 'Credit' };
    if (score >= 45) return { letter: 'E', points: 6, description: 'Pass' };
    if (score >= 40) return { letter: 'F', points: 7, description: 'Pass' };
    if (score >= 35) return { letter: 'G', points: 8, description: 'Pass' };
    return { letter: 'U', points: 9, description: 'Fail' };
  }
  if (score >= 75) return { letter: 'A', description: 'Excellent' };
  if (score >= 65) return { letter: 'B', description: 'Very good' };
  if (score >= 55) return { letter: 'C', description: 'Good' };
  if (score >= 40) return { letter: 'D', description: 'Pass' };
  return { letter: 'F', description: 'Need improvement' };
};

const quickLinks = [
  { tab: 'learning', title: 'Learn', description: 'Open your lessons', Icon: BookOpenIcon, theme: 'teal' },
  { tab: 'quizzes', title: 'Quizzes', description: 'Practice with assessments', Icon: ClipboardDocumentCheckIcon, theme: 'gold' },
  { tab: 'library', title: 'Library', description: 'Explore your books', Icon: AcademicCapIcon, theme: 'gold' },
  { tab: 'reports', title: 'Results', description: 'Review your progress', Icon: ChartBarIcon, theme: 'teal' },
];

export default function MobileLearnerDashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [reports, setReports] = useState([]);
  const [attendance, setAttendance] = useState({ stats: {}, records: [] });
  const [showQuiz, setShowQuiz] = useState(null);
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedAssessment, setSelectedAssessment] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [reportsResponse, attendanceResponse] = await Promise.all([
        api.get('/api/learner/reports'),
        api.get('/api/learner/attendance')
      ]);

      const reportsPayload = reportsResponse.data;
      const reportsData = Array.isArray(reportsPayload)
        ? reportsPayload
        : reportsPayload?.data || reportsPayload?.reports || [];
      const attendancePayload = attendanceResponse.data?.data || attendanceResponse.data || {};

      setReports(reportsData);
      setAttendance({
        stats: attendancePayload.stats || {},
        records: attendancePayload.records || (Array.isArray(attendancePayload) ? attendancePayload : [])
      });
    } catch (error) {
toast.error('Could not load dashboard data');
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const fetchNotifications = useCallback(async () => {
    try {
      const response = await api.get('/api/learner/notifications');
      if (response.data.success) {
        const nextNotifications = response.data.notifications || [];
        setNotifications(nextNotifications);
        setUnreadCount(nextNotifications.filter(notification => !notification.is_read).length);
      }
    } catch (error) {
      toast.error('Could not load notifications');
    }
  }, []);

  const markNotificationAsRead = async (id) => {
    try {
      await api.put(`/api/learner/notifications/${id}/read`);
      await fetchNotifications();
    } catch (error) {
      toast.error('Could not mark notification as read');
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const handleLogout = () => {
    logout();
  };

  const attendanceRate = attendance.stats?.visits ?? attendance.stats?.total ?? 0;
  const availableYears = useMemo(
    () => [...new Set(reports.map(report => report.academic_year || (report.created_at ? new Date(report.created_at).getFullYear() : null)).filter(Boolean))].sort((a, b) => b - a),
    [reports]
  );
  const availableAssessments = useMemo(
    () => [...new Set(reports.map(report => report.term).filter(Boolean))].sort(),
    [reports]
  );
  const filteredReports = useMemo(() => reports.filter(report => {
    const reportYear = report.academic_year || (report.created_at ? new Date(report.created_at).getFullYear() : null);
    return (!selectedYear || String(reportYear) === String(selectedYear))
      && (!selectedAssessment || report.term === selectedAssessment);
  }), [reports, selectedYear, selectedAssessment]);

  const resultsCategories = useMemo(() => [
    {
      id: 'term-1',
      label: 'Term 1',
      matcher: report => /term\s*1/i.test(report?.term || '') || /term\s*one/i.test(report?.term || '')
    },
    {
      id: 'term-2',
      label: 'Term 2',
      matcher: report => /term\s*2/i.test(report?.term || '') || /term\s*two/i.test(report?.term || '')
    },
    {
      id: 'term-3',
      label: 'Term 3',
      matcher: report => /term\s*3/i.test(report?.term || '') || /term\s*three/i.test(report?.term || '')
    },
    {
      id: 'tests',
      label: 'Tests',
      matcher: report => /tests?|test\s*sa|test\s*sa/i.test(report?.term || '') || /tests?|test\s*sa|test\s*sa/i.test(report?.assessment || '') || /tests?|test\s*sa|test\s*sa/i.test(report?.name || '')
    }
  ], []);

  const [selectedResultCategory, setSelectedResultCategory] = useState(null);

  const selectedCategoryReports = useMemo(() => {
    if (!selectedResultCategory) return [];
    const category = resultsCategories.find(item => item.id === selectedResultCategory);
    if (!category) return [];
    return filteredReports.filter(category.matcher);
  }, [filteredReports, resultsCategories, selectedResultCategory]);

  const latestReport = filteredReports[0];
  const latestAverage = latestReport ? `${getAverage(latestReport.subjects)}%` : '—';
  const downloadReportPDF = async (report) => {
    if (!report?.subjects?.length) {
      toast.error('No report data');
      return;
    }

    try {
      let logoDataUrl = null;
      try {
        const response = await fetch('/schoologo.png');
        const blob = await response.blob();
        logoDataUrl = await new Promise(resolve => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(blob);
        });
      } catch (error) {
}

      const subjects = (report.subjects || []).filter(subject => subject && subject.score !== undefined && subject.score !== null);
      const isUpperForm = report.form === 'Form 3' || report.form === 'Form 4';
      const average = getAverage(subjects);
      const grades = subjects.map(subject => ({ ...subject, grade: getGrade(Number(subject.score), report.form) }));
      const english = grades.find(subject => subject.name?.toLowerCase().includes('english'));
      const bestSubjects = isUpperForm
        ? (english ? [english, ...grades.filter(subject => subject !== english).sort((a, b) => a.grade.points - b.grade.points).slice(0, 5)] : grades.sort((a, b) => a.grade.points - b.grade.points).slice(0, 6)).slice(0, 6)
        : grades;
      const totalPoints = isUpperForm ? bestSubjects.reduce((sum, subject) => sum + subject.grade.points, 0) : null;
      const status = isUpperForm
        ? (english && Number(english.score) < 35 ? 'FAIL' : totalPoints <= 2 ? 'DISTINCTION' : totalPoints <= 5 ? 'CREDIT' : totalPoints <= 8 ? 'PASS' : 'FAIL')
        : subjects.filter(subject => Number(subject.score) >= 40).length >= 6 ? 'PASS' : 'FAIL';
      const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const darkBlue = [10, 37, 64];
      const teal = [0, 95, 123];
      const lightGray = [248, 250, 252];
      const darkGray = [15, 25, 35];
      doc.setFillColor(...darkBlue);
      doc.rect(0, 0, pageWidth, 50, 'F');
      doc.setFillColor(...teal);
      doc.rect(0, 48, pageWidth, 2, 'F');
      if (logoDataUrl) {
        try {
          doc.addImage(logoDataUrl, 'PNG', 8, 5, 38, 38);
        } catch (error) {
}
      }
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(15);
      doc.setFont('helvetica', 'bold');
      const headerCenter = pageWidth / 2 + (logoDataUrl ? 8 : 0);
      doc.text('PROGRESS SECONDARY SCHOOL', headerCenter, 20, { align: 'center' });
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(220, 220, 220);
      doc.text('Academic Report Card', headerCenter, 30, { align: 'center' });
      let currentY = 60;
      doc.setFillColor(...lightGray);
      doc.roundedRect(15, currentY, pageWidth - 30, 28, 3, 3, 'F');
      doc.setDrawColor(...teal);
      doc.roundedRect(15, currentY, pageWidth - 30, 28, 3, 3, 'S');
      doc.setTextColor(...darkGray);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text(`Name: ${user?.name || 'N/A'}`, 20, currentY + 8);
      doc.text(`Registration: ${user?.reg_number || user?.registration_number || 'N/A'}`, 20, currentY + 15);
      doc.text(`Form: ${report.form || user?.form || 'N/A'}`, 20, currentY + 22);
      doc.text(`Class Position: N/A`, pageWidth - 20, currentY + 8, { align: 'right' });
      doc.text(`Term: ${report.term || 'N/A'}  |  Year: ${report.academic_year || new Date().getFullYear()}`, pageWidth - 20, currentY + 15, { align: 'right' });
      currentY += 35;
      const cardWidth = (pageWidth - 45) / 3;
      ['Average', 'Grade', 'Status'].forEach((label, index) => {
        const x = 15 + index * (cardWidth + 7);
        doc.setFillColor(...lightGray);
        doc.roundedRect(x, currentY, cardWidth, 30, 3, 3, 'F');
        doc.setDrawColor(...teal);
        doc.roundedRect(x, currentY, cardWidth, 30, 3, 3, 'S');
        doc.setTextColor(...darkGray);
        doc.setFontSize(7);
        doc.text(label, x + 5, currentY + 8);
        doc.setFontSize(16);
        doc.setTextColor(...teal);
        const value = index === 0 ? `${average}%` : index === 1 ? getGrade(Number(average), report.form).letter : status;
        doc.text(value, x + 5, currentY + 24);
      });
      currentY += 40;
      const tableColumn = isUpperForm ? ['Subject', 'Score', 'Points', 'Grade'] : ['Subject', 'Score', 'Grade', 'Remarks'];
      const tableRows = bestSubjects.map(subject => isUpperForm
        ? [subject.name, `${subject.score}%`, `${subject.grade.points} pts`, subject.grade.letter]
        : [subject.name, `${subject.score}%`, subject.grade.letter, subject.grade.description]);
      if (isUpperForm) {
        tableRows.push([{ content: 'BEST 6 AGGREGATE', styles: { fontStyle: 'bold', fillColor: [255, 248, 225] } }, '', { content: `${totalPoints} pts`, styles: { fontStyle: 'bold', textColor: teal } }, { content: status, styles: { fontStyle: 'bold', textColor: teal } }]);
        tableRows.push([{ content: status === 'PASS' ? 'Pass - Satisfactory Performance' : 'Fail - Needs Improvement', colSpan: 4, styles: { fontStyle: 'bold', halign: 'center', textColor: status === 'PASS' ? [30, 126, 74] : [192, 57, 43] } }]);
      } else {
        tableRows.push([{ content: 'OVERALL AVERAGE', styles: { fontStyle: 'bold', fillColor: [255, 248, 225] } }, { content: `${average}%`, styles: { fontStyle: 'bold', textColor: teal } }, { content: getGrade(Number(average), report.form).letter, styles: { fontStyle: 'bold', textColor: teal } }, { content: getGrade(Number(average), report.form).description, styles: { fontStyle: 'bold' } }]);
        tableRows.push([{ content: `OVERALL RESULT: ${status} (${subjects.filter(subject => Number(subject.score) >= 40).length} of ${subjects.length} subjects passed with A–D)`, colSpan: 4, styles: { fontStyle: 'bold', halign: 'center', textColor: status === 'PASS' ? [30, 126, 74] : [192, 57, 43] } }]);
      }
      autoTable(doc, { startY: currentY, margin: { left: 15, right: 15 }, head: [tableColumn], body: tableRows, theme: 'grid', headStyles: { fillColor: darkBlue, textColor: 255, fontStyle: 'bold', halign: 'center', fontSize: 8, cellPadding: 3 }, bodyStyles: { textColor: darkGray, fontSize: 7, cellPadding: 2.5 }, alternateRowStyles: { fillColor: lightGray }, columnStyles: { 0: { cellWidth: 70, fontStyle: 'bold' }, 1: { halign: 'center', cellWidth: 30 }, 2: { halign: 'center', cellWidth: 30 }, 3: { halign: 'center' } } });
      const remarks = report.remarks || report.comment || report.teacher_comment || report.principal_comment || '';
      if (remarks) {
        const remarkY = doc.lastAutoTable.finalY + 10;
        doc.setFillColor(255, 249, 230);
        doc.roundedRect(15, remarkY, pageWidth - 30, 20, 3, 3, 'F');
        doc.setDrawColor(...teal);
        doc.roundedRect(15, remarkY, pageWidth - 30, 20, 3, 3, 'S');
        doc.setTextColor(...teal);
        doc.setFontSize(8);
        doc.text('REMARKS', 20, remarkY + 8);
        doc.setTextColor(...darkGray);
        doc.setFontSize(7);
        doc.text(doc.splitTextToSize(remarks, pageWidth - 40), 20, remarkY + 15);
      }
      doc.setDrawColor(...teal);
      doc.line(15, pageHeight - 10, pageWidth - 15, pageHeight - 10);
      doc.setFontSize(6);
      doc.setTextColor(150, 150, 150);
      doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, pageHeight - 5, { align: 'center' });
      doc.save(`${user?.name?.replace(/\s+/g, '_') || 'student'}_${report?.term || 'report'}.pdf`);
      toast.success('Report downloaded!');
      return;
    } catch (error) {
toast.error('Could not create PDF');
    }
  };

  if (showQuiz) {
    return (
      <QuizTaking
        quizId={showQuiz}
        onComplete={() => setShowQuiz(null)}
        onExit={() => setShowQuiz(null)}
      />
    );
  }

  return (
    <div className="learner-dashboard-shell mx-auto min-h-screen w-full max-w-[520px] overflow-x-hidden bg-[#F2FBFC] pb-24 text-[#073F43] shadow-[0_0_35px_rgba(0,91,96,0.10)]">
      <header className="relative z-30 w-full overflow-hidden bg-[#00676B] shadow-lg">
        <div className="relative w-full">
          <img
            src="/image.png"
            alt="Two learners reading together"
            className="block h-auto w-full"
          />

          <div className="absolute inset-x-0 top-[3%] flex items-center justify-between gap-1 px-[4%] text-white">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className="min-w-0 text-left text-[9px] font-black leading-tight drop-shadow"
              aria-label="My Learning Space home"
            >
              My Learning
              <br />
              Space
            </button>

            <div className="mx-1 h-7 w-px shrink-0 bg-white/80" />

            <h1 className="min-w-0 flex-1 text-center text-[10px] font-black leading-tight drop-shadow">
              Learner Dashboard
            </h1>

            <div className="relative">
              <button
                type="button"
                onClick={() => setShowNotifications(current => !current)}
                aria-label="Notifications"
                className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#25D2CE] bg-[#004F54]/80 text-[#FFD84D]"
              >
                <BellIcon className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              {showNotifications && (
                <div className="absolute right-0 z-50 mt-2 w-72 overflow-hidden rounded-xl border border-[#D3EEEE] bg-white shadow-xl">
                  <div className="border-b border-[#D3EEEE] bg-[#F0FAF8] px-4 py-3 text-sm font-semibold text-[#00565B]">
                    Notifications
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-6 text-center text-sm text-slate-500">No notifications</div>
                    ) : notifications.map(notification => (
                      <button
                        key={notification.id}
                        onClick={() => markNotificationAsRead(notification.id)}
                        className={`block w-full border-b border-slate-100 px-4 py-3 text-left hover:bg-[#F3FAF9] ${!notification.is_read ? 'bg-[#E8F8F7]' : ''}`}
                      >
                        <div className="text-sm font-medium text-[#073F43]">{notification.title}</div>
                        <div className="mt-0.5 text-xs text-slate-500">{notification.message}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex min-w-0 max-w-[34%] items-center gap-1 rounded-full border border-[#25D2CE] bg-[#004F54]/75 py-0.5 pl-0.5 pr-1">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-[#F7D34D] bg-[#EAFBFA] text-[#00858A]">
                <UserCircleIcon className="h-5 w-5" />
              </div>
              <div className="min-w-0 text-left">
                <p className="truncate text-[7px] font-black leading-tight">{user?.name || 'Learner'}</p>
                <p className="truncate text-[7px] font-semibold text-[#D7F6F3]">{user?.form || 'Form'}</p>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                title="Log out"
                aria-label="Log out"
                className="shrink-0 text-white"
              >
                <ArrowRightOnRectangleIcon className="h-3 w-3" />
              </button>
            </div>
          </div>

          {activeTab === 'overview' && (
            <div className="absolute right-[4%] top-[43%] flex w-[43%] flex-col items-center text-center text-white">
              <h2 className="text-[15px] font-black leading-tight drop-shadow">
                Hello, {(user?.name || 'Learner').trim().split(' ')[0]}!
              </h2>
              <p className="mt-1 hidden max-w-[230px] text-[9px] leading-snug text-white/90">
                Ready for a great day of learning?
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('learning')}
                className="mt-3 rounded-full bg-gradient-to-b from-[#FFE77B] to-[#FFBF19] px-5 py-1.5 text-[10px] font-black text-[#073F43] shadow-md transition hover:brightness-105 active:scale-95"
              >
                Learn <span aria-hidden="true">›</span>
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto w-full max-w-[520px] space-y-3.5 px-3 py-3">
        {activeTab === 'overview' && (
          <>
            <section className="grid grid-cols-3 gap-1.5">
              <div className="flex min-h-[92px] min-w-0 flex-col items-center justify-center rounded-[17px] border-2 border-[#F3C34A] bg-gradient-to-br from-white to-[#FFF8E6] px-1 py-2 text-center shadow-[0_4px_0_rgba(232,181,45,0.12)]">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FFF0B5] text-[#936500]">
                  <ChartBarIcon className="h-5 w-5 stroke-[2.3]" />
                </div>
                <p className="mt-1 text-xl font-black leading-none text-[#07575A]">{latestAverage}</p>
                <p className="mt-1 text-[10px] font-bold leading-tight text-[#173F43]">Average</p>
              </div>

              <div className="flex min-h-[92px] min-w-0 flex-col items-center justify-center rounded-[17px] border-2 border-[#12BFC0] bg-gradient-to-br from-white to-[#E4FAFA] px-1 py-2 text-center shadow-[0_4px_0_rgba(0,171,174,0.10)]">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#C9F5F3] text-[#00686D]">
                  <ClipboardDocumentCheckIcon className="h-5 w-5 stroke-[2.2]" />
                </div>
                <p className="mt-1 text-xl font-black leading-none text-[#07575A]">
                  {attendanceRate}
                </p>
                <p className="mt-1 text-[10px] font-bold leading-tight text-[#173F43]">Visits</p>
              </div>

              <div className="flex min-h-[92px] min-w-0 flex-col items-center justify-center rounded-[17px] border-2 border-[#F3C34A] bg-gradient-to-br from-white to-[#FFF8E6] px-1 py-2 text-center shadow-[0_4px_0_rgba(232,181,45,0.12)]">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FFF0B5] text-[#936500]">
                  <DocumentTextIcon className="h-5 w-5 stroke-[2]" />
                </div>
                <p className="mt-1 text-xl font-black leading-none text-[#07575A]">{filteredReports.length}</p>
                <p className="mt-1 text-[10px] font-bold leading-tight text-[#173F43]">Reports</p>
              </div>
            </section>

            <section className="grid grid-cols-2 gap-3">
              {quickLinks.map(({ tab, title, description, Icon, theme }) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`group relative flex min-h-[140px] flex-col items-center justify-center overflow-hidden rounded-[19px] px-3 py-4 shadow-[0_8px_0_rgba(0,91,96,0.10)] transition duration-200 hover:-translate-y-1 hover:shadow-xl ${
                    theme === 'teal'
                      ? 'bg-gradient-to-br from-[#009B9D] via-[#00777C] to-[#00585F] text-white'
                      : 'bg-gradient-to-br from-[#FFE47A] via-[#FFC72D] to-[#F3A900] text-[#102F2E]'
                  }`}
                >
                  <div className="pointer-events-none absolute -bottom-10 -left-8 h-28 w-[130%] -rotate-6 rounded-[50%] bg-white/10" />
                  <Icon className={`relative z-10 h-11 w-11 stroke-[1.9] transition group-hover:scale-105 ${theme === 'teal' ? 'text-white' : 'text-[#5C4300]'}`} />
                  <span className="relative z-10 mt-1 text-base font-black">{title}</span>
                  <span className={`relative z-10 mt-0.5 text-[10px] font-semibold ${theme === 'teal' ? 'text-white/75' : 'text-[#604900]/80'}`}>
                    {description}
                  </span>
                </button>
              ))}
            </section>
          </>
        )}

        {activeTab !== 'overview' && (
          <section className="overflow-hidden rounded-[26px] border border-[#D3EEEE] bg-white shadow-[0_8px_28px_rgba(0,91,96,0.08)]">
            <div className="flex items-center gap-3 border-b border-[#D8EEEE] bg-gradient-to-r from-[#E7F8F7] to-[#F7FCFA] px-4 py-4">
              <button
                type="button"
                onClick={() => {
                  setSelectedResultCategory(null);
                  setActiveTab('overview');
                }}
                className="rounded-full bg-white px-4 py-2 text-sm font-bold text-[#00666B] shadow-sm ring-1 ring-[#D2E9E8] transition hover:bg-[#FFF3C5]"
              >
                ← Home
              </button>
              <h2 className="text-lg font-black text-[#00565B]">
                {activeTab === 'reports'
                  ? selectedResultCategory
                    ? resultsCategories.find(item => item.id === selectedResultCategory)?.label || 'Results'
                    : 'Results'
                  : activeTab === 'learning'
                    ? 'Learn'
                    : activeTab === 'quizzes'
                      ? 'Quizzes'
                    : activeTab === 'library'
                      ? 'Library'
                      : 'Attendance'}
              </h2>
            </div>

            <div className="p-3">
              {activeTab === 'reports' && (
                <div className="space-y-3">
                  {selectedResultCategory && (
                    <button
                      onClick={() => setSelectedResultCategory(null)}
                      className="text-sm font-bold text-[#00666B]"
                    >
                      ← All results
                    </button>
                  )}

                  {!selectedResultCategory && (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={selectedYear}
                    onChange={(event) => setSelectedYear(event.target.value)}
                    className="rounded-xl border border-[#D5E9E7] bg-white px-3 py-2 text-sm"
                  >
                    <option value="">All Years</option>
                    {availableYears.map(year => <option key={year} value={year}>{year}</option>)}
                  </select>
                  <select
                    value={selectedAssessment}
                    onChange={(event) => setSelectedAssessment(event.target.value)}
                    className="rounded-xl border border-[#D5E9E7] bg-white px-3 py-2 text-sm"
                  >
                    <option value="">All Exams</option>
                    {availableAssessments.map(assessment => <option key={assessment} value={assessment}>{assessment}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {resultsCategories.map(category => {
                    const count = filteredReports.filter(category.matcher).length;
                    return (
                      <button
                        key={category.id}
                        onClick={() => setSelectedResultCategory(category.id)}
                        className="rounded-2xl border border-[#D5E9E7] bg-white p-4 text-left shadow-sm transition-all hover:bg-[#F3FAF9] active:scale-[0.98]"
                      >
                        <div className="text-lg font-black text-[#00565B]">{category.label}</div>
                        <div className="mt-2 text-xs text-slate-500">{count} result{count === 1 ? '' : 's'}</div>
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {selectedResultCategory && (
              <div className="space-y-3">
                {selectedCategoryReports.length ? selectedCategoryReports.map(report => (
                  <article key={report.id} className="rounded-2xl border border-[#D5E9E7] bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-bold text-[#00565B]">{report.term || 'Report card'}</div>
                        <div className="text-xs text-slate-500">{report.form || user?.form} · {report.academic_year || ''}</div>
                      </div>
                      <div className="text-lg font-bold text-[#00666B]">{getAverage(report.subjects)}%</div>
                    </div>
                    <div className="mt-3 space-y-2">
                      {(report.subjects || []).slice(0, 4).map(subject => (
                        <div key={`${report.id}-${subject.name}`} className="flex justify-between text-sm">
                          <span className="text-slate-600">{subject.name}</span>
                          <span className="font-semibold text-[#00565B]">{subject.score}%</span>
                        </div>
                      ))}
                    </div>
                    <button onClick={() => downloadReportPDF(report)} className="mt-4 w-full rounded-xl bg-[#00666B] py-3 text-sm font-semibold text-white">
                      Download PDF
                    </button>
                  </article>
                )) : <p className="rounded-2xl bg-[#F3FAF9] p-6 text-center text-sm text-slate-500">No reports match this selection.</p>}
              </div>
            )}
                </div>
              )}

              {activeTab === 'learning' && (
                <LearningSpace onStartQuiz={quizId => setShowQuiz(quizId)} />
              )}

              {activeTab === 'quizzes' && (
                <QuizList onStartQuiz={quizId => setShowQuiz(quizId)} />
              )}

              {activeTab === 'library' && <Library />}

              {activeTab === 'attendance' && (
                <div className="space-y-3">
                  <div className="rounded-2xl border border-[#D5E9E7] bg-gradient-to-r from-[#DDF7F5] to-[#EFFBFA] p-5 text-center shadow-sm">
              <div className="text-4xl font-black text-[#00666B]">{attendanceRate}</div>
              <div className="mt-1 text-xs font-bold uppercase tracking-wide text-slate-500">Total Visits</div>
            </div>
            {attendance.records.length ? attendance.records.slice(0, 12).map(record => (
              <div key={record.id || record.logged_in_at} className="flex items-center justify-between rounded-xl border border-[#D5E9E7] bg-white p-4 shadow-sm">
                <span className="text-sm text-slate-600">{record.logged_in_at ? new Date(record.logged_in_at).toLocaleString() : 'Date unavailable'}</span>
                <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">Login</span>
              </div>
                  )) : <p className="rounded-2xl bg-[#F3FAF9] p-6 text-center text-sm text-slate-500">No records yet.</p>}
                </div>
              )}
            </div>
          </section>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-1/2 z-30 w-full max-w-[520px] -translate-x-1/2 px-2 pb-2">
        <div className="mx-auto flex w-full items-center justify-around gap-0.5 rounded-full border border-[#8DE5E1] bg-gradient-to-r from-[#005C62] via-[#00777A] to-[#005C62] px-1 py-1.5 shadow-[0_-4px_20px_rgba(0,91,96,0.12),0_8px_25px_rgba(0,0,0,0.18)]">
          {[
            { id: 'overview', label: 'Home', Icon: HomeIcon },
            { id: 'learning', label: 'Learn', Icon: BookOpenIcon },
            { id: 'quizzes', label: 'Quizzes', Icon: ClipboardDocumentCheckIcon },
            { id: 'library', label: 'Library', Icon: AcademicCapIcon },
            { id: 'reports', label: 'Results', Icon: ChartBarIcon },
            { id: 'attendance', label: 'Attendance', Icon: ClipboardDocumentCheckIcon },
          ].map(({ id, label, Icon }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                aria-label={label}
                aria-current={isActive ? 'page' : undefined}
                className={`flex min-w-0 flex-1 items-center justify-center gap-0.5 rounded-full px-1 py-1.5 text-[9px] font-black transition ${
                  isActive
                    ? 'bg-gradient-to-b from-[#FFE77B] to-[#FFBF19] text-[#073F43] shadow-md'
                    : 'text-white hover:bg-white/10'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0 stroke-[2.1]" />
                <span className="truncate">{label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}