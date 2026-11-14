export const buildQuestionPaperSections = (quizzes) => {
  const allQuestions = quizzes.flatMap(quiz => quiz.questions || []);
  const sectionDefinitions = [
    {
      id: 'A',
      title: 'Multiple Choice',
      questions: allQuestions.filter(question => question.question_type === 'multiple_choice'),
    },
    {
      id: 'B',
      title: 'Short Answer',
      questions: allQuestions.filter(question => question.question_type !== 'multiple_choice'),
    },
  ].filter(section => section.questions.length > 0);

  let paperQuestionNumber = 0;
  return sectionDefinitions.map(section => {
    const questions = section.questions.map(question => {
      paperQuestionNumber += 1;
      return { ...question, paperNumber: paperQuestionNumber };
    });

    return {
      ...section,
      questions,
      totalMarks: questions.reduce((total, question) => total + question.marks, 0),
    };
  });
};
