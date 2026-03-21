import React, { useState } from 'react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import { 
  AcademicCapIcon, 
  IdentificationIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  UserPlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  DocumentArrowDownIcon,
  EnvelopeIcon,
  PhoneIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function AdminLearners() {
  const [learners, setLearners] = useState([
    {
      id: 1,
      name: 'Amara Banda',
      regNumber: 'EDU-2024-0001',
      grade: 'Form 1',
      stream: 'A',
      status: 'Active',
      email: 'amara.banda@eduportal.com',
      phone: '+265 888 123 001',
      enrollmentDate: '2024-01-15',
      class: 'Form 1A'
    },
    {
      id: 2,
      name: 'Chisomo Phiri',
      regNumber: 'EDU-2024-0002',
      grade: 'Form 1',
      stream: 'B',
      status: 'Active',
      email: 'chisomo.phiri@eduportal.com',
      phone: '+265 888 123 002',
      enrollmentDate: '2024-01-15',
      class: 'Form 1B'
    },
    {
      id: 3,
      name: 'Takondwa Mwale',
      regNumber: 'EDU-2024-0003',
      grade: 'Form 1',
      stream: 'A',
      status: 'Active',
      email: 'takondwa.mwale@eduportal.com',
      phone: '+265 888 123 003',
      enrollmentDate: '2024-01-16',
      class: 'Form 1A'
    },
    {
      id: 4,
      name: 'Mwiza Banda',
      regNumber: 'EDU-2024-0004',
      grade: 'Form 2',
      stream: 'Science',
      status: 'Active',
      email: 'mwiza.banda@eduportal.com',
      phone: '+265 888 123 004',
      enrollmentDate: '2023-09-01',
      class: 'Form 2 Science'
    },
    {
      id: 5,
      name: 'Tapiwa Phiri',
      regNumber: 'EDU-2024-0005',
      grade: 'Form 3',
      stream: 'Commercial',
      status: 'Inactive',
      email: 'tapiwa.phiri@eduportal.com',
      phone: '+265 888 123 005',
      enrollmentDate: '2022-09-01',
      class: 'Form 3 Commercial'
    }
  ]);

  const [editingReg, setEditingReg] = useState(null);
  const [newRegNumber, setNewRegNumber] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGrade, setFilterGrade] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedLearners, setSelectedLearners] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newLearner, setNewLearner] = useState({
    name: '',
    grade: 'Form 1',
    stream: 'A',
    email: '',
    phone: ''
  });

  const grades = ['Form 1', 'Form 2', 'Form 3', 'Form 4'];
  const streams = ['A', 'B', 'C', 'Science', 'Arts', 'Commercial', 'Technical'];

  const generateRegNumber = () => {
    const year = new Date().getFullYear();
    const nextNumber = (learners.length + 1).toString().padStart(4, '0');
    return `EDU-${year}-${nextNumber}`;
  };

  const handleAssignRegNumber = (learnerId) => {
    const newReg = generateRegNumber();
    setLearners(learners.map(l => 
      l.id === learnerId ? { ...l, regNumber: newReg } : l
    ));
    toast.success('Registration number assigned successfully', {
      icon: '🔢'
    });
  };

  const handleEditRegNumber = (learner) => {
    setEditingReg(learner.id);
    setNewRegNumber(learner.regNumber);
  };

  const handleSaveRegNumber = (learnerId) => {
    if (!newRegNumber.match(/^EDU-\d{4}-\d{4}$/)) {
      toast.error('Invalid format. Use: EDU-YYYY-0001');
      return;
    }

    setLearners(learners.map(l => 
      l.id === learnerId ? { ...l, regNumber: newRegNumber.toUpperCase() } : l
    ));
    setEditingReg(null);
    toast.success('Registration number updated', {
      icon: '✅'
    });
  };

  const handleToggleStatus = (learnerId) => {
    setLearners(learners.map(l => 
      l.id === learnerId 
        ? { ...l, status: l.status === 'Active' ? 'Inactive' : 'Active' }
        : l
    ));
    toast.success(`Learner status updated to ${learners.find(l => l.id === learnerId)?.status === 'Active' ? 'Inactive' : 'Active'}`, {
      icon: '🔄'
    });
  };

  const handleAddLearner = () => {
    if (!newLearner.name || !newLearner.grade || !newLearner.stream) {
      toast.error('Please fill in all required fields');
      return;
    }

    const newId = learners.length + 1;
    const regNumber = generateRegNumber();
    const learner = {
      id: newId,
      ...newLearner,
      regNumber,
      status: 'Active',
      enrollmentDate: new Date().toISOString().split('T')[0],
      class: `${newLearner.grade} ${newLearner.stream}`,
      email: newLearner.email || `${newLearner.name.toLowerCase().replace(/\s+/g, '.')}@eduportal.com`,
      phone: newLearner.phone || '+265 000 000 000'
    };

    setLearners([...learners, learner]);
    setShowAddModal(false);
    setNewLearner({ name: '', grade: 'Form 1', stream: 'A', email: '', phone: '' });
    toast.success(`Learner added successfully with Reg: ${regNumber}`, {
      icon: '🎓'
    });
  };

  const handleBulkAssign = () => {
    if (selectedLearners.length === 0) {
      toast.error('No learners selected');
      return;
    }

    const updatedLearners = learners.map(l => 
      selectedLearners.includes(l.id) ? { ...l, regNumber: generateRegNumber() } : l
    );
    setLearners(updatedLearners);
    setSelectedLearners([]);
    toast.success(`Assigned new registration numbers to ${selectedLearners.length} learners`);
  };

  const handleExport = () => {
    const csv = learners.map(l => 
      `${l.name},${l.regNumber},${l.grade},${l.stream},${l.status},${l.email},${l.phone}`
    ).join('\n');
    
    const blob = new Blob([`Name,Reg Number,Grade,Stream,Status,Email,Phone\n${csv}`], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `learners_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    
    toast.success('Learners data exported successfully');
  };

  const filteredLearners = learners.filter(learner => {
    const matchesSearch = learner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         learner.regNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         learner.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGrade = filterGrade === 'all' || learner.grade === filterGrade;
    const matchesStatus = filterStatus === 'all' || learner.status === filterStatus;
    return matchesSearch && matchesGrade && matchesStatus;
  });

  const toggleSelectAll = () => {
    if (selectedLearners.length === filteredLearners.length) {
      setSelectedLearners([]);
    } else {
      setSelectedLearners(filteredLearners.map(l => l.id));
    }
  };

  const toggleSelectLearner = (id) => {
    if (selectedLearners.includes(id)) {
      setSelectedLearners(selectedLearners.filter(lId => lId !== id));
    } else {
      setSelectedLearners([...selectedLearners, id]);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar />
      
      <main className="flex-1 p-8 overflow-y-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl font-bold text-ink mb-2">Manage Learners</h1>
            <p className="text-gray-500">Assign registration numbers and manage learner records</p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm"
            >
              <DocumentArrowDownIcon className="w-4 h-4" />
              Export CSV
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-ink text-white rounded-lg hover:bg-ink/90 transition-colors text-sm"
            >
              <UserPlusIcon className="w-4 h-4" />
              Add Learner
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-ink/10 p-4">
            <p className="text-sm text-gray-500 mb-1">Total Learners</p>
            <p className="text-2xl font-bold text-ink">{learners.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-ink/10 p-4">
            <p className="text-sm text-gray-500 mb-1">Active</p>
            <p className="text-2xl font-bold text-green-600">
              {learners.filter(l => l.status === 'Active').length}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-ink/10 p-4">
            <p className="text-sm text-gray-500 mb-1">Forms</p>
            <p className="text-2xl font-bold text-azure">
              {new Set(learners.map(l => l.grade)).size}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-ink/10 p-4">
            <p className="text-sm text-gray-500 mb-1">New This Month</p>
            <p className="text-2xl font-bold text-gold">
              {learners.filter(l => {
                const month = new Date(l.enrollmentDate).getMonth();
                const year = new Date(l.enrollmentDate).getFullYear();
                const now = new Date();
                return month === now.getMonth() && year === now.getFullYear();
              }).length}
            </p>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl border-2 border-ink/10 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, registration or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-ink"
              />
            </div>
            
            <div className="flex gap-3">
              <div className="relative">
                <FunnelIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  value={filterGrade}
                  onChange={(e) => setFilterGrade(e.target.value)}
                  className="pl-10 pr-8 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-ink appearance-none bg-white"
                >
                  <option value="all">All Forms</option>
                  {grades.map(grade => (
                    <option key={grade} value={grade}>{grade}</option>
                  ))}
                </select>
              </div>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-ink"
              >
                <option value="all">All Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedLearners.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
              <span className="text-sm text-gray-600">
                {selectedLearners.length} learner{selectedLearners.length > 1 ? 's' : ''} selected
              </span>
              <button
                onClick={handleBulkAssign}
                className="flex items-center gap-2 px-3 py-1 bg-ink/5 text-ink rounded-lg hover:bg-ink/10 transition-colors text-sm"
              >
                <ArrowPathIcon className="w-4 h-4" />
                Assign New Registration Numbers
              </button>
            </div>
          )}
        </div>

        {/* Learners Table */}
        <div className="bg-white rounded-xl border-2 border-ink/10 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 w-10">
                  <input
                    type="checkbox"
                    checked={selectedLearners.length === filteredLearners.length && filteredLearners.length > 0}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 text-ink border-gray-300 rounded focus:ring-ink"
                  />
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-ink">Name</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-ink">Registration</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-ink">Class</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-ink">Contact</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-ink">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-ink">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredLearners.map((learner) => (
                <tr key={learner.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedLearners.includes(learner.id)}
                      onChange={() => toggleSelectLearner(learner.id)}
                      className="w-4 h-4 text-ink border-gray-300 rounded focus:ring-ink"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-ink/10 rounded-full flex items-center justify-center">
                        <span className="text-ink font-medium text-sm">
                          {learner.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-ink">{learner.name}</div>
                        <div className="text-xs text-gray-500">{learner.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {editingReg === learner.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={newRegNumber}
                          onChange={(e) => setNewRegNumber(e.target.value)}
                          className="px-2 py-1 border border-gray-200 rounded font-mono text-sm w-32"
                          placeholder="EDU-2024-0001"
                          autoFocus
                        />
                        <button
                          onClick={() => handleSaveRegNumber(learner.id)}
                          className="text-green-600 hover:text-green-700"
                          title="Save"
                        >
                          <CheckCircleIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => setEditingReg(null)}
                          className="text-red-600 hover:text-red-700"
                          title="Cancel"
                        >
                          <XCircleIcon className="w-5 h-5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                          {learner.regNumber}
                        </span>
                        <button
                          onClick={() => handleEditRegNumber(learner)}
                          className="text-gray-400 hover:text-ink transition-colors"
                          title="Edit registration number"
                        >
                          <IdentificationIcon className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm text-ink">{learner.class}</div>
                      <div className="text-xs text-gray-500">{learner.stream} Stream</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1 text-xs text-gray-600">
                        <EnvelopeIcon className="w-3 h-3" />
                        <span className="truncate max-w-[150px]">{learner.email}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-600">
                        <PhoneIcon className="w-3 h-3" />
                        <span>{learner.phone}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleToggleStatus(learner.id)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        learner.status === 'Active'
                          ? 'bg-green-100 text-green-600 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {learner.status}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleAssignRegNumber(learner.id)}
                      className="flex items-center gap-1 text-sm text-ink hover:text-azure transition-colors"
                      title="Generate new registration number"
                    >
                      <ArrowPathIcon className="w-4 h-4" />
                      <span className="text-xs">Generate</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredLearners.length === 0 && (
            <div className="text-center py-12">
              <AcademicCapIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-500 mb-2">No learners found</h3>
              <p className="text-sm text-gray-400">Try adjusting your search or filter criteria</p>
            </div>
          )}
        </div>

        {/* Registration Number Format Guide */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-ink/5 rounded-xl p-4 border border-ink/10">
            <h3 className="text-sm font-semibold text-ink mb-2">Format Guide</h3>
            <p className="text-xs text-gray-600 mb-2">
              Format: <span className="font-mono bg-white px-2 py-1 rounded">EDU-YYYY-XXXX</span>
            </p>
            <ul className="text-xs text-gray-500 space-y-1">
              <li>• <span className="font-mono">EDU</span> - School prefix</li>
              <li>• <span className="font-mono">YYYY</span> - Year (e.g., 2024)</li>
              <li>• <span className="font-mono">XXXX</span> - 4-digit sequential number</li>
            </ul>
          </div>

          <div className="bg-ink/5 rounded-xl p-4 border border-ink/10">
            <h3 className="text-sm font-semibold text-ink mb-2">Quick Stats</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Used numbers:</span>
                <span className="font-medium text-ink">{learners.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Available:</span>
                <span className="font-medium text-ink">9996</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div 
                  className="bg-azure h-1.5 rounded-full" 
                  style={{ width: `${(learners.length / 10000) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="bg-ink/5 rounded-xl p-4 border border-ink/10">
            <h3 className="text-sm font-semibold text-ink mb-2">Bulk Actions</h3>
            <p className="text-xs text-gray-600 mb-3">
              Select multiple learners to perform bulk operations
            </p>
            <button
              onClick={handleExport}
              className="text-xs text-azure hover:text-ink transition-colors flex items-center gap-1"
            >
              <DocumentArrowDownIcon className="w-3 h-3" />
              Download selected as CSV
            </button>
          </div>
        </div>

        {/* Add Learner Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl max-w-md w-full p-6">
              <h2 className="text-xl font-bold text-ink mb-4">Add New Learner</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={newLearner.name}
                    onChange={(e) => setNewLearner({...newLearner, name: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-ink"
                    placeholder="e.g., John Doe"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Grade *
                    </label>
                    <select
                      value={newLearner.grade}
                      onChange={(e) => setNewLearner({...newLearner, grade: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-ink"
                    >
                      {grades.map(grade => (
                        <option key={grade} value={grade}>{grade}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Stream *
                    </label>
                    <select
                      value={newLearner.stream}
                      onChange={(e) => setNewLearner({...newLearner, stream: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-ink"
                    >
                      {streams.map(stream => (
                        <option key={stream} value={stream}>{stream}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={newLearner.email}
                    onChange={(e) => setNewLearner({...newLearner, email: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-ink"
                    placeholder="student@eduportal.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={newLearner.phone}
                    onChange={(e) => setNewLearner({...newLearner, phone: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-ink"
                    placeholder="+265 888 123 456"
                  />
                </div>

                <div className="bg-ink/5 p-3 rounded-lg">
                  <p className="text-xs text-gray-600">
                    <span className="font-semibold">Registration number:</span>{' '}
                    <span className="font-mono">{generateRegNumber()}</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Will be automatically generated upon creation
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddLearner}
                  className="px-4 py-2 bg-ink text-white rounded-lg hover:bg-ink/90 transition-colors"
                >
                  Add Learner
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}