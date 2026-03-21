import React from 'react';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from '../../components/admin/AdminSidebar';
import { BuildingOfficeIcon } from '@heroicons/react/24/outline'; // Add this import

export default function AdminClasses() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar />
      <main className="flex-1 p-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="font-serif text-3xl font-bold text-ink mb-2">Manage Classes</h1>
            <p className="text-gray-500">Create and manage Form 1-4 classes</p>
          </div>
          <button
            onClick={() => navigate('/admin/classes/create')}
            className="px-4 py-2 bg-ink text-white rounded-lg hover:bg-ink/90 transition-colors"
          >
            Create New Class
          </button>
        </div>
        
        <div className="bg-white rounded-xl border-2 border-ink/10 p-12 text-center">
          <BuildingOfficeIcon className="w-16 h-16 text-ink/30 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-ink mb-2">Coming Soon</h2>
          <p className="text-gray-500">Class management interface is under development.</p>
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