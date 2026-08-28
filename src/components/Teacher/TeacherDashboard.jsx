import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';

// Theme constants
const NAVY_DARK = '#0A2540';
const NAVY_PRIMARY = '#1E3A5F';
const AZURE_ACCENT = '#00B4D8';
const TEAL_ACCENT = '#2A9D8F';
const ICE_WHITE = '#F8FAFC';
const PAPER = '#F5F2EB';
const HEADER_BG = '#003B46';
const NAVBAR_BG = '#006770';

// Grade classification function with points system for Forms 3-4
const getGradeFromScore = (score, form = 'Form 1') => {
  const isUpperForm = form === 'Form 3' || form === 'Form 4';
  
  if (isUpperForm) {
    // Points system for Form 3 and 4
    if (score >= 85) return { points: 1, description: 'Distinction', color: '#1e7e4a', bgColor: '#e8f5e9' };
    else if (score >= 75) return { points: 2, description: 'Distinction', color: '#2a6e2a', bgColor: '#e8f5e9' };
    else if (score >= 65) return { points: 3, description: 'Credit', color: '#2a9090', bgColor: '#e0f2f1' };
    else if (score >= 56) return { points: 4, description: 'Credit', color: '#c9933a', bgColor: '#fff3e0' };
    else if (score >= 50) return { points: 5, description: 'Credit', color: '#f39c12', bgColor: '#ffe6cc' };
    else if (score >= 45) return { points: 6, description: 'Pass', color: '#f39c12', bgColor: '#ffe6cc' };
    else if (score >= 40) return { points: 7, description: 'Pass', color: '#f39c12', bgColor: '#ffe6cc' };
    else if (score >= 35) return { points: 8, description: 'Pass', color: '#f39c12', bgColor: '#ffe6cc' };
    else return { points: 9, description: 'Fail', color: '#c0392b', bgColor: '#ffebee' };
  } else {
    // Standard grading for Form 1 and Form 2
    if (score >= 75) return { letter: 'A', description: 'Excellent', points: null, color: '#1e7e4a', bgColor: '#e8f5e9' };
    else if (score >= 65) return { letter: 'B', description: 'Very good', points: null, color: '#2a9090', bgColor: '#e0f2f1' };
    else if (score >= 55) return { letter: 'C', description: 'Good', points: null, color: '#c9933a', bgColor: '#fff3e0' };
    else if (score >= 40) return { letter: 'D', description: 'Pass', points: null, color: '#f39c12', bgColor: '#ffe6cc' };
    else return { letter: 'F', description: 'Need improvement', points: null, color: '#c0392b', bgColor: '#ffebee' };
  }
};

// Calculate best 6 subjects and total points for Form 3/4
const calculateBestSubjectsAndPoints = (subjects, form) => {
  if (!subjects || subjects.length === 0) return { bestSubjects: [], totalPoints: 0, englishPassed: true, englishPoints: null };
  
  const isUpperForm = form === 'Form 3' || form === 'Form 4';
  if (!isUpperForm) return { bestSubjects: subjects, totalPoints: null, englishPassed: true, englishPoints: null };
  
  // Calculate points for each subject
  const subjectsWithPoints = subjects.map(subject => ({
    ...subject,
    grade: getGradeFromScore(subject.score, form),
    points: getGradeFromScore(subject.score, form).points
  }));
  
  // Find English subject
  const englishSubject = subjectsWithPoints.find(s => 
    s.name.toLowerCase().includes('english')
  );
  
  // Check if English is passed (score >= 35 or points <= 8)
  const englishPassed = englishSubject ? englishSubject.score >= 35 : true;
  const englishPoints = englishSubject ? englishSubject.points : null;
  
  // Sort subjects by points (lower points are better)
  const sortedSubjects = [...subjectsWithPoints].sort((a, b) => a.points - b.points);
  
  // Take best 6 subjects (lowest points)
  const bestSubjects = sortedSubjects.slice(0, Math.min(6, sortedSubjects.length));
  
  // Calculate total points of best subjects
  const totalPoints = bestSubjects.reduce((sum, subject) => sum + subject.points, 0);
  
  return { bestSubjects, totalPoints, englishPassed, englishPoints };
};

// Get overall grade based on total points
const getOverallGradeFromPoints = (totalPoints) => {
  if (totalPoints <= 2) return { description: 'Distinction' };
  if (totalPoints <= 6) return { description: 'Credit' };
  if (totalPoints <= 12) return { description: 'Pass' };
  return { description: 'Fail' };
};

// Calculate status based on number of subjects passed (for all forms)
const calculateStatusByPassedSubjects = (subjects) => {
  if (!subjects || subjects.length === 0) {
    return { status: 'FAIL', message: 'No subjects assessed', color: '#c0392b' };
  }
  
  // Count subjects with score >= 40 (passing score)
  const passedCount = subjects.filter(s => s.score >= 40).length;
  
  if (passedCount >= 6) {
    return { status: 'PASS', message: `Passed ${passedCount} subjects - Overall Result: PASS`, color: '#10b981' };
  } else {
    return { status: 'FAIL', message: `Passed only ${passedCount} subject(s) - Overall Result: FAIL`, color: '#c0392b' };
  }
};

// Get final status based on English pass/fail and total points
const getFinalStatus = (englishPassed, totalPoints) => {
  if (!englishPassed) return { status: 'FAIL', message: 'Failed English - Overall Result: FAIL', color: '#c0392b' };
  if (totalPoints <= 2) return { status: 'DISTINCTION', message: 'Distinction - Excellent Performance!', color: '#1e7e4a' };
  if (totalPoints <= 6) return { status: 'CREDIT', message: 'Credit - Good Performance!', color: '#2a9090' };
  if (totalPoints <= 12) return { status: 'PASS', message: 'Pass - Satisfactory Performance', color: '#f39c12' };
  return { status: 'FAIL', message: 'Fail - Needs Improvement', color: '#c0392b' };
};

// Get points interpretation message
const getPointsInterpretation = (totalPoints) => {
  if (totalPoints <= 2) return 'Excellent performance! Outstanding achievement with top marks.';
  if (totalPoints <= 6) return 'Good performance! You have achieved credit level. Keep working hard.';
  if (totalPoints <= 12) return 'Satisfactory performance. You have passed. Room for improvement.';
  return 'Needs significant improvement. Please work harder and seek help where needed.';
};

// Stat Card Component
const StatCard = ({ emoji, value, label, subtitle }) => (
  <div className="bg-white rounded-xl border border-[#e2e8f0] p-3 sm:p-4 lg:p-6 shadow-sm hover:shadow-md transition">
    <div className="text-2xl lg:text-3xl mb-2 lg:mb-3">{emoji}</div>
    <div className="text-xl lg:text-3xl font-bold text-[#0A2540] mb-1">{value}</div>
    <div className="text-[10px] lg:text-xs text-gray-500 font-semibold uppercase">{label}</div>
    {subtitle && <div className="text-[10px] text-gray-400 mt-1">{subtitle}</div>}
  </div>
);

// Navigation Item Component
const NavItem = ({ icon, label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg font-medium transition-all duration-200 text-sm ${
      isActive
      ? 'bg-white text-[#006770] shadow-md'
      : 'text-white/85 hover:bg-white/10 hover:text-white'
    }`}
  >
    <span className="text-lg">{icon}</span>
    <span>{label}</span>
  </button>
);

// Mobile Menu Button
const MobileMenuButton = ({ isOpen, onClick }) => (
  <button
    onClick={onClick}
    className="lg:hidden p-2 rounded-lg bg-white/10 hover:bg-white/20 transition"
    aria-label="Toggle menu"
  >
    {isOpen ? (
      <XMarkIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
    ) : (
      <Bars3Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
    )}
  </button>
);

export default function TeacherDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(() => {
    const saved = sessionStorage.getItem('teacherActiveTab');
    return saved || 'overview';
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAllLearners, setShowAllLearners] = useState(false);
  
  // Data states
  const [myLearners, setMyLearners] = useState([]);
  const [allLearners, setAllLearners] = useState([]);
  const [reports, setReports] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teacherClass, setTeacherClass] = useState(null);
  const [stats, setStats] = useState({
    totalLearners: 0,
    totalReports: 0,
    attendanceRate: 0
  });
  
  // Assessment types state
  const [assessmentTypes, setAssessmentTypes] = useState([]);
  const [selectedAssessmentType, setSelectedAssessmentType] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  
  // Modal states
  const [showAddLearnersModal, setShowAddLearnersModal] = useState(false);
  const [selectedLearners, setSelectedLearners] = useState([]);
  const [availableLearners, setAvailableLearners] = useState([]);
  
  // Report form states
  const [selectedLearnerId, setSelectedLearnerId] = useState('');
  const [selectedLearner, setSelectedLearner] = useState(null);
  const [reportTerm, setReportTerm] = useState('Term 1 – 2024');
  const [reportForm, setReportForm] = useState('Form 1');
  const [subjectScores, setSubjectScores] = useState({});
  const [savedSubjectScores, setSavedSubjectScores] = useState({});
  const [teacherComment, setTeacherComment] = useState('');
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  
  // Edit mode states
  const [editingReportId, setEditingReportId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // Attendance form states
  const [attDate, setAttDate] = useState(new Date().toISOString().split('T')[0]);
  const [attLearnerId, setAttLearnerId] = useState('');
  const [attStatus, setAttStatus] = useState('present');
  
  // Modal states
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);

  const getDraftKey = useCallback(() => {
    if (!selectedLearnerId) return null;
    return `teacher-report-draft:${selectedLearnerId}:${selectedAssessmentType || 'custom'}:${selectedYear}:${reportTerm}:${reportForm}`;
  }, [selectedLearnerId, selectedAssessmentType, selectedYear, reportTerm, reportForm]);

  // Restore a saved draft when the report context and subjects are ready.
  useEffect(() => {
    if (isEditing || !selectedLearnerId || subjects.length === 0) return;

    const draftKey = getDraftKey();
    if (!draftKey) return;

    try {
      const draft = JSON.parse(localStorage.getItem(draftKey) || 'null');
      if (draft?.savedSubjectScores) {
        setSavedSubjectScores(draft.savedSubjectScores);
        setSubjectScores(previous => ({ ...previous, ...draft.savedSubjectScores }));
      }
      if (draft?.teacherComment) {
        setTeacherComment(draft.teacherComment);
      }
    } catch (error) {
      console.error('Error restoring report draft:', error);
    }
  }, [getDraftKey, isEditing, selectedLearnerId, subjects.length]);

  // Keep saved scores and comments available if the teacher leaves and returns.
  useEffect(() => {
    if (isEditing || !selectedLearnerId || Object.keys(savedSubjectScores).length === 0) return;

    const draftKey = getDraftKey();
    if (!draftKey) return;

    try {
      localStorage.setItem(draftKey, JSON.stringify({
        savedSubjectScores,
        teacherComment,
        updatedAt: new Date().toISOString()
      }));
    } catch (error) {
      console.error('Error saving report draft:', error);
    }
  }, [getDraftKey, isEditing, selectedLearnerId, savedSubjectScores, teacherComment]);

  // Save active tab to sessionStorage
  useEffect(() => {
    sessionStorage.setItem('teacherActiveTab', activeTab);
  }, [activeTab]);

  // Close mobile menu when tab changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [activeTab]);

  // Load data on mount
  useEffect(() => {
    loadDashboardData();
    fetchAssessmentTypes();
  }, []);

  // Fetch subjects when learner is selected for report
  useEffect(() => {
    if (selectedLearner && selectedLearner.class_id) {
      fetchSubjectsForClass(selectedLearner.class_id);
    }
  }, [selectedLearner]);

  // Fetch assessment types
  const fetchAssessmentTypes = async () => {
    try {
      const response = await api.get('/api/teacher/assessment-types');
      if (response.data.success) {
        setAssessmentTypes(response.data.assessment_types || []);
      }
    } catch (error) {
      console.error('Error fetching assessment types:', error);
    }
  };

  // Generate years for dropdown
  const generateYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear - 5; i <= currentYear + 5; i++) {
      years.push(i);
    }
    return years;
  };

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const teacherInfoRes = await api.get('/api/teacher/debug-setup');
      console.log('Teacher info:', teacherInfoRes.data);
      
      let teacherClassId = null;
      let teacherClassName = null;
      
      if (teacherInfoRes.data.success && teacherInfoRes.data.current_teacher) {
        teacherClassId = teacherInfoRes.data.current_teacher.class_id;
        teacherClassName = teacherInfoRes.data.assigned_class?.name;
        setTeacherClass(teacherInfoRes.data.assigned_class);
      }
      
      const [myLearnersRes, allLearnersRes, reportsRes, attendanceRes, statsRes] = await Promise.all([
        api.get('/api/teacher/my-learners'),
        api.get('/api/teacher/all-learners'),
        api.get('/api/teacher/reports'),
        api.get('/api/teacher/attendance'),
        api.get('/api/teacher/dashboard/stats')
      ]);
      
      const myLearnersData = myLearnersRes.data?.learners || myLearnersRes.data || [];
      const allLearnersData = allLearnersRes.data?.learners || allLearnersRes.data || [];
      const reportsData = reportsRes.data?.data || reportsRes.data || [];
      const attendanceData = attendanceRes.data?.data?.records || attendanceRes.data || [];
      const statsData = statsRes.data?.data || statsRes.data || {};
      
      console.log('✅ Accepted learners (My Learners):', myLearnersData.length);
      console.log('⏳ Pending learners (Add Learners):', allLearnersData.length);
      console.log('📊 Reports:', reportsData.length);
      
      setMyLearners(myLearnersData);
      setAllLearners(allLearnersData);
      setAvailableLearners(allLearnersData);
      setReports(reportsData);
      setAttendance(attendanceData);
      
      setStats({
        totalLearners: statsData.totalLearners || myLearnersData.length,
        totalReports: statsData.totalReports || reportsData.length,
        attendanceRate: statsData.attendanceRate || 0
      });
      
    } catch (error) {
      console.error('Error loading dashboard:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjectsForClass = async (classId) => {
    if (!classId) return;
    setLoadingSubjects(true);
    try {
      const response = await api.get(`/api/teacher/subjects/${classId}`);
      const subjectsData = response.data || [];
      setSubjects(subjectsData);
      
      const newScores = {};
      subjectsData.forEach(subject => {
        newScores[subject.name] = '';
      });
      setSubjectScores(newScores);
      setSavedSubjectScores({});
    } catch (error) {
      console.error('Error fetching subjects:', error);
      setSubjects([]);
    } finally {
      setLoadingSubjects(false);
    }
  };

  const handleAddLearners = async () => {
    if (selectedLearners.length === 0) {
      toast.error('Please select at least one learner');
      return;
    }
    
    if (isSubmitting) return;
    setIsSubmitting(true);
    
    try {
      const response = await api.post('/api/teacher/add-learners', {
        learnerIds: selectedLearners
      });
      
      if (response.data.success) {
        toast.success(response.data.message);
        setShowAddLearnersModal(false);
        setSelectedLearners([]);
        loadDashboardData();
      } else {
        toast.error(response.data.message || 'Failed to add learners');
      }
    } catch (error) {
      console.error('Error adding learners:', error);
      toast.error(error.response?.data?.message || 'Failed to add learners');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveLearner = async (learnerId, learnerName) => {
    if (!window.confirm(`Remove ${learnerName} from your class?`)) return;
    
    try {
      const response = await api.delete(`/api/teacher/remove-learner/${learnerId}`);
      
      if (response.data.success) {
        toast.success(`${learnerName} removed from your class`);
        loadDashboardData();
      } else {
        toast.error(response.data.message || 'Failed to remove learner');
      }
    } catch (error) {
      console.error('Error removing learner:', error);
      toast.error('Failed to remove learner');
    }
  };

  const handleLearnerSelect = async (learnerId) => {
    const learner = myLearners.find(l => l.id === parseInt(learnerId));
    setSelectedLearnerId(learnerId);
    setSelectedLearner(learner);
    setSubjectScores({});
    setSavedSubjectScores({});
    setTeacherComment('');
    if (learner) {
      setReportForm(learner.form || 'Form 1');
    }
  };

  // Handle edit report
  const handleEditReport = async (report) => {
    setEditingReportId(report.id);
    setIsEditing(true);
    
    setSelectedLearnerId(report.learner_id);
    const learner = myLearners.find(l => l.id === report.learner_id);
    setSelectedLearner(learner);
    setReportTerm(report.term);
    setReportForm(report.form);
    setSelectedAssessmentType(report.assessment_type_id || '');
    setSelectedYear(report.academic_year?.toString() || new Date().getFullYear().toString());
    setTeacherComment(report.comment || '');
    
    if (learner && learner.class_id) {
      await fetchSubjectsForClass(learner.class_id);
      const scores = {};
      subjects.forEach(subject => {
        const found = report.subjects.find(s => s.name === subject.name);
        scores[subject.name] = found ? found.score : '';
      });
      setSubjectScores(scores);
      setSavedSubjectScores(scores);
    }
    
    document.getElementById('report-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSaveSubject = (subject) => {
    const rawScore = subjectScores[subject.name];
    const score = parseInt(rawScore, 10);

    if (rawScore === '' || rawScore === undefined || isNaN(score) || score < 0 || score > 100) {
      toast.error(`Please enter a valid score (0-100) for ${subject.name}`);
      return;
    }

    setSavedSubjectScores(previous => ({ ...previous, [subject.name]: score }));
    toast.success(`${subject.name} saved`);
  };

  const handleSaveReport = async () => {
    if (!selectedLearnerId) {
      toast.error('Please select a learner');
      return;
    }
    
    const subjectsWithScores = subjects.filter(subject => {
      const score = savedSubjectScores[subject.name];
      return score !== undefined && score !== '' && score !== null && !isNaN(parseInt(score));
    });
    
    if (subjectsWithScores.length === 0) {
      toast.error('Please enter at least one subject score');
      return;
    }
    
    const invalidScores = subjectsWithScores.filter(subject => {
      const score = parseInt(savedSubjectScores[subject.name]);
      return isNaN(score) || score < 0 || score > 100;
    });
    
    if (invalidScores.length > 0) {
      toast.error(`Please enter valid scores (0-100) for: ${invalidScores.map(s => s.name).join(', ')}`);
      return;
    }
    
    if (isSubmitting) return;
    setIsSubmitting(true);
    
    const subjectsData = subjectsWithScores.map(s => ({
      name: s.name,
      score: parseInt(savedSubjectScores[s.name]) || 0
    }));
    
    const isUpperForm = reportForm === 'Form 3' || reportForm === 'Form 4';
    
    let bestSubjects = subjectsData;
    let totalPoints = null;
    let englishPassed = true;
    let finalStatus = null;
    let pointsGrade = null;
    
    if (isUpperForm) {
      const result = calculateBestSubjectsAndPoints(subjectsData, reportForm);
      bestSubjects = result.bestSubjects;
      totalPoints = result.totalPoints;
      englishPassed = result.englishPassed;
      pointsGrade = getOverallGradeFromPoints(totalPoints);
      finalStatus = getFinalStatus(englishPassed, totalPoints);
    } else {
      // For Form 1/2, calculate status based on number of subjects passed
      finalStatus = calculateStatusByPassedSubjects(subjectsData);
    }
    
    const avgScore = Math.round(subjectsData.reduce((sum, s) => sum + s.score, 0) / subjectsData.length);
    const grade = getGradeFromScore(avgScore, reportForm);
    
    let finalComment = teacherComment;
    if (!finalComment && subjectsData.length > 0) {
      if (isUpperForm) {
        if (!englishPassed) {
          finalComment = `FAILED: English score is below passing mark (35%). Overall Result: FAIL. Total points from best ${bestSubjects.length} subjects: ${totalPoints}. ${getPointsInterpretation(totalPoints)}`;
        } else {
          finalComment = `${finalStatus.status} - ${finalStatus.message} Total points from best ${bestSubjects.length} subjects: ${totalPoints}. ${getPointsInterpretation(totalPoints)}`;
        }
      } else {
        const passedCount = subjectsData.filter(s => s.score >= 40).length;
        finalComment = `Passed ${passedCount} out of ${subjectsData.length} subjects. ${finalStatus.message}. Average score: ${avgScore}%. ${grade.description}.`;
      }
    }
    
    const reportData = {
      learnerId: parseInt(selectedLearnerId),
      term: reportTerm,
      form: reportForm,
      subjects: subjectsData,
      best_subjects: isUpperForm ? bestSubjects : null,
      total_points: totalPoints,
      english_passed: englishPassed,
      final_status: finalStatus ? finalStatus.status : null,
      comment: finalComment,
      assessment_type_id: selectedAssessmentType || null,
      academic_year: parseInt(selectedYear)
    };
    
    try {
      let response;
      if (isEditing && editingReportId) {
        response = await api.put(`/api/teacher/reports/${editingReportId}`, reportData);
        if (response.data.success) {
          toast.success('Report card updated! ✅');
        } else {
          toast.error(response.data.message || 'Failed to update report');
        }
      } else {
        response = await api.post('/api/teacher/reports', reportData);
        if (response.data.success) {
          toast.success('Report card saved! ✅');
        } else {
          toast.error(response.data.message || 'Failed to save report');
        }
      }
      
      if (response.data.success) {
        const draftKey = getDraftKey();
        if (draftKey) {
          localStorage.removeItem(draftKey);
        }
        setSubjectScores({});
        setSavedSubjectScores({});
        setTeacherComment('');
        setSelectedLearnerId('');
        setSelectedLearner(null);
        setSubjects([]);
        setSelectedAssessmentType('');
        setReportTerm('Term 1 – 2024');
        setEditingReportId(null);
        setIsEditing(false);
        loadDashboardData();
      }
    } catch (error) {
      console.error('Error saving report:', error);
      toast.error(error.response?.data?.message || 'Failed to save report');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteReport = async (id) => {
    if (!window.confirm('Delete this report?')) return;
    
    try {
      await api.delete(`/api/teacher/reports/${id}`);
      toast.success('Report deleted');
      loadDashboardData();
    } catch (error) {
      console.error('Error deleting report:', error);
      toast.error('Failed to delete report');
    }
  };

  const handleViewReport = (report) => {
    setSelectedReport(report);
    setShowReportModal(true);
  };

  const handleSaveAttendance = async () => {
    if (!attLearnerId) {
      toast.error('Please select a learner');
      return;
    }
    
    if (isSubmitting) return;
    setIsSubmitting(true);
    
    const payload = {
      learnerId: parseInt(attLearnerId),
      date: attDate,
      status: attStatus
    };
    
    try {
      const response = await api.post('/api/teacher/attendance', payload);
      if (response.data.success) {
        toast.success('Attendance recorded ✔');
        setAttLearnerId('');
        loadDashboardData();
      } else {
        toast.error(response.data.message || 'Failed to record attendance');
      }
    } catch (error) {
      console.error('Error recording attendance:', error);
      toast.error('Failed to record attendance');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString('en', { 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric' 
      });
    } catch {
      return dateStr;
    }
  };

  const getLearnerName = (learnerId) => {
    const learner = myLearners.find(l => l?.id === learnerId);
    return learner?.name || 'Unknown';
  };

  const getLearnerReg = (learnerId) => {
    const learner = myLearners.find(l => l?.id === learnerId);
    return learner?.reg_number || learner?.reg || 'N/A';
  };

  const getLearnerForm = (learnerId) => {
    const learner = myLearners.find(l => l?.id === learnerId);
    return learner?.form || 'N/A';
  };

  const getReportHTML = (report) => {
    if (!report || !report.subjects) return '<div>No report data</div>';
    
    const isUpperForm = report.form === 'Form 3' || report.form === 'Form 4';
    
    let bestSubjects = report.subjects;
    let totalPoints = null;
    let englishPassed = true;
    let finalStatus = null;
    
    if (isUpperForm) {
      const result = calculateBestSubjectsAndPoints(report.subjects, report.form);
      bestSubjects = result.bestSubjects;
      totalPoints = result.totalPoints;
      englishPassed = result.englishPassed;
      finalStatus = getFinalStatus(englishPassed, totalPoints);
    } else {
      // For Form 1/2, calculate status based on number of subjects passed
      finalStatus = calculateStatusByPassedSubjects(report.subjects);
    }
    
    const avg = Math.round(report.subjects.reduce((s, x) => s + x.score, 0) / report.subjects.length);
    const learner = myLearners?.find(l => l?.id === report.learner_id);
    const grade = getGradeFromScore(avg, report.form);
    
    return `
      <div style="background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(15,25,35,0.1);">
        <div style="background: #0f1923; color: white; padding: 20px 24px;">
          <div style="font-family: 'Playfair Display', serif; font-size: 18px; font-weight: 700; color: #c9933a; margin-bottom: 4px;">Progress Secondary School</div>
          <div style="font-size: 12px; opacity: 0.6;">${report.term} · ${report.academic_year || new Date().getFullYear()} · ${report.form}</div>
          <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.1);">
            <div style="font-weight: 600;">${learner?.name || 'Unknown'}</div>
            <div style="font-family: monospace; font-size: 11px; opacity: 0.6; margin-top: 2px;">${getLearnerReg(report.learner_id)}</div>
          </div>
        </div>
        <div style="padding: 20px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #6b7280;">Academic Performance</div>
            <div style="text-align: right;">
              <div style="font-size: 20px; font-weight: bold; color: ${grade.color};">${avg}%</div>
              <div style="font-size: 12px; font-weight: 600; color: ${grade.color};">${isUpperForm ? grade.points + ' points' : grade.letter + ' - ' + grade.description}</div>
              ${isUpperForm && totalPoints !== null ? `
                <div style="font-size: 11px; font-weight: 500; color: #6b7280; margin-top: 4px;">
                  Best ${bestSubjects.length} Subjects Total Points: ${totalPoints} (${finalStatus?.status})
                </div>
                ${!englishPassed ? `
                  <div style="font-size: 11px; font-weight: bold; color: #c0392b; margin-top: 4px;">
                    ⚠️ FAILED: English score below passing mark (35%)
                  </div>
                ` : ''}
              ` : ''}
              ${!isUpperForm && finalStatus ? `
                <div style="font-size: 11px; font-weight: 500; color: ${finalStatus.color}; margin-top: 4px;">
                  Overall Result: <strong>${finalStatus.status}</strong>
                </div>
              ` : ''}
            </div>
          </div>
          <div style="margin-bottom: 20px;">
            <div style="display: grid; grid-template-columns: 1fr 80px 70px; gap: 8px; font-size: 12px; font-weight: 600; color: #6b7280; padding-bottom: 8px; border-bottom: 2px solid #ede9e1;">
              <div>Subject</div>
              <div style="text-align: right;">Score</div>
              <div style="text-align: right;">${isUpperForm ? 'Points' : 'Grade'}</div>
            </div>
            ${bestSubjects.map(s => {
              const subjectGrade = getGradeFromScore(s.score, report.form);
              const isEnglish = s.name.toLowerCase().includes('english');
              const isIncluded = bestSubjects.some(bs => bs.name === s.name);
              return `
                <div style="display: grid; grid-template-columns: 1fr 80px 70px; gap: 8px; align-items: center; padding: 10px 0; border-bottom: 1px solid #ede9e1; ${isEnglish && isUpperForm && !englishPassed ? 'background-color: #ffebee;' : ''}">
                  <div style="font-size: 14px; font-weight: 500; ${isEnglish && isUpperForm && !englishPassed ? 'color: #c0392b;' : ''}">
                    ${s.name}${isEnglish && isUpperForm ? ' ⭐' : ''}${!isIncluded && isUpperForm ? ' (Not counted)' : ''}
                  </div>
                  <div style="text-align: right; font-family: monospace; font-size: 14px; font-weight: 500; color: ${subjectGrade.color};">${s.score}%</div>
                  <div style="text-align: right;">
                    <span style="display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: 600; background: ${subjectGrade.bgColor}; color: ${subjectGrade.color};">
                      ${isUpperForm ? subjectGrade.points + ' pts' : subjectGrade.letter}
                    </span>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
          ${isUpperForm && bestSubjects.length < report.subjects.length ? `
            <div style="margin-bottom: 16px; padding: 8px; background: #f0f0f0; border-radius: 8px; text-align: center;">
              <span style="font-size: 11px; color: #666;">* Best ${bestSubjects.length} subjects shown out of ${report.subjects.length} total subjects</span>
            </div>
          ` : ''}
          ${report.comment ? `
            <div style="margin-top: 16px; padding: 12px; background: #f7f4ef; border-radius: 8px; border-left: 3px solid #c9933a;">
              <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #6b7280; margin-bottom: 4px;">Teacher's Comment</div>
              <div style="font-size: 13px; color: #0f1923;">${report.comment}</div>
            </div>
          ` : ''}
          ${isUpperForm ? `
            <div style="margin-top: 16px; padding: 12px; background: #e8f5e9; border-radius: 8px; border-left: 3px solid #1e7e4a;">
              <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #1e7e4a; margin-bottom: 4px;">Points System Guide</div>
              <div style="font-size: 11px; color: #0f1923;">
                <strong>Points Scale:</strong><br/>
                85-100% = 1 point | 75-84% = 2 points | 65-74% = 3 points | 56-64% = 4 points<br/>
                50-55% = 5 points | 45-49% = 6 points | 40-44% = 7 points | 35-39% = 8 points | Below 35% = 9 points<br/>
                <strong>Best Subjects:</strong> The ${bestSubjects.length} subjects with lowest points are counted<br/>
                <strong>English Requirement:</strong> Must pass English (score ≥ 35%) to qualify for overall pass<br/>
                <strong>Overall: 1-2 pts = Distinction | 3-6 pts = Credit | 7-12 pts = Pass | 13+ pts = Fail</strong>
              </div>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  };

  const handleLogout = async () => {
    sessionStorage.removeItem('teacherActiveTab');
    await logout();
    navigate('/');
    toast.success('Logged out successfully');
  };

  const getUserName = () => {
    if (user?.name) return user.name;
    if (user?.email) return user.email.split('@')[0];
    return 'Teacher';
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const toggleLearnerSelection = (learnerId) => {
    setSelectedLearners(prev => 
      prev.includes(learnerId) 
        ? prev.filter(id => id !== learnerId)
        : [...prev, learnerId]
    );
  };

  const displayedLearners = showAllLearners ? myLearners : myLearners.slice(0, 3);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: ICE_WHITE }}>
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#00B0FF] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F2EB]">
      {/* Header Section */}
      <div 
        className="w-full sticky top-0 z-30 shadow-[0_10px_30px_rgba(10,37,64,0.18)]"
        style={{
          background: HEADER_BG,
        }}
      >
        <div className="relative container mx-auto px-4 py-3">
          <div className="flex items-center justify-between min-h-[68px]">
            {/* Logo and School Name - Left Side */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="relative">
                <img
                  src="/schoologo.png"
                  alt="Progress Secondary School logo"
                  className="w-12 h-12 sm:w-14 sm:h-14 object-contain rounded-2xl bg-white p-1.5 shadow-lg ring-2 ring-white/10"
                />
                <span className="absolute -bottom-1 -right-1 flex h-4 w-4 sm:h-5 sm:w-5 items-center justify-center rounded-full border-2 border-[#003B46] bg-[#2A9D8F] text-[7px] sm:text-[9px] font-bold text-white shadow-sm">
                  ✓
                </span>
              </div>
              <div className="flex flex-col">
                <div className="text-[8px] sm:text-[9px] font-bold tracking-[0.24em] uppercase text-white/80">Teacher portal</div>
                <h1 className="text-sm sm:text-base font-black text-white tracking-[0.16em] leading-tight">PROGRESS</h1>
                <p className="text-[7px] sm:text-[9px] text-white/70 leading-tight">Secondary School</p>
              </div>
            </div>

            {/* Right Side - User Info & Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Teacher Info - Desktop */}
              <div className="hidden md:flex items-center gap-3 rounded-2xl border border-white/10 bg-white/10 px-3 py-1.5 backdrop-blur-sm shadow-sm">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#2A9D8F] shadow-inner">
                  <span className="text-sm">👨‍🏫</span>
                </div>
                <div className="flex flex-col">
                  <div className="text-[11px] font-semibold text-white truncate max-w-[120px]">{getUserName()}</div>
                  <div className="text-[9px] text-white/70">
                    {teacherClass ? teacherClass.name : 'Class Teacher'}
                  </div>
                </div>
              </div>

              {/* Mobile Menu Button */}
              <MobileMenuButton isOpen={mobileMenuOpen} onClick={() => setMobileMenuOpen(!mobileMenuOpen)} />

              {/* Logout Button - Desktop */}
              <button
                onClick={handleLogout}
                className="hidden sm:flex items-center gap-1.5 rounded-xl bg-red-600/95 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-red-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </div>
          </div>

          {/* Welcome Section Below Header */}
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="inline-flex items-center rounded-full border border-[#7DE3FF]/30 bg-white/5 px-2.5 py-1 text-[10px] font-bold tracking-[0.2em] text-[#7DE3FF]">
                TEACHER PORTAL
              </div>
              <h2 className="mt-2 text-xl font-bold text-white sm:text-2xl">
                Hello, {getUserName()} <span className="text-[#7DE3FF]">👋</span>
              </h2>
              <p className="text-sm text-white/75">{getGreeting()}! Welcome back to your dashboard.</p>
            </div>

            {/* Class & Status Badges */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-right backdrop-blur-sm">
                <div className="text-[9px] uppercase tracking-[0.18em] text-white/70">Class</div>
                <div className="text-sm font-bold text-white">{teacherClass?.name || 'Unassigned'}</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-right backdrop-blur-sm">
                <div className="text-[9px] uppercase tracking-[0.18em] text-white/70">Status</div>
                <div className="text-sm font-bold text-[#7DE3FF]">Active</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
          <div className="fixed top-0 right-0 h-full w-64 bg-white shadow-xl">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-[#2A9D8F] rounded-xl flex items-center justify-center">
                  <span className="text-lg font-bold text-white">P</span>
                </div>
                <div>
                  <div className="font-bold text-[#0A2540]">Progress</div>
                  <div className="text-xs text-gray-500">Secondary School</div>
                </div>
              </div>
            </div>
            <div className="p-2">
              {['overview', 'learners', 'reports', 'attendance'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => {
                    setActiveTab(tab);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2.5 rounded-lg mb-1 transition ${
                    activeTab === tab ? 'bg-[#2A9D8F] text-white' : 'text-gray-700 hover:bg-[#2A9D8F]/10'
                  }`}
                >
                  <span className="mr-2">
                    {tab === 'overview' && '📊'}
                    {tab === 'learners' && '👥'}
                    {tab === 'reports' && '📋'}
                    {tab === 'attendance' && '📅'}
                  </span>
                  {tab === 'overview' && 'Overview'}
                  {tab === 'learners' && 'My Learners'}
                  {tab === 'reports' && 'Report Cards'}
                  {tab === 'attendance' && 'Attendance'}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Navigation Bar - Desktop */}
      <div className="hidden lg:block sticky top-[72px] sm:top-[88px] z-20 bg-[#006770] border-b border-white/10 shadow-sm overflow-x-auto">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex gap-1 py-3 min-w-max">
            <NavItem
              icon="📊"
              label="Overview"
              isActive={activeTab === 'overview'}
              onClick={() => setActiveTab('overview')}
            />
            <NavItem
              icon="👥"
              label="Learners"
              isActive={activeTab === 'learners'}
              onClick={() => setActiveTab('learners')}
            />
            <NavItem
              icon="📋"
              label="Reports"
              isActive={activeTab === 'reports'}
              onClick={() => setActiveTab('reports')}
            />
            <NavItem
              icon="📅"
              label="Attendance"
              isActive={activeTab === 'attendance'}
              onClick={() => setActiveTab('attendance')}
            />
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 lg:px-8 py-8 max-w-7xl">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <>
            <div className="mb-6 lg:mb-8">
              <p className="text-sm text-gray-500">Here's what's happening with your students today.</p>
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-6 mb-6 lg:mb-8">
              <StatCard emoji="👥" value={stats.totalLearners} label="My Learners" />
              <StatCard emoji="📋" value={stats.totalReports} label="Reports" />
              <StatCard emoji="📅" value={`${stats.attendanceRate}%`} label="Attendance Rate" />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* My Learners */}
              <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm overflow-hidden">
                <div className="px-4 lg:px-6 py-3 lg:py-4 border-b border-[#e2e8f0] flex justify-between items-center">
                  <h2 className="font-semibold text-[#0A2540] text-sm lg:text-base">My Learners</h2>
                  <button
                    onClick={() => setShowAddLearnersModal(true)}
                    className="text-xs text-[#2A9D8F] hover:underline"
                  >
                    + Add Learners
                  </button>
                </div>
                <div className="p-4 lg:p-6">
                  {myLearners && myLearners.length > 0 ? (
                    <>
                      {displayedLearners.map(learner => (
                        <div key={learner.id} className="flex items-center justify-between py-2 lg:py-3 border-b border-[#ede9e1] last:border-0">
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-[#0A2540] text-sm lg:text-base truncate">{learner.name}</div>
                            <div className="font-mono text-[10px] lg:text-xs bg-[#0A2540] text-[#7DE3FF] px-2 py-1 rounded mt-1 inline-block">
                              {learner.reg_number || learner.reg}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-1 rounded-full text-[10px] lg:text-xs font-semibold bg-[#2A9D8F]/10 text-[#2A9D8F]">
                              {learner.form}
                            </span>
                          </div>
                        </div>
                      ))}
                      
                      {myLearners.length > 3 && (
                        <button
                          onClick={() => setShowAllLearners(!showAllLearners)}
                          className="mt-3 w-full text-center text-xs text-[#2A9D8F] hover:text-[#0A2540] transition font-medium py-2 border-t border-[#e2e8f0]"
                        >
                          {showAllLearners ? '▲ Show Less' : `▼ View All (${myLearners.length} learners)`}
                        </button>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <div className="text-3xl lg:text-4xl mb-2">👥</div>
                      <div className="text-sm">No learners added yet</div>
                      <button
                        onClick={() => setShowAddLearnersModal(true)}
                        className="mt-3 text-sm text-[#2A9D8F] hover:underline"
                      >
                        Add learners to your class
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Quick Actions */}
              <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm overflow-hidden">
                <div className="px-4 lg:px-6 py-3 lg:py-4 border-b border-[#e2e8f0]">
                  <h2 className="font-semibold text-[#0A2540] text-sm lg:text-base">Quick Actions</h2>
                </div>
                <div className="p-4 lg:p-6 flex flex-col gap-2 lg:gap-3">
                  <button onClick={() => setShowAddLearnersModal(true)}                   className="px-3 lg:px-4 py-2 lg:py-2.5 bg-[#0A2540] text-white rounded-lg hover:bg-[#1E3A5F] transition text-sm font-medium">
                    ➕ Add Learners to Class
                  </button>
                  <button onClick={() => setActiveTab('reports')} className="px-3 lg:px-4 py-2 lg:py-2.5 bg-[#2A9D8F] text-white rounded-lg hover:bg-[#238579] transition text-sm font-medium">
                    📋 Generate Report Card
                  </button>
                  <button onClick={() => setActiveTab('attendance')} className="px-3 lg:px-4 py-2 lg:py-2.5 bg-[#00B4D8] text-white rounded-lg hover:bg-[#009fbe] transition text-sm font-medium">
                    📅 Record Attendance
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* My Learners Tab */}
        {activeTab === 'learners' && (
          <>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
              <div>
                <h1 className="font-serif text-2xl lg:text-3xl font-bold text-[#0A2540] mb-1">My Learners</h1>
                <p className="text-sm text-gray-500">
                  Students assigned to your class
                  {teacherClass && (
                    <span className="ml-2 text-[#2A9D8F]">({teacherClass.name})</span>
                  )}
                </p>
              </div>
              <button onClick={() => setShowAddLearnersModal(true)} className="w-full sm:w-auto px-4 py-2 bg-[#0A2540] text-white rounded-lg hover:bg-[#1E3A5F] transition font-semibold text-sm">
                ➕ Add Learners
              </button>
            </div>
            
            <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[500px]">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 lg:px-6 py-2 lg:py-3 text-left text-xs font-semibold text-gray-500 uppercase">Name</th>
                      <th className="px-3 lg:px-6 py-2 lg:py-3 text-left text-xs font-semibold text-gray-500 uppercase">Reg No</th>
                      <th className="px-3 lg:px-6 py-2 lg:py-3 text-left text-xs font-semibold text-gray-500 uppercase">Form</th>
                      <th className="px-3 lg:px-6 py-2 lg:py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                      <th className="px-3 lg:px-6 py-2 lg:py-3 text-left text-xs font-semibold text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {myLearners && myLearners.length > 0 ? (
                      myLearners.map(learner => (
                        <tr key={learner.id} className="hover:bg-gray-50 transition">
                          <td className="px-3 lg:px-6 py-3 text-sm font-medium truncate max-w-[120px] lg:max-w-none">{learner.name}</td>
                          <td className="px-3 lg:px-6 py-3 text-xs font-mono text-gray-600">{learner.reg_number || learner.reg}</td>
                          <td className="px-3 lg:px-6 py-3 text-sm">{learner.form}</td>
                          <td className="px-3 lg:px-6 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              (learner.status === 'Active' || learner.status === undefined) 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {learner.status || 'Active'}
                            </span>
                          </td>
                          <td className="px-3 lg:px-6 py-3">
                            <button onClick={() => handleRemoveLearner(learner.id, learner.name)} className="text-red-600 hover:text-red-800 text-sm">
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="px-6 py-8 text-center text-gray-500 text-sm">
                          No learners added yet. Click "Add Learners" to add students to your class.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <>
            <div className="mb-6">
              <h1 className="font-serif text-2xl lg:text-3xl font-bold text-[#0A2540] mb-1">Report Cards</h1>
              <p className="text-sm text-gray-500">Create and manage academic reports for your learners</p>
              <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-xs text-blue-700">
                  <strong>Grading System:</strong> Forms 1-2: A (75-100%), B (65-74%), C (55-64%), D (40-54%), F (below 40%)
                  <br />
                  <strong>Forms 3-4 Points System:</strong> 85-100% = 1pt, 75-84% = 2pts, 65-74% = 3pts, 56-64% = 4pts, 50-55% = 5pts, 45-49% = 6pts, 40-44% = 7pts, 35-39% = 8pts, &lt;35% = 9pts
                  <br />
                  <strong>Best Subjects:</strong> Only the 6 subjects with the lowest points are counted<br />
                  <strong>English Requirement:</strong> Must pass English (score ≥ 35%) to qualify for overall pass<br />
                  <strong>Overall: 1-2pts = Distinction | 3-6pts = Credit | 7-8pts = Pass | 9 pts = Fail</strong>
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Generate Report Card Form */}
              <div id="report-form" className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm overflow-hidden">
                <div className="px-4 lg:px-6 py-3 lg:py-4 border-b border-[#e2e8f0]">
                  <h2 className="font-semibold text-[#0A2540] text-sm lg:text-base">
                    {isEditing ? '✏️ Edit Report Card' : '📝 Generate Report Card'}
                  </h2>
                </div>
                <div className="p-4 lg:p-6">
                  <div className="mb-4">
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Select Learner</label>
                    <select
                      value={selectedLearnerId}
                      onChange={(e) => handleLearnerSelect(e.target.value)}
                      className="w-full px-3 lg:px-4 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="">Select a learner</option>
                      {myLearners && myLearners.map(learner => (
                        <option key={learner.id} value={learner.id}>
                          {learner.name} ({learner.reg_number || learner.reg}) - {learner.form}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 lg:gap-4 mb-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Assessment Type</label>
                      <select 
                        value={selectedAssessmentType} 
                        onChange={(e) => {
                          setSelectedAssessmentType(e.target.value);
                          const selectedType = assessmentTypes.find(t => t.id === e.target.value);
                          if (selectedType) {
                            setReportTerm(selectedType.name);
                          }
                        }}
                        className="w-full px-3 lg:px-4 py-2 border border-gray-300 rounded-lg text-sm"
                      >
                        <option value="">Select type</option>
                        {assessmentTypes.map(type => (
                          <option key={type.id} value={type.id}>
                            {type.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Academic Year</label>
                      <select 
                        value={selectedYear} 
                        onChange={(e) => setSelectedYear(e.target.value)}
                        className="w-full px-3 lg:px-4 py-2 border border-gray-300 rounded-lg text-sm"
                      >
                        {generateYears().map(year => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 lg:gap-4 mb-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Term/Exam</label>
                      <input
                        type="text"
                        value={reportTerm}
                        onChange={(e) => setReportTerm(e.target.value)}
                        placeholder="e.g., Term 1, Test 2"
                        className="w-full px-3 lg:px-4 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Form</label>
                      <select 
                        value={reportForm} 
                        onChange={(e) => setReportForm(e.target.value)} 
                        className="w-full px-3 lg:px-4 py-2 border border-gray-300 rounded-lg text-sm"
                      >
                        <option>Form 1</option>
                        <option>Form 2</option>
                        <option>Form 3</option>
                        <option>Form 4</option>
                      </select>
                    </div>
                  </div>
                  
                  {loadingSubjects && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700 flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                      Loading subjects...
                    </div>
                  )}
                  
                  {selectedLearner && !loadingSubjects && subjects.length === 0 && (
                    <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-700">
                      ⚠️ No subjects found. Please add subjects first.
                    </div>
                  )}
                  
                  {subjects.length > 0 && (
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-xs font-semibold text-gray-500 uppercase">Subject Scores</label>
                        <span className="text-xs text-gray-400">{Object.keys(savedSubjectScores).length}/{subjects.length} saved</span>
                      </div>
                      <p className="text-xs text-gray-500 mb-2">Save each subject as you enter it. Your draft is kept automatically, and nothing is sent to the learner until you submit all grades below.</p>
                      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                        {subjects.map(subject => (
                          <div key={subject.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-2 p-2 bg-gray-50 rounded-lg">
                            <label className="w-full sm:w-36 text-sm font-medium text-[#0f1923]">{subject.name}</label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              placeholder="Score (0-100)"
                              value={subjectScores[subject.name] || ''}
                              onChange={(e) => {
                                let value = e.target.value;
                                if (value !== '') {
                                  const numValue = parseInt(value);
                                  if (numValue >= 0 && numValue <= 100) {
                                    setSubjectScores({...subjectScores, [subject.name]: value});
                                  }
                                } else {
                                  setSubjectScores({...subjectScores, [subject.name]: ''});
                                }
                              }}
                              className="w-full sm:flex-1 px-3 lg:px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#c9933a] focus:border-transparent"
                            />
                            {subjectScores[subject.name] !== '' && subjectScores[subject.name] !== undefined && (
                              <span className="text-xs font-semibold px-2 py-1 rounded-full bg-[#c9933a]/10 text-[#c9933a]">
                                {reportForm === 'Form 3' || reportForm === 'Form 4' 
                                  ? getGradeFromScore(parseInt(subjectScores[subject.name]), reportForm).points + ' pts'
                                  : getGradeFromScore(parseInt(subjectScores[subject.name]), reportForm).letter}
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => handleSaveSubject(subject)}
                              disabled={isSubmitting || subjectScores[subject.name] === '' || subjectScores[subject.name] === undefined}
                              className={`px-3 py-2 rounded-lg text-xs font-semibold transition disabled:opacity-50 ${
                                savedSubjectScores[subject.name] !== undefined
                                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                  : 'bg-[#0f1923] text-white hover:bg-[#263849]'
                              }`}
                            >
                              {savedSubjectScores[subject.name] !== undefined ? 'Saved' : 'Save'}
                            </button>
                          </div>
                        ))}
                      </div>
                      {(reportForm === 'Form 3' || reportForm === 'Form 4') && (
                        <div className="mt-3 p-2 bg-yellow-50 rounded-lg text-xs text-yellow-700">
                          ℹ️ English is mandatory. Must score ≥ 35% to pass overall.
                          <br />
                          ℹ️ Best 6 subjects (lowest points) will be used for final calculation.
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="mb-4">
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Teacher's Comment (Optional)</label>
                    <textarea
                      value={teacherComment}
                      onChange={(e) => setTeacherComment(e.target.value)}
                      placeholder="Leave empty for auto-generated comment based on performance..."
                      className="w-full px-3 lg:px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#c9933a] focus:border-transparent"
                      rows="3"
                    />
                  </div>
                  
                  <div className="flex gap-3">
                    <button 
                      onClick={handleSaveReport}
                      disabled={isSubmitting || !selectedLearnerId || Object.keys(savedSubjectScores).length === 0 || loadingSubjects}
                      className="flex-1 px-4 py-2 bg-[#c9933a] text-[#0f1923] rounded-lg hover:bg-[#e8b96a] transition font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? 'Submitting...' : (isEditing ? '✏️ Submit Updated Report' : '📤 Submit Grades to Learner')}
                    </button>
                    
                    {isEditing && (
                      <button
                        onClick={() => {
                          setEditingReportId(null);
                          setIsEditing(false);
                          setSubjectScores({});
                          setSavedSubjectScores({});
                          setTeacherComment('');
                          setSelectedLearnerId('');
                          setSelectedLearner(null);
                          setSubjects([]);
                          setSelectedAssessmentType('');
                          setReportTerm('Term 1 – 2024');
                          setSelectedYear(new Date().getFullYear().toString());
                        }}
                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition text-sm"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Saved Reports List */}
              <div className="bg-white rounded-xl border border-[#d4cfc6] shadow-sm overflow-hidden">
                <div className="px-4 lg:px-6 py-3 lg:py-4 border-b border-[#d4cfc6]">
                  <h2 className="font-semibold text-[#0f1923] text-sm lg:text-base">Saved Reports</h2>
                </div>
                <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                  <table className="w-full min-w-[700px]">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-3 lg:px-4 py-2 lg:py-3 text-left text-xs font-semibold text-gray-500 uppercase">Learner</th>
                        <th className="px-3 lg:px-4 py-2 lg:py-3 text-left text-xs font-semibold text-gray-500 uppercase">Assessment</th>
                        <th className="px-3 lg:px-4 py-2 lg:py-3 text-left text-xs font-semibold text-gray-500 uppercase">Year</th>
                        <th className="px-3 lg:px-4 py-2 lg:py-3 text-left text-xs font-semibold text-gray-500 uppercase">Best 6 Pts</th>
                        <th className="px-3 lg:px-4 py-2 lg:py-3 text-left text-xs font-semibold text-gray-500 uppercase">Result</th>
                        <th className="px-3 lg:px-4 py-2 lg:py-3 text-left text-xs font-semibold text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {reports && reports.length > 0 ? (
                        reports.map(report => {
                          const isUpperForm = report.form === 'Form 3' || report.form === 'Form 4';
                          let totalPoints = null;
                          let finalStatus = null;
                          let englishPassed = true;
                          
                          if (isUpperForm && report.subjects) {
                            const result = calculateBestSubjectsAndPoints(report.subjects, report.form);
                            totalPoints = result.totalPoints;
                            englishPassed = result.englishPassed;
                            const status = getFinalStatus(englishPassed, totalPoints);
                            finalStatus = status.status;
                          } else if (!isUpperForm && report.subjects) {
                            // For Form 1/2, calculate status based on number of subjects passed
                            const status = calculateStatusByPassedSubjects(report.subjects);
                            finalStatus = status.status;
                          }
                          
                          return (
                            <tr key={report.id} className="hover:bg-gray-50">
                              <td className="px-3 lg:px-4 py-3 text-sm font-medium truncate max-w-[100px] lg:max-w-none">
                                {getLearnerName(report.learner_id)}
                              </td>
                              <td className="px-3 lg:px-4 py-3">
                                <span className="px-2 py-1 rounded-full text-xs font-semibold bg-[#1a6b6b]/10 text-[#1a6b6b]">
                                  {report.term?.length > 12 ? report.term.substring(0, 10) + '…' : report.term}
                                </span>
                              </td>
                              <td className="px-3 lg:px-4 py-3 text-sm text-gray-600">
                                {report.academic_year || new Date().getFullYear()}
                              </td>
                              <td className="px-3 lg:px-4 py-3">
                                {isUpperForm && totalPoints !== null ? `${totalPoints} pts` : '—'}
                              </td>
                              <td className="px-3 lg:px-4 py-3">
                                {finalStatus ? (
                                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                    finalStatus === 'DISTINCTION' ? 'bg-green-100 text-green-700' :
                                    finalStatus === 'CREDIT' ? 'bg-blue-100 text-blue-700' :
                                    finalStatus === 'PASS' ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-red-100 text-red-700'
                                  }`}>
                                    {finalStatus}
                                  </span>
                                ) : (
                                  <span className="text-xs text-gray-500">—</span>
                                )}
                              </td>
                              <td className="px-3 lg:px-4 py-3">
                                <button onClick={() => handleEditReport(report)} className="text-blue-600 hover:text-blue-800 text-sm mr-2">Edit</button>
                                <button onClick={() => handleViewReport(report)} className="text-blue-600 hover:text-blue-800 text-sm mr-2">View</button>
                                <button onClick={() => handleDeleteReport(report.id)} className="text-red-600 hover:text-red-800 text-sm">Delete</button>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan="6" className="px-4 py-8 text-center text-gray-500 text-sm">No reports yet</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Attendance Tab */}
        {activeTab === 'attendance' && (
          <>
            <div className="mb-6">
              <h1 className="font-serif text-2xl lg:text-3xl font-bold text-[#0f1923] mb-1">Attendance</h1>
              <p className="text-sm text-gray-500">Record and manage daily attendance for your learners</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Record Attendance Form */}
              <div className="bg-white rounded-xl border border-[#d4cfc6] shadow-sm overflow-hidden">
                <div className="px-4 lg:px-6 py-3 lg:py-4 border-b border-[#d4cfc6]">
                  <h2 className="font-semibold text-[#0f1923] text-sm lg:text-base">Record Attendance</h2>
                </div>
                <div className="p-4 lg:p-6">
                  <div className="mb-4">
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Date</label>
                    <input type="date" value={attDate} onChange={(e) => setAttDate(e.target.value)} className="w-full px-3 lg:px-4 py-2 border border-gray-300 rounded-lg text-sm" />
                  </div>
                  <div className="mb-4">
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Learner</label>
                    <select value={attLearnerId} onChange={(e) => setAttLearnerId(e.target.value)} className="w-full px-3 lg:px-4 py-2 border border-gray-300 rounded-lg text-sm">
                      <option value="">Select a learner</option>
                      {myLearners && myLearners.map(learner => (
                        <option key={learner.id} value={learner.id}>
                          {learner.name} ({learner.form})
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Status</label>
                    <div className="flex flex-wrap gap-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="status" value="present" checked={attStatus === 'present'} onChange={(e) => setAttStatus(e.target.value)} />
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">Present</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="status" value="absent" checked={attStatus === 'absent'} onChange={(e) => setAttStatus(e.target.value)} />
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">Absent</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="status" value="late" checked={attStatus === 'late'} onChange={(e) => setAttStatus(e.target.value)} />
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">Late</span>
                      </label>
                    </div>
                  </div>
                  
                  <button 
                    onClick={handleSaveAttendance} 
                    disabled={isSubmitting || !attLearnerId}
                    className="w-full px-4 py-2 bg-[#1a6b6b] text-white rounded-lg hover:bg-[#2a9090] transition font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Saving...' : '✔ Record Attendance'}
                  </button>
                </div>
              </div>
              
              {/* Attendance Log */}
              <div className="bg-white rounded-xl border border-[#d4cfc6] shadow-sm overflow-hidden">
                <div className="px-4 lg:px-6 py-3 lg:py-4 border-b border-[#d4cfc6]">
                  <h2 className="font-semibold text-[#0f1923] text-sm lg:text-base">Attendance Log</h2>
                </div>
                <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                  <table className="w-full min-w-[400px]">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-3 lg:px-4 py-2 lg:py-3 text-left text-xs font-semibold text-gray-500 uppercase">Learner</th>
                        <th className="px-3 lg:px-4 py-2 lg:py-3 text-left text-xs font-semibold text-gray-500 uppercase">Form</th>
                        <th className="px-3 lg:px-4 py-2 lg:py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                        <th className="px-3 lg:px-4 py-2 lg:py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {attendance && attendance.length > 0 ? (
                        [...attendance].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 20).map(record => (
                          <tr key={record.id} className="hover:bg-gray-50">
                            <td className="px-3 lg:px-4 py-3 text-sm font-medium truncate max-w-[100px] lg:max-w-none">
                              {getLearnerName(record.learner_id)}
                            </td>
                            <td className="px-3 lg:px-4 py-3 text-sm">
                              <span className="px-2 py-1 rounded text-xs font-semibold bg-[#c9933a]/10 text-[#c9933a]">
                                {getLearnerForm(record.learner_id)}
                              </span>
                            </td>
                            <td className="px-3 lg:px-4 py-3 text-sm">{formatDate(record.date)}</td>
                            <td className="px-3 lg:px-4 py-3">
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                record.status === 'present' ? 'bg-green-100 text-green-700' : 
                                record.status === 'absent' ? 'bg-red-100 text-red-700' : 
                                'bg-yellow-100 text-yellow-700'
                              }`}>
                                {record.status === 'present' ? 'Present' : record.status === 'absent' ? 'Absent' : 'Late'}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="4" className="px-4 py-8 text-center text-gray-500 text-sm">No records yet</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Add Learners Modal */}
      {showAddLearnersModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowAddLearnersModal(false)}>
          <div className="bg-white rounded-xl p-5 lg:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg lg:text-xl font-bold">Add Learners to Your Class</h2>
              <button onClick={() => setShowAddLearnersModal(false)} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>
            
            {teacherClass && (
              <div className="mb-4 p-3 bg-[#c9933a]/10 rounded-lg border border-[#c9933a]/30">
                <p className="text-sm text-[#c9933a] font-medium">
                  Adding to: <span className="font-bold">{teacherClass.name}</span>
                </p>
              </div>
            )}
            
            {availableLearners.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No learners available to add.</p>
                <p className="text-sm text-gray-400 mt-2">
                  {teacherClass 
                    ? `All learners are already assigned to ${teacherClass.name}.` 
                    : "You haven't been assigned to a class yet."}
                </p>
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <p className="text-sm text-gray-600">Select learners to add:</p>
                </div>
                
                <div className="space-y-2 max-h-[400px] overflow-y-auto mb-4">
                  {availableLearners.map(learner => (
                    <label key={learner.id} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedLearners.includes(learner.id)}
                        onChange={() => toggleLearnerSelection(learner.id)}
                        className="w-4 h-4 text-[#c9933a]"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-[#0f1923]">{learner.name}</div>
                        <div className="text-xs text-gray-500 font-mono">{learner.reg_number} • {learner.form}</div>
                      </div>
                    </label>
                  ))}
                </div>
                
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setShowAddLearnersModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddLearners}
                    disabled={selectedLearners.length === 0 || isSubmitting}
                    className="flex-1 px-4 py-2 bg-[#c9933a] text-white rounded-lg hover:bg-[#b5822e] transition disabled:opacity-50"
                  >
                    {isSubmitting ? 'Adding...' : `Add ${selectedLearners.length} Learner(s)`}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* View Report Modal */}
      {showReportModal && selectedReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowReportModal(false)}>
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div dangerouslySetInnerHTML={{ __html: getReportHTML(selectedReport) }} />
            <div className="mt-4 flex justify-end">
              <button onClick={() => setShowReportModal(false)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition text-sm">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}