// src/routes/AppRoutes.jsx
import React, { useContext } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import Layout from "../components/Layout/Layout";

// Pages existantes
import Dashboard from "../pages/Dashboard";
import Login from "../pages/Login";
import CourrierEntrants from "../pages/courriers/CourrierEntrants";
import CourriersSortants from "../pages/courriers/CourriersSortants";
import CourriersInternes from "../pages/courriers/CourriersInternes";
import Workflow from "../pages/Workflow";
import IA from "../pages/IA";
import Archives from "../pages/Archives";
import Services from "../pages/Services";
import Administrations from "../pages/Administrations";
import Reports from "../pages/Reports";
import DashboardAdmin from "../pages/admin/DashboardAdmin";
import ImputationDashboard from "../pages/courriers/ImputationDashboard";
import CourrierEntrantDetail from "../pages/courriers/CourrierEntrantDetail";

// ⚡ NOUVEAU : Import des composants de traitement
import TraitementDashboard from "../pages/traitement/TraitementDashboard";
import TraitementCourrierList from "../pages/traitement/TraitementCourrierList";
import TraitementCourrierDetail from "../pages/traitement/TraitementCourrierDetail";

const PrivateRoute = ({ children }) => {
  const { user } = useContext(AuthContext);
  return user ? children : <Navigate to="/login" replace />;
};

const AdminRoute = ({ children }) => {
  const { user } = useContext(AuthContext);
  return user && user.role === 'admin' ? children : <Navigate to="/" replace />;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      {/* Zone protégée */}
      <Route element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/courriers-entrants" element={<CourrierEntrants />} />
        <Route path="/courriers-sortants" element={<CourriersSortants />} />
        <Route path="/courriers-internes" element={<CourriersInternes />} />
        <Route path="/workflow" element={<Workflow />} />
        <Route path="/courriers-entrants/:id" element={<CourrierEntrantDetail />} />
        <Route path="/ia" element={<IA />} />
        <Route path="/archives" element={<Archives />} />
        <Route path="/administration" element={<Administrations />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/services-admin" element={<Services />} />
        <Route path="/imputation" element={<ImputationDashboard />} />
        <Route path="/traitement/dashboard" element={<TraitementDashboard />} />
        <Route path="/traitement/courriers" element={<TraitementCourrierList />} />
        <Route path="/traitement/courriers/:id" element={<TraitementCourrierDetail />} />
        {/* Route spécifique admin */}
        <Route 
          path="/admin-dashboard" 
          element={
            <AdminRoute>
              <DashboardAdmin />
            </AdminRoute>
          } 
        />
      </Route>
    </Routes>
  );
};

export default AppRoutes;