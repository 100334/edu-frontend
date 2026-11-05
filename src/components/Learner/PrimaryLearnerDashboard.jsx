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
  ArrowRightIcon,
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
  {
    tab: 'attendance',
    title: 'Attendance',
    description: 'Check your school days',
    Icon: ClipboardDocumentCheckIcon,
    theme: 'gold',
  },
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
      toast.error('Could not load your attendance');
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  if (showQuiz) {
    return (
      <div className="min-h-screen bg-[#F2FBFC] px-4 py-5">
        <div className="mx-auto max-w-6xl">
          <button
            onClick={() => setShowQuiz(null)}
            className="mb-4 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-[#00666B] shadow-sm ring-1 ring-[#D6EEEE] transition hover:bg-[#E9F8F8]"
          >
            ← Back to learning
          </button>
          <QuizTaking
            quizId={showQuiz}
            onComplete={() => setShowQuiz(null)}
            questionsPerPage={1}
          />
        </div>
      </div>
    );
  }

  const average =
    reports[0]?.average_score ??
    reports[0]?.subjects?.reduce(
      (total, subject) => total + (Number(subject.score) || 0),
      0
    ) / (reports[0]?.subjects?.length || 1);

  const attendanceRate =
    attendance.stats?.rate ?? attendance.stats?.percentage;

  const learnerName = user?.name || 'Learner';
  const firstName = learnerName.trim().split(' ')[0];
  const learnerClass = user?.form || 'Primary learner';

  const formattedAverage =
    Number.isFinite(Number(average)) && reports.length
      ? `${Math.round(Number(average))}%`
      : '—';

  return (
    <div className="min-h-screen bg-[#F2FBFC] pb-28 text-[#073F43]">
      {/* Top navigation */}
      <header className="relative z-20 overflow-hidden border-b-[5px] border-[#F6C642] bg-gradient-to-r from-[#005D63] via-[#00777A] to-[#005D63] text-white shadow-lg">
        <div className="mx-auto flex min-h-[88px] max-w-[1600px] items-center justify-between gap-4 px-4 py-3 sm:px-7 lg:px-10">
          <button
            type="button"
            onClick={() => setActiveTab('home')}
            className="flex shrink-0 items-center gap-3 text-left"
            aria-label="Go to dashboard home"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-[#FFD44D] ring-1 ring-white/20 sm:h-16 sm:w-16">
              <BookOpenIcon className="h-10 w-10 stroke-[1.8]" />
            </div>
            <div className="hidden sm:block">
              <p className="text-lg font-black leading-tight sm:text-xl">
                My Learning
              </p>
              <p className="text-lg font-black leading-tight sm:text-xl">
                Space
              </p>
            </div>
          </button>

          <div className="hidden h-12 w-px bg-[#6BD4D2]/80 lg:block" />

          <h1 className="flex-1 text-center text-xl font-black tracking-tight sm:text-2xl lg:text-4xl">
            Learner Dashboard
          </h1>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <button
              type="button"
              aria-label="Notifications"
              className="relative flex h-12 w-12 items-center justify-center rounded-full border border-[#20B9B7] bg-[#004F55]/70 text-[#FFD44D] shadow-inner transition hover:bg-[#00666B] sm:h-16 sm:w-16"
            >
              <BellIcon className="h-7 w-7 sm:h-8 sm:w-8" />
              <span className="absolute right-2 top-2 h-3 w-3 rounded-full border-2 border-[#00666B] bg-red-500 sm:right-3 sm:top-3" />
            </button>

            <div className="flex items-center gap-2 rounded-full border border-[#20B9B7] bg-[#004F55]/70 py-1 pl-1 pr-3 shadow-inner sm:gap-3 sm:py-1.5 sm:pl-2 sm:pr-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border-[3px] border-[#F6C642] bg-[#E9FBF8] text-[#00858A] sm:h-14 sm:w-14">
                <UserCircleIcon className="h-9 w-9 sm:h-12 sm:w-12" />
              </div>
              <div className="hidden text-left sm:block">
                <p className="max-w-[150px] truncate text-sm font-black leading-tight lg:text-base">
                  {learnerName}
                </p>
                <p className="text-xs font-semibold text-[#D7F6F3] lg:text-sm">
                  {learnerClass}
                </p>
              </div>
              <button
                type="button"
                onClick={logout}
                title="Log out"
                aria-label="Log out"
                className="ml-1 rounded-full p-1 text-white/90 transition hover:bg-white/10 hover:text-[#FFD44D]"
              >
                <ArrowRightIcon className="h-5 w-5 rotate-90" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] space-y-6 px-4 py-5 sm:px-7 sm:py-7 lg:px-10">
        {activeTab === 'home' && (
          <>
            {/* Welcome banner */}
            <section className="relative isolate grid min-h-[250px] overflow-hidden rounded-[30px] bg-gradient-to-r from-[#00686D] via-[#008D8D] to-[#00A7A5] shadow-[0_12px_28px_rgba(0,91,96,0.18)] lg:min-h-[300px] lg:grid-cols-[0.9fr_1.1fr]">
              <div className="pointer-events-none absolute -left-16 -top-24 h-64 w-64 rounded-full border-[18px] border-white/5" />
              <div className="pointer-events-none absolute -bottom-28 right-[-3rem] h-72 w-72 rounded-full border-[20px] border-[#FFD34D]/25" />

              {/* Decorative learner illustration area.
                  Replace this block with your own banner image if available. */}
              <div className="relative flex min-h-[190px] items-end justify-center overflow-hidden bg-gradient-to-br from-[#BCEFEA] via-[#E7F8EF] to-[#78D3C9] px-5 pt-6 lg:min-h-[300px]">
                <div className="absolute inset-0 opacity-40 [background-image:radial-gradient(#FFFFFF_1.5px,transparent_1.5px)] [background-size:22px_22px]" />
                <div className="absolute bottom-0 left-0 right-0 h-16 rounded-t-[50%] bg-[#70C65E]/70" />
                <div className="relative z-10 mb-5 flex items-end gap-3 sm:gap-6">
                  <div className="relative flex h-36 w-32 flex-col items-center justify-end sm:h-44 sm:w-40">
                    <div className="absolute bottom-[76px] h-[76px] w-[76px] rounded-[48%] border-4 border-[#5A3024] bg-[#8A4C32] shadow-md">
                      <div className="absolute left-4 top-8 h-2 w-2 rounded-full bg-[#182B2B]" />
                      <div className="absolute right-4 top-8 h-2 w-2 rounded-full bg-[#182B2B]" />
                      <div className="absolute bottom-4 left-1/2 h-3 w-7 -translate-x-1/2 rounded-b-full border-b-[3px] border-[#3B1D18]" />
                    </div>
                    <div className="h-24 w-28 rounded-t-[35px] border-x-4 border-t-4 border-[#145B9B] bg-[#2786D7] shadow-lg sm:w-36" />
                    <div className="absolute bottom-0 h-3 w-32 rounded-full bg-[#E9F6E8]/70" />
                  </div>
                  <div className="relative flex h-40 w-32 flex-col items-center justify-end sm:h-48 sm:w-40">
                    <div className="absolute bottom-[82px] h-[78px] w-[78px] rounded-[48%] border-4 border-[#39241D] bg-[#9B5B3D] shadow-md">
                      <div className="absolute -top-2 left-1 h-5 w-16 rounded-full bg-[#1D2525]" />
                      <div className="absolute left-4 top-9 h-2 w-2 rounded-full bg-[#182B2B]" />
                      <div className="absolute right-4 top-9 h-2 w-2 rounded-full bg-[#182B2B]" />
                      <div className="absolute bottom-4 left-1/2 h-3 w-7 -translate-x-1/2 rounded-b-full border-b-[3px] border-[#4A241C]" />
                    </div>
                    <div className="h-24 w-28 rounded-t-[35px] border-x-4 border-t-4 border-[#145B9B] bg-[#3995E6] shadow-lg sm:w-36" />
                    <div className="absolute bottom-0 h-3 w-32 rounded-full bg-[#E9F6E8]/70" />
                  </div>
                </div>
                <div className="absolute bottom-5 left-1/2 z-20 flex w-[72%] -translate-x-1/2 items-center justify-center rounded-t-xl border-4 border-[#8B5A22] bg-[#FFF5D7] px-5 py-2 shadow-xl">
                  <BookOpenIcon className="h-10 w-20 text-[#08777A] sm:h-12 sm:w-24" />
                </div>
              </div>

              <div className="relative z-10 flex flex-col justify-center px-6 py-8 text-center text-white sm:px-10 lg:px-12 lg:text-left">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-white/10 text-[#FFE16B] ring-1 ring-white/20 lg:mx-0">
                  <AcademicCapIcon className="h-11 w-11" />
                </div>
                <p className="text-sm font-bold text-[#C8F4EF] sm:text-base">
                  Welcome to My Learning Space
                </p>
                <h2 className="mt-1 text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
                  Hello, {firstName}!
                </h2>
                <p className="mx-auto mt-2 max-w-lg text-sm text-white/85 sm:text-base lg:mx-0">
                  Your learning journey starts here. Explore lessons, read
                  books and keep track of your progress.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('learn')}
                  className="mx-auto mt-5 inline-flex items-center justify-center gap-5 rounded-full bg-gradient-to-b from-[#FFE77B] to-[#FFBF19] px-9 py-3 text-lg font-black text-[#073F43] shadow-[0_5px_0_#D99B00,0_10px_18px_rgba(0,0,0,0.18)] transition hover:-translate-y-0.5 hover:brightness-105 active:translate-y-0 lg:mx-0 lg:w-fit lg:px-12 lg:text-xl"
                >
                  Learn
                  <ArrowRightIcon className="h-6 w-6 stroke-[3]" />
                </button>
              </div>
            </section>

            {/* Summary statistics */}
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-5">
              <div className="flex min-h-[112px] items-center gap-4 rounded-[24px] border-2 border-[#F3C34A] bg-gradient-to-r from-white to-[#FFF8E6] px-5 py-4 shadow-[0_7px_0_rgba(232,181,45,0.12)] sm:px-7">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#FFF0B5] text-[#936500] sm:h-20 sm:w-20">
                  <ChartBarIcon className="h-11 w-11 stroke-[2.5]" />
                </div>
                <div>
                  <p className="text-4xl font-black leading-none text-[#07575A] sm:text-5xl">
                    {loading ? '…' : formattedAverage}
                  </p>
                  <p className="mt-1 text-base font-bold text-[#173F43] sm:text-lg">
                    Average
                  </p>
                </div>
              </div>

              <div className="flex min-h-[112px] items-center gap-4 rounded-[24px] border-2 border-[#12BFC0] bg-gradient-to-r from-white to-[#E4FAFA] px-5 py-4 shadow-[0_7px_0_rgba(0,171,174,0.10)] sm:px-7">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#C9F5F3] text-[#00686D] sm:h-20 sm:w-20">
                  <ClipboardDocumentCheckIcon className="h-11 w-11 stroke-[2.3]" />
                </div>
                <div>
                  <p className="text-4xl font-black leading-none text-[#07575A] sm:text-5xl">
                    {loading
                      ? '…'
                      : attendanceRate == null
                        ? '—'
                        : `${attendanceRate}%`}
                  </p>
                  <p className="mt-1 text-base font-bold text-[#173F43] sm:text-lg">
                    Attendance
                  </p>
                </div>
              </div>

              <div className="flex min-h-[112px] items-center gap-4 rounded-[24px] border-2 border-[#F3C34A] bg-gradient-to-r from-white to-[#FFF8E6] px-5 py-4 shadow-[0_7px_0_rgba(232,181,45,0.12)] sm:px-7">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#FFF0B5] text-[#936500] sm:h-20 sm:w-20">
                  <DocumentTextIcon className="h-11 w-11 stroke-[2.2]" />
                </div>
                <div>
                  <p className="text-4xl font-black leading-none text-[#07575A] sm:text-5xl">
                    {reports.length}
                  </p>
                  <p className="mt-1 text-base font-bold text-[#173F43] sm:text-lg">
                    Reports
                  </p>
                </div>
              </div>
            </section>

            {/* Main feature tiles */}
            <section className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
              {quickLinks.map(({ tab, title, description, Icon, theme }) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`group relative flex min-h-[150px] flex-col items-center justify-center overflow-hidden rounded-[28px] px-3 py-5 shadow-[0_8px_0_rgba(0,91,96,0.10)] transition duration-200 hover:-translate-y-1 hover:shadow-xl sm:min-h-[175px] ${
                    theme === 'teal'
                      ? 'bg-gradient-to-br from-[#009B9D] via-[#00777C] to-[#00585F] text-white'
                      : 'bg-gradient-to-br from-[#FFE47A] via-[#FFC72D] to-[#F3A900] text-[#102F2E]'
                  }`}
                >
                  <div className="pointer-events-none absolute -bottom-10 -left-8 h-28 w-[130%] -rotate-6 rounded-[50%] bg-white/10" />
                  <Icon
                    className={`relative z-10 h-16 w-16 stroke-[1.9] transition group-hover:scale-105 sm:h-[76px] sm:w-[76px] ${
                      theme === 'teal' ? 'text-white' : 'text-[#5C4300]'
                    }`}
                  />
                  <span className="relative z-10 mt-2 text-xl font-black sm:text-2xl">
                    {title}
                  </span>
                  <span
                    className={`relative z-10 mt-1 text-xs font-semibold ${
                      theme === 'teal' ? 'text-white/75' : 'text-[#604900]/80'
                    }`}
                  >
                    {description}
                  </span>
                </button>
              ))}
            </section>
          </>
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
                      {loading
                        ? '…'
                        : attendanceRate == null
                          ? '—'
                          : `${attendanceRate}%`}
                    </p>
                    <p className="mt-1 text-xs font-black uppercase tracking-[0.16em] text-[#527174]">
                      My attendance
                    </p>
                  </div>

                  {attendance.records.length ? (
                    attendance.records.map((record, index) => (
                      <div
                        key={record.id || `${record.date}-${index}`}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#D5E9E7] px-4 py-3"
                      >
                        <span className="text-sm font-medium text-slate-600">
                          {record.date
                            ? new Date(record.date).toLocaleDateString(undefined, {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                              })
                            : 'Date unavailable'}
                        </span>
                        <span
                          className={`rounded-full px-4 py-1.5 text-xs font-black capitalize ${
                            record.status === 'present'
                              ? 'bg-green-100 text-green-700'
                              : record.status === 'late'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {record.status_display || record.status || 'Unknown'}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="rounded-2xl bg-[#F3FAF9] p-6 text-center text-sm text-slate-500">
                      Attendance records will appear here.
                    </p>
                  )}
                </div>
              )}
            </div>
          </section>
        )}
      </main>

      {/* Fixed bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 px-2 pb-2 sm:px-4 sm:pb-3">
        <div className="mx-auto flex max-w-[1580px] items-center justify-around gap-1 rounded-full border border-[#8DE5E1] bg-gradient-to-r from-[#005C62] via-[#00777A] to-[#005C62] px-1.5 py-2 shadow-[0_-4px_20px_rgba(0,91,96,0.12),0_8px_25px_rgba(0,0,0,0.18)] sm:px-5 sm:py-2.5">
          {primaryTabs.map(({ id, label, Icon }) => {
            const isActive = activeTab === id;

            return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                aria-current={isActive ? 'page' : undefined}
                className={`flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-full px-2 py-2 text-[10px] font-black transition sm:gap-2 sm:px-3 sm:py-2.5 sm:text-sm lg:text-base ${
                  isActive
                    ? 'bg-gradient-to-b from-[#FFE77B] to-[#FFBF19] text-[#073F43] shadow-md'
                    : 'text-white hover:bg-white/10'
                }`}
              >
                <Icon className="h-5 w-5 shrink-0 stroke-[2.1] sm:h-7 sm:w-7" />
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
