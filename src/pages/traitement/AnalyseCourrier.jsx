// src/pages/traitement/AnalyseCourrier.jsx
import React, { useState, useEffect } from 'react';
import {
  Card, Form, Input, Button, Space, List, Tag, Modal,
  message, Alert, Descriptions, Tooltip, Select, Checkbox,
  Row, Col, Badge, Timeline, Divider, Typography, Spin,
  DatePicker, Collapse
} from 'antd';
import {
  FileTextOutlined, TeamOutlined, CommentOutlined,
  CheckCircleOutlined, ClockCircleOutlined, CalendarOutlined,
  PlusOutlined, DeleteOutlined, EditOutlined,
  UserOutlined, SendOutlined, SaveOutlined, WarningOutlined,
  RollbackOutlined, FileAddOutlined, FolderOpenOutlined,
  FlagOutlined, DownloadOutlined, EyeOutlined
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import axios from 'axios';

const { TextArea } = Input;
const { Option } = Select;
const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;

const AnalyseCourrier = ({ courrier, onComplete }) => {
  const [form] = Form.useForm();
  const [actionForm] = Form.useForm();
  const [documentForm] = Form.useForm();
  const [consultationForm] = Form.useForm();
  
  const [loading, setLoading] = useState(false);
  const [servicesConsultables, setServicesConsultables] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [consultationModal, setConsultationModal] = useState(false);
  const [actions, setActions] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  
  // États pour les modales d'actions et documents
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [documentModalVisible, setDocumentModalVisible] = useState(false);
  const [editingAction, setEditingAction] = useState(null);
  const [editingDocument, setEditingDocument] = useState(null);
  
  const navigate = useNavigate();
  const { id } = useParams();

  // Initialiser les données
  useEffect(() => {
    if (courrier) {
      // Charger les données existantes
      form.setFieldsValue({
        analyse_notes: courrier.analyse_notes || '',
        decision_preliminaire: courrier.decision_preliminaire || '',
        prochaine_etape: courrier.traitement_statut || 'instruction'
      });
      
      // Formater les actions avec structure complète
      const actionsData = (courrier.actions_requises || []).map((item, index) => ({
        id: item.id || Date.now() + index,
        description: item.description || item,
        priorite: item.priorite || 'normale',
        echeance: item.echeance ? dayjs(item.echeance) : null,
        assignee: item.assignee || null,
        notes: item.notes || '',
        statut: item.statut || 'a_faire',
        date_creation: item.date_creation || dayjs().format('YYYY-MM-DD')
      }));
      setActions(actionsData);
      
      // Formater les documents avec structure complète
      const docsData = (courrier.documents_necessaires || []).map((item, index) => ({
        id: item.id || Date.now() + index,
        nom: item.nom || item,
        type: item.type || 'document',
        fourni: item.fourni || false,
        date_limite: item.date_limite ? dayjs(item.date_limite) : null,
        responsable: item.responsable || null,
        notes: item.notes || ''
      }));
      setDocuments(docsData);
      
      // Charger les consultations
      setConsultations(courrier.consultations || []);
      
      // Charger les services consultables
      loadServicesConsultables();
    }
    setInitialLoading(false);
  }, [courrier]);

  const loadServicesConsultables = async () => {
    try {
      const response = await axios.get(
        `http://localhost:8000/api/courriers/courriers/${id}/services_consultables/`
      );
      setServicesConsultables(response.data);
    } catch (error) {
      console.error("Erreur chargement services:", error);
    }
  };

  // ==================== GESTION DES ACTIONS ====================
  const handleAddAction = (values) => {
    const newAction = {
      id: Date.now(),
      description: values.description,
      priorite: values.priorite || 'normale',
      echeance: values.echeance,
      assignee: values.assignee,
      notes: values.notes,
      statut: 'a_faire',
      date_creation: dayjs().format('YYYY-MM-DD')
    };
    setActions([...actions, newAction]);
    setActionModalVisible(false);
    actionForm.resetFields();
    message.success('Action ajoutée avec succès');
  };

  const handleEditAction = (values) => {
    const updatedActions = actions.map(a => 
      a.id === editingAction.id 
        ? { 
            ...a, 
            description: values.description,
            priorite: values.priorite,
            echeance: values.echeance,
            assignee: values.assignee,
            notes: values.notes
          }
        : a
    );
    setActions(updatedActions);
    setActionModalVisible(false);
    setEditingAction(null);
    actionForm.resetFields();
    message.success('Action modifiée avec succès');
  };

  const handleDeleteAction = (id) => {
    Modal.confirm({
      title: 'Confirmer la suppression',
      content: 'Voulez-vous vraiment supprimer cette action ?',
      okText: 'Oui',
      cancelText: 'Non',
      onOk: () => {
        setActions(actions.filter(a => a.id !== id));
        message.success('Action supprimée');
      }
    });
  };

  const handleToggleAction = (id) => {
    setActions(actions.map(a => 
      a.id === id 
        ? { ...a, statut: a.statut === 'fait' ? 'a_faire' : 'fait' }
        : a
    ));
  };

  const openActionModal = (action = null) => {
    if (action) {
      setEditingAction(action);
      actionForm.setFieldsValue({
        description: action.description,
        priorite: action.priorite,
        echeance: action.echeance,
        assignee: action.assignee,
        notes: action.notes
      });
    } else {
      setEditingAction(null);
      actionForm.resetFields();
    }
    setActionModalVisible(true);
  };

  // ==================== GESTION DES DOCUMENTS ====================
  const handleAddDocument = (values) => {
    const newDocument = {
      id: Date.now(),
      nom: values.nom,
      type: values.type || 'document',
      fourni: false,
      date_limite: values.date_limite,
      responsable: values.responsable,
      notes: values.notes
    };
    setDocuments([...documents, newDocument]);
    setDocumentModalVisible(false);
    documentForm.resetFields();
    message.success('Document ajouté avec succès');
  };

  const handleEditDocument = (values) => {
    const updatedDocuments = documents.map(d => 
      d.id === editingDocument.id 
        ? { 
            ...d, 
            nom: values.nom,
            type: values.type,
            date_limite: values.date_limite,
            responsable: values.responsable,
            notes: values.notes
          }
        : d
    );
    setDocuments(updatedDocuments);
    setDocumentModalVisible(false);
    setEditingDocument(null);
    documentForm.resetFields();
    message.success('Document modifié avec succès');
  };

  const handleDeleteDocument = (id) => {
    Modal.confirm({
      title: 'Confirmer la suppression',
      content: 'Voulez-vous vraiment supprimer ce document ?',
      okText: 'Oui',
      cancelText: 'Non',
      onOk: () => {
        setDocuments(documents.filter(d => d.id !== id));
        message.success('Document supprimé');
      }
    });
  };

  const handleToggleDocument = (id) => {
    setDocuments(documents.map(d => 
      d.id === id ? { ...d, fourni: !d.fourni } : d
    ));
  };

  const openDocumentModal = (document = null) => {
    if (document) {
      setEditingDocument(document);
      documentForm.setFieldsValue({
        nom: document.nom,
        type: document.type,
        date_limite: document.date_limite,
        responsable: document.responsable,
        notes: document.notes
      });
    } else {
      setEditingDocument(null);
      documentForm.resetFields();
    }
    setDocumentModalVisible(true);
  };

  // ==================== GESTION DES CONSULTATIONS ====================
  const handleConsultationSubmit = async () => {
    try {
      const values = await consultationForm.validateFields();
      setLoading(true);
      
      const response = await axios.post(
        `http://localhost:8000/api/courriers/courriers/${id}/consulter_service/`,
        {
          service_id: values.service_id,
          motif: values.motif,
          urgence: values.urgence || false
        }
      );
      
      setConsultations([...consultations, response.data.consultation]);
      message.success("Demande d'avis envoyée");
      setConsultationModal(false);
      consultationForm.resetFields();
    } catch (error) {
      console.error("Erreur consultation:", error);
      message.error("Erreur lors de l'envoi de la demande");
    } finally {
      setLoading(false);
    }
  };

  // ==================== SAUVEGARDE ====================
  const handleSaveAnalysis = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      
      const payload = {
        analyse_notes: values.analyse_notes || '',
        actions_requises: actions.map(a => ({
          description: a.description,
          priorite: a.priorite,
          echeance: a.echeance ? a.echeance.format('YYYY-MM-DD') : null,
          assignee: a.assignee,
          notes: a.notes,
          statut: a.statut
        })),
        documents_necessaires: documents.map(d => ({
          nom: d.nom,
          type: d.type,
          fourni: d.fourni,
          date_limite: d.date_limite ? d.date_limite.format('YYYY-MM-DD') : null,
          responsable: d.responsable,
          notes: d.notes
        })),
        consultations: consultations,
        decision_preliminaire: values.decision_preliminaire || '',
        prochaine_etape: values.prochaine_etape || 'instruction'
      };
      
      const response = await axios.post(
        `http://localhost:8000/api/courriers/courriers/${id}/enregistrer_analyse/`,
        payload
      );
      
      message.success("Analyse enregistrée avec succès");
      
      if (onComplete) {
        onComplete(response.data.courrier);
      }
      
      if (values.prochaine_etape === 'instruction') {
        navigate(`/traitement/courriers/${id}/instruction`);
      } else if (values.prochaine_etape === 'redaction') {
        navigate(`/traitement/courriers/${id}/redaction`);
      }
      
    } catch (error) {
      console.error("Erreur enregistrement analyse:", error);
      message.error("Erreur lors de l'enregistrement");
    } finally {
      setLoading(false);
    }
  };

  const handleDemarrerAnalyse = async () => {
    try {
      setLoading(true);
      await axios.post(
        `http://localhost:8000/api/courriers/courriers/${id}/demarrer_analyse/`
      );
      message.success("Analyse démarrée");
    } catch (error) {
      console.error("Erreur démarrage analyse:", error);
      message.error("Erreur lors du démarrage");
    } finally {
      setLoading(false);
    }
  };

  // ==================== MODALES ====================
  const ActionModal = () => (
    <Modal
      title={
        <Space>
          <FlagOutlined /> 
          {editingAction ? "Modifier l'action" : "Nouvelle action"}
        </Space>
      }
      open={actionModalVisible}
      onCancel={() => {
        setActionModalVisible(false);
        setEditingAction(null);
        actionForm.resetFields();
      }}
      onOk={() => {
        actionForm.validateFields()
          .then(values => {
            if (editingAction) {
              handleEditAction(values);
            } else {
              handleAddAction(values);
            }
          })
          .catch(info => console.log('Validation failed:', info));
      }}
      okText={editingAction ? "Modifier" : "Ajouter"}
      cancelText="Annuler"
      width={700}
    >
      <Form form={actionForm} layout="vertical">
        <Form.Item
          name="description"
          label="Description de l'action"
          rules={[{ required: true, message: "La description est requise" }]}
        >
          <Input.TextArea 
            rows={3} 
            placeholder="Décrivez précisément l'action à mener..." 
          />
        </Form.Item>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item name="priorite" label="Priorité">
              <Select defaultValue="normale">
                <Option value="haute">🔴 Haute</Option>
                <Option value="normale">🟡 Normale</Option>
                <Option value="basse">🟢 Basse</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="echeance" label="Date d'échéance">
              <DatePicker 
                style={{ width: '100%' }} 
                format="DD/MM/YYYY"
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="assignee" label="Assigner à">
              <Select 
                allowClear 
                placeholder="Sélectionner un agent"
              >
                {servicesConsultables.map(agent => (
                  <Option key={agent.id} value={agent.id}>
                    {agent.prenom} {agent.nom}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="notes" label="Notes complémentaires">
          <Input.TextArea rows={2} placeholder="Informations supplémentaires..." />
        </Form.Item>
      </Form>
    </Modal>
  );

  const DocumentModal = () => (
    <Modal
      title={
        <Space>
          <FileAddOutlined /> 
          {editingDocument ? "Modifier le document" : "Nouveau document nécessaire"}
        </Space>
      }
      open={documentModalVisible}
      onCancel={() => {
        setDocumentModalVisible(false);
        setEditingDocument(null);
        documentForm.resetFields();
      }}
      onOk={() => {
        documentForm.validateFields()
          .then(values => {
            if (editingDocument) {
              handleEditDocument(values);
            } else {
              handleAddDocument(values);
            }
          })
          .catch(info => console.log('Validation failed:', info));
      }}
      okText={editingDocument ? "Modifier" : "Ajouter"}
      cancelText="Annuler"
      width={700}
    >
      <Form form={documentForm} layout="vertical">
        <Form.Item
          name="nom"
          label="Nom du document"
          rules={[{ required: true, message: "Le nom est requis" }]}
        >
          <Input placeholder="ex: Pièce d'identité, justificatif de domicile..." />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="type" label="Type de document">
              <Select defaultValue="document">
                <Option value="identite">🪪 Pièce d'identité</Option>
                <Option value="justificatif">📄 Justificatif</Option>
                <Option value="contrat">📑 Contrat</Option>
                <Option value="rapport">📊 Rapport</Option>
                <Option value="autre">📁 Autre</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="date_limite" label="Date limite">
              <DatePicker 
                style={{ width: '100%' }} 
                format="DD/MM/YYYY"
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="responsable" label="Responsable de la collecte">
          <Select 
            allowClear 
            placeholder="Sélectionner un responsable"
          >
            {servicesConsultables.map(agent => (
              <Option key={agent.id} value={agent.id}>
                {agent.prenom} {agent.nom}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item name="notes" label="Notes">
          <Input.TextArea rows={2} placeholder="Informations sur le document..." />
        </Form.Item>
      </Form>
    </Modal>
  );

  if (initialLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 50 }}>
        <Spin size="large" tip="Chargement de l'analyse..." />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {/* Modales */}
      <ActionModal />
      <DocumentModal />

      <Row gutter={24}>
        {/* Colonne principale - Analyse */}
        <Col span={16}>
          <Form
            form={form}
            layout="vertical"
            initialValues={{
              prochaine_etape: 'instruction'
            }}
          >
            {/* Notes d'analyse */}
            <Card 
              title={
                <Space>
                  <FileTextOutlined /> Notes d'analyse
                </Space>
              } 
              style={{ marginBottom: 24 }}
            >
              <Form.Item name="analyse_notes">
                <Input.TextArea
                  rows={8}
                  placeholder="Saisissez vos observations, analyses, remarques sur le contenu du courrier..."
                />
              </Form.Item>
            </Card>

            {/* Actions à mener */}
            <Card 
              title={
                <Space>
                  <FlagOutlined /> Actions à mener
                  <Button 
                    type="primary" 
                    size="small" 
                    icon={<PlusOutlined />} 
                    onClick={() => openActionModal()}
                  >
                    Nouvelle action
                  </Button>
                </Space>
              } 
              style={{ marginBottom: 24 }}
            >
              {actions.length > 0 ? (
                <List
                  dataSource={actions}
                  renderItem={(item) => (
                    <List.Item
                      actions={[
                        <Tooltip title={item.statut === 'fait' ? 'Marquer à faire' : 'Marquer comme fait'}>
                          <CheckCircleOutlined 
                            style={{ 
                              color: item.statut === 'fait' ? '#52c41a' : '#d9d9d9',
                              cursor: 'pointer',
                              fontSize: '18px'
                            }}
                            onClick={() => handleToggleAction(item.id)}
                          />
                        </Tooltip>,
                        <Tooltip title="Modifier">
                          <EditOutlined 
                            style={{ color: '#1890ff', cursor: 'pointer', fontSize: '18px' }}
                            onClick={() => openActionModal(item)}
                          />
                        </Tooltip>,
                        <Tooltip title="Supprimer">
                          <DeleteOutlined 
                            style={{ color: '#ff4d4f', cursor: 'pointer', fontSize: '18px' }}
                            onClick={() => handleDeleteAction(item.id)}
                          />
                        </Tooltip>
                      ]}
                    >
                      <List.Item.Meta
                        title={
                          <Space direction="vertical" size={0}>
                            <Space>
                              <Text strong style={{ 
                                textDecoration: item.statut === 'fait' ? 'line-through' : 'none',
                                color: item.statut === 'fait' ? '#999' : 'inherit'
                              }}>
                                {item.description}
                              </Text>
                              {item.priorite === 'haute' && <Tag color="red">Haute</Tag>}
                              {item.priorite === 'normale' && <Tag color="orange">Normale</Tag>}
                              {item.priorite === 'basse' && <Tag color="green">Basse</Tag>}
                            </Space>
                            <Space size="middle" style={{ marginTop: 4 }}>
                              {item.echeance && (
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                  <CalendarOutlined /> {dayjs(item.echeance).format('DD/MM/YYYY')}
                                </Text>
                              )}
                              {item.assignee && (
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                  <UserOutlined /> Agent {item.assignee}
                                </Text>
                              )}
                            </Space>
                            {item.notes && (
                              <Text type="secondary" style={{ fontSize: 12, marginTop: 4 }}>
                                📝 {item.notes}
                              </Text>
                            )}
                          </Space>
                        }
                      />
                    </List.Item>
                  )}
                />
              ) : (
                <Alert
                  message="Aucune action planifiée"
                  description="Ajoutez les actions à mener pour ce courrier"
                  type="info"
                  showIcon
                />
              )}
            </Card>

            {/* Documents nécessaires */}
            <Card 
              title={
                <Space>
                  <FolderOpenOutlined /> Documents nécessaires
                  <Button 
                    type="primary" 
                    size="small" 
                    icon={<PlusOutlined />} 
                    onClick={() => openDocumentModal()}
                  >
                    Nouveau document
                  </Button>
                </Space>
              } 
              style={{ marginBottom: 24 }}
            >
              {documents.length > 0 ? (
                <List
                  dataSource={documents}
                  renderItem={(item) => (
                    <List.Item
                      actions={[
                        <Tooltip title={item.fourni ? 'Marquer non fourni' : 'Marquer fourni'}>
                          <CheckCircleOutlined 
                            style={{ 
                              color: item.fourni ? '#52c41a' : '#d9d9d9',
                              cursor: 'pointer',
                              fontSize: '18px'
                            }}
                            onClick={() => handleToggleDocument(item.id)}
                          />
                        </Tooltip>,
                        <Tooltip title="Modifier">
                          <EditOutlined 
                            style={{ color: '#1890ff', cursor: 'pointer', fontSize: '18px' }}
                            onClick={() => openDocumentModal(item)}
                          />
                        </Tooltip>,
                        <Tooltip title="Supprimer">
                          <DeleteOutlined 
                            style={{ color: '#ff4d4f', cursor: 'pointer', fontSize: '18px' }}
                            onClick={() => handleDeleteDocument(item.id)}
                          />
                        </Tooltip>
                      ]}
                    >
                      <List.Item.Meta
                        title={
                          <Space direction="vertical" size={0}>
                            <Space>
                              <Text strong style={{ 
                                textDecoration: item.fourni ? 'line-through' : 'none',
                                color: item.fourni ? '#999' : 'inherit'
                              }}>
                                {item.nom}
                              </Text>
                              <Tag color={item.fourni ? 'success' : 'warning'}>
                                {item.fourni ? 'Fourni' : 'En attente'}
                              </Tag>
                              <Tag>{item.type}</Tag>
                            </Space>
                            <Space size="middle" style={{ marginTop: 4 }}>
                              {item.date_limite && (
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                  <CalendarOutlined /> Limite: {dayjs(item.date_limite).format('DD/MM/YYYY')}
                                </Text>
                              )}
                              {item.responsable && (
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                  <UserOutlined /> Resp: Agent {item.responsable}
                                </Text>
                              )}
                            </Space>
                            {item.notes && (
                              <Text type="secondary" style={{ fontSize: 12, marginTop: 4 }}>
                                📝 {item.notes}
                              </Text>
                            )}
                          </Space>
                        }
                      />
                    </List.Item>
                  )}
                />
              ) : (
                <Alert
                  message="Aucun document requis"
                  description="Ajoutez les documents nécessaires au traitement"
                  type="info"
                  showIcon
                />
              )}
            </Card>

            {/* Décision préliminaire */}
            <Card 
              title={
                <Space>
                  <CommentOutlined /> Décision préliminaire
                </Space>
              } 
              style={{ marginBottom: 24 }}
            >
              <Form.Item name="decision_preliminaire">
                <Input.TextArea
                  rows={4}
                  placeholder="Quelle est votre décision préliminaire concernant ce courrier ?"
                />
              </Form.Item>
            </Card>
          </Form>
        </Col>

        {/* Colonne latérale */}
        <Col span={8}>
          {/* Consultations */}
          <Card 
            title={
              <Space>
                <TeamOutlined /> Consultations
                <Button
                  type="primary"
                  size="small"
                  icon={<PlusOutlined />}
                  onClick={() => setConsultationModal(true)}
                >
                  Consulter
                </Button>
              </Space>
            }
            style={{ marginBottom: 24 }}
          >
            {consultations.length > 0 ? (
              <Timeline>
                {consultations.map((consult, index) => (
                  <Timeline.Item
                    key={index}
                    color={consult.reponse ? 'green' : 'blue'}
                  >
                    <Space direction="vertical" size={2} style={{ width: '100%' }}>
                      <Text strong>{consult.service_nom}</Text>
                      <Text><CommentOutlined /> {consult.motif}</Text>
                      <Text type="secondary">
                        <UserOutlined /> {consult.demandeur_nom}
                      </Text>
                      <Text type="secondary">
                        <ClockCircleOutlined /> {dayjs(consult.date_demande).format('DD/MM/YYYY HH:mm')}
                      </Text>
                      {consult.urgence && (
                        <Tag color="red" icon={<WarningOutlined />}>Urgent</Tag>
                      )}
                      {consult.reponse && (
                        <Alert
                          message="Réponse reçue"
                          description={consult.reponse}
                          type="success"
                          showIcon
                          style={{ marginTop: 8 }}
                        />
                      )}
                    </Space>
                  </Timeline.Item>
                ))}
              </Timeline>
            ) : (
              <Alert
                message="Aucune consultation"
                description="Consultez d'autres services pour avis"
                type="info"
                showIcon
              />
            )}
          </Card>

          {/* Prochaine étape */}
          <Card title="Prochaine étape" style={{ marginBottom: 24 }}>
            <Form form={form}>
              <Form.Item name="prochaine_etape">
                <Select size="large">
                  {/* <Option value="instruction"> Instruction du dossier</Option> */}
                  <Option value="redaction"> Rédaction de la réponse</Option>
                  <Option value="consultation"> Consulter d'autres services</Option>
                  <Option value="attente">En attente</Option>
                </Select>
              </Form.Item>
            </Form>
          </Card>

          {/* Informations */}
          <Card title="Informations" style={{ marginBottom: 24 }}>
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="Date réception">
                {courrier?.date_reception ? dayjs(courrier.date_reception).format('DD/MM/YYYY') : 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="Échéance">
                {courrier?.date_echeance ? (
                  <Tag color={dayjs(courrier.date_echeance).isBefore(dayjs()) ? 'red' : 'green'}>
                    {dayjs(courrier.date_echeance).format('DD/MM/YYYY')}
                    {dayjs(courrier.date_echeance).isBefore(dayjs()) && ' (En retard)'}
                  </Tag>
                ) : 'Non définie'}
              </Descriptions.Item>
              <Descriptions.Item label="Priorité">
                <Tag color={
                  courrier?.priorite === 'urgente' ? 'red' :
                  courrier?.priorite === 'haute' ? 'orange' : 'blue'
                }>
                  {courrier?.priorite?.toUpperCase()}
                </Tag>
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {/* Actions */}
          <Card>
            <div style={{ textAlign: 'right' }}>
              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                <Button 
                  block
                  icon={<RollbackOutlined />} 
                  onClick={() => navigate(-1)}
                >
                  Annuler
                </Button>
                <Button
                  block
                  type="primary"
                  icon={<SaveOutlined />}
                  onClick={handleSaveAnalysis}
                  loading={loading}
                  size="large"
                >
                  Enregistrer l'analyse
                </Button>
              </Space>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Modal de consultation */}
      <Modal
        title={<Space><TeamOutlined /> Consulter un service</Space>}
        open={consultationModal}
        onCancel={() => setConsultationModal(false)}
        onOk={handleConsultationSubmit}
        confirmLoading={loading}
        okText="Envoyer la demande"
        cancelText="Annuler"
        width={600}
      >
        <Form form={consultationForm} layout="vertical">
          <Form.Item
            name="service_id"
            label="Service à consulter"
            rules={[{ required: true, message: 'Sélectionnez un service' }]}
          >
            <Select placeholder="Choisir un service">
              {servicesConsultables.map(service => (
                <Option key={service.id} value={service.id}>
                  {service.nom}
                  {service.consultations_anterieures > 0 && 
                    ` (${service.consultations_anterieures} consultation(s))`
                  }
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="motif"
            label="Motif de la consultation"
            rules={[{ required: true, message: 'Précisez le motif' }]}
          >
            <TextArea 
              rows={4} 
              placeholder="Expliquez pourquoi vous consultez ce service..." 
            />
          </Form.Item>

          <Form.Item name="urgence" valuePropName="checked">
            <Checkbox>Urgent (demande de réponse rapide)</Checkbox>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AnalyseCourrier;