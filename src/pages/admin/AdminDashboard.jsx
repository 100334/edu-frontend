import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';

// Import Admin Components
import TeachersList from '../../components/Admin/TeachersList';
import LearnersList from '../../components/Admin/LearnersList';
import AddTeacher from '../../components/Admin/AddTeacher';
import AddLearner from '../../components/Admin/AddLearner';
import RegisterLearner from '../../components/Admin/RegisterLearner';
import RegisterTeacher from '../../components/Admin/RegisterTeacher';
import AdminClassManagement from '../../components/Admin/AdminClassManagement';
import AdminSubjectManagement from '../../components/Admin/AdminSubjectManagement';
import SecurityLogs from '../../components/Admin/SecurityLogs';
import QuizManagement from '../../components/Admin/QuizManagement';

// Theme constants
const NAVY_DARK = '#0A192F';
const NAVY_PRIMARY = '#1A237E';
const AZURE_ACCENT = '#00B0FF';
const AZURE_LIGHT = '#E3F2FD';
const ICE_WHITE = '#F8FAFC';

// Stat Card Component - Mobile Responsive
const StatCard = ({ emoji, value, label, subtitle }) => (
  <div className="bg-white rounded-xl border border-[#d4cfc6] p-3 sm:p-4 lg:p-6 shadow-sm hover:shadow-md transition">
    <div className="text-xl sm:text-2xl lg:text-3xl mb-1 sm:mb-2 lg:mb-3">{emoji}</div>
    <div className="text-base sm:text-xl lg:text-3xl font-bold text-[#0f1923] mb-0.5 sm:mb-1">{value}</div>
    <div className="text-[8px] sm:text-[10px] lg:text-xs text-gray-500 font-semibold uppercase">{label}</div>
    {subtitle && <div className="text-[8px] sm:text-[10px] text-gray-400 mt-1">{subtitle}</div>}
  </div>
);

// Hero Stat Component - Mobile Responsive
const HeroStat = ({ label, value }) => (
  <div className="text-center">
    <div className="text-lg sm:text-2xl font-extrabold text-white">{value}</div>
    <div className="text-[10px] sm:text-xs text-white/60 font-medium mt-0.5 sm:mt-1">{label}</div>
  </div>
);

// Mobile Menu Button Component
const MobileMenuButton = ({ isOpen, onClick }) => (
  <button
    onClick={onClick}
    className="lg:hidden p-2 rounded-lg bg-white/10 hover:bg-white/20 transition"
    aria-label="Toggle menu"
  >
    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      {isOpen ? (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      ) : (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
      )}
    </svg>
  </button>
);

// Horizontal Nav Item Component - Mobile Responsive
const NavItem = ({ icon, label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center gap-1 sm:gap-2 px-2 sm:px-3 lg:px-4 py-2 sm:py-3 rounded-xl transition-all duration-200 whitespace-nowrap ${
      isActive
        ? 'bg-[#1A237E] text-white shadow-md'
        : 'text-gray-600 hover:bg-gray-100 hover:text-[#1A237E]'
    }`}
  >
    <span className="text-lg sm:text-2xl">{icon}</span>
    <span className="text-[10px] sm:text-xs font-medium">{label}</span>
  </button>
);

// Mobile Navigation Drawer Component
const MobileNavDrawer = ({ isOpen, onClose, activeNav, onNavClick, navItems }) => {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-40 lg:hidden"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="fixed left-0 top-0 bottom-0 w-64 bg-white z-50 shadow-xl transform transition-transform duration-300 ease-in-out lg:hidden">
        <div className="p-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#c9933a] rounded-lg flex items-center justify-center">
                <span className="text-lg font-bold text-[#0f1923]">P</span>
              </div>
              <div>
                <span className="font-bold text-[#0f1923] block text-sm">PROGRESS</span>
                <span className="text-xs text-gray-500">Secondary School</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-lg"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        <div className="p-2 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                onNavClick(item.id);
                onClose();
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition ${
                activeNav === item.id
                  ? 'bg-[#1A237E] text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
};

// Modal Component for Register Learner - Mobile Responsive
const RegisterLearnerModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4" onClick={onClose}>
      <div className="bg-white rounded-xl sm:rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-gray-200 p-3 sm:p-4 flex justify-between items-center">
          <h2 className="text-base sm:text-xl font-bold" style={{ color: NAVY_DARK }}>Register New Learner</h2>
          <button
            onClick={onClose}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-3 sm:p-6">
          <RegisterLearner onSuccess={onClose} />
        </div>
      </div>
    </div>
  );
};

// Modal Component for Register Teacher - Mobile Responsive
const RegisterTeacherModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4" onClick={onClose}>
      <div className="bg-white rounded-xl sm:rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-gray-200 p-3 sm:p-4 flex justify-between items-center">
          <h2 className="text-base sm:text-xl font-bold" style={{ color: NAVY_DARK }}>Register New Teacher</h2>
          <button
            onClick={onClose}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-3 sm:p-6">
          <RegisterTeacher />
        </div>
      </div>
    </div>
  );
};

// ============================================
// NOTIFICATIONS PANEL COMPONENT
// ============================================
const NotificationsPanel = ({ notifications, onMarkAsRead, onClose }) => {
  if (!notifications.length) {
    return (
      <div className="px-4 py-8 text-center text-gray-500">
        <div className="text-2xl mb-2">🔔</div>
        <p className="text-sm">No new notifications</p>
      </div>
    );
  }

  return (
    <div className="max-h-96 overflow-y-auto">
      {notifications.map((notif) => (
        <div
          key={notif.id}
          className="px-4 py-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition"
          onClick={() => onMarkAsRead(notif.id)}
        >
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm">
              📋
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-800">{notif.title}</p>
              <p className="text-xs text-gray-500 mt-0.5">{notif.message}</p>
              <p className="text-xs text-gray-400 mt-1">
                {new Date(notif.created_at).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeNav, setActiveNav] = useState(() => {
    return sessionStorage.getItem('adminActiveNav') || 'register-learner';
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [selectedClassName, setSelectedClassName] = useState('');
  const [stats, setStats] = useState({
    totalTeachers: 0,
    totalLearners: 0,
    totalClasses: 0
  });
  const [showRegisterLearnerModal, setShowRegisterLearnerModal] = useState(false);
  const [showRegisterTeacherModal, setShowRegisterTeacherModal] = useState(false);

  // Notification state
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef(null);

  // Navigation items for mobile drawer - UPDATED with Quiz Management
  const navItems = [
    { id: 'register-learner', icon: '📝', label: 'Register Learner' },
    { id: 'register-teacher', icon: '👨‍🏫', label: 'Register Teacher' },
    { id: 'quiz-management', icon: '📋', label: 'Quiz Management' },
    { id: 'class-management', icon: '📚', label: 'Class Management' },
    { id: 'subject-management', icon: '📖', label: 'Subject Management' },
    { id: 'security-logs', icon: '🔒', label: 'Security Logs' },
    { id: 'teachers-list', icon: '👥', label: 'Teachers List' },
    { id: 'learners-list', icon: '👨‍🎓', label: 'Learners List' }
  ];

  // Save active nav to sessionStorage
  useEffect(() => {
    sessionStorage.setItem('adminActiveNav', activeNav);
  }, [activeNav]);

  useEffect(() => {
    checkAdminAccess();
    loadStats();
    fetchNotifications();
    
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    
    // Close dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      clearInterval(interval);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const checkAdminAccess = () => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      navigate('/login');
      return;
    }
    try {
      const userData = JSON.parse(storedUser);
      if (userData.role !== 'admin') {
        navigate('/');
      }
    } catch (e) {
      navigate('/login');
    }
  };

  const loadStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.get('/api/admin/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats({
        totalTeachers: response.data.teachers || 0,
        totalLearners: response.data.learners || 0,
        totalClasses: response.data.classes || 0
      });
    } catch (error) {
      console.error('Error loading stats:', error);
      toast.error('Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.get('/api/admin/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        const notifs = response.data.notifications || [];
        setNotifications(notifs);
        setUnreadCount(notifs.length);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const markNotificationAsRead = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await api.put(`/api/admin/notifications/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Refresh notifications
      await fetchNotifications();
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleLogout = async () => {
    sessionStorage.removeItem('adminActiveNav');
    await logout();
    navigate('/');
    toast.success('Logged out successfully');
  };

  const getUserName = () => {
    if (user?.name) return user.name;
    if (user?.email) return user.email.split('@')[0];
    return 'Admin';
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const handleNavClick = (nav) => {
    setActiveNav(nav);
    setMobileMenuOpen(false);
    // Scroll to the content area
    setTimeout(() => {
      document.getElementById('content-area')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleManageSubjects = (classId, className) => {
    setSelectedClassId(classId);
    setSelectedClassName(className);
    setActiveNav('subject-management');
    setMobileMenuOpen(false);
  };

  const handleOpenRegisterLearner = () => {
    setShowRegisterLearnerModal(true);
  };

  const handleCloseRegisterLearner = () => {
    setShowRegisterLearnerModal(false);
    loadStats();
  };

  const handleOpenRegisterTeacher = () => {
    setShowRegisterTeacherModal(true);
  };

  const handleCloseRegisterTeacher = () => {
    setShowRegisterTeacherModal(false);
    loadStats();
  };

  // Render content based on active navigation
  const renderContent = () => {
    switch (activeNav) {
      case 'register-learner':
        return <RegisterLearner onSuccess={() => handleNavClick('learners-list')} />;
      case 'register-teacher':
        return <RegisterTeacher onSuccess={() => handleNavClick('teachers-list')} />;
      case 'quiz-management':
        return <QuizManagement />;
      case 'class-management':
        return <AdminClassManagement onManageSubjects={handleManageSubjects} />;
      case 'subject-management':
        return (
          <AdminSubjectManagement 
            user={user}
            classId={selectedClassId}
            className={selectedClassName}
            onBack={() => handleNavClick('class-management')}
          />
        );
      case 'security-logs':
        return <SecurityLogs />;
      case 'teachers-list':
        return <TeachersList />;
      case 'learners-list':
        return <LearnersList />;
      default:
        return <RegisterLearner onSuccess={() => handleNavClick('learners-list')} />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: ICE_WHITE }}>
        <div className="text-center">
          <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 border-4 border-[#00B0FF] border-t-transparent rounded-full animate-spin mx-auto mb-3 sm:mb-4"></div>
          <p className="text-xs sm:text-sm text-gray-500">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen" style={{ backgroundColor: ICE_WHITE }}>
        {/* Header - Mobile Responsive */}
        <div 
          className="w-full px-3 sm:px-6 pt-4 sm:pt-6 lg:pt-8 pb-4 sm:pb-6"
          style={{
            background: `linear-gradient(135deg, ${NAVY_DARK}, #1E3A8A)`,
          }}
        >
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-start mb-3 sm:mb-4">
              <div>
                <p className="text-[10px] sm:text-xs font-extrabold tracking-wider mb-0.5 sm:mb-1" style={{ color: AZURE_ACCENT }}>
                  ADMINISTRATION
                </p>
                <h1 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-white">
                  Hello, {getUserName()}
                </h1>
                <p className="text-xs sm:text-sm text-white/70 mt-0.5 sm:mt-1">{getGreeting()}! Welcome back</p>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                {/* Notifications Bell */}
                <div className="relative" ref={notificationRef}>
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="relative w-8 h-8 sm:w-10 sm:h-10 lg:w-11 lg:h-11 bg-white/10 backdrop-blur rounded-xl flex items-center justify-center transition-all hover:bg-white/20"
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-red-500 text-white text-[10px] sm:text-xs rounded-full flex items-center justify-center font-bold">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Dropdown */}
                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden">
                      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                        <h3 className="text-sm font-semibold text-gray-800">Notifications</h3>
                      </div>
                      <NotificationsPanel
                        notifications={notifications}
                        onMarkAsRead={markNotificationAsRead}
                        onClose={() => setShowNotifications(false)}
                      />
                    </div>
                  )}
                </div>

                {/* Mobile Menu Button */}
                <MobileMenuButton 
                  isOpen={mobileMenuOpen} 
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
                />
                <button
                  onClick={handleLogout}
                  className="w-8 h-8 sm:w-10 sm:h-10 lg:w-11 lg:h-11 bg-white/10 backdrop-blur rounded-xl flex items-center justify-center transition-all hover:bg-white/20"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Stats Cards - Mobile Responsive Grid */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3 lg:gap-4 mt-4 sm:mt-6">
              <div className="bg-white/10 backdrop-blur rounded-xl p-2 sm:p-3 lg:p-4">
                <div className="text-lg sm:text-2xl mb-0.5 sm:mb-1">👨‍🎓</div>
                <div className="text-lg sm:text-xl lg:text-2xl font-bold text-white">{stats.totalLearners}</div>
                <div className="text-[8px] sm:text-[10px] lg:text-xs text-white/60">Learners</div>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-xl p-2 sm:p-3 lg:p-4">
                <div className="text-lg sm:text-2xl mb-0.5 sm:mb-1">👨‍🏫</div>
                <div className="text-lg sm:text-xl lg:text-2xl font-bold text-white">{stats.totalTeachers}</div>
                <div className="text-[8px] sm:text-[10px] lg:text-xs text-white/60">Teachers</div>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-xl p-2 sm:p-3 lg:p-4">
                <div className="text-lg sm:text-2xl mb-0.5 sm:mb-1">📚</div>
                <div className="text-lg sm:text-xl lg:text-2xl font-bold text-white">{stats.totalClasses}</div>
                <div className="text-[8px] sm:text-[10px] lg:text-xs text-white/60">Classes</div>
              </div>
            </div>
          </div>
        </div>

        {/* Horizontal Navigation Bar - Desktop (hidden on mobile) */}
        <div className="hidden lg:block sticky top-0 z-20 bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex overflow-x-auto scrollbar-hide gap-1 py-3">
              {navItems.map((item) => (
                <NavItem
                  key={item.id}
                  icon={item.icon}
                  label={item.label}
                  isActive={activeNav === item.id}
                  onClick={() => handleNavClick(item.id)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        <MobileNavDrawer
          isOpen={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
          activeNav={activeNav}
          onNavClick={handleNavClick}
          navItems={navItems}
        />

        {/* Content Area - Mobile Responsive */}
        <div id="content-area" className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
          <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-3 sm:p-4 lg:p-6">
              {renderContent()}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <RegisterLearnerModal 
        isOpen={showRegisterLearnerModal} 
        onClose={handleCloseRegisterLearner} 
      />
      <RegisterTeacherModal 
        isOpen={showRegisterTeacherModal} 
        onClose={handleCloseRegisterTeacher} 
      />
    </>
  );
}