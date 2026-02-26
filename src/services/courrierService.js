// src/services/courrierService.js
import axios from "axios";

const API_BASE = "http://localhost:8000/api";
const COURRIER_URL = "/courriers/courriers/";
const PIECES_URL = "/courriers/pieces-jointes/";
const IMPUTATION_DASHBOARD_URL = "/courriers/imputation-dashboard/";

// Configuration globale
axios.defaults.baseURL = API_BASE;

// Intercepteur pour ajouter le token à toutes les requêtes
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("auth_token") || localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Token ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Vérification authentification
export const checkAuth = () => !!localStorage.getItem("auth_token") || !!localStorage.getItem("token");

// ==================== COURRIERS ====================
export const fetchCourriers = async (params = {}) => {
  const { data } = await axios.get(COURRIER_URL, { params });
  return data;
};

export const getCourrier = async (id) => {
  const { data } = await axios.get(`${COURRIER_URL}${id}/`);
  return data;
};

export const createCourrier = async (payload) => {
  // payload peut être un objet ou FormData
  const headers = payload instanceof FormData
    ? { "Content-Type": "multipart/form-data" }
    : { "Content-Type": "application/json" };
  const { data } = await axios.post(COURRIER_URL, payload, { headers });
  return data;
};

export const updateCourrier = async (id, payload) => {
  const { data } = await axios.patch(`${COURRIER_URL}${id}/`, payload);
  return data;
};

export const deleteCourrier = async (id) => {
  const { data } = await axios.delete(`${COURRIER_URL}${id}/`);
  return data;
};

// ==================== DÉTAIL & PIÈCES JOINTES ====================
export const getCourrierDetail = async (id) => getCourrier(id);

export const getPiecesJointes = async (courrierId) => {
  const { data } = await axios.get(PIECES_URL, { params: { courrier_id: courrierId } });
  return data;
};

export const downloadPieceJointe = async (pieceId) => {
  const { data } = await axios.get(`${PIECES_URL}${pieceId}/`, { responseType: 'blob' });
  return data;
};

// ==================== ANALYSE ====================
export const analyzeDocument = async (file, additionalData = {}) => {
  const formData = new FormData();
  formData.append("pieces_jointes", file);
  
  // Ne garder que les valeurs définies et non "undefined"
  Object.entries(additionalData).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== 'undefined') {
      formData.append(key, value);
    }
  });
  
  const { data } = await axios.post(`/courriers/analyse_ia/`, formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });
  return data;
};

// ==================== IMPUTATION ====================
export const fetchCourriersEnAttente = async (params = {}) => {
  const { data } = await axios.get(IMPUTATION_DASHBOARD_URL, { params });
  return data;
};

export const getImputationStats = async () => {
  const { data } = await axios.get(`${IMPUTATION_DASHBOARD_URL}statistiques/`);
  return data;
};

export const imputerCourrier = async (courrierId, serviceId, commentaire = '') => {
  const { data } = await axios.post(`${COURRIER_URL}${courrierId}/imputer/`, {
    service_id: serviceId,
    commentaire
  });
  return data;
};

export const imputerCourrierRapide = async (courrierId, serviceId, commentaire = '') => {
  const { data } = await axios.post(`${COURRIER_URL}${courrierId}/imputer_rapide/`, {
    service_id: serviceId,
    commentaire
  });
  return data;
};

// ==================== UTILITAIRES ====================
export const getUsersByService = async (serviceId) => {
  const { data } = await axios.get(`/users/`, { params: { service: serviceId } });
  return data;
};

// ==================== GÉNÉRATION PDF ====================
export const generateCourrierPDF = async (id) => {
  try {
    const token = localStorage.getItem("auth_token") || localStorage.getItem("token");
    
    const response = await axios.get(`${COURRIER_URL}${id}/export_pdf/`, {
      responseType: 'blob',
      headers: {
        'Authorization': token ? `Token ${token}` : '',
        'Content-Type': 'application/json'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error("Erreur génération PDF:", error);
    throw error;
  }
};

// Alias pour compatibilité
export const genererPDF = generateCourrierPDF;

// ==================== ASSIGNATION ====================
export const assignerAgent = async (courrierId, agentId) => {
  const response = await axios.post(`${COURRIER_URL}${courrierId}/assigner_agent/`, {
    agent_id: agentId 
  });
  return response.data;
};

// ==================== VALIDATION ====================
export const soumettreValidation = async (courrierId, commentaire = '') => {
  const { data } = await axios.post(
    `${COURRIER_URL}${courrierId}/soumettre-validation/`,
    { commentaire }
  );
  return data;
};

export const validerCourrier = async (courrierId, validationId, action = 'valider', commentaire = '') => {
  const { data } = await axios.post(
    `${COURRIER_URL}${courrierId}/valider/`,
    { validation_id: validationId, action, commentaire }
  );
  return data;
};

export const signerCourrier = async (courrierId, signatureData = {}) => {
  const { data } = await axios.post(
    `${COURRIER_URL}${courrierId}/signer/`,
    { signature_data: signatureData }
  );
  return data;
};

export const envoyerCourrier = async (courrierId) => {
  const { data } = await axios.post(`${COURRIER_URL}${courrierId}/envoyer/`);
  return data;
};


// src/services/courrierService.js - Ajoutez à la fin du fichier

// ==================== GESTION DES COURRIERS ENTRANTS ====================

export const getMembresService = async (courrierId) => {
  try {
    const token = localStorage.getItem("auth_token") || localStorage.getItem("token");
    const { data } = await axios.get(
      `${COURRIER_URL}${courrierId}/membres-service/`,
      {
        headers: {
          'Authorization': token ? `Token ${token}` : '',
        }
      }
    );
    return data;
  } catch (error) {
    console.error("Erreur chargement membres:", error);
    throw error;
  }
};

export const affecterMembre = async (courrierId, membreId, options = {}) => {
  try {
    const token = localStorage.getItem("auth_token") || localStorage.getItem("token");
    const { data } = await axios.post(
      `${COURRIER_URL}${courrierId}/affecter-membre/`,
      {
        membre_id: membreId,
        commentaire: options.commentaire || '',
        instructions: options.instructions || '',
        delai_jours: options.delai_jours || 5
      },
      {
        headers: {
          'Authorization': token ? `Token ${token}` : '',
          'Content-Type': 'application/json'
        }
      }
    );
    return data;
  } catch (error) {
    console.error("Erreur affectation:", error);
    throw error;
  }
};

export const traiterCourrier = async (courrierId, reponse = '', commentaire = '') => {
  try {
    const token = localStorage.getItem("auth_token") || localStorage.getItem("token");
    const { data } = await axios.post(
      `${COURRIER_URL}${courrierId}/traiter-courrier/`,
      {
        reponse,
        commentaire
      },
      {
        headers: {
          'Authorization': token ? `Token ${token}` : '',
          'Content-Type': 'application/json'
        }
      }
    );
    return data;
  } catch (error) {
    console.error("Erreur traitement:", error);
    throw error;
  }
};

export const getMesCourriersATraiter = async (params = {}) => {
  try {
    const token = localStorage.getItem("auth_token") || localStorage.getItem("token");
    const { data } = await axios.get(
      `${COURRIER_URL}mes-courriers-a-traiter/`,
      {
        params,
        headers: {
          'Authorization': token ? `Token ${token}` : '',
        }
      }
    );
    return data;
  } catch (error) {
    console.error("Erreur chargement courriers:", error);
    throw error;
  }
};

/// src/services/courrierService.js

// ==================== TRANSMISSION INTERNE ====================

export const getDestinatairesDisponibles = async (courrierId) => {
  try {
    const token = localStorage.getItem("auth_token") || localStorage.getItem("token");
    const { data } = await axios.get(
      `${COURRIER_URL}${courrierId}/destinataires-disponibles/`,
      {
        headers: {
          'Authorization': token ? `Token ${token}` : '',
        }
      }
    );
    return data;
  } catch (error) {
    console.error("Erreur chargement destinataires:", error);
    throw error;
  }
};

export const envoyerCourrierA = async (courrierId, destinataireId, commentaire = '') => {
  try {
    const token = localStorage.getItem("auth_token") || localStorage.getItem("token");
    const { data } = await axios.post(
      `${COURRIER_URL}${courrierId}/envoyer-a/`,
      {
        destinataire_id: destinataireId,
        commentaire: commentaire
      },
      {
        headers: {
          'Authorization': token ? `Token ${token}` : '',
          'Content-Type': 'application/json'
        }
      }
    );
    return data;
  } catch (error) {
    console.error("Erreur transmission:", error);
    throw error;
  }
};



export const getServicesDestinataires = async (courrierId) => {
  const { data } = await axios.get(`${COURRIER_URL}${courrierId}/services-destinataires/`);
  return data;
};

export const transmettreCourrierInterne = async (courrierId, data) => {
  const response = await axios.post(`${COURRIER_URL}${courrierId}/transmettre-interne/`, data);
  return response.data;
};

export const viserCourrier = async (courrierId, data) => {
  const response = await axios.post(`${COURRIER_URL}${courrierId}/viser-courrier/`, data);
  return response.data;
};

export const validerCourrierInterne = async (courrierId, data) => {
  const response = await axios.post(`${COURRIER_URL}${courrierId}/valider-interne/`, data);
  return response.data;
};