import axios from "axios";

const API_BASE_URL = "http://localhost:8000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

// ----------------------------
// Gestion du Token (AUTHTOKEN)
// ----------------------------
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
// AUTHENTIFICATION
// ----------------------------
export const login = async (email, password) => {
  const res = await api.post("users/auth/login/", { email, password });

  const token = res.data.token;
  const user = res.data.user;

  // Sauvegarde locale
  localStorage.setItem("auth_token", token);
  localStorage.setItem("user", JSON.stringify(user));

  // Activation Auth
  setAuthToken(token);

  return res.data;
};

export const logout = async () => {
  try {
    await api.post("/auth/logout/");
  } catch (err) {
    console.warn("Erreur logout", err);
  }

  // Suppression locale
  localStorage.removeItem("auth_token");
  localStorage.removeItem("user");
  setAuthToken(null);
};

export const getCurrentUser = () => {
  return JSON.parse(localStorage.getItem("user"));
};

// ----------------------------
// UTILISATEURS (CRUD)
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

export const partialUpdateUser = async (id, data) => {
  const res = await api.patch(`/users/users/${id}/`, data);
  return res.data;
};

export const deleteUser = async (id) => {
  const res = await api.delete(`/users/users/${id}/`);
  return res.data;
};

// ----------------------------
// PROFIL
// ----------------------------
export const getProfile = async () => {
  const res = await api.get("/users/profile/");
  return res.data;
};

export const updateProfile = async (data) => {
  const res = await api.put("/users/profile/", data);
  return res.data;
};

export const changePassword = async (oldPassword, newPassword) => {
  const res = await api.post("/users/change-password/", {
    old_password: oldPassword,
    new_password: newPassword,
  });
  return res.data;
};

export default api;
