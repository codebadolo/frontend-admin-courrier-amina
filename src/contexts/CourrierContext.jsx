// src/contexts/CourrierContext.jsx
import React, { createContext, useState } from "react";

export const CourrierContext = createContext();

export const CourrierProvider = ({ children }) => {
  const [courriers, setCourriers] = useState([]);

  const addCourrier = (courrier) => {
    setCourriers((prev) => [...prev, courrier]);
  };

  return (
    <CourrierContext.Provider value={{ courriers, addCourrier }}>
      {children}
    </CourrierContext.Provider>
  );
};
