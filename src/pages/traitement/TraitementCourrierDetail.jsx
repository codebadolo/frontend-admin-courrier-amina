import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card, Button, Typography, Row, Col, Space, Tag, Divider,
  Descriptions, Steps, Alert, message, Spin, Form,
  Progress, Timeline, List, Avatar, Tabs, Badge,
  Statistic, Tooltip, Input, Modal
} from 'antd';
import {
  ArrowLeftOutlined, PlayCircleOutlined, FileTextOutlined,
  CheckCircleOutlined, EditOutlined, UserOutlined, ClockCircleOutlined,
  HistoryOutlined, FileDoneOutlined, SendOutlined, InboxOutlined,
  DownloadOutlined, ToolOutlined, MessageOutlined, FileAddOutlined,
  ExclamationCircleOutlined, TeamOutlined,
  CalendarOutlined, PaperClipOutlined, CommentOutlined,
  SolutionOutlined, ContainerOutlined
} from '@ant-design/icons';
import { traitementService } from '../../services/traitementService';
import { getCourrier } from '../../services/courrierService';
import { adaptateurCourrier } from '../../services/adaptateurCourrier';
import SelectDestinataireService from '../../components/common/SelectDestinataireService'

// Modales externes
import PriseEnChargeModal from './PriseEnChargeModal';
import RedactionReponseModal from './RedactionReponseModal';
import ValidationModal from './ValidationModal';
import TraitementTimeline from './TraitementTimeline';

const { Title, Text } = Typography;
const { Step } = Steps;
const { TabPane } = Tabs;
const { TextArea } = Input;

const TraitementCourrierDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [courrier, setCourrier] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [activeStep, setActiveStep] = useState(0);
  const [activeTab, setActiveTab] = useState('traitement');
  const [userInfo, setUserInfo] = useState(null);
  const [error, setError] = useState(null);

  // États des modales
  const [priseEnChargeModal, setPriseEnChargeModal] = useState(false);
  const [redactionModal, setRedactionModal] = useState(false);
  const [validationModal, setValidationModal] = useState(false);
  const [instructionModal, setInstructionModal] = useState(false);
  const [commentaireModal, setCommentaireModal] = useState(false);

  // Formulaire pour instruction
  const [formInstruction] = Form.useForm();
  const [formCommentaire] = Form.useForm();

  // Charger les infos utilisateur au démarrage
  useEffect(() => {
    const loadUserInfo = () => {
      const user = {
        id: localStorage.getItem('userId'),
        role: localStorage.getItem('userRole'),
        name: localStorage.getItem('userName'),
        email: localStorage.getItem('userEmail'),
        serviceId: localStorage.getItem('userServiceId')
      };
      setUserInfo(user);
    };
    loadUserInfo();
  }, []);

  useEffect(() => {
    if (id) {
      fetchCourrierDetail();
      fetchTimeline();
    }
  }, [id]);

  const fetchCourrierDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await traitementService.getDetailTraitement(id);
      // Si l'API renvoie { courrier: {...} }, adapter selon votre structure
      const courrierData = data.courrier || data;
      const courrierAdapte = adaptateurCourrier?.adapterCourrierPourTraitement
        ? adaptateurCourrier.adapterCourrierPourTraitement(courrierData)
        : courrierData;
      setCourrier(courrierAdapte);
      setActiveStep(determinerEtapeCourante(courrierAdapte.traitement_statut));
    } catch (err) {
      console.error('Erreur chargement détail traitement:', err);
      setError('Impossible de charger les détails du courrier. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const fetchTimeline = async () => {
    try {
      const data = await traitementService.getTimeline(id);
      setTimeline(data);
    } catch (err) {
      console.warn('Erreur chargement timeline:', err);
      setTimeline([]);
    }
  };

  const determinerEtapeCourante = (statutDjango) => {
    const mapping = {
      recu: 0,
      impute: 0,
      prise_en_charge: 1,
      analyse: 2,
      instruction: 3,
      redaction: 4,
      validation: 5,
      signature: 6,
      envoi: 7,
      cloture: 8,
      rejete: 8
    };
    return mapping[statutDjango] || 0;
  };

  const ajouterEvenementTimeline = (titre, description) => {
    // Optimiste : on ajoute un événement local, l'API sera rappelée plus tard
    const nouvelEvenement = {
      id: Date.now(),
      titre,
      description,
      statut: 'termine',
      auteur: userInfo?.name || 'Système',
      date: new Date().toISOString()
    };
    setTimeline(prev => [nouvelEvenement, ...prev]);
  };

  // Handlers d'action – appels réels au service
  const handlePrendreEnCharge = async (values) => {
    try {
      const payload = {
        delai_jours: values.delai_jours,
        commentaire: values.commentaire,
        agent_id: userInfo?.id,
        date_action: new Date().toISOString()
      };
      await traitementService.prendreEnCharge(id, payload);
      message.success('Courrier pris en charge');
      setPriseEnChargeModal(false);
      fetchCourrierDetail();
      fetchTimeline();
      ajouterEvenementTimeline('Prise en charge', `Pris en charge par ${userInfo?.name}`);
    } catch (err) {
      message.error(err.response?.data?.error || 'Erreur lors de la prise en charge');
    }
  };

  const handleCommencerAnalyse = async () => {
    try {
      await traitementService.ajouterInstruction(id, {
        type: 'analyse',
        instruction: 'Début de l\'analyse du courrier',
        agent_assignee_id: userInfo?.id
      });
      message.success('Analyse démarrée');
      fetchCourrierDetail();
      fetchTimeline();
      ajouterEvenementTimeline('Analyse démarrée', 'Début de l\'analyse du contenu');
    } catch (err) {
      message.error(err.response?.data?.error || 'Erreur lors du démarrage de l\'analyse');
    }
  };

  const handleRedigerReponse = async (values) => {
    try {
      const payload = {
        type_reponse: values.type_reponse,
        objet_reponse: values.objet,
        contenu_reponse: values.contenu,
        destinataires: values.destinataires,
        copies: values.copies || [],
        modele_id: values.modele_id,
        canal_envoi: values.canal_envoi
      };
      await traitementService.redigerReponse(id, payload);
      message.success('Réponse enregistrée');
      setRedactionModal(false);
      fetchCourrierDetail();
      fetchTimeline();
      ajouterEvenementTimeline('Réponse rédigée', `Réponse rédigée par ${userInfo?.name}`);
    } catch (err) {
      message.error(err.response?.data?.error || 'Erreur lors de la rédaction');
    }
  };

  const handleSoumettreValidation = async (values) => {
    try {
      const payload = {
        type_validation: values.type_validation,
        niveau_validation: values.niveau_validation,
        validateurs: values.validateurs,
        commentaires: values.commentaire
      };
      await traitementService.soumettreValidation(id, payload);
      message.success('Courrier soumis pour validation');
      setValidationModal(false);
      fetchCourrierDetail();
      fetchTimeline();
      ajouterEvenementTimeline(
        'Soumis validation',
        `Soumis à ${values.validateurs?.length || 0} validateur(s)`
      );
    } catch (err) {
      message.error(err.response?.data?.error || 'Erreur lors de la soumission');
    }
  };

  const handleAjouterInstruction = async (values) => {
    try {
      await traitementService.ajouterInstruction(id, {
        type: 'instruction',
        instruction: values.contenu,
        agent_assignee_id: values.destinataire,  // ← ID de l'utilisateur sélectionné
      });
      message.success('Instruction ajoutée');
      setInstructionModal(false);
      formInstruction.resetFields();
      ajouterEvenementTimeline('Instruction', values.contenu);
    } catch (err) {
      message.error(err.response?.data?.error || 'Erreur lors de l\'ajout');
    }
  };

  // Permissions
  const permissions = useMemo(() => {
    if (!userInfo || !courrier) return {};
    const userRole = userInfo.role;
    const courrierStatut = courrier.traitement_statut;
    const isAgentCourrier = courrier.agent_traitant === userInfo.id;
    return {
      canTakeCharge: !courrier.agent_traitant && ['recu', 'impute'].includes(courrierStatut),
      canAnalyze: isAgentCourrier && courrierStatut === 'prise_en_charge',
      canRediger: isAgentCourrier && courrierStatut === 'analyse',
      canValider: isAgentCourrier && courrierStatut === 'redaction',
      isAdmin: userRole === 'admin',
      isChef: userRole === 'chef',
      isAgent: userRole === 'agent_service',
      isCollaborateur: userRole === 'collaborateur'
    };
  }, [userInfo, courrier]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <Spin size="large" tip="Chargement du courrier..." />
      </div>
    );
  }

  if (error || !courrier) {
    return (
      <div style={{ padding: '20px' }}>
        <Alert
          message="Courrier non trouvé"
          description={error || "Le courrier demandé n'existe pas ou vous n'avez pas les droits d'accès."}
          type="error"
          showIcon
          action={
            <Button type="primary" onClick={() => navigate('/traitement/courriers')}>
              Retour à la liste
            </Button>
          }
        />
      </div>
    );
  }

  const etapesTraitement = [
    { titre: 'Réception', description: 'Courrier reçu', icon: <InboxOutlined />, couleur: '#1890ff' },
    { titre: 'Prise en charge', description: 'Assignation agent', icon: <UserOutlined />, couleur: '#52c41a' },
    { titre: 'Analyse', description: 'Étude du contenu', icon: <FileTextOutlined />, couleur: '#722ed1' },
    { titre: 'Instruction', description: 'Tâches préparatoires', icon: <ToolOutlined />, couleur: '#13c2c2' },
    { titre: 'Rédaction', description: 'Préparation réponse', icon: <EditOutlined />, couleur: '#fa8c16' },
    { titre: 'Validation', description: 'Approbation', icon: <CheckCircleOutlined />, couleur: '#faad14' },
    { titre: 'Signature', description: 'Signature officielle', icon: <FileDoneOutlined />, couleur: '#f5222d' },
    { titre: 'Envoi', description: 'Expédition', icon: <SendOutlined />, couleur: '#13c2c2' },
    { titre: 'Clôture', description: 'Traitement terminé', icon: <CheckCircleOutlined />, couleur: '#52c41a' }
  ];

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* En-tête */}
      <Row justify="space-between" align="middle" style={{ marginBottom: '24px' }}>
        <Col>
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)} size="large">
              Retour
            </Button>
            <div>
              <Title level={2} style={{ margin: 0 }}>
                <ToolOutlined style={{ marginRight: '12px', color: '#1890ff' }} />
                Traitement du courrier
              </Title>
              <Text type="secondary">
                {courrier.reference} • {courrier.objet}
              </Text>
            </div>
          </Space>
        </Col>
        <Col>
          <Space>
            <Badge
              status="processing"
              text={<Text strong>{courrier.traitement_statut?.replace('_', ' ').toUpperCase()}</Text>}
            />
            <Tag color={courrier.priorite === 'urgente' ? 'red' : 'orange'}>
              {courrier.priorite?.toUpperCase()}
            </Tag>
          </Space>
        </Col>
      </Row>

      {/* Steps */}
      <Card
        title={<Space><SolutionOutlined /> Processus de traitement</Space>}
        style={{ marginBottom: '24px' }}
      >
        <Steps current={activeStep} labelPlacement="vertical" size="small">
          {etapesTraitement.map((etape, index) => (
            <Step
              key={index}
              title={etape.titre}
              description={etape.description}
              icon={<div style={{ color: etape.couleur }}>{etape.icon}</div>}
            />
          ))}
        </Steps>
      </Card>

      {/* Onglets */}
      <Tabs activeKey={activeTab} onChange={setActiveTab} size="large">
        <TabPane
          tab={<Space><ContainerOutlined /> Traitement</Space>}
          key="traitement"
        >
          <Row gutter={24}>
            <Col span={16}>
              <Card title="Détails du courrier" style={{ marginBottom: '24px' }}>
                <Descriptions column={2} bordered size="middle">
                  <Descriptions.Item label="Référence" span={2}>
                    <Text strong copyable>{courrier.reference}</Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Objet">{courrier.objet}</Descriptions.Item>
                  <Descriptions.Item label="Expéditeur">
                    <Space><UserOutlined />{courrier.expediteur_nom}</Space>
                  </Descriptions.Item>
                  <Descriptions.Item label="Date réception">
                    <Space><CalendarOutlined />{new Date(courrier.date_reception).toLocaleDateString()}</Space>
                  </Descriptions.Item>
                  <Descriptions.Item label="Service imputé">
                    <Space><TeamOutlined />{courrier.service_impute_detail?.nom}</Space>
                  </Descriptions.Item>
                  <Descriptions.Item label="Agent traitant">
                    {courrier.agent_traitant_detail ? (
                      <Space>
                        <Avatar icon={<UserOutlined />} size="small" />
                        {courrier.agent_traitant_detail.username}
                      </Space>
                    ) : 'Non assigné'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Échéance">
                    <Text type={courrier.est_en_retard ? 'danger' : 'secondary'}>
                      {courrier.date_echeance ? new Date(courrier.date_echeance).toLocaleDateString() : 'Non définie'}
                    </Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Jours restants">
                    <Tag color={courrier.jours_restants < 3 ? 'red' : 'blue'}>
                      {courrier.jours_restants || 'N/A'} jours
                    </Tag>
                  </Descriptions.Item>
                </Descriptions>
              </Card>

              {courrier.contenu_texte && (
                <Card title="Contenu du courrier">
                  <div style={{ padding: '16px', backgroundColor: '#fafafa', borderRadius: '6px', maxHeight: '300px', overflowY: 'auto' }}>
                    <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', margin: 0 }}>
                      {courrier.contenu_texte}
                    </pre>
                  </div>
                </Card>
              )}
            </Col>

            <Col span={8}>
              <Card title="Actions rapides" style={{ marginBottom: '24px' }}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  {permissions.canTakeCharge && (
                    <Button
                      type="primary"
                      block
                      size="large"
                      icon={<PlayCircleOutlined />}
                      onClick={() => setPriseEnChargeModal(true)}
                    >
                      Prendre en charge
                    </Button>
                  )}
                  {permissions.canAnalyze && (
                    <Button
                      type="primary"
                      block
                      size="large"
                      icon={<FileTextOutlined />}
                      onClick={handleCommencerAnalyse}
                    >
                      Commencer l'analyse
                    </Button>
                  )}
                  {permissions.canRediger && (
                    <Button
                      type="primary"
                      block
                      size="large"
                      icon={<EditOutlined />}
                      onClick={() => setRedactionModal(true)}
                    >
                      Rédiger la réponse
                    </Button>
                  )}
                  {permissions.canValider && (
                    <Button
                      type="primary"
                      block
                      size="large"
                      icon={<CheckCircleOutlined />}
                      onClick={() => setValidationModal(true)}
                    >
                      Soumettre validation
                    </Button>
                  )}
                  <Divider />
                  <Button
                    block
                    icon={<CommentOutlined />}
                    onClick={() => setInstructionModal(true)}
                  >
                    Ajouter une instruction
                  </Button>
                  <Button
                    block
                    icon={<MessageOutlined />}
                    onClick={() => setCommentaireModal(true)}
                  >
                    Ajouter un commentaire
                  </Button>
                  <Button
                    block
                    icon={<HistoryOutlined />}
                    onClick={fetchTimeline}
                  >
                    Actualiser chronologie
                  </Button>
                </Space>
              </Card>

              <Card title="Suivi du traitement">
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Statistic
                    title="Progression"
                    value={courrier.progression || 0}
                    suffix="%"
                    valueStyle={{ color: '#1890ff' }}
                  />
                  <Divider />
                  <div>
                    <Text type="secondary">Début du traitement:</Text>
                    <div style={{ fontWeight: 'bold', marginTop: '4px' }}>
                      {courrier.date_debut_traitement
                        ? new Date(courrier.date_debut_traitement).toLocaleString()
                        : 'Pas encore commencé'}
                    </div>
                  </div>
                  <div>
                    <Text type="secondary">Délai estimé:</Text>
                    <div style={{ fontWeight: 'bold', marginTop: '4px' }}>
                      {courrier.delai_traitement_jours} jours
                    </div>
                  </div>
                  {courrier.est_en_retard && (
                    <Alert
                      message="EN RETARD"
                      description="Le traitement dépasse la date d'échéance"
                      type="error"
                      showIcon
                    />
                  )}
                </Space>
              </Card>
            </Col>
          </Row>
        </TabPane>

        <TabPane
          tab={<Space><HistoryOutlined /> Chronologie</Space>}
          key="chronologie"
        >
          <TraitementTimeline data={timeline} loading={loading} />
        </TabPane>

        <TabPane
          tab={<Space><PaperClipOutlined /> Documents</Space>}
          key="documents"
        >
          <Card title="Documents associés">
            <List
              dataSource={courrier.pieces_jointes || []}
              renderItem={(piece, index) => (
                <List.Item
                  actions={[
                    <Button icon={<DownloadOutlined />} size="small">
                      Télécharger
                    </Button>
                  ]}
                >
                  <List.Item.Meta
                    avatar={<FileTextOutlined style={{ fontSize: '24px' }} />}
                    title={piece.fichier_nom || `Document ${index + 1}`}
                    description={piece.description || 'Aucune description'}
                  />
                </List.Item>
              )}
              locale={{ emptyText: 'Aucun document joint' }}
            />
          </Card>
        </TabPane>
      </Tabs>

      {/* Modales */}
      <PriseEnChargeModal
        open={priseEnChargeModal}
        onOpenChange={setPriseEnChargeModal}
        onSubmit={handlePrendreEnCharge}
        courrier={courrier}
      />

      <RedactionReponseModal
        open={redactionModal}
        onOpenChange={setRedactionModal}
        onSubmit={handleRedigerReponse}
        courrier={courrier}
      />

      <ValidationModal
        open={validationModal}
        onOpenChange={setValidationModal}
        onSubmit={handleSoumettreValidation}
        courrier={courrier}
      />

      <Modal
        title="Ajouter une instruction"
        open={instructionModal}
        onCancel={() => setInstructionModal(false)}
        onOk={() => formInstruction.submit()}
        okText="Ajouter"
        cancelText="Annuler"
      >
        <Form form={formInstruction} onFinish={handleAjouterInstruction} layout="vertical">
          <Form.Item name="contenu" label="Instruction" rules={[{ required: true }]}>
            <TextArea rows={4} />
          </Form.Item>
          <Form.Item name="destinataire" label="Destinataire (agent)">
            <Input placeholder="ID de l'agent" />
            
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Ajouter un commentaire"
        open={commentaireModal}
        onCancel={() => setCommentaireModal(false)}
        onOk={() => formCommentaire.submit()}
        okText="Ajouter"
        cancelText="Annuler"
      >
        <Form
          form={formCommentaire}
          onFinish={(values) => {
            ajouterEvenementTimeline('Commentaire', values.contenu);
            setCommentaireModal(false);
            formCommentaire.resetFields();
            message.success('Commentaire ajouté');
          }}
          layout="vertical"
        >
          <Form.Item name="contenu" label="Commentaire" rules={[{ required: true }]}>
            <TextArea rows={4} />
          </Form.Item>
        </Form>
        <Modal
          title="Ajouter une instruction"
          open={instructionModal}
          onCancel={() => setInstructionModal(false)}
          onOk={() => formInstruction.submit()}
          okText="Ajouter"
          cancelText="Annuler"
        >
          <Form form={formInstruction} onFinish={handleAjouterInstruction} layout="vertical">
            <Form.Item name="contenu" label="Instruction" rules={[{ required: true }]}>
              <TextArea rows={4} />
            </Form.Item>

            <Form.Item
              name="destinataire"
              label="Destinataire (agent / collaborateur)"
              rules={[{ required: true, message: 'Veuillez sélectionner un destinataire' }]}
            >
              <SelectDestinataireService
                serviceId={userInfo?.serviceId}
                roles={['agent_service', 'collaborateur']}
                placeholder="Sélectionnez un agent ou collaborateur"
              />
            </Form.Item>
          </Form>
        </Modal>
      </Modal>
    </div>
  );
};

export default TraitementCourrierDetail;