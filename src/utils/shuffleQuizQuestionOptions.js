export const shuffleQuizQuestionOptions = (question) => {
  if (!Array.isArray(question.options) || question.options.length < 2) {
    return question;
  }

  const optionOrder = question.options.map((_, index) => index);
  for (let index = optionOrder.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [optionOrder[index], optionOrder[swapIndex]] = [optionOrder[swapIndex], optionOrder[index]];
  }

  if (optionOrder.every((originalIndex, index) => originalIndex === index)) {
    [optionOrder[0], optionOrder[1]] = [optionOrder[1], optionOrder[0]];
  }

  return {
    ...question,
    options: optionOrder.map(index => question.options[index]),
    option_images: Array.isArray(question.option_images)
      ? optionOrder.map(index => question.option_images[index])
      : question.option_images,
    option_order: optionOrder,
  };
};

export const getOriginalOptionIndex = (question, displayIndex) =>
  question?.option_order?.[displayIndex] ?? displayIndex;

export const getDisplayOptionIndex = (question, originalIndex) => {
  const displayIndex = question?.option_order?.indexOf(Number(originalIndex)) ?? -1;
  return displayIndex === -1 ? originalIndex : displayIndex;
};
