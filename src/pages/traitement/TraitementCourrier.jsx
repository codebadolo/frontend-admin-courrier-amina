import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import {
  Card, Steps, Button, Typography, Tag, Row, Col,
  Descriptions, Timeline, Space, Modal, Form, Input,
  Select, message, Divider, Badge, Progress, Alert, Tabs
} from 'antd';
import {
  ArrowLeftOutlined,
  PlayCircleOutlined,
  EditOutlined,
  SendOutlined,
  CheckOutlined,
  SignatureOutlined,
  MailOutlined,
  HistoryOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import { traitementService } from '@/services/traitementService';
import { toast } from 'react-toastify';

const { Title, Text, Paragraph } = Typography;
const { Step } = Steps;
const { Option } = Select;
const { TextArea } = Input;
const { TabPane } = Tabs;

const TraitementCourrier = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [courrier, setCourrier] = useState(null);
  const [timelineData, setTimelineData] = useState([]);
  const [activeStep, setActiveStep] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState('');
  const [validationModal, setValidationModal] = useState(false);
  const [selectedValidation, setSelectedValidation] = useState(null);

  useEffect(() => {
    if (id) {
      fetchCourrierDetail();
      fetchTimeline();
    }
  }, [id]);

  const fetchCourrierDetail = async () => {
    try {
      setLoading(true);
      const data = await traitementService.getDetailTraitement(id);
      setCourrier(data.courrier);
      
      // Déterminer l'étape active
      const etapes = [
        'prise_en_charge',
        'analyse',
        'instruction',
        'redaction',
        'validation',
        'signature',
        'envoi',
        'cloture'
      ];
      const currentStep = etapes.indexOf(data.courrier.traitement_statut);
      setActiveStep(currentStep >= 0 ? currentStep : 0);
      
    } catch (error) {
      toast.error('Erreur lors du chargement des détails');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTimeline = async () => {
    try {
      const data = await traitementService.getTimeline(id);
      setTimelineData(data);
    } catch (error) {
      console.error(error);
    }
  };

  const getStepStatus = (stepIndex) => {
    if (stepIndex < activeStep) return 'finish';
    if (stepIndex === activeStep) return 'process';
    return 'wait';
  };

  const handlePrendreEnCharge = async () => {
    try {
      await traitementService.prendreEnCharge(id, {});
      toast.success('Courrier pris en charge avec succès');
      fetchCourrierDetail();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erreur lors de la prise en charge');
    }
  };

  const handleRedigerReponse = async (values) => {
    try {
      await traitementService.redigerReponse(id, values);
      toast.success('Réponse rédigée avec succès');
      setModalVisible(false);
      fetchCourrierDetail();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erreur lors de la rédaction');
    }
  };

  const handleSoumettreValidation = async (values) => {
    try {
      await traitementService.soumettreValidation(id, values);
      toast.success('Courrier soumis pour validation');
      setModalVisible(false);
      fetchCourrierDetail();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erreur lors de la soumission');
    }
  };

  const handleValidation = async (action) => {
    try {
      await traitementService.valider(id, {
        validation_id: selectedValidation.id,
        action,
        commentaire: form.getFieldValue('commentaire')
      });
      toast.success(`Validation ${action}ée avec succès`);
      setValidationModal(false);
      fetchCourrierDetail();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erreur lors de la validation');
    }
  };

  const openModal = (type) => {
    setModalType(type);
    setModalVisible(true);
  };

  const renderActionButtons = () => {
    if (!courrier) return null;

    const actions = [];

    if (!courrier.agent_traitant) {
      actions.push(
        <Button
          key="prendre"
          type="primary"
          icon={<PlayCircleOutlined />}
          onClick={handlePrendreEnCharge}
        >
          Prendre en charge
        </Button>
      );
    }

    if (courrier.traitement_statut === 'redaction') {
      actions.push(
        <Button
          key="rediger"
          type="primary"
          icon={<EditOutlined />}
          onClick={() => openModal('redaction')}
        >
          Rédiger la réponse
        </Button>
      );
    }

    if (courrier.traitement_statut === 'redaction' && courrier.reponse_associee) {
      actions.push(
        <Button
          key="soumettre"
          type="primary"
          icon={<SendOutlined />}
          onClick={() => openModal('validation')}
        >
          Soumettre pour validation
        </Button>
      );
    }

    if (courrier.traitement_statut === 'signature') {
      actions.push(
        <Button
          key="signer"
          type="primary"
          icon={<SignatureOutlined />}
          onClick={() => openModal('signature')}
        >
          Signer électroniquement
        </Button>
      );
    }

    if (courrier.traitement_statut === 'envoi') {
      actions.push(
        <Button
          key="envoyer"
          type="primary"
          icon={<MailOutlined />}
          onClick={() => openModal('envoi')}
        >
          Envoyer la réponse
        </Button>
      );
    }

    return actions;
  };

  if (loading) {
    return <div>Chargement...</div>;
  }

  if (!courrier) {
    return <Alert message="Courrier non trouvé" type="error" />;
  }

  return (
    <div style={{ padding: '24px' }}>
      {/* En-tête */}
      <Space direction="vertical" style={{ width: '100%', marginBottom: '24px' }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(-1)}
        >
          Retour
        </Button>
        
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={3}>Traitement du courrier</Title>
            <Space>
              <Text strong style={{ fontSize: '18px' }}>{courrier.reference}</Text>
              <Tag color="blue">{courrier.type_display}</Tag>
              <Tag color={courrier.priorite === 'urgente' ? 'red' : 'orange'}>
                {courrier.priorite_display}
              </Tag>
              <Badge 
                status={courrier.est_en_retard ? 'error' : 'success'} 
                text={courrier.est_en_retard ? 'En retard' : 'Dans les délais'}
              />
            </Space>
          </Col>
          <Col>
            <Space>{renderActionButtons()}</Space>
          </Col>
        </Row>
      </Space>

      {/* Étapes du workflow */}
      <Card style={{ marginBottom: '24px' }}>
        <Steps current={activeStep} status={courrier.est_en_retard ? 'error' : 'process'}>
          <Step title="Prise en charge" status={getStepStatus(0)} />
          <Step title="Analyse" status={getStepStatus(1)} />
          <Step title="Instruction" status={getStepStatus(2)} />
          <Step title="Rédaction" status={getStepStatus(3)} />
          <Step title="Validation" status={getStepStatus(4)} />
          <Step title="Signature" status={getStepStatus(5)} />
          <Step title="Envoi" status={getStepStatus(6)} />
          <Step title="Clôture" status={getStepStatus(7)} />
        </Steps>
        
        {courrier.progression > 0 && (
          <div style={{ marginTop: '16px' }}>
            <Text strong>Progression globale: </Text>
            <Progress percent={courrier.progression} size="small" />
          </div>
        )}
      </Card>

      <Row gutter={[16, 16]}>
        {/* Informations du courrier */}
        <Col span={16}>
          <Tabs defaultActiveKey="details">
            <TabPane tab="Détails du courrier" key="details">
              <Card>
                <Descriptions bordered column={2}>
                  <Descriptions.Item label="Objet" span={2}>
                    {courrier.objet}
                  </Descriptions.Item>
                  <Descriptions.Item label="Expéditeur">
                    {courrier.expediteur_nom}
                  </Descriptions.Item>
                  <Descriptions.Item label="Date réception">
                    {new Date(courrier.date_reception).toLocaleDateString()}
                  </Descriptions.Item>
                  <Descriptions.Item label="Service imputé">
                    {courrier.service_impute_detail?.nom || '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Agent traitant">
                    {courrier.agent_traitant_detail?.full_name || 'Non assigné'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Délai restant">
                    <Text type={courrier.delai_restant < 3 ? 'danger' : 'success'}>
                      {courrier.delai_restant} jours
                    </Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Contenu" span={2}>
                    <Paragraph>
                      <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
                        {courrier.contenu_texte || 'Aucun contenu'}
                      </pre>
                    </Paragraph>
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            </TabPane>
            
            <TabPane tab="Pièces jointes" key="pieces">
              <Card>
                {/* Liste des pièces jointes */}
              </Card>
            </TabPane>
            
            <TabPane tab="Réponse" key="reponse">
              <Card>
                {/* Détails de la réponse */}
              </Card>
            </TabPane>
          </Tabs>
        </Col>

        {/* Timeline et actions */}
        <Col span={8}>
          <Card title="Historique des actions" style={{ marginBottom: '16px' }}>
            <Timeline>
              {timelineData.map((item, index) => (
                <Timeline.Item key={index} color={item.type === 'validation' ? 'green' : 'blue'}>
                  <Text strong>{item.titre}</Text>
                  <br />
                  <Text type="secondary">{item.description}</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    {new Date(item.date).toLocaleString()} par {item.auteur}
                  </Text>
                </Timeline.Item>
              ))}
            </Timeline>
          </Card>

          {/* Validations en cours */}
          {courrier.validations && courrier.validations.length > 0 && (
            <Card title="Validations requises">
              {courrier.validations.map((validation) => (
                <div key={validation.id} style={{ marginBottom: '8px' }}>
                  <Row justify="space-between" align="middle">
                    <Col>
                      <Text strong>{validation.type_validation_display}</Text>
                      <br />
                      <Text type="secondary">
                        Validateur: {validation.validateur_detail?.full_name || 'Non assigné'}
                      </Text>
                    </Col>
                    <Col>
                      <Tag color={
                        validation.statut === 'valide' ? 'green' :
                        validation.statut === 'rejete' ? 'red' :
                        validation.statut === 'en_attente' ? 'orange' : 'blue'
                      }>
                        {validation.statut_display}
                      </Tag>
                      {validation.statut === 'en_attente' && validation.validateur_detail && (
                        <Button
                          size="small"
                          onClick={() => {
                            setSelectedValidation(validation);
                            setValidationModal(true);
                          }}
                        >
                          Valider
                        </Button>
                      )}
                    </Col>
                  </Row>
                  <Divider style={{ margin: '8px 0' }} />
                </div>
              ))}
            </Card>
          )}
        </Col>
      </Row>

      {/* Modales */}
      <Modal
        title="Rédiger une réponse"
        visible={modalVisible && modalType === 'redaction'}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleRedigerReponse}
        >
          <Form.Item
            name="type_reponse"
            label="Type de réponse"
            rules={[{ required: true }]}
          >
            <Select>
              <Option value="lettre">Lettre officielle</Option>
              <Option value="email">Email</Option>
              <Option value="note_interne">Note interne</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="objet"
            label="Objet"
            rules={[{ required: true }]}
          >
            <Input placeholder="Objet de la réponse" />
          </Form.Item>
          
          <Form.Item
            name="contenu"
            label="Contenu"
            rules={[{ required: true }]}
          >
            <TextArea rows={10} placeholder="Contenu de la réponse..." />
          </Form.Item>
          
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Enregistrer la réponse
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Validation"
        visible={validationModal}
        onCancel={() => setValidationModal(false)}
        footer={[
          <Button key="rejeter" danger onClick={() => handleValidation('rejeter')}>
            Rejeter
          </Button>,
          <Button key="valider" type="primary" onClick={() => handleValidation('valider')}>
            Valider
          </Button>,
        ]}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="commentaire"
            label="Commentaire (optionnel)"
          >
            <TextArea rows={4} placeholder="Ajouter un commentaire..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TraitementCourrier;