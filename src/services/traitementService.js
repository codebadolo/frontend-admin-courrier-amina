// src/services/traitementService.js
import api from '../api/auth';

export const traitementService = {


    // LISTE DES COURRIERS À TRAITER
  getCourriersTraitement: async (params = {}) => {
    const response = await api.get('/courriers/traitement/', { params });
    return response.data;
  },

  // STATISTIQUES DASHBOARD
  getStatsTraitement: async () => {
    const response = await api.get('/courriers/traitement/stats/');
    return response.data;
  },

  // DÉTAIL TRAITEMENT
  getDetailTraitement: async (courrierId) => {
    const response = await api.get(`/courriers/traitement/${courrierId}/detail_traitement/`);
    return response.data;
  },

  // PRENDRE EN CHARGE
  prendreEnCharge: async (courrierId, data) => {
    const response = await api.post(
      `/courriers/traitement/${courrierId}/prendre-en-charge/`,
      data
    );
    return response.data;
  },

  // AJOUTER INSTRUCTION
  ajouterInstruction: async (courrierId, data) => {
    const response = await api.post(
      `/courriers/traitement/${courrierId}/ajouter_instruction/`,
      data
    );
    return response.data;
  },

  // RÉDIGER RÉPONSE
  redigerReponse: async (courrierId, data) => {
    const response = await api.post(
      `/courriers/traitement/${courrierId}/rediger_reponse/`,
      data
    );
    return response.data;
  },

  // SOUMETTRE VALIDATION
  soumettreValidation: async (courrierId, data) => {
    const response = await api.post(
      `/courriers/traitement/${courrierId}/soumettre_validation/`,
      data
    );
    return response.data;
  },

  // VALIDER
  valider: async (courrierId, data) => {
    const response = await api.post(
      `/courriers/traitement/${courrierId}/valider/`,
      data
    );
    return response.data;
  },

  // SIGNER
  signer: async (courrierId, data) => {
    const response = await api.post(
      `/courriers/traitement/${courrierId}/signer/`,
      data
    );
    return response.data;
  },

  // ENVOYER
  envoyer: async (courrierId) => {
    const response = await api.post(
      `/courriers/traitement/${courrierId}/envoyer/`
    );
    return response.data;
  },

  // TIMELINE
  getTimeline: async (courrierId) => {
    const response = await api.get(
      `/courriers/traitement/${courrierId}/timeline/`
    );
    return response.data;
  },
  
  // MODÈLES DE RÉPONSE
  // GET /api/courriers/modeles/
  getModelesReponse: async () => {
    const response = await api.get('/courriers/modeles/');
    return response.data;
  },

  // VALIDATEURS D'UN SERVICE
  // GET /api/services/{serviceId}/validateurs/
  getValidateurs: async (serviceId) => {
    const response = await api.get(`/services/${serviceId}/validateurs/`);
    return response.data;
  },




  // Démarrer l'analyse
  demarrerAnalyse: async (courrierId) => {
    const response = await api.post(`/courriers/courriers/${courrierId}/demarrer_analyse/`
    );
    return response.data;
  },

  // Enregistrer l'analyse
  enregistrerAnalyse: async (courrierId, data) => {
    const response = await api.post(`/courriers/courriers/${courrierId}/enregistrer_analyse/`,
      data
    );
    return response.data;
  },

  // Obtenir les services consultables
  getServicesConsultables: async (courrierId) => {
    const response = await api.get(`/courriers/courriers/${courrierId}/services_consultables/`
    );
    return response.data;
  },

  // Consulter un service
  consulterService: async (courrierId, data) => {
    const response = await api.post(`/courriers/courriers/${courrierId}/consulter_service/`,
      data
    );
    return response.data;
  }
};

