import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const AdminSidebar = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navItems = [
    { path: '/admin', icon: '📊', label: 'Dashboard' },
    { path: '/admin/teachers', icon: '👨‍🏫', label: 'Teachers' },
    { path: '/admin/learners', icon: '👨‍🎓', label: 'Learners' },
    { path: '/admin/add-teacher', icon: '➕', label: 'Add Teacher' },
    { path: '/admin/add-learner', icon: '📝', label: 'Add Learner' },
  ];

  return (
    <aside className="w-64 bg-gradient-to-b from-[#0f1923] to-[#1a2d3f] text-white min-h-screen fixed left-0 top-0 z-40">
      {/* Logo */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#c9933a] rounded-xl flex items-center justify-center">
            <span className="text-xl font-bold text-[#0f1923]">A</span>
          </div>
          <div>
            <h1 className="text-lg font-serif font-bold">Admin Panel</h1>
            <p className="text-xs text-gray-400">EduPortal Management</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-4">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                end={item.path === '/admin'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    isActive
                      ? 'bg-[#c9933a] text-[#0f1923] font-semibold'
                      : 'text-gray-300 hover:bg-white/10 hover:text-white'
                  }`
                }
              >
                <span className="text-xl">{item.icon}</span>
                <span className="text-sm">{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Logout Button */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-gray-300 hover:bg-red-600/20 hover:text-red-300 transition-all"
        >
          <span className="text-xl">🚪</span>
          <span className="text-sm">Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;