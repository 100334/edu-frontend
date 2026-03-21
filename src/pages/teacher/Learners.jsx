import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/common/Sidebar';
import Modal from '../../components/common/Modal';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function TeacherLearners() {
  const [learners, setLearners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newLearner, setNewLearner] = useState({
    name: '',
    grade: 'Grade 7',
    status: 'Active'
  });

  useEffect(() => {
    loadLearners();
  }, []);

  const loadLearners = async () => {
    try {
      const response = await api.get('/learners');
      setLearners(response.data);
    } catch (error) {
      toast.error('Failed to load learners');
    } finally {
      setLoading(false);
    }
  };

  const handleAddLearner = async () => {
    if (!newLearner.name.trim()) {
      toast.error('Please enter a name');
      return;
    }

    try {
      const response = await api.post('/learners', newLearner);
      setLearners([...learners, response.data]);
      setShowAddModal(false);
      setNewLearner({ name: '', grade: 'Grade 7', status: 'Active' });
      toast.success(`Learner added! Reg#: ${response.data.reg_number}`);
    } catch (error) {
      toast.error('Failed to add learner');
    }
  };

  const handleDeleteLearner = async (id) => {
    if (!window.confirm('Remove this learner? This will also delete their reports and attendance records.')) {
      return;
    }

    try {
      await api.delete(`/learners/${id}`);
      setLearners(learners.filter(l => l.id !== id));
      toast.success('Learner removed');
    } catch (error) {
      toast.error('Failed to delete learner');
    }
  };

  return (
    <div className="min-h-screen bg-paper flex">
      <Sidebar />
      
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="page-header flex justify-between items-start">
          <div>
            <h1 className="page-title">Learners</h1>
            <p className="page-subtitle">Manage enrolled students and registration numbers</p>
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary"
          >
            ➕ Add Learner
          </button>
        </div>

        <div className="card">
          <div className="card-body p-0">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Reg Number</th>
                  <th>Grade</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {learners.length > 0 ? (
                  learners.map((learner) => (
                    <tr key={learner.id}>
                      <td className="font-medium">{learner.name}</td>
                      <td>
                        <span className="reg-chip">{learner.reg_number}</span>
                      </td>
                      <td>{learner.grade}</td>
                      <td>
                        <span className={`badge ${
                          learner.status === 'Active' ? 'badge-green' : 'badge-red'
                        }`}>
                          {learner.status}
                        </span>
                      </td>
                      <td>
                        <button
                          onClick={() => handleDeleteLearner(learner.id)}
                          className="btn btn-sm btn-outline text-red border-red hover:bg-red/10"
                        >
                          ✕ Remove
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center py-12 text-muted">
                      No learners added yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add Learner Modal */}
        <Modal 
          isOpen={showAddModal} 
          onClose={() => setShowAddModal(false)}
          title="Add New Learner"
        >
          <div className="space-y-4">
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                value={newLearner.name}
                onChange={(e) => setNewLearner({...newLearner, name: e.target.value})}
                className="form-input"
                placeholder="Learner's full name"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Grade</label>
                <select
                  value={newLearner.grade}
                  onChange={(e) => setNewLearner({...newLearner, grade: e.target.value})}
                  className="form-select"
                >
                  <option>Grade 1</option><option>Grade 2</option><option>Grade 3</option>
                  <option>Grade 4</option><option>Grade 5</option><option>Grade 6</option>
                  <option>Grade 7</option><option>Grade 8</option><option>Grade 9</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Status</label>
                <select
                  value={newLearner.status}
                  onChange={(e) => setNewLearner({...newLearner, status: e.target.value})}
                  className="form-select"
                >
                  <option>Active</option>
                  <option>Inactive</option>
                </select>
              </div>
            </div>

            <div className="bg-paper rounded-lg p-4">
              <div className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">
                Auto-Generated Reg Number
              </div>
              <div className="reg-chip text-sm">
                EDU-{new Date().getFullYear()}-{(learners.length + 1).toString().padStart(4, '0')}
              </div>
              <div className="text-xs text-muted mt-2">
                Share this number with the learner for their login
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button 
              onClick={() => setShowAddModal(false)}
              className="btn btn-outline"
            >
              Cancel
            </button>
            <button 
              onClick={handleAddLearner}
              className="btn btn-primary"
            >
              Add Learner
            </button>
          </div>
        </Modal>
      </main>
    </div>
  );
}