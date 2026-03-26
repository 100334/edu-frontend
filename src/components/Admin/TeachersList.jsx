import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function TeachersList() {
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    department: '',
    specialization: '',
    phone: '',
    address: '',
    class_id: '',
    is_active: true
  });

  useEffect(() => {
    loadTeachers();
    loadClasses();
  }, []);

  const loadTeachers = async () => {
    try {
      const response = await api.get('/api/admin/teachers');
      setTeachers(response.data.teachers || []);
    } catch (error) {
      console.error('Error loading teachers:', error);
      toast.error('Failed to load teachers');
    } finally {
      setLoading(false);
    }
  };

  const loadClasses = async () => {
    try {
      const response = await api.get('/api/admin/classes');
      setClasses(response.data.classes || []);
    } catch (error) {
      console.error('Error loading classes:', error);
    }
  };

  const handleEditClick = (teacher) => {
    setEditingTeacher(teacher.id);
    setEditForm({
      name: teacher.full_name || teacher.name,
      email: teacher.email,
      department: teacher.department || '',
      specialization: teacher.specialization || '',
      phone: teacher.phone || '',
      address: teacher.address || '',
      class_id: teacher.class_id || '',
      is_active: teacher.is_active !== false
    });
  };

  const handleUpdateTeacher = async () => {
    try {
      const response = await api.put(`/api/admin/teachers/${editingTeacher}`, {
        name: editForm.name,
        email: editForm.email,
        department: editForm.department,
        specialization: editForm.specialization,
        phone: editForm.phone,
        address: editForm.address,
        is_active: editForm.is_active,
        class_id: editForm.class_id || null  // ← CRITICAL: Include class_id
      });
      
      if (response.data.success) {
        toast.success('Teacher updated successfully');
        setEditingTeacher(null);
        loadTeachers();
      }
    } catch (error) {
      console.error('Error updating teacher:', error);
      toast.error('Failed to update teacher');
    }
  };

  const handleDeleteTeacher = async (teacherId, teacherName) => {
    if (!window.confirm(`Are you sure you want to delete ${teacherName}?`)) return;
    
    try {
      const response = await api.delete(`/api/admin/teachers/${teacherId}`);
      if (response.data.success) {
        toast.success('Teacher deleted successfully');
        loadTeachers();
      }
    } catch (error) {
      console.error('Error deleting teacher:', error);
      toast.error('Failed to delete teacher');
    }
  };

  const getClassName = (classId) => {
    const cls = classes.find(c => c.id === classId);
    return cls ? `${cls.name} (${cls.year})` : 'Not assigned';
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1A237E]"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-[#0f1923]">Teachers List</h2>
        <button
          onClick={() => window.location.href = '/admin/register-teacher'}
          className="px-4 py-2 bg-[#1A237E] text-white rounded-lg hover:bg-[#00B0FF] transition text-sm"
        >
          + Register Teacher
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px]">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Name</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Email</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Department</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Assigned Class</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {teachers.map((teacher) => (
              <tr key={teacher.id} className="hover:bg-gray-50">
                {editingTeacher === teacher.id ? (
                  // Edit Mode
                  <>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                        className="w-full px-2 py-1 border rounded text-sm"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="email"
                        value={editForm.email}
                        onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                        className="w-full px-2 py-1 border rounded text-sm"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={editForm.department}
                        onChange={(e) => setEditForm({...editForm, department: e.target.value})}
                        className="w-full px-2 py-1 border rounded text-sm"
                        placeholder="Department"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={editForm.class_id}
                        onChange={(e) => setEditForm({...editForm, class_id: e.target.value})}
                        className="w-full px-2 py-1 border rounded text-sm"
                      >
                        <option value="">No class assigned</option>
                        {classes.map(cls => (
                          <option key={cls.id} value={cls.id}>
                            {cls.name} ({cls.year})
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={editForm.is_active ? 'active' : 'inactive'}
                        onChange={(e) => setEditForm({...editForm, is_active: e.target.value === 'active'})}
                        className="w-full px-2 py-1 border rounded text-sm"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={handleUpdateTeacher}
                          className="text-green-600 hover:text-green-800 text-sm"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingTeacher(null)}
                          className="text-gray-600 hover:text-gray-800 text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </td>
                  </>
                ) : (
                  // View Mode
                  <>
                    <td className="px-4 py-3 text-sm font-medium">{teacher.full_name || teacher.name}</td>
                    <td className="px-4 py-3 text-sm">{teacher.email}</td>
                    <td className="px-4 py-3 text-sm">{teacher.department || '—'}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        teacher.class_id ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {getClassName(teacher.class_id)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        teacher.is_active !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {teacher.is_active !== false ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditClick(teacher)}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteTeacher(teacher.id, teacher.full_name || teacher.name)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}