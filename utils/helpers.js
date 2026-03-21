import { format, parseISO } from 'date-fns';

// Format date
export const formatDate = (date) => {
  if (!date) return '';
  try {
    return format(typeof date === 'string' ? parseISO(date) : date, 'MMM d, yyyy');
  } catch (error) {
    return date;
  }
};

// Format time
export const formatTime = (date) => {
  if (!date) return '';
  try {
    return format(typeof date === 'string' ? parseISO(date) : date, 'h:mm a');
  } catch (error) {
    return date;
  }
};

// Format datetime
export const formatDateTime = (date) => {
  if (!date) return '';
  try {
    return format(typeof date === 'string' ? parseISO(date) : date, 'MMM d, yyyy h:mm a');
  } catch (error) {
    return date;
  }
};

// Capitalize first letter
export const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

// Generate registration number
export const generateRegNumber = (count) => {
  const year = new Date().getFullYear();
  return `EDU-${year}-${String(count + 1).padStart(4, '0')}`;
};

// Calculate average score
export const calculateAverage = (subjects) => {
  if (!subjects || subjects.length === 0) return 0;
  const sum = subjects.reduce((acc, subj) => acc + subj.score, 0);
  return Math.round(sum / subjects.length);
};

// Group by
export const groupBy = (array, key) => {
  return array.reduce((result, item) => {
    const groupKey = item[key];
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(item);
    return result;
  }, {});
};

// Sort by date
export const sortByDate = (array, dateField = 'date', ascending = false) => {
  return [...array].sort((a, b) => {
    const dateA = new Date(a[dateField]);
    const dateB = new Date(b[dateField]);
    return ascending ? dateA - dateB : dateB - dateA;
  });
};

// Download CSV
export const downloadCSV = (data, filename) => {
  const csvContent = data.map(row => 
    row.map(cell => 
      typeof cell === 'string' && cell.includes(',') ? `"${cell}"` : cell
    ).join(',')
  ).join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Debounce function
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Validate email
export const isValidEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

// Truncate text
export const truncateText = (text, length = 50) => {
  if (!text) return '';
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
};