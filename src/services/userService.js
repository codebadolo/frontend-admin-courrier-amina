import axios from "axios";

const BASE_URL = "http://localhost:8000/api/users/"; // adapte si besoin

// Applique le token globalement
export const setAuthToken = (token) => {
  if (token) {
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common["Authorization"];
  }
};

// ---------------------------------------------
// AUTH
// ---------------------------------------------

export const apiLogin = async (email, password) => {
  const res = await axios.post(`http://localhost:8000/api/auth/login/`, {
    email,
    password,
  });
  return res.data;
};

export const apiLogout = async (refresh) => {
  const res = await axios.post(`http://localhost:8000/api/auth/logout/`, {
    refresh,
  });
  return res.data;
};

// ---------------------------------------------
// USERS (CRUD)
// ---------------------------------------------

export const getUsers = async () => {
  const res = await axios.get(`${BASE_URL}users`);
  return res.data;
};

export const getUserById = async (id) => {
  const res = await axios.get(`${BASE_URL}${id}/`);
  return res.data;
};

export const createUser = async (payload) => {
  const res = await axios.post(BASE_URL, payload);
  return res.data;
};

export const updateUser = async (id, payload) => {
  const res = await axios.put(`${BASE_URL}${id}/`, payload);
  return res.data;
};

export const partialUpdateUser = async (id, payload) => {
  const res = await axios.patch(`${BASE_URL}${id}/`, payload);
  return res.data;
};

export const deleteUser = async (id) => {
  const res = await axios.delete(`${BASE_URL}${id}/`);
  return res.data;
};

// ---------------------------------------------
// PROFIL / PASSWORD
// ---------------------------------------------

export const getProfile = async () => {
  const res = await axios.get(`http://localhost:8000/api/auth/profile/`);
  return res.data;
};

export const updateProfile = async (payload) => {
  const res = await axios.put(`http://localhost:8000/api/auth/profile/`, payload);
  return res.data;
};

export const changePassword = async (payload) => {
  const res = await axios.post(
    `http://localhost:8000/api/auth/change-password/`,
    payload
  );
  return res.data;
};

export const getUsersByService = async (serviceId, roles = []) => {
  const params = { service: serviceId };
  if (roles.length) {
    params.role = roles;
  }
  const response = await axios.get('/users/par-service/', { params });
  return response.data;
};

export const getRoleChoices = async () => {
  try {
    const response = await axios.get(`${BASE_URL}role-choices/`);
    return response.data; // Retourne directement le tableau de rôles
  } catch (error) {
    console.error("Erreur lors de la récupération des rôles:", error);
    throw error;
  }
};