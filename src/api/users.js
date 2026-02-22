// src/api/users.js
import axios from "axios";

const API_BASE_URL = "http://localhost:8000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common["Authorization"] = `Token ${token}`;
  } else {
    delete api.defaults.headers.common["Authorization"];
  }
};

// Charger automatiquement le token si présent
const existingToken = localStorage.getItem("auth_token");
if (existingToken) setAuthToken(existingToken);

// ----------------------------
// GESTION DES UTILISATEURS
// ----------------------------
export const getUsers = async () => {
  const res = await api.get("/users/users/");
  return res.data;
};

export const getUserById = async (id) => {
  const res = await api.get(`/users/users/${id}/`);
  return res.data;
};

export const createUser = async (data) => {
  const res = await api.post("/users/users/", data);
  return res.data;
};

export const updateUser = async (id, data) => {
  const res = await api.put(`/users/users/${id}/`, data);
  return res.data;
};

export const deleteUser = async (id) => {
  const res = await api.delete(`/users/users/${id}/`);
  return res.data;
};

export const activateUser = async (id) => {
  const res = await api.post(`/users/users/${id}/activate/`);
  return res.data;
};

export const deactivateUser = async (id) => {
  const res = await api.post(`/users/users/${id}/deactivate/`);
  return res.data;
};

// Récupérer les utilisateurs disponibles (sans service)
export const getAvailableUsers = async () => {
  const res = await api.get("/users/users/");
  const users = res.data;
  // Filtrer ceux sans service et actifs
  return users.filter(user => !user.service && user.actif);
};

// Récupérer les utilisateurs par rôle
export const getUsersByRole = async (role) => {
  const res = await api.get("/users/users/");
  const users = res.data;
  return users.filter(user => user.role === role);
};

export const getServices = async () => {
  const res = await axios.get(`/core/services/`);
  return res.data;
};
export default api;