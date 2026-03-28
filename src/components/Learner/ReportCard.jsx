const downloadAllReports = () => {
  if (reports.length === 0 || !user) {
    toast.error('No reports available for download');
    return;
  }

  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // Theme Colors
    const kNavy = [26, 35, 126];
    const kAzure = [0, 176, 255];
    const kSlate = [100, 116, 139];

    reports.forEach((report, index) => {
      // Add a new page for every report after the first one
      if (index > 0) doc.addPage();

      // --- 1. PREMIUM HEADER ---
      doc.setFillColor(kNavy[0], kNavy[1], kNavy[2]);
      doc.rect(0, 0, pageWidth, 45, 'F');
      
      doc.setFillColor(kAzure[0], kAzure[1], kAzure[2]);
      doc.rect(0, 45, pageWidth, 2, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.text('PROGRESS SECONDARY SCHOOL', 15, 22);
      
      doc.setFontSize(9);
      doc.setTextColor(kAzure[0], kAzure[1], kAzure[2]);
      doc.text(`CUMULATIVE ACADEMIC RECORD - ${report.term.toUpperCase()}`, 15, 30);

      // --- 2. STUDENT & TERM INFO ---
      doc.setTextColor(kNavy[0], kNavy[1], kNavy[2]);
      doc.setFontSize(10);
      
      // Row 1
      doc.setFont('helvetica', 'bold');
      doc.text('STUDENT:', 15, 60);
      doc.setFont('helvetica', 'normal');
      doc.text(user.name || 'N/A', 40, 60);
      
      doc.setFont('helvetica', 'bold');
      doc.text('TERM:', 130, 60);
      doc.setFont('helvetica', 'normal');
      doc.text(report.term, 150, 60);

      // Row 2
      doc.setFont('helvetica', 'bold');
      doc.text('REG NO:', 15, 68);
      doc.setFont('helvetica', 'normal');
      doc.text(user.reg_number || 'N/A', 40, 68);
      
      doc.setFont('helvetica', 'bold');
      doc.text('FORM:', 130, 68);
      doc.setFont('helvetica', 'normal');
      doc.text(report.form || 'N/A', 150, 68);

      // --- 3. SUBJECTS TABLE ---
      const tableColumn = ["Subject", "Score", "Grade", "Performance"];
      const tableRows = report.subjects.map(sub => [
        sub.name.toUpperCase(),
        `${sub.score}%`,
        getGradeFromScore(sub.score).letter,
        getGradeDescription(sub.score)
      ]);

      const avgScore = calculateAverage(report.subjects);
      tableRows.push([
        { content: 'OVERALL TERM AVERAGE', styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } },
        { content: `${avgScore}%`, styles: { fontStyle: 'bold', textColor: kAzure } },
        { content: getGradeFromScore(avgScore).letter, styles: { fontStyle: 'bold', textColor: kAzure } },
        { content: getGradeDescription(avgScore).toUpperCase(), styles: { fontStyle: 'bold' } }
      ]);

      autoTable(doc, {
        startY: 80,
        margin: { left: 15, right: 15 },
        head: [tableColumn],
        body: tableRows,
        theme: 'grid',
        headStyles: { fillColor: kNavy, textColor: 255, fontStyle: 'bold', halign: 'center' },
        styles: { fontSize: 9, cellPadding: 4 },
        columnStyles: { 0: { cellWidth: 70 }, 1: { halign: 'center' }, 2: { halign: 'center' }, 3: { halign: 'center' } }
      });

      // --- 4. REMARKS ---
      const finalY = doc.lastAutoTable.finalY + 15;
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(15, finalY, pageWidth - 30, 25, 3, 3, 'F');
      
      doc.setFont('helvetica', 'bold');
      doc.text("FACULTY REMARKS:", 20, finalY + 8);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(kSlate[0], kSlate[1], kSlate[2]);
      const comment = report.comment || "Standard academic progress maintained.";
      doc.text(doc.splitTextToSize(comment, pageWidth - 45), 20, finalY + 16);

      // --- 5. FOOTER & PAGINATION ---
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`Page ${index + 1} of ${reports.length}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
      doc.text(`Progress Secondary - ${new Date().getFullYear()}`, 15, pageHeight - 10);
    });

    doc.save(`${user.name.replace(/\s+/g, '_')}_Complete_Transcript.pdf`);
    toast.success('All reports merged and downloaded!');
    
  } catch (error) {
    console.error('Bulk PDF Error:', error);
    toast.error('Failed to generate multiple reports');
  }
};