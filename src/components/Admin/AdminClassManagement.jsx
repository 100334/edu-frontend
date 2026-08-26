import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  XMarkIcon,
  BookOpenIcon,
  AcademicCapIcon,
  RectangleGroupIcon,
  UserGroupIcon,
  CheckIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';

const inp = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#00B4D8] focus:border-[#00B4D8] transition';
const TEAL = '#006770';
const DARK_TEAL = '#003B46';
const AZURE = '#00B4D8';

const AdminClassManagement = ({ onManageSubjects }) => {
  const navigate = useNavigate();
  const [classes,         setClasses]         = useState([]);
  const [teachers,        setTeachers]        = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [showAddDialog,   setShowAddDialog]   = useState(false);
  const [showEditDialog,  setShowEditDialog]  = useState(false);
  const [selectedClass,   setSelectedClass]   = useState(null);
  const [currentStep,     setCurrentStep]     = useState(1);
  const [stepErrors,      setStepErrors]      = useState({});
  const [formData, setFormData] = useState({ name: '', year: new Date().getFullYear().toString(), teacher_id: '' });

  useEffect(() => { fetchClasses(); fetchTeachers(); }, []);

  const fetchClasses = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await api.get('/api/admin/classes', { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.success) setClasses(res.data.classes || []);
      else toast.error(res.data.message || 'Failed to load classes');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load classes');
    } finally { setLoading(false); }
  }, []);

  const fetchTeachers = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await api.get('/api/admin/teachers', { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.success) setTeachers(res.data.teachers || []);
    } catch { setTeachers([]); }
  }, []);

  const validateStep = (step) => {
    const errs = {};
    if (step === 1) {
      if (!formData.name?.trim()) errs.name = 'Class name is required';
      const y = parseInt(formData.year);
      if (!formData.year) errs.year = 'Year is required';
      else if (y < 2000 || y > 2100) errs.year = 'Enter a year between 2000 and 2100';
    }
    setStepErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const canProceed = () =>
    formData.name?.trim() && formData.year &&
    parseInt(formData.year) >= 2000 && parseInt(formData.year) <= 2100;

  const resetForm = () => {
    setFormData({ name: '', year: new Date().getFullYear().toString(), teacher_id: '' });
    setStepErrors({});
    setCurrentStep(1);
  };

  const handleInputChange = (field, value) => {
    setFormData(p => ({ ...p, [field]: value }));
    if (stepErrors[field]) setStepErrors(p => ({ ...p, [field]: null }));
  };

  const createClass = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await api.post('/api/admin/classes', {
        name: formData.name, year: parseInt(formData.year), teacher_id: formData.teacher_id || null,
      }, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.success) { toast.success('Class created'); fetchClasses(); setShowAddDialog(false); resetForm(); }
      else toast.error(res.data.message || 'Failed');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const updateClass = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await api.put(`/api/admin/classes/${selectedClass.id}`, {
        name: formData.name, year: parseInt(formData.year), teacher_id: formData.teacher_id || null,
      }, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.success) { toast.success('Class updated'); fetchClasses(); setShowEditDialog(false); setSelectedClass(null); resetForm(); }
      else toast.error(res.data.message || 'Failed');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const deleteClass = async (id, name) => {
    if (!window.confirm(`Delete "${name}"? This permanently deletes the class and all associated data.`)) return;
    try {
      const token = localStorage.getItem('token');
      const res = await api.delete(`/api/admin/classes/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.success) { toast.success('Class deleted'); fetchClasses(); }
      else toast.error(res.data.message || 'Failed');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const openEditDialog = (cls) => {
    setSelectedClass(cls);
    setFormData({ name: cls.name, year: cls.year.toString(), teacher_id: cls.teacher_id?.toString() || '' });
    setShowEditDialog(true);
    setCurrentStep(1);
  };

  const handleManageSubjects = (id, name) => {
    if (onManageSubjects) onManageSubjects(id, name);
    else navigate(`/admin/class/${id}/subjects`, { state: { className: name, classId: id } });
  };

  const getTeacherName = (id) => {
    if (!id) return null;
    const t = teachers.find(t => String(t.id) === String(id));
    return t ? (t.full_name || t.name || t.username) : null;
  };

  // ── Step indicator ─────────────────────────────────────────────────────────
  const StepIndicator = () => (
    <div className="flex items-center gap-2 mb-5">
      {[{ n: 1, label: 'Class Details' }, { n: 2, label: 'Teacher' }].map((s, i) => (
        <React.Fragment key={s.n}>
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              currentStep >= s.n ? 'bg-[#006770] text-white' : 'bg-gray-100 text-gray-400'
            }`}>
              {currentStep > s.n ? <CheckIcon className="w-3.5 h-3.5" /> : s.n}
            </div>
            <span className={`text-xs font-medium ${currentStep >= s.n ? 'text-[#003B46]' : 'text-gray-400'}`}>{s.label}</span>
          </div>
          {i === 0 && <div className={`flex-1 h-px mx-1 ${currentStep > 1 ? 'bg-[#006770]' : 'bg-gray-200'}`} />}
        </React.Fragment>
      ))}
    </div>
  );

  // ── Class dialog (shared add/edit) ─────────────────────────────────────────
  const ClassDialog = ({ isEdit }) => {
    const handleSubmit = (e) => {
      e.preventDefault();
      if (currentStep === 1) {
        if (validateStep(1)) setCurrentStep(2);
      } else {
        if (isEdit) updateClass(); else createClass();
      }
    };

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl w-full max-w-md shadow-xl overflow-hidden">
          {/* Dialog header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h3 className="text-sm font-bold text-[#003B46]">
              {isEdit ? 'Edit Class' : 'Create New Class'}
            </h3>
            <button onClick={() => { isEdit ? setShowEditDialog(false) : setShowAddDialog(false); resetForm(); }}
              className="p-1 hover:bg-gray-100 rounded-lg transition">
              <XMarkIcon className="w-4 h-4 text-gray-400" />
            </button>
          </div>

          <div className="p-5">
            <StepIndicator />
            <form onSubmit={handleSubmit} className="space-y-4">
              {currentStep === 1 && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Class Name *</label>
                    <input type="text" value={formData.name} onChange={e => handleInputChange('name', e.target.value)}
                      placeholder="e.g., Form 1A" autoFocus
                      className={`${inp} ${stepErrors.name ? 'border-red-300 bg-red-50' : ''}`} />
                    {stepErrors.name && <p className="text-xs text-red-500 mt-1">{stepErrors.name}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Academic Year *</label>
                    <input type="number" value={formData.year} onChange={e => handleInputChange('year', e.target.value)}
                      placeholder="e.g., 2026"
                      className={`${inp} ${stepErrors.year ? 'border-red-300 bg-red-50' : ''}`} />
                    {stepErrors.year && <p className="text-xs text-red-500 mt-1">{stepErrors.year}</p>}
                  </div>
                </>
              )}

              {currentStep === 2 && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Assign Teacher <span className="text-gray-400 font-normal">(optional)</span></label>
                    <select value={formData.teacher_id} onChange={e => handleInputChange('teacher_id', e.target.value)} className={inp}>
                      <option value="">None — leave unassigned</option>
                      {teachers.map(t => (
                        <option key={t.id} value={t.id}>{t.full_name || t.name || t.username}</option>
                      ))}
                    </select>
                  </div>
                  {/* Preview */}
                  <div className="p-4 bg-[#f0faf9] rounded-lg border border-[#006770]/20">
                    <p className="text-[10px] font-bold text-[#006770] uppercase tracking-wide mb-2.5">Preview</p>
                    {[
                      ['Class', formData.name],
                      ['Year', formData.year],
                      ['Teacher', formData.teacher_id ? (getTeacherName(formData.teacher_id) || 'Assigned') : 'Not assigned'],
                    ].map(([label, val]) => (
                      <div key={label} className="flex justify-between text-xs py-1 border-b border-[#006770]/10 last:border-0">
                        <span className="text-gray-500">{label}</span>
                        <span className="font-semibold text-[#003B46]">{val || '—'}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              <div className="flex gap-2 pt-1">
                {currentStep === 2 && (
                  <button type="button" onClick={() => setCurrentStep(1)}
                    className="flex-1 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition">
                    Back
                  </button>
                )}
                <button type="submit" disabled={currentStep === 1 && !canProceed()}
                  className="flex-1 py-2 bg-[#006770] text-white rounded-lg text-sm font-medium hover:bg-[#005a62] transition disabled:opacity-40">
                  {currentStep === 1 ? 'Continue' : isEdit ? 'Save Changes' : 'Create Class'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };

  // ── loading ────────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="flex justify-center py-12">
      <div className="w-7 h-7 border-4 border-[#006770] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  // ── stats ──────────────────────────────────────────────────────────────────
  const years = [...new Set(classes.map(c => c.year))];
  const assigned = classes.filter(c => c.teacher_id).length;

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex gap-4">
          {[
            { icon: RectangleGroupIcon, value: classes.length, label: 'Classes' },
            { icon: BookOpenIcon,       value: years.length,   label: 'Years'   },
            { icon: UserGroupIcon,      value: assigned,       label: 'Assigned' },
          ].map(({ icon: Icon, value, label }) => (
            <div key={label} className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#006770]/10 flex items-center justify-center">
                <Icon className="w-4 h-4 text-[#006770]" />
              </div>
              <div>
                <p className="text-sm font-bold text-[#003B46] leading-none">{value}</p>
                <p className="text-[10px] text-gray-400">{label}</p>
              </div>
            </div>
          ))}
        </div>
        <button onClick={() => { resetForm(); setShowAddDialog(true); }}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#006770] text-white rounded-lg text-sm font-medium hover:bg-[#005a62] transition">
          <PlusIcon className="w-4 h-4" /> New Class
        </button>
      </div>

      {/* Classes table */}
      {classes.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
          <RectangleGroupIcon className="w-10 h-10 text-gray-200 mx-auto mb-2" />
          <p className="text-sm text-gray-400">No classes yet.</p>
          <button onClick={() => { resetForm(); setShowAddDialog(true); }} className="mt-2 text-xs text-[#006770] hover:underline">Create the first class →</button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px]">
              <thead className="bg-gray-50">
                <tr>
                  {['Class Name', 'Year', 'Teacher', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {classes.map(cls => (
                  <tr key={cls.id} className="hover:bg-[#f0faf9] transition-colors group">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-[#006770]/10 flex items-center justify-center flex-shrink-0">
                          <BookOpenIcon className="w-3.5 h-3.5 text-[#006770]" />
                        </div>
                        <span className="text-sm font-semibold text-[#003B46]">{cls.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 bg-[#e0f7fa] text-[#006770] text-xs font-semibold rounded">{cls.year}</span>
                    </td>
                    <td className="px-4 py-3">
                      {cls.teacher_id ? (
                        <span className="flex items-center gap-1 text-xs text-gray-600">
                          <AcademicCapIcon className="w-3.5 h-3.5 text-[#006770]" />
                          {getTeacherName(cls.teacher_id) || 'Assigned'}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-300">Unassigned</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleManageSubjects(cls.id, cls.name)}
                          className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-semibold text-[#00B4D8] bg-[#00B4D8]/10 rounded hover:bg-[#00B4D8]/20 transition">
                          Subjects <ChevronRightIcon className="w-3 h-3" />
                        </button>
                        <button onClick={() => openEditDialog(cls)}
                          className="p-1.5 text-[#006770] hover:bg-[#006770]/10 rounded-lg transition" title="Edit">
                          <PencilSquareIcon className="w-4 h-4" />
                        </button>
                        <button onClick={() => deleteClass(cls.id, cls.name)}
                          className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition" title="Delete">
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showAddDialog  && <ClassDialog isEdit={false} />}
      {showEditDialog && <ClassDialog isEdit={true}  />}
    </div>
  );
};

export default AdminClassManagement;
