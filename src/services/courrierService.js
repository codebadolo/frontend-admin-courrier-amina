import axios from "axios";

const BASE = "http://localhost:8000/api/courriers/";

// ⚠️ CORRECTION : Utiliser une clé unique pour le token
const getAuthHeaders = () => {
  // Essayer d'abord "auth_token", sinon "token" pour compatibilité
  const token = localStorage.getItem("auth_token") || localStorage.getItem("token");
  return token
    ? { 
        Authorization: `Token ${token}`,
        "Content-Type": "application/json"
      }
    : {};
};

// Configuration globale d'axios
axios.defaults.baseURL = "http://localhost:8000";

// Intercepteur pour ajouter le token à toutes les requêtes
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("auth_token") || localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Token ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Fonction pour vérifier l'authentification
export const checkAuth = () => {
  return localStorage.getItem("auth_token") || localStorage.getItem("token");
};

export const fetchCourriers = async (params = {}) => {
  try {
    const res = await axios.get(`${BASE}courriers/`, {
      params,
      headers: getAuthHeaders(),
    });
    return res.data;
  } catch (error) {
    console.error("Erreur fetchCourriers:", error);
    throw error;
  }
};

export const getCourrier = async (id) => {
  const res = await axios.get(`${BASE}courriers/${id}/`, {
    headers: getAuthHeaders(),
  });
  return res.data;
};

export const createCourrier = async (payload) => {
  const res = await axios.post(`${BASE}courriers/`, payload, {
    headers: getAuthHeaders(),
  });
  return res.data;
};

export const updateCourrier = async (id, payload) => {
  const res = await axios.patch(`${BASE}courriers/${id}/`, payload, {
    headers: getAuthHeaders(),
  });
  return res.data;
};

export const deleteCourrier = async (id) => {
  const res = await axios.delete(`${BASE}courriers/${id}/`, {
    headers: getAuthHeaders(),
  });
  return res.data;
};

// Fonction spécifique pour courriers entrants
export const createCourrierEntrant = async (payload) => {
  const res = await axios.post(`${BASE}courriers/`, {
    ...payload,
    type: "entrant"
  }, {
    headers: getAuthHeaders(),
  });
  return res.data;
};

// Ajoutez ces fonctions à votre courrierService.js
export const getCourrierDetail = async (id) => {
  const res = await axios.get(`${BASE}courriers/${id}/`, {
    headers: getAuthHeaders(),
  });
  return res.data;
};

export const getPiecesJointes = async (courrierId) => {
  const res = await axios.get(`${BASE}pieces-jointes/?courrier_id=${courrierId}`, {
    headers: getAuthHeaders(),
  });
  return res.data;
};

export const downloadPieceJointe = async (pieceId) => {
  const res = await axios.get(`${BASE}pieces-jointes/${pieceId}/`, {
    headers: getAuthHeaders(),
    responseType: 'blob'
  });
  return res.data;
};

// Ajoutez cette fonction à courrierService.js
export const analyzeDocument = async (file) => {
  const formData = new FormData();
  formData.append('fichier', file);

  const res = await axios.post(`${BASE}courriers/analyze/`, formData, {
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'multipart/form-data',
    },
  });
  return res.data;
};

// // services/courrierService.js - Ajoutez cette fonction
// export const imputerCourrier = async (courrierId, payload) => {
//   const res = await axios.post(`${BASE}courriers/${courrierId}/imputer/`, payload, {
//     headers: getAuthHeaders(),
//   });
//   return res.data;
// };

// Fonction pour récupérer les utilisateurs d'un service
export const getUsersByService = async (serviceId) => {
  const res = await axios.get(`http://localhost:8000/api/users/?service=${serviceId}`, {
    headers: getAuthHeaders(),
  });
  return res.data;
};

// Ajoutez ces fonctions
export const fetchCourriersEnAttente = async (params = {}) => {
  try {
    const res = await axios.get(`${BASE}imputation-dashboard/`, {
      params,
      headers: getAuthHeaders(),
    });
    return res.data;
  } catch (error) {
    console.error("Erreur fetchCourriersEnAttente:", error);
    throw error;
  }
};

export const getImputationStats = async () => {
  try {
    const res = await axios.get(`${BASE}imputation-dashboard/statistiques/`, {
      headers: getAuthHeaders(),
    });
    return res.data;
  } catch (error) {
    console.error("Erreur getImputationStats:", error);
    throw error;
  }
};

export const imputerCourrierRapide = async (courrierId, serviceId, commentaire = '') => {
  try {
    const res = await axios.post(`${BASE}courriers/${courrierId}/imputer_rapide/`, {
      service_id: serviceId,
      commentaire: commentaire
    }, {
      headers: getAuthHeaders(),
    });
    return res.data;
  } catch (error) {
    console.error("Erreur imputerCourrierRapide:", error);
    throw error;
  }
};

export const imputerCourrier = async (courrierId, serviceId, commentaire = '') => {
  try {
    const res = await axios.post(`${BASE}courriers/${courrierId}/imputer/`, {
      service_id: serviceId,
      commentaire: commentaire
    }, {
      headers: getAuthHeaders(),
    });
    return res.data;
  } catch (error) {
    console.error("Erreur imputerCourrier:", error);
    throw error;
  }
};