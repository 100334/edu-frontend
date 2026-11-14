const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const MARGIN = 12;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const CONTENT_BOTTOM = PAGE_HEIGHT - 13;
const LINE_HEIGHT = 4.2;
const COLUMN_GAP = 8;
const COLUMN_WIDTH = (CONTENT_WIDTH - COLUMN_GAP) / 2;
const COLUMN_X = [MARGIN, MARGIN + COLUMN_WIDTH + COLUMN_GAP];
const COLUMN_DIVIDER_X = PAGE_WIDTH / 2;

const formatMarks = marks => `${marks} ${marks === 1 ? 'mark' : 'marks'}`;
const getOptionLabel = (index) => {
  let label = '';
  let remaining = index;
  do {
    label = String.fromCharCode(65 + (remaining % 26)) + label;
    remaining = Math.floor(remaining / 26) - 1;
  } while (remaining >= 0);
  return label;
};

const loadImage = async (src) => {
  const response = await fetch(src);
  if (!response.ok) throw new Error('Could not load an image for the PDF.');
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);

  try {
    const image = new Image();
    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = () => reject(new Error('Could not read an image for the PDF.'));
      image.src = objectUrl;
    });
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Could not prepare an image for the PDF.');
    context.drawImage(image, 0, 0);
    return {
      data: canvas.toDataURL('image/png'),
      width: image.naturalWidth,
      height: image.naturalHeight,
    };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
};

const fitImage = (image, maxWidth, maxHeight) => {
  if (!image) return null;
  const scale = Math.min(1, maxWidth / image.width, maxHeight / image.height);
  return { width: image.width * scale, height: image.height * scale };
};

export const downloadQuestionPaperPdf = async (paper, metadata, filename) => {
  const { jsPDF } = await import('jspdf');
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const imageSources = new Set(['/school-logo.jpeg']);
  paper.questions.forEach(question => {
    if (question.question_image) imageSources.add(question.question_image);
    (question.option_images || []).forEach(src => {
      if (src) imageSources.add(src);
    });
  });

  const images = new Map();
  for (const src of imageSources) {
    images.set(src, await loadImage(src));
  }

  const setFont = (size, style = 'normal') => {
    pdf.setFont('helvetica', style);
    pdf.setFontSize(size);
    pdf.setTextColor(0, 0, 0);
  };
  const wrapText = (text, width) => {
    const lines = pdf.splitTextToSize(String(text || ' '), width);
    return Array.isArray(lines) ? lines : [lines];
  };
  const imageSize = (src, maxWidth, maxHeight) => fitImage(images.get(src), maxWidth, maxHeight);
  const addImage = (src, x, y, maxWidth, maxHeight) => {
    const image = images.get(src);
    const size = imageSize(src, maxWidth, maxHeight);
    if (image && size) pdf.addImage(image.data, 'PNG', x, y, size.width, size.height);
    return size?.height || 0;
  };
  const addCenteredText = (text, y, width, size, style = 'normal') => {
    setFont(size, style);
    const lines = wrapText(text, width);
    pdf.text(lines, PAGE_WIDTH / 2, y, { align: 'center' });
    return lines.length * LINE_HEIGHT;
  };
  const drawFirstPageHeader = () => {
    addImage('/school-logo.jpeg', MARGIN, 8, 18, 18);
    let y = 13;
    y += addCenteredText('PROGRESS SCHOOLS', y, CONTENT_WIDTH, 14, 'bold') + 1;
    const examType = metadata.examTypes.length === 1 ? metadata.examTypes[0] : 'ASSESSMENT';
    const examYear = metadata.examYears.length === 1 ? ` - ${metadata.examYears[0]}` : '';
    y += addCenteredText(`${examType}${examYear}`, y, CONTENT_WIDTH - 26, 8, 'bold') + 1;
    y += addCenteredText(paper.title.toUpperCase(), y, CONTENT_WIDTH - 26, 11, 'bold') + 1;
    const subjectLine = metadata.subjects.length ? metadata.subjects.join(' / ') : 'General Assessment';
    y += addCenteredText(subjectLine, y, CONTENT_WIDTH - 26, 9, 'bold') + 1;
    pdf.setLineWidth(0.4);
    pdf.line(MARGIN, y, PAGE_WIDTH - MARGIN, y);
    y += 7;

    setFont(9);
    pdf.text('Name: ____________________________________', MARGIN, y);
    const formLines = wrapText(`Class/Form: ${metadata.forms.length === 1 ? metadata.forms[0] : '__________________'}`, CONTENT_WIDTH / 2 - 5);
    pdf.text(formLines, PAGE_WIDTH / 2 + 3, y);
    y += Math.max(1, formLines.length) * LINE_HEIGHT + 3;
    pdf.text('Date: __________________________', MARGIN, y);
    pdf.text(`Duration: ${paper.duration} minutes`, PAGE_WIDTH / 2 + 3, y);
    y += 7;
    pdf.text(`Total Marks: ${paper.totalMarks}`, MARGIN, y);
    y += 8;

    setFont(8, 'bold');
    pdf.text('INSTRUCTIONS', MARGIN, y);
    y += 5;
    setFont(8);
    pdf.text('1. Write your name and class in the spaces provided.', MARGIN, y);
    y += 4;
    pdf.text('2. Answer the questions in the spaces provided. Show your working where necessary.', MARGIN, y);
    y += 4;
    pdf.text("3. Each question's mark allocation is shown in brackets.", MARGIN, y);
    return y + 7;
  };
  const drawRunningHeader = () => {
    setFont(8, 'bold');
    pdf.text(paper.title, PAGE_WIDTH / 2, 10, { align: 'center' });
    pdf.setLineWidth(0.3);
    pdf.line(MARGIN, 14, PAGE_WIDTH - MARGIN, 14);
    return 21;
  };
  const drawSectionHeading = (section, y, continued = false) => {
    setFont(10, 'bold');
    const title = `SECTION ${section.id}: ${section.title}${continued ? ' (continued)' : ''}`;
    pdf.text(title, MARGIN, y);
    if (!continued) {
      pdf.text(`(${formatMarks(section.totalMarks)})`, PAGE_WIDTH - MARGIN, y, { align: 'right' });
    }
    pdf.setLineWidth(0.25);
    pdf.line(MARGIN, y + 2, PAGE_WIDTH - MARGIN, y + 2);
    return y + 7;
  };
  const addContinuationPage = (section) => {
    pdf.addPage();
    return drawSectionHeading(section, drawRunningHeader(), true);
  };
  const layoutMultipleChoiceQuestion = (question) => {
    const markLabel = `(${formatMarks(question.marks)})`;
    setFont(8, 'bold');
    const markWidth = pdf.getTextWidth(markLabel) + 2;
    setFont(9);
    const number = `${question.paperNumber}.`;
    setFont(9, 'bold');
    const numberWidth = pdf.getTextWidth(number) + 1;
    setFont(9);
    const titleLines = wrapText(question.question_text, COLUMN_WIDTH - numberWidth - markWidth);
    const questionImage = question.question_image
      ? imageSize(question.question_image, COLUMN_WIDTH - 4, 38)
      : null;
    const options = (question.options || []).map((option, index) => {
      setFont(8);
      const lines = wrapText(option, COLUMN_WIDTH - 11);
      const image = question.option_images?.[index]
        ? imageSize(question.option_images[index], COLUMN_WIDTH - 12, 25)
        : null;
      return { label: getOptionLabel(index), lines, image };
    });
    let height = Math.max(1, titleLines.length) * LINE_HEIGHT + 1.5;
    if (questionImage) height += questionImage.height + 3;
    options.forEach(option => {
      height += Math.max(LINE_HEIGHT, option.lines.length * LINE_HEIGHT) + 1;
      if (option.image) height += option.image.height + 1;
    });
    return { markLabel, number, numberWidth, titleLines, questionImage, options, height: height + 2 };
  };
  const drawMultipleChoiceQuestion = (question, layout, x, y) => {
    setFont(9, 'bold');
    pdf.text(layout.number, x, y + LINE_HEIGHT);
    setFont(9);
    pdf.text(layout.titleLines, x + layout.numberWidth, y + LINE_HEIGHT);
    setFont(8, 'bold');
    pdf.text(layout.markLabel, x + COLUMN_WIDTH, y + LINE_HEIGHT, { align: 'right' });
    y += Math.max(1, layout.titleLines.length) * LINE_HEIGHT + 1.5;

    if (layout.questionImage) {
      y += 1;
      y += addImage(question.question_image, x + 2, y, COLUMN_WIDTH - 4, 38) + 2;
    }
    layout.options.forEach((option, index) => {
      const centerX = x + 2.5;
      const centerY = y + 2.3;
      pdf.setLineWidth(0.35);
      pdf.circle(centerX, centerY, 2.2, 'S');
      setFont(7.5, 'bold');
      pdf.text(option.label, centerX, centerY + 1, { align: 'center' });
      setFont(8);
      pdf.text(option.lines, x + 7, y + 3.1);
      y += Math.max(LINE_HEIGHT, option.lines.length * LINE_HEIGHT) + 1;
      if (option.image) {
        y += addImage(question.option_images[index], x + 7, y, COLUMN_WIDTH - 12, 25) + 1;
      }
    });
    return y + 2;
  };
  const layoutShortAnswerQuestion = (question) => {
    const markLabel = `(${formatMarks(question.marks)})`;
    setFont(8, 'bold');
    const markWidth = pdf.getTextWidth(markLabel) + 2;
    const number = `${question.paperNumber}.`;
    setFont(9, 'bold');
    const numberWidth = pdf.getTextWidth(number) + 1;
    setFont(9);
    const titleLines = wrapText(question.question_text, CONTENT_WIDTH - numberWidth - markWidth);
    const questionImage = question.question_image
      ? imageSize(question.question_image, CONTENT_WIDTH, 55)
      : null;
    const answerLines = Math.min(10, Math.max(2, question.marks * 2));
    return {
      markLabel,
      number,
      numberWidth,
      titleLines,
      questionImage,
      answerLines,
      height: Math.max(1, titleLines.length) * LINE_HEIGHT + (questionImage ? questionImage.height + 3 : 1)
        + answerLines * 4.6 + 4,
    };
  };
  const drawShortAnswerQuestion = (question, layout, y) => {
    setFont(9, 'bold');
    pdf.text(layout.number, MARGIN, y + LINE_HEIGHT);
    setFont(9);
    pdf.text(layout.titleLines, MARGIN + layout.numberWidth, y + LINE_HEIGHT);
    setFont(8, 'bold');
    pdf.text(layout.markLabel, PAGE_WIDTH - MARGIN, y + LINE_HEIGHT, { align: 'right' });
    y += Math.max(1, layout.titleLines.length) * LINE_HEIGHT + 1;

    if (layout.questionImage) {
      y += 1;
      y += addImage(question.question_image, MARGIN, y, CONTENT_WIDTH, 55) + 2;
    }
    pdf.setLineWidth(0.2);
    pdf.setDrawColor(120);
    for (let index = 0; index < layout.answerLines; index += 1) {
      y += 4.6;
      pdf.line(MARGIN, y, PAGE_WIDTH - MARGIN, y);
    }
    pdf.setDrawColor(0);
    return y + 3;
  };

  const firstPageY = drawFirstPageHeader();
  let currentY = firstPageY;
  const dividerPages = new Map();
  const mcqSection = paper.sections.find(section => section.id === 'A');

  if (mcqSection) {
    currentY = drawSectionHeading(mcqSection, currentY);
    let columnY = [currentY, currentY];
    let columnIndex = 0;
    dividerPages.set(pdf.getNumberOfPages(), { start: currentY, end: CONTENT_BOTTOM });

    for (const question of mcqSection.questions) {
      const layout = layoutMultipleChoiceQuestion(question);
      if (columnY[columnIndex] + layout.height > CONTENT_BOTTOM && columnIndex === 0) {
        columnIndex = 1;
      }
      if (columnY[columnIndex] + layout.height > CONTENT_BOTTOM) {
        dividerPages.get(pdf.getNumberOfPages()).end = CONTENT_BOTTOM;
        currentY = addContinuationPage(mcqSection);
        columnY = [currentY, currentY];
        columnIndex = 0;
        dividerPages.set(pdf.getNumberOfPages(), { start: currentY, end: CONTENT_BOTTOM });
      }
      columnY[columnIndex] = drawMultipleChoiceQuestion(question, layout, COLUMN_X[columnIndex], columnY[columnIndex]) + 3;
    }
    currentY = Math.max(columnY[0], columnY[1]) - 3;
    dividerPages.get(pdf.getNumberOfPages()).end = Math.min(CONTENT_BOTTOM, currentY);
  }

  const shortAnswerSection = paper.sections.find(section => section.id === 'B');
  if (shortAnswerSection) {
    if (currentY + 10 > CONTENT_BOTTOM) {
      pdf.addPage();
      currentY = drawRunningHeader();
    }
    currentY = drawSectionHeading(shortAnswerSection, currentY);
    for (const question of shortAnswerSection.questions) {
      const layout = layoutShortAnswerQuestion(question);
      if (currentY + layout.height > CONTENT_BOTTOM) {
        pdf.addPage();
        currentY = drawSectionHeading(shortAnswerSection, drawRunningHeader(), true);
      }
      currentY = drawShortAnswerQuestion(question, layout, currentY);
    }
  }

  const pageCount = pdf.getNumberOfPages();
  dividerPages.forEach(({ start, end }, page) => {
    pdf.setPage(page);
    pdf.setDrawColor(110);
    pdf.setLineWidth(0.25);
    pdf.line(COLUMN_DIVIDER_X, start, COLUMN_DIVIDER_X, end);
  });
  for (let page = 1; page <= pageCount; page += 1) {
    pdf.setPage(page);
    setFont(8);
    pdf.setTextColor(90);
    pdf.text(`Page ${page} of ${pageCount}`, PAGE_WIDTH / 2, PAGE_HEIGHT - 5, { align: 'center' });
  }

  pdf.setProperties({ title: paper.title, subject: metadata.subjects.join(', ') });
  pdf.save(filename);
};
