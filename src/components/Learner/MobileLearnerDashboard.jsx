import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import LearningSpace from './LearningSpace';
import QuizTaking from './QuizTaking';
import {
  ArrowRightOnRectangleIcon,
  CalendarIcon,
  ChartBarIcon,
  DocumentTextIcon,
  HomeIcon,
  UserCircleIcon,
  AcademicCapIcon,
  BookOpenIcon,
  ClipboardDocumentCheckIcon
} from '@heroicons/react/24/outline';

const HEADER_BG = '#224248';
const TEAL = '#005F7B';
const CYAN = '#00B4D8';
const ICE_WHITE = '#F8FAFC';

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

const DashboardCard = ({ icon: Icon, title, color, onClick, className = '' }) => (
  <button 
    onClick={onClick}
    className={`w-full min-h-36 rounded-2xl border-2 border-[#224248] bg-[#224248] p-5 shadow-sm transition-all hover:bg-[#224248] hover:shadow-md active:scale-[0.98] ${className}`}
  >
    <div className="flex justify-center">
      <div className="rounded-xl bg-white/15 p-2">
        <Icon className="h-6 w-6 text-white" />
      </div>
    </div>
    <h3 className="mt-3 text-center text-sm font-semibold text-white">{title}</h3>
  </button>
);

const MobileStat = ({ icon: Icon, value, label }) => (
  <div className="rounded-2xl bg-transparent px-3 py-3 text-center text-[#005F7B]">
    <Icon className="mx-auto mb-1 h-5 w-5 text-[#005F7B]" />
    <div className="text-lg font-bold">{value}</div>
    <div className="text-[10px] font-semibold uppercase tracking-wide text-[#005F7B]/75">{label}</div>
  </div>
);

export default function MobileLearnerDashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState([]);
  const [attendance, setAttendance] = useState({ stats: {}, records: [] });
  const [showQuiz, setShowQuiz] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
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
      console.error('Error loading mobile learner dashboard:', error);
      toast.error('Could not load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleLogout = () => {
    logout();
  };

  const attendanceRate = attendance.stats?.rate ?? attendance.stats?.percentage ?? '—';
  const latestReport = reports[0];
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
        console.error('Mobile report logo error:', error);
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
          console.error('Mobile report logo rendering error:', error);
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
      console.error('Mobile report PDF error:', error);
      toast.error('Could not create PDF');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F5F2EB]">
        <div className="text-center">
          <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-[#00B4D8] border-t-transparent" />
          <p className="text-sm text-slate-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (showQuiz) {
    return (
      <div className="min-h-screen bg-[#F5F2EB] px-4 py-5">
        <button onClick={() => setShowQuiz(null)} className="mb-4 text-sm font-semibold text-[#005F7B]">
          ← Back
        </button>
        <QuizTaking
          quizId={showQuiz}
          onComplete={() => setShowQuiz(null)}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F2EB] pb-20">
      {/* Header Section */}
      <header className="sticky top-0 z-30 bg-[#224248] px-5 pb-6 pt-5 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/schoologo.png"
              alt="Progress Secondary School logo"
              className="h-14 w-14 rounded-2xl bg-white/10 p-1.5 object-contain shadow-lg backdrop-blur-sm"
            />
            <div className="leading-tight">
              <div className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#7DE3FF]">
                Student Portal
              </div>
              <h1 className="text-lg font-black tracking-wide text-white">
                Progress School
              </h1>
              <div className="text-xs font-light text-white/60">
                Secondary School
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="group flex items-center gap-1.5 rounded-xl bg-white/10 px-4 py-2.5 text-xs font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20"
          >
            <ArrowRightOnRectangleIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            <span>Exit</span>
          </button>
        </div>

        <div className="mt-5 border-t border-white/20 pt-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="mt-0.5 text-2xl font-bold text-white">
                {user?.name || 'Learner'}
              </h2>
              <div className="mt-1 flex items-center gap-2">
                <AcademicCapIcon className="h-4 w-4 text-[#7DE3FF]" />
                <span className="text-sm font-medium text-white/80">
                  {user?.form || 'Form'}
                </span>
              </div>
            </div>
            <div className="px-2 py-2 text-center">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-[#7DE3FF]">
                Today
              </div>
              <div className="text-sm font-bold text-white">
                {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="space-y-5 px-4 py-5">
        {activeTab === 'overview' && (
          <>
            {/* Four Main Cards */}
            <div className="grid grid-cols-3 gap-2">
              <MobileStat icon={ChartBarIcon} value={latestAverage} label="Average" />
              <MobileStat icon={DocumentTextIcon} value={reports.length} label="Reports" />
              <MobileStat icon={CalendarIcon} value={attendanceRate === '—' ? '—' : `${attendanceRate}%`} label="Attendance" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              {/* Results Card */}
              <DashboardCard
                icon={DocumentTextIcon}
                title="Results"
                color={TEAL}
                onClick={() => setActiveTab('reports')}
              />

              {/* Learn Card */}
              <DashboardCard
                icon={BookOpenIcon}
                title="Learn"
                color={CYAN}
                onClick={() => setActiveTab('learning')}
              />

              {/* Attendance Card */}
              <DashboardCard
                icon={CalendarIcon}
                title="Attendance"
                color="#6C63FF"
                onClick={() => setActiveTab('attendance')}
              />

              {/* Profile Card */}
              <DashboardCard
                icon={UserCircleIcon}
                title="Profile"
                color="#F59E0B"
                onClick={() => toast.info('Profile details coming soon')}
              />
            </div>

          </>
        )}

        {activeTab === 'reports' && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-[#0A2540]">Report Cards</h2>
              <button onClick={() => setActiveTab('overview')} className="text-sm font-semibold text-[#005F7B]">
                ← Back
              </button>
            </div>
            {reports.length ? reports.map(report => (
              <article key={report.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-[#0A2540]">{report.term || 'Report card'}</div>
                    <div className="text-xs text-slate-500">{report.form || user?.form} · {report.academic_year || ''}</div>
                  </div>
                  <div className="text-lg font-bold text-[#005F7B]">{getAverage(report.subjects)}%</div>
                </div>
                <div className="mt-3 space-y-2">
                  {(report.subjects || []).slice(0, 4).map(subject => (
                    <div key={subject.name} className="flex justify-between text-sm">
                      <span className="text-slate-600">{subject.name}</span>
                      <span className="font-semibold text-[#0A2540]">{subject.score}%</span>
                    </div>
                  ))}
                </div>
                <button onClick={() => downloadReportPDF(report)} className="mt-4 w-full rounded-xl bg-[#005F7B] py-3 text-sm font-semibold text-white">
                  Download PDF
                </button>
              </article>
            )) : <p className="rounded-2xl bg-white p-6 text-center text-sm text-slate-500">No reports yet.</p>}
          </section>
        )}

        {activeTab === 'learning' && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-bold text-[#0A2540]">Learning Space</h2>
              <button onClick={() => setActiveTab('overview')} className="text-sm font-semibold text-[#005F7B]">
                ← Back
              </button>
            </div>
            <LearningSpace onStartQuiz={(quizId) => setShowQuiz(quizId)} />
          </section>
        )}

        {activeTab === 'attendance' && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-[#0A2540]">Attendance Records</h2>
              <button onClick={() => setActiveTab('overview')} className="text-sm font-semibold text-[#005F7B]">
                ← Back
              </button>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm">
              <div className="text-4xl font-bold text-[#005F7B]">{attendanceRate === '—' ? '—' : `${attendanceRate}%`}</div>
              <div className="mt-1 text-xs font-bold uppercase tracking-wide text-slate-500">Overall Attendance Rate</div>
            </div>
            {attendance.records.length ? attendance.records.slice(0, 12).map(record => (
              <div key={record.id || `${record.date}-${record.status}`} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <span className="text-sm text-slate-600">{record.date ? new Date(record.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : 'Date unavailable'}</span>
                <span className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${record.status === 'present' ? 'bg-green-100 text-green-700' : record.status === 'late' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                  {record.status || 'unknown'}
                </span>
              </div>
            )) : <p className="rounded-2xl bg-white p-6 text-center text-sm text-slate-500">No records yet.</p>}
          </section>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200 bg-transparent px-2 py-2">
        <div className="mx-auto flex max-w-md justify-around">
          {[
            { id: 'overview', label: 'Home', icon: HomeIcon },
            { id: 'learning', label: 'Learn', icon: BookOpenIcon },
            { id: 'reports', label: 'Reports', icon: DocumentTextIcon },
            { id: 'attendance', label: 'Attendance', icon: CalendarIcon }
          ].map(({ id, label, icon: Icon }) => (
            <button 
              key={id} 
              onClick={() => setActiveTab(id)} 
              aria-label={label}
              className={`flex items-center justify-center rounded-xl p-3 transition-all ${
                activeTab === id ? 'text-slate-600' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Icon className="h-6 w-6" />
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}