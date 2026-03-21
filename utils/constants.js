// Subjects list
export const SUBJECTS = [
  "Mathematics",
  "English",
  "Science",
  "Social Studies",
  "Chichewa",
  "Creative Arts"
];

// Form options for secondary school (ONLY Form 1-4)
export const FORMS = [
  "Form 1",
  "Form 2",
  "Form 3",
  "Form 4"
];

// Term options
export const TERMS = [
  "Term 1 – 2024",
  "Term 2 – 2024",
  "Term 3 – 2024",
  "Term 1 – 2025",
  "Term 2 – 2025",
  "Term 3 – 2025"
];

// Attendance status options
export const ATTENDANCE_STATUS = [
  { value: 'present', label: 'Present', color: 'green' },
  { value: 'absent', label: 'Absent', color: 'red' },
  { value: 'late', label: 'Late', color: 'gold' }
];

// Grade classification based on your requirements
export const getGradeFromScore = (score) => {
  if (score >= 75) {
    return {
      letter: 'A',
      description: 'Excellent',
      color: '#1e7e4a',
      bgColor: '#e8f5e9'
    };
  } else if (score >= 65) {
    return {
      letter: 'B',
      description: 'Very good',
      color: '#2a9090',
      bgColor: '#e0f2f1'
    };
  } else if (score >= 55) {
    return {
      letter: 'C',
      description: 'Good',
      color: '#c9933a',
      bgColor: '#fff3e0'
    };
  } else if (score >= 40) {
    return {
      letter: 'D',
      description: 'Pass',
      color: '#f39c12',
      bgColor: '#ffe6cc'
    };
  } else {
    return {
      letter: 'F',
      description: 'Need improvement',
      color: '#c0392b',
      bgColor: '#ffebee'
    };
  }
};

// Helper function to get letter grade only
export const getLetterGrade = (score) => {
  if (score >= 75) return 'A';
  if (score >= 65) return 'B';
  if (score >= 55) return 'C';
  if (score >= 40) return 'D';
  return 'F';
};

// Helper function to get grade description
export const getGradeDescription = (score) => {
  if (score >= 75) return 'Excellent';
  if (score >= 65) return 'Very good';
  if (score >= 55) return 'Good';
  if (score >= 40) return 'Pass';
  return 'Need improvement';
};

// Helper function to get grade color
export const getGradeColor = (score) => {
  if (score >= 75) return '#1e7e4a';
  if (score >= 65) return '#2a9090';
  if (score >= 55) return '#c9933a';
  if (score >= 40) return '#f39c12';
  return '#c0392b';
};