// src/pages/traitement/InstructionCourrier.jsx
import React, { useState, useEffect } from 'react';
import {
  Card, Form, Input, Button, Space, List, Tag, Modal,
  message, Alert, Descriptions, Tooltip, Select, Checkbox,
  Row, Col, Badge, Timeline, Divider, Typography, Spin,
  DatePicker, Collapse, Steps
} from 'antd';
import {
  FileTextOutlined, TeamOutlined, CommentOutlined,
  CheckCircleOutlined, ClockCircleOutlined, CalendarOutlined,
  PlusOutlined, DeleteOutlined, EditOutlined, FlagOutlined,
  UserOutlined, SendOutlined, SaveOutlined, WarningOutlined,
  RollbackOutlined, FileAddOutlined, FolderOpenOutlined,
  DownloadOutlined, EyeOutlined
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import axios from 'axios';

const { TextArea } = Input;
const { Option } = Select;
const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;

const InstructionCourrier = ({ courrier, onComplete }) => {
  const [form] = Form.useForm();
  const [instructionForm] = Form.useForm();
  
  const [loading, setLoading] = useState(false);
  const [instructions, setInstructions] = useState([]);
  const [instructionModalVisible, setInstructionModalVisible] = useState(false);
  const [editingInstruction, setEditingInstruction] = useState(null);
  const [servicesConsultables, setServicesConsultables] = useState([]);
  
  const navigate = useNavigate();
  const { id } = useParams();

  useEffect(() => {
    if (courrier) {
      // Charger les instructions existantes
      const instructionsData = (courrier.instructions || []).map((item, index) => ({
        id: item.id || Date.now() + index,
        description: item.description || '',
        responsable: item.responsable || null,
        responsable_nom: item.responsable_nom || '',
        date_echeance: item.date_echeance ? dayjs(item.date_echeance) : null,
        statut: item.statut || 'en_attente',
        priorite: item.priorite || 'normale',
        notes: item.notes || '',
        date_creation: item.date_creation ? dayjs(item.date_creation) : dayjs()
      }));
      setInstructions(instructionsData);
      
      // Charger les services/agents disponibles
      loadServicesConsultables();
    }
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

  // Gestion des instructions
  const handleAddInstruction = (values) => {
    const newInstruction = {
      id: Date.now(),
      description: values.description,
      responsable: values.responsable,
      responsable_nom: servicesConsultables.find(s => s.id === values.responsable)?.nom || '',
      date_echeance: values.date_echeance,
      statut: 'en_attente',
      priorite: values.priorite || 'normale',
      notes: values.notes || '',
      date_creation: dayjs()
    };
    setInstructions([...instructions, newInstruction]);
    setInstructionModalVisible(false);
    instructionForm.resetFields();
    message.success('Instruction ajoutée avec succès');
  };

  const handleEditInstruction = (values) => {
    const updatedInstructions = instructions.map(inst => 
      inst.id === editingInstruction.id 
        ? { 
            ...inst, 
            description: values.description,
            responsable: values.responsable,
            responsable_nom: servicesConsultables.find(s => s.id === values.responsable)?.nom || '',
            date_echeance: values.date_echeance,
            priorite: values.priorite,
            notes: values.notes
          }
        : inst
    );
    setInstructions(updatedInstructions);
    setInstructionModalVisible(false);
    setEditingInstruction(null);
    instructionForm.resetFields();
    message.success('Instruction modifiée avec succès');
  };

  const handleDeleteInstruction = (id) => {
    Modal.confirm({
      title: 'Confirmer la suppression',
      content: 'Voulez-vous vraiment supprimer cette instruction ?',
      okText: 'Oui',
      cancelText: 'Non',
      onOk: () => {
        setInstructions(instructions.filter(inst => inst.id !== id));
        message.success('Instruction supprimée');
      }
    });
  };

  const handleUpdateStatus = (id, newStatus) => {
    setInstructions(instructions.map(inst => 
      inst.id === id ? { ...inst, statut: newStatus } : inst
    ));
    message.success(`Statut mis à jour: ${newStatus}`);
  };

  const openInstructionModal = (instruction = null) => {
    if (instruction) {
      setEditingInstruction(instruction);
      instructionForm.setFieldsValue({
        description: instruction.description,
        responsable: instruction.responsable,
        date_echeance: instruction.date_echeance,
        priorite: instruction.priorite,
        notes: instruction.notes
      });
    } else {
      setEditingInstruction(null);
      instructionForm.resetFields();
    }
    setInstructionModalVisible(true);
  };

  // Sauvegarde des instructions
  const handleSaveInstructions = async () => {
    try {
      setLoading(true);
      
      const payload = {
        instructions: instructions.map(inst => ({
          description: inst.description,
          responsable: inst.responsable,
          date_echeance: inst.date_echeance ? inst.date_echeance.format('YYYY-MM-DD') : null,
          statut: inst.statut,
          priorite: inst.priorite,
          notes: inst.notes
        }))
      };
      
      // Appel API pour sauvegarder
      const response = await axios.post(
        `http://localhost:8000/api/courriers/courriers/${id}/sauvegarder_instructions/`,
        payload
      );
      
      message.success("Instructions sauvegardées avec succès");
      
      if (onComplete) {
        onComplete(response.data.courrier);
      }
      
      // Proposer de passer à l'étape suivante
      Modal.confirm({
        title: "Passer à l'étape suivante ?",
        content: "Les instructions sont sauvegardées. Voulez-vous passer à la rédaction de la réponse ?",
        okText: "Oui, passer à la rédaction",
        cancelText: "Rester sur l'instruction",
        onOk: () => {
          if (window.nextStep) {
            window.nextStep('redaction');
          } else {
            navigate(`/traitement/courriers/${id}?tab=redaction`);
          }
        }
      });
      
    } catch (error) {
      console.error("Erreur sauvegarde instructions:", error);
      message.error("Erreur lors de la sauvegarde");
    } finally {
      setLoading(false);
    }
  };

  // Modal d'ajout/modification d'instruction
  const InstructionModal = () => (
    <Modal
      title={
        <Space>
          <FlagOutlined /> 
          {editingInstruction ? "Modifier l'instruction" : "Nouvelle instruction"}
        </Space>
      }
      open={instructionModalVisible}
      onCancel={() => {
        setInstructionModalVisible(false);
        setEditingInstruction(null);
        instructionForm.resetFields();
      }}
      onOk={() => {
        instructionForm.validateFields()
          .then(values => {
            if (editingInstruction) {
              handleEditInstruction(values);
            } else {
              handleAddInstruction(values);
            }
          })
          .catch(info => console.log('Validation failed:', info));
      }}
      okText={editingInstruction ? "Modifier" : "Ajouter"}
      cancelText="Annuler"
      width={700}
    >
      <Form form={instructionForm} layout="vertical">
        <Form.Item
          name="description"
          label="Description de l'instruction"
          rules={[{ required: true, message: "La description est requise" }]}
        >
          <Input.TextArea 
            rows={4} 
            placeholder="Décrivez précisément ce qui doit être fait..." 
          />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="responsable" label="Responsable">
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
          </Col>
          <Col span={12}>
            <Form.Item name="date_echeance" label="Date d'échéance">
              <DatePicker 
                style={{ width: '100%' }} 
                format="DD/MM/YYYY"
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="priorite" label="Priorité" initialValue="normale">
              <Select>
                <Option value="haute">🔴 Haute</Option>
                <Option value="normale">🟡 Normale</Option>
                <Option value="basse">🟢 Basse</Option>
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

  // Obtenir la couleur du statut
  const getStatusColor = (statut) => {
    switch(statut) {
      case 'termine': return 'success';
      case 'en_cours': return 'processing';
      case 'en_attente': return 'warning';
      default: return 'default';
    }
  };

  // Obtenir le libellé du statut
  const getStatusLabel = (statut) => {
    switch(statut) {
      case 'termine': return 'Terminé';
      case 'en_cours': return 'En cours';
      case 'en_attente': return 'En attente';
      default: return statut;
    }
  };

  return (
    <div>
      <InstructionModal />

      <Row gutter={24}>
        <Col span={16}>
          {/* Liste des instructions */}
          <Card 
            title={
              <Space>
                <FlagOutlined /> Instructions
                <Tag color="blue">{instructions.length}</Tag>
              </Space>
            }
            extra={
              <Button 
                type="primary" 
                icon={<PlusOutlined />} 
                onClick={() => openInstructionModal()}
              >
                Nouvelle instruction
              </Button>
            }
            style={{ marginBottom: 24 }}
          >
            {instructions.length > 0 ? (
              <List
                dataSource={instructions}
                renderItem={(item) => (
                  <List.Item
                    key={item.id}
                    actions={[
                      <Tooltip title="Changer le statut">
                        <Select
                          value={item.statut}
                          onChange={(value) => handleUpdateStatus(item.id, value)}
                          style={{ width: 120 }}
                          size="small"
                        >
                          <Option value="en_attente">⏳ En attente</Option>
                          <Option value="en_cours">⚙️ En cours</Option>
                          <Option value="termine">✅ Terminé</Option>
                        </Select>
                      </Tooltip>,
                      <Tooltip title="Modifier">
                        <Button 
                          type="text" 
                          icon={<EditOutlined />} 
                          onClick={() => openInstructionModal(item)}
                        />
                      </Tooltip>,
                      <Tooltip title="Supprimer">
                        <Button 
                          type="text" 
                          danger 
                          icon={<DeleteOutlined />} 
                          onClick={() => handleDeleteInstruction(item.id)}
                        />
                      </Tooltip>
                    ]}
                  >
                    <List.Item.Meta
                      title={
                        <Space direction="vertical" size={0} style={{ width: '100%' }}>
                          <Space>
                            <Text strong>{item.description}</Text>
                            <Tag color={
                              item.priorite === 'haute' ? 'red' :
                              item.priorite === 'normale' ? 'orange' : 'green'
                            }>
                              {item.priorite}
                            </Tag>
                          </Space>
                          <Space size="middle" style={{ marginTop: 4 }}>
                            {item.responsable && (
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                <UserOutlined /> {item.responsable_nom || `Agent ${item.responsable}`}
                              </Text>
                            )}
                            {item.date_echeance && (
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                <CalendarOutlined /> {item.date_echeance.format('DD/MM/YYYY')}
                              </Text>
                            )}
                            <Tag color={getStatusColor(item.statut)}>
                              {getStatusLabel(item.statut)}
                            </Tag>
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
                message="Aucune instruction"
                description="Cliquez sur 'Nouvelle instruction' pour commencer"
                type="info"
                showIcon
              />
            )}
          </Card>
        </Col>

        <Col span={8}>
          {/* Résumé du courrier */}
          <Card title="📄 Courrier" style={{ marginBottom: 24 }}>
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="Référence">
                <Tag color="blue">{courrier?.reference}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Objet">
                {courrier?.objet}
              </Descriptions.Item>
              <Descriptions.Item label="Expéditeur">
                {courrier?.expediteur_nom}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {/* Notes d'analyse */}
          {courrier?.analyse_notes && (
            <Card title="📝 Notes d'analyse" style={{ marginBottom: 24 }}>
              <Paragraph>{courrier.analyse_notes}</Paragraph>
            </Card>
          )}

          {/* Progression */}
          <Card title="📊 Progression" style={{ marginBottom: 24 }}>
            <Steps
              direction="vertical"
              current={1}
              size="small"
              items={[
                { title: 'Analyse', description: 'Terminé', status: 'finish' },
                { title: 'Instruction', description: 'En cours', status: 'process' },
                { title: 'Rédaction', description: 'À venir' },
                { title: 'Validation', description: 'À venir' }
              ]}
            />
          </Card>

          {/* Actions */}
          <Card>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button
                block
                icon={<RollbackOutlined />}
                onClick={() => {
                  if (window.nextStep) {
                    window.nextStep('analyse');
                  } else {
                    navigate(`/traitement/courriers/${id}?tab=analyse`);
                  }
                }}
              >
                Retour à l'analyse
              </Button>
              <Button
                block
                type="primary"
                icon={<SaveOutlined />}
                onClick={handleSaveInstructions}
                loading={loading}
                size="large"
              >
                Sauvegarder et continuer
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default InstructionCourrier;