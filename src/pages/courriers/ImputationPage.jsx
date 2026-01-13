// ImputationPage.jsx - Version corrigée
import React, { useState, useEffect } from 'react';
import { Card, message, Spin, Alert,Tag } from 'antd';
import { TeamOutlined } from '@ant-design/icons';
import ImputationDashboard from './ImputationDashboard';
import { fetchCourriers, imputerCourrier } from '../../services/courrierService';
import { getServices } from '../../api/service';

const ImputationPage = () => {
  const [courriers, setCourriers] = useState([]); // Initialiser avec tableau vide
  const [services, setServices] = useState([]);   // Initialiser avec tableau vide
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Charger les courriers en attente d'imputation
  const loadCourriersEnAttente = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCourriers({
        type: "entrant",
        statut: "recu",
        service_impute__isnull: true
      });
      
      // S'assurer que data est un tableau
      setCourriers(Array.isArray(data) ? data : (data.results || []));
    } catch (error) {
      console.error("Erreur chargement courriers:", error);
      setError("Erreur lors du chargement des courriers");
      setCourriers([]); // S'assurer que c'est un tableau
    } finally {
      setLoading(false);
    }
  };

  // Charger les services
  const loadServices = async () => {
    try {
      const data = await getServices();
      setServices(Array.isArray(data) ? data : (data.results || []));
    } catch (error) {
      console.error("Erreur chargement services:", error);
      setServices([]); // S'assurer que c'est un tableau
    }
  };

  // Fonction pour imputer un courrier
  const handleImputer = async (imputationData) => {
    try {
      setLoading(true);
      
      // Validation des données
      if (!imputationData.courrierId) {
        throw new Error("ID du courrier manquant");
      }
      
      if (!imputationData.serviceId) {
        throw new Error("Service non sélectionné");
      }
      
      // Appeler l'API d'imputation
      await imputerCourrier(imputationData.courrierId, {
        service_id: imputationData.serviceId,
        commentaire: imputationData.comment || `Imputé ${imputationData.mode === 'auto' ? 'automatiquement par IA' : 'manuellement'}`,
        user_id: imputationData.userId
      });
      
      message.success("Courrier imputé avec succès !");
      
      // Recharger les courriers en attente
      await loadCourriersEnAttente();
      
    } catch (error) {
      console.error("Erreur imputation:", error);
      message.error(error.message || "Erreur lors de l'imputation");
    } finally {
      setLoading(false);
    }
  };

  // Chargement initial
  useEffect(() => {
    const initData = async () => {
      await Promise.all([
        loadCourriersEnAttente(),
        loadServices()
      ]);
    };
    initData();
  }, []);

  return (
    <Card
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <TeamOutlined />
          <span>Tableau d'imputation des courriers</span>
          {courriers.length > 0 && (
            <Tag color="orange" style={{ marginLeft: '10px' }}>
              {courriers.length} en attente
            </Tag>
          )}
        </div>
      }
    >
      {error && (
        <Alert
          message="Erreur"
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}
      
      <Spin spinning={loading} tip="Chargement...">
        {/* Toujours passer un tableau même s'il est vide */}
        <ImputationDashboard
          courriers={courriers}
          services={services}
          onImpute={handleImputer}
        />
      </Spin>
    </Card>
  );
};

export default ImputationPage;