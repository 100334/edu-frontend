import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import LearningSpace from './LearningSpace';
import Library from '../Library';
import QuizList from './QuizList';
import QuizTaking from './QuizTaking';
import QuizResults from './QuizResults';
import {
  AcademicCapIcon,
  BellIcon,
  BookOpenIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ClipboardDocumentCheckIcon,
  DocumentTextIcon,
  HomeIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';

const primaryTabs = [
  { id: 'home', label: 'Home', Icon: HomeIcon },
  { id: 'learn', label: 'Learn', Icon: BookOpenIcon },
  { id: 'quizzes', label: 'Quizzes', Icon: ClipboardDocumentCheckIcon },
  { id: 'library', label: 'Library', Icon: AcademicCapIcon },
  { id: 'results', label: 'Results', Icon: ChartBarIcon },
  { id: 'attendance', label: 'Attendance', Icon: ClipboardDocumentCheckIcon },
];

const quickLinks = [
  {
    tab: 'learn',
    title: 'Learn',
    description: 'Open your lessons',
    Icon: BookOpenIcon,
    theme: 'teal',
  },
  {
    tab: 'quizzes',
    title: 'Quizzes',
    description: 'Practice with assessments',
    Icon: ClipboardDocumentCheckIcon,
    theme: 'gold',
  },
  {
    tab: 'library',
    title: 'Library',
    description: 'Explore your books',
    Icon: AcademicCapIcon,
    theme: 'gold',
  },
  {
    tab: 'results',
    title: 'Results',
    description: 'Review your progress',
    Icon: ChartBarIcon,
    theme: 'teal',
  },
];

const PrimaryLearnerDashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('home');
  const [reports, setReports] = useState([]);
  const [quizAttempts, setQuizAttempts] = useState([]);
  const [attendance, setAttendance] = useState({ stats: {}, records: [] });
  const [showQuiz, setShowQuiz] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadDashboardData = useCallback(async () => {
    setLoading(true);

    const [reportsResult, attendanceResult, quizResultsResult] = await Promise.allSettled([
      api.get('/api/learner/reports'),
      api.get('/api/learner/attendance'),
      api.get('/api/quiz/history'),
    ]);

    if (reportsResult.status === 'fulfilled') {
      const payload = reportsResult.value.data;
      setReports(
        Array.isArray(payload)
          ? payload
          : payload?.data || payload?.reports || []
      );
    } else {
      toast.error('Could not load your school results');
    }

    if (attendanceResult.status === 'fulfilled') {
      const payload =
        attendanceResult.value.data?.data ||
        attendanceResult.value.data ||
        {};

      setAttendance({
        stats: payload.stats || {},
        records: payload.records || [],
      });
    } else {
      toast.error('Could not load your visit history');
    }

    if (quizResultsResult.status === 'fulfilled') {
      const payload = quizResultsResult.value.data;
      setQuizAttempts(
        payload?.success && Array.isArray(payload.attempts)
          ? payload.attempts
          : []
      );
    } else {
      toast.error('Could not load your quiz scores');
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  if (showQuiz) {
    return (
      <QuizTaking
        quizId={showQuiz}
        showPrimaryGrade
        onComplete={() => {
          setShowQuiz(null);
          setActiveTab('results');
        }}
        onExit={() => setShowQuiz(null)}
        questionsPerPage={1}
      />
    );
  }

  const quizPercentages = quizAttempts
    .map(attempt => {
      const savedPercentage = Number(attempt.percentage);
      if (attempt.percentage != null && Number.isFinite(savedPercentage)) {
        return savedPercentage;
      }

      const earned = Number(attempt.marks_earned ?? attempt.earned_points);
      const possible = Number(attempt.total_marks ?? attempt.total_points);
      return Number.isFinite(earned) && Number.isFinite(possible) && possible > 0
        ? (earned / possible) * 100
        : null;
    })
    .filter(score => score !== null && Number.isFinite(score));
  const average =
    quizPercentages.length > 0
      ? quizPercentages.reduce((total, score) => total + score, 0) / quizPercentages.length
      : null;

  const attendanceRate =
    attendance.stats?.visits ?? attendance.stats?.total ?? 0;

  const learnerName = user?.name || 'Learner';
  const firstName = learnerName.trim().split(' ')[0];
  const learnerClass = user?.form || 'Primary learner';

  const formattedAverage =
    average !== null && Number.isFinite(average)
      ? `${Math.round(Number(average))}%`
      : '—';

  return (
    <div className="primary-learner-dashboard learner-dashboard-shell mx-auto min-h-screen w-full max-w-[520px] overflow-x-hidden bg-[#F2FBFC] pb-24 text-[#073F43] shadow-[0_0_35px_rgba(0,91,96,0.10)]">
      <header className="primary-learner-dashboard__mobile-header relative z-30 w-full overflow-hidden bg-[#00676B] shadow-lg">
        <div className="primary-learner-dashboard__hero relative w-full">
          <img
            src="/image.png"
            alt="Two learners reading together"
            className="primary-learner-dashboard__hero-image block h-auto w-full"
          />

          <div className="absolute inset-x-0 top-[3%] flex items-center justify-between gap-1 px-[4%] text-white">
            <button
              type="button"
              onClick={() => setActiveTab('home')}
              className="min-w-0 text-left text-[10px] font-black leading-tight drop-shadow sm:text-sm"
              aria-label="My Learning Space home"
            >
              My Learning
              <br />
              Space
            </button>

            <div className="mx-1 h-7 w-px shrink-0 bg-white/80 sm:h-10" />

            <h1 className="min-w-0 flex-1 text-center text-[11px] font-black leading-tight drop-shadow sm:text-lg">
              Learner Dashboard
            </h1>

            <button
              type="button"
              aria-label="Notifications"
              className="relative flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#25D2CE] bg-[#004F54]/80 text-[#FFD84D] sm:h-9 sm:w-9"
            >
              <BellIcon className="h-3.5 w-3.5 sm:h-5 sm:w-5" />
              <span className="absolute right-0 top-0 h-2 w-2 rounded-full border border-[#005C61] bg-red-500" />
            </button>

            <div className="flex min-w-0 max-w-[31%] items-center gap-1 rounded-full border border-[#25D2CE] bg-[#004F54]/75 py-0.5 pl-0.5 pr-1 sm:gap-2 sm:py-1 sm:pl-1">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-[#F7D34D] bg-[#EAFBFA] text-[#00858A] sm:h-9 sm:w-9">
                <UserCircleIcon className="h-5 w-5 sm:h-7 sm:w-7" />
              </div>
              <div className="min-w-0 text-left">
                <p className="truncate text-[7px] font-black leading-tight sm:text-[10px]">
                  {learnerName}
                </p>
                <p className="truncate text-[7px] font-semibold text-[#D7F6F3] sm:text-[9px]">
                  {learnerClass}
                </p>
              </div>
              <button
                type="button"
                onClick={logout}
                title="Log out"
                aria-label="Log out"
                className="shrink-0 text-white"
              >
                <svg viewBox="0 0 24 24" fill="none" className="h-3 w-3 sm:h-4 sm:w-4" aria-hidden="true">
                  <path
                    d="m6 9 6 6 6-6"
                    stroke="currentColor"
                    strokeWidth="2.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          </div>

          {activeTab === 'home' && (
            <div className="absolute right-[4%] top-[43%] flex w-[43%] flex-col items-center text-center text-white">
              <h2 className="text-[15px] font-black leading-tight drop-shadow sm:text-2xl">
                Hello, {firstName}!
              </h2>
              <p className="mt-1 hidden max-w-[230px] text-[9px] leading-snug text-white/90 sm:block sm:text-xs">
                Ready for a great day of learning?
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('learn')}
                className="mt-3 rounded-full bg-gradient-to-b from-[#FFE77B] to-[#FFBF19] px-5 py-1.5 text-[10px] font-black text-[#073F43] shadow-md transition hover:brightness-105 active:scale-95 sm:mt-4 sm:px-8 sm:py-2 sm:text-sm"
              >
                Learn <span aria-hidden="true">›</span>
              </button>
            </div>
          )}
        </div>
      </header>

      <header className="primary-learner-dashboard__desktop-header relative z-40 w-full overflow-hidden border-b-4 border-[#FBD34B] bg-[#00676B] shadow-lg">
        <img
          src="/image6.png"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#003F43]/55 via-transparent to-transparent" />
        <div className="relative z-10 mx-auto flex max-w-[1700px] flex-wrap items-center justify-between gap-3 px-4 py-3 lg:px-7">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#FFD52D]">
              <AcademicCapIcon className="h-9 w-9 text-[#00565B]" />
            </div>
            <div>
              <h1 className="text-base font-black tracking-tight text-white sm:text-xl">
                PROGRESS SCHOOLS
              </h1>
              <p className="text-[10px] font-black tracking-widest text-[#FFD84D] sm:text-xs">
                MY LEARNING SPACE
              </p>
            </div>
          </div>

          <nav aria-label="Learner dashboard" className="order-3 flex w-full items-center justify-center gap-1 overflow-x-auto border-t border-white/15 pt-2 lg:order-2 lg:w-auto lg:border-0 lg:pt-0">
            {primaryTabs.map(({ id, label, Icon }) => {
              const selected = activeTab === id;

              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveTab(id)}
                  aria-current={selected ? 'page' : undefined}
                  className={`flex shrink-0 items-center gap-2 rounded-full px-3 py-2.5 text-xs font-black transition sm:px-4 sm:text-sm ${
                    selected
                      ? 'bg-[#FFD52D] text-[#06474A] shadow-md'
                      : 'text-white hover:bg-white/15'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {label}
                </button>
              );
            })}
          </nav>

          <div className="order-2 flex items-center gap-3 lg:order-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-bold text-white">{learnerName}</p>
              <p className="text-xs text-[#C5EFEB]">{learnerClass}</p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-full border-[3px] border-[#FFD52D] bg-[#E9F8F5]">
              <UserCircleIcon className="h-8 w-8 text-[#00676B]" />
            </div>
            <button
              type="button"
              onClick={logout}
              className="rounded-full px-3 py-2 text-sm font-bold text-white transition hover:bg-white/15"
            >
              Log out
            </button>
          </div>
        </div>
        {activeTab === 'home' && (
          <div className="relative z-10 mx-auto flex min-h-[150px] max-w-[1700px] items-center px-5 pb-8 sm:px-10 lg:min-h-[205px] lg:px-14">
            <div className="max-w-[52%] text-white drop-shadow-[0_2px_3px_rgba(0,0,0,0.35)]">
              <span className="inline-flex rounded-full bg-[#FFD52D] px-4 py-2 text-[10px] font-black tracking-widest text-[#174344] sm:text-xs">
                MY LEARNING SPACE
              </span>
              <h2 className="mt-3 text-3xl font-black leading-tight sm:text-4xl lg:text-5xl">
                Hello, {firstName}!
              </h2>
              <p className="mt-2 text-sm font-bold sm:text-base lg:text-lg">
                Welcome to your learning space.
              </p>
              <p className="mt-1 text-xs sm:text-sm lg:text-base">
                Learn, practise and grow your knowledge.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('learn')}
                className="mt-4 rounded-full bg-gradient-to-r from-[#FFD943] to-[#F5B900] px-6 py-3 text-sm font-black text-[#174344] shadow-md transition hover:-translate-y-1 hover:brightness-105"
              >
                Start Learning
              </button>
            </div>
          </div>
        )}
      </header>

      <main className="primary-learner-dashboard__content mx-auto w-full max-w-[520px] space-y-3.5 px-3 py-3">
        {activeTab === 'home' && (
          <div className="primary-learner-dashboard__mobile-home space-y-3.5">
            <section className="grid grid-cols-3 gap-1.5 sm:gap-2">
              <div className="flex min-h-[92px] min-w-0 flex-col items-center justify-center rounded-[17px] border-2 border-[#F3C34A] bg-gradient-to-br from-white to-[#FFF8E6] px-1 py-2 text-center shadow-[0_4px_0_rgba(232,181,45,0.12)]">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FFF0B5] text-[#936500]">
                  <ChartBarIcon className="h-5 w-5 stroke-[2.3]" />
                </div>
                <div>
                  <p className="mt-1 text-xl font-black leading-none text-[#07575A]">
                    {loading ? '…' : formattedAverage}
                  </p>
                  <p className="mt-1 text-[10px] font-bold leading-tight text-[#173F43]">Average</p>
                </div>
              </div>

              <div className="flex min-h-[92px] min-w-0 flex-col items-center justify-center rounded-[17px] border-2 border-[#12BFC0] bg-gradient-to-br from-white to-[#E4FAFA] px-1 py-2 text-center shadow-[0_4px_0_rgba(0,171,174,0.10)]">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#C9F5F3] text-[#00686D]">
                  <ClipboardDocumentCheckIcon className="h-5 w-5 stroke-[2.2]" />
                </div>
                <div>
                  <p className="mt-1 text-xl font-black leading-none text-[#07575A]">
                    {loading ? '…' : attendanceRate}
                  </p>
                  <p className="mt-1 text-[10px] font-bold leading-tight text-[#173F43]">Visits</p>
                </div>
              </div>

              <div className="flex min-h-[92px] min-w-0 flex-col items-center justify-center rounded-[17px] border-2 border-[#F3C34A] bg-gradient-to-br from-white to-[#FFF8E6] px-1 py-2 text-center shadow-[0_4px_0_rgba(232,181,45,0.12)]">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FFF0B5] text-[#936500]">
                  <DocumentTextIcon className="h-5 w-5 stroke-[2]" />
                </div>
                <div>
                  <p className="mt-1 text-xl font-black leading-none text-[#07575A]">{reports.length}</p>
                  <p className="mt-1 text-[10px] font-bold leading-tight text-[#173F43]">Reports</p>
                </div>
              </div>
            </section>

            {/* Main feature tiles */}
            <section className="grid grid-cols-2 gap-3">
              {quickLinks.map(({ tab, title, description, Icon, theme }) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`group relative flex min-h-[140px] flex-col items-center justify-center overflow-hidden rounded-[19px] px-3 py-4 shadow-[0_8px_0_rgba(0,91,96,0.10)] transition duration-200 hover:-translate-y-1 hover:shadow-xl sm:min-h-[175px] ${
                    theme === 'teal'
                      ? 'bg-gradient-to-br from-[#009B9D] via-[#00777C] to-[#00585F] text-white'
                      : 'bg-gradient-to-br from-[#FFE47A] via-[#FFC72D] to-[#F3A900] text-[#102F2E]'
                  }`}
                >
                  <div className="pointer-events-none absolute -bottom-10 -left-8 h-28 w-[130%] -rotate-6 rounded-[50%] bg-white/10" />
                  <Icon
                    className={`relative z-10 h-11 w-11 stroke-[1.9] transition group-hover:scale-105 ${
                      theme === 'teal' ? 'text-white' : 'text-[#5C4300]'
                    }`}
                  />
                  <span className="relative z-10 mt-1 text-base font-black">
                    {title}
                  </span>
                  <span
                    className={`relative z-10 mt-0.5 text-[10px] font-semibold ${
                      theme === 'teal' ? 'text-white/75' : 'text-[#604900]/80'
                    }`}
                  >
                    {description}
                  </span>
                </button>
              ))}
            </section>
          </div>
        )}

        {activeTab === 'home' && (
          <section className="primary-learner-dashboard__desktop-home space-y-7">
            <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
              {quickLinks.map(({ tab, title, description, Icon, theme }) => {
                const teal = theme === 'teal';

                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`group flex min-h-[145px] items-center gap-4 rounded-[22px] border-b-[5px] p-5 text-left shadow-md transition duration-200 hover:-translate-y-1 hover:shadow-xl sm:min-h-[160px] ${
                      teal
                        ? 'border-[#005A59] bg-gradient-to-br from-[#08A5A1] to-[#006D6D] text-white'
                        : 'border-[#D99A00] bg-gradient-to-br from-[#FFE76B] to-[#FFC400] text-[#153F40]'
                    }`}
                  >
                    <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl sm:h-16 sm:w-16 ${
                      teal ? 'bg-white/15' : 'bg-white/45'
                    }`}>
                      <Icon className="h-9 w-9 sm:h-11 sm:w-11" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-xl font-black sm:text-2xl">{title}</h3>
                      <p className={`mt-1 text-xs font-semibold sm:text-sm ${
                        teal ? 'text-white/90' : 'text-[#574300]'
                      }`}>
                        {description}
                      </p>
                    </div>
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                      teal ? 'bg-white text-[#00676B]' : 'bg-white text-[#07575A]'
                    }`}>
                      <span aria-hidden="true" className="text-xl transition group-hover:translate-x-1">›</span>
                    </span>
                  </button>
                );
              })}
            </section>

            <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <div className="relative flex min-h-[155px] items-center gap-5 overflow-hidden rounded-[25px] border-2 border-white bg-gradient-to-r from-[#E2F8F4] to-[#CFF1EA] px-6 py-5 shadow-md sm:px-9">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#FFD83D] to-[#F4A900] text-4xl text-white shadow-md" aria-hidden="true">
                  ★
                </div>
                <div className="relative z-10">
                  <p className="text-base font-black text-[#16474A] sm:text-xl">Average Score</p>
                  <p className="mt-1 text-4xl font-black text-[#00676B] sm:text-5xl">
                    {loading ? '…' : formattedAverage}
                  </p>
                </div>
                <div className="absolute -bottom-12 -right-5 h-32 w-32 rounded-full bg-[#66D6A2]/30" />
              </div>

              <div className="relative flex min-h-[155px] items-center gap-5 overflow-hidden rounded-[25px] border-2 border-white bg-gradient-to-r from-[#FFF6D8] to-[#FFF0B5] px-6 py-5 shadow-md sm:px-9">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-[#006B70] text-white shadow-md">
                  <ClipboardDocumentCheckIcon className="h-12 w-12" />
                </div>
                <div className="relative z-10">
                  <p className="text-base font-black text-[#16474A] sm:text-xl">Total Visits</p>
                  <p className="mt-1 text-4xl font-black text-[#00676B] sm:text-5xl">
                    {loading ? '…' : attendanceRate}
                  </p>
                </div>
                <div className="absolute -bottom-12 -right-5 h-32 w-32 rounded-full bg-[#FFD84D]/35" />
              </div>
            </section>

            <footer className="border-t border-[#D6E9E7] py-5 text-center">
              <p className="text-xs font-semibold text-[#668082]">
                © {new Date().getFullYear()} Progress Schools. Keep learning and growing!
              </p>
            </footer>
          </section>
        )}

        {/* Inner pages */}
        {activeTab !== 'home' && (
          <section className="overflow-hidden rounded-[26px] border border-[#D3EEEE] bg-white shadow-[0_8px_28px_rgba(0,91,96,0.08)]">
            <div className="flex items-center gap-3 border-b border-[#D8EEEE] bg-gradient-to-r from-[#E7F8F7] to-[#F7FCFA] px-4 py-4 sm:px-6">
              <button
                type="button"
                onClick={() => setActiveTab('home')}
                className="rounded-full bg-white px-4 py-2 text-sm font-bold text-[#00666B] shadow-sm ring-1 ring-[#D2E9E8] transition hover:bg-[#FFF3C5]"
              >
                ← Home
              </button>
              <h2 className="text-lg font-black text-[#00565B] sm:text-xl">
                {primaryTabs.find(tab => tab.id === activeTab)?.label}
              </h2>
            </div>

                <div className="p-3 sm:p-6">
              {activeTab === 'learn' && (
                <LearningSpace onStartQuiz={quizId => setShowQuiz(quizId)} />
              )}

              {activeTab === 'quizzes' && (
                <QuizList onStartQuiz={quizId => setShowQuiz(quizId)} />
              )}

              {activeTab === 'library' && <Library />}

              {activeTab === 'results' && (
                <div className="space-y-7">
                  <div>
                    <h3 className="mb-4 text-lg font-black text-[#00565B]">
                      School results
                    </h3>

                    {loading ? (
                      <p className="rounded-2xl bg-[#F3FAF9] p-6 text-center text-sm text-slate-500">
                        Loading your results…
                      </p>
                    ) : reports.length ? (
                      <div className="space-y-4">
                        {reports.map((report, index) => (
                          <article
                            key={report.id || index}
                            className="rounded-2xl border border-[#D5E9E7] bg-white p-4 sm:p-5"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <h4 className="font-extrabold text-[#00565B]">
                                {report.term || 'School report'}
                              </h4>
                              <span className="rounded-full bg-[#DDF6F2] px-4 py-1.5 text-xs font-black text-[#00666B]">
                                Average: {report.average_score ?? formattedAverage}
                                {report.average_score != null ? '%' : ''}
                              </span>
                            </div>

                            {report.subjects?.length > 0 && (
                              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                                {report.subjects.map((subject, subjectIndex) => (
                                  <li
                                    key={`${subject.name}-${subjectIndex}`}
                                    className="flex items-center justify-between rounded-xl bg-[#F4FAF9] px-4 py-3 text-sm"
                                  >
                                    <span>{subject.name || 'Subject'}</span>
                                    <strong className="text-[#00666B]">
                                      {subject.score ?? '—'}
                                      {subject.score != null ? '%' : ''}
                                    </strong>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </article>
                        ))}
                      </div>
                    ) : (
                      <p className="rounded-2xl bg-[#F3FAF9] p-6 text-center text-sm text-slate-500">
                        Your school results will appear here.
                      </p>
                    )}
                  </div>

                  <div>
                    <h3 className="mb-4 text-lg font-black text-[#00565B]">
                      Quiz results
                    </h3>
                    <QuizResults onRetake={quizId => setShowQuiz(quizId)} />
                  </div>
                </div>
              )}

              {activeTab === 'attendance' && (
                <div className="space-y-4">
                  <div className="rounded-3xl bg-gradient-to-r from-[#DDF7F5] to-[#EFFBFA] p-6 text-center">
                    <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-white text-[#00777A] shadow-sm">
                      <CheckCircleIcon className="h-9 w-9" />
                    </div>
                    <p className="text-4xl font-black text-[#00666B]">
                      {loading ? '…' : attendanceRate}
                    </p>
                    <p className="mt-1 text-xs font-black uppercase tracking-[0.16em] text-[#527174]">
                      Total visits
                    </p>
                  </div>

                  {attendance.records.length ? (
                    attendance.records.map((record, index) => (
                      <div
                        key={record.id || `${record.date}-${index}`}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#D5E9E7] px-4 py-3"
                      >
                        <span className="text-sm font-medium text-slate-600">
                          {record.logged_in_at
                            ? new Date(record.logged_in_at).toLocaleString()
                            : 'Date unavailable'}
                        </span>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs text-slate-500">{record.device_info || 'Unknown device'}</span>
                          <span className="rounded-full bg-green-100 px-4 py-1.5 text-xs font-black text-green-700">Login</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="rounded-2xl bg-[#F3FAF9] p-6 text-center text-sm text-slate-500">
                      Your login visits will appear here.
                    </p>
                  )}
                </div>
              )}
            </div>
          </section>
        )}
      </main>

      {/* Fixed bottom navigation */}
      <nav aria-label="Learner dashboard" className="primary-learner-dashboard__nav fixed bottom-0 left-1/2 z-30 w-full max-w-[520px] -translate-x-1/2 px-2 pb-2">
        <div className="mx-auto flex w-full items-center justify-around gap-0.5 rounded-full border border-[#8DE5E1] bg-gradient-to-r from-[#005C62] via-[#00777A] to-[#005C62] px-1 py-1.5 shadow-[0_-4px_20px_rgba(0,91,96,0.12),0_8px_25px_rgba(0,0,0,0.18)]">
          {primaryTabs.map(({ id, label, Icon }) => {
            const isActive = activeTab === id;

            return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
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
};

export default PrimaryLearnerDashboard;
