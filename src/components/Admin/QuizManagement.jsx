import React, { useState, useEffect } from 'react';
import { 
  PlusIcon, PencilIcon, TrashIcon, EyeIcon, XMarkIcon, 
  DocumentTextIcon, ClockIcon, QuestionMarkCircleIcon, 
  TrophyIcon, ChevronRightIcon, ArchiveBoxIcon,
  CheckCircleIcon, UserGroupIcon, ClipboardDocumentListIcon,
  ArrowPathIcon, BookOpenIcon
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
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [paperPreviewMode, setPaperPreviewMode] = useState(false);
  
  // Grading states
  const [submissions, setSubmissions] = useState([]);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [gradingModal, setGradingModal] = useState(false);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [gradingQuizId, setGradingQuizId] = useState(null);
  
  // Quiz form (includes dynamic year & exam type)
  const [quizForm, setQuizForm] = useState({
    subject_id: '',
    title: '',
    description: '',
    duration: 30,
    total_marks: 100,
    section_a_marks: 75,
    section_b_marks: 25,
    is_active: true,
    target_form: 'All',
    exam_year: new Date().getFullYear(),
    exam_type: 'SCHOOL CERTIFICATE OF EDUCATION MOCK EXAMINATION'
  });
  
  // Question form (includes section)
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
    marks: 1,
    section: 'A'
  });

  // Load data
  useEffect(() => {
    loadQuizzes();
    loadSubjects();
  }, []);

  const loadSubjects = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.get('/api/admin/quiz-subjects', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setSubjects(response.data.subjects || []);
      } else {
        toast.error(response.data.message || 'Failed to load subjects');
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to load subjects');
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
      console.error(error);
      toast.error('Failed to load quizzes');
    } finally {
      setLoading(false);
    }
  };

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
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to load submissions');
    } finally {
      setLoadingSubmissions(false);
    }
  };

  // Quiz CRUD
  const handleCreateQuiz = async () => {
    if (!quizForm.subject_id || !quizForm.title.trim()) {
      toast.error('Please select a subject and enter a title');
      return;
    }
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const payload = {
        ...quizForm,
        duration: parseInt(quizForm.duration),
        total_marks: parseInt(quizForm.total_marks),
        section_a_marks: parseInt(quizForm.section_a_marks),
        section_b_marks: parseInt(quizForm.section_b_marks),
        exam_year: parseInt(quizForm.exam_year)
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
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to create quiz');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateQuiz = async () => {
    if (!editingQuiz || !quizForm.title.trim()) return;
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const payload = {
        ...quizForm,
        duration: parseInt(quizForm.duration),
        total_marks: parseInt(quizForm.total_marks),
        section_a_marks: parseInt(quizForm.section_a_marks),
        section_b_marks: parseInt(quizForm.section_b_marks),
        exam_year: parseInt(quizForm.exam_year)
      };
      const response = await api.put(`/api/admin/quizzes/${editingQuiz.id}`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        toast.success('Quiz updated successfully!');
        setShowQuizModal(false);
        setEditingQuiz(null);
        resetQuizForm();
        loadQuizzes();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteQuiz = async (quiz) => {
    if (!window.confirm(`Delete "${quiz.title}" permanently? This will also delete all questions and attempts.`)) return;
    try {
      const token = localStorage.getItem('token');
      const response = await api.delete(`/api/admin/quizzes/${quiz.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        toast.success('Quiz deleted');
        loadQuizzes();
        if (selectedQuiz?.id === quiz.id) setSelectedQuiz(null);
        if (gradingQuizId === quiz.int_id) {
          setGradingQuizId(null);
          setSubmissions([]);
        }
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message);
    }
  };

  // Question CRUD (with section support)
  const handleAddOrUpdateQuestion = async () => {
    if (!selectedQuiz) {
      toast.error('No quiz selected');
      return;
    }
    if (!questionForm.question_text && !questionForm.question_image) {
      toast.error('Please enter question text or upload a diagram');
      return;
    }
    if (questionForm.question_type === 'multiple_choice') {
      if (questionForm.options.some(opt => !opt.trim())) {
        toast.error('All options must be filled');
        return;
      }
    } else {
      if (!questionForm.expected_answer.trim() && !questionForm.answer_image) {
        toast.error('Please provide expected answer');
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
        explanation: questionForm.explanation?.trim() || null,
        section: questionForm.section
      };
      if (questionForm.question_type === 'multiple_choice') {
        payload.options = questionForm.options.map(opt => opt.trim());
        payload.option_images = questionForm.option_images;
        payload.correct_answer = questionForm.correct_answer;
      } else {
        payload.expected_answer = questionForm.expected_answer.trim();
        payload.answer_image = questionForm.answer_image || null;
      }
      
      let response;
      if (editingQuestion) {
        response = await api.put(`/api/admin/quizzes/${selectedQuiz.id}/questions/${editingQuestion.id}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        response = await api.post(`/api/admin/quizzes/${selectedQuiz.id}/questions`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      
      if (response.data.success) {
        toast.success(editingQuestion ? 'Question updated!' : 'Question added!');
        setShowQuestionModal(false);
        setEditingQuestion(null);
        resetQuestionForm();
        // Refresh questions for selected quiz
        const updatedQuiz = await api.get(`/api/admin/quizzes/${selectedQuiz.id}/questions`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSelectedQuiz({
          ...selectedQuiz,
          questions: updatedQuiz.data.questions || []
        });
        loadQuizzes();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to save question');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteQuestion = async (question) => {
    if (!window.confirm('Delete this question?')) return;
    try {
      const token = localStorage.getItem('token');
      const response = await api.delete(`/api/admin/quizzes/${selectedQuiz.id}/questions/${question.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        toast.success('Question deleted');
        // Refresh questions
        const updatedQuiz = await api.get(`/api/admin/quizzes/${selectedQuiz.id}/questions`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSelectedQuiz({
          ...selectedQuiz,
          questions: updatedQuiz.data.questions || []
        });
        loadQuizzes();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message);
    }
  };

  const openEditQuestion = (question) => {
    setEditingQuestion(question);
    setQuestionForm({
      question_text: question.question_text || '',
      question_image: question.question_image || '',
      question_type: question.question_type || 'multiple_choice',
      options: question.options || ['', '', '', ''],
      option_images: question.option_images || ['', '', '', ''],
      correct_answer: question.correct_answer || 0,
      expected_answer: question.expected_answer || '',
      answer_image: question.answer_image || '',
      explanation: question.explanation || '',
      marks: question.marks || 1,
      section: question.section || 'A'
    });
    setShowQuestionModal(true);
  };

  const resetQuizForm = () => {
    setQuizForm({
      subject_id: '',
      title: '',
      description: '',
      duration: 30,
      total_marks: 100,
      section_a_marks: 75,
      section_b_marks: 25,
      is_active: true,
      target_form: 'All',
      exam_year: new Date().getFullYear(),
      exam_type: 'SCHOOL CERTIFICATE OF EDUCATION MOCK EXAMINATION'
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
      marks: 1,
      section: 'A'
    });
    setEditingQuestion(null);
  };

  const openEditQuiz = (quiz) => {
    setEditingQuiz(quiz);
    setQuizForm({
      subject_id: quiz.subject_id || '',
      title: quiz.title || '',
      description: quiz.description || '',
      duration: quiz.duration || 30,
      total_marks: quiz.total_marks || 100,
      section_a_marks: quiz.section_a_marks || 75,
      section_b_marks: quiz.section_b_marks || 25,
      is_active: quiz.is_active !== false,
      target_form: quiz.target_form || 'All',
      exam_year: quiz.exam_year || new Date().getFullYear(),
      exam_type: quiz.exam_type || 'SCHOOL CERTIFICATE OF EDUCATION MOCK EXAMINATION'
    });
    setShowQuizModal(true);
  };

  const viewQuizDetails = async (quiz) => {
    if (!quiz?.id) return;
    try {
      const token = localStorage.getItem('token');
      const response = await api.get(`/api/admin/quizzes/${quiz.id}/questions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedQuiz({
        ...quiz,
        questions: response.data.questions || []
      });
      setPaperPreviewMode(false);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load quiz details');
    }
  };

  const handleGradingTab = () => {
    setActiveTab('grading');
    if (gradingQuizId) {
      loadSubmissions(gradingQuizId);
    } else if (selectedQuiz && selectedQuiz.int_id) {
      setGradingQuizId(selectedQuiz.int_id);
      loadSubmissions(selectedQuiz.int_id);
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
        toast.success('Grades saved!');
        setGradingModal(false);
        refreshSubmissions();
      } else {
        toast.error(response.data.message);
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message);
    }
  };

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

  // Render a question in paper preview with edit/delete controls
  const renderQuestionWithControls = (question, index, sectionLetter) => {
    return (
      <div key={question.id} className="exam-question mb-6 pb-4 border-b border-gray-300 last:border-0 relative group">
        <div className="flex justify-between items-start">
          <h4 className="font-bold text-lg text-gray-800">{index+1}. <span dangerouslySetInnerHTML={{ __html: question.question_text.replace(/\n/g, '<br/>') }} /></h4>
          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition">
            <button onClick={() => openEditQuestion(question)} className="p-1 text-gray-500 hover:text-blue-600">
              <PencilIcon className="w-4 h-4" />
            </button>
            <button onClick={() => handleDeleteQuestion(question)} className="p-1 text-gray-500 hover:text-red-600">
              <TrashIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="flex justify-between items-start mt-1">
          <span className="text-sm font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded">({question.marks || 1} marks)</span>
          <span className="text-xs text-gray-400">Section {sectionLetter}</span>
        </div>
        {question.question_image && (
          <div className="my-3 p-3 bg-gray-50 border border-gray-200 rounded-lg inline-block">
            <img src={question.question_image} alt="Question diagram" className="max-h-48 rounded shadow-sm" />
            <p className="text-xs text-gray-500 mt-1 text-center">Figure {index+1}</p>
          </div>
        )}
        <div className="answer-space mt-3 pl-2">
          <div className="bg-white border-l-4 border-blue-300 p-3 rounded-r-md">
            <p className="text-sm text-gray-500 mb-1 font-serif">Candidate's answer:</p>
            <div className="min-h-[70px] bg-gray-50 p-2 rounded border border-dashed border-gray-300 font-mono text-sm text-gray-400 italic">
              [Answer space]
            </div>
          </div>
        </div>
        {question.question_type === 'multiple_choice' && question.options && (
          <div className="mt-2 pl-4 text-sm">
            <p className="font-semibold text-gray-600">Options:</p>
            <div className="grid grid-cols-1 gap-1 mt-1">
              {question.options.map((opt, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="font-mono font-bold w-6">{String.fromCharCode(65+i)}.</span>
                  <span>{opt}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {question.question_type === 'short_answer' && (
          <div className="mt-2 text-xs text-gray-500 border-t pt-1 italic">
            Expected answer: {question.expected_answer}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-800 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto pb-12 space-y-8" style={{ fontFamily: "'Times New Roman', 'Georgia', serif" }}>
      {/* Header */}
      <div className="text-center border-b-2 border-gray-800 pb-4 mb-4">
        <h1 className="text-3xl font-bold uppercase tracking-wide">EXAMINATION PAPER MANAGEMENT</h1>
        <p className="text-sm text-gray-600 mt-2">Quiz Management System | Examiner Dashboard</p>
      </div>

      {/* Create Quiz Button */}
      <div className="flex justify-end">
        <button 
          onClick={() => { setEditingQuiz(null); resetQuizForm(); setShowQuizModal(true); }}
          className="inline-flex items-center gap-3 px-6 py-3 bg-blue-800 text-white rounded-lg font-bold shadow-md hover:bg-blue-900 transition"
        >
          <PlusIcon className="w-5 h-5" />
          <span>Create New Examination Paper</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[
          { label: 'Total Papers', value: stats.total, icon: DocumentTextIcon, color: 'text-blue-800' },
          { label: 'Active Assessments', value: stats.active, icon: CheckCircleIcon, color: 'text-sky-700' },
          { label: 'Total Questions', value: stats.questions, icon: QuestionMarkCircleIcon, color: 'text-indigo-700' },
        ].map((stat, i) => (
          <div key={i} className="bg-white border-2 border-blue-200 p-5 rounded-xl shadow-sm">
            <div className="flex items-center gap-4">
              <div className="bg-blue-50 p-3 rounded-full">
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">{stat.label}</p>
                <p className="text-3xl font-bold text-gray-800">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-2">
        <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
          {[
            { id: 'all', label: 'All Papers', icon: DocumentTextIcon },
            { id: 'active', label: 'Active', icon: CheckCircleIcon },
            { id: 'draft', label: 'Draft', icon: ArchiveBoxIcon },
            { id: 'grading', label: 'Marking', icon: UserGroupIcon }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                if (tab.id === 'grading') handleGradingTab();
                else setActiveTab(tab.id);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold capitalize transition ${
                activeTab === tab.id 
                  ? 'bg-white text-blue-800 shadow border border-blue-200' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grading View */}
      {activeTab === 'grading' ? (
        <div className="bg-white rounded-xl shadow p-6 border border-gray-200">
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Select Examination to Mark</label>
            <div className="flex gap-3">
              <select
                value={gradingQuizId || ''}
                onChange={(e) => handleSelectQuizForGrading(e.target.value)}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 font-serif"
              >
                <option value="">-- Choose a paper --</option>
                {quizzes.map(quiz => (
                  <option key={quiz.int_id} value={quiz.int_id}>
                    {quiz.title} ({quiz.subject_name || 'No subject'}) - {quiz.question_count || 0} questions
                  </option>
                ))}
              </select>
              {gradingQuizId && (
                <button onClick={refreshSubmissions} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 flex items-center gap-2">
                  <ArrowPathIcon className="w-4 h-4" /> Refresh
                </button>
              )}
            </div>
          </div>

          {!gradingQuizId ? (
            <div className="text-center py-12">
              <ClipboardDocumentListIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">Select a paper from the dropdown to view candidate submissions.</p>
            </div>
          ) : loadingSubmissions ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
            </div>
          ) : submissions.length === 0 ? (
            <div className="text-center py-12">
              <UserGroupIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No submissions yet for this examination.</p>
            </div>
          ) : (
            <div>
              <h3 className="text-xl font-bold mb-4">Candidate Scripts</h3>
              <div className="space-y-4">
                {submissions.map(sub => (
                  <div key={sub.id} className="border rounded-lg p-4 hover:shadow-md bg-gray-50">
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
                        className="px-4 py-2 bg-blue-800 text-white rounded-md text-sm hover:bg-blue-900"
                      >
                        Mark Script
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
          <div className="text-center py-20 border-2 border-dashed rounded-3xl bg-gray-50">
            <ArchiveBoxIcon className="w-20 h-20 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg">No examination papers found</p>
            <button onClick={() => setShowQuizModal(true)} className="mt-4 px-5 py-2 bg-blue-800 text-white rounded-lg">Create First Paper</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredQuizzes.map((quiz) => (
              <div 
                key={quiz.id} 
                className="group bg-white border border-gray-200 rounded-xl p-5 hover:border-blue-400 hover:shadow-lg cursor-pointer transition"
                onClick={() => viewQuizDetails(quiz)}
              >
                <div className={`absolute top-0 right-0 w-1.5 h-full ${quiz.is_active ? 'bg-blue-700' : 'bg-gray-400'} rounded-r-xl`} />
                <div className="flex justify-between items-start mb-3">
                  <div className="flex gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${getSubjectColor(quiz.subject_name)}`}>
                      {quiz.subject_name || 'No subject'}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${getTargetFormColor(quiz.target_form)}`}>
                      {quiz.target_form === 'All' ? 'All Forms' : quiz.target_form}
                    </span>
                    {!quiz.is_active && <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600">Draft</span>}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100" onClick={(e) => e.stopPropagation()}>
                    <button onClick={(e) => { e.stopPropagation(); openEditQuiz(quiz); }} className="p-2 text-gray-400 hover:text-blue-700 hover:bg-blue-50 rounded-lg">
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteQuiz(quiz); }} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-blue-800">{quiz.title}</h3>
                <p className="text-gray-500 text-sm line-clamp-2 mb-3">{quiz.description || 'No description'}</p>
                <div className="flex justify-between pt-3 border-t text-xs text-gray-500">
                  <span><QuestionMarkCircleIcon className="w-4 h-4 inline mr-1" />{quiz.question_count || 0} Questions</span>
                  <span><ClockIcon className="w-4 h-4 inline mr-1" />{quiz.duration} minutes</span>
                  <span><TrophyIcon className="w-4 h-4 inline mr-1" />{quiz.total_marks || 0} marks</span>
                </div>
                <button className="mt-3 text-sm font-bold text-blue-700 flex items-center gap-1">View Paper <ChevronRightIcon className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        )
      )}

      {/* Paper Preview Side Panel - with Section A & B, each with Add Question button */}
      {selectedQuiz && activeTab !== 'grading' && (
        <div className="fixed inset-y-0 right-0 w-full max-w-3xl bg-white shadow-2xl z-50 transform transition-transform duration-300 border-l border-gray-300 overflow-y-auto" style={{ fontFamily: "'Times New Roman', 'Georgia', serif" }}>
          <div className="sticky top-0 bg-white border-b border-gray-300 p-4 flex justify-between items-center z-10 shadow-sm">
            <div>
              <h2 className="text-xl font-bold">{selectedQuiz.title}</h2>
              <p className="text-sm text-gray-600">Mock Examination — {selectedQuiz.subject_name || 'General'} Paper</p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setPaperPreviewMode(!paperPreviewMode)} 
                className="px-3 py-1 bg-gray-100 rounded-md text-sm flex items-center gap-1"
              >
                {paperPreviewMode ? <EyeIcon className="w-4 h-4" /> : <BookOpenIcon className="w-4 h-4" />}
                {paperPreviewMode ? 'Admin View' : 'Paper Preview'}
              </button>
              <button onClick={() => setSelectedQuiz(null)} className="p-2 hover:bg-gray-200 rounded-full">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          <div className="p-6 bg-gray-50">
            {/* Exam Paper Header - Dynamic Year & Exam Type */}
            <div className="text-center border-b-2 border-gray-800 pb-4 mb-6">
              <p className="text-sm">
                {selectedQuiz.exam_year || new Date().getFullYear()} {selectedQuiz.exam_type || 'SCHOOL CERTIFICATE OF EDUCATION MOCK EXAMINATION'}
              </p>
              <h3 className="text-2xl font-bold mt-1">
                {selectedQuiz.subject_name?.toUpperCase() || 'GENERAL EXAMINATION'}
              </h3>
              <p className="text-sm">
                Subject Code: {selectedQuiz.subject_code || 'M073/II'} &nbsp;|&nbsp; 
                Time: {selectedQuiz.duration || 2} hours &nbsp;|&nbsp; 
                {selectedQuiz.title || 'Paper'}
              </p>
              <p className="text-xs text-gray-600 mt-2">
                Total marks: {selectedQuiz.total_marks || 100}
              </p>
            </div>
            
            {/* Instructions */}
            <div className="mb-6 p-3 bg-white border border-gray-300 rounded text-sm">
              <p className="font-bold">Instructions to candidates:</p>
              <ol className="list-decimal ml-5 mt-1 space-y-1">
                <li>This paper consists of <strong>{selectedQuiz.questions?.length || 0}</strong> questions.</li>
                <li>Answer ALL questions in Section A and ONE question from Section B.</li>
                <li>Write your examination number on every page.</li>
                <li>Marks for each part are indicated in brackets ( ).</li>
                <li>Use the spaces provided for answers.</li>
              </ol>
            </div>
            
            {/* Section A */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-lg font-bold bg-gray-200 px-3 py-1 inline-block">
                  SECTION A ({selectedQuiz.section_a_marks || 75} marks)
                </h4>
                <button 
                  onClick={() => { resetQuestionForm(); setQuestionForm(prev => ({ ...prev, section: 'A' })); setShowQuestionModal(true); }} 
                  className="px-3 py-1 bg-blue-800 text-white rounded-md text-sm flex items-center gap-1"
                >
                  <PlusIcon className="w-4 h-4" /> Add Question to Section A
                </button>
              </div>
              <p className="text-sm italic mt-1 mb-4">Answer all questions in this section.</p>
              <div className="space-y-6">
                {selectedQuiz.questions?.filter(q => q.section === 'A').map((q, idx) => renderQuestionWithControls(q, idx, 'A'))}
                {selectedQuiz.questions?.filter(q => q.section === 'A').length === 0 && (
                  <p className="text-gray-400 text-center py-4">No questions in Section A yet. Click "Add Question" above.</p>
                )}
              </div>
            </div>
            
            {/* Section B */}
            <div className="mt-8 pt-4 border-t">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-lg font-bold bg-gray-200 px-3 py-1 inline-block">
                  SECTION B ({selectedQuiz.section_b_marks || 25} marks)
                </h4>
                <button 
                  onClick={() => { resetQuestionForm(); setQuestionForm(prev => ({ ...prev, section: 'B' })); setShowQuestionModal(true); }} 
                  className="px-3 py-1 bg-blue-800 text-white rounded-md text-sm flex items-center gap-1"
                >
                  <PlusIcon className="w-4 h-4" /> Add Question to Section B
                </button>
              </div>
              <p className="text-sm italic mt-1 mb-4">Answer one question only from this section.</p>
              <div className="space-y-6">
                {selectedQuiz.questions?.filter(q => q.section === 'B').map((q, idx) => renderQuestionWithControls(q, idx, 'B'))}
                {selectedQuiz.questions?.filter(q => q.section === 'B').length === 0 && (
                  <p className="text-gray-400 text-center py-4">No questions in Section B yet. Click "Add Question" above.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Quiz Modal (includes exam_year & exam_type) */}
      {showQuizModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={(e) => e.target === e.currentTarget && setShowQuizModal(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white p-5 border-b flex justify-between">
              <h3 className="text-xl font-bold">{editingQuiz ? 'Edit Paper' : 'Create New Paper'}</h3>
              <button onClick={() => setShowQuizModal(false)}><XMarkIcon className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold mb-2">Subject *</label>
                <select 
                  value={quizForm.subject_id} 
                  onChange={(e) => setQuizForm({...quizForm, subject_id: e.target.value})}
                  className="w-full p-2.5 border rounded-md"
                >
                  <option value="">Select a subject</option>
                  {subjects.map(sub => (
                    <option key={sub.id} value={sub.id}>{sub.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Paper Title *</label>
                <input 
                  type="text" 
                  value={quizForm.title} 
                  onChange={(e) => setQuizForm({...quizForm, title: e.target.value})}
                  placeholder="e.g., 2026 Paper II Mock"
                  className="w-full p-2.5 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Description</label>
                <textarea 
                  rows="3" 
                  value={quizForm.description} 
                  onChange={(e) => setQuizForm({...quizForm, description: e.target.value})}
                  className="w-full p-2.5 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Target Form</label>
                <select 
                  value={quizForm.target_form} 
                  onChange={(e) => setQuizForm({...quizForm, target_form: e.target.value})}
                  className="w-full p-2.5 border rounded-md"
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
                  className="w-full p-2.5 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Total Marks (Paper)</label>
                <input 
                  type="number" 
                  value={quizForm.total_marks} 
                  onChange={(e) => setQuizForm({...quizForm, total_marks: parseInt(e.target.value) || 0})}
                  min="0" step="5"
                  className="w-full p-2.5 border rounded-md"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold mb-2">Section A Marks</label>
                  <input 
                    type="number" 
                    value={quizForm.section_a_marks} 
                    onChange={(e) => setQuizForm({...quizForm, section_a_marks: parseInt(e.target.value) || 0})}
                    min="0"
                    className="w-full p-2.5 border rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Section B Marks</label>
                  <input 
                    type="number" 
                    value={quizForm.section_b_marks} 
                    onChange={(e) => setQuizForm({...quizForm, section_b_marks: parseInt(e.target.value) || 0})}
                    min="0"
                    className="w-full p-2.5 border rounded-md"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Examination Year</label>
                <input 
                  type="number" 
                  value={quizForm.exam_year} 
                  onChange={(e) => setQuizForm({...quizForm, exam_year: parseInt(e.target.value) || new Date().getFullYear()})}
                  min="2000" max="2100"
                  className="w-full p-2.5 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Examination Type</label>
                <select
                  value={quizForm.exam_type}
                  onChange={(e) => setQuizForm({...quizForm, exam_type: e.target.value})}
                  className="w-full p-2.5 border rounded-md"
                >
                  <option value="SCHOOL CERTIFICATE OF EDUCATION MOCK EXAMINATION">School Certificate of Education Mock Examination</option>
                  <option value="JUNIOR CERTIFICATE OF EXAMINATION">Junior Certificate of Examination</option>
                  <option value="PRIMARY SCHOOL LEAVING EXAMINATION">Primary School Leaving Examination</option>
                </select>
              </div>
              <div className="flex items-center gap-3">
                <input 
                  type="checkbox" 
                  checked={quizForm.is_active} 
                  onChange={(e) => setQuizForm({...quizForm, is_active: e.target.checked})}
                  className="w-5 h-5"
                />
                <label className="text-sm">Active (visible to candidates)</label>
              </div>
              <button 
                onClick={editingQuiz ? handleUpdateQuiz : handleCreateQuiz} 
                disabled={submitting}
                className="w-full py-3 bg-blue-800 text-white rounded-md font-bold hover:bg-blue-900 disabled:opacity-50"
              >
                {submitting ? 'Saving...' : (editingQuiz ? 'Update Paper' : 'Create Paper')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Question Modal (includes section selector) */}
      {showQuestionModal && selectedQuiz && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={(e) => e.target === e.currentTarget && setShowQuestionModal(false)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white p-5 border-b flex justify-between">
              <h3 className="text-xl font-bold">{editingQuestion ? 'Edit Question' : 'Add Question'} to "{selectedQuiz.title}"</h3>
              <button onClick={() => { setShowQuestionModal(false); setEditingQuestion(null); resetQuestionForm(); }}><XMarkIcon className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold mb-2">Section</label>
                <select 
                  value={questionForm.section} 
                  onChange={(e) => setQuestionForm({...questionForm, section: e.target.value})}
                  className="w-full p-2.5 border rounded-md"
                >
                  <option value="A">Section A</option>
                  <option value="B">Section B</option>
                </select>
              </div>
              <div>
                <label>Question Text</label>
                <textarea rows="3" value={questionForm.question_text} onChange={(e) => setQuestionForm({...questionForm, question_text: e.target.value})} className="w-full p-2.5 border rounded-md" />
              </div>
              <ImageUploader label="Question Diagram / Figure" currentImage={questionForm.question_image} onImageUpload={(url) => setQuestionForm({...questionForm, question_image: url})} />
              <div>
                <label>Question Type</label>
                <select 
                  value={questionForm.question_type} 
                  onChange={(e) => setQuestionForm({...questionForm, question_type: e.target.value, options: e.target.value === 'multiple_choice' ? ['','','',''] : [], correct_answer: 0})}
                  className="w-full p-2.5 border rounded-md"
                >
                  <option>multiple_choice</option>
                  <option>short_answer</option>
                </select>
              </div>
              {questionForm.question_type === 'multiple_choice' ? (
                <>
                  {[0,1,2,3].map(i => (
                    <div key={i} className="border p-3 rounded-md">
                      <div className="flex gap-2 mb-2">
                        <span className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">{String.fromCharCode(65+i)}</span>
                        <input type="text" value={questionForm.options[i]} onChange={(e) => { const newOpts = [...questionForm.options]; newOpts[i] = e.target.value; setQuestionForm({...questionForm, options: newOpts}); }} placeholder={`Option ${String.fromCharCode(65+i)}`} className="flex-1 border rounded-md p-2" />
                        {i === questionForm.correct_answer && <span className="text-emerald-600">✓ Correct</span>}
                      </div>
                      <ImageUploader label="Option Image" currentImage={questionForm.option_images[i]} onImageUpload={(url) => { const newImgs = [...questionForm.option_images]; newImgs[i] = url; setQuestionForm({...questionForm, option_images: newImgs}); }} />
                    </div>
                  ))}
                  <div>
                    <label>Correct Answer</label>
                    <select value={questionForm.correct_answer} onChange={(e) => setQuestionForm({...questionForm, correct_answer: parseInt(e.target.value)})} className="w-full p-2.5 border rounded-md">
                      {questionForm.options.map((_,i) => <option key={i} value={i}>Option {String.fromCharCode(65+i)}</option>)}
                    </select>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label>Expected Answer (model answer)</label>
                    <textarea rows="2" value={questionForm.expected_answer} onChange={(e) => setQuestionForm({...questionForm, expected_answer: e.target.value})} className="w-full p-2.5 border rounded-md" />
                  </div>
                  <ImageUploader label="Answer Reference Image" currentImage={questionForm.answer_image} onImageUpload={(url) => setQuestionForm({...questionForm, answer_image: url})} />
                </>
              )}
              <div>
                <label>Explanation / Examiner Notes</label>
                <textarea rows="2" value={questionForm.explanation} onChange={(e) => setQuestionForm({...questionForm, explanation: e.target.value})} className="w-full p-2.5 border rounded-md" />
              </div>
              <div>
                <label>Marks Allocated</label>
                <input type="number" value={questionForm.marks} onChange={(e) => setQuestionForm({...questionForm, marks: parseInt(e.target.value) || 1})} min="1" className="w-full p-2.5 border rounded-md" />
              </div>
              <button onClick={handleAddOrUpdateQuestion} disabled={submitting} className="w-full py-3 bg-blue-800 text-white rounded-md font-bold">
                {submitting ? 'Saving...' : (editingQuestion ? 'Update Question' : 'Add Question')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grading Modal */}
      {gradingModal && selectedSubmission && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={(e) => e.target === e.currentTarget && setGradingModal(false)}>
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" style={{ fontFamily: "'Times New Roman', serif" }}>
            <div className="sticky top-0 bg-white p-5 border-b flex justify-between">
              <h3 className="text-xl font-bold">Mark Candidate Script</h3>
              <button onClick={() => setGradingModal(false)}><XMarkIcon className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-6">
              <div className="border-b pb-2">
                <p className="text-gray-600">Candidate: <span className="font-bold">{selectedSubmission.student_name}</span></p>
                <p className="text-gray-500 text-sm">Submitted: {new Date(selectedSubmission.submitted_at).toLocaleString()}</p>
              </div>
              {selectedSubmission.answers.map((ans, idx) => (
                <div key={idx} className="border-b pb-5 last:border-0">
                  <p className="font-bold text-lg">{idx+1}. {ans.question_text}</p>
                  <div className="mt-2 p-3 bg-gray-50 rounded border-l-4 border-blue-300">
                    <p className="text-sm font-semibold text-gray-700">Candidate's answer:</p>
                    <p className="font-mono whitespace-pre-wrap bg-white p-2 rounded border mt-1">{ans.answer || '(No answer provided)'}</p>
                  </div>
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-semibold">Awarded Marks (out of {ans.max_marks})</label>
                      <input 
                        type="number" 
                        min="0" 
                        max={ans.max_marks} 
                        value={ans.given_marks ?? 0} 
                        onChange={(e) => { 
                          const newAnswers = [...selectedSubmission.answers]; 
                          newAnswers[idx].given_marks = parseInt(e.target.value) || 0; 
                          setSelectedSubmission({ ...selectedSubmission, answers: newAnswers }); 
                        }} 
                        className="p-2 border rounded w-32 mt-1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold">Feedback / Examiner Comment</label>
                      <textarea 
                        value={ans.feedback || ''} 
                        onChange={(e) => { 
                          const newAnswers = [...selectedSubmission.answers]; 
                          newAnswers[idx].feedback = e.target.value; 
                          setSelectedSubmission({ ...selectedSubmission, answers: newAnswers }); 
                        }} 
                        rows="2" 
                        className="p-2 border rounded w-full mt-1" 
                        placeholder="Write feedback for the candidate..."
                      />
                    </div>
                  </div>
                </div>
              ))}
              <div className="flex justify-end gap-3 pt-4">
                <button onClick={() => setGradingModal(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
                <button onClick={saveGrades} className="px-4 py-2 bg-blue-800 text-white rounded-lg hover:bg-blue-900">Submit Marks</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizManagement;