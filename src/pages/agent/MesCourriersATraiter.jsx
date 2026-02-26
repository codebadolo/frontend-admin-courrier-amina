// src/pages/agent/MesCourriersATraiter.jsx
import React, { useEffect, useState } from 'react';
import { Card, Table, Tag, Space, Button, message, Badge, Modal, Input, Descriptions, Tooltip } from 'antd';
import { 
  ClockCircleOutlined, 
  CheckCircleOutlined, 
  FileTextOutlined,
  EyeOutlined,
  UserOutlined,
  CalendarOutlined,
  AlertOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getMesCourriersATraiter, traiterCourrier, getCourrierDetail } from '../../services/courrierService';
import dayjs from 'dayjs';

const { TextArea } = Input;

const MesCourriersATraiter = () => {
  const [courriers, setCourriers] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [traitementModal, setTraitementModal] = useState({ visible: false, courrier: null });
  const [detailModal, setDetailModal] = useState({ visible: false, courrier: null });
  const [reponse, setReponse] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    chargerCourriers();
  }, []);

  const chargerCourriers = async () => {
    try {
      setLoading(true);
      const data = await getMesCourriersATraiter();
      setCourriers(data.courriers || []);
      setStats(data.stats || {});
    } catch (error) {
      message.error("Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  };

  const handleVoirDetails = async (record) => {
    try {
      const details = await getCourrierDetail(record.id);
      setDetailModal({ visible: true, courrier: details });
    } catch (error) {
      message.error("Erreur lors du chargement des détails");
    }
  };

  const handleTraiter = (record) => {
    setTraitementModal({ visible: true, courrier: record });
    setReponse('');
  };

  const handleSubmitTraitement = async () => {
    if (!reponse.trim()) {
      message.warning("Veuillez saisir une réponse");
      return;
    }

    try {
      setSubmitting(true);
      await traiterCourrier(traitementModal.courrier.id, reponse, 'Courrier traité');
      message.success("Courrier traité avec succès");
      setTraitementModal({ visible: false, courrier: null });
      chargerCourriers();
    } catch (error) {
      message.error(error.response?.data?.error || "Erreur lors du traitement");
    } finally {
      setSubmitting(false);
    }
  };

  const getPrioriteColor = (priorite) => {
    const colors = { urgente: 'red', haute: 'orange', normale: 'blue', basse: 'gray' };
    return colors[priorite?.toLowerCase()] || 'blue';
  };

  const columns = [
    {
      title: 'Référence',
      dataIndex: 'reference',
      width: 120,
      render: (ref) => <Tag color="blue">{ref}</Tag>
    },
    {
      title: 'Objet',
      dataIndex: 'objet',
      ellipsis: true,
      render: (text, record) => (
        <Space direction="vertical" size={0}>
          <span style={{ fontWeight: 500 }}>{text}</span>
          <small style={{ color: '#666' }}>{record.expediteur_nom}</small>
        </Space>
      )
    },
    {
      title: 'Priorité',
      dataIndex: 'priorite',
      width: 100,
      render: (p) => (
        <Tag color={getPrioriteColor(p)} icon={<AlertOutlined />}>
          {p}
        </Tag>
      )
    },
    {
      title: 'Échéance',
      dataIndex: 'date_echeance',
      width: 120,
      render: (date) => {
        if (!date) return '-';
        const estEnRetard = dayjs(date).isBefore(dayjs());
        return (
          <Tag color={estEnRetard ? 'red' : 'green'} icon={<ClockCircleOutlined />}>
            {dayjs(date).format('DD/MM/YYYY')}
          </Tag>
        );
      }
    },
    {
      title: 'Actions',
      width: 200,
      render: (_, record) => (
        <Space>
          <Tooltip title="Voir détails">
            <Button 
              icon={<EyeOutlined />} 
              size="small" 
              onClick={() => handleVoirDetails(record)}
            />
          </Tooltip>
          <Tooltip title="Traiter le courrier">
            <Button 
              type="primary" 
              size="small" 
              icon={<CheckCircleOutlined />}
              onClick={() => handleTraiter(record)}
            >
              Traiter
            </Button>
          </Tooltip>
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: 24 }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
          <h2>Mes courriers à traiter</h2>
        </div>
        
        {/* Statistiques */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
          <Card size="small" style={{ flex: 1, textAlign: 'center' }}>
            <Badge count={stats.total || 0} showZero color="blue" />
            <div style={{ marginTop: 8 }}>Total</div>
          </Card>
          <Card size="small" style={{ flex: 1, textAlign: 'center', background: '#fff1f0' }}>
            <Badge count={stats.urgents || 0} showZero color="red" />
            <div style={{ marginTop: 8 }}>Urgents</div>
          </Card>
          <Card size="small" style={{ flex: 1, textAlign: 'center', background: '#fff7e6' }}>
            <Badge count={stats.en_retard || 0} showZero color="orange" />
            <div style={{ marginTop: 8 }}>En retard</div>
          </Card>
          <Card size="small" style={{ flex: 1, textAlign: 'center', background: '#f6ffed' }}>
            <Badge count={stats.a_traiter_aujourd_hui || 0} showZero color="green" />
            <div style={{ marginTop: 8 }}>Aujourd'hui</div>
          </Card>
        </div>

        <Table
          columns={columns}
          dataSource={courriers}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          locale={{ emptyText: "Aucun courrier à traiter" }}
        />
      </Card>

      {/* Modal de traitement */}
      <Modal
        title="Traiter le courrier"
        open={traitementModal.visible}
        onCancel={() => setTraitementModal({ visible: false, courrier: null })}
        onOk={handleSubmitTraitement}
        okText="Valider le traitement"
        cancelText="Annuler"
        confirmLoading={submitting}
        width={700}
      >
        {traitementModal.courrier && (
          <div>
            <div style={{ marginBottom: 16, padding: 12, background: '#f5f5f5', borderRadius: 4 }}>
              <Descriptions column={1} size="small">
                <Descriptions.Item label="Référence">
                  <Tag color="blue">{traitementModal.courrier.reference}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Objet">{traitementModal.courrier.objet}</Descriptions.Item>
                <Descriptions.Item label="Expéditeur">{traitementModal.courrier.expediteur_nom || 'Non spécifié'}</Descriptions.Item>
              </Descriptions>
            </div>
            
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: 8 }}>Votre réponse :</label>
              <TextArea 
                rows={6} 
                value={reponse}
                onChange={(e) => setReponse(e.target.value)}
                placeholder="Saisissez votre réponse au courrier..."
              />
            </div>
          </div>
        )}
      </Modal>

      {/* Modal de détails */}
      <Modal
        title="Détails du courrier"
        open={detailModal.visible}
        onCancel={() => setDetailModal({ visible: false, courrier: null })}
        footer={[
          <Button key="close" onClick={() => setDetailModal({ visible: false, courrier: null })}>
            Fermer
          </Button>,
          detailModal.courrier && (
            <Button 
              key="traiter" 
              type="primary" 
              onClick={() => {
                setDetailModal({ visible: false, courrier: null });
                handleTraiter(detailModal.courrier);
              }}
            >
              Traiter ce courrier
            </Button>
          )
        ]}
        width={600}
      >
        {detailModal.courrier && (
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label="Référence">
              <Tag color="blue">{detailModal.courrier.reference}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Objet">{detailModal.courrier.objet}</Descriptions.Item>
            <Descriptions.Item label="Expéditeur">{detailModal.courrier.expediteur_nom || '-'}</Descriptions.Item>
            <Descriptions.Item label="Date réception">
              {dayjs(detailModal.courrier.date_reception).format('DD/MM/YYYY HH:mm')}
            </Descriptions.Item>
            <Descriptions.Item label="Priorité">
              <Tag color={getPrioriteColor(detailModal.courrier.priorite)}>
                {detailModal.courrier.priorite}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Échéance">
              {detailModal.courrier.date_echeance ? dayjs(detailModal.courrier.date_echeance).format('DD/MM/YYYY') : '-'}
            </Descriptions.Item>
            {detailModal.courrier.expediteur_email && (
              <Descriptions.Item label="Email">{detailModal.courrier.expediteur_email}</Descriptions.Item>
            )}
            {detailModal.courrier.contenu_texte && (
              <Descriptions.Item label="Contenu">
                <div style={{ maxHeight: 200, overflowY: 'auto', whiteSpace: 'pre-wrap' }}>
                  {detailModal.courrier.contenu_texte}
                </div>
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default MesCourriersATraiter;