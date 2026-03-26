import React, { useState, useEffect } from 'react';
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

// Theme constants
const NAVY_DARK = '#0A192F';
const NAVY_PRIMARY = '#1A237E';
const AZURE_ACCENT = '#00B0FF';
const AZURE_LIGHT = '#E3F2FD';
const ICE_WHITE = '#F8FAFC';

// Stat Card Component
const StatCard = ({ emoji, value, label, subtitle }) => (
  <div className="bg-white rounded-xl border border-[#d4cfc6] p-4 lg:p-6 shadow-sm hover:shadow-md transition">
    <div className="text-2xl lg:text-3xl mb-2 lg:mb-3">{emoji}</div>
    <div className="text-xl lg:text-3xl font-bold text-[#0f1923] mb-1">{value}</div>
    <div className="text-[10px] lg:text-xs text-gray-500 font-semibold uppercase">{label}</div>
    {subtitle && <div className="text-[10px] text-gray-400 mt-1">{subtitle}</div>}
  </div>
);

// Hero Stat Component
const HeroStat = ({ label, value }) => (
  <div className="text-center">
    <div className="text-2xl font-extrabold text-white">{value}</div>
    <div className="text-xs text-white/60 font-medium mt-1">{label}</div>
  </div>
);

// Horizontal Nav Item Component
const NavItem = ({ icon, label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center gap-2 px-4 py-3 rounded-xl transition-all duration-200 ${
      isActive
        ? 'bg-[#1A237E] text-white shadow-md'
        : 'text-gray-600 hover:bg-gray-100 hover:text-[#1A237E]'
    }`}
  >
    <span className="text-2xl">{icon}</span>
    <span className="text-xs font-medium">{label}</span>
  </button>
);

// Modal Component for Register Learner
const RegisterLearnerModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold" style={{ color: NAVY_DARK }}>Register New Learner</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6">
          <RegisterLearner onSuccess={onClose} />
        </div>
      </div>
    </div>
  );
};

// Modal Component for Register Teacher
const RegisterTeacherModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold" style={{ color: NAVY_DARK }}>Register New Teacher</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6">
          <RegisterTeacher />
        </div>
      </div>
    </div>
  );
};

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeNav, setActiveNav] = useState(() => {
    return sessionStorage.getItem('adminActiveNav') || 'register-learner';
  });
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

  // Save active nav to sessionStorage
  useEffect(() => {
    sessionStorage.setItem('adminActiveNav', activeNav);
  }, [activeNav]);

  useEffect(() => {
    checkAdminAccess();
    loadStats();
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
    // Scroll to the content area
    setTimeout(() => {
      document.getElementById('content-area')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleManageSubjects = (classId, className) => {
    setSelectedClassId(classId);
    setSelectedClassName(className);
    setActiveNav('subject-management');
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
          <div className="w-12 h-12 border-4 border-[#00B0FF] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen" style={{ backgroundColor: ICE_WHITE }}>
        {/* Header */}
        <div 
          className="w-full px-6 pt-8 pb-6"
          style={{
            background: `linear-gradient(135deg, ${NAVY_DARK}, #1E3A8A)`,
          }}
        >
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-xs font-extrabold tracking-wider mb-1" style={{ color: AZURE_ACCENT }}>
                  ADMINISTRATION
                </p>
                <h1 className="text-2xl lg:text-3xl font-bold text-white">
                  Hello, {getUserName()}
                </h1>
                <p className="text-sm text-white/70 mt-1">{getGreeting()}! Welcome back</p>
              </div>
              <button
                onClick={handleLogout}
                className="w-11 h-11 bg-white/10 backdrop-blur rounded-xl flex items-center justify-center transition-all hover:bg-white/20"
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="bg-white/10 backdrop-blur rounded-xl p-4">
                <div className="text-2xl mb-1">👨‍🎓</div>
                <div className="text-2xl font-bold text-white">{stats.totalLearners}</div>
                <div className="text-xs text-white/60">Total Learners</div>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-xl p-4">
                <div className="text-2xl mb-1">👨‍🏫</div>
                <div className="text-2xl font-bold text-white">{stats.totalTeachers}</div>
                <div className="text-xs text-white/60">Total Teachers</div>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-xl p-4">
                <div className="text-2xl mb-1">📚</div>
                <div className="text-2xl font-bold text-white">{stats.totalClasses}</div>
                <div className="text-xs text-white/60">Total Classes</div>
              </div>
            </div>
          </div>
        </div>

        {/* Horizontal Navigation Bar */}
        <div className="sticky top-0 z-20 bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex overflow-x-auto scrollbar-hide gap-1 py-3">
              <NavItem
                icon="📝"
                label="Register Learner"
                isActive={activeNav === 'register-learner'}
                onClick={() => handleNavClick('register-learner')}
              />
              <NavItem
                icon="👨‍🏫"
                label="Register Teacher"
                isActive={activeNav === 'register-teacher'}
                onClick={() => handleNavClick('register-teacher')}
              />
              <NavItem
                icon="📚"
                label="Class Management"
                isActive={activeNav === 'class-management'}
                onClick={() => handleNavClick('class-management')}
              />
              <NavItem
                icon="📖"
                label="Subject Management"
                isActive={activeNav === 'subject-management'}
                onClick={() => handleNavClick('subject-management')}
              />
              <NavItem
                icon="🔒"
                label="Security Logs"
                isActive={activeNav === 'security-logs'}
                onClick={() => handleNavClick('security-logs')}
              />
              <NavItem
                icon="👥"
                label="Teachers List"
                isActive={activeNav === 'teachers-list'}
                onClick={() => handleNavClick('teachers-list')}
              />
              <NavItem
                icon="👨‍🎓"
                label="Learners List"
                isActive={activeNav === 'learners-list'}
                onClick={() => handleNavClick('learners-list')}
              />
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div id="content-area" className="max-w-7xl mx-auto px-6 py-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6">
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