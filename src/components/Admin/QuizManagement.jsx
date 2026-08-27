import React, { useState, useEffect } from 'react';
import {
  PlusIcon, PencilIcon, TrashIcon, EyeIcon, XMarkIcon,
  DocumentTextIcon, ClockIcon, QuestionMarkCircleIcon,
  TrophyIcon, ChevronRightIcon, ArchiveBoxIcon,
  CheckCircleIcon, UserGroupIcon, ClipboardDocumentListIcon,
  ArrowPathIcon, BookOpenIcon, ChartBarIcon,
  AcademicCapIcon, CalendarIcon,
  AdjustmentsHorizontalIcon, GlobeAltIcon, FolderIcon,
  DocumentArrowDownIcon, PhotoIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import api from '../../services/api';
import ImageUploader from '../common/ImageUploader';

// ── shared input style ────────────────────────────────────────────────────────
const inp = 'w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#00B4D8] focus:border-[#00B4D8] transition';

const TABS = [
  { id: 'all',            label: 'All Papers',      Icon: DocumentTextIcon         },
  { id: 'active',         label: 'Active',          Icon: CheckCircleIcon          },
  { id: 'draft',          label: 'Draft',           Icon: ArchiveBoxIcon           },
  { id: 'grading',        label: 'Marking',         Icon: UserGroupIcon            },
  { id: 'allSubmissions', label: 'Submissions',     Icon: ClipboardDocumentListIcon},
];

const QuizManagement = () => {
  const [quizzes,        setQuizzes]        = useState([]);
  const [subjects,       setSubjects]       = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [activeTab,      setActiveTab]      = useState('all');
  const [selectedQuiz,   setSelectedQuiz]   = useState(null);
  const [showQuizModal,  setShowQuizModal]  = useState(false);
  const [showQModal,     setShowQModal]     = useState(false);
  const [editingQuiz,    setEditingQuiz]    = useState(null);
  const [editingQ,       setEditingQ]       = useState(null);
  const [submitting,     setSubmitting]     = useState(false);
  const [confirmDelete,  setConfirmDelete]  = useState(null); // { type:'quiz'|'submission'|'question', item }

  const [submissions,         setSubmissions]         = useState([]);
  const [selectedSub,         setSelectedSub]         = useState(null);
  const [gradingModal,        setGradingModal]        = useState(false);
  const [loadingSubs,         setLoadingSubs]         = useState(false);
  const [gradingQuizId,       setGradingQuizId]       = useState(null);
  const [allSubmissions,      setAllSubmissions]      = useState([]);
  const [loadingAllSubs,      setLoadingAllSubs]      = useState(false);
  const [subFilters,          setSubFilters]          = useState({ quiz_id: '', status: '' });
  const [filterQuizzes,       setFilterQuizzes]       = useState([]);
  const [expandedSubjects,    setExpandedSubjects]    = useState({});

  const [quizForm, setQuizForm] = useState({
    subject_id: '', title: '', description: '', duration: 30,
    total_marks: 100, section_a_marks: 75, section_b_marks: 25,
    is_active: true, target_form: 'All',
    exam_year: new Date().getFullYear(),
    exam_type: 'SCHOOL CERTIFICATE OF EDUCATION MOCK EXAMINATION',
    scheduled_start: '', scheduled_end: '',
  });

  const [qForm, setQForm] = useState({
    question_text: '', question_image: '', question_type: 'multiple_choice',
    options: ['', '', '', ''], option_images: ['', '', '', ''],
    correct_answer: 0, expected_answer: '', answer_image: '',
    explanation: '', marks: 1, section: 'A',
  });

  useEffect(() => { loadQuizzes(); loadSubjects(); }, []);
  useEffect(() => {
    if (activeTab === 'allSubmissions') { loadAllSubmissions(); loadFilterQuizzes(); }
  }, [activeTab, subFilters]);

  // ── loaders ─────────────────────────────────────────────────────────────────
  const loadSubjects = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await api.get('/api/admin/quiz-subjects', { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.success) setSubjects(res.data.subjects || []);
    } catch { toast.error('Failed to load subjects'); }
  };

  const loadQuizzes = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await api.get('/api/admin/quizzes', { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.success) setQuizzes(res.data.quizzes || []);
      else toast.error(res.data.message || 'Failed');
    } catch { toast.error('Failed to load quizzes'); }
    finally { setLoading(false); }
  };

  const loadSubmissions = async (quizId) => {
    if (!quizId) return;
    setLoadingSubs(true);
    try {
      const token = localStorage.getItem('token');
      const res = await api.get(`/api/admin/quizzes/${quizId}/submissions`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.success) {
        const formatted = (res.data.submissions || []).map(sub => ({
          id: sub.id, student_name: sub.student_name, submitted_at: sub.submitted_at,
          total_marks: sub.total_marks, earned_marks: sub.earned_marks, quiz_id: sub.quiz_id,
          answers: (sub.answers || []).map(a => ({
            question_id: a.question_id, question_text: a.question_text,
            question_type: a.question_type,
            answer: a.selected_answer_text || a.answer || a.answer_text || a.short_answer || '',
            max_marks: a.max_marks, given_marks: a.given_marks ?? null, feedback: a.feedback || '',
          })),
        }));
        setSubmissions(formatted);
      } else toast.error(res.data.message || 'Failed');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to load submissions'); }
    finally { setLoadingSubs(false); }
  };

  const loadAllSubmissions = async () => {
    setLoadingAllSubs(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (subFilters.quiz_id) params.append('quiz_id', subFilters.quiz_id);
      if (subFilters.status)  params.append('status', subFilters.status);
      const res = await api.get(`/api/admin/all-submissions${params.toString() ? '?' + params : ''}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.success) setAllSubmissions(res.data.submissions || []);
      else toast.error(res.data.message);
    } catch { toast.error('Failed to load submissions'); }
    finally { setLoadingAllSubs(false); }
  };

  const loadFilterQuizzes = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await api.get('/api/admin/quizzes', { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.success) setFilterQuizzes(res.data.quizzes || []);
    } catch { /* silent */ }
  };

  // ── quiz CRUD ────────────────────────────────────────────────────────────────
  const parseQuizPayload = (form) => ({
    ...form,
    duration:        parseInt(form.duration),
    total_marks:     parseInt(form.total_marks),
    section_a_marks: parseInt(form.section_a_marks),
    section_b_marks: parseInt(form.section_b_marks),
    exam_year:       parseInt(form.exam_year),
    scheduled_start: form.scheduled_start ? new Date(form.scheduled_start).toISOString() : null,
    scheduled_end:   form.scheduled_end   ? new Date(form.scheduled_end).toISOString()   : null,
  });

  const handleCreateQuiz = async () => {
    if (!quizForm.subject_id || !quizForm.title.trim()) { toast.error('Subject and title are required'); return; }
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await api.post('/api/admin/quizzes', parseQuizPayload(quizForm), { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.success) { toast.success('Quiz created'); setShowQuizModal(false); resetQuizForm(); loadQuizzes(); }
      else toast.error(res.data.message);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSubmitting(false); }
  };

  const handleUpdateQuiz = async () => {
    if (!editingQuiz || !quizForm.title.trim()) return;
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await api.put(`/api/admin/quizzes/${editingQuiz.id}`, parseQuizPayload(quizForm), { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.success) { toast.success('Quiz updated'); setShowQuizModal(false); setEditingQuiz(null); resetQuizForm(); loadQuizzes(); }
      else toast.error(res.data.message);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSubmitting(false); }
  };

  const handleDeleteQuiz = async (quiz) => {
    try {
      const token = localStorage.getItem('token');
      const res = await api.delete(`/api/admin/quizzes/${quiz.id}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.success) {
        toast.success('Quiz deleted'); loadQuizzes();
        if (selectedQuiz?.id === quiz.id) setSelectedQuiz(null);
        if (gradingQuizId === quiz.id) { setGradingQuizId(null); setSubmissions([]); }
      } else toast.error(res.data.message);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setConfirmDelete(null); }
  };

  const handleDeleteSubmission = async (sub) => {
    try {
      const token = localStorage.getItem('token');
      await api.delete(`/api/admin/attempts/${sub.id}/reset`, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Submission deleted');
      if (activeTab === 'grading') loadSubmissions(gradingQuizId);
      else loadAllSubmissions();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setConfirmDelete(null); }
  };

  // ── question CRUD ────────────────────────────────────────────────────────────
  const handleAddOrUpdateQuestion = async () => {
    if (!selectedQuiz) { toast.error('No quiz selected'); return; }
    if (!qForm.question_text && !qForm.question_image) { toast.error('Enter question text or upload a diagram'); return; }
    if (qForm.question_type === 'multiple_choice' && qForm.options.some(o => !o.trim())) { toast.error('All options must be filled'); return; }
    if (qForm.question_type !== 'multiple_choice' && !qForm.expected_answer.trim() && !qForm.answer_image) { toast.error('Provide expected answer'); return; }
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const payload = {
        question_text:  qForm.question_text.trim() || null,
        question_image: qForm.question_image || null,
        question_type:  qForm.question_type,
        marks:          qForm.marks,
        explanation:    qForm.explanation?.trim() || null,
        section:        qForm.section,
        ...(qForm.question_type === 'multiple_choice'
          ? { options: qForm.options.map(o => o.trim()), option_images: qForm.option_images, correct_answer: qForm.correct_answer }
          : { expected_answer: qForm.expected_answer.trim(), answer_image: qForm.answer_image || null }),
      };
      const res = editingQ
        ? await api.put(`/api/admin/quizzes/${selectedQuiz.id}/questions/${editingQ.id}`, payload, { headers: { Authorization: `Bearer ${token}` } })
        : await api.post(`/api/admin/quizzes/${selectedQuiz.id}/questions`, payload, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.success) {
        toast.success(editingQ ? 'Question updated' : 'Question added');
        setShowQModal(false); setEditingQ(null); resetQForm();
        const updated = await api.get(`/api/admin/quizzes/${selectedQuiz.id}/questions`, { headers: { Authorization: `Bearer ${token}` } });
        setSelectedQuiz({ ...selectedQuiz, questions: updated.data.questions || [] });
        loadQuizzes();
      } else toast.error(res.data.message);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSubmitting(false); }
  };

  const handleDeleteQuestion = async (question) => {
    try {
      const token = localStorage.getItem('token');
      const res = await api.delete(`/api/admin/quizzes/${selectedQuiz.id}/questions/${question.id}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.success) {
        toast.success('Question deleted');
        const updated = await api.get(`/api/admin/quizzes/${selectedQuiz.id}/questions`, { headers: { Authorization: `Bearer ${token}` } });
        setSelectedQuiz({ ...selectedQuiz, questions: updated.data.questions || [] });
        loadQuizzes();
      } else toast.error(res.data.message);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setConfirmDelete(null); }
  };

  // ── grading ──────────────────────────────────────────────────────────────────
  const saveGrades = async () => {
    if (!selectedSub) return;
    const quizId = selectedSub.quiz_id || gradingQuizId;
    if (!quizId) { toast.error('Missing quiz ID'); return; }
    try {
      const token = localStorage.getItem('token');
      const res = await api.post('/api/admin/grade', {
        attempt_id: selectedSub.id, quiz_id: quizId,
        answers: selectedSub.answers.map(a => ({ question_id: a.question_id, marks_awarded: a.given_marks, feedback: a.feedback || null })),
      }, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.success) { toast.success('Grades saved!'); setGradingModal(false); loadSubmissions(gradingQuizId); }
      else toast.error(res.data.message);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleResetAttempt = async () => {
    if (!selectedSub) return;
    try {
      const token = localStorage.getItem('token');
      const res = await api.delete(`/api/admin/attempts/${selectedSub.id}/reset`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.success) { toast.success('Attempt reset. Learner can retake.'); setGradingModal(false); loadSubmissions(gradingQuizId); }
      else toast.error(res.data.message);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  // ── helpers ──────────────────────────────────────────────────────────────────
  const resetQuizForm = () => setQuizForm({
    subject_id: '', title: '', description: '', duration: 30,
    total_marks: 100, section_a_marks: 75, section_b_marks: 25,
    is_active: true, target_form: 'All',
    exam_year: new Date().getFullYear(),
    exam_type: 'SCHOOL CERTIFICATE OF EDUCATION MOCK EXAMINATION',
    scheduled_start: '', scheduled_end: '',
  });

  const resetQForm = () => setQForm({
    question_text: '', question_image: '', question_type: 'multiple_choice',
    options: ['', '', '', ''], option_images: ['', '', '', ''],
    correct_answer: 0, expected_answer: '', answer_image: '',
    explanation: '', marks: 1, section: 'A',
  });

  const openEditQuiz = (quiz) => {
    setEditingQuiz(quiz);
    setQuizForm({
      subject_id:      quiz.subject_id      || '',
      title:           quiz.title           || '',
      description:     quiz.description     || '',
      duration:        quiz.duration        || 30,
      total_marks:     quiz.total_marks     || 100,
      section_a_marks: quiz.section_a_marks || 75,
      section_b_marks: quiz.section_b_marks || 25,
      is_active:       quiz.is_active !== false,
      target_form:     quiz.target_form     || 'All',
      exam_year:       quiz.exam_year       || new Date().getFullYear(),
      exam_type:       quiz.exam_type       || 'SCHOOL CERTIFICATE OF EDUCATION MOCK EXAMINATION',
      scheduled_start: quiz.scheduled_start ? new Date(quiz.scheduled_start).toISOString().slice(0, 16) : '',
      scheduled_end:   quiz.scheduled_end   ? new Date(quiz.scheduled_end).toISOString().slice(0, 16)   : '',
    });
    setShowQuizModal(true);
  };

  const openEditQuestion = (q) => {
    setEditingQ(q);
    setQForm({
      question_text:  q.question_text  || '',
      question_image: q.question_image || '',
      question_type:  q.question_type  || 'multiple_choice',
      options:        q.options        || ['', '', '', ''],
      option_images:  q.option_images  || ['', '', '', ''],
      correct_answer: q.correct_answer || 0,
      expected_answer: q.expected_answer || '',
      answer_image:   q.answer_image   || '',
      explanation:    q.explanation    || '',
      marks:          q.marks          || 1,
      section:        q.section        || 'A',
    });
    setShowQModal(true);
  };

  const viewQuizDetails = async (quiz) => {
    if (!quiz?.id) return;
    try {
      const token = localStorage.getItem('token');
      const res = await api.get(`/api/admin/quizzes/${quiz.id}/questions`, { headers: { Authorization: `Bearer ${token}` } });
      setSelectedQuiz({ ...quiz, questions: res.data.questions || [] });
    } catch { toast.error('Failed to load quiz details'); }
  };

  const handleGradingTab = () => {
    setActiveTab('grading');
    if (gradingQuizId) loadSubmissions(gradingQuizId);
    else if (selectedQuiz?.id) { setGradingQuizId(selectedQuiz.id); loadSubmissions(selectedQuiz.id); }
  };

  const filteredQuizzes = quizzes.filter(q => {
    if (activeTab === 'active') return q.is_active;
    if (activeTab === 'draft')  return !q.is_active;
    return true;
  });

  const stats = {
    total:     quizzes.length,
    active:    quizzes.filter(q => q.is_active).length,
    questions: quizzes.reduce((a, q) => a + (q.question_count || 0), 0),
  };

  // ── confirm delete dispatcher ────────────────────────────────────────────────
  const executeConfirmedDelete = () => {
    if (!confirmDelete) return;
    if (confirmDelete.type === 'quiz')       handleDeleteQuiz(confirmDelete.item);
    if (confirmDelete.type === 'submission') handleDeleteSubmission(confirmDelete.item);
    if (confirmDelete.type === 'question')   handleDeleteQuestion(confirmDelete.item);
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="w-8 h-8 border-4 border-[#006770] border-t-transparent rounded-full animate-spin" />
      <p className="mt-3 text-xs text-gray-400 font-semibold uppercase tracking-wider">Loading…</p>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">

      {/* Stat strip */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Papers',   value: stats.total,     Icon: DocumentTextIcon,       bg: 'bg-[#003B46]' },
          { label: 'Active',         value: stats.active,    Icon: CheckCircleIcon,         bg: 'bg-[#006770]' },
          { label: 'Questions',      value: stats.questions, Icon: QuestionMarkCircleIcon,  bg: 'bg-[#00B4D8]' },
        ].map(({ label, value, Icon, bg }) => (
          <div key={label} className={`${bg} text-white rounded-xl px-4 py-3 flex items-center gap-3`}>
            <Icon className="w-5 h-5 opacity-70 flex-shrink-0" />
            <div>
              <p className="text-xl font-black leading-none">{value}</p>
              <p className="text-[10px] opacity-70 uppercase tracking-wide mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs + Add button */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1 bg-gray-100 p-1 rounded-xl">
          {TABS.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => { if (id === 'grading') handleGradingTab(); else setActiveTab(id); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === id
                  ? 'bg-[#006770] text-white shadow-sm'
                  : 'text-gray-500 hover:text-[#006770]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" /> {label}
            </button>
          ))}
        </div>
        <button
          onClick={() => { setEditingQuiz(null); resetQuizForm(); setShowQuizModal(true); }}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#006770] text-white rounded-lg text-sm font-medium hover:bg-[#005a62] transition"
        >
          <PlusIcon className="w-4 h-4" /> New Quiz
        </button>
      </div>

      {/* ── GRADING TAB ─────────────────────────────────────────────────────── */}
      {activeTab === 'grading' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Examination Paper</label>
              <select
                value={gradingQuizId || ''}
                onChange={e => { setGradingQuizId(e.target.value); loadSubmissions(e.target.value); }}
                className={`${inp} sm:w-80`}
              >
                <option value="">Select a paper to mark…</option>
                {quizzes.map(q => (
                  <option key={q.id} value={q.id}>{q.title} ({q.subject_name || '—'}) · {q.question_count || 0} Qs</option>
                ))}
              </select>
            </div>
            {gradingQuizId && (
              <button onClick={() => loadSubmissions(gradingQuizId)}
                className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-sm transition mt-auto">
                <ArrowPathIcon className="w-4 h-4" /> Refresh
              </button>
            )}
          </div>
          <div className="p-5">
            {!gradingQuizId ? (
              <div className="text-center py-10">
                <ClipboardDocumentListIcon className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">Select a paper above to view submissions.</p>
              </div>
            ) : loadingSubs ? (
              <div className="flex justify-center py-10">
                <div className="w-7 h-7 border-4 border-[#006770] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : submissions.length === 0 ? (
              <div className="text-center py-10 bg-gray-50 rounded-xl border border-gray-200">
                <UserGroupIcon className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">No submissions yet for this paper.</p>
              </div>
            ) : (
              <>
                <p className="text-xs text-gray-400 mb-3">{submissions.length} submission{submissions.length !== 1 ? 's' : ''}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {submissions.map(sub => (
                    <div key={sub.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition">
                      <div className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="text-sm font-bold text-[#003B46]">{sub.student_name}</p>
                            <p className="text-[10px] text-gray-400 mt-0.5">{new Date(sub.submitted_at).toLocaleString()}</p>
                          </div>
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full">Pending</span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                          <span className="flex items-center gap-1"><DocumentTextIcon className="w-3.5 h-3.5" /> {sub.answers?.length || 0} answers</span>
                          <span className="flex items-center gap-1"><TrophyIcon className="w-3.5 h-3.5" /> {sub.earned_marks ?? 0}/{sub.total_marks}</span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => { setSelectedSub(sub); setGradingModal(true); }}
                            className="flex-1 py-1.5 bg-[#006770] text-white rounded-lg text-xs font-semibold hover:bg-[#005a62] transition flex items-center justify-center gap-1"
                          >
                            <PencilIcon className="w-3.5 h-3.5" /> Mark Script
                          </button>
                          <button
                            onClick={() => setConfirmDelete({ type: 'submission', item: sub, label: sub.student_name })}
                            className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── ALL SUBMISSIONS TAB ─────────────────────────────────────────────── */}
      {activeTab === 'allSubmissions' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex flex-wrap gap-3 items-end">
            <div>
              <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Quiz</label>
              <select value={subFilters.quiz_id} onChange={e => setSubFilters(p => ({ ...p, quiz_id: e.target.value }))} className={`${inp} w-56`}>
                <option value="">All Quizzes</option>
                {filterQuizzes.map(q => <option key={q.id} value={q.id}>{q.title} ({q.subject_name})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Status</label>
              <select value={subFilters.status} onChange={e => setSubFilters(p => ({ ...p, status: e.target.value }))} className={`${inp} w-36`}>
                <option value="">All</option>
                <option value="in-progress">In Progress</option>
                <option value="submitted">Pending</option>
                <option value="completed">Graded</option>
              </select>
            </div>
            <button onClick={() => setSubFilters({ quiz_id: '', status: '' })}
              className="px-3 py-2 border border-gray-200 rounded-lg text-xs text-gray-500 hover:bg-gray-50 transition">
              Clear
            </button>
          </div>
          <div className="p-5">
            {loadingAllSubs ? (
              <div className="flex justify-center py-10"><div className="w-7 h-7 border-4 border-[#006770] border-t-transparent rounded-full animate-spin" /></div>
            ) : allSubmissions.length === 0 ? (
              <div className="text-center py-10"><p className="text-sm text-gray-400">No submissions found.</p></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px]">
                  <thead className="bg-gray-50">
                    <tr>
                      {['Student', 'Quiz', 'Subject', 'Score', 'Status', 'Submitted', ''].map(h => (
                        <th key={h} className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {allSubmissions.map(sub => (
                      <tr key={sub.id} className="hover:bg-[#f0faf9] transition-colors">
                        <td className="px-4 py-3">
                          <p className="text-sm font-semibold text-[#003B46]">{sub.learner_name}</p>
                          <p className="text-[10px] text-gray-400">{sub.learner_reg}</p>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{sub.quiz_title}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{sub.subject}</td>
                        <td className="px-4 py-3 text-sm font-mono text-[#003B46]">
                          {sub.status === 'completed' ? `${sub.earned_marks}/${sub.total_marks}` : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            sub.status === 'completed' ? 'bg-green-100 text-green-700' :
                            sub.status === 'submitted' ? 'bg-amber-100 text-amber-700' :
                                                          'bg-sky-100 text-sky-700'
                          }`}>
                            {sub.status === 'completed' ? 'Graded' : sub.status === 'submitted' ? 'Pending' : 'In Progress'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-400">
                          {sub.submitted_at ? new Date(sub.submitted_at).toLocaleString() : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => setConfirmDelete({ type: 'submission', item: sub, label: sub.learner_name })}
                            className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── QUIZ LIST (all / active / draft) ────────────────────────────────── */}
      {(activeTab === 'all' || activeTab === 'active' || activeTab === 'draft') && (
        filteredQuizzes.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm text-center py-12">
            <ArchiveBoxIcon className="w-10 h-10 text-gray-200 mx-auto mb-2" />
            <p className="text-sm text-gray-400">No papers found.</p>
            <button onClick={() => setShowQuizModal(true)} className="mt-2 text-xs text-[#006770] hover:underline">Create the first paper →</button>
          </div>
        ) : (
          <div className="space-y-3">
            {Object.entries(
              filteredQuizzes.reduce((acc, q) => {
                const sub = q.subject_name || 'Uncategorized';
                if (!acc[sub]) acc[sub] = [];
                acc[sub].push(q);
                return acc;
              }, {})
            ).map(([subjectName, subQuizzes]) => {
              const isExpanded = expandedSubjects[subjectName] ?? true;
              return (
                <div key={subjectName} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  {/* Subject header */}
                  <button
                    onClick={() => setExpandedSubjects(p => ({ ...p, [subjectName]: !isExpanded }))}
                    className="w-full flex items-center justify-between px-4 py-3 bg-[#f0faf9] hover:bg-[#e6f7f5] transition text-left"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-[#006770] flex items-center justify-center flex-shrink-0">
                        <FolderIcon className="w-3.5 h-3.5 text-white" />
                      </div>
                      <div>
                        <span className="text-sm font-bold text-[#003B46]">{subjectName}</span>
                        <span className="ml-2 text-[10px] text-gray-400">{subQuizzes.length} paper{subQuizzes.length !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                    <ChevronRightIcon className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                  </button>

                  {isExpanded && (
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[600px]">
                        <thead className="bg-gray-50">
                          <tr>
                            {['Title', 'Form', 'Duration', 'Marks', 'Questions', 'Status', 'Actions'].map(h => (
                              <th key={h} className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {subQuizzes.map(quiz => (
                            <tr key={quiz.id} className="hover:bg-[#f0faf9] transition-colors">
                              <td className="px-4 py-3">
                                <p className="text-sm font-semibold text-[#003B46]">{quiz.title}</p>
                                {quiz.description && <p className="text-[10px] text-gray-400 line-clamp-1">{quiz.description}</p>}
                              </td>
                              <td className="px-4 py-3">
                                <span className="px-2 py-0.5 bg-[#e0f7fa] text-[#006770] text-[10px] font-semibold rounded">
                                  {quiz.target_form === 'All' ? 'All Forms' : quiz.target_form}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                                <span className="flex items-center gap-1"><ClockIcon className="w-3.5 h-3.5" />{quiz.duration} min</span>
                              </td>
                              <td className="px-4 py-3 text-xs text-gray-500">
                                <span className="flex items-center gap-1"><TrophyIcon className="w-3.5 h-3.5" />{quiz.total_marks}</span>
                              </td>
                              <td className="px-4 py-3 text-xs text-gray-500">
                                <span className="flex items-center gap-1"><QuestionMarkCircleIcon className="w-3.5 h-3.5" />{quiz.question_count || 0}</span>
                              </td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${quiz.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                  {quiz.is_active ? 'Active' : 'Draft'}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-1">
                                  <button onClick={() => viewQuizDetails(quiz)}
                                    className="p-1.5 text-[#00B4D8] hover:bg-[#00B4D8]/10 rounded-lg transition" title="View / Add Questions">
                                    <EyeIcon className="w-4 h-4" />
                                  </button>
                                  <button onClick={() => openEditQuiz(quiz)}
                                    className="p-1.5 text-[#006770] hover:bg-[#006770]/10 rounded-lg transition" title="Edit">
                                    <PencilIcon className="w-4 h-4" />
                                  </button>
                                  <button onClick={() => setConfirmDelete({ type: 'quiz', item: quiz, label: quiz.title })}
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
                  )}
                </div>
              );
            })}
          </div>
        )
      )}

      {/* ── QUIZ DETAIL SIDE PANEL ────────────────────────────────────────────── */}
      {selectedQuiz && activeTab !== 'grading' && activeTab !== 'allSubmissions' && (
        <div className="fixed inset-y-0 right-0 w-full max-w-2xl bg-[#F5F2EB] shadow-2xl z-50 border-l border-gray-200 flex flex-col">
          {/* Panel header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 bg-[#003B46] flex-shrink-0">
            <div>
              <p className="text-[10px] text-white/60 uppercase tracking-wider">Exam Paper</p>
              <h2 className="text-base font-bold text-white">{selectedQuiz.title}</h2>
              <p className="text-xs text-white/60">{selectedQuiz.subject_name} · {selectedQuiz.exam_year}</p>
            </div>
            <button onClick={() => setSelectedQuiz(null)} className="p-1.5 hover:bg-white/10 rounded-lg transition">
              <XMarkIcon className="w-5 h-5 text-white/70" />
            </button>
          </div>

          {/* Meta strip */}
          <div className="flex gap-4 px-5 py-3 bg-white border-b border-gray-100 text-xs text-gray-500 flex-shrink-0 flex-wrap">
            <span className="flex items-center gap-1"><ClockIcon className="w-3.5 h-3.5" />{selectedQuiz.duration} min</span>
            <span className="flex items-center gap-1"><TrophyIcon className="w-3.5 h-3.5" />{selectedQuiz.total_marks} marks</span>
            <span className="flex items-center gap-1"><QuestionMarkCircleIcon className="w-3.5 h-3.5" />{selectedQuiz.questions?.length || 0} questions</span>
            <span className="flex items-center gap-1"><AcademicCapIcon className="w-3.5 h-3.5" />{selectedQuiz.target_form}</span>
          </div>

          {/* Questions */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {/* Section A */}
            <div className="flex items-center justify-between mb-1">
              <div>
                <h4 className="text-sm font-bold text-[#003B46]">Section A</h4>
                <p className="text-[10px] text-gray-400">{selectedQuiz.section_a_marks || 75} marks — Answer all</p>
              </div>
              <button onClick={() => { resetQForm(); setQForm(p => ({ ...p, section: 'A' })); setShowQModal(true); }}
                className="flex items-center gap-1 px-3 py-1.5 bg-[#006770] text-white rounded-lg text-xs font-medium hover:bg-[#005a62] transition">
                <PlusIcon className="w-3.5 h-3.5" /> Add Question
              </button>
            </div>
            {(selectedQuiz.questions?.filter(q => q.section === 'A') || []).map((q, i) => (
              <QuestionCard key={q.id} question={q} index={i} onEdit={() => openEditQuestion(q)}
                onDelete={() => setConfirmDelete({ type: 'question', item: q, label: q.question_text?.slice(0, 60) || 'this question' })} />
            ))}
            {!selectedQuiz.questions?.some(q => q.section === 'A') && (
              <p className="text-xs text-gray-400 text-center py-4 bg-white rounded-lg border border-gray-100">No questions in Section A yet.</p>
            )}

            {/* Section B */}
            <div className="flex items-center justify-between mt-5 mb-1">
              <div>
                <h4 className="text-sm font-bold text-[#003B46]">Section B</h4>
                <p className="text-[10px] text-gray-400">{selectedQuiz.section_b_marks || 25} marks — Answer one</p>
              </div>
              <button onClick={() => { resetQForm(); setQForm(p => ({ ...p, section: 'B' })); setShowQModal(true); }}
                className="flex items-center gap-1 px-3 py-1.5 bg-[#006770] text-white rounded-lg text-xs font-medium hover:bg-[#005a62] transition">
                <PlusIcon className="w-3.5 h-3.5" /> Add Question
              </button>
            </div>
            {(selectedQuiz.questions?.filter(q => q.section === 'B') || []).map((q, i) => (
              <QuestionCard key={q.id} question={q} index={i} onEdit={() => openEditQuestion(q)}
                onDelete={() => setConfirmDelete({ type: 'question', item: q, label: q.question_text?.slice(0, 60) || 'this question' })} />
            ))}
            {!selectedQuiz.questions?.some(q => q.section === 'B') && (
              <p className="text-xs text-gray-400 text-center py-4 bg-white rounded-lg border border-gray-100">No questions in Section B yet.</p>
            )}
          </div>
        </div>
      )}

      {/* ── CREATE / EDIT QUIZ MODAL ─────────────────────────────────────────── */}
      {showQuizModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl shadow-xl flex flex-col max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
              <h3 className="text-sm font-bold text-[#003B46]">{editingQuiz ? 'Edit Quiz' : 'Create New Quiz'}</h3>
              <button onClick={() => setShowQuizModal(false)} className="p-1 hover:bg-gray-100 rounded-lg transition">
                <XMarkIcon className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-5 space-y-4">
              {/* Basic info */}
              <SectionBlock label="Basic Information" Icon={DocumentTextIcon}>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Subject *</label>
                    <select value={quizForm.subject_id} onChange={e => setQuizForm(p => ({ ...p, subject_id: e.target.value }))} className={inp} required>
                      <option value="">Select subject…</option>
                      {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Paper Title *</label>
                    <input type="text" value={quizForm.title} onChange={e => setQuizForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g., 2026 Paper II Mock" className={inp} />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Description</label>
                    <textarea rows={2} value={quizForm.description} onChange={e => setQuizForm(p => ({ ...p, description: e.target.value }))} className={inp} />
                  </div>
                </div>
              </SectionBlock>

              {/* Exam details */}
              <SectionBlock label="Examination Details" Icon={AcademicCapIcon}>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Target Form</label>
                    <select value={quizForm.target_form} onChange={e => setQuizForm(p => ({ ...p, target_form: e.target.value }))} className={inp}>
                      {['All', 'Form 1', 'Form 2', 'Form 3', 'Form 4'].map(f => <option key={f}>{f}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Exam Year</label>
                    <input type="number" value={quizForm.exam_year} onChange={e => setQuizForm(p => ({ ...p, exam_year: parseInt(e.target.value) || new Date().getFullYear() }))} min="2000" max="2100" className={inp} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Duration (min)</label>
                    <input type="number" value={quizForm.duration} onChange={e => setQuizForm(p => ({ ...p, duration: parseInt(e.target.value) || 30 }))} min="5" max="180" className={inp} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Exam Type</label>
                    <select value={quizForm.exam_type} onChange={e => setQuizForm(p => ({ ...p, exam_type: e.target.value }))} className={inp}>
                      <option value="SCHOOL CERTIFICATE OF EDUCATION MOCK EXAMINATION">School Certificate Mock</option>
                      <option value="JUNIOR CERTIFICATE OF EXAMINATION">Junior Certificate</option>
                      <option value="PRIMARY SCHOOL LEAVING EXAMINATION">Primary Leaving</option>
                    </select>
                  </div>
                </div>
              </SectionBlock>

              {/* Scheduling */}
              <SectionBlock label="Scheduling (optional)" Icon={CalendarIcon}>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Start</label>
                    <input type="datetime-local" value={quizForm.scheduled_start} onChange={e => setQuizForm(p => ({ ...p, scheduled_start: e.target.value }))} className={inp} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">End</label>
                    <input type="datetime-local" value={quizForm.scheduled_end} onChange={e => setQuizForm(p => ({ ...p, scheduled_end: e.target.value }))} className={inp} />
                  </div>
                </div>
              </SectionBlock>

              {/* Marks */}
              <SectionBlock label="Marks Allocation" Icon={TrophyIcon}>
                <div className="grid grid-cols-3 gap-3">
                  {[['Total Marks', 'total_marks'], ['Section A', 'section_a_marks'], ['Section B', 'section_b_marks']].map(([label, key]) => (
                    <div key={key}>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
                      <input type="number" value={quizForm[key]} onChange={e => setQuizForm(p => ({ ...p, [key]: parseInt(e.target.value) || 0 }))} min="0" className={inp} />
                    </div>
                  ))}
                </div>
              </SectionBlock>

              {/* Status */}
              <label className={`flex items-center gap-3 px-4 py-3 rounded-lg border cursor-pointer transition ${quizForm.is_active ? 'bg-[#f0faf9] border-[#006770]/30' : 'bg-white border-gray-200'}`}>
                <input type="checkbox" checked={quizForm.is_active} onChange={e => setQuizForm(p => ({ ...p, is_active: e.target.checked }))} className="w-4 h-4 accent-[#006770]" />
                <div>
                  <p className="text-xs font-semibold text-gray-700">Active — visible to candidates</p>
                  <p className="text-[10px] text-gray-400">Uncheck to keep as a draft</p>
                </div>
                <CheckCircleIcon className={`w-4 h-4 ml-auto ${quizForm.is_active ? 'text-[#006770]' : 'text-gray-200'}`} />
              </label>
            </div>

            <div className="flex gap-2 px-5 py-4 border-t border-gray-100 flex-shrink-0">
              <button onClick={() => setShowQuizModal(false)} className="flex-1 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition">Cancel</button>
              <button onClick={editingQuiz ? handleUpdateQuiz : handleCreateQuiz} disabled={submitting}
                className="flex-1 py-2 bg-[#006770] text-white rounded-lg text-sm font-semibold hover:bg-[#005a62] transition disabled:opacity-50 flex items-center justify-center gap-2">
                {submitting && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                {editingQuiz ? 'Update Quiz' : 'Create Quiz'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ADD / EDIT QUESTION MODAL ─────────────────────────────────────────── */}
      {showQModal && selectedQuiz && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl shadow-xl flex flex-col max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
              <h3 className="text-sm font-bold text-[#003B46]">{editingQ ? 'Edit Question' : 'Add Question'}</h3>
              <button onClick={() => { setShowQModal(false); setEditingQ(null); resetQForm(); }} className="p-1 hover:bg-gray-100 rounded-lg transition">
                <XMarkIcon className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Section</label>
                  <select value={qForm.section} onChange={e => setQForm(p => ({ ...p, section: e.target.value }))} className={inp}>
                    <option value="A">Section A</option>
                    <option value="B">Section B</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Type</label>
                  <select value={qForm.question_type} onChange={e => setQForm(p => ({ ...p, question_type: e.target.value, options: ['','','',''], correct_answer: 0 }))} className={inp}>
                    <option value="multiple_choice">Multiple Choice</option>
                    <option value="short_answer">Short Answer</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Question Text</label>
                <textarea rows={3} value={qForm.question_text} onChange={e => setQForm(p => ({ ...p, question_text: e.target.value }))} className={inp} />
              </div>

              <ImageUploader label="Question Diagram (optional)" currentImage={qForm.question_image} onImageUpload={url => setQForm(p => ({ ...p, question_image: url }))} />

              {qForm.question_type === 'multiple_choice' ? (
                <>
                  {[0, 1, 2, 3].map(i => (
                    <div key={i} className="border border-gray-200 rounded-lg p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 bg-[#006770]/10 text-[#006770] rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {String.fromCharCode(65 + i)}
                        </span>
                        <input type="text" value={qForm.options[i]}
                          onChange={e => { const o = [...qForm.options]; o[i] = e.target.value; setQForm(p => ({ ...p, options: o })); }}
                          placeholder={`Option ${String.fromCharCode(65 + i)}`} className={inp} />
                        {i === qForm.correct_answer && <CheckCircleIcon className="w-4 h-4 text-green-500 flex-shrink-0" />}
                      </div>
                      <ImageUploader label="Option image" currentImage={qForm.option_images[i]} onImageUpload={url => { const imgs = [...qForm.option_images]; imgs[i] = url; setQForm(p => ({ ...p, option_images: imgs })); }} />
                    </div>
                  ))}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Correct Answer</label>
                    <select value={qForm.correct_answer} onChange={e => setQForm(p => ({ ...p, correct_answer: parseInt(e.target.value) }))} className={inp}>
                      {qForm.options.map((_, i) => <option key={i} value={i}>Option {String.fromCharCode(65 + i)}</option>)}
                    </select>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Expected Answer (model answer)</label>
                    <textarea rows={2} value={qForm.expected_answer} onChange={e => setQForm(p => ({ ...p, expected_answer: e.target.value }))} className={inp} />
                  </div>
                  <ImageUploader label="Answer Reference Image" currentImage={qForm.answer_image} onImageUpload={url => setQForm(p => ({ ...p, answer_image: url }))} />
                </>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Explanation / Notes</label>
                <textarea rows={2} value={qForm.explanation} onChange={e => setQForm(p => ({ ...p, explanation: e.target.value }))} className={inp} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Marks</label>
                <input type="number" value={qForm.marks} onChange={e => setQForm(p => ({ ...p, marks: parseInt(e.target.value) || 1 }))} min="1" className={`${inp} w-24`} />
              </div>
            </div>
            <div className="flex gap-2 px-5 py-4 border-t border-gray-100 flex-shrink-0">
              <button onClick={() => { setShowQModal(false); setEditingQ(null); resetQForm(); }} className="flex-1 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition">Cancel</button>
              <button onClick={handleAddOrUpdateQuestion} disabled={submitting}
                className="flex-1 py-2 bg-[#006770] text-white rounded-lg text-sm font-semibold hover:bg-[#005a62] transition disabled:opacity-50 flex items-center justify-center gap-2">
                {submitting && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                {editingQ ? 'Update Question' : 'Add Question'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── GRADING MODAL ─────────────────────────────────────────────────────── */}
      {gradingModal && selectedSub && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-3xl shadow-xl flex flex-col max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
              <div>
                <h3 className="text-sm font-bold text-[#003B46]">Mark Candidate Script</h3>
                <p className="text-xs text-gray-400 mt-0.5">{selectedSub.student_name} · Submitted {new Date(selectedSub.submitted_at).toLocaleString()}</p>
              </div>
              <button onClick={() => setGradingModal(false)} className="p-1 hover:bg-gray-100 rounded-lg transition">
                <XMarkIcon className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 p-5 space-y-5">
              {selectedSub.answers.map((ans, idx) => (
                <div key={idx} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-[#003B46]">Q{idx + 1}. {ans.question_text}</span>
                    <span className="text-xs text-gray-400">/{ans.max_marks} marks</span>
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="px-3 py-2 bg-[#f0faf9] border-l-4 border-[#006770] rounded text-sm text-gray-700">
                      <p className="text-[10px] text-[#006770] font-semibold mb-1">Candidate's answer</p>
                      <p className="font-mono whitespace-pre-wrap">{ans.answer || '(No answer provided)'}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Marks awarded (max {ans.max_marks})</label>
                        <input type="number" min={0} max={ans.max_marks} value={ans.given_marks ?? 0}
                          onChange={e => {
                            const a = [...selectedSub.answers];
                            a[idx].given_marks = parseInt(e.target.value) || 0;
                            setSelectedSub({ ...selectedSub, answers: a });
                          }}
                          className={`${inp} w-24`} />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Feedback</label>
                        <textarea rows={2} value={ans.feedback || ''} placeholder="Examiner comment…"
                          onChange={e => {
                            const a = [...selectedSub.answers];
                            a[idx].feedback = e.target.value;
                            setSelectedSub({ ...selectedSub, answers: a });
                          }}
                          className={inp} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between gap-3 px-5 py-4 border-t border-gray-100 flex-shrink-0">
              <button onClick={handleResetAttempt} className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm font-medium hover:bg-red-100 transition">
                Reset — Allow Retake
              </button>
              <div className="flex gap-2">
                <button onClick={() => setGradingModal(false)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition">Cancel</button>
                <button onClick={saveGrades} className="px-5 py-2 bg-[#006770] text-white rounded-lg text-sm font-semibold hover:bg-[#005a62] transition">Submit Marks</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── CONFIRM DELETE MODAL ──────────────────────────────────────────────── */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[70] p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
            {/* Red top band */}
            <div className="bg-red-500 px-5 py-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                <ExclamationTriangleIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">
                  Delete {confirmDelete.type === 'quiz' ? 'Quiz' : confirmDelete.type === 'question' ? 'Question' : 'Submission'}
                </h3>
                <p className="text-[10px] text-white/70 mt-0.5 capitalize">{confirmDelete.type}</p>
              </div>
            </div>
            {/* Body */}
            <div className="px-5 py-4">
              <p className="text-xs text-gray-500 mb-2">You are about to permanently delete:</p>
              <p className="text-sm font-semibold text-[#003B46] bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 break-words line-clamp-3">
                "{confirmDelete.label}"
              </p>
              <p className="text-xs text-red-500 mt-3 flex items-center gap-1.5">
                <ExclamationTriangleIcon className="w-3.5 h-3.5 flex-shrink-0" />
                This action cannot be undone.
              </p>
            </div>
            {/* Actions */}
            <div className="flex gap-2 px-5 pb-5">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={executeConfirmedDelete}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-semibold transition shadow-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ── small reusable sub-components ─────────────────────────────────────────────

const SectionBlock = ({ label, Icon, children }) => (
  <div className="border border-gray-200 rounded-xl overflow-hidden">
    <div className="flex items-center gap-2 px-4 py-2.5 bg-[#f0faf9] border-b border-gray-100">
      <Icon className="w-3.5 h-3.5 text-[#006770]" />
      <span className="text-xs font-bold text-[#003B46] uppercase tracking-wide">{label}</span>
    </div>
    <div className="p-4">{children}</div>
  </div>
);

const QuestionCard = ({ question, index, onEdit, onDelete }) => (
  <div className="bg-white border border-gray-200 rounded-xl overflow-hidden group hover:shadow-sm transition">
    <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-100">
      <div className="flex items-center gap-2">
        <span className="px-2 py-0.5 bg-[#006770]/10 text-[#006770] text-[10px] font-bold rounded">Q{index + 1}</span>
        <span className="text-[10px] text-gray-400">{question.marks} mark{question.marks !== 1 ? 's' : ''}</span>
        <span className="text-[10px] text-gray-400">· {question.question_type === 'multiple_choice' ? 'MCQ' : 'Short Answer'}</span>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
        <button onClick={onEdit} className="p-1 text-[#006770] hover:bg-[#006770]/10 rounded transition">
          <PencilIcon className="w-3.5 h-3.5" />
        </button>
        <button onClick={onDelete} className="p-1 text-red-400 hover:bg-red-50 rounded transition">
          <TrashIcon className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
    <div className="p-4">
      {question.question_text && <p className="text-sm text-[#003B46] font-medium mb-3">{question.question_text}</p>}
      {question.question_image && <img src={question.question_image} alt="Diagram" className="max-h-40 rounded-lg mb-3 border border-gray-100" />}
      {question.question_type === 'multiple_choice' ? (
        <div className="grid grid-cols-2 gap-1.5">
          {(question.options || []).map((opt, i) => (
            <div key={i} className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs border ${
              i === question.correct_answer ? 'bg-green-50 border-green-200 text-green-700' : 'bg-gray-50 border-gray-200 text-gray-600'
            }`}>
              <span className="font-bold">{String.fromCharCode(65 + i)}.</span> {opt}
              {i === question.correct_answer && <CheckCircleIcon className="w-3 h-3 ml-auto text-green-500 flex-shrink-0" />}
            </div>
          ))}
        </div>
      ) : (
        <div className="px-3 py-2 bg-[#f0faf9] border border-[#006770]/20 rounded-lg text-xs text-gray-500 italic">
          Model answer: {question.expected_answer || '(not set)'}
        </div>
      )}
    </div>
  </div>
);

export default QuizManagement;
