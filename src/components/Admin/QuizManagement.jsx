import React, { useState, useEffect } from 'react';
import { 
  PlusIcon, PencilIcon, TrashIcon, EyeIcon, XMarkIcon, 
  DocumentTextIcon, ClockIcon, QuestionMarkCircleIcon, 
  TrophyIcon, ChevronRightIcon, ArchiveBoxIcon,
  CheckCircleIcon, InformationCircleIcon, LockClosedIcon,
  ShieldCheckIcon, PhotoIcon, SparklesIcon, AcademicCapIcon,
  UserGroupIcon, ClipboardDocumentListIcon,
  ArrowPathIcon
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
  
  // Grading states
  const [submissions, setSubmissions] = useState([]);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [gradingModal, setGradingModal] = useState(false);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [gradingQuizId, setGradingQuizId] = useState(null);
  
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

  // Load data on mount
  useEffect(() => {
    loadQuizzes();
    loadSubjects();
  }, []);

  const loadSubjects = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
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
      toast.error('Failed to load subjects. Please refresh.');
    }
  };

  const loadQuizzes = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await api.get('/api/admin/quizzes', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setQuizzes(response.data.quizzes || []);
      } else {
        toast.error(response.data.message || 'Failed to load quizzes');
      }
    } catch (error) {
      console.error('Error loading quizzes:', error);
      toast.error('Failed to load quizzes');
    } finally {
      setLoading(false);
    }
  };

  // Load submissions for grading
  const loadSubmissions = async (quizId) => {
    if (!quizId) return;
    setLoadingSubmissions(true);
    try {
      const token = localStorage.getItem('token');
      const res = await api.get(`/api/admin/quizzes/${quizId}/submissions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        const formatted = (res.data.submissions || []).map(sub => ({
          id: sub.id,
          student_name: sub.student_name,
          submitted_at: sub.submitted_at,
          total_marks: sub.total_marks,
          earned_marks: sub.earned_marks,
          answers: (sub.answers || []).map(ans => ({
            question_id: ans.question_id,
            question_text: ans.question_text,
            question_type: ans.question_type,
            answer: ans.selected_answer_text || ans.answer,
            max_marks: ans.max_marks,
            given_marks: ans.given_marks ?? null,
            feedback: ans.feedback || ''
          }))
        }));
        setSubmissions(formatted);
        if (formatted.length === 0) toast('No submissions yet', { icon: 'ℹ️' });
        else toast.success(`Loaded ${formatted.length} submission(s)`);
      } else {
        toast.error(res.data.message || 'Failed to load submissions');
      }
    } catch (err) {
      console.error('Error loading submissions:', err);
      toast.error(err.response?.data?.message || 'Failed to load submissions');
    } finally {
      setLoadingSubmissions(false);
    }
  };

  // Create quiz with proper validation
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
      const payload = {
        subject_id: quizForm.subject_id,
        title: quizForm.title.trim(),
        description: quizForm.description || null,
        duration: parseInt(quizForm.duration) || 30,
        is_active: quizForm.is_active,
        target_form: quizForm.target_form
      };
      const response = await api.post('/api/admin/quizzes', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        toast.success('Quiz created successfully!');
        setShowQuizModal(false);
        resetQuizForm();
        loadQuizzes();
      } else {
        toast.error(response.data.message || 'Failed to create quiz');
      }
    } catch (error) {
      console.error('Error creating quiz:', error);
      toast.error(error.response?.data?.message || 'Failed to create quiz');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateQuiz = async () => {
    if (!editingQuiz || !quizForm.title.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await api.put(`/api/admin/quizzes/${editingQuiz.id}`, quizForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        toast.success('Quiz updated successfully!');
        setShowQuizModal(false);
        setEditingQuiz(null);
        resetQuizForm();
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
    if (!window.confirm(`Delete "${quiz.title}"? This will also delete all questions and attempts.`)) return;
    try {
      const token = localStorage.getItem('token');
      const response = await api.delete(`/api/admin/quizzes/${quiz.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        toast.success('Quiz deleted successfully!');
        loadQuizzes();
        if (selectedQuiz?.id === quiz.id) setSelectedQuiz(null);
        if (gradingQuizId === quiz.int_id) {  // compare with int_id
          setGradingQuizId(null);
          setSubmissions([]);
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
        payload.option_images = questionForm.option_images;
        payload.correct_answer = questionForm.correct_answer;
      } else {
        payload.expected_answer = questionForm.expected_answer.trim();
        payload.answer_image = questionForm.answer_image || null;
      }
      const response = await api.post(`/api/admin/quizzes/${selectedQuiz.id}/questions`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        toast.success('Question added successfully!');
        setShowQuestionModal(false);
        resetQuestionForm();
        // Refresh the selected quiz details using ADMIN endpoint
        const updatedQuiz = await api.get(`/api/admin/quizzes/${selectedQuiz.id}/questions`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSelectedQuiz({
          ...selectedQuiz,
          questions: updatedQuiz.data.questions || []
        });
        loadQuizzes(); // update counts
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

  const resetQuizForm = () => {
    setQuizForm({
      subject_id: '',
      title: '',
      description: '',
      duration: 30,
      is_active: true,
      target_form: 'All'
    });
  };

  const resetQuestionForm = () => {
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

  // FIXED: Use admin endpoint for fetching questions
  const viewQuizDetails = async (quiz) => {
    if (!quiz?.id) {
      toast.error('Invalid quiz');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const response = await api.get(`/api/admin/quizzes/${quiz.id}/questions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedQuiz({
        ...quiz,
        questions: response.data.questions || []
      });
    } catch (error) {
      console.error('Error fetching quiz details:', error);
      toast.error(error.response?.data?.message || 'Failed to load quiz details');
    }
  };

  // Grading handlers - UPDATED to use int_id
  const handleGradingTab = () => {
    setActiveTab('grading');
    if (gradingQuizId) {
      loadSubmissions(gradingQuizId);
    } else if (selectedQuiz && selectedQuiz.int_id) {
      const intId = selectedQuiz.int_id;
      setGradingQuizId(intId);
      loadSubmissions(intId);
    }
  };

  const handleSelectQuizForGrading = (quizId) => {
    setGradingQuizId(quizId);
    loadSubmissions(quizId);
  };

  const refreshSubmissions = () => {
    if (gradingQuizId) loadSubmissions(gradingQuizId);
  };

  const saveGrades = async () => {
    if (!selectedSubmission) return;
    try {
      const token = localStorage.getItem('token');
      const payload = {
        attempt_id: selectedSubmission.id,
        answers: selectedSubmission.answers.map(a => ({
          question_id: a.question_id,
          marks_awarded: a.given_marks,
          feedback: a.feedback || null
        }))
      };
      const response = await api.post('/api/admin/grade', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        toast.success('Grades saved successfully!');
        setGradingModal(false);
        refreshSubmissions();
      } else {
        toast.error(response.data.message || 'Failed to save grades');
      }
    } catch (err) {
      console.error('Error saving grades:', err);
      toast.error(err.response?.data?.message || 'Failed to save grades');
    }
  };

  // UI helpers
  const getSubjectColor = (subjectName) => {
    const colors = {
      'Geography': 'bg-sky-100 text-sky-800',
      'English': 'bg-blue-100 text-blue-800',
      'Biology': 'bg-cyan-100 text-cyan-800',
      'Mathematics': 'bg-indigo-100 text-indigo-800',
      'Physics': 'bg-sky-100 text-sky-800',
      'Chemistry': 'bg-blue-100 text-blue-800'
    };
    return colors[subjectName] || 'bg-slate-100 text-slate-700';
  };

  const getTargetFormColor = (targetForm) => {
    if (targetForm === 'Form 4') return 'bg-indigo-100 text-indigo-800';
    if (targetForm === 'Form 3') return 'bg-blue-100 text-blue-800';
    if (targetForm === 'Form 2') return 'bg-sky-100 text-sky-800';
    if (targetForm === 'Form 1') return 'bg-cyan-100 text-cyan-800';
    return 'bg-slate-100 text-slate-700';
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
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-800 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto pb-12 space-y-8" style={{ fontFamily: "'Calibri', 'Segoe UI', sans-serif" }}>
      
      {/* Create Quiz Button */}
      <div className="flex justify-end">
        <button 
          onClick={() => { setEditingQuiz(null); resetQuizForm(); setShowQuizModal(true); }}
          className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-800 to-sky-700 text-white rounded-2xl font-bold text-lg shadow-lg hover:scale-105 transition"
        >
          <PlusIcon className="w-6 h-6" />
          <span>Create New Quiz</span>
          <SparklesIcon className="w-5 h-5 text-yellow-300" />
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[
          { label: 'Total Quizzes', value: stats.total, icon: DocumentTextIcon, color: 'text-blue-800' },
          { label: 'Live Assessments', value: stats.active, icon: CheckCircleIcon, color: 'text-sky-700' },
          { label: 'Total Questions', value: stats.questions, icon: QuestionMarkCircleIcon, color: 'text-indigo-700' },
        ].map((stat, i) => (
          <div key={i} className="bg-sky-100 border-2 border-sky-400 p-6 rounded-2xl hover:shadow-md transition">
            <div className="flex items-center gap-4">
              <div className="bg-white p-3 rounded-xl">
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 uppercase">{stat.label}</p>
                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 bg-gray-100/50 p-1 rounded-xl">
          {[
            { id: 'all', label: 'All Quizzes', icon: DocumentTextIcon },
            { id: 'active', label: 'Active', icon: CheckCircleIcon },
            { id: 'draft', label: 'Draft', icon: ArchiveBoxIcon },
            { id: 'grading', label: 'Grading', icon: UserGroupIcon }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                if (tab.id === 'grading') handleGradingTab();
                else setActiveTab(tab.id);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold capitalize transition ${
                activeTab === tab.id 
                  ? 'bg-white text-blue-800 shadow-md' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grading View - FIXED: use int_id for select options */}
      {activeTab === 'grading' ? (
        <div className="bg-white rounded-2xl shadow p-6">
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Select Quiz to Grade</label>
            <div className="flex gap-3">
              <select
                value={gradingQuizId || ''}
                onChange={(e) => handleSelectQuizForGrading(e.target.value)}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Choose a quiz --</option>
                {quizzes.map(quiz => (
                  <option key={quiz.int_id} value={quiz.int_id}>
                    {quiz.title} ({quiz.subject_name || 'No subject'}) - {quiz.question_count || 0} questions
                  </option>
                ))}
              </select>
              {gradingQuizId && (
                <button onClick={refreshSubmissions} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 flex items-center gap-2">
                  <ArrowPathIcon className="w-4 h-4" /> Refresh
                </button>
              )}
            </div>
          </div>

          {!gradingQuizId ? (
            <div className="text-center py-12">
              <ClipboardDocumentListIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">Select a quiz from the dropdown to view submissions.</p>
            </div>
          ) : loadingSubmissions ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
            </div>
          ) : submissions.length === 0 ? (
            <div className="text-center py-12">
              <UserGroupIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No submissions yet for this quiz.</p>
            </div>
          ) : (
            <div>
              <h3 className="text-xl font-bold mb-4">Submissions</h3>
              <div className="space-y-4">
                {submissions.map(sub => (
                  <div key={sub.id} className="border rounded-xl p-4 hover:shadow-md">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-800">{sub.student_name}</p>
                        <p className="text-sm text-gray-500">Submitted: {new Date(sub.submitted_at).toLocaleString()}</p>
                        <p className="text-sm mt-1">
                          Marks: <span className="font-semibold">{sub.earned_marks ?? 'Not graded'}</span> / {sub.total_marks}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedSubmission(sub);
                          setGradingModal(true);
                        }}
                        className="px-4 py-2 bg-blue-800 text-white rounded-lg text-sm hover:bg-blue-900"
                      >
                        Grade
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Quiz Grid */
        filteredQuizzes.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed rounded-3xl">
            <ArchiveBoxIcon className="w-20 h-20 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg">No quizzes found</p>
            <button onClick={() => setShowQuizModal(true)} className="mt-4 px-5 py-2 bg-blue-800 text-white rounded-xl">Create First Quiz</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredQuizzes.map((quiz) => (
              <div 
                key={quiz.id} 
                className="group bg-white border border-gray-200 rounded-2xl p-6 hover:border-sky-300 hover:shadow-xl cursor-pointer transition relative"
                onClick={() => viewQuizDetails(quiz)}
              >
                <div className={`absolute top-0 right-0 w-2 h-full ${quiz.is_active ? 'bg-gradient-to-b from-sky-600 to-blue-700' : 'bg-gray-300'}`} />
                <div className="flex justify-between items-start mb-4">
                  <div className="flex gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${getSubjectColor(quiz.subject_name)}`}>
                      {quiz.subject_name || 'Unknown'}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${getTargetFormColor(quiz.target_form)}`}>
                      {quiz.target_form === 'All' ? 'All Forms' : quiz.target_form}
                    </span>
                    {!quiz.is_active && <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600">Draft</span>}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100" onClick={(e) => e.stopPropagation()}>
                    <button onClick={(e) => { e.stopPropagation(); openEditQuiz(quiz); }} className="p-2 text-gray-400 hover:text-blue-700 hover:bg-blue-50 rounded-lg">
                      <PencilIcon className="w-5 h-5" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteQuiz(quiz); }} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-800">{quiz.title}</h3>
                <p className="text-gray-500 text-sm line-clamp-2 mb-4">{quiz.description || 'No description'}</p>
                <div className="flex justify-between pt-4 border-t">
                  <div className="flex gap-4 text-xs text-gray-500">
                    <span><QuestionMarkCircleIcon className="w-4 h-4 inline mr-1" />{quiz.question_count || 0} Qs</span>
                    <span><ClockIcon className="w-4 h-4 inline mr-1" />{quiz.duration} min</span>
                    <span><TrophyIcon className="w-4 h-4 inline mr-1" />{quiz.total_marks || 0} marks</span>
                  </div>
                  <button className="text-sm font-bold text-blue-700">Manage Questions <ChevronRightIcon className="w-4 h-4 inline" /></button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Quiz Details Side Panel */}
      {selectedQuiz && activeTab !== 'grading' && (
        <div className="fixed inset-y-0 right-0 w-full max-w-2xl bg-white shadow-2xl z-50 transform transition-transform duration-300 border-l border-gray-200">
          <div className="h-full flex flex-col">
            <div className="p-6 border-b flex justify-between items-center bg-gradient-to-r from-blue-50 to-white">
              <div>
                <h2 className="text-xl font-bold">{selectedQuiz.title}</h2>
                <p className="text-sm text-gray-500">Manage questions and content</p>
              </div>
              <button onClick={() => setSelectedQuiz(null)} className="p-2 hover:bg-gray-200 rounded-full"><XMarkIcon className="w-6 h-6" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="flex justify-between items-center sticky top-0 bg-white py-2 z-10">
                <h3 className="font-bold flex items-center gap-2">Questions <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-md text-xs">{selectedQuiz.questions?.length || 0}</span></h3>
                <button onClick={() => setShowQuestionModal(true)} className="text-sm font-bold text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100">+ Add Question</button>
              </div>
              {!selectedQuiz.questions || selectedQuiz.questions.length === 0 ? (
                <div className="text-center py-16 bg-gray-50 rounded-2xl">
                  <QuestionMarkCircleIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500">No questions added yet</p>
                  <button onClick={() => setShowQuestionModal(true)} className="mt-4 px-4 py-2 bg-blue-800 text-white rounded-lg">Add First Question</button>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedQuiz.questions.map((q, idx) => (
                    <div key={q.id || idx} className="bg-gray-50 rounded-2xl p-5 border hover:border-sky-200">
                      <div className="flex gap-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center font-bold">{idx+1}</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${q.question_type === 'multiple_choice' ? 'bg-sky-100 text-sky-800' : 'bg-indigo-100 text-indigo-800'}`}>
                              {q.question_type === 'multiple_choice' ? 'Multiple Choice' : 'Short Answer'}
                            </span>
                            <span className="text-xs text-gray-400 ml-auto">{q.marks || 1} mark(s)</span>
                          </div>
                          <p className="font-semibold mb-2">{q.question_text || 'Diagram question'}</p>
                          {q.question_image && <img src={q.question_image} alt="Diagram" className="max-h-32 rounded-lg mb-2" />}
                          {q.question_type === 'multiple_choice' && q.options && (
                            <div className="space-y-1 mt-2">
                              {q.options.map((opt, i) => (
                                <div key={i} className={`text-sm p-1 rounded ${i === q.correct_answer ? 'bg-emerald-50 text-emerald-700' : ''}`}>
                                  {String.fromCharCode(65+i)}. {opt}
                                </div>
                              ))}
                            </div>
                          )}
                          {q.question_type === 'short_answer' && (
                            <div className="text-sm text-purple-700 mt-2">Expected: {q.expected_answer}</div>
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

      {/* Create/Edit Quiz Modal */}
      {showQuizModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={(e) => e.target === e.currentTarget && setShowQuizModal(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white p-5 border-b flex justify-between">
              <h3 className="text-xl font-bold">{editingQuiz ? 'Edit Quiz' : 'Create Quiz'}</h3>
              <button onClick={() => setShowQuizModal(false)}><XMarkIcon className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold mb-2">Subject *</label>
                <select 
                  value={quizForm.subject_id} 
                  onChange={(e) => setQuizForm({...quizForm, subject_id: e.target.value})}
                  className="w-full p-2.5 border rounded-xl"
                >
                  <option value="">Select a subject</option>
                  {subjects.map(sub => (
                    <option key={sub.id} value={sub.id}>{sub.name}</option>
                  ))}
                </select>
                {subjects.length === 0 && <p className="text-xs text-red-500 mt-1">No subjects loaded. Please refresh.</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Title *</label>
                <input 
                  type="text" 
                  value={quizForm.title} 
                  onChange={(e) => setQuizForm({...quizForm, title: e.target.value})}
                  placeholder="e.g., African Geography Basics"
                  className="w-full p-2.5 border rounded-xl"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Description</label>
                <textarea 
                  rows="3" 
                  value={quizForm.description} 
                  onChange={(e) => setQuizForm({...quizForm, description: e.target.value})}
                  className="w-full p-2.5 border rounded-xl"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Target Form</label>
                <select 
                  value={quizForm.target_form} 
                  onChange={(e) => setQuizForm({...quizForm, target_form: e.target.value})}
                  className="w-full p-2.5 border rounded-xl"
                >
                  <option>All</option>
                  <option>Form 1</option>
                  <option>Form 2</option>
                  <option>Form 3</option>
                  <option>Form 4</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Duration (minutes)</label>
                <input 
                  type="number" 
                  value={quizForm.duration} 
                  onChange={(e) => setQuizForm({...quizForm, duration: parseInt(e.target.value) || 30})}
                  min="5" max="180"
                  className="w-full p-2.5 border rounded-xl"
                />
              </div>
              <div className="flex items-center gap-3">
                <input 
                  type="checkbox" 
                  checked={quizForm.is_active} 
                  onChange={(e) => setQuizForm({...quizForm, is_active: e.target.checked})}
                  className="w-5 h-5"
                />
                <label className="text-sm">Active (visible to learners)</label>
              </div>
              <button 
                onClick={editingQuiz ? handleUpdateQuiz : handleCreateQuiz} 
                disabled={submitting}
                className="w-full py-3 bg-blue-800 text-white rounded-xl font-bold hover:bg-blue-900 disabled:opacity-50"
              >
                {submitting ? 'Saving...' : (editingQuiz ? 'Update Quiz' : 'Create Quiz')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Question Modal */}
      {showQuestionModal && selectedQuiz && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={(e) => e.target === e.currentTarget && setShowQuestionModal(false)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white p-5 border-b flex justify-between">
              <h3 className="text-xl font-bold">Add Question to "{selectedQuiz.title}"</h3>
              <button onClick={() => setShowQuestionModal(false)}><XMarkIcon className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-5">
              <div><label>Question Text</label><textarea rows="3" value={questionForm.question_text} onChange={(e) => setQuestionForm({...questionForm, question_text: e.target.value})} className="w-full p-2.5 border rounded-xl" /></div>
              <ImageUploader label="Question Diagram" currentImage={questionForm.question_image} onImageUpload={(url) => setQuestionForm({...questionForm, question_image: url})} />
              <div><label>Type</label><select value={questionForm.question_type} onChange={(e) => setQuestionForm({...questionForm, question_type: e.target.value, options: e.target.value === 'multiple_choice' ? ['','','',''] : [], correct_answer: 0})} className="w-full p-2.5 border rounded-xl"><option>multiple_choice</option><option>short_answer</option></select></div>
              {questionForm.question_type === 'multiple_choice' ? (
                <>
                  {[0,1,2,3].map(i => (
                    <div key={i} className="border p-3 rounded-xl">
                      <div className="flex gap-2 mb-2">
                        <span className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">{String.fromCharCode(65+i)}</span>
                        <input type="text" value={questionForm.options[i]} onChange={(e) => { const newOpts = [...questionForm.options]; newOpts[i] = e.target.value; setQuestionForm({...questionForm, options: newOpts}); }} placeholder={`Option ${String.fromCharCode(65+i)}`} className="flex-1 border rounded-lg p-2" />
                        {i === questionForm.correct_answer && <span className="text-emerald-600">✓ Correct</span>}
                      </div>
                      <ImageUploader label="Option Image" currentImage={questionForm.option_images[i]} onImageUpload={(url) => { const newImgs = [...questionForm.option_images]; newImgs[i] = url; setQuestionForm({...questionForm, option_images: newImgs}); }} />
                    </div>
                  ))}
                  <div><label>Correct Answer</label><select value={questionForm.correct_answer} onChange={(e) => setQuestionForm({...questionForm, correct_answer: parseInt(e.target.value)})} className="w-full p-2.5 border rounded-xl">{questionForm.options.map((_,i) => <option key={i} value={i}>Option {String.fromCharCode(65+i)}</option>)}</select></div>
                </>
              ) : (
                <>
                  <div><label>Expected Answer</label><textarea rows="2" value={questionForm.expected_answer} onChange={(e) => setQuestionForm({...questionForm, expected_answer: e.target.value})} className="w-full p-2.5 border rounded-xl" /></div>
                  <ImageUploader label="Answer Reference Image" currentImage={questionForm.answer_image} onImageUpload={(url) => setQuestionForm({...questionForm, answer_image: url})} />
                </>
              )}
              <div><label>Explanation</label><textarea rows="2" value={questionForm.explanation} onChange={(e) => setQuestionForm({...questionForm, explanation: e.target.value})} className="w-full p-2.5 border rounded-xl" /></div>
              <div><label>Marks</label><input type="number" value={questionForm.marks} onChange={(e) => setQuestionForm({...questionForm, marks: parseInt(e.target.value) || 1})} min="1" className="w-full p-2.5 border rounded-xl" /></div>
              <button onClick={handleAddQuestion} disabled={submitting} className="w-full py-3 bg-blue-800 text-white rounded-xl font-bold">{submitting ? 'Adding...' : 'Add Question'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Grading Modal */}
      {gradingModal && selectedSubmission && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={(e) => e.target === e.currentTarget && setGradingModal(false)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white p-5 border-b flex justify-between">
              <h3 className="text-xl font-bold">Grade Submission</h3>
              <button onClick={() => setGradingModal(false)}><XMarkIcon className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-6">
              <p className="text-gray-500">Student: <span className="font-medium">{selectedSubmission.student_name}</span></p>
              {selectedSubmission.answers.map((ans, idx) => (
                <div key={idx} className="border-b pb-4 last:border-0">
                  <p className="font-medium">Q{idx+1}: {ans.question_text}</p>
                  <p className="text-gray-700 mt-1">Student answer: <span className="font-mono bg-gray-50 p-1 rounded">{ans.answer || '(no answer)'}</span></p>
                  <div className="mt-2 space-y-2">
                    <label className="block text-sm font-medium">Marks (out of {ans.max_marks})</label>
                    <input type="number" min="0" max={ans.max_marks} value={ans.given_marks ?? 0} onChange={(e) => { const newAnswers = [...selectedSubmission.answers]; newAnswers[idx].given_marks = parseInt(e.target.value) || 0; setSelectedSubmission({ ...selectedSubmission, answers: newAnswers }); }} className="p-2 border rounded w-24" />
                    <label className="block text-sm font-medium">Feedback</label>
                    <textarea value={ans.feedback || ''} onChange={(e) => { const newAnswers = [...selectedSubmission.answers]; newAnswers[idx].feedback = e.target.value; setSelectedSubmission({ ...selectedSubmission, answers: newAnswers }); }} rows="2" className="p-2 border rounded w-full" placeholder="Provide feedback..." />
                  </div>
                </div>
              ))}
              <div className="flex justify-end gap-3 pt-4">
                <button onClick={() => setGradingModal(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
                <button onClick={saveGrades} className="px-4 py-2 bg-blue-800 text-white rounded-lg hover:bg-blue-900">Save Grades</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizManagement;