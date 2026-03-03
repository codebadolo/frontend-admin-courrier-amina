// src/pages/courriers/CreerCourrierInterne.jsx
import React, { useState, useEffect } from "react";
import {
  Form,
  Input,
  Button,
  Select,
  Steps,
  DatePicker,
  Alert,
  message,
  Card,
  Space,
  Typography,
  Divider,
  Tag,
  Tooltip,
  Avatar,
  Badge,
  Modal,
  Spin,
  Radio,
} from "antd";
import {
  ArrowLeftOutlined,
  SaveOutlined,
  FileTextOutlined,
  TeamOutlined,
  LockOutlined,
  ThunderboltOutlined,
  CalendarOutlined,
  EyeOutlined,
  CopyOutlined,
  CheckCircleOutlined,
  UserOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import dayjs from "dayjs";
import locale from "antd/es/date-picker/locale/fr_FR";
import { Editor } from 'react-draft-wysiwyg';
import { EditorState, convertToRaw } from 'draft-js';
import draftToHtml from 'draftjs-to-html';
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';

const { Text } = Typography;
const { Option } = Select;
const { Step } = Steps;

const API_BASE = "http://localhost:8000/api";

const CreerCourrierInterne = () => {
  const [form] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);
  const [services, setServices] = useState([]);
  const [agents, setAgents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [generatedRef, setGeneratedRef] = useState("");
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewHtml, setPreviewHtml] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [imputationType, setImputationType] = useState("service");
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [editorState, setEditorState] = useState(() => EditorState.createEmpty());

  const navigate = useNavigate();

  // Générer une référence automatique
  const generateReference = () => {
    const year = dayjs().format("YYYY");
    const random = Math.floor(1000 + Math.random() * 9000);
    return `CI/${year}/${random}`;
  };

  // Charger les données au montage
  useEffect(() => {
    const token = localStorage.getItem("auth_token") || localStorage.getItem("token");
    if (!token) {
      message.error("Veuillez vous connecter");
      navigate("/login");
      return;
    }
    loadReferences();
    loadCurrentUser();
    setGeneratedRef(generateReference());
  }, [navigate]);

  const loadCurrentUser = async () => {
    try {
      const token = localStorage.getItem("auth_token") || localStorage.getItem("token");
      if (!token) return;

      const headers = { Authorization: `Token ${token}` };
      const response = await axios.get(`${API_BASE}/users/me/`, { headers });
      setCurrentUser(response.data);
    } catch (error) {
      console.error("Erreur chargement utilisateur:", error);
      if (error.response?.status === 401) {
        message.error("Session expirée, veuillez vous reconnecter");
        navigate("/login");
      }
    }
  };

  const loadReferences = async () => {
    setServicesLoading(true);
    try {
      const token = localStorage.getItem("auth_token") || localStorage.getItem("token");
      if (!token) return;

      const headers = { Authorization: `Token ${token}` };

      const [servicesRes, categoriesRes] = await Promise.all([
        axios.get(`${API_BASE}/core/services/`, { headers }),
        axios.get(`${API_BASE}/core/categories/`, { headers })
      ]);

      setServices(servicesRes.data);
      setCategories(categoriesRes.data);
    } catch (error) {
      message.error("Erreur chargement des références");
    } finally {
      setServicesLoading(false);
    }
  };

  const loadAgents = async (serviceId) => {
    try {
      const token = localStorage.getItem("auth_token") || localStorage.getItem("token");
      const headers = { Authorization: `Token ${token}` };

      const response = await axios.get(`${API_BASE}/users/users/`, {
        headers,
        params: {
          service: serviceId,
          role__in: ['agent_service', 'collaborateur']
        }
      });

      setAgents(response.data);
    } catch (error) {
      console.error("Erreur chargement agents:", error);
    }
  };

  // Navigation
  const next = async () => {
    try {
      let fieldsToValidate = [];
      if (currentStep === 0) {
        fieldsToValidate = ['objet'];
      } else if (currentStep === 1) {
        fieldsToValidate = ['service_id'];
        if (imputationType === 'agent') {
          fieldsToValidate.push('agent_id');
        }
      }

      await form.validateFields(fieldsToValidate);
      setCurrentStep(currentStep + 1);
    } catch (error) {
      // Ne rien faire, Ant Design affiche déjà les erreurs
    }
  };

  const prev = () => {
    setCurrentStep(currentStep - 1);
  };

  // Soumission
  const handleSubmit = async (values) => {
    setSubmitting(true);
    try {
      const token = localStorage.getItem("auth_token") || localStorage.getItem("token");
      if (!token) {
        message.error("Non authentifié");
        navigate("/login");
        return;
      }

      if (!values.service_id) {
        message.error("Veuillez sélectionner un service destinataire");
        setSubmitting(false);
        return;
      }

      const serviceId = typeof values.service_id === 'string'
        ? parseInt(values.service_id)
        : values.service_id;

      const selectedService = services.find(s => s.id === serviceId);
      if (!selectedService) {
        message.error("Service sélectionné introuvable");
        setSubmitting(false);
        return;
      }

      // Construction du payload de base
      const payload = {
        type: "interne",
        objet: values.objet,
        contenu_texte: values.contenu_texte,
        service_impute: serviceId,
        service_actuel: serviceId,
        priorite: values.priorite || "normale",
        confidentialite: values.confidentialite || "normale",
        date_reception: dayjs().format("YYYY-MM-DD"),
        expediteur_nom: currentUser ? `${currentUser.prenom} ${currentUser.nom}` : "Système",
        expediteur_email: currentUser?.email || "",
        destinataire_nom: selectedService
      };

      // Si un agent est sélectionné, l'assigner directement
      if (imputationType === 'agent' && values.agent_id) {
        const agentId = typeof values.agent_id === 'string'
          ? parseInt(values.agent_id)
          : values.agent_id;

        const selectedAgent = agents.find(a => a.id === agentId);
        if (selectedAgent) {
          payload.responsable_actuel = agentId;
          payload.agent_traitant = agentId;
          payload.statut = "traitement";
          payload.traitement_statut = "prise_en_charge";
        }
      }

      if (values.date_echeance) {
        payload.date_echeance = dayjs(values.date_echeance).format("YYYY-MM-DD");
      }

      if (values.formule_politesse) {
        payload.formule_politesse = values.formule_politesse;
      }

      if (values.category) {
        payload.category = values.category;
      }

      console.log("📤 Payload envoyé:", payload);

      await axios.post(`${API_BASE}/courriers/courriers/`, payload, {
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "application/json"
        }
      });

      message.success({
        content: imputationType === 'agent'
          ? "Courrier interne créé et assigné avec succès"
          : "Courrier interne créé avec succès",
        icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
        duration: 3
      });

      form.resetFields();
      setCurrentStep(0);
      setSelectedAgent(null);
      setEditorState(EditorState.createEmpty());
      navigate("/courriers-internes");

    } catch (error) {
      console.error("❌ Erreur:", error.response?.data);
      let errorMsg = "Erreur lors de la création";
      if (error.response?.data) {
        if (typeof error.response.data === 'object') {
          errorMsg = Object.entries(error.response.data)
            .map(([field, msg]) => `${field}: ${msg}`)
            .join('\n');
        } else {
          errorMsg = error.response.data;
        }
      }
      message.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  // Génération du document pour l'aperçu
  const genererDocument = (values) => {
    const date = values.date_echeance
      ? dayjs(values.date_echeance).format("DD MMMM YYYY")
      : dayjs().format("DD MMMM YYYY");
    const lieu = "Ouagadougou";

    const serviceId = values.service_id;
    const serviceIdNum = serviceId
      ? (typeof serviceId === 'string' ? parseInt(serviceId) : serviceId)
      : null;

    const serviceNom = serviceIdNum
      ? services.find((s) => s.id === serviceIdNum)?.nom
      : "Service destinataire";

    let destinataireTexte = `Service ${serviceNom}`;
    if (imputationType === 'agent' && selectedAgent) {
      destinataireTexte = `${selectedAgent.prenom} ${selectedAgent.nom} (${serviceNom})`;
    }

    const entete = `
      <div style="text-align: center; margin-bottom: 30px;">
        <h2 style="margin: 0; color: #003366;">ZEPINTEL</h2>
        <h3 style="margin: 5px 0; color: #003366;">Innovation & Technologies</h3>
        <p style="margin: 10px 0; border-bottom: 2px solid #003366; padding-bottom: 10px;">
          N/Réf: ${generatedRef}
        </p>
      </div>
    `;

    const corps = `
      <div style="margin-bottom: 30px;">
        <p style="text-align: right;"><strong>${lieu}, le ${date}</strong></p>
        
        <p><strong>À :</strong> ${destinataireTexte}</p>
        <p><strong>De :</strong> ${currentUser?.prenom || ""} ${currentUser?.nom || ""}</p>
        
        <br/>
        
        <p><strong>Objet :</strong> ${values.objet || "____________________"}</p>
        
        <br/>
        
        <div style="white-space: pre-wrap; line-height: 1.6;">
          ${values.contenu_texte || "______________________________________________________________________"}
        </div>
        
        <br/>
        <br/>
        
        <p><strong>${values.formule_politesse || "Veuillez agréer, l'expression de nos salutations distinguées."}</strong></p>
        
        <br/>
        <br/>
        
        <div style="text-align: right;">
          <p style="margin: 2px 0;"><strong>${currentUser?.prenom || ""} ${currentUser?.nom || ""}</strong></p>
          <p style="margin: 2px 0; font-size: 11px; color: #666;">${currentUser?.role || "Agent"}</p>
        </div>
      </div>
    `;

    const pied = `
      <div style="margin-top: 30px; text-align: center; font-size: 11px; color: #666; border-top: 1px solid #ccc; padding-top: 10px;">
        <p>1200 Logements, Ouagadougou, Burkina Faso</p>
        <p>Tél: +226 25 46 36 86 | +226 60 60 60 19</p>
        <p>www.zepintel.com | contact@zepintel.com</p>
        <p style="font-size: 9px;">RCCM BF OUA 2016 B 8874 IFU 00085089D</p>
        <p style="margin-top: 5px; font-size: 9px;">Document interne - Diffusion restreinte</p>
      </div>
    `;

    return entete + corps + pied;
  };

  // Prévisualisation
  const handlePreview = async () => {
    try {
      const values = await form.validateFields(['objet', 'service_id', 'contenu_texte']);
      const html = genererDocument(values);
      setPreviewHtml(html);
      setPreviewVisible(true);
    } catch (error) {
      message.warning("Veuillez remplir tous les champs obligatoires (Objet, Service, Contenu)");
    }
  };

  if (servicesLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" tip="Chargement des données..." />
      </div>
    );
  }

  return (
    <div style={{ padding: 24, background: '#f0f2f5', minHeight: '100vh' }}>
      {/* En-tête */}
      <Card style={{ marginBottom: 24, borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space size="middle">
            <Avatar size={48} icon={<FileTextOutlined />} style={{ backgroundColor: '#722ed1' }} />
            <div>
              <h2 style={{ margin: 0 }}>Nouveau courrier interne</h2>
              <Space size={4}>
                <Text type="secondary">Référence:</Text>
                <Tag color="purple" style={{ fontSize: 14, fontWeight: 500 }}>{generatedRef}</Tag>
                <Tooltip title="Copier la référence">
                  <Button
                    type="text"
                    icon={<CopyOutlined />}
                    size="small"
                    onClick={() => {
                      navigator.clipboard.writeText(generatedRef);
                      message.success("Référence copiée");
                    }}
                  />
                </Tooltip>
              </Space>
            </div>
          </Space>
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
              Retour
            </Button>
            <Button icon={<EyeOutlined />} onClick={handlePreview}>
              Aperçu
            </Button>
          </Space>
        </div>

        <Steps current={currentStep} style={{ marginTop: 24 }} onChange={setCurrentStep}>
          <Step title="Informations" icon={<FileTextOutlined />} />
          <Step title="Destinataire & Imputation" icon={<TeamOutlined />} />
          <Step title="Contenu" icon={<SaveOutlined />} />
        </Steps>
      </Card>

      <Card style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          preserve={true}
          initialValues={{
            priorite: "normale",
            confidentialite: "normale"
          }}
          onValuesChange={(changedValues, allValues) => {
            if (changedValues.service_id) {
              // Charger les agents du service sélectionné
              loadAgents(changedValues.service_id);
            }
          }}
        >

          {/* ETAPE 1 - Informations */}
          <div style={{ display: currentStep === 0 ? "block" : "none" }}>
            <Alert
              type="info"
              message="Informations générales"
              description="Renseignez les informations de base du courrier"
              showIcon
              style={{ marginBottom: 20 }}
            />

            <Form.Item
              label="Objet"
              name="objet"
              rules={[{ required: true, message: "Objet requis" }]}
              tooltip="Objet clair et concis du courrier"
            >
              <Input placeholder="Ex: Note de service, Demande d'information..." />
            </Form.Item>

            <Form.Item
              label="Priorité"
              name="priorite"
              tooltip="Niveau d'urgence du courrier"
            >
              <Select>
                <Option value="basse">
                  <Space><Tag color="#8c8c8c">●</Tag> Basse</Space>
                </Option>
                <Option value="normale">
                  <Space><Tag color="#1890ff">●</Tag> Normale</Space>
                </Option>
                <Option value="haute">
                  <Space><Tag color="#fa8c16">●</Tag> Haute</Space>
                </Option>
                <Option value="urgente">
                  <Space><Tag color="#f5222d">●</Tag> Urgente</Space>
                </Option>
              </Select>
            </Form.Item>

            <Form.Item
              label="Confidentialité"
              name="confidentialite"
              tooltip="Niveau de confidentialité du courrier"
            >
              <Select>
                <Option value="normale">Normale</Option>
                <Option value="restreinte">Restreinte</Option>
                <Option value="confidentielle">Confidentielle</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="category"
              label="Catégorie"
            >
              <Select
                placeholder="Sélectionner une catégorie (optionnel)"
                allowClear
              >
                {categories.map((c) => (
                  <Option key={c.id} value={c.id}>
                    {c.nom}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </div>

          {/* ETAPE 2 - Destinataire & Imputation */}
          <div style={{ display: currentStep === 1 ? "block" : "none" }}>
            <Alert
              type="info"
              message="Destinataire et imputation"
              description="Choisissez le service destinataire et éventuellement l'agent spécifique"
              showIcon
              style={{ marginBottom: 20 }}
            />

            <Form.Item
              label="Service destinataire"
              name="service_id"
              rules={[{ required: true, message: "Service requis" }]}
              tooltip="Service qui recevra le courrier"
            >
              <Select 
                placeholder="Sélectionner un service"
                showSearch
                optionFilterProp="children"
                loading={servicesLoading}
                allowClear
              >
                {services.map(service => (
                  <Option key={service.id} value={service.id}>
                    <Space>
                      <Avatar size="small" icon={<TeamOutlined />} />
                      {service.nom}
                    </Space>
                  </Option>
                ))}
              </Select>
            </Form.Item>

            {form.getFieldValue('service_id') && (
              <>
                <Divider style={{ margin: '16px 0' }} />
                
                <Alert
                  type="info"
                  message="Options d'imputation"
                  description="Vous pouvez soit laisser le courrier au service pour que le chef l'assigne, soit l'assigner directement à un agent"
                  showIcon
                  icon={<InfoCircleOutlined />}
                  style={{ marginBottom: 16 }}
                />

                <Radio.Group 
                  onChange={(e) => setImputationType(e.target.value)} 
                  value={imputationType}
                  style={{ marginBottom: 16 }}
                >
                  <Radio value="service">Laisser au service (le chef assignera)</Radio>
                  <Radio value="agent">Assigner directement à un agent</Radio>
                </Radio.Group>

                {imputationType === 'agent' && (
                  <Form.Item
                    label="Agent destinataire"
                    name="agent_id"
                    rules={[{ required: true, message: "Veuillez sélectionner un agent" }]}
                    tooltip="Agent qui recevra directement le courrier"
                  >
                    <Select 
                      placeholder="Sélectionner un agent"
                      showSearch
                      optionFilterProp="children"
                      onChange={(value) => {
                        const agent = agents.find(a => a.id === value);
                        setSelectedAgent(agent);
                      }}
                    >
                      {agents.map(agent => (
                        <Option key={agent.id} value={agent.id}>
                          <Space>
                            <Avatar size="small" icon={<UserOutlined />} />
                            {agent.prenom} {agent.nom}
                            <Tag color="blue">{agent.role === 'agent_service' ? 'Agent' : 'Collaborateur'}</Tag>
                          </Space>
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                )}

                <Divider />

                <Form.Item
                  name="date_limite_traitement"
                  label={
                    <span>
                      <CalendarOutlined style={{ marginRight: 8 }} />
                      Date limite de traitement (optionnelle)
                    </span>
                  }
                >
                  <DatePicker 
                    style={{ width: "100%" }} 
                    format="DD/MM/YYYY"
                    locale={locale}
                    placeholder="Sélectionner une date"
                  />
                </Form.Item>
              </>
            )}

            {!form.getFieldValue('service_id') && (
              <Alert
                type="warning"
                message="Sélectionnez d'abord un service"
                description="Veuillez choisir un service destinataire pour continuer"
                showIcon
              />
            )}
          </div>

          {/* ETAPE 3 - Contenu */}
          <div style={{ display: currentStep === 2 ? "block" : "none" }}>
            <Alert
              type="info"
              message="Contenu du courrier"
              description="Rédigez le contenu de votre courrier interne"
              showIcon
              style={{ marginBottom: 20 }}
            />

            {/* Champ caché pour stocker le HTML généré par l'éditeur */}
            <Form.Item
              name="contenu_texte"
              hidden
              rules={[{ required: true, message: "Le contenu est obligatoire" }]}
            >
              <Input type="hidden" />
            </Form.Item>

            <div style={{ marginBottom: 24 }}>
              <Text strong>
                Contenu du courrier <span style={{ color: '#ff4d4f' }}>*</span>
              </Text>
              <div style={{ border: '1px solid #d9d9d9', borderRadius: 6, height: 300, overflow: 'auto', marginTop: 8 }}>
                <Editor
                  editorState={editorState}
                  onEditorStateChange={(newState) => {
                    setEditorState(newState);
                    // Convertir le contenu en HTML et mettre à jour le champ caché
                    const contentHTML = draftToHtml(convertToRaw(newState.getCurrentContent()));
                    form.setFieldsValue({ contenu_texte: contentHTML });
                  }}
                  placeholder="Rédigez le contenu du courrier..."
                />
              </div>
            </div>

            <Form.Item
              label="Formule de politesse"
              name="formule_politesse"
            >
              <Select placeholder="Choisir une formule (optionnel)" allowClear>
                <Option value="Veuillez agréer, l'expression de nos salutations distinguées.">
                  Formule standard
                </Option>
                <Option value="Je vous prie d'agréer, l'assurance de ma considération distinguée.">
                  Formule formelle
                </Option>
                <Option value="Dans l'attente de votre suite, veuillez recevoir mes salutations respectueuses.">
                  Formule avec attente
                </Option>
              </Select>
            </Form.Item>

            <Form.Item
              label="Date d'échéance"
              name="date_echeance"
              tooltip="Date limite de traitement (optionnelle)"
            >
              <DatePicker 
                style={{ width: "100%" }} 
                format="DD/MM/YYYY"
                locale={locale}
                placeholder="Sélectionner une date"
              />
            </Form.Item>

            {/* Récapitulatif */}
            <Card size="small" title="Récapitulatif" style={{ marginTop: 24, background: '#fafafa' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <Text type="secondary">Objet:</Text>
                  <div><Text strong>{form.getFieldValue('objet') || 'Non renseigné'}</Text></div>
                </div>
                <div>
                  <Text type="secondary">Service destinataire:</Text>
                  <div>
                    {(() => {
                      const serviceId = form.getFieldValue('service_id');
                      if (!serviceId) return <Tag color="orange">Non sélectionné</Tag>;
                      const service = services.find(s => s.id === serviceId);
                      return service ? (
                        <Tag color="green" icon={<TeamOutlined />}>{service.nom}</Tag>
                      ) : (
                        <Tag color="orange">Service inconnu</Tag>
                      );
                    })()}
                  </div>
                </div>
                {imputationType === 'agent' && selectedAgent && (
                  <div>
                    <Text type="secondary">Agent assigné:</Text>
                    <div>
                      <Tag color="blue" icon={<UserOutlined />}>
                        {selectedAgent.prenom} {selectedAgent.nom}
                      </Tag>
                    </div>
                  </div>
                )}
                <div>
                  <Text type="secondary">Priorité:</Text>
                  <div>
                    <Tag color={
                      form.getFieldValue('priorite') === 'urgente' ? '#f5222d' :
                      form.getFieldValue('priorite') === 'haute' ? '#fa8c16' :
                      form.getFieldValue('priorite') === 'normale' ? '#1890ff' : '#8c8c8c'
                    }>
                      {form.getFieldValue('priorite')}
                    </Tag>
                  </div>
                </div>
                <div>
                  <Text type="secondary">Confidentialité:</Text>
                  <div><Text>{form.getFieldValue('confidentialite')}</Text></div>
                </div>
              </div>
            </Card>
          </div>

          {/* BOUTONS DE NAVIGATION */}
          <Form.Item style={{ marginTop: 32, textAlign: 'right' }}>
            {currentStep > 0 && (
              <Button onClick={prev} style={{ marginRight: 10 }}>
                Précédent
              </Button>
            )}

            {currentStep < 2 && (
              <Button type="primary" onClick={next}>
                Suivant
              </Button>
            )}

            {currentStep === 2 && (
              <Button
                type="primary"
                htmlType="submit"
                loading={submitting}
                icon={<SaveOutlined />}
              >
                {imputationType === 'agent' ? 'Créer et assigner' : 'Créer le courrier'}
              </Button>
            )}
          </Form.Item>

        </Form>
      </Card>

      {/* MODAL DE PRÉVISUALISATION */}
      <Modal
        title="Prévisualisation du courrier interne"
        open={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        width={800}
        footer={[
          <Button key="close" onClick={() => setPreviewVisible(false)}>
            Fermer
          </Button>,
          <Button
            key="save"
            type="primary"
            icon={<SaveOutlined />}
            onClick={() => {
              setPreviewVisible(false);
              form.submit();
            }}
          >
            Confirmer la création
          </Button>
        ]}
      >
        <div
          style={{
            padding: 30,
            background: "white",
            border: "1px solid #ddd",
            borderRadius: 4,
            fontFamily: "Times New Roman, serif",
            maxHeight: "60vh",
            overflow: "auto"
          }}
          dangerouslySetInnerHTML={{ __html: previewHtml }}
        />
      </Modal>
    </div>
  );
};

export default CreerCourrierInterne;