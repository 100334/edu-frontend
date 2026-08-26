import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  PencilSquareIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon,
  AcademicCapIcon,
} from '@heroicons/react/24/outline';

const inp = 'w-full px-2 py-1.5 border border-gray-200 rounded text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#00B4D8] focus:border-[#00B4D8] transition';

export default function TeachersList() {
  const [teachers,        setTeachers]        = useState([]);
  const [classes,         setClasses]         = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [editingTeacher,  setEditingTeacher]  = useState(null);
  const [editForm, setEditForm] = useState({
    name: '', email: '', department: '', specialization: '', phone: '', address: '', class_id: '', is_active: true,
  });

  useEffect(() => { loadTeachers(); loadClasses(); }, []);

  const loadTeachers = async () => {
    try {
      const res = await api.get('/api/admin/teachers');
      setTeachers(res.data.teachers || []);
    } catch { toast.error('Failed to load teachers'); }
    finally { setLoading(false); }
  };

  const loadClasses = async () => {
    try {
      const res = await api.get('/api/admin/classes');
      setClasses(res.data.classes || []);
    } catch { /* silent */ }
  };

  const handleEditClick = (t) => {
    setEditingTeacher(t.id);
    setEditForm({
      name: t.full_name || t.name || '',
      email: t.email || '',
      department: t.department || '',
      specialization: t.specialization || '',
      phone: t.phone || '',
      address: t.address || '',
      class_id: t.class_id || '',
      is_active: t.is_active !== false,
    });
  };

  const handleUpdate = async () => {
    try {
      const res = await api.put(`/api/admin/teachers/${editingTeacher}`, {
        name: editForm.name,
        email: editForm.email,
        department: editForm.department,
        specialization: editForm.specialization,
        phone: editForm.phone,
        address: editForm.address,
        is_active: editForm.is_active,
        class_id: editForm.class_id || null,
      });
      if (res.data.success) { toast.success('Teacher updated'); setEditingTeacher(null); loadTeachers(); }
    } catch { toast.error('Failed to update teacher'); }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete ${name}?`)) return;
    try {
      const res = await api.delete(`/api/admin/teachers/${id}`);
      if (res.data.success) { toast.success('Teacher deleted'); loadTeachers(); }
    } catch { toast.error('Failed to delete teacher'); }
  };

  const getClassName = (classId) => {
    if (!classId) return null;
    const c = classes.find(c => String(c.id) === String(classId));
    return c ? `${c.name} (${c.year})` : null;
  };

  if (loading) return (
    <div className="flex justify-center py-10">
      <div className="w-7 h-7 border-4 border-[#006770] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs text-gray-400 font-medium">{teachers.length} teacher{teachers.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead className="bg-gray-50">
              <tr>
                {['Name', 'Email', 'Department', 'Assigned Class', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {teachers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-gray-400">No teachers found.</td>
                </tr>
              ) : teachers.map(t => (
                <tr key={t.id} className="hover:bg-[#f0faf9] transition-colors">
                  {editingTeacher === t.id ? (
                    // ── inline edit row ──────────────────────────────────────
                    <>
                      <td className="px-3 py-2">
                        <input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} className={inp} placeholder="Full name" />
                      </td>
                      <td className="px-3 py-2">
                        <input type="email" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} className={inp} />
                      </td>
                      <td className="px-3 py-2">
                        <input value={editForm.department} onChange={e => setEditForm({ ...editForm, department: e.target.value })} className={inp} placeholder="Department" />
                      </td>
                      <td className="px-3 py-2">
                        <select value={editForm.class_id} onChange={e => setEditForm({ ...editForm, class_id: e.target.value })} className={inp}>
                          <option value="">None</option>
                          {classes.map(c => <option key={c.id} value={c.id}>{c.name} ({c.year})</option>)}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <select value={editForm.is_active ? 'active' : 'inactive'} onChange={e => setEditForm({ ...editForm, is_active: e.target.value === 'active' })} className={inp}>
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1">
                          <button onClick={handleUpdate} className="p-1.5 bg-[#006770] text-white rounded-lg hover:bg-[#005a62] transition" title="Save">
                            <CheckIcon className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => setEditingTeacher(null)} className="p-1.5 bg-gray-100 text-gray-500 rounded-lg hover:bg-gray-200 transition" title="Cancel">
                            <XMarkIcon className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    // ── view row ─────────────────────────────────────────────
                    <>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-[#006770]/10 flex items-center justify-center flex-shrink-0">
                            <AcademicCapIcon className="w-3.5 h-3.5 text-[#006770]" />
                          </div>
                          <span className="text-sm font-semibold text-[#003B46]">{t.full_name || t.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">{t.email}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{t.department || <span className="text-gray-300">—</span>}</td>
                      <td className="px-4 py-3">
                        {getClassName(t.class_id)
                          ? <span className="px-2 py-0.5 bg-[#e0f7fa] text-[#006770] text-xs font-semibold rounded">{getClassName(t.class_id)}</span>
                          : <span className="text-xs text-gray-300">Unassigned</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          t.is_active !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${t.is_active !== false ? 'bg-green-500' : 'bg-red-500'}`} />
                          {t.is_active !== false ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleEditClick(t)} className="p-1.5 text-[#006770] hover:bg-[#006770]/10 rounded-lg transition" title="Edit">
                            <PencilSquareIcon className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(t.id, t.full_name || t.name)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition" title="Delete">
                            <TrashIcon className="w-4 h-4" />
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
    </div>
  );
}
