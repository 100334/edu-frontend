import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  ArrowRightOnRectangleIcon,
  CalendarIcon,
  ChartBarIcon,
  DocumentTextIcon,
  HomeIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';

const NAVBAR_BG = '#006770';
const HEADER_BG = '#003B46';
const TEAL = '#2A9D8F';
const CYAN = '#00B4D8';

const getAverage = (subjects = []) => {
  const scores = subjects
    .map(subject => Number(subject?.score))
    .filter(score => Number.isFinite(score));
  return scores.length ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : '—';
};

const MobileStat = ({ icon: Icon, label, value, color }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
    <Icon className="mb-2 h-5 w-5" style={{ color }} />
    <div className="text-xl font-bold text-[#0A2540]">{value}</div>
    <div className="mt-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</div>
  </div>
);

export default function MobileLearnerDashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState([]);
  const [attendance, setAttendance] = useState({ stats: {}, records: [] });

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

  return (
    <div className="min-h-screen bg-[#F5F2EB] pb-20">
      <header className="sticky top-0 z-30 bg-[#003B46] px-4 pb-5 pt-4 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/schoologo.png"
              alt="Progress Secondary School logo"
              className="h-12 w-12 rounded-xl bg-white p-1 object-contain"
            />
            <div>
              <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/70">Learner</div>
              <div className="text-sm font-black tracking-[0.14em]">PROGRESS</div>
              <div className="text-[9px] text-white/70">Secondary School</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="rounded-xl bg-red-600 px-3 py-2 text-xs font-semibold text-white"
          >
            <ArrowRightOnRectangleIcon className="mr-1 inline h-4 w-4" />
            Logout
          </button>
        </div>
        <div className="mt-5">
          <div className="text-xs font-bold uppercase tracking-widest text-[#7DE3FF]">Dashboard</div>
          <h1 className="mt-1 text-xl font-bold">{user?.name || 'Learner'} <span className="text-[#7DE3FF]">👋</span></h1>
          <p className="mt-1 text-sm text-white/75">{user?.form || 'Learner'}</p>
        </div>
      </header>

      <main className="space-y-5 px-4 py-5">
        {activeTab === 'overview' && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <MobileStat icon={DocumentTextIcon} label="Reports" value={reports.length} color={TEAL} />
              <MobileStat icon={CalendarIcon} label="Attendance" value={attendanceRate === '—' ? '—' : `${attendanceRate}%`} color={CYAN} />
              <MobileStat icon={ChartBarIcon} label="Average" value={latestReport ? `${getAverage(latestReport.subjects)}%` : '—'} color={TEAL} />
              <MobileStat icon={UserCircleIcon} label="Form" value={user?.form || '—'} color="#6C63FF" />
            </div>

            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-4 py-3">
                <h2 className="flex items-center gap-2 font-bold text-[#0A2540]">
                  <DocumentTextIcon className="h-5 w-5 text-[#2A9D8F]" />
                  Latest
                </h2>
              </div>
              <div className="p-4">
                {latestReport ? (
                  <>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-bold text-[#0A2540]">{latestReport.term || 'Report card'}</div>
                        <div className="text-xs text-slate-500">{latestReport.form || user?.form || 'Form'}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-[#2A9D8F]">{getAverage(latestReport.subjects)}%</div>
                        <div className="text-[10px] uppercase text-slate-500">Average</div>
                      </div>
                    </div>
                    <button onClick={() => setActiveTab('reports')} className="mt-4 w-full rounded-xl bg-[#2A9D8F]/10 py-3 text-sm font-semibold text-[#006770]">
                      All reports
                    </button>
                  </>
                ) : (
                  <p className="py-4 text-center text-sm text-slate-500">No reports yet.</p>
                )}
              </div>
            </section>
          </>
        )}

        {activeTab === 'reports' && (
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#0A2540]">Report cards</h2>
            {reports.length ? reports.map(report => (
              <article key={report.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-[#0A2540]">{report.term || 'Report card'}</div>
                    <div className="text-xs text-slate-500">{report.form || user?.form} · {report.academic_year || ''}</div>
                  </div>
                  <div className="text-lg font-bold text-[#2A9D8F]">{getAverage(report.subjects)}%</div>
                </div>
                <div className="mt-3 space-y-2">
                  {(report.subjects || []).slice(0, 4).map(subject => (
                    <div key={subject.name} className="flex justify-between text-sm">
                      <span className="text-slate-600">{subject.name}</span>
                      <span className="font-semibold text-[#0A2540]">{subject.score}%</span>
                    </div>
                  ))}
                </div>
              </article>
            )) : <p className="rounded-2xl bg-white p-6 text-center text-sm text-slate-500">No reports yet.</p>}
          </section>
        )}

        {activeTab === 'attendance' && (
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#0A2540]">Attendance</h2>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm">
              <div className="text-4xl font-bold text-[#2A9D8F]">{attendanceRate === '—' ? '—' : `${attendanceRate}%`}</div>
              <div className="mt-1 text-xs font-bold uppercase tracking-wide text-slate-500">Rate</div>
            </div>
            {attendance.records.length ? attendance.records.slice(0, 12).map(record => (
              <div key={record.id || `${record.date}-${record.status}`} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <span className="text-sm text-slate-600">{record.date ? new Date(record.date).toLocaleDateString() : 'Date unavailable'}</span>
                <span className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${record.status === 'present' ? 'bg-green-100 text-green-700' : record.status === 'late' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                  {record.status || 'unknown'}
                </span>
              </div>
            )) : <p className="rounded-2xl bg-white p-6 text-center text-sm text-slate-500">No records yet.</p>}
          </section>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-white/10 bg-[#006770] px-2 py-2 shadow-lg">
        <div className="mx-auto flex max-w-md justify-around">
          {[
            { id: 'overview', label: 'Home', icon: HomeIcon },
            { id: 'reports', label: 'Reports', icon: DocumentTextIcon },
            { id: 'attendance', label: 'Attendance', icon: CalendarIcon }
          ].map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)} className={`flex min-w-[84px] flex-col items-center gap-1 rounded-xl px-3 py-2 text-[10px] font-semibold ${activeTab === id ? 'bg-white text-[#006770]' : 'text-white/80'}`}>
              <Icon className="h-5 w-5" />
              {label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
