import { buildQuestionPaperSections } from './questionPaperSections';

test('combines multiple-choice questions before short answers across quizzes', () => {
  const sections = buildQuestionPaperSections([
    {
      questions: [
        { id: 'written-1', question_type: 'short_answer', marks: 2 },
        { id: 'choice-1', question_type: 'multiple_choice', marks: 1 },
      ],
    },
    {
      questions: [
        { id: 'choice-2', question_type: 'multiple_choice', marks: 3 },
        { id: 'written-2', question_type: 'short_answer', marks: 4 },
      ],
    },
  ]);

  expect(sections.map(section => section.id)).toEqual(['A', 'B']);
  expect(sections[0].title).toBe('Multiple Choice');
  expect(sections[0].questions.map(question => question.id)).toEqual(['choice-1', 'choice-2']);
  expect(sections[0].questions.map(question => question.paperNumber)).toEqual([1, 2]);
  expect(sections[0].totalMarks).toBe(4);
  expect(sections[1].title).toBe('Short Answer');
  expect(sections[1].questions.map(question => question.id)).toEqual(['written-1', 'written-2']);
  expect(sections[1].questions.map(question => question.paperNumber)).toEqual([3, 4]);
  expect(sections[1].totalMarks).toBe(6);
});

test('omits empty sections', () => {
  const sections = buildQuestionPaperSections([
    { questions: [{ id: 'choice-1', question_type: 'multiple_choice', marks: 2 }] },
  ]);

  expect(sections.map(section => section.id)).toEqual(['A']);
});
