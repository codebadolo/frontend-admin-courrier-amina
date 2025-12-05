import axios from "axios";

const API_URL = "http://localhost:8000/api/users/";

// ----------------------------
// Gestion du Token
// ----------------------------
const setAuthToken = (token) => {
  if (token) {
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common["Authorization"];
  }
};

// Rafraîchir automatiquement le token expiré
export const refreshToken = async () => {
  const refresh = localStorage.getItem("refresh_token");
  if (!refresh) return;

  try {
    const res = await axios.post(`${API_URL}auth/refresh/`, { refresh });
    localStorage.setItem("access_token", res.data.access);
    setAuthToken(res.data.access);
  } catch (err) {
    console.error("Erreur refresh token", err);
    logout();
  }
};

// ----------------------------
// AUTHENTIFICATION
// ----------------------------
export const login = async (email, password) => {
  try {
    const response = await axios.post(`${API_URL}auth/login/`, { email, password });

    if (response.data.access) {
      localStorage.setItem("access_token", response.data.access);
      localStorage.setItem("refresh_token", response.data.refresh);
      localStorage.setItem("user", JSON.stringify(response.data.user));
      setAuthToken(response.data.access);
    }
    return response.data;
  } catch (error) {
    throw error.response?.data || { detail: "Erreur serveur" };
  }
};

export const logout = async () => {
  const refresh = localStorage.getItem("refresh_token");
  try {
    await axios.post(`${API_URL}auth/logout/`, { refresh });
  } catch (error) {
    console.warn("Erreur logout :", error);
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
// GESTION DES UTILISATEURS (ADMIN)
// ----------------------------

// Liste de tous les utilisateurs (Admin)
export const getUsers = async () => {
  try {
    const res = await axios.get(API_URL);
    return res.data;
  } catch (err) {
    throw err.response?.data || { detail: "Impossible de récupérer les utilisateurs" };
  }
};

// Détails d’un utilisateur
export const getUserById = async (id) => {
  try {
    const res = await axios.get(`${API_URL}${id}/`);
    return res.data;
  } catch (err) {
    throw err.response?.data || { detail: "Utilisateur introuvable" };
  }
};

// Créer un utilisateur
export const createUser = async (userData) => {
  try {
    const res = await axios.post(API_URL, userData);
    return res.data;
  } catch (err) {
    throw err.response?.data || { detail: "Erreur lors de la création" };
  }
};

// Modifier un utilisateur
export const updateUser = async (id, userData) => {
  try {
    const res = await axios.put(`${API_URL}${id}/`, userData);
    return res.data;
  } catch (err) {
    throw err.response?.data || { detail: "Erreur mise à jour" };
  }
};

// Supprimer un utilisateur
export const deleteUser = async (id) => {
  try {
    const res = await axios.delete(`${API_URL}${id}/`);
    return res.data;
  } catch (err) {
    throw err.response?.data || { detail: "Erreur suppression" };
  }
};

// ----------------------------
// GESTION PROFIL (Utilisateur connecté)
// ----------------------------

// Obtenir son propre profil
export const getProfile = async () => {
  try {
    const res = await axios.get(`${API_URL}profile/`);
    return res.data;
  } catch (err) {
    throw err.response?.data || { detail: "Erreur profil" };
  }
};

// Mettre à jour son profil
export const updateProfile = async (data) => {
  try {
    const res = await axios.put(`${API_URL}profile/`, data);
    return res.data;
  } catch (err) {
    throw err.response?.data || { detail: "Erreur update profil" };
  }
};

// Changer son mot de passe
export const changePassword = async (oldPassword, newPassword) => {
  try {
    const res = await axios.put(`${API_URL}change-password/`, {
      old_password: oldPassword,
      new_password: newPassword,
    });
    return res.data;
  } catch (err) {
    throw err.response?.data || { detail: "Erreur changement de mot de passe" };
  }
};
