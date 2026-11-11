import React from 'react';
import {
  AcademicCapIcon,
  ArrowRightIcon,
  BellIcon,
  BookOpenIcon,
  ChartBarIcon,
  ChevronDownIcon,
  ClipboardDocumentCheckIcon,
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

const DesktopTabletDashboard = ({
  activeTab,
  onTabChange,
  learnerName,
  firstName,
  learnerClass,
  loading,
  formattedAverage,
  attendanceRate,
  onLogout,
}) => (
  <>
    <header className="primary-learner-dashboard__desktop-header sticky top-0 z-50 border-b-[3px] border-[#F6CA35] bg-gradient-to-r from-[#00565D] to-[#007C7C] text-white shadow-md">
      <div className="mx-auto flex min-h-[76px] max-w-[1800px] items-center justify-between gap-3 px-4 sm:px-5 xl:min-h-[90px] xl:px-10">
        <div className="flex shrink-0 items-center gap-2 border-r-2 border-white/40 pr-4 sm:gap-3 sm:pr-5 xl:pr-8">
          <AcademicCapIcon className="h-10 w-10 shrink-0 text-[#FFD52E] sm:h-12 sm:w-12 xl:h-14 xl:w-14" />
          <div>
            <h1 className="whitespace-nowrap text-sm font-black leading-tight text-white sm:text-lg xl:text-2xl">
              PROGRESS SCHOOLS
            </h1>
            <p className="whitespace-nowrap text-[10px] font-black tracking-wider text-[#FFD52E] sm:text-xs xl:text-sm">
              MY LEARNING SPACE
            </p>
          </div>
        </div>

        <nav
          aria-label="Learner dashboard"
          className="flex min-w-0 flex-1 items-center justify-center gap-1 overflow-x-auto xl:gap-3"
        >
          {primaryTabs.map(({ id, label, Icon }) => {
            const selected = activeTab === id;

            return (
              <button
                key={id}
                type="button"
                onClick={() => onTabChange(id)}
                aria-current={selected ? 'page' : undefined}
                className={`flex shrink-0 items-center gap-2 rounded-full px-3 py-3 text-sm font-extrabold transition-all xl:px-5 ${
                  selected
                    ? 'bg-[#FFD52E] text-[#06484C] shadow-md'
                    : 'text-white hover:bg-white/10'
                }`}
              >
                <Icon className="h-5 w-5 xl:h-6 xl:w-6" />
                <span className="hidden lg:inline">{label}</span>
              </button>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-2 border-l-2 border-white/40 pl-3 sm:gap-3 sm:pl-4 xl:pl-8">
          <button
            type="button"
            aria-label="Notifications"
            className="relative rounded-full p-2 transition hover:bg-white/10"
          >
            <BellIcon className="h-6 w-6" />
            <span className="absolute right-1 top-1 h-3 w-3 rounded-full border-2 border-[#006D70] bg-red-500" />
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="flex items-center gap-2 rounded-full transition hover:bg-white/10"
            aria-label={`Log out, signed in as ${learnerName}`}
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full border-[3px] border-[#FFD52E] bg-white sm:h-12 sm:w-12">
              <UserCircleIcon className="h-8 w-8 text-[#00676B]" />
            </span>
            <span className="hidden text-left lg:block">
              <span className="block text-sm font-black">{learnerName}</span>
              <span className="block text-xs text-teal-100">{learnerClass}</span>
            </span>
            <ChevronDownIcon className="hidden h-5 w-5 lg:block" />
          </button>
        </div>
      </div>
    </header>

    {activeTab === 'home' && (
      <section className="primary-learner-dashboard__desktop-home w-full pb-6 lg:pb-7">
        <section className="relative isolate min-h-[240px] overflow-hidden rounded-b-[30px] bg-[#00676B] shadow-lg sm:min-h-[260px] xl:min-h-[300px]">
          <img
            src="/image6.png"
            alt="Two school learners reading a book"
            className="absolute inset-0 -z-20 h-full w-full object-cover object-center"
          />
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#00676B]/95 via-[#00676B]/80 via-45% to-transparent" />
          <div className="flex min-h-[240px] items-center px-6 py-6 sm:min-h-[260px] sm:px-10 xl:min-h-[300px] xl:px-16">
            <div className="max-w-[620px] text-white drop-shadow-[0_2px_3px_rgba(0,0,0,0.35)]">
              <span className="inline-block rounded-full bg-[#07575A]/90 px-5 py-2 text-xs font-black tracking-wider text-white xl:text-sm">
                MY LEARNING SPACE
              </span>
              <h2 className="mt-4 text-4xl font-black leading-tight text-white sm:text-5xl xl:text-7xl">
                Hello, {firstName}!
              </h2>
              <p className="mt-3 text-lg font-extrabold sm:text-xl xl:text-2xl">
                Welcome to your learning space.
              </p>
              <p className="mt-1 text-sm text-white/95 sm:text-base xl:text-xl">
                Learn, practise and grow your knowledge every day.
              </p>
              <button
                type="button"
                onClick={() => onTabChange('learn')}
                className="mt-5 inline-flex items-center gap-4 rounded-full bg-gradient-to-r from-[#007C7C] to-[#00565D] px-8 py-3.5 text-base font-black text-white shadow-lg transition hover:-translate-y-1 hover:brightness-105 xl:text-lg"
              >
                Start Learning
                <ArrowRightIcon className="h-6 w-6" />
              </button>
            </div>
          </div>
          <div className="pointer-events-none absolute bottom-0 left-0 h-[7px] w-full bg-gradient-to-r from-[#FFD52E] via-white to-[#FFD52E]" />
        </section>

        <div className="mx-auto w-full max-w-[1600px] space-y-7 px-4 pt-6 lg:px-8 lg:pt-7">
          <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          <div className="col-span-full mb-0 flex items-center gap-3">
            <div className="h-9 w-2 rounded-full bg-[#FFD52E]" />
            <h2 className="text-2xl font-black text-[#07575A] xl:text-3xl">
              What would you like to do?
            </h2>
          </div>
          {quickLinks.map(({ tab, title, description, Icon, theme }) => {
            const teal = theme === 'teal';

            return (
              <button
                key={tab}
                type="button"
                onClick={() => onTabChange(tab)}
                className={`group flex min-h-[130px] items-center gap-3 rounded-[24px] border-b-[5px] px-4 py-5 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg xl:min-h-[140px] xl:gap-5 xl:px-6 ${
                  teal
                    ? 'border-[#00595B] bg-gradient-to-br from-[#008F8A] to-[#00696B] text-white'
                    : 'border-[#E5AA00] bg-gradient-to-br from-[#FFE96C] to-[#FFC900] text-[#103E40]'
                }`}
              >
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20 xl:h-20 xl:w-20">
                  <Icon className={`h-9 w-9 xl:h-12 xl:w-12 ${
                    teal ? 'text-white' : 'text-[#5C4300]'
                  }`} />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className={`text-xl font-black xl:text-3xl ${teal ? 'text-white' : 'text-[#103E40]'}`}>
                    {title}
                  </h3>
                  <p className={`mt-1 text-xs font-semibold xl:text-base ${
                    teal ? 'text-white/90' : 'text-[#574300]'
                  }`}>
                    {description}
                  </p>
                </div>
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-[#00676B] shadow-sm xl:h-11 xl:w-11">
                  <ArrowRightIcon className="h-6 w-6" />
                </div>
              </button>
            );
          })}
          </section>

          <section>
            <div className="mb-3 flex items-center gap-3">
            <div className="h-9 w-2 rounded-full bg-[#FFD52E]" />
            <h2 className="text-2xl font-black text-[#07575A] xl:text-3xl">
              My Progress
            </h2>
            </div>
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <div className="relative flex min-h-[155px] items-center gap-6 overflow-hidden rounded-[28px] border-[7px] border-white bg-gradient-to-r from-[#DDF6F3] to-[#EAFBF8] px-5 py-5 shadow-md xl:px-12">
              <div className="z-10 flex h-20 w-20 shrink-0 items-center justify-center rounded-[20px] border-[3px] border-white bg-[#FFDB31] shadow-sm xl:h-24 xl:w-24">
                <span className="text-5xl xl:text-6xl">🏆</span>
              </div>
              <div className="z-10">
                <h3 className="text-base font-black text-[#123F42] xl:text-xl">
                  Average Score
                </h3>
                <p className="text-4xl font-black leading-tight text-[#00676B] xl:text-6xl">
                  {loading ? '…' : formattedAverage}
                </p>
                <p className="text-xs text-[#637778] xl:text-base">
                  Your average quiz performance
                </p>
              </div>
              <div className="absolute -bottom-20 -right-8 h-36 w-64 rotate-[-15deg] rounded-[50%] bg-[#79D9B6]/70" />
            </div>

            <div className="relative flex min-h-[155px] items-center gap-6 overflow-hidden rounded-[28px] border-[7px] border-white bg-gradient-to-r from-[#FFF6D9] to-[#FFFBEA] px-5 py-5 shadow-md xl:px-12">
              <div className="z-10 flex h-20 w-20 shrink-0 items-center justify-center xl:h-24 xl:w-24">
                <span className="text-5xl xl:text-7xl">🗓️</span>
              </div>
              <div className="z-10">
                <h3 className="text-base font-black text-[#123F42] xl:text-xl">
                  Total Visits
                </h3>
                <p className="text-4xl font-black leading-tight text-[#00676B] xl:text-6xl">
                  {loading ? '…' : attendanceRate}
                </p>
                <p className="text-xs text-[#637778] xl:text-base">
                  Your recorded school visits
                </p>
              </div>
              <div className="absolute -bottom-20 -right-8 h-36 w-64 rotate-[-15deg] rounded-[50%] bg-[#FFDB4D]/70" />
            </div>
            </div>
          </section>

          <footer className="border-t border-[#D6E9E7] py-5 text-center">
            <p className="text-xs font-semibold text-[#668082]">
              © {new Date().getFullYear()} Progress Schools. Keep learning and growing!
            </p>
          </footer>
        </div>
      </section>
    )}
  </>
);

export default DesktopTabletDashboard;
