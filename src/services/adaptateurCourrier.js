import { getCourrier } from './courrierService';

// Cet adaptateur transforme les données de votre API Django en format frontend
export const adaptateurCourrier = {
  // Adapter un courrier de l'API Django au format frontend
  adapterCourrierPourTraitement: (dataDjango) => {
    console.log('Adaptation des données Django:', dataDjango);
    
    // Vérifier si c'est un courrier avec les anciens champs
    const isNewFormat = dataDjango.hasOwnProperty('statut');
    
    return {
      // Données de base
      id: dataDjango.id,
      reference: dataDjango.reference || `REF-${dataDjango.id}`,
      objet: dataDjango.objet || 'Sujet non spécifié',
      
      // Statut de traitement - mapping entre Django et frontend
      traitement_statut: isNewFormat ? 
        dataDjango.statut : // Votre nouveau format Django
        (dataDjango.traitement_statut || 'recu'), // Ancien format
      
      // Expéditeur
      expediteur_nom: dataDjango.expediteur_nom || dataDjango.expediteur?.nom || 'Expéditeur inconnu',
      expediteur_email: dataDjango.expediteur_email,
      expediteur_telephone: dataDjango.expediteur_telephone,
      
      // Dates
      date_reception: dataDjango.date_reception || dataDjango.created_at,
      date_echeance: dataDjango.date_echeance,
      date_debut_traitement: dataDjango.date_debut_traitement,
      
      // Priorité
      priorite: dataDjango.priorite || 'normale',
      
      // Service et catégorie
      service_impute_detail: dataDjango.service_impute_detail || dataDjango.service_impute || {
        id: 1,
        nom: dataDjango.service_impute_nom || 'Service non attribué'
      },
      category_detail: dataDjango.category_detail || dataDjango.categorie || {
        id: 1,
        name: dataDjango.categorie_nom || 'Non catégorisé'
      },
      
      // Agent traitant
      agent_traitant: dataDjango.agent_traitant || dataDjango.responsable_actuel,
      agent_traitant_detail: dataDjango.agent_traitant_detail || dataDjango.responsable_actuel_detail,
      
      // Métriques de traitement
      progression: dataDjango.progression || 0,
      delai_traitement_jours: dataDjango.delai_traitement_jours || 15,
      
      // Calculer les jours restants
      jours_restants: dataDjango.jours_restants || calculerJoursRestants(dataDjango.date_echeance),
      est_en_retard: dataDjango.est_en_retard || estDateEnRetard(dataDjango.date_echeance),
      
      // Contenu
      contenu_texte: dataDjango.contenu_texte || dataDjango.contenu || '',
      
      // Pièces jointes
      pieces_jointes: dataDjango.pieces_jointes || [],
      
      // Métadonnées
      canal: dataDjango.canal || 'courrier_postal',
      confidentialite: dataDjango.confidentialite || 'normale',
      created_by_detail: dataDjango.created_by_detail,
      created_at: dataDjango.created_at,
      updated_at: dataDjango.updated_at
    };
  },
  
  // Préparer les données pour l'API Django
  preparerPourAPI: (dataFrontend) => {
    return {
      // Mapping inverse si nécessaire
      statut: dataFrontend.traitement_statut,
      agent_traitant: dataFrontend.agent_traitant,
      date_debut_traitement: dataFrontend.date_debut_traitement,
      progression: dataFrontend.progression,
      notes_traitement: dataFrontend.notes_traitement
    };
  }
};

// Fonctions utilitaires
const calculerJoursRestants = (dateEcheance) => {
  if (!dateEcheance) return null;
  const maintenant = new Date();
  const echeance = new Date(dateEcheance);
  const diff = echeance - maintenant;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

const estDateEnRetard = (dateEcheance) => {
  if (!dateEcheance) return false;
  return new Date(dateEcheance) < new Date();
};