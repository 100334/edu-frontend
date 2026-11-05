import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import LearningSpace from './LearningSpace';
import Library from '../Library';
import QuizTaking from './QuizTaking';
import QuizResults from './QuizResults';
import {
  AcademicCapIcon,
  ArrowRightOnRectangleIcon,
  BookOpenIcon,
  ChartBarIcon,
  ClipboardDocumentCheckIcon,
  HomeIcon,
} from '@heroicons/react/24/outline';

const primaryTabs = [
  { id: 'home', label: 'Home', Icon: HomeIcon },
  { id: 'learn', label: 'Learn', Icon: BookOpenIcon },
  { id: 'library', label: 'Library', Icon: AcademicCapIcon },
  { id: 'results', label: 'Results', Icon: ChartBarIcon },
  { id: 'attendance', label: 'Attendance', Icon: ClipboardDocumentCheckIcon },
];

const PrimaryLearnerDashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('home');
  const [reports, setReports] = useState([]);
  const [attendance, setAttendance] = useState({ stats: {}, records: [] });
  const [showQuiz, setShowQuiz] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    const [reportsResult, attendanceResult] = await Promise.allSettled([
      api.get('/api/learner/reports'),
      api.get('/api/learner/attendance'),
    ]);

    if (reportsResult.status === 'fulfilled') {
      const payload = reportsResult.value.data;
      setReports(Array.isArray(payload) ? payload : payload?.data || payload?.reports || []);
    } else {
      toast.error('Could not load your school results');
    }

    if (attendanceResult.status === 'fulfilled') {
      const payload = attendanceResult.value.data?.data || attendanceResult.value.data || {};
      setAttendance({
        stats: payload.stats || {},
        records: payload.records || [],
      });
    } else {
      toast.error('Could not load your attendance');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  if (showQuiz) {
    return (
      <div className="min-h-screen bg-[#FFF9EC] px-4 py-4">
        <button
          onClick={() => setShowQuiz(null)}
          className="mb-3 rounded-xl bg-white px-4 py-2 text-sm font-bold text-[#006770] shadow-sm"
        >
          ← Back to learning
        </button>
        <QuizTaking
          quizId={showQuiz}
          onComplete={() => setShowQuiz(null)}
          questionsPerPage={1}
        />
      </div>
    );
  }

  const average = reports[0]?.average_score
    ?? reports[0]?.subjects?.reduce((total, subject) => total + (Number(subject.score) || 0), 0) / (reports[0]?.subjects?.length || 1);
  const attendanceRate = attendance.stats?.rate ?? attendance.stats?.percentage;
  const learnerName = user?.name || 'Learner';
  const formattedAverage = Number.isFinite(Number(average)) && reports.length ? `${Math.round(Number(average))}%` : '—';

  return (
    <div className="min-h-screen bg-[#FFF9EC] pb-24 text-[#183B40]">
      <header className="bg-[#006770] px-4 py-4 text-white shadow-md sm:px-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#D9F1F4] text-2xl">
              <span role="img" aria-label="School">🎒</span>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#BFEAF0]">My learning space</p>
              <h1 className="text-lg font-black sm:text-xl">Hello, {learnerName}!</h1>
              <p className="text-xs font-semibold text-white/80">{user?.form || 'Primary learner'}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 rounded-xl bg-white/15 px-3 py-2 text-xs font-bold hover:bg-white/25"
          >
            <ArrowRightOnRectangleIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Log out</span>
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-5 px-4 py-5 sm:px-8">
        {activeTab === 'home' && (
          <>
            <section className="rounded-3xl bg-gradient-to-r from-[#007F9E] to-[#006770] p-5 text-white shadow-md sm:p-7">
              <p className="text-sm font-bold text-[#D9F1F4]">Ready for a great day of learning?</p>
              <h2 className="mt-1 text-2xl font-black sm:text-3xl">Learn something new!</h2>
              <p className="mt-2 max-w-xl text-sm text-white/85">Open your lessons, practise a quiz, or explore your school library.</p>
              <button
                onClick={() => setActiveTab('learn')}
                className="mt-4 rounded-xl bg-[#FFF9EC] px-5 py-3 text-sm font-extrabold text-[#006770] shadow-sm transition hover:bg-white"
              >
                Let’s learn →
              </button>
            </section>

            <section className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-[#B9E0E5] bg-white p-4 shadow-sm">
                <ChartBarIcon className="h-6 w-6 text-[#007F9E]" />
                <p className="mt-2 text-xl font-black text-[#006770]">{loading ? '…' : formattedAverage}</p>
                <p className="text-xs font-semibold text-slate-500">Latest average</p>
              </div>
              <div className="rounded-2xl border border-[#B9E0E5] bg-white p-4 shadow-sm">
                <ClipboardDocumentCheckIcon className="h-6 w-6 text-[#007F9E]" />
                <p className="mt-2 text-xl font-black text-[#006770]">
                  {loading ? '…' : attendanceRate == null ? '—' : `${attendanceRate}%`}
                </p>
                <p className="text-xs font-semibold text-slate-500">Attendance</p>
              </div>
              <div className="col-span-2 rounded-2xl border border-[#B9E0E5] bg-white p-4 shadow-sm sm:col-span-1">
                <BookOpenIcon className="h-6 w-6 text-[#007F9E]" />
                <p className="mt-2 text-xl font-black text-[#006770]">{reports.length}</p>
                <p className="text-xs font-semibold text-slate-500">Report cards</p>
              </div>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-black text-[#004B55]">What would you like to do?</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { tab: 'learn', emoji: '📖', title: 'My Lessons', description: 'Read and practise' },
                  { tab: 'library', emoji: '📚', title: 'Book Library', description: 'Explore your books' },
                  { tab: 'results', emoji: '⭐', title: 'My Results', description: 'See how you are doing' },
                  { tab: 'attendance', emoji: '📅', title: 'Attendance', description: 'Check school days' },
                ].map(item => (
                  <button
                    key={item.tab}
                    onClick={() => setActiveTab(item.tab)}
                    className="rounded-2xl border-2 border-[#B9E0E5] bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#007F9E]"
                  >
                    <span className="text-3xl" role="img" aria-label={item.title}>{item.emoji}</span>
                    <h3 className="mt-3 text-sm font-extrabold text-[#004B55]">{item.title}</h3>
                    <p className="mt-1 text-xs text-slate-500">{item.description}</p>
                  </button>
                ))}
              </div>
            </section>
          </>
        )}

        {activeTab !== 'home' && (
          <section className="overflow-hidden rounded-2xl border border-[#D5E8E7] bg-white shadow-sm">
            <div className="flex items-center gap-3 border-b border-[#E6F0EE] bg-[#F0FAF8] px-4 py-4 sm:px-6">
              <button
                onClick={() => setActiveTab('home')}
                className="rounded-lg px-2 py-1 text-sm font-bold text-[#006770] hover:bg-white"
              >
                ← Home
              </button>
              <h2 className="text-lg font-black text-[#004B55]">
                {primaryTabs.find(tab => tab.id === activeTab)?.label}
              </h2>
            </div>

            <div className="p-3 sm:p-5">
              {activeTab === 'learn' && (
                <LearningSpace onStartQuiz={quizId => setShowQuiz(quizId)} />
              )}
              {activeTab === 'library' && <Library />}
              {activeTab === 'results' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="mb-3 text-base font-extrabold text-[#004B55]">School results</h3>
                    {loading ? (
                      <p className="rounded-xl bg-[#F7FBFA] p-5 text-center text-sm text-slate-500">Loading your results…</p>
                    ) : reports.length ? (
                      <div className="space-y-3">
                        {reports.map((report, index) => (
                          <article key={report.id || index} className="rounded-xl border border-[#D5E8E7] p-4">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <h4 className="font-bold text-[#004B55]">{report.term || 'School report'}</h4>
                              <span className="rounded-full bg-[#D9F1F4] px-3 py-1 text-xs font-bold text-[#006770]">
                                Average: {report.average_score ?? formattedAverage}
                                {report.average_score != null ? '%' : ''}
                              </span>
                            </div>
                            {report.subjects?.length > 0 && (
                              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                                {report.subjects.map((subject, subjectIndex) => (
                                  <li key={`${subject.name}-${subjectIndex}`} className="flex justify-between rounded-lg bg-[#F7FBFA] px-3 py-2 text-sm">
                                    <span>{subject.name || 'Subject'}</span>
                                    <strong className="text-[#006770]">{subject.score ?? '—'}{subject.score != null ? '%' : ''}</strong>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </article>
                        ))}
                      </div>
                    ) : (
                      <p className="rounded-xl bg-[#F7FBFA] p-5 text-center text-sm text-slate-500">Your school results will appear here.</p>
                    )}
                  </div>
                  <div>
                    <h3 className="mb-3 text-base font-extrabold text-[#004B55]">Quiz results</h3>
                    <QuizResults onRetake={quizId => setShowQuiz(quizId)} />
                  </div>
                </div>
              )}
              {activeTab === 'attendance' && (
                <div className="space-y-3">
                  <div className="rounded-2xl bg-[#E8F6F7] p-5 text-center">
                    <p className="text-3xl font-black text-[#006770]">
                      {loading ? '…' : attendanceRate == null ? '—' : `${attendanceRate}%`}
                    </p>
                    <p className="mt-1 text-xs font-bold uppercase tracking-wide text-[#526C70]">My attendance</p>
                  </div>
                  {attendance.records.length ? attendance.records.map((record, index) => (
                    <div key={record.id || `${record.date}-${index}`} className="flex items-center justify-between rounded-xl border border-[#D5E8E7] px-4 py-3">
                      <span className="text-sm text-slate-600">
                        {record.date ? new Date(record.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) : 'Date unavailable'}
                      </span>
                      <span className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${
                        record.status === 'present' ? 'bg-green-100 text-green-700'
                          : record.status === 'late' ? 'bg-amber-100 text-amber-700'
                            : 'bg-red-100 text-red-700'
                      }`}>
                        {record.status_display || record.status || 'Unknown'}
                      </span>
                    </div>
                  )) : (
                    <p className="rounded-xl bg-[#F7FBFA] p-5 text-center text-sm text-slate-500">Attendance records will appear here.</p>
                  )}
                </div>
              )}
            </div>
          </section>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-[#D5E8E7] bg-[#FFF9EC]/95 px-2 py-2 backdrop-blur">
        <div className="mx-auto flex max-w-2xl justify-around">
          {primaryTabs.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex min-w-14 flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-[10px] font-bold transition ${
                activeTab === id ? 'bg-[#D9F1F4] text-[#006770]' : 'text-slate-500 hover:bg-white'
              }`}
            >
              <Icon className="h-5 w-5" />
              {label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default PrimaryLearnerDashboard;
