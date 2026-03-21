import React, { useState } from 'react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import { 
  UserPlusIcon, 
  PencilIcon, 
  TrashIcon,
  EnvelopeIcon,
  PhoneIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import Modal from '../../components/common/Modal';

export default function AdminTeachers() {
  const [teachers, setTeachers] = useState([
    {
      id: 1,
      name: 'John Smith',
      email: 'john.smith@eduportal.com',
      phone: '+265 888 123 456',
      specialization: 'Mathematics',
      status: 'Active'
    },
    {
      id: 2,
      name: 'Sarah Johnson',
      email: 'sarah.j@eduportal.com',
      phone: '+265 999 789 012',
      specialization: 'English',
      status: 'Active'
    }
  ]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    specialization: '',
    status: 'Active'
  });

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleAddTeacher = () => {
    if (!formData.name || !formData.email) {
      toast.error('Name and email are required');
      return;
    }

    const newTeacher = {
      id: teachers.length + 1,
      ...formData
    };

    setTeachers([...teachers, newTeacher]);
    setShowAddModal(false);
    resetForm();
    toast.success('Teacher added successfully');
  };

  const handleEditTeacher = (teacher) => {
    setEditingTeacher(teacher);
    setFormData(teacher);
    setShowAddModal(true);
  };

  const handleUpdateTeacher = () => {
    const updatedTeachers = teachers.map(t => 
      t.id === editingTeacher.id ? { ...formData, id: t.id } : t
    );
    setTeachers(updatedTeachers);
    setShowAddModal(false);
    setEditingTeacher(null);
    resetForm();
    toast.success('Teacher updated successfully');
  };

  const handleDeleteTeacher = (id) => {
    if (window.confirm('Are you sure you want to delete this teacher?')) {
      setTeachers(teachers.filter(t => t.id !== id));
      toast.success('Teacher deleted successfully');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      specialization: '',
      status: 'Active'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar />
      
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="font-serif text-3xl font-bold text-ink mb-2">Manage Teachers</h1>
            <p className="text-gray-500">Add, edit, and manage teacher accounts</p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setEditingTeacher(null);
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-ink text-white rounded-lg hover:bg-ink/90 transition-all"
          >
            <UserPlusIcon className="w-5 h-5" />
            <span>Add Teacher</span>
          </button>
        </div>

        {/* Teachers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teachers.map((teacher) => (
            <div key={teacher.id} className="bg-white rounded-xl border-2 border-ink/10 p-6 hover:shadow-lg transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-ink/10 rounded-full flex items-center justify-center">
                    <span className="text-ink font-bold text-xl">
                      {teacher.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-ink">{teacher.name}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      teacher.status === 'Active' 
                        ? 'bg-green-100 text-green-600' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {teacher.status}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditTeacher(teacher)}
                    className="p-1 text-gray-400 hover:text-ink transition-colors"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteTeacher(teacher.id)}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <EnvelopeIcon className="w-4 h-4" />
                  <span>{teacher.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <PhoneIcon className="w-4 h-4" />
                  <span>{teacher.phone || 'Not provided'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <AcademicCapIcon className="w-4 h-4" />
                  <span>{teacher.specialization || 'General'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add/Edit Teacher Modal */}
        <Modal 
          isOpen={showAddModal} 
          onClose={() => {
            setShowAddModal(false);
            setEditingTeacher(null);
            resetForm();
          }}
          title={editingTeacher ? 'Edit Teacher' : 'Add New Teacher'}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-ink"
                placeholder="e.g., John Smith"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-ink"
                placeholder="teacher@eduportal.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-ink"
                placeholder="+265 888 123 456"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Specialization</label>
              <input
                type="text"
                name="specialization"
                value={formData.specialization}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-ink"
                placeholder="e.g., Mathematics"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-ink"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={() => {
                setShowAddModal(false);
                setEditingTeacher(null);
                resetForm();
              }}
              className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={editingTeacher ? handleUpdateTeacher : handleAddTeacher}
              className="px-4 py-2 bg-ink text-white rounded-lg hover:bg-ink/90 transition-colors"
            >
              {editingTeacher ? 'Update' : 'Add'} Teacher
            </button>
          </div>
        </Modal>
      </main>
    </div>
  );
}