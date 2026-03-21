import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/common/Sidebar';
import Modal from '../../components/common/Modal';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { SUBJECTS, getGradeFromScore } from '../../utils/constants';

export default function TeacherReports() {
  const [learners, setLearners] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [formData, setFormData] = useState({
    learnerId: '',
    term: 'Term 1 – 2024',
    academic_year: new Date().getFullYear().toString(),
    form: 'Form 1',
    subjects: SUBJECTS.map(name => ({ name, score: 0 })),
    comment: '',
    teacher_comment: '',
    principal_comment: '',
    attendance_days: 0,
    days_present: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [learnersRes, reportsRes] = await Promise.all([
        api.get('/api/teacher/learners'),
        api.get('/api/teacher/reports')
      ]);
      setLearners(learnersRes.data || []);
      setReports(reportsRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveReport = async () => {
    if (!formData.learnerId) {
      toast.error('Please select a learner');
      return;
    }

    // Validate scores
    const invalidScores = formData.subjects.filter(s => s.score < 0 || s.score > 100);
    if (invalidScores.length > 0) {
      toast.error('Please enter scores between 0 and 100');
      return;
    }

    // Calculate total and average scores
    const totalScore = formData.subjects.reduce((sum, s) => sum + (s.score || 0), 0);
    const averageScore = formData.subjects.length ? Math.round(totalScore / formData.subjects.length) : 0;

    // Prepare data for API matching your database schema
    const reportData = {
      learnerId: parseInt(formData.learnerId),
      term: formData.term,
      academic_year: formData.academic_year,
      form: formData.form,
      subjects: formData.subjects,
      total_score: totalScore,
      average_score: averageScore,
      comment: formData.comment || formData.teacher_comment,
      teacher_comment: formData.teacher_comment || formData.comment,
      principal_comment: formData.principal_comment,
      attendance_days: formData.attendance_days,
      days_present: formData.days_present
    };

    console.log('📤 Sending report data:', reportData);

    try {
      const response = await api.post('/api/teacher/reports', reportData);
      console.log('✅ Report saved:', response.data);
      setReports([response.data.report || response.data, ...reports]);
      setShowReportModal(false);
      resetForm();
      toast.success('Report card saved successfully!');
    } catch (error) {
      console.error('❌ Error saving report:', error.response?.data || error.message);
      
      if (error.response?.data?.error) {
        toast.error(`Server error: ${error.response.data.error}`);
        if (error.response.data.details) {
          console.error('Details:', error.response.data.details);
        }
      } else if (error.response?.status === 500) {
        toast.error('Server error. Please check the console for details.');
      } else {
        toast.error('Failed to save report. Please try again.');
      }
    }
  };

  const handleDeleteReport = async (id) => {
    if (!window.confirm('Delete this report? This action cannot be undone.')) return;

    try {
      await api.delete(`/api/teacher/reports/${id}`);
      setReports(reports.filter(r => r.id !== id));
      toast.success('Report deleted successfully');
    } catch (error) {
      console.error('Error deleting report:', error);
      toast.error('Failed to delete report. Please try again.');
    }
  };

  const viewReport = async (id) => {
    try {
      const response = await api.get(`/api/teacher/reports/${id}`);
      setSelectedReport(response.data);
    } catch (error) {
      console.error('Error loading report:', error);
      toast.error('Failed to load report');
    }
  };

  const resetForm = () => {
    setFormData({
      learnerId: '',
      term: 'Term 1 – 2024',
      academic_year: new Date().getFullYear().toString(),
      form: 'Form 1',
      subjects: SUBJECTS.map(name => ({ name, score: 0 })),
      comment: '',
      teacher_comment: '',
      principal_comment: '',
      attendance_days: 0,
      days_present: 0
    });
  };

  const updateSubjectScore = (index, score) => {
    const newSubjects = [...formData.subjects];
    const parsedScore = parseInt(score);
    newSubjects[index].score = isNaN(parsedScore) ? 0 : Math.min(100, Math.max(0, parsedScore));
    setFormData({ ...formData, subjects: newSubjects });
  };

  const calculateAverage = (subjects) => {
    if (!subjects || subjects.length === 0) return 0;
    const total = subjects.reduce((sum, s) => sum + (s.score || 0), 0);
    return Math.round(total / subjects.length);
  };

  // Get grade info for display
  const getGradeInfo = (score) => {
    if (score >= 75) return { letter: 'A', description: 'Excellent', color: '#1e7e4a' };
    if (score >= 65) return { letter: 'B', description: 'Very good', color: '#2a9090' };
    if (score >= 55) return { letter: 'C', description: 'Good', color: '#c9933a' };
    if (score >= 40) return { letter: 'D', description: 'Pass', color: '#f39c12' };
    return { letter: 'F', description: 'Need improvement', color: '#c0392b' };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-paper flex">
        <Sidebar />
        <main className="flex-1 p-8 flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl mb-4 animate-pulse">📚</div>
            <p className="text-muted">Loading reports...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper flex">
      <Sidebar />
      
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="page-header">
          <h1 className="page-title">Report Cards</h1>
          <p className="page-subtitle">Create and manage academic reports</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Generate Report Form */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Generate Report Card</h2>
            </div>
            <div className="card-body">
              <div className="form-group">
                <label className="form-label">Select Learner</label>
                <select
                  value={formData.learnerId}
                  onChange={(e) => {
                    const learner = learners.find(l => l.id === parseInt(e.target.value));
                    setFormData({
                      ...formData,
                      learnerId: e.target.value,
                      form: learner?.form || 'Form 1'
                    });
                  }}
                  className="form-select"
                >
                  <option value="">Select a learner</option>
                  {learners.map(learner => (
                    <option key={learner.id} value={learner.id}>
                      {learner.name} ({learner.reg_number || learner.reg})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Term</label>
                  <select
                    value={formData.term}
                    onChange={(e) => setFormData({...formData, term: e.target.value})}
                    className="form-select"
                  >
                    <option>Term 1 – 2024</option>
                    <option>Term 2 – 2024</option>
                    <option>Term 3 – 2024</option>
                    <option>Term 1 – 2025</option>
                    <option>Term 2 – 2025</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Academic Year</label>
                  <input
                    type="text"
                    value={formData.academic_year}
                    onChange={(e) => setFormData({...formData, academic_year: e.target.value})}
                    className="form-input"
                    placeholder="2024"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Form</label>
                  <select
                    value={formData.form}
                    onChange={(e) => setFormData({...formData, form: e.target.value})}
                    className="form-select"
                  >
                    <option>Form 1</option>
                    <option>Form 2</option>
                    <option>Form 3</option>
                    <option>Form 4</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Subject Scores (0–100)</label>
                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                  {formData.subjects.map((subject, index) => (
                    <div key={subject.name} className="flex items-center gap-3">
                      <label className="w-32 text-sm font-medium text-ink">
                        {subject.name}
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={subject.score || ''}
                        onChange={(e) => updateSubjectScore(index, e.target.value)}
                        className="form-input flex-1"
                        placeholder="Score"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Teacher's Comment</label>
                <textarea
                  value={formData.comment}
                  onChange={(e) => setFormData({...formData, comment: e.target.value})}
                  className="form-textarea"
                  placeholder="Write a brief comment about the learner's performance..."
                  rows="3"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Attendance Days</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.attendance_days}
                    onChange={(e) => setFormData({...formData, attendance_days: parseInt(e.target.value) || 0})}
                    className="form-input"
                    placeholder="Total days"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Days Present</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.days_present}
                    onChange={(e) => setFormData({...formData, days_present: parseInt(e.target.value) || 0})}
                    className="form-input"
                    placeholder="Days present"
                  />
                </div>
              </div>

              <button
                onClick={() => setShowReportModal(true)}
                className="btn btn-gold w-full mt-4"
                disabled={!formData.learnerId}
              >
                💾 Preview & Save Report Card
              </button>
            </div>
          </div>

          {/* Saved Reports */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Saved Reports</h2>
            </div>
            <div className="card-body p-0 overflow-x-auto">
              <table className="table w-full min-w-[500px]">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left">Learner</th>
                    <th className="px-4 py-3 text-left">Term</th>
                    <th className="px-4 py-3 text-left">Average</th>
                    <th className="px-4 py-3 text-left">Actions</th>
                  </tr>
                  </thead>
                <tbody>
                  {reports.length > 0 ? (
                    reports.map((report) => {
                      const learner = learners.find(l => l.id === report.learner_id);
                      const average = report.average_score || calculateAverage(report.subjects);
                      const gradeInfo = getGradeInfo(average);
                      return (
                        <tr key={report.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium">{learner?.name || 'Unknown'}   </td>
                          <td className="px-4 py-3">
                            <span className="badge badge-teal">{report.term}</span>
                            <div className="text-xs text-gray-500 mt-1">{report.academic_year}</div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-semibold" style={{ color: gradeInfo.color }}>
                              {average}% ({gradeInfo.letter})
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => viewReport(report.id)}
                              className="btn btn-sm btn-outline mr-2"
                            >
                              👁 View
                            </button>
                            <button
                              onClick={() => handleDeleteReport(report.id)}
                              className="btn btn-sm btn-danger"
                            >
                              ✕
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="4" className="text-center py-12 text-muted">
                        No reports yet. Create your first report card!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Preview Report Modal */}
        <Modal 
          isOpen={showReportModal} 
          onClose={() => setShowReportModal(false)}
          title="Preview Report Card"
          size="lg"
        >
          {formData.learnerId && (
            <div className="report-card">
              <div className="report-header">
                <div>
                  <div className="report-school-name">EduPortal Academy</div>
                  <div className="report-term">{formData.term} · {formData.academic_year}</div>
                  <div className="report-grade">{formData.form}</div>
                </div>
                <div className="report-student-info">
                  <div className="report-student-name">
                    {learners.find(l => l.id === parseInt(formData.learnerId))?.name}
                  </div>
                  <div className="report-reg">
                    {learners.find(l => l.id === parseInt(formData.learnerId))?.reg_number || 
                     learners.find(l => l.id === parseInt(formData.learnerId))?.reg}
                  </div>
                </div>
              </div>

              <div className="report-body">
                <div className="flex justify-between items-center mb-4">
                  <div className="text-xs font-bold uppercase tracking-wide text-muted">
                    Academic Performance
                  </div>
                  <div className="font-mono text-sm">
                    Average: <strong className="text-ink">
                      {calculateAverage(formData.subjects)}%
                    </strong>
                  </div>
                </div>

                {formData.subjects.map((subject) => {
                  const grade = getGradeFromScore(subject.score);
                  return (
                    <div key={subject.name} className="grade-row">
                      <div className="grade-subject">{subject.name}</div>
                      <div className="grade-bar">
                        <div 
                          className="grade-bar-fill" 
                          style={{ 
                            width: `${subject.score}%`,
                            backgroundColor: grade.color 
                          }}
                        />
                      </div>
                      <div className="grade-score" style={{ color: grade.color }}>
                        {subject.score}
                      </div>
                      <div className="grade-letter" style={{ color: grade.color }}>
                        {grade.letter}
                      </div>
                    </div>
                  );
                })}

                {(formData.comment || formData.teacher_comment) && (
                  <div className="comment-box">
                    <div className="comment-label">Teacher's Comment</div>
                    {formData.comment || formData.teacher_comment}
                  </div>
                )}

                {(formData.attendance_days > 0 || formData.days_present > 0) && (
                  <div className="attendance-box mt-4 p-3 bg-gray-50 rounded-lg">
                    <div className="text-xs font-bold uppercase tracking-wide text-muted mb-2">
                      Attendance Summary
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Total Days: <strong>{formData.attendance_days}</strong></span>
                      <span>Days Present: <strong>{formData.days_present}</strong></span>
                      <span>Attendance Rate: <strong>
                        {formData.attendance_days > 0 
                          ? Math.round((formData.days_present / formData.attendance_days) * 100) 
                          : 0}%
                      </strong></span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="modal-footer">
            <button 
              onClick={() => setShowReportModal(false)}
              className="btn btn-outline"
            >
              Cancel
            </button>
            <button 
              onClick={handleSaveReport}
              className="btn btn-gold"
            >
              Save Report Card
            </button>
          </div>
        </Modal>

        {/* View Report Modal */}
        <Modal 
          isOpen={!!selectedReport} 
          onClose={() => setSelectedReport(null)}
          title="Report Card"
          size="lg"
        >
          {selectedReport && (
            <div className="report-card">
              <div className="report-header">
                <div>
                  <div className="report-school-name">EduPortal Academy</div>
                  <div className="report-term">{selectedReport.term} · {selectedReport.academic_year}</div>
                  <div className="report-grade">{selectedReport.form || selectedReport.grade}</div>
                </div>
                <div className="report-student-info">
                  <div className="report-student-name">
                    {selectedReport.learners?.name || learners.find(l => l.id === selectedReport.learner_id)?.name}
                  </div>
                  <div className="report-reg">
                    {selectedReport.learners?.reg_number || 
                     learners.find(l => l.id === selectedReport.learner_id)?.reg_number ||
                     learners.find(l => l.id === selectedReport.learner_id)?.reg}
                  </div>
                </div>
              </div>

              <div className="report-body">
                <div className="flex justify-between items-center mb-4">
                  <div className="text-xs font-bold uppercase tracking-wide text-muted">
                    Academic Performance
                  </div>
                  <div className="font-mono text-sm">
                    Average: <strong className="text-ink">
                      {selectedReport.average_score || calculateAverage(selectedReport.subjects)}%
                    </strong>
                  </div>
                </div>

                {selectedReport.subjects?.map((subject) => {
                  const grade = getGradeFromScore(subject.score);
                  return (
                    <div key={subject.name} className="grade-row">
                      <div className="grade-subject">{subject.name}</div>
                      <div className="grade-bar">
                        <div 
                          className="grade-bar-fill" 
                          style={{ 
                            width: `${subject.score}%`,
                            backgroundColor: grade.color 
                          }}
                        />
                      </div>
                      <div className="grade-score" style={{ color: grade.color }}>
                        {subject.score}
                      </div>
                      <div className="grade-letter" style={{ color: grade.color }}>
                        {grade.letter}
                      </div>
                    </div>
                  );
                })}

                {(selectedReport.comment || selectedReport.teacher_comment) && (
                  <div className="comment-box">
                    <div className="comment-label">Teacher's Comment</div>
                    {selectedReport.comment || selectedReport.teacher_comment}
                  </div>
                )}

                {selectedReport.principal_comment && (
                  <div className="comment-box principal mt-3">
                    <div className="comment-label">Principal's Comment</div>
                    {selectedReport.principal_comment}
                  </div>
                )}

                {(selectedReport.attendance_days > 0 || selectedReport.days_present > 0) && (
                  <div className="attendance-box mt-4 p-3 bg-gray-50 rounded-lg">
                    <div className="text-xs font-bold uppercase tracking-wide text-muted mb-2">
                      Attendance Summary
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Total Days: <strong>{selectedReport.attendance_days || 0}</strong></span>
                      <span>Days Present: <strong>{selectedReport.days_present || 0}</strong></span>
                      <span>Attendance Rate: <strong>
                        {selectedReport.attendance_days > 0 
                          ? Math.round(((selectedReport.days_present || 0) / selectedReport.attendance_days) * 100) 
                          : 0}%
                      </strong></span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="modal-footer">
            <button 
              onClick={() => setSelectedReport(null)}
              className="btn btn-outline"
            >
              Close
            </button>
          </div>
        </Modal>
      </main>
    </div>
  );
}