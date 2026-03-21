import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '../../components/common/Sidebar';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { getGradeFromScore } from '../../utils/constants';
import { ArrowDownTrayIcon, DocumentTextIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Theme colors
const kNavy = '#1A237E';
const kAzure = '#00B0FF';
const kIceWhite = '#F4F7FA';

export default function LearnerReportCard() {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTerm, setSelectedTerm] = useState('');
  const [fetchError, setFetchError] = useState(null);
  const reportRef = useRef(null);

  useEffect(() => {
    // Set a timeout to prevent infinite loading
    const loadingTimeout = setTimeout(() => {
      if (loading) {
        setLoading(false);
        setFetchError('Request timed out. Please try again.');
      }
    }, 10000); // 10 second timeout for loading

    // Only fetch if user exists
    if (user?.id) {
      loadReports();
    } else if (user === null) {
      // User is null (not loading), stop loading
      setLoading(false);
      setFetchError('Please log in to view your reports.');
    }

    return () => clearTimeout(loadingTimeout);
  }, [user]); // Add user as dependency

  const loadReports = async () => {
    // Guard clause - check if user exists
    if (!user?.id) {
      console.log('No user ID available, skipping report fetch');
      setLoading(false);
      setFetchError('User not authenticated');
      return;
    }

    try {
      console.log('Fetching reports for user:', user.id);
      const response = await api.get(`/api/learner/reports`);
      
      if (response.data) {
        setReports(response.data);
        if (response.data.length > 0) {
          setSelectedTerm(response.data[0].term);
        }
      }
    } catch (error) {
      console.error('Failed to load reports:', error);
      
      // Handle different error types
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        setFetchError('Server is taking too long to respond. Please try again.');
      } else if (error.response?.status === 401) {
        setFetchError('Your session has expired. Please login again.');
      } else if (error.response?.status === 404) {
        setFetchError('No reports found for this learner.');
      } else if (error.response?.status === 500) {
        setFetchError('Server error. Please try again later.');
      } else if (error.message === 'Network Error') {
        setFetchError('Cannot connect to server. Please check your connection.');
      } else {
        setFetchError('Failed to load reports. Please try again.');
      }
      
      // Only show toast for critical errors
      if (error.response?.status !== 404 && error.code !== 'ECONNABORTED') {
        toast.error('Failed to load reports');
      }
    } finally {
      setLoading(false);
    }
  };

  const selectedReport = reports.find(r => r.term === selectedTerm);

  const calculateAverage = (subjects) => {
    if (!subjects || subjects.length === 0) return 0;
    const sum = subjects.reduce((acc, subj) => acc + subj.score, 0);
    return Math.round(sum / subjects.length);
  };

  // Updated grade description based on new grading system
  const getGradeDescription = (score) => {
    if (score >= 75) return 'Excellent';
    if (score >= 65) return 'Very Good';
    if (score >= 55) return 'Good';
    if (score >= 40) return 'Pass';
    return 'Need improvement';
  };

  const downloadPDF = () => {
    if (!selectedReport) {
      toast.error('No report selected');
      return;
    }
    
    if (!user) {
      toast.error('User not authenticated');
      return;
    }

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const azureColor = [0, 176, 255];
      const navyColor = [26, 35, 126];
      
      // 1. PAGE BORDER
      doc.setDrawColor(azureColor[0], azureColor[1], azureColor[2]);
      doc.setLineWidth(0.5);
      doc.rect(5, 5, pageWidth - 10, pageHeight - 10);
      doc.setLineWidth(1.5);
      doc.rect(7, 7, pageWidth - 14, pageHeight - 14);
      
      // 2. HEADER SECTION
      doc.setFillColor(248, 250, 252);
      doc.rect(7, 7, pageWidth - 14, 45, 'F');
      
      doc.setFillColor(azureColor[0], azureColor[1], azureColor[2]);
      doc.rect(7, 52, pageWidth - 14, 2, 'F');
      
      doc.setTextColor(navyColor[0], navyColor[1], navyColor[2]);
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text('PROGRESS SECONDARY SCHOOL', pageWidth / 2, 25, { align: 'center' });
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(100, 116, 139);
      doc.text('Scholastica, Excellentia et Disciplina', pageWidth / 2, 35, { align: 'center' });

      // 3. STUDENT INFO BOX
      doc.setDrawColor(azureColor[0], azureColor[1], azureColor[2]);
      doc.setLineWidth(0.2);
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(15, 62, pageWidth - 30, 40, 2, 2, 'FD');
      
      doc.setTextColor(azureColor[0], azureColor[1], azureColor[2]);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('OFFICIAL REPORT CARD', 20, 72);
      
      doc.setTextColor(navyColor[0], navyColor[1], navyColor[2]);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Student: ${user?.name || 'N/A'}`, 20, 82);
      doc.text(`ID: ${user?.reg_number || 'N/A'}`, 20, 92);
      
      doc.text(`Term: ${selectedReport?.term || 'N/A'}`, pageWidth - 85, 82);
      doc.text(`Form: ${selectedReport?.form || selectedReport?.grade || 'N/A'}`, pageWidth - 85, 92);

      // 4. ACADEMIC PERFORMANCE TABLE
      const tableColumn = ["Subject", "Score", "Grade", "Remarks"];
      const tableRows = selectedReport?.subjects?.map(subject => {
        const grade = getGradeFromScore(subject.score);
        return [
          subject.name,
          `${subject.score}%`,
          grade.letter,
          getGradeDescription(subject.score)
        ];
      }) || [];

      if (tableRows.length > 0) {
        const avgScore = calculateAverage(selectedReport?.subjects);
        const avgGrade = getGradeFromScore(avgScore);
        
        tableRows.push([
          { content: 'OVERALL AVERAGE', styles: { fontStyle: 'bold', fillColor: [240, 249, 255] } },
          { content: `${avgScore}%`, styles: { fontStyle: 'bold', textColor: azureColor } },
          { content: avgGrade.letter, styles: { fontStyle: 'bold', textColor: azureColor } },
          { content: getGradeDescription(avgScore), styles: { fontStyle: 'bold' } }
        ]);

        autoTable(doc, {
          startY: 115,
          margin: { left: 15, right: 15 },
          head: [tableColumn],
          body: tableRows,
          theme: 'grid',
          headStyles: {
            fillColor: azureColor,
            textColor: 255,
            fontStyle: 'bold',
            halign: 'center',
            fontSize: 11
          },
          styles: {
            lineColor: [200, 220, 240],
            lineWidth: 0.1,
            fontSize: 10
          },
          bodyStyles: {
            textColor: navyColor
          },
          alternateRowStyles: {
            fillColor: [248, 250, 252]
          },
          columnStyles: {
            0: { cellWidth: 60 },
            1: { halign: 'center', cellWidth: 30 },
            2: { halign: 'center', cellWidth: 30 },
            3: { halign: 'center', cellWidth: 60 }
          }
        });
      }

      // 5. TEACHER COMMENTS
      const finalY = doc.lastAutoTable?.finalY + 10 || 200;
      
      doc.setDrawColor(azureColor[0], azureColor[1], azureColor[2]);
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(15, finalY, pageWidth - 30, 35, 2, 2, 'FD');
      
      doc.setFillColor(azureColor[0], azureColor[1], azureColor[2]);
      doc.rect(15, finalY, 4, 35, 'F');
      
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(azureColor[0], azureColor[1], azureColor[2]);
      doc.text("Principal's Remarks:", 22, finalY + 8);
      
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(navyColor[0], navyColor[1], navyColor[2]);
      const splitComment = doc.splitTextToSize(selectedReport?.comment || "No comments provided.", pageWidth - 50);
      doc.text(splitComment, 22, finalY + 16);

      // 6. FOOTER
      const footerY = pageHeight - 20;
      doc.setDrawColor(azureColor[0], azureColor[1], azureColor[2]);
      doc.setLineWidth(0.3);
      doc.line(15, footerY - 5, pageWidth - 15, footerY - 5);
      
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text('Generated on: ' + new Date().toLocaleString(), 15, footerY);
      doc.text('Progress Secondary - Official Document', pageWidth - 15, footerY, { align: 'right' });

      const fileName = user?.name 
        ? `${user.name.replace(/\s+/g, '_')}_${selectedReport?.term.replace(/\s+/g, '_')}_Report.pdf`
        : 'report_card.pdf';
      
      doc.save(fileName);
      toast.success('Report card downloaded successfully!');
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('Failed to generate PDF');
    }
  };

  const downloadAllReports = () => {
    if (reports.length === 0) {
      toast.error('No reports to download');
      return;
    }
    
    if (!user) {
      toast.error('User not authenticated');
      return;
    }
    
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const azureColor = [0, 176, 255];
      const navyColor = [26, 35, 126];
      let currentPage = 1;

      reports.forEach((report, index) => {
        if (index > 0) {
          doc.addPage();
          currentPage++;
        }

        // Page border
        doc.setDrawColor(azureColor[0], azureColor[1], azureColor[2]);
        doc.setLineWidth(0.5);
        doc.rect(5, 5, pageWidth - 10, pageHeight - 10);
        doc.setLineWidth(1.5);
        doc.rect(7, 7, pageWidth - 14, pageHeight - 14);

        // Header
        doc.setFillColor(248, 250, 252);
        doc.rect(7, 7, pageWidth - 14, 45, 'F');
        
        doc.setFillColor(azureColor[0], azureColor[1], azureColor[2]);
        doc.rect(7, 52, pageWidth - 14, 2, 'F');
        
        doc.setTextColor(navyColor[0], navyColor[1], navyColor[2]);
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.text('PROGRESS SECONDARY SCHOOL', pageWidth / 2, 25, { align: 'center' });
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(100, 116, 139);
        doc.text('Scholastica, Excellentia et Disciplina', pageWidth / 2, 35, { align: 'center' });

        // Report Title
        doc.setTextColor(azureColor[0], azureColor[1], azureColor[2]);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text(`${report.term} - Report Card`, pageWidth / 2, 70, { align: 'center' });

        // Student Info Box
        doc.setDrawColor(azureColor[0], azureColor[1], azureColor[2]);
        doc.setLineWidth(0.2);
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(15, 80, pageWidth - 30, 35, 2, 2, 'FD');
        
        doc.setTextColor(navyColor[0], navyColor[1], navyColor[2]);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Student: ${user?.name || 'N/A'}`, 20, 90);
        doc.text(`ID: ${user?.reg_number || 'N/A'}`, 20, 98);
        doc.text(`Form: ${report.form || report.grade || 'N/A'}`, 20, 106);
        
        doc.text(`Term: ${report.term || 'N/A'}`, pageWidth - 80, 90);
        doc.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth - 80, 98);

        // Subjects Table
        const tableColumn = ["Subject", "Score", "Grade", "Remarks"];
        const tableRows = report.subjects?.map(subject => {
          const grade = getGradeFromScore(subject.score);
          return [subject.name, `${subject.score}%`, grade.letter, getGradeDescription(subject.score)];
        }) || [];

        if (tableRows.length > 0) {
          const avgScore = calculateAverage(report.subjects);
          const avgGrade = getGradeFromScore(avgScore);
          
          tableRows.push([
            { content: 'OVERALL AVERAGE', styles: { fontStyle: 'bold', fillColor: [240, 249, 255] } },
            { content: `${avgScore}%`, styles: { fontStyle: 'bold', textColor: azureColor } },
            { content: avgGrade.letter, styles: { fontStyle: 'bold', textColor: azureColor } },
            { content: getGradeDescription(avgScore), styles: { fontStyle: 'bold' } }
          ]);

          autoTable(doc, {
            startY: 125,
            margin: { left: 15, right: 15 },
            head: [tableColumn],
            body: tableRows,
            theme: 'grid',
            headStyles: {
              fillColor: azureColor,
              textColor: 255,
              fontStyle: 'bold',
              halign: 'center'
            },
            bodyStyles: {
              textColor: navyColor
            },
            alternateRowStyles: {
              fillColor: [248, 250, 252]
            }
          });
        }

        // Page number
        const footerY = pageHeight - 15;
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`Page ${currentPage} of ${reports.length}`, pageWidth - 30, footerY);
      });

      const fileName = user?.name 
        ? `${user.name.replace(/\s+/g, '_')}_All_Reports.pdf`
        : 'all_reports.pdf';
      
      doc.save(fileName);
      toast.success('All reports downloaded successfully!');
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('Failed to generate PDFs');
    }
  };

  const retryLoading = () => {
    setLoading(true);
    setFetchError(null);
    if (user?.id) {
      loadReports();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar />
        <main className="flex-1 p-8 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1A237E] mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your report cards...</p>
          </div>
        </main>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar />
        <main className="flex-1 p-8 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">⚠️</span>
            </div>
            <h2 className="text-xl font-bold text-[#1A237E] mb-2">Unable to Load Reports</h2>
            <p className="text-gray-600 mb-6">{fetchError}</p>
            <button
              onClick={retryLoading}
              className="px-6 py-2 bg-[#1A237E] text-white rounded-lg hover:bg-[#1A237E]/90 transition-colors"
            >
              Try Again
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      
      <main className="flex-1 p-8 overflow-y-auto">
        {/* Header Section */}
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="font-serif text-3xl font-bold text-[#1A237E] mb-2">My Report Cards</h1>
            <p className="text-gray-500">View and download your academic performance</p>
          </div>
          
          {reports.length > 0 && (
            <button
              onClick={downloadAllReports}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#00B0FF] text-white rounded-lg hover:bg-[#00B0FF]/80 transition-all shadow-md hover:shadow-lg"
            >
              <ArrowDownTrayIcon className="w-5 h-5" />
              <span className="font-medium">Download All Reports</span>
            </button>
          )}
        </div>

        {reports.length > 0 ? (
          <>
            {/* Term Selector */}
            <div className="mb-8 max-w-xs">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Term
              </label>
              <div className="relative">
                <select
                  value={selectedTerm}
                  onChange={(e) => setSelectedTerm(e.target.value)}
                  className="w-full px-4 py-3 bg-white border-2 border-[#00B0FF]/20 rounded-lg text-gray-900 font-sans
                           focus:outline-none focus:border-[#00B0FF] focus:ring-2 focus:ring-[#00B0FF]/20 appearance-none
                           hover:border-[#00B0FF]/40 transition-all cursor-pointer"
                >
                  {reports.map(report => (
                    <option key={report.id} value={report.term}>
                      {report.term}
                    </option>
                  ))}
                </select>
                <ChevronDownIcon className="absolute right-3 top-1/2 transform translate-y-1/2 w-5 h-5 text-[#00B0FF] pointer-events-none" />
              </div>
            </div>

            {selectedReport && (
              <div ref={reportRef} className="bg-white rounded-xl border-2 border-[#00B0FF]/20 shadow-lg overflow-hidden relative group hover:border-[#00B0FF]/40 transition-all">
                {/* Download Button */}
                <button
                  onClick={downloadPDF}
                  className="absolute top-4 right-4 flex items-center gap-2 px-4 py-2 bg-[#00B0FF] text-white rounded-lg 
                           md:opacity-0 md:group-hover:opacity-100 transition-all shadow-lg hover:bg-[#00B0FF]/80 z-10
                           opacity-100 md:opacity-0"
                >
                  <ArrowDownTrayIcon className="w-4 h-4" />
                  <span className="text-sm hidden sm:inline">Download PDF</span>
                </button>

                {/* Report Header */}
                <div className="bg-gradient-to-r from-[#1A237E] to-[#0D1240] text-white p-8">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <h2 className="font-serif text-2xl font-bold text-[#00B0FF] mb-2">PROGRESS SECONDARY SCHOOL</h2>
                      <p className="text-white/60 text-sm">{selectedReport.term} · {selectedReport.form || selectedReport.grade}</p>
                    </div>
                    <div className="text-left md:text-right">
                      <p className="font-serif text-xl font-semibold text-white">{user?.name}</p>
                      <p className="font-mono text-sm text-white/60 mt-1">{user?.reg_number}</p>
                    </div>
                  </div>
                </div>

                {/* Report Body */}
                <div className="p-8">
                  {/* Performance Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="bg-gray-50 p-4 rounded-xl border border-[#00B0FF]/20">
                      <p className="text-xs text-gray-500 mb-1">Subjects</p>
                      <p className="text-2xl font-bold text-[#1A237E]">{selectedReport.subjects?.length || 0}</p>
                      <div className="mt-2 h-1 bg-gray-200 rounded-full">
                        <div className="w-full h-1 bg-[#00B0FF] rounded-full"></div>
                      </div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-xl border border-[#00B0FF]/20">
                      <p className="text-xs text-gray-500 mb-1">Average Score</p>
                      <p className="text-2xl font-bold text-[#00B0FF]">
                        {calculateAverage(selectedReport.subjects)}%
                      </p>
                      <div className="mt-2 h-1 bg-gray-200 rounded-full">
                        <div 
                          className="h-1 bg-[#00B0FF] rounded-full transition-all duration-500" 
                          style={{ width: `${calculateAverage(selectedReport.subjects)}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-xl border border-[#00B0FF]/20">
                      <p className="text-xs text-gray-500 mb-1">Performance</p>
                      <p className="text-xl font-bold text-[#1A237E]">
                        {getGradeDescription(calculateAverage(selectedReport.subjects))}
                      </p>
                      <p className="text-xs text-[#00B0FF] mt-2">Overall Rating</p>
                    </div>
                  </div>

                  {/* Subjects Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b-2 border-[#00B0FF]/20">
                          <th className="text-left py-3 text-sm font-semibold text-gray-700">Subject</th>
                          <th className="text-center py-3 text-sm font-semibold text-gray-700">Score</th>
                          <th className="text-center py-3 text-sm font-semibold text-gray-700">Grade</th>
                          <th className="text-left py-3 text-sm font-semibold text-gray-700">Performance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {selectedReport.subjects?.map((subject, index) => {
                          const grade = getGradeFromScore(subject.score);
                          return (
                            <tr key={index} className="hover:bg-gray-50 transition-colors">
                              <td className="py-3 text-gray-900 font-medium">{subject.name}</td>
                              <td className="py-3 text-center">
                                <span className="font-mono font-bold" style={{ color: grade.color }}>
                                  {subject.score}
                                </span>
                              </td>
                              <td className="py-3 text-center">
                                <span className="px-2 py-1 rounded text-xs font-bold" style={{ 
                                  color: grade.color,
                                  backgroundColor: `${grade.color}15`
                                }}>
                                  {grade.letter}
                                </span>
                              </td>
                              <td className="py-3 text-gray-600">{getGradeDescription(subject.score)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot className="bg-[#00B0FF]/5 border-t-2 border-[#00B0FF]/20">
                        <tr>
                          <td className="py-3 font-bold text-[#1A237E]">AVERAGE</td>
                          <td className="py-3 text-center font-mono font-bold text-[#00B0FF]">
                            {calculateAverage(selectedReport.subjects)}%
                          </td>
                          <td className="py-3 text-center">
                            <span className="px-2 py-1 rounded text-xs font-bold text-[#00B0FF] bg-[#00B0FF]/10">
                              {getGradeFromScore(calculateAverage(selectedReport.subjects)).letter}
                            </span>
                          </td>
                          <td className="py-3 text-gray-700 font-medium">
                            {getGradeDescription(calculateAverage(selectedReport.subjects))}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {/* Teacher's Comment */}
                  {selectedReport.comment && (
                    <div className="mt-8 p-5 bg-gray-50 rounded-xl border-l-4 border-[#00B0FF]">
                      <p className="text-[#00B0FF] text-xs font-bold uppercase tracking-wider mb-2">Teacher's Comment</p>
                      <p className="text-gray-700 italic">"{selectedReport.comment}"</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="bg-white rounded-xl border-2 border-[#00B0FF]/20 shadow-lg p-12 text-center">
            <div className="w-20 h-20 mx-auto mb-4 bg-[#00B0FF]/5 rounded-full flex items-center justify-center border-2 border-[#00B0FF]/20">
              <DocumentTextIcon className="w-10 h-10 text-[#00B0FF]" />
            </div>
            <h3 className="text-xl font-semibold text-[#1A237E] mb-2">No Reports Available</h3>
            <p className="text-gray-500 max-w-md mx-auto">
              No report cards have been generated for you yet. Check back after your next assessment.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}