import {
  getDisplayOptionIndex,
  getOriginalOptionIndex,
  shuffleQuizQuestionOptions,
} from './shuffleQuizQuestionOptions';

test('shuffles options while preserving their original indexes and matching images', () => {
  const question = {
    options: ['First', 'Second', 'Third', 'Fourth'],
    option_images: ['first.png', 'second.png', 'third.png', 'fourth.png'],
  };

  const shuffled = shuffleQuizQuestionOptions(question);

  expect(shuffled.options).not.toEqual(question.options);
  expect(shuffled.option_order).toHaveLength(question.options.length);
  shuffled.option_order.forEach((originalIndex, displayIndex) => {
    expect(shuffled.options[displayIndex]).toBe(question.options[originalIndex]);
    expect(shuffled.option_images[displayIndex]).toBe(question.option_images[originalIndex]);
  });
});

test('maps selected and restored answer indexes to preserve the original answer key', () => {
  const question = shuffleQuizQuestionOptions({
    options: ['First', 'Second', 'Third', 'Fourth'],
  });
  const originalCorrectIndex = 2;
  const displayIndex = getDisplayOptionIndex(question, originalCorrectIndex);

  expect(question.options[displayIndex]).toBe('Third');
  expect(getOriginalOptionIndex(question, displayIndex)).toBe(originalCorrectIndex);
});
