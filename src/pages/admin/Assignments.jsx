import React from 'react';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from '../../components/admin/AdminSidebar';
import { UserGroupIcon } from '@heroicons/react/24/outline'; // Add this import

export default function AdminAssignments() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar />
      <main className="flex-1 p-8">
        <div className="mb-8">
          <h1 className="font-serif text-3xl font-bold text-ink mb-2">Teacher Assignments</h1>
          <p className="text-gray-500">Assign teachers to classes and subjects</p>
        </div>
        
        <div className="bg-white rounded-xl border-2 border-ink/10 p-12 text-center">
          <UserGroupIcon className="w-16 h-16 text-ink/30 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-ink mb-2">Coming Soon</h2>
          <p className="text-gray-500">Assignment interface is under development.</p>
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="mt-4 text-azure hover:text-ink transition-colors"
          >
            ← Back to Dashboard
          </button>
        </div>
      </main>
    </div>
  );
}