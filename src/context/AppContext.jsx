import React, { createContext, useState, useContext } from 'react';

const AppContext = createContext();

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
};

export const AppProvider = ({ children }) => {
  const [currentLearner, setCurrentLearner] = useState(null);
  const [currentTeacher, setCurrentTeacher] = useState(null);
  const [loading, setLoading] = useState(false);

  const value = {
    currentLearner,
    setCurrentLearner,
    currentTeacher,
    setCurrentTeacher,
    loading,
    setLoading,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};