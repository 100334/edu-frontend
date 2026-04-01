import React, { useState, useEffect } from 'react';
import { 
  PlusIcon, PencilIcon, TrashIcon, EyeIcon, XMarkIcon, 
  DocumentTextIcon, ClockIcon, QuestionMarkCircleIcon, 
  TrophyIcon, ChevronRightIcon, ArchiveBoxIcon,
  CheckCircleIcon, InformationCircleIcon, LockClosedIcon,
  ShieldCheckIcon, PhotoIcon, SparklesIcon, AcademicCapIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import api from '../../services/api';
import ImageUploader from '../common/ImageUploader';

const QuizManagement = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
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
    is_active: true,
    target_form: 'All'
  });
  
  const [questionForm, setQuestionForm] = useState({
    question_text: '',
    question_image: '',
    question_type: 'multiple_choice',
    options: ['', '', '', ''],
    option_images: ['', '', '', ''],
    correct_answer: 0,
    expected_answer: '',
    answer_image: '',
    explanation: '',
    marks: 1
  });

  useEffect(() => {
    loadQuizzes();
    loadSubjects();
  }, []);

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
          is_active: true,
          target_form: 'All'
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
          is_active: true,
          target_form: 'All'
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
    
    if (!questionForm.question_text && !questionForm.question_image) {
      toast.error('Please enter a question text or upload a diagram');
      return;
    }
    
    // Validate based on question type
    if (questionForm.question_type === 'multiple_choice') {
      if (questionForm.options.some(opt => !opt.trim())) {
        toast.error('Please fill in all options');
        return;
      }
    } else {
      if (!questionForm.expected_answer.trim() && !questionForm.answer_image) {
        toast.error('Please enter an expected answer or upload an answer image');
        return;
      }
    }
    
    const quizId = selectedQuiz.id;
    if (!quizId) {
      toast.error('Invalid quiz ID format - cannot add question');
      return;
    }
    
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const payload = {
        question_text: questionForm.question_text.trim() || null,
        question_image: questionForm.question_image || null,
        question_type: questionForm.question_type,
        marks: questionForm.marks,
        explanation: questionForm.explanation?.trim() || null
      };
      
      if (questionForm.question_type === 'multiple_choice') {
        payload.options = questionForm.options.map(opt => opt.trim());
        payload.option_images = questionForm.option_images.map(img => img || null);
        payload.correct_answer = questionForm.correct_answer;
      } else {
        payload.expected_answer = questionForm.expected_answer.trim() || null;
        payload.answer_image = questionForm.answer_image || null;
      }
      
      const response = await api.post(`/api/admin/quizzes/${quizId}/questions`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        toast.success('Question added successfully!');
        setShowQuestionModal(false);
        setQuestionForm({
          question_text: '',
          question_image: '',
          question_type: 'multiple_choice',
          options: ['', '', '', ''],
          option_images: ['', '', '', ''],
          correct_answer: 0,
          expected_answer: '',
          answer_image: '',
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
      is_active: quiz.is_active !== false,
      target_form: quiz.target_form || 'All'
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

  const getTargetFormColor = (targetForm) => {
    if (targetForm === 'Form 4') return 'bg-purple-100 text-purple-700';
    if (targetForm === 'Form 3') return 'bg-blue-100 text-blue-700';
    if (targetForm === 'Form 2') return 'bg-green-100 text-green-700';
    if (targetForm === 'Form 1') return 'bg-yellow-100 text-yellow-700';
    return 'bg-gray-100 text-gray-700';
  };

  const filteredQuizzes = quizzes.filter(q => {
    if (activeTab === 'active') return q.is_active;
    if (activeTab === 'draft') return !q.is_active;
    return true;
  });

  const stats = {
    total: quizzes.length,
    active: quizzes.filter(q => q.is_active).length,
    questions: quizzes.reduce((acc, q) => acc + (q.question_count || 0), 0)
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-teal-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto pb-12 space-y-8 animate-in fade-in duration-500">
      
      {/* Enhanced Header with Prominent Create Button */}
      <div className="bg-gradient-to-r from-teal-600 to-emerald-600 rounded-3xl p-8 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <AcademicCapIcon className="w-8 h-8 text-white/80" />
              <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">Quiz Management</h1>
            </div>
            <p className="text-teal-100 text-lg">Design, manage, and monitor interactive assessments for learners</p>
          </div>
          
          {/* Prominent Create Quiz Button */}
          <button 
            onClick={() => { 
              setEditingQuiz(null); 
              setQuizForm({ 
                subject_id: '', 
                title: '', 
                description: '', 
                duration: 30, 
                is_active: true,
                target_form: 'All'
              }); 
              setShowQuizModal(true); 
            }}
            className="group relative inline-flex items-center gap-3 px-6 py-4 bg-white text-teal-700 rounded-2xl font-bold text-lg shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-teal-100 to-emerald-100 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <PlusIcon className="w-6 h-6 relative z-10 stroke-[2.5]" />
            <span className="relative z-10">Create New Quiz</span>
            <SparklesIcon className="w-5 h-5 relative z-10 text-yellow-500 group-hover:rotate-12 transition-transform" />
          </button>
        </div>
      </div>

      {/* Stats Cards - Enhanced Design */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[
          { label: 'Total Quizzes', value: stats.total, icon: DocumentTextIcon, color: 'text-teal-600', bg: 'bg-teal-50', gradient: 'from-teal-50 to-white' },
          { label: 'Live Assessments', value: stats.active, icon: CheckCircleIcon, color: 'text-emerald-600', bg: 'bg-emerald-50', gradient: 'from-emerald-50 to-white' },
          { label: 'Total Questions', value: stats.questions, icon: QuestionMarkCircleIcon, color: 'text-amber-600', bg: 'bg-amber-50', gradient: 'from-amber-50 to-white' },
        ].map((stat, i) => (
          <div key={i} className="bg-gradient-to-br ${stat.gradient} p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all hover:-translate-y-1 group">
            <div className="flex items-center gap-4">
              <div className={`${stat.bg} p-3 rounded-xl group-hover:scale-110 transition-transform`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">{stat.label}</p>
                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter Tabs - Modern Design */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 bg-gray-100/50 p-1 rounded-xl">
          {[
            { id: 'all', label: 'All Quizzes', icon: DocumentTextIcon },
            { id: 'active', label: 'Active', icon: CheckCircleIcon },
            { id: 'draft', label: 'Draft', icon: ArchiveBoxIcon }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${
                activeTab === tab.id 
                  ? 'bg-white text-teal-600 shadow-md' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
        
        {filteredQuizzes.length > 0 && (
          <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">
            {filteredQuizzes.length} {filteredQuizzes.length === 1 ? 'quiz' : 'quizzes'} found
          </div>
        )}
      </div>

      {/* Quiz Grid - Enhanced Cards */}
      {filteredQuizzes.length === 0 ? (
        <div className="bg-gradient-to-br from-gray-50 to-white rounded-3xl border-2 border-dashed border-gray-200 py-20 text-center">
          <div className="w-20 h-20 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <ArchiveBoxIcon className="w-10 h-10 text-teal-400" />
          </div>
          <p className="text-gray-500 font-medium text-lg mb-2">No quizzes found</p>
          <p className="text-gray-400 mb-6">Get started by creating your first quiz</p>
          <button 
            onClick={() => { 
              setEditingQuiz(null); 
              setQuizForm({ 
                subject_id: '', 
                title: '', 
                description: '', 
                duration: 30, 
                is_active: true,
                target_form: 'All'
              }); 
              setShowQuizModal(true); 
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-600 text-white rounded-xl font-semibold hover:bg-teal-700 shadow-sm transition-all"
          >
            <PlusIcon className="w-5 h-5" />
            Create Your First Quiz
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredQuizzes.map((quiz) => (
            <div 
              key={quiz.id} 
              className="group bg-white border border-gray-200 rounded-2xl p-6 hover:border-teal-300 hover:shadow-xl hover:shadow-teal-500/5 transition-all duration-300 relative overflow-hidden cursor-pointer"
              onClick={() => viewQuizDetails(quiz)}
            >
              <div className={`absolute top-0 right-0 w-2 h-full ${quiz.is_active ? 'bg-gradient-to-b from-emerald-500 to-teal-500' : 'bg-gray-300'}`} />
              
              <div className="flex justify-between items-start mb-4">
                <div className="flex flex-wrap gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getSubjectColor(quiz.subject_name)}`}>
                    {quiz.subject_name || 'Unknown'}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getTargetFormColor(quiz.target_form)}`}>
                    {quiz.target_form === 'All' ? 'All Forms' : quiz.target_form}
                  </span>
                  {!quiz.is_active && (
                    <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-gray-100 text-gray-600">
                      Draft
                    </span>
                  )}
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditQuiz(quiz);
                    }} 
                    className="p-2 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                  >
                    <PencilIcon className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteQuiz(quiz);
                    }} 
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-teal-600 transition-colors line-clamp-1">
                {quiz.title}
              </h3>
              <p className="text-gray-500 text-sm line-clamp-2 mb-4 h-10">
                {quiz.description || 'No description provided for this assessment.'}
              </p>
              
              {/* Quiz Stats */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="flex gap-4 text-xs font-semibold text-gray-500">
                  <span className="flex items-center gap-1.5">
                    <QuestionMarkCircleIcon className="w-4 h-4" />
                    {quiz.question_count || 0} Questions
                  </span>
                  <span className="flex items-center gap-1.5">
                    <ClockIcon className="w-4 h-4" />
                    {quiz.duration || 0} min
                  </span>
                  <span className="flex items-center gap-1.5">
                    <TrophyIcon className="w-4 h-4" />
                    {quiz.total_marks || 0} pts
                  </span>
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    viewQuizDetails(quiz);
                  }}
                  className="flex items-center gap-1 text-sm font-bold text-teal-600 hover:gap-2 transition-all"
                >
                  Manage Questions <ChevronRightIcon className="w-4 h-4 stroke-2" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quiz Details Side Panel */}
      {selectedQuiz && (
        <div className="fixed inset-y-0 right-0 w-full max-w-2xl bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out border-l border-gray-200">
          <div className="h-full flex flex-col">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-teal-50 to-white">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{selectedQuiz.title}</h2>
                <p className="text-sm text-gray-500">Manage questions and content</p>
              </div>
              <button 
                onClick={() => setSelectedQuiz(null)} 
                className="p-2 hover:bg-gray-200 rounded-full transition-colors"
              >
                <XMarkIcon className="w-6 h-6 text-gray-500" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="flex justify-between items-center sticky top-0 bg-white py-2 z-10">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  Questions 
                  <span className="px-2 py-0.5 bg-teal-100 text-teal-700 rounded-md text-xs font-semibold">
                    {selectedQuiz.questions?.length || 0}
                  </span>
                </h3>
                <button 
                  onClick={() => setShowQuestionModal(true)}
                  className="text-sm font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1 px-3 py-1.5 bg-teal-50 rounded-lg hover:bg-teal-100 transition"
                >
                  <PlusIcon className="w-4 h-4 stroke-2" /> Add Question
                </button>
              </div>

              {!selectedQuiz.questions || selectedQuiz.questions.length === 0 ? (
                <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-white rounded-2xl">
                  <div className="w-16 h-16 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <QuestionMarkCircleIcon className="w-8 h-8 text-teal-400" />
                  </div>
                  <p className="text-gray-500 font-medium">No questions added yet</p>
                  <p className="text-gray-400 text-sm mt-1 mb-4">Start building your quiz by adding questions</p>
                  <button 
                    onClick={() => setShowQuestionModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition"
                  >
                    <PlusIcon className="w-4 h-4" />
                    Add First Question
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedQuiz.questions.map((q, idx) => (
                    <div key={q.id || idx} className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-5 border border-gray-100 hover:border-teal-200 transition-all hover:shadow-md">
                      <div className="flex gap-4">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center text-teal-700 font-bold">
                            {idx + 1}
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-3 flex-wrap">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              q.question_type === 'multiple_choice' 
                                ? 'bg-blue-100 text-blue-700' 
                                : 'bg-purple-100 text-purple-700'
                            }`}>
                              {q.question_type === 'multiple_choice' ? 'Multiple Choice' : 'Short Answer'}
                            </span>
                            {q.question_image && (
                              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-700">
                                📷 Has Diagram
                              </span>
                            )}
                            <span className="text-xs text-gray-400 ml-auto">
                              {q.marks || 1} {q.marks === 1 ? 'point' : 'points'}
                            </span>
                          </div>
                          
                          <p className="font-semibold text-gray-800 mb-3 leading-relaxed">
                            {q.question_text || 'Analyze the diagram below'}
                          </p>
                          
                          {q.question_image && (
                            <div className="mb-4 p-3 bg-white rounded-lg border border-gray-200">
                              <img 
                                src={q.question_image} 
                                alt="Question diagram" 
                                className="max-h-48 rounded-lg mx-auto"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = 'https://via.placeholder.com/400x200?text=Image+Not+Found';
                                }}
                              />
                            </div>
                          )}
                          
                          {q.question_type === 'multiple_choice' && q.options && (
                            <div className="space-y-2 mb-3">
                              {q.options.map((opt, oIdx) => (
                                <div key={oIdx} className={`flex items-start gap-2 p-2 rounded-lg border ${
                                  oIdx === q.correct_answer 
                                    ? 'bg-emerald-50 border-emerald-200' 
                                    : 'bg-white border-gray-200'
                                }`}>
                                  {q.option_images?.[oIdx] && (
                                    <img src={q.option_images[oIdx]} alt="Option" className="w-8 h-8 rounded object-cover border border-gray-200" />
                                  )}
                                  <div className={`flex-1 text-sm ${
                                    oIdx === q.correct_answer ? 'text-emerald-700 font-medium' : 'text-gray-600'
                                  }`}>
                                    <span className="font-mono mr-2">{String.fromCharCode(65 + oIdx)}.</span>
                                    {opt}
                                  </div>
                                  {oIdx === q.correct_answer && (
                                    <CheckCircleIcon className="w-5 h-5 text-emerald-500" />
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {q.question_type === 'short_answer' && (
                            <div className="p-3 bg-purple-50 rounded-xl border border-purple-200">
                              <p className="text-sm text-purple-700">
                                <span className="font-medium">✓ Expected Answer:</span> {q.expected_answer}
                              </p>
                            </div>
                          )}
                          
                          {q.explanation && (
                            <div className="mt-3 flex gap-2 p-3 bg-amber-50 rounded-xl border border-amber-100">
                              <InformationCircleIcon className="w-5 h-5 text-amber-500 shrink-0" />
                              <p className="text-xs text-amber-800 leading-normal">{q.explanation}</p>
                            </div>
                          )}
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

      {/* Create/Edit Quiz Modal - Enhanced */}
      {showQuizModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={(e) => {
          if (e.target === e.currentTarget) {
            setShowQuizModal(false);
            setEditingQuiz(null);
          }
        }}>
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-5 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <AcademicCapIcon className="w-6 h-6 text-teal-600" />
                <h3 className="text-xl font-bold text-gray-800">
                  {editingQuiz ? 'Edit Quiz' : 'Create New Quiz'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowQuizModal(false);
                  setEditingQuiz(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Subject *</label>
                <select
                  value={quizForm.subject_id}
                  onChange={(e) => setQuizForm({ ...quizForm, subject_id: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
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
                <label className="block text-sm font-semibold text-gray-700 mb-2">Quiz Title *</label>
                <input
                  type="text"
                  value={quizForm.title}
                  onChange={(e) => setQuizForm({ ...quizForm, title: e.target.value })}
                  placeholder="e.g., African Geography Basics"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                <textarea
                  value={quizForm.description}
                  onChange={(e) => setQuizForm({ ...quizForm, description: e.target.value })}
                  rows="3"
                  placeholder="Describe what this quiz covers..."
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Target Form</label>
                <select
                  value={quizForm.target_form}
                  onChange={(e) => setQuizForm({ ...quizForm, target_form: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
                >
                  <option value="All">All Forms</option>
                  <option value="Form 1">Form 1 Only</option>
                  <option value="Form 2">Form 2 Only</option>
                  <option value="Form 3">Form 3 Only</option>
                  <option value="Form 4">Form 4 Only</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Duration (minutes)</label>
                <input
                  type="number"
                  value={quizForm.duration}
                  onChange={(e) => setQuizForm({ ...quizForm, duration: parseInt(e.target.value) || 30 })}
                  min="5"
                  max="180"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
                />
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={quizForm.is_active}
                  onChange={(e) => setQuizForm({ ...quizForm, is_active: e.target.checked })}
                  className="w-5 h-5 text-teal-600 rounded focus:ring-teal-500"
                />
                <label htmlFor="is_active" className="text-sm text-gray-700 font-medium">
                  Active (visible to learners)
                </label>
              </div>
              <button
                onClick={editingQuiz ? handleUpdateQuiz : handleCreateQuiz}
                disabled={submitting}
                className="w-full py-3 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-xl hover:from-teal-700 hover:to-emerald-700 transition font-bold shadow-lg disabled:opacity-50"
              >
                {submitting ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {editingQuiz ? 'Updating...' : 'Creating...'}
                  </div>
                ) : (
                  editingQuiz ? 'Update Quiz' : 'Create Quiz'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Question Modal - Keep existing implementation */}
      {showQuestionModal && selectedQuiz && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={(e) => {
          if (e.target === e.currentTarget) {
            setShowQuestionModal(false);
          }
        }}>
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-5 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-800">
                Add Question to "{selectedQuiz.title}"
              </h3>
              <button
                onClick={() => setShowQuestionModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              {/* Question Text */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Question Text</label>
                <textarea
                  value={questionForm.question_text}
                  onChange={(e) => setQuestionForm({ ...questionForm, question_text: e.target.value })}
                  rows="3"
                  placeholder="Enter your question here..."
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
                />
                <p className="text-xs text-gray-500 mt-1">You can also use a diagram instead of text</p>
              </div>
              
              {/* Question Diagram Upload */}
              <ImageUploader
                label="Question Diagram (Optional)"
                currentImage={questionForm.question_image}
                onImageUpload={(url) => setQuestionForm({ ...questionForm, question_image: url })}
              />
              
              {/* Question Type */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Question Type</label>
                <select
                  value={questionForm.question_type}
                  onChange={(e) => {
                    setQuestionForm({ 
                      ...questionForm, 
                      question_type: e.target.value,
                      options: e.target.value === 'multiple_choice' ? ['', '', '', ''] : [],
                      option_images: ['', '', '', ''],
                      correct_answer: 0,
                      expected_answer: ''
                    });
                  }}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
                >
                  <option value="multiple_choice">Multiple Choice</option>
                  <option value="short_answer">Short Answer</option>
                </select>
              </div>

              {questionForm.question_type === 'multiple_choice' ? (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Options *</label>
                    <div className="space-y-3">
                      {questionForm.options.map((opt, idx) => (
                        <div key={idx} className="border rounded-xl p-3">
                          <div className="flex items-center gap-2 mb-2">
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
                              placeholder={`Option ${String.fromCharCode(65 + idx)} text`}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                            />
                            {idx === questionForm.correct_answer && (
                              <span className="text-emerald-600 text-sm font-medium">✓ Correct</span>
                            )}
                          </div>
                          <ImageUploader
                            label="Option Image (Optional)"
                            currentImage={questionForm.option_images[idx]}
                            onImageUpload={(url) => {
                              const newImages = [...questionForm.option_images];
                              newImages[idx] = url;
                              setQuestionForm({ ...questionForm, option_images: newImages });
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Correct Answer *</label>
                    <select
                      value={questionForm.correct_answer}
                      onChange={(e) => setQuestionForm({ ...questionForm, correct_answer: parseInt(e.target.value) })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500"
                    >
                      {questionForm.options.map((_, idx) => (
                        <option key={idx} value={idx}>
                          Option {String.fromCharCode(65 + idx)}: {questionForm.options[idx] || `Option ${String.fromCharCode(65 + idx)}`}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Expected Answer *</label>
                    <textarea
                      value={questionForm.expected_answer}
                      onChange={(e) => setQuestionForm({ ...questionForm, expected_answer: e.target.value })}
                      rows="3"
                      placeholder="Enter the expected answer (case insensitive)"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Student's answer will be compared case-insensitively</p>
                  </div>
                  <ImageUploader
                    label="Answer Reference Image (Optional)"
                    currentImage={questionForm.answer_image}
                    onImageUpload={(url) => setQuestionForm({ ...questionForm, answer_image: url })}
                  />
                </>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Explanation (Optional)</label>
                <textarea
                  value={questionForm.explanation}
                  onChange={(e) => setQuestionForm({ ...questionForm, explanation: e.target.value })}
                  rows="2"
                  placeholder="Explain why this is the correct answer..."
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Marks</label>
                <input
                  type="number"
                  value={questionForm.marks}
                  onChange={(e) => setQuestionForm({ ...questionForm, marks: parseInt(e.target.value) || 1 })}
                  min="1"
                  max="10"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <button
                onClick={handleAddQuestion}
                disabled={submitting}
                className="w-full py-3 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-xl hover:from-teal-700 hover:to-emerald-700 transition font-bold shadow-lg disabled:opacity-50"
              >
                {submitting ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Adding...
                  </div>
                ) : (
                  'Add Question'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizManagement;