import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  HomeIcon, 
  DocumentTextIcon, 
  CalendarIcon, 
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  ChartBarIcon,
  BookOpenIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline';

export default function Sidebar({ onNavigate, activeSection }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  // Determine if we're using state-based navigation or route-based
  const useStateNavigation = !!onNavigate;

  const teacherNavigation = [
    { 
      name: 'Overview', 
      href: '/teacher/dashboard', 
      stateKey: 'overview',
      icon: HomeIcon 
    },
    { 
      name: 'Learners', 
      href: '/teacher/learners', 
      stateKey: 'learners',
      icon: UserCircleIcon 
    },
    { 
      name: 'Reports', 
      href: '/teacher/reports', 
      stateKey: 'reports',
      icon: DocumentTextIcon 
    },
    { 
      name: 'Attendance', 
      href: '/teacher/attendance', 
      stateKey: 'attendance',
      icon: CalendarIcon 
    },
  ];

  const learnerNavigation = [
    { 
      name: 'Dashboard', 
      href: '/learner/dashboard', 
      stateKey: 'dashboard',
      icon: HomeIcon 
    },
    { 
      name: 'Report Card', 
      href: '/learner/report-card', 
      stateKey: 'report-card',
      icon: DocumentTextIcon 
    },
    { 
      name: 'Attendance', 
      href: '/learner/attendance', 
      stateKey: 'attendance',
      icon: CalendarIcon 
    },
  ];

  const navigation = user?.role === 'teacher' ? teacherNavigation : learnerNavigation;

  const handleNavigation = (item) => {
    if (useStateNavigation) {
      // Use state-based navigation (for single-page dashboard)
      onNavigate(item.stateKey);
    } else {
      // Use React Router navigation (for multi-page setup)
      navigate(item.href);
    }
  };

  const handleLogout = () => {
    logout();
    if (!useStateNavigation) {
      navigate('/');
    } else if (onNavigate) {
      // If using state navigation, just call logout and let parent handle
      onNavigate('logout');
    }
  };

  // Determine if a nav item is active
  const isActive = (item) => {
    if (useStateNavigation) {
      return activeSection === item.stateKey;
    } else {
      return location.pathname === item.href;
    }
  };

  // Get user display name
  const getUserName = () => {
    if (user?.name) return user.name;
    if (user?.email) return user.email.split('@')[0];
    return user?.role === 'teacher' ? 'Teacher' : 'Student';
  };

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen sticky top-0">
      {/* Logo Section */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 bg-gold rounded-lg flex items-center justify-center">
            <span className="text-ink font-bold text-lg">E</span>
          </div>
          <h1 className="text-xl font-serif font-bold text-ink">EduPortal</h1>
        </div>
        <p className="text-xs text-gray-500">
          {user?.role === 'teacher' ? 'Teacher Portal' : 'Student Portal'}
        </p>
      </div>
      
      {/* User Info Section */}
      <div className="px-4 py-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gold/10 rounded-full flex items-center justify-center">
            <UserCircleIcon className="w-6 h-6 text-gold" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {getUserName()}
            </p>
            <p className="text-xs text-gray-500 capitalize">
              {user?.role === 'teacher' ? 'Teacher' : 'Student'}
            </p>
          </div>
        </div>
      </div>
      
      {/* Navigation Section */}
      <nav className="flex-1 py-6">
        <div className="space-y-1 px-3">
          {navigation.map((item) => {
            const active = isActive(item);
            return (
              <button
                key={item.name}
                onClick={() => handleNavigation(item)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                  active
                    ? 'bg-ink text-white shadow-md'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gold'
                }`}
              >
                <item.icon className={`w-5 h-5 ${active ? 'text-white' : ''}`} />
                <span>{item.name}</span>
                {active && (
                  <div className="ml-auto w-1.5 h-1.5 bg-gold rounded-full"></div>
                )}
              </button>
            );
          })}
        </div>
      </nav>
      
      {/* Footer Section */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
        >
          <ArrowRightOnRectangleIcon className="w-4 h-4" />
          <span>Logout</span>
        </button>
        
        {/* Version Info */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-400">
            Version 2.0.0
          </p>
        </div>
      </div>
    </div>
  );
}