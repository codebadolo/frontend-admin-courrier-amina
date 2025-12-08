// src/services/userService.js
import axios from "axios";

const API_BASE_URL = "http://localhost:8000/api";

// ----------------------------
// INSTANCE AXIOS
// ----------------------------
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// ----------------------------
// Gestion du Token
// ----------------------------
export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common["Authorization"];
  }
};

// ----------------------------
// Refresh automatique
// ----------------------------
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refresh = localStorage.getItem("refresh_token");
      if (!refresh) {
        logout();
        return Promise.reject(error);
      }
      try {
        const res = await axios.post(`${API_BASE_URL}/users/auth/refresh/`, { refresh });
        const newAccess = res.data.access;
        localStorage.setItem("access_token", newAccess);
        setAuthToken(newAccess);
        originalRequest.headers["Authorization"] = `Bearer ${newAccess}`;
        return api(originalRequest);
      } catch (err) {
        logout();
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);

// ----------------------------
// AUTHENTIFICATION
// ----------------------------
export const login = async (email, password) => {
  const res = await api.post("/users/auth/login/", { email, password });
  localStorage.setItem("access_token", res.data.access);
  localStorage.setItem("refresh_token", res.data.refresh);
  localStorage.setItem("user", JSON.stringify(res.data.user));
  setAuthToken(res.data.access);
  return res.data;
};

export const logout = async () => {
  const refresh = localStorage.getItem("refresh_token");
  if (refresh) {
    try {
      await api.post("/users/auth/logout/", { refresh });
    } catch (err) {
      console.warn("Erreur logout", err);
    }
  }
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
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
  const res = await api.get("/users/");
  return res.data;
};

export const getUserById = async (id) => {
  const res = await api.get(`/users/${id}/`);
  return res.data;
};

export const createUser = async (data) => {
  const res = await api.post("/users/", data);
  return res.data;
};

export const updateUser = async (id, data) => {
  const res = await api.put(`/users/${id}/`, data);
  return res.data;
};

export const partialUpdateUser = async (id, data) => {
  const res = await api.patch(`/users/${id}/`, data);
  return res.data;
};

export const deleteUser = async (id) => {
  const res = await api.delete(`/users/${id}/`);
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
