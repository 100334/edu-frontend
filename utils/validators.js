// Validate learner data
export const validateLearner = (data) => {
  const errors = {};

  if (!data.name?.trim()) {
    errors.name = 'Name is required';
  }

  if (!data.grade) {
    errors.grade = 'Grade is required';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Validate report data
export const validateReport = (data) => {
  const errors = {};

  if (!data.learnerId) {
    errors.learnerId = 'Learner is required';
  }

  if (!data.term) {
    errors.term = 'Term is required';
  }

  if (!data.grade) {
    errors.grade = 'Grade is required';
  }

  if (!data.subjects || data.subjects.length === 0) {
    errors.subjects = 'At least one subject is required';
  } else {
    const invalidScores = data.subjects.some(
      s => s.score === undefined || s.score < 0 || s.score > 100
    );
    if (invalidScores) {
      errors.subjects = 'All scores must be between 0 and 100';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Validate attendance data
export const validateAttendance = (data) => {
  const errors = {};

  if (!data.learnerId) {
    errors.learnerId = 'Learner is required';
  }

  if (!data.date) {
    errors.date = 'Date is required';
  }

  if (!data.status) {
    errors.status = 'Status is required';
  } else if (!['present', 'absent', 'late'].includes(data.status)) {
    errors.status = 'Invalid status';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Validate login data
export const validateLogin = (data, role) => {
  const errors = {};

  if (role === 'teacher') {
    if (!data.username?.trim()) {
      errors.username = 'Username is required';
    }
    if (!data.password) {
      errors.password = 'Password is required';
    }
  } else {
    if (!data.name?.trim()) {
      errors.name = 'Name is required';
    }
    if (!data.regNumber?.trim()) {
      errors.regNumber = 'Registration number is required';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};