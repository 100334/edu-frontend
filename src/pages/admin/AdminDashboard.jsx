import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  UserPlusIcon,
  AcademicCapIcon,
  BookOpenIcon,
  ClipboardDocumentListIcon,
  RectangleGroupIcon,
  BookmarkSquareIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  UsersIcon,
  BellIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  ClipboardDocumentCheckIcon,
  BuildingLibraryIcon,
} from '@heroicons/react/24/outline';

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
import LessonManagement from '../../components/Admin/LessonManagement'; // NEW

// Theme constants — aligned with LearnerDashboard
const HEADER_BG = '#003B46';
const NAVBAR_BG = '#006770';
const TEAL_ACCENT = '#2A9D8F';
const PAPER = '#F5F2EB';
const ICE_WHITE = '#F8FAFC';

// Stat Card Component - Mobile Responsive
const StatCard = ({ icon: Icon, value, label, subtitle }) => (
  <div className="bg-white/10 backdrop-blur rounded-xl p-2 sm:p-3 lg:p-4">
    <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white/70 mb-0.5 sm:mb-1" />
    <div className="text-lg sm:text-xl lg:text-2xl font-bold text-white">{value}</div>
    <div className="text-[8px] sm:text-[10px] lg:text-xs text-white/60">{label}</div>
    {subtitle && <div className="text-[8px] sm:text-[10px] text-white/40 mt-0.5">{subtitle}</div>}
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
    {isOpen
      ? <XMarkIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
      : <Bars3Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
    }
  </button>
);

// Horizontal Nav Item Component - Mobile Responsive
const NavItem = ({ icon: Icon, label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center gap-1 sm:gap-2 px-2 sm:px-3 lg:px-4 py-2 sm:py-3 rounded-xl transition-all duration-200 whitespace-nowrap ${
      isActive
        ? 'bg-[#006770] text-white shadow-md'
        : 'text-gray-600 hover:bg-[#e8f4f5] hover:text-[#006770]'
    }`}
  >
    <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
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
              <div className="w-8 h-8 bg-[#006770] rounded-lg flex items-center justify-center">
                <span className="text-lg font-bold text-white">P</span>
              </div>
              <div>
                <span className="font-bold text-[#003B46] block text-sm">PROGRESS</span>
                <span className="text-xs text-gray-500">Secondary School</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-lg"
            >
              <XMarkIcon className="w-5 h-5 text-gray-500" />
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
                  ? 'bg-[#006770] text-white'
                  : 'text-gray-700 hover:bg-[#e8f4f5]'
              }`}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
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
          <h2 className="text-base sm:text-xl font-bold text-[#003B46]">Register New Learner</h2>
          <button
            onClick={onClose}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition"
          >
            <XMarkIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
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
          <h2 className="text-base sm:text-xl font-bold text-[#003B46]">Register New Teacher</h2>
          <button
            onClick={onClose}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition"
          >
            <XMarkIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
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
        <BellIcon className="w-8 h-8 mx-auto mb-2 text-gray-300" />
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
            <div className="w-8 h-8 rounded-full bg-teal-50 text-[#006770] flex items-center justify-center flex-shrink-0">
              <ClipboardDocumentCheckIcon className="w-4 h-4" />
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

  // Navigation items
  const navItems = [
    { id: 'register-learner',  icon: UserPlusIcon,               label: 'Register Learner' },
    { id: 'register-teacher',  icon: AcademicCapIcon,            label: 'Register Teacher' },
    { id: 'lesson-management', icon: BookOpenIcon,               label: 'Lesson Management' },
    { id: 'quiz-management',   icon: ClipboardDocumentListIcon,  label: 'Quiz Management' },
    { id: 'class-management',  icon: RectangleGroupIcon,         label: 'Class Management' },
    { id: 'subject-management',icon: BookmarkSquareIcon,         label: 'Subject Management' },
    { id: 'security-logs',     icon: ShieldCheckIcon,            label: 'Security Logs' },
    { id: 'teachers-list',     icon: UserGroupIcon,              label: 'Teachers List' },
    { id: 'learners-list',     icon: UsersIcon,                  label: 'Learners List' },
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

  // Render content based on active navigation - ADDED lesson-management
  const renderContent = () => {
    switch (activeNav) {
      case 'register-learner':
        return <RegisterLearner onSuccess={() => handleNavClick('learners-list')} />;
      case 'register-teacher':
        return <RegisterTeacher onSuccess={() => handleNavClick('teachers-list')} />;
      case 'lesson-management':
        return <LessonManagement />;
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
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: PAPER }}>
        <div className="text-center">
          <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 border-4 border-[#006770] border-t-transparent rounded-full animate-spin mx-auto mb-3 sm:mb-4"></div>
          <p className="text-xs sm:text-sm text-gray-500">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen" style={{ backgroundColor: PAPER }}>
        {/* Header - Mobile Responsive */}
        <div 
          className="w-full px-3 sm:px-6 pt-4 sm:pt-6 lg:pt-8 pb-4 sm:pb-6"
          style={{ backgroundColor: HEADER_BG }}
        >
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-start mb-3 sm:mb-4">
              <div>
                <p className="text-[10px] sm:text-xs font-extrabold tracking-wider mb-0.5 sm:mb-1 text-[#2A9D8F]">
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
                    <BellIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
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
                  <ArrowRightOnRectangleIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </button>
              </div>
            </div>

            {/* Stats Cards - Mobile Responsive Grid */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3 lg:gap-4 mt-4 sm:mt-6">
              <StatCard icon={UsersIcon}      value={stats.totalLearners} label="Learners" />
              <StatCard icon={UserGroupIcon}  value={stats.totalTeachers} label="Teachers" />
              <StatCard icon={BuildingLibraryIcon} value={stats.totalClasses} label="Classes" />
            </div>
          </div>
        </div>

        {/* Horizontal Navigation Bar - Desktop (hidden on mobile) */}
        <div className="hidden lg:block sticky top-0 z-20 border-b border-[#005a62] shadow-sm" style={{ backgroundColor: NAVBAR_BG }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex overflow-x-auto scrollbar-hide gap-1 py-2">
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
          <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-[#d4cfc6] overflow-hidden">
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