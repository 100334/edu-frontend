import React, { useState, useEffect } from 'react';
import { 
  PlusIcon, PencilIcon, TrashIcon, EyeIcon, XMarkIcon, 
  DocumentTextIcon, ClockIcon, QuestionMarkCircleIcon, 
  TrophyIcon, ChevronRightIcon, ArchiveBoxIcon,
  CheckCircleIcon, InformationCircleIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import api from '../../services/api';

const QuizManagement = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'active', 'draft'
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Form states
  const [quizForm, setQuizForm] = useState({
    subject_id: '',
    title: '',
    description: '',
    duration: 30,
    is_active: true
  });
  
  const [questionForm, setQuestionForm] = useState({
    question_text: '',
    options: ['', '', '', ''],
    correct_answer: 0,
    explanation: '',
    marks: 1
  });

  useEffect(() => {
    loadQuizzes();
    loadSubjects();
  }, []);

  // Helper function to ensure ID is valid
  const ensureValidId = (id) => {
    if (!id) return null;
    if (typeof id === 'string' && id.includes('-')) return id;
    if (typeof id === 'number') return id;
    if (typeof id === 'string') {
      const parsed = parseInt(id);
      return isNaN(parsed) ? id : parsed;
    }
    return null;
  };

  const loadSubjects = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found');
        toast.error('Please login again');
        return;
      }
      
      const response = await api.get('/api/admin/quiz-subjects', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setSubjects(response.data.subjects || []);
      } else {
        toast.error(response.data.message || 'Failed to load subjects');
      }
    } catch (error) {
      console.error('Error loading subjects:', error);
      toast.error(error.response?.data?.message || 'Failed to load subjects');
    }
  };

  const loadQuizzes = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found');
        toast.error('Please login again');
        return;
      }
      
      const response = await api.get('/api/admin/quizzes', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        const quizzesData = response.data.quizzes || [];
        setQuizzes(quizzesData);
      } else {
        toast.error(response.data.message || 'Failed to load quizzes');
      }
    } catch (error) {
      console.error('Error loading quizzes:', error);
      toast.error(error.response?.data?.message || 'Failed to load quizzes');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateQuiz = async () => {
    if (!quizForm.subject_id) {
      toast.error('Please select a subject');
      return;
    }
    if (!quizForm.title.trim()) {
      toast.error('Please enter a quiz title');
      return;
    }
    
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await api.post('/api/admin/quizzes', quizForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        toast.success('Quiz created successfully!');
        setShowQuizModal(false);
        setQuizForm({
          subject_id: '',
          title: '',
          description: '',
          duration: 30,
          is_active: true
        });
        loadQuizzes();
      } else {
        toast.error(response.data.message || 'Failed to create quiz');
      }
    } catch (error) {
      console.error('Error creating quiz:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create quiz';
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateQuiz = async () => {
    if (!editingQuiz || !quizForm.title.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    const quizId = editingQuiz.id;
    if (!quizId) {
      toast.error('Invalid quiz ID');
      return;
    }
    
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await api.put(`/api/admin/quizzes/${quizId}`, quizForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        toast.success('Quiz updated successfully!');
        setShowQuizModal(false);
        setEditingQuiz(null);
        setQuizForm({
          subject_id: '',
          title: '',
          description: '',
          duration: 30,
          is_active: true
        });
        loadQuizzes();
      } else {
        toast.error(response.data.message || 'Failed to update quiz');
      }
    } catch (error) {
      console.error('Error updating quiz:', error);
      toast.error(error.response?.data?.message || 'Failed to update quiz');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteQuiz = async (quiz) => {
    if (!window.confirm(`Are you sure you want to delete "${quiz.title}"? This will also delete all questions and attempts.`)) {
      return;
    }

    const quizId = quiz.id;
    if (!quizId) {
      toast.error('Invalid quiz ID');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await api.delete(`/api/admin/quizzes/${quizId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        toast.success('Quiz deleted successfully!');
        loadQuizzes();
        if (selectedQuiz?.id === quiz.id) {
          setSelectedQuiz(null);
        }
      } else {
        toast.error(response.data.message || 'Failed to delete quiz');
      }
    } catch (error) {
      console.error('Error deleting quiz:', error);
      toast.error(error.response?.data?.message || 'Failed to delete quiz');
    }
  };

  const handleAddQuestion = async () => {
    if (!selectedQuiz) {
      toast.error('No quiz selected');
      return;
    }
    
    if (!questionForm.question_text.trim()) {
      toast.error('Please enter a question');
      return;
    }
    
    if (questionForm.options.some(opt => !opt.trim())) {
      toast.error('Please fill in all options');
      return;
    }
    
    const quizId = selectedQuiz.id;
    if (!quizId) {
      toast.error('Invalid quiz ID format - cannot add question');
      return;
    }
    
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await api.post(`/api/admin/quizzes/${quizId}/questions`, {
        question_text: questionForm.question_text.trim(),
        options: questionForm.options.map(opt => opt.trim()),
        correct_answer: questionForm.correct_answer,
        explanation: questionForm.explanation?.trim() || null,
        marks: questionForm.marks
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        toast.success('Question added successfully!');
        setShowQuestionModal(false);
        setQuestionForm({
          question_text: '',
          options: ['', '', '', ''],
          correct_answer: 0,
          explanation: '',
          marks: 1
        });
        
        // Refresh the selected quiz details
        const updatedQuiz = await api.get(`/api/quiz/${quizId}/questions`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSelectedQuiz({
          ...selectedQuiz,
          questions: updatedQuiz.data.questions || []
        });
        loadQuizzes();
      } else {
        toast.error(response.data.message || 'Failed to add question');
      }
    } catch (error) {
      console.error('Error adding question:', error);
      toast.error(error.response?.data?.message || 'Failed to add question');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditQuiz = (quiz) => {
    setEditingQuiz(quiz);
    setQuizForm({
      subject_id: quiz.subject_id || '',
      title: quiz.title || '',
      description: quiz.description || '',
      duration: quiz.duration || 30,
      is_active: quiz.is_active !== false
    });
    setShowQuizModal(true);
  };

  const viewQuizDetails = async (quiz) => {
    try {
      const quizId = quiz.id;
      if (!quizId) {
        toast.error('Invalid quiz ID');
        return;
      }
      
      const token = localStorage.getItem('token');
      const response = await api.get(`/api/quiz/${quizId}/questions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSelectedQuiz({
        ...quiz,
        questions: response.data.questions || []
      });
    } catch (error) {
      console.error('Error fetching quiz details:', error);
      toast.error('Failed to load quiz details');
    }
  };

  const getSubjectColor = (subjectName) => {
    const colors = {
      'Geography': 'bg-emerald-100 text-emerald-700',
      'English': 'bg-blue-100 text-blue-700',
      'Biology': 'bg-purple-100 text-purple-700',
      'Mathematics': 'bg-orange-100 text-orange-700',
      'Physics': 'bg-cyan-100 text-cyan-700',
      'Chemistry': 'bg-pink-100 text-pink-700'
    };
    return colors[subjectName] || 'bg-gray-100 text-gray-700';
  };

  // Filter quizzes based on active tab
  const filteredQuizzes = quizzes.filter(q => {
    if (activeTab === 'active') return q.is_active;
    if (activeTab === 'draft') return !q.is_active;
    return true;
  });

  // Calculate stats
  const stats = {
    total: quizzes.length,
    active: quizzes.filter(q => q.is_active).length,
    questions: quizzes.reduce((acc, q) => acc + (q.question_count || 0), 0)
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto pb-12 space-y-8 animate-in fade-in duration-500">
      
      {/* 1. Header & Stats Hub */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Quiz Curriculum</h1>
          <p className="text-gray-500 mt-1 text-lg">Design and monitor assessment performance.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => { 
              setEditingQuiz(null); 
              setQuizForm({ 
                subject_id: '', 
                title: '', 
                description: '', 
                duration: 30, 
                is_active: true 
              }); 
              setShowQuizModal(true); 
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 shadow-sm transition-all active:scale-95"
          >
            <PlusIcon className="w-5 h-5 stroke-2" />
            New Quiz
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Total Quizzes', value: stats.total, icon: DocumentTextIcon, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Live Assessments', value: stats.active, icon: CheckCircleIcon, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Total Questions', value: stats.questions, icon: QuestionMarkCircleIcon, color: 'text-amber-600', bg: 'bg-amber-50' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className={`${stat.bg} p-3 rounded-xl`}>
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* 2. Filter Tabs */}
      <div className="flex items-center gap-2 bg-gray-100/50 p-1 rounded-xl w-fit">
        {['all', 'active', 'draft'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${
              activeTab === tab ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* 3. Quiz Grid */}
      {filteredQuizzes.length === 0 ? (
        <div className="bg-white rounded-3xl border-2 border-dashed border-gray-200 py-20 text-center">
          <ArchiveBoxIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">No quizzes found in this category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredQuizzes.map((quiz) => (
            <div key={quiz.id} className="group bg-white border border-gray-200 rounded-2xl p-6 hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300 relative overflow-hidden">
              <div className={`absolute top-0 right-0 w-1.5 h-full ${quiz.is_active ? 'bg-emerald-500' : 'bg-gray-300'}`} />
              
              <div className="flex justify-between items-start mb-4">
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getSubjectColor(quiz.subject_name)}`}>
                  {quiz.subject_name || 'Unknown'}
                </span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEditQuiz(quiz)} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                    <PencilIcon className="w-5 h-5" />
                  </button>
                  <button onClick={() => handleDeleteQuiz(quiz)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors">{quiz.title}</h3>
              <p className="text-gray-500 text-sm line-clamp-2 mb-6 h-10">{quiz.description || 'No description provided for this assessment.'}</p>
              
              <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                <div className="flex gap-4 text-xs font-semibold text-gray-400 uppercase tracking-widest">
                  <span className="flex items-center gap-1.5">
                    <QuestionMarkCircleIcon className="w-4 h-4" />
                    {quiz.question_count || 0} Qs
                  </span>
                  <span className="flex items-center gap-1.5">
                    <ClockIcon className="w-4 h-4" />
                    {quiz.duration || 0}m
                  </span>
                  <span className="flex items-center gap-1.5">
                    <TrophyIcon className="w-4 h-4" />
                    {quiz.total_marks || 0} pts
                  </span>
                </div>
                <button 
                  onClick={() => viewQuizDetails(quiz)}
                  className="flex items-center gap-1 text-sm font-bold text-indigo-600 hover:gap-2 transition-all"
                >
                  Manage Content <ChevronRightIcon className="w-4 h-4 stroke-2" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 4. Side Panel for Quiz Details */}
      {selectedQuiz && (
        <div className="fixed inset-y-0 right-0 w-full max-w-2xl bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out border-l border-gray-200">
          <div className="h-full flex flex-col">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{selectedQuiz.title}</h2>
                <p className="text-sm text-gray-500">Content Management</p>
              </div>
              <button onClick={() => setSelectedQuiz(null)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                <XMarkIcon className="w-6 h-6 text-gray-500" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  Questions 
                  <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-md text-xs">
                    {selectedQuiz.questions?.length || 0}
                  </span>
                </h3>
                <button 
                  onClick={() => setShowQuestionModal(true)}
                  className="text-sm font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                >
                  <PlusIcon className="w-4 h-4 stroke-2" /> Add New
                </button>
              </div>

              {!selectedQuiz.questions || selectedQuiz.questions.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-2xl">
                  <QuestionMarkCircleIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No questions added yet</p>
                  <button 
                    onClick={() => setShowQuestionModal(true)}
                    className="mt-3 text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                  >
                    + Add your first question
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedQuiz.questions.map((q, idx) => (
                    <div key={q.id || idx} className="bg-gray-50 rounded-2xl p-5 border border-gray-100 hover:border-indigo-200 transition-colors">
                      <div className="flex justify-between gap-4">
                        <span className="font-mono text-indigo-300 text-lg font-bold">0{idx + 1}</span>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-800 mb-4 leading-relaxed">{q.question_text}</p>
                          <div className="grid grid-cols-1 gap-2">
                            {q.options && q.options.map((opt, oIdx) => (
                              <div key={oIdx} className={`px-4 py-2 rounded-xl text-sm border ${
                                oIdx === q.correct_answer 
                                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700 font-medium' 
                                  : 'bg-white border-gray-200 text-gray-600'
                              }`}>
                                {String.fromCharCode(65 + oIdx)}. {opt}
                              </div>
                            ))}
                          </div>
                          {q.explanation && (
                            <div className="mt-4 flex gap-2 p-3 bg-amber-50 rounded-xl border border-amber-100">
                              <InformationCircleIcon className="w-5 h-5 text-amber-500 shrink-0" />
                              <p className="text-xs text-amber-800 leading-normal">{q.explanation}</p>
                            </div>
                          )}
                          <div className="mt-3 flex justify-end">
                            <span className="text-xs text-gray-400">{q.marks || 1} point{q.marks !== 1 ? 's' : ''}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Quiz Modal */}
      {showQuizModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={(e) => {
          if (e.target === e.currentTarget) {
            setShowQuizModal(false);
            setEditingQuiz(null);
          }
        }}>
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-800">
                {editingQuiz ? 'Edit Quiz' : 'Create New Quiz'}
              </h3>
              <button
                onClick={() => {
                  setShowQuizModal(false);
                  setEditingQuiz(null);
                }}
                className="p-1 hover:bg-gray-100 rounded-lg"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
                <select
                  value={quizForm.subject_id}
                  onChange={(e) => setQuizForm({ ...quizForm, subject_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                >
                  <option value="">Select a subject</option>
                  {subjects.map(subject => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quiz Title *</label>
                <input
                  type="text"
                  value={quizForm.title}
                  onChange={(e) => setQuizForm({ ...quizForm, title: e.target.value })}
                  placeholder="e.g., African Geography Basics"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={quizForm.description}
                  onChange={(e) => setQuizForm({ ...quizForm, description: e.target.value })}
                  rows="3"
                  placeholder="Describe what this quiz covers..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
                <input
                  type="number"
                  value={quizForm.duration}
                  onChange={(e) => setQuizForm({ ...quizForm, duration: parseInt(e.target.value) || 30 })}
                  min="5"
                  max="180"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={quizForm.is_active}
                  onChange={(e) => setQuizForm({ ...quizForm, is_active: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                />
                <label htmlFor="is_active" className="text-sm text-gray-700">Active (visible to learners)</label>
              </div>
              <button
                onClick={editingQuiz ? handleUpdateQuiz : handleCreateQuiz}
                disabled={submitting}
                className="w-full py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (editingQuiz ? 'Updating...' : 'Creating...') : (editingQuiz ? 'Update Quiz' : 'Create Quiz')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Question Modal */}
      {showQuestionModal && selectedQuiz && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={(e) => {
          if (e.target === e.currentTarget) {
            setShowQuestionModal(false);
          }
        }}>
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-800">
                Add Question to "{selectedQuiz.title}"
              </h3>
              <button
                onClick={() => {
                  setShowQuestionModal(false);
                }}
                className="p-1 hover:bg-gray-100 rounded-lg"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Question Text *</label>
                <textarea
                  value={questionForm.question_text}
                  onChange={(e) => setQuestionForm({ ...questionForm, question_text: e.target.value })}
                  rows="3"
                  placeholder="Enter your question here..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Options *</label>
                <div className="space-y-2">
                  {questionForm.options.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => {
                          const newOptions = [...questionForm.options];
                          newOptions[idx] = e.target.value;
                          setQuestionForm({ ...questionForm, options: newOptions });
                        }}
                        placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                      {idx === questionForm.correct_answer && (
                        <span className="text-green-600 text-sm font-medium">✓ Correct</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Correct Answer *</label>
                <select
                  value={questionForm.correct_answer}
                  onChange={(e) => setQuestionForm({ ...questionForm, correct_answer: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  {questionForm.options.map((_, idx) => (
                    <option key={idx} value={idx}>
                      Option {String.fromCharCode(65 + idx)}: {questionForm.options[idx] || `Option ${String.fromCharCode(65 + idx)}`}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Explanation (Optional)</label>
                <textarea
                  value={questionForm.explanation}
                  onChange={(e) => setQuestionForm({ ...questionForm, explanation: e.target.value })}
                  rows="2"
                  placeholder="Explain why this is the correct answer..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Marks</label>
                <input
                  type="number"
                  value={questionForm.marks}
                  onChange={(e) => setQuestionForm({ ...questionForm, marks: parseInt(e.target.value) || 1 })}
                  min="1"
                  max="10"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <button
                onClick={handleAddQuestion}
                disabled={submitting}
                className="w-full py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Adding...' : 'Add Question'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizManagement;