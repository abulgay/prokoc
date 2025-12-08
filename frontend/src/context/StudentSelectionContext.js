import React, { createContext, useState, useContext } from 'react';

const StudentSelectionContext = createContext(null);

export const StudentSelectionProvider = ({ children }) => {
  const [selectedStudent, setSelectedStudent] = useState(null);

  return (
    <StudentSelectionContext.Provider value={{ selectedStudent, setSelectedStudent }}>
      {children}
    </StudentSelectionContext.Provider>
  );
};

export const useStudentSelection = () => {
  const context = useContext(StudentSelectionContext);
  if (!context) {
    throw new Error('useStudentSelection must be used within StudentSelectionProvider');
  }
  return context;
};
