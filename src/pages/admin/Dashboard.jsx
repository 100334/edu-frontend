import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from '../../components/admin/AdminSidebar';
import { useAuth } from '../../context/AuthContext';
import { 
  UsersIcon, 
  AcademicCapIcon, 
  ShieldCheckIcon,
  ChartBarIcon,
  BuildingOfficeIcon,
  BookOpenIcon,
  UserGroupIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import StatCard from '../../components/common/StatCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalTeachers: 0,
    totalLearners: 0,
    activeUsers: 0,
    totalReports: 0,
    totalClasses: 0,
    totalSubjects: 0,
    attendanceRate: 0,
    newThisMonth: 0
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [systemHealth, setSystemHealth] = useState({
    database: 'healthy',
    api: 'healthy',
    lastBackup: '2025-03-17T02:00:00',
    activeSessions: 24
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      // Mock data - replace with actual API calls
      setStats({
        totalTeachers: 5,
        totalLearners: 120,
        activeUsers: 98,
        totalReports: 45,
        totalClasses: 12,
        totalSubjects: 24,
        attendanceRate: 94,
        newThisMonth: 15
      });

      setRecentActivities([
        {
          id: 1,
          action: 'New teacher added',
          user: 'John Smith',
          time: '10 minutes ago',
          icon: UsersIcon,
          color: 'text-ink'
        },
        {
          id: 2,
          action: 'Registration numbers assigned',
          user: '5 new learners',
          time: '1 hour ago',
          icon: AcademicCapIcon,
          color: 'text-azure'
        },
        {
          id: 3,
          action: 'System backup completed',
          user: 'Automated',
          time: '2 hours ago',
          icon: ShieldCheckIcon,
          color: 'text-green'
        },
        {
          id: 4,
          action: 'New class created',
          user: 'Form 3 Science',
          time: '3 hours ago',
          icon: BuildingOfficeIcon,
          color: 'text-gold'
        }
      ]);
    } catch (error) {
      console.error('Dashboard error:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getHealthColor = (status) => {
    return status === 'healthy' ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <AdminSidebar />
        <main className="flex-1 p-8 flex items-center justify-center">
          <LoadingSpinner />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar />
      
      <main className="flex-1 p-8 overflow-y-auto">
        {/* Welcome Header with Stats */}
        <div className="mb-8 bg-gradient-to-r from-ink to-azure rounded-2xl p-6 text-white">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                Welcome back, {user?.name?.split(' ')[0] || 'Administrator'}! 👋
              </h1>
              <p className="text-white/80">
                Here's what's happening with your institution today.
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2">
              <p className="text-sm text-white/60">Last updated</p>
              <p className="font-semibold">{new Date().toLocaleDateString()}</p>
            </div>
          </div>
          
          {/* Quick Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
              <p className="text-xs text-white/60">New This Month</p>
              <p className="text-2xl font-bold">{stats.newThisMonth}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
              <p className="text-xs text-white/60">Attendance Rate</p>
              <p className="text-2xl font-bold">{stats.attendanceRate}%</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
              <p className="text-xs text-white/60">Total Classes</p>
              <p className="text-2xl font-bold">{stats.totalClasses}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
              <p className="text-xs text-white/60">Subjects</p>
              <p className="text-2xl font-bold">{stats.totalSubjects}</p>
            </div>
          </div>
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={<UsersIcon className="w-8 h-8" />}
            value={stats.totalTeachers}
            label="Total Teachers"
            color="ink"
            trend="+2 this month"
          />
          <StatCard
            icon={<AcademicCapIcon className="w-8 h-8" />}
            value={stats.totalLearners}
            label="Total Learners"
            color="azure"
            trend="+15 this month"
          />
          <StatCard
            icon={<ShieldCheckIcon className="w-8 h-8" />}
            value={stats.activeUsers}
            label="Active Users"
            color="green"
            trend="82% active"
          />
          <StatCard
            icon={<ChartBarIcon className="w-8 h-8" />}
            value={stats.totalReports}
            label="Reports Generated"
            color="gold"
            trend="+8 this week"
          />
        </div>

        {/* Quick Actions and System Health */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Quick Actions - Takes 2 columns */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border-2 border-ink/10 p-6">
              <h2 className="text-lg font-semibold text-ink mb-4 flex items-center gap-2">
                <span className="w-1 h-5 bg-azure rounded-full"></span>
                Quick Actions
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => navigate('/admin/teachers')}
                  className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-ink/5 to-azure/5 p-6 hover:shadow-md transition-all border-2 border-ink/10 hover:border-azure/30"
                >
                  <div className="absolute top-0 right-0 w-20 h-20 bg-azure/10 rounded-full -mr-8 -mt-8 group-hover:scale-150 transition-transform"></div>
                  <UsersIcon className="w-8 h-8 text-ink mb-3" />
                  <h3 className="font-semibold text-ink mb-1">Manage Teachers</h3>
                  <p className="text-xs text-gray-500">Add, edit or remove teachers</p>
                </button>

                <button
                  onClick={() => navigate('/admin/learners')}
                  className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-ink/5 to-azure/5 p-6 hover:shadow-md transition-all border-2 border-ink/10 hover:border-azure/30"
                >
                  <div className="absolute top-0 right-0 w-20 h-20 bg-azure/10 rounded-full -mr-8 -mt-8 group-hover:scale-150 transition-transform"></div>
                  <AcademicCapIcon className="w-8 h-8 text-azure mb-3" />
                  <h3 className="font-semibold text-ink mb-1">Assign Registration</h3>
                  <p className="text-xs text-gray-500">Manage learner registrations</p>
                </button>

                <button
                  onClick={() => navigate('/admin/classes')}
                  className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-ink/5 to-azure/5 p-6 hover:shadow-md transition-all border-2 border-ink/10 hover:border-azure/30"
                >
                  <div className="absolute top-0 right-0 w-20 h-20 bg-azure/10 rounded-full -mr-8 -mt-8 group-hover:scale-150 transition-transform"></div>
                  <BuildingOfficeIcon className="w-8 h-8 text-gold mb-3" />
                  <h3 className="font-semibold text-ink mb-1">Manage Classes</h3>
                  <p className="text-xs text-gray-500">Create Form 1-4 classes</p>
                </button>

                <button
                  onClick={() => navigate('/admin/subjects')}
                  className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-ink/5 to-azure/5 p-6 hover:shadow-md transition-all border-2 border-ink/10 hover:border-azure/30"
                >
                  <div className="absolute top-0 right-0 w-20 h-20 bg-azure/10 rounded-full -mr-8 -mt-8 group-hover:scale-150 transition-transform"></div>
                  <BookOpenIcon className="w-8 h-8 text-green mb-3" />
                  <h3 className="font-semibold text-ink mb-1">Manage Subjects</h3>
                  <p className="text-xs text-gray-500">Create custom subjects</p>
                </button>
              </div>
            </div>
          </div>

          {/* System Health - Takes 1 column */}
          <div className="bg-white rounded-xl border-2 border-ink/10 p-6">
            <h2 className="text-lg font-semibold text-ink mb-4 flex items-center gap-2">
              <ShieldCheckIcon className="w-5 h-5 text-green" />
              System Health
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-gray-600">Database</span>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${getHealthColor(systemHealth.database)}`}>
                  {systemHealth.database}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-gray-600">API Server</span>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${getHealthColor(systemHealth.api)}`}>
                  {systemHealth.api}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <ClockIcon className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">Last Backup</span>
                </div>
                <span className="text-xs font-medium text-ink">
                  {new Date(systemHealth.lastBackup).toLocaleTimeString()}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <UserGroupIcon className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">Active Sessions</span>
                </div>
                <span className="text-sm font-medium text-ink">{systemHealth.activeSessions}</span>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100">
                <button className="w-full text-sm text-azure hover:text-ink transition-colors flex items-center justify-center gap-1">
                  <ArrowTrendingUpIcon className="w-4 h-4" />
                  View detailed analytics
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl border-2 border-ink/10 p-6">
          <h2 className="text-lg font-semibold text-ink mb-4 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <ClockIcon className="w-5 h-5 text-azure" />
              Recent Activity
            </span>
            <button className="text-sm text-azure hover:text-ink transition-colors">
              View all
            </button>
          </h2>
          
          <div className="space-y-4">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-lg ${activity.color.replace('text', 'bg')}/10 flex items-center justify-center`}>
                    <activity.icon className={`w-4 h-4 ${activity.color}`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-ink">{activity.action}</p>
                    <p className="text-xs text-gray-500">by {activity.user}</p>
                  </div>
                </div>
                <span className="text-xs text-gray-400">{activity.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Stats */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/50 rounded-lg p-4 border border-ink/5">
            <p className="text-xs text-gray-500">Total Storage Used</p>
            <p className="text-lg font-semibold text-ink">2.4 GB / 10 GB</p>
            <div className="mt-2 h-1 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-azure rounded-full" style={{ width: '24%' }}></div>
            </div>
          </div>
          
          <div className="bg-white/50 rounded-lg p-4 border border-ink/5">
            <p className="text-xs text-gray-500">API Requests Today</p>
            <p className="text-lg font-semibold text-ink">1,234</p>
            <div className="mt-2 flex items-center gap-1 text-green-600 text-xs">
              <ArrowTrendingUpIcon className="w-3 h-3" />
              <span>+12% from yesterday</span>
            </div>
          </div>
          
          <div className="bg-white/50 rounded-lg p-4 border border-ink/5">
            <p className="text-xs text-gray-500">System Uptime</p>
            <p className="text-lg font-semibold text-ink">99.9%</p>
            <p className="text-xs text-gray-400 mt-1">Last 30 days</p>
          </div>
        </div>
      </main>
    </div>
  );
}