// src/pages/courriers/DetailCourrierInterne.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card, Descriptions, Tag, Space, Button, Spin, message, Tabs, Timeline,
  Row, Col, Modal, Select, Input, Steps, Alert
} from "antd";
import {
  ArrowLeftOutlined, SendOutlined, CheckCircleOutlined,
  CloseCircleOutlined, SwapOutlined, FileTextOutlined,
  UserOutlined, TeamOutlined, ClockCircleOutlined
} from "@ant-design/icons";
import dayjs from "dayjs";
import axios from "axios";
import {
  getServicesDestinataires,
  getMembresService,
  transmettreCourrierInterne,
  viserCourrier,
  validerCourrierInterne
} from "../../services/courrierService";

const { Option } = Select;
const { TextArea } = Input;
const { TabPane } = Tabs;
const { Step } = Steps;

const DetailCourrierInterne = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [courrier, setCourrier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState([]);
  const [membres, setMembres] = useState([]);
  const [transmissionModal, setTransmissionModal] = useState(false);
  const [visaModal, setVisaModal] = useState(false);
  const [validationModal, setValidationModal] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [commentaire, setCommentaire] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadCourrier();
  }, [id]);

  const loadCourrier = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("auth_token") || localStorage.getItem("token");
      const response = await axios.get(
        `http://localhost:8000/api/courriers/courriers/${id}/`,
        { headers: { Authorization: `Token ${token}` } }
      );
      setCourrier(response.data);
    } catch (error) {
      message.error("Erreur chargement courrier");
      navigate("/courriers-internes");
    } finally {
      setLoading(false);
    }
  };

  const handleTransmettre = async () => {
    if (!selectedService && !selectedUser) {
      message.warning("Veuillez sélectionner un destinataire");
      return;
    }

    setSubmitting(true);
    try {
      await transmettreCourrierInterne(id, {
        service_id: selectedService,
        user_id: selectedUser,
        commentaire
      });
      message.success("Courrier transmis avec succès");
      setTransmissionModal(false);
      loadCourrier();
    } catch (error) {
      message.error("Erreur lors de la transmission");
    } finally {
      setSubmitting(false);
    }
  };

  const handleVisa = async (action) => {
    setSubmitting(true);
    try {
      await viserCourrier(id, { action, commentaire });
      message.success(action === 'viser' ? "Visa apposé" : "Visa rejeté");
      setVisaModal(false);
      loadCourrier();
    } catch (error) {
      message.error("Erreur lors du visa");
    } finally {
      setSubmitting(false);
    }
  };

  const handleValidation = async (action) => {
    setSubmitting(true);
    try {
      await validerCourrierInterne(id, { action, commentaire });
      message.success(action === 'valider' ? "Courrier validé" : "Validation rejetée");
      setValidationModal(false);
      loadCourrier();
    } catch (error) {
      message.error("Erreur lors de la validation");
    } finally {
      setSubmitting(false);
    }
  };

  const loadServices = async () => {
    try {
      const data = await getServicesDestinataires(id);
      setServices(data);
    } catch (error) {
      message.error("Erreur chargement services");
    }
  };

  const loadMembres = async (serviceId) => {
    try {
      const data = await getMembresService(id, serviceId);
      setMembres(data);
    } catch (error) {
      message.error("Erreur chargement membres");
    }
  };

  const getCurrentStep = () => {
    if (!courrier) return 0;
    const status = courrier.traitement_statut;
    if (status === 'redaction') return 0;
    if (status === 'validation') return 1;
    if (status === 'signature') return 2;
    if (status === 'termine' || status === 'cloture') return 3;
    return 0;
  };

  if (loading) return <Spin size="large" style={{ margin: "50px auto", display: "block" }} />;

  return (
    <div style={{ padding: 24 }}>
      {/* En-tête */}
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={24} align="middle">
          <Col span={16}>
            <Space direction="vertical" size="middle">
              <Space>
                <Tag color="purple">{courrier.reference}</Tag>
                <Tag color={courrier.statut === 'repondu' ? 'green' : 'orange'}>
                  {courrier.statut}
                </Tag>
              </Space>
              <h2>{courrier.objet}</h2>
              <Space>
                <UserOutlined /> <strong>De:</strong> {courrier.created_by_detail?.prenom} {courrier.created_by_detail?.nom}
                <TeamOutlined style={{ marginLeft: 16 }} /> <strong>Service:</strong> {courrier.service_actuel_detail?.nom}
              </Space>
            </Space>
          </Col>
          <Col span={8} style={{ textAlign: "right" }}>
            <Space>
              <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
                Retour
              </Button>
              <Button
                type="primary"
                icon={<SwapOutlined />}
                onClick={() => {
                  loadServices();
                  setTransmissionModal(true);
                }}
              >
                Transmettre
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Timeline */}
      <Card style={{ marginBottom: 24 }}>
        <Steps current={getCurrentStep()} size="small">
          <Step title="Rédaction" />
          <Step title="Visa" />
          <Step title="Validation" />
          <Step title="Clôture" />
        </Steps>
      </Card>

      <Tabs defaultActiveKey="details">
        <TabPane tab="Détails" key="details">
          <Row gutter={24}>
            <Col span={12}>
              <Descriptions bordered column={1} title="Informations">
                <Descriptions.Item label="Expéditeur">
                  {courrier.created_by_detail?.prenom} {courrier.created_by_detail?.nom}
                </Descriptions.Item>
                <Descriptions.Item label="Service actuel">
                  {courrier.service_actuel_detail?.nom || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="Responsable">
                  {courrier.responsable_actuel_detail?.prenom} {courrier.responsable_actuel_detail?.nom || 'Non assigné'}
                </Descriptions.Item>
                <Descriptions.Item label="Date création">
                  {dayjs(courrier.created_at).format('DD/MM/YYYY HH:mm')}
                </Descriptions.Item>
              </Descriptions>
            </Col>
            <Col span={12}>
              <Descriptions bordered column={1} title="Statut">
                <Descriptions.Item label="Statut">
                  <Tag color={courrier.statut === 'repondu' ? 'green' : 'orange'}>
                    {courrier.statut}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Priorité">
                  <Tag color={courrier.priorite === 'urgente' ? 'red' : 'blue'}>
                    {courrier.priorite}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Confidentialité">
                  <Tag color={courrier.confidentialite === 'confidentielle' ? 'red' : 'green'}>
                    {courrier.confidentialite}
                  </Tag>
                </Descriptions.Item>
              </Descriptions>
            </Col>
          </Row>

          {courrier.contenu_texte && (
            <Card title="Contenu" style={{ marginTop: 24 }}>
              <div style={{ whiteSpace: 'pre-wrap' }}>{courrier.contenu_texte}</div>
            </Card>
          )}
        </TabPane>

        <TabPane tab="Validations" key="validations">
          <Timeline>
            {courrier.validations?.map((v, i) => (
              <Timeline.Item
                key={i}
                color={v.statut === 'valide' ? 'green' : v.statut === 'rejete' ? 'red' : 'blue'}
              >
                <p><strong>{v.type_validation}</strong> - {v.statut}</p>
                <p>Par: {v.validateur_detail?.prenom} {v.validateur_detail?.nom}</p>
                {v.commentaire && <p><i>"{v.commentaire}"</i></p>}
                <small>{dayjs(v.date_action || v.date_demande).format('DD/MM/YYYY HH:mm')}</small>
              </Timeline.Item>
            ))}
          </Timeline>

          {courrier.niveau_validation_atteint < 2 && (
            <Space style={{ marginTop: 16 }}>
              <Button
                type="primary"
                onClick={() => setVisaModal(true)}
                disabled={courrier.traitement_statut !== 'validation' && courrier.traitement_statut !== 'redaction'}
              >
                Apposer Visa
              </Button>
              <Button
                type="primary"
                onClick={() => setValidationModal(true)}
                disabled={courrier.niveau_validation_atteint < 1}
              >
                Valider
              </Button>
            </Space>
          )}
        </TabPane>

        <TabPane tab="Historique" key="historique">
          <Timeline mode="left">
            {courrier.historiques?.map((h, i) => (
              <Timeline.Item key={i} label={dayjs(h.date).format('DD/MM/YYYY HH:mm')}>
                <p><strong>{h.action}</strong></p>
                {h.commentaire && <p>{h.commentaire}</p>}
                <small>Par: {h.user_detail?.prenom} {h.user_detail?.nom}</small>
              </Timeline.Item>
            ))}
          </Timeline>
        </TabPane>
      </Tabs>

      {/* Modal Transmission */}
      <Modal
        title="Transmettre le courrier"
        open={transmissionModal}
        onCancel={() => setTransmissionModal(false)}
        onOk={handleTransmettre}
        okText="Transmettre"
        confirmLoading={submitting}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Select
            placeholder="Sélectionner un service"
            style={{ width: '100%' }}
            onChange={(value) => {
              setSelectedService(value);
              loadMembres(value);
              setSelectedUser(null);
            }}
            allowClear
          >
            {services.map(s => (
              <Option key={s.id} value={s.id}>{s.nom} ({s.membres_count} membres)</Option>
            ))}
          </Select>

          <Select
            placeholder="Sélectionner un utilisateur (optionnel)"
            style={{ width: '100%' }}
            onChange={setSelectedUser}
            allowClear
            disabled={!selectedService}
          >
            {membres.map(m => (
              <Option key={m.id} value={m.id}>
                {m.full_name} - {m.role_label}
              </Option>
            ))}
          </Select>

          <TextArea
            rows={3}
            placeholder="Commentaire (optionnel)"
            value={commentaire}
            onChange={(e) => setCommentaire(e.target.value)}
          />
        </Space>
      </Modal>

      {/* Modal Visa */}
      <Modal
        title="Apposer votre visa"
        open={visaModal}
        onCancel={() => setVisaModal(false)}
        footer={[
          <Button key="cancel" onClick={() => setVisaModal(false)}>Annuler</Button>,
          <Button key="reject" danger onClick={() => handleVisa('rejeter')} loading={submitting}>
            Rejeter
          </Button>,
          <Button key="approve" type="primary" onClick={() => handleVisa('viser')} loading={submitting}>
            Apposer Visa
          </Button>,
        ]}
      >
        <TextArea
          rows={4}
          placeholder="Commentaire (optionnel)"
          value={commentaire}
          onChange={(e) => setCommentaire(e.target.value)}
        />
      </Modal>

      {/* Modal Validation */}
      <Modal
        title="Validation hiérarchique"
        open={validationModal}
        onCancel={() => setValidationModal(false)}
        footer={[
          <Button key="cancel" onClick={() => setValidationModal(false)}>Annuler</Button>,
          <Button key="reject" danger onClick={() => handleValidation('rejeter')} loading={submitting}>
            Rejeter
          </Button>,
          <Button key="approve" type="primary" onClick={() => handleValidation('valider')} loading={submitting}>
            Valider
          </Button>,
        ]}
      >
        <TextArea
          rows={4}
          placeholder="Commentaire (optionnel)"
          value={commentaire}
          onChange={(e) => setCommentaire(e.target.value)}
        />
      </Modal>
    </div>
  );
};

export default DetailCourrierInterne;