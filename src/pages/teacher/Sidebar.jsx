import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  HomeIcon, 
  UserGroupIcon, 
  DocumentTextIcon, 
  CalendarIcon,
  ArrowLeftOnRectangleIcon 
} from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navigation = [
    { name: 'Overview', to: '/teacher/dashboard', icon: HomeIcon },
    { name: 'Learners', to: '/teacher/learners', icon: UserGroupIcon },
    { name: 'Report Cards', to: '/teacher/reports', icon: DocumentTextIcon },
    { name: 'Attendance', to: '/teacher/attendance', icon: CalendarIcon },
  ];

  return (
    <div className="w-64 bg-white border-r border-border flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-ink rounded-lg flex items-center justify-center">
            <span className="font-serif text-sm font-black text-gold">E</span>
          </div>
          <span className="font-serif font-bold text-ink">EduPortal</span>
        </div>
      </div>

      {/* User Info */}
      <div className="p-4 m-2 bg-paper rounded-lg">
        <p className="font-medium text-ink">{user?.username}</p>
        <p className="text-xs text-muted mt-1">Class Teacher</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive 
                  ? 'bg-ink text-white' 
                  : 'text-muted hover:bg-paper hover:text-ink'
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            <span className="text-sm font-medium">{item.name}</span>
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-border">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 text-muted hover:text-red transition-colors w-full"
        >
          <ArrowLeftOnRectangleIcon className="w-5 h-5" />
          <span className="text-sm font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
}