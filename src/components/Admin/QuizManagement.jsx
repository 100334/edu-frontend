import React, { useState, useEffect } from 'react';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  EyeIcon,
  XMarkIcon,
  DocumentTextIcon,
  ClockIcon,
  QuestionMarkCircleIcon,
  TrophyIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import api from '../../services/api';

const QuizManagement = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [editingQuiz, setEditingQuiz] = useState(null);
  const [expandedQuiz, setExpandedQuiz] = useState(null);
  
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

  const loadSubjects = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.get('/api/admin/quiz-subjects', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSubjects(response.data.subjects || []);
    } catch (error) {
      console.error('Error loading subjects:', error);
      toast.error('Failed to load subjects');
    }
  };

  const loadQuizzes = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await api.get('/api/admin/quizzes', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setQuizzes(response.data.quizzes || []);
    } catch (error) {
      console.error('Error loading quizzes:', error);
      toast.error('Failed to load quizzes');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateQuiz = async () => {
    if (!quizForm.subject_id || !quizForm.title) {
      toast.error('Please select a subject and enter a title');
      return;
    }

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
      }
    } catch (error) {
      console.error('Error creating quiz:', error);
      toast.error(error.response?.data?.message || 'Failed to create quiz');
    }
  };

  const handleUpdateQuiz = async () => {
    if (!editingQuiz || !quizForm.title) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await api.put(`/api/admin/quizzes/${editingQuiz.id}`, quizForm, {
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
      }
    } catch (error) {
      console.error('Error updating quiz:', error);
      toast.error(error.response?.data?.message || 'Failed to update quiz');
    }
  };

  const handleDeleteQuiz = async (quiz) => {
    if (!window.confirm(`Are you sure you want to delete "${quiz.title}"? This will also delete all questions and attempts.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await api.delete(`/api/admin/quizzes/${quiz.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        toast.success('Quiz deleted successfully!');
        loadQuizzes();
      }
    } catch (error) {
      console.error('Error deleting quiz:', error);
      toast.error(error.response?.data?.message || 'Failed to delete quiz');
    }
  };

  const handleAddQuestion = async () => {
    if (!selectedQuiz) return;
    
    if (!questionForm.question_text || questionForm.options.some(opt => !opt.trim())) {
      toast.error('Please fill in question text and all options');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await api.post(`/api/admin/quizzes/${selectedQuiz.id}/questions`, {
        question_text: questionForm.question_text,
        options: questionForm.options,
        correct_answer: questionForm.correct_answer,
        explanation: questionForm.explanation,
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
        loadQuizzes();
        // Refresh expanded quiz details
        if (expandedQuiz === selectedQuiz.id) {
          setExpandedQuiz(null);
          setTimeout(() => setExpandedQuiz(selectedQuiz.id), 100);
        }
      }
    } catch (error) {
      console.error('Error adding question:', error);
      toast.error(error.response?.data?.message || 'Failed to add question');
    }
  };

  const openEditQuiz = (quiz) => {
    setEditingQuiz(quiz);
    setQuizForm({
      subject_id: quiz.subject_id || '',
      title: quiz.title,
      description: quiz.description || '',
      duration: quiz.duration,
      is_active: quiz.is_active
    });
    setShowQuizModal(true);
  };

  const viewQuizDetails = async (quiz) => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.get(`/api/quiz/${quiz.id}/questions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSelectedQuiz({
        ...quiz,
        questions: response.data.questions || []
      });
      setExpandedQuiz(expandedQuiz === quiz.id ? null : quiz.id);
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

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Quiz Management</h2>
          <p className="text-sm text-gray-500 mt-1">Create and manage quizzes for learners</p>
        </div>
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
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
        >
          <PlusIcon className="w-5 h-5" />
          Create Quiz
        </button>
      </div>

      {/* Quizzes Grid */}
      {quizzes.length === 0 ? (
        <div className="bg-gray-50 rounded-xl p-12 text-center">
          <DocumentTextIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-700 mb-2">No Quizzes Yet</h3>
          <p className="text-gray-500">Create your first quiz to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {quizzes.map((quiz) => (
            <div key={quiz.id} className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition">
              {/* Quiz Header */}
              <div className="p-5 border-b border-gray-100">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSubjectColor(quiz.subject_name)}`}>
                        {quiz.subject_name || 'Unknown Subject'}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        quiz.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {quiz.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 mb-1">{quiz.title}</h3>
                    <p className="text-sm text-gray-500">{quiz.description || 'No description'}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditQuiz(quiz)}
                      className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition"
                      title="Edit Quiz"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteQuiz(quiz)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                      title="Delete Quiz"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => viewQuizDetails(quiz)}
                      className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-lg transition"
                      title="View Details"
                    >
                      <EyeIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                {/* Quiz Stats */}
                <div className="flex gap-4 mt-4 pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <QuestionMarkCircleIcon className="w-4 h-4" />
                    <span>{quiz.question_count || 0} Questions</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <ClockIcon className="w-4 h-4" />
                    <span>{quiz.duration} min</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <TrophyIcon className="w-4 h-4" />
                    <span>{quiz.total_marks || 0} Marks</span>
                  </div>
                </div>
              </div>

              {/* Expanded Questions Section */}
              {expandedQuiz === quiz.id && selectedQuiz && (
                <div className="p-5 bg-gray-50">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-semibold text-gray-800">Questions</h4>
                    <button
                      onClick={() => {
                        setSelectedQuiz(quiz);
                        setShowQuestionModal(true);
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition"
                    >
                      <PlusIcon className="w-4 h-4" />
                      Add Question
                    </button>
                  </div>
                  
                  {selectedQuiz.questions?.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No questions added yet</p>
                  ) : (
                    <div className="space-y-3">
                      {selectedQuiz.questions?.map((q, idx) => (
                        <div key={q.id} className="bg-white rounded-lg p-4 border border-gray-200">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="font-medium text-gray-800 mb-2">
                                {idx + 1}. {q.question_text}
                              </p>
                              <div className="grid grid-cols-2 gap-2 mb-3">
                                {q.options.map((opt, optIdx) => (
                                  <div key={optIdx} className="flex items-center gap-2">
                                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                                      optIdx === q.correct_answer 
                                        ? 'bg-green-500 text-white' 
                                        : 'bg-gray-100 text-gray-600'
                                    }`}>
                                      {String.fromCharCode(65 + optIdx)}
                                    </span>
                                    <span className={`text-sm ${
                                      optIdx === q.correct_answer ? 'text-green-700 font-medium' : 'text-gray-600'
                                    }`}>
                                      {opt}
                                    </span>
                                  </div>
                                ))}
                              </div>
                              {q.explanation && (
                                <p className="text-xs text-gray-500 mt-2 pt-2 border-t border-gray-100">
                                  <span className="font-medium">Explanation:</span> {q.explanation}
                                </p>
                              )}
                            </div>
                            <div className="flex gap-1">
                              <span className="px-2 py-1 bg-gray-100 rounded text-xs">{q.marks} mark{q.marks !== 1 ? 's' : ''}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Quiz Modal */}
      {showQuizModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
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
                  onChange={(e) => setQuizForm({ ...quizForm, duration: parseInt(e.target.value) })}
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
                className="w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
              >
                {editingQuiz ? 'Update Quiz' : 'Create Quiz'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Question Modal */}
      {showQuestionModal && selectedQuiz && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-800">Add Question to "{selectedQuiz.title}"</h3>
              <button
                onClick={() => {
                  setShowQuestionModal(false);
                  setSelectedQuestion(null);
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
                  onChange={(e) => setQuestionForm({ ...questionForm, marks: parseInt(e.target.value) })}
                  min="1"
                  max="10"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <button
                onClick={handleAddQuestion}
                className="w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
              >
                Add Question
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizManagement;