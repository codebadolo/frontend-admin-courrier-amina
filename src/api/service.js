// src/api/service.js - COMPLET
import axios from "axios";

const API_BASE_URL = "http://localhost:8000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Intercepteur pour ajouter le token automatiquement
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("auth_token");
    if (token) {
      config.headers.Authorization = `Token ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Gestion des services
export const getServices = async () => {
  const res = await api.get("/core/services/");
  return res.data;
};

export const getServiceById = async (id) => {
  const res = await api.get(`/core/services/${id}/`);
  return res.data;
};

export const createService = async (data) => {
  const res = await api.post("/core/services/", data);
  return res.data;
};

export const updateService = async (id, data) => {
  const res = await api.put(`/core/services/${id}/`, data);
  return res.data;
};

export const deleteService = async (id) => {
  const res = await api.delete(`/core/services/${id}/`);
  return res.data;
};

// Gestion des membres
export const getServiceMembers = async (serviceId) => {
  const res = await api.get(`/core/services/${serviceId}/membres/`);
  return res.data;
};

export const addServiceMember = async (serviceId, userId) => {
  const res = await api.post(`/core/services/${serviceId}/ajouter_membre/`, {
    user_id: userId,
  });
  return res.data;
};

export const removeServiceMember = async (serviceId, userId) => {
  const res = await api.post(`/core/services/${serviceId}/retirer_membre/`, {
    user_id: userId,
  });
  return res.data;
};

export const getServiceStats = async (serviceId) => {
  const res = await api.get(`/core/services/${serviceId}/statistiques/`);
  return res.data;
};

// Dashboard agent
export const getAgentDashboard = async () => {
  const res = await api.get("/courriers/agent-dashboard/");
  return res.data;
};

export const prendreCourrierEnCharge = async (courrierId) => {
  const res = await api.post("/courriers/agent-dashboard/prendre_courrier/", {
    courrier_id: courrierId,
  });
  return res.data;
};

export default api;