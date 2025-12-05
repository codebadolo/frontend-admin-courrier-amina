import axios from "axios";

const BASE_URL = "http://localhost:8000/api/users/"; // adapte si besoin

const setAuth = (token) => {
  if (token) axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  else delete axios.defaults.headers.common["Authorization"];
};

// AUTH
export const apiLogin = async (email, password) => {
  const res = await axios.post(`${BASE_URL}auth/login/`, { email, password });
  return res.data;
};
export const apiLogout = async (refresh) => {
  return axios.post(`${BASE_URL}auth/logout/`, { refresh });
};

// USERS (CRUD)
export const getUsers = async () => {
  const res = await axios.get(BASE_URL);
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

// profile / password
export const getProfile = async () => {
  const res = await axios.get(`${BASE_URL}profile/`);
  return res.data;
};
export const updateProfile = async (payload) => {
  const res = await axios.put(`${BASE_URL}profile/`, payload);
  return res.data;
};
export const changePassword = async (payload) => {
  const res = await axios.post(`${BASE_URL}change-password/`, payload);
  return res.data;
};

export { setAuth as setAuthToken };
