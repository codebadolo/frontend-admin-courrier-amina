// src/pages/traitement/RedactionCourrier.jsx
import React, { useState, useEffect } from 'react';
import {
  Card, Form, Input, Button, Space, Select, message,
  Row, Col, Typography, Upload, Tag, Alert, Modal, Divider
} from 'antd';
import {
  FileTextOutlined, SaveOutlined, RollbackOutlined,
  PlusOutlined, UploadOutlined, EyeOutlined,
  PrinterOutlined, SendOutlined, DeleteOutlined
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const RedactionCourrier = ({ courrier, onComplete }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [contenu, setContenu] = useState('');
  const [modeles, setModeles] = useState([]);
  const [fileList, setFileList] = useState([]);
  const [previewVisible, setPreviewVisible] = useState(false);
  
  const navigate = useNavigate();
  const { id } = useParams();

  useEffect(() => {
    loadModeles();
  }, []);

  const loadModeles = async () => {
    try {
      // URL corrigée - sans double /api/
      const response = await axios.get('http://localhost:8000/api/courriers/modeles/');
      setModeles(response.data);
    } catch (error) {
      console.error("Erreur chargement modèles:", error);
      // Pas de message d'erreur, on continue sans modèles
    }
  };

  const handleModeleChange = (modeleId) => {
    const selected = modeles.find(m => m.id === modeleId);
    if (selected) {
      setContenu(selected.contenu);
      form.setFieldsValue({
        objet: selected.objet || courrier?.objet,
      });
    }
  };

  const handlePreview = () => {
    setPreviewVisible(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const payload = {
        objet: values.objet,
        contenu: contenu,
        type_reponse: values.type_reponse || 'lettre',
        destinataires: values.destinataires?.split('\n').filter(l => l.trim()) || [],
        copies: values.copies?.split('\n').filter(l => l.trim()) || [],
        canal_envoi: values.canal_envoi || 'email',
      };

      // Appel API pour sauvegarder
      const response = await axios.post(
        `http://localhost:8000/api/courriers/courriers/${id}/rediger_reponse/`,
        payload
      );

      message.success("Réponse rédigée avec succès");
      
      if (onComplete) {
        onComplete(response.data.courrier);
      }

      // Prochaine étape : Validation
      Modal.confirm({
        title: "Passer à l'étape suivante ?",
        content: "Voulez-vous soumettre cette réponse pour validation ?",
        okText: "Oui, soumettre à validation",
        cancelText: "Rester en rédaction",
        onOk: () => {
          if (window.nextStep) {
            window.nextStep('validation');
          }
        }
      });

    } catch (error) {
      console.error("Erreur rédaction:", error);
      message.error("Erreur lors de la sauvegarde");
    } finally {
      setLoading(false);
    }
  };

  const handleUploadChange = ({ fileList }) => {
    setFileList(fileList);
  };

  return (
    <div style={{ padding: '20px 0' }}>
      <Row gutter={24}>
        <Col span={16}>
          <Form form={form} layout="vertical">
            {/* Sélection du modèle */}
            <Card title="📄 Modèle de courrier" style={{ marginBottom: 24 }}>
              <Row gutter={16}>
                <Col span={18}>
                  <Form.Item name="modele">
                    <Select
                      placeholder="Choisir un modèle (optionnel)"
                      allowClear
                      onChange={handleModeleChange}
                    >
                      {modeles.map(m => (
                        <Option key={m.id} value={m.id}>
                          {m.nom}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Button icon={<EyeOutlined />} onClick={handlePreview}>
                    Prévisualiser
                  </Button>
                </Col>
              </Row>
            </Card>

            {/* Objet */}
            <Card title="📝 Objet de la réponse" style={{ marginBottom: 24 }}>
              <Form.Item
                name="objet"
                rules={[{ required: true, message: "L'objet est requis" }]}
              >
                <Input 
                  placeholder="Objet de la réponse..." 
                  defaultValue={courrier?.objet}
                />
              </Form.Item>
            </Card>

            {/* Contenu - TextArea simple */}
            <Card title="✍️ Rédaction" style={{ marginBottom: 24 }}>
              <Form.Item name="contenu">
                <TextArea
                  rows={15}
                  value={contenu}
                  onChange={(e) => setContenu(e.target.value)}
                  placeholder="Rédigez votre réponse ici..."
                  style={{ fontFamily: 'monospace', fontSize: '14px' }}
                />
              </Form.Item>
            </Card>

            {/* Pièces jointes */}
            <Card title="📎 Pièces jointes" style={{ marginBottom: 24 }}>
              <Upload
                action="http://localhost:8000/api/courriers/pieces-jointes/"
                fileList={fileList}
                onChange={handleUploadChange}
                multiple
              >
                <Button icon={<UploadOutlined />}>Ajouter des pièces jointes</Button>
              </Upload>
            </Card>
          </Form>
        </Col>

        <Col span={8}>
          {/* Paramètres d'envoi */}
          <Card title="⚙️ Paramètres d'envoi" style={{ marginBottom: 24 }}>
            <Form form={form} layout="vertical">
              <Form.Item
                name="type_reponse"
                label="Type de réponse"
                initialValue="lettre"
              >
                <Select>
                  <Option value="lettre">📨 Lettre officielle</Option>
                  <Option value="email">📧 Email</Option>
                  <Option value="note_interne">📋 Note interne</Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="canal_envoi"
                label="Canal d'envoi"
                initialValue="email"
              >
                <Select>
                  <Option value="email">📧 Email</Option>
                  <Option value="courrier">📬 Courrier postal</Option>
                  <Option value="interne">🏢 Interne</Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="destinataires"
                label="Destinataires"
                help="Un par ligne"
              >
                <TextArea 
                  rows={3} 
                  placeholder="email@exemple.com&#10;autre@exemple.com"
                />
              </Form.Item>

              <Form.Item
                name="copies"
                label="Copies (CC)"
                help="Un par ligne"
              >
                <TextArea 
                  rows={2} 
                  placeholder="email@exemple.com"
                />
              </Form.Item>
            </Form>
          </Card>

          {/* Aperçu du courrier original */}
          <Card title="📄 Courrier original" style={{ marginBottom: 24 }}>
            <p><strong>Référence:</strong> {courrier?.reference}</p>
            <p><strong>Objet:</strong> {courrier?.objet}</p>
            <p><strong>Expéditeur:</strong> {courrier?.expediteur_nom}</p>
            {courrier?.analyse_notes && (
              <>
                <Divider />
                <p><strong>Notes d'analyse:</strong></p>
                <Text type="secondary">{courrier.analyse_notes}</Text>
              </>
            )}
          </Card>

          {/* Actions */}
          <Card>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button
                block
                icon={<RollbackOutlined />}
                onClick={() => window.nextStep && window.nextStep('instruction')}
              >
                Retour à l'instruction
              </Button>
              <Button
                block
                type="primary"
                icon={<SaveOutlined />}
                onClick={handleSave}
                loading={loading}
                size="large"
              >
                Enregistrer la réponse
              </Button>
              <Button
                block
                icon={<EyeOutlined />}
                onClick={handlePreview}
              >
                Prévisualiser
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Modal de prévisualisation */}
      <Modal
        title="Prévisualisation de la réponse"
        open={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        footer={[
          <Button key="close" onClick={() => setPreviewVisible(false)}>
            Fermer
          </Button>
        ]}
        width={800}
      >
        <div style={{ padding: 20, whiteSpace: 'pre-wrap' }}>
          {contenu}
        </div>
      </Modal>
    </div>
  );
};

export default RedactionCourrier;