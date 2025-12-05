import React, { useContext } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import Layout from "../components/Layout/Layout";

import Dashboard from "../pages/Dashboard";
import Login from "../pages/Login";
import CourrierEntrants from "../pages/CourrierEntrants";
import CourriersSortants from "../pages/CourriersSortants";
import CourriersInternes from "../pages/CourriersInternes";
import Workflow from "../pages/Workflow";
import IA from "../pages/IA";
import Archives from "../pages/Archives";
import Administrations from "../pages/Administrations";
import Reports from "../pages/Reports";

const PrivateRoute = ({ children }) => {
  const { user } = useContext(AuthContext);
  return user ? children : <Navigate to="/login" replace />;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      {/* zone protégée */}
      <Route element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/courriers-entrants" element={<CourrierEntrants />} />
        <Route path="/courriers-sortants" element={<CourriersSortants />} />
        <Route path="/courriers-internes" element={<CourriersInternes />} />
        <Route path="/workflow" element={<Workflow />} />
        <Route path="/ia" element={<IA />} />
        <Route path="/archives" element={<Archives />} />
        <Route path="/administration" element={<Administrations />} />
        <Route path="/reports" element={<Reports />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;
