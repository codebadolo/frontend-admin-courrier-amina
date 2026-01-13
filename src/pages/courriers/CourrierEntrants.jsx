import React, { useEffect, useState } from "react";
import dayjs from "dayjs";
import {
  Table, Button, Space, Modal, Form, Input, DatePicker, Select,
  Upload, message, Spin, Tag, Card, Checkbox, Alert, Row, Col,
  Tooltip, Divider, Steps, Progress, Typography, notification
} from "antd";

import {
  PlusOutlined,
  ReloadOutlined,
  UploadOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  RobotOutlined,
  SafetyOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  InfoCircleOutlined,
  FilePdfOutlined,
  LoadingOutlined,
  CheckOutlined
} from "@ant-design/icons";

import {
  fetchCourriers,
  createCourrier,
  updateCourrier,
  deleteCourrier,
  checkAuth
} from "../../services/courrierService";
import { getServices } from "../../api/service";
import { getCategories } from "../../api/categories";

const { Option } = Select;
const { TextArea } = Input;
const { Step } = Steps;
const { Paragraph } = Typography;

const CourrierEntrants = () => {
  // États principaux
  const [courriers, setCourriers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  
  // États pour le workflow IA
  const [aiWorkflowVisible, setAiWorkflowVisible] = useState(false);
  const [aiWorkflowStep, setAiWorkflowStep] = useState(0); // 0: Upload, 1: Analyse, 2: Validation
  const [form] = Form.useForm();
  
  // États pour l'IA
  const [aiProcessing, setAiProcessing] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [aiConfidence, setAiConfidence] = useState(0);
  const [fileList, setFileList] = useState([]);
  const [uploadedFile, setUploadedFile] = useState(null);
  
  // États pour le formulaire traditionnel
  const [formModalVisible, setFormModalVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  // États pour les filtres
  const [filters, setFilters] = useState({
    search: "",
    service: null,
    category: null,
    confidentialite: null,
  });

  // ============================
  // FONCTIONS DE BASE
  // ============================

  useEffect(() => {
    if (!checkAuth()) {
      message.error("Veuillez vous connecter");
    }
    loadCourriers();
    loadServicesAndCategories();
  }, [filters]);

  const loadServicesAndCategories = async () => {
    try {
      const [servicesData, categoriesData] = await Promise.all([
        getServices(),
        getCategories()
      ]);
      setServices(servicesData);
      setCategories(categoriesData);
    } catch (error) {
      message.error("Erreur lors du chargement des données");
    }
  };

  const loadCourriers = async () => {
    setLoading(true);
    try {
      const data = await fetchCourriers({
        type: "entrant",
        ...filters
      });
      setCourriers(data.results || data);
    } catch (error) {
      message.error("Erreur lors du chargement des courriers");
    } finally {
      setLoading(false);
    }
  };

  // ============================
  // FONCTIONS DE L'IA - FLUX COMPLET
  // ============================

  const startAiWorkflow = () => {
    setAiWorkflowStep(0);
    setAiWorkflowVisible(true);
    setAiResult(null);
    setFileList([]);
    setUploadedFile(null);
    setAiConfidence(0);
    form.resetFields();
  };

  const handleFileUpload = (info) => {
    setFileList(info.fileList);
    if (info.fileList.length > 0) {
      const file = info.fileList[0].originFileObj;
      setUploadedFile(file);
    }
  };

  const analyzeWithAI = async () => {
    if (!uploadedFile) {
      message.error("Veuillez d'abord sélectionner un fichier");
      return;
    }

    setAiProcessing(true);
    try {
      // Préparer FormData pour l'analyse
      const formData = new FormData();
      formData.append("pieces_jointes", uploadedFile);
      formData.append("ocr", "true");
      
      // Ajouter des champs textuels facultatifs si disponibles
      const values = form.getFieldsValue();
      if (values.objet) formData.append("objet", values.objet);
      if (values.expediteur_nom) formData.append("expediteur_nom", values.expediteur_nom);
      if (values.expediteur_email) formData.append("expediteur_email", values.expediteur_email);
      if (values.date_reception) {
        formData.append("date_reception", values.date_reception.format("YYYY-MM-DD"));
      }

      // Appeler l'endpoint d'analyse IA
      const response = await fetch("http://localhost:8000/api/courriers/courriers/analyze_ai/", {
        method: "POST",
        headers: {
          "Authorization": `Token ${localStorage.getItem("auth_token") || localStorage.getItem("token")}`,
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Erreur ${response.status}`);
      }

      const result = await response.json();
      console.log("Résultat IA:", result);
      
      // Traiter le résultat
      processAiResult(result);
      
      setAiWorkflowStep(2);
      message.success("Analyse IA terminée avec succès");
      
    } catch (error) {
      console.error("Erreur analyse IA:", error);
      message.error(`Échec de l'analyse IA: ${error.message}`);
      
      // Fallback avec données simulées
      simulateAiAnalysis();
      
    } finally {
      setAiProcessing(false);
    }
  };

 // Modifiez la fonction processAiResult pour mieux gérer les résultats
const processAiResult = (result) => {
  console.log("Résultat IA brut:", result);
  
  const classification = result.classification || {};
  const priorite = result.priorite || {};
  const analyse = result.analyse || {};
  
  // Calculer la confiance moyenne
  const confidenceCategorie = classification.confiance_categorie || 0.3;
  const confidenceService = classification.confiance_service || 0.3;
  const confidencePriorite = priorite.confiance || 0.5;
  const avgConfidence = (confidenceCategorie + confidenceService + confidencePriorite) / 3;
  
  // Extraire la date du texte si possible
  let detectedDate = null;
  if (result.analyse?.resume) {
    // Essayons de trouver une date dans le texte
    const dateMatch = result.analyse.resume.match(/\d{2}\/\d{2}\/\d{4}|\d{4}-\d{2}-\d{2}/);
    if (dateMatch) {
      try {
        detectedDate = dayjs(dateMatch[0]);
      } catch (e) {
        console.log("Erreur parsing date:", e);
      }
    }
  }
  
  const suggestions = {
    objet: result.objet || classification.objet || "Document analysé",
    expediteur_nom: result.expediteur?.nom || classification.expediteur_nom || "Expéditeur",
    expediteur_email: result.expediteur?.email || classification.expediteur_email || "",
    expediteur_adresse: result.expediteur?.adresse || classification.expediteur_adresse || "",
    expediteur_telephone: result.expediteur?.telephone || classification.expediteur_telephone || "",
    date_reception: detectedDate || dayjs(),
    canal: classification.canal || "physique",
    confidentialite: result.confidentialite_suggestion || classification.confidentialite || "normale",
    priorite: (priorite.niveau || "normale").toLowerCase(),
    category: classification.categorie_id || null,
    service_id: classification.service_id || null,
    contenu_texte: analyse.resume || result.texte_ocr || "",
    mots_cles: analyse.mots_cles || [],
    priorite_raison: priorite.raison || "Analyse automatique"
  };
  
  setAiResult(suggestions);
  setAiConfidence(avgConfidence);
  
  // Mettre à jour le formulaire
  form.setFieldsValue(suggestions);
  
  // Afficher un message avec les mots-clés détectés
  if (analyse.mots_cles && analyse.mots_cles.length > 0) {
    message.info(`Mots-clés détectés: ${analyse.mots_cles.slice(0, 5).join(', ')}`);
  }
};

  const simulateAiAnalysis = () => {
    // Données simulées pour le développement
    const simulatedData = {
      objet: "Demande de documents administratifs",
      expediteur_nom: "Jean Dupont",
      expediteur_email: "jean.dupont@example.com",
      expediteur_adresse: "123 Avenue de la République",
      expediteur_telephone: "+226 70 12 34 56",
      date_reception: dayjs(),
      canal: "email",
      confidentialite: "normale",
      priorite: "normale",
      category: categories[0]?.id,
      service_id: services[0]?.id,
      contenu_texte: "Le requérant demande des documents administratifs pour une procédure de visa."
    };
    
    setAiResult(simulatedData);
    setAiConfidence(0.75);
    form.setFieldsValue(simulatedData);
    setAiWorkflowStep(2);
  };

  const acceptAiSuggestions = () => {
    if (aiResult) {
      message.success("Suggestions IA acceptées");
      // Le formulaire est déjà rempli, on peut passer directement à l'enregistrement
    }
  };

  const modifyAiSuggestion = (field, value) => {
    if (aiResult) {
      const updated = { ...aiResult, [field]: value };
      setAiResult(updated);
      form.setFieldsValue({ [field]: value });
    }
  };

  const saveCourrierWithAI = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      
      // Créer FormData pour la création
      const formData = new FormData();
      
      // Ajouter tous les champs
      const payload = {
        objet: values.objet,
        expediteur_nom: values.expediteur_nom,
        expediteur_email: values.expediteur_email || "",
        expediteur_adresse: values.expediteur_adresse || "",
        expediteur_telephone: values.expediteur_telephone || "",
        date_reception: values.date_reception.format("YYYY-MM-DD"),
        canal: values.canal,
        confidentialite: values.confidentialite,
        priorite: values.priorite,
        category: values.category,
        service_impute: values.service_id,
        type: "entrant",
        ocr: true,
        classifier: true,
        creer_workflow: true,
        ia_suggestions_accepted: true,
        ia_suggestions_data: aiResult ? JSON.stringify(aiResult) : null
      };

      Object.keys(payload).forEach(key => {
        formData.append(key, payload[key]);
      });

      // Ajouter le fichier original
      if (uploadedFile) {
        formData.append("pieces_jointes", uploadedFile);
      }

      // Appeler l'API de création
      const response = await fetch("http://localhost:8000/api/courriers/courriers/", {
        method: "POST",
        headers: {
          "Authorization": `Token ${localStorage.getItem("auth_token") || localStorage.getItem("token")}`,
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(JSON.stringify(errorData));
      }

      message.success("Courrier créé avec succès grâce à l'IA !");
      setAiWorkflowVisible(false);
      loadCourriers();
      
    } catch (error) {
      console.error("Erreur création:", error);
      message.error("Erreur lors de la création du courrier");
    } finally {
      setLoading(false);
    }
  };

  // ============================
  // FONCTIONS DE GESTION TRADITIONNELLE
  // ============================

  const handleCreate = async (values) => {
    setLoading(true);
    try {
      const formData = new FormData();
      
      // Préparer le payload
      const payload = {
        objet: values.objet,
        expediteur_nom: values.expediteur_nom,
        expediteur_email: values.expediteur_email || "",
        expediteur_adresse: values.expediteur_adresse || "",
        expediteur_telephone: values.expediteur_telephone || "",
        date_reception: values.date_reception.format("YYYY-MM-DD"),
        canal: values.canal,
        confidentialite: values.confidentialite,
        priorite: values.priorite,
        category: values.category,
        service_impute: values.service_id,
        type: "entrant",
        ocr: false,
        classifier: false,
        creer_workflow: true
      };

      Object.keys(payload).forEach(key => {
        formData.append(key, payload[key]);
      });

      await createCourrier(formData);
      message.success("Courrier créé avec succès");
      setFormModalVisible(false);
      loadCourriers();
      
    } catch (error) {
      console.error("Erreur création:", error);
      message.error("Erreur lors de la création");
    } finally {
      setLoading(false);
    }
  };

  const handleView = (courrier) => {
    Modal.info({
      title: "Détails du courrier",
      width: 700,
      content: (
        <div style={{ marginTop: 20 }}>
          <Row gutter={16}>
            <Col span={12}>
              <p><b>Référence :</b> {courrier.reference}</p>
              <p><b>Objet :</b> {courrier.objet}</p>
              <p><b>Expéditeur :</b> {courrier.expediteur_nom}</p>
              <p><b>Email :</b> {courrier.expediteur_email || "Non renseigné"}</p>
            </Col>
            <Col span={12}>
              <p><b>Service imputé :</b> {courrier.service_impute?.nom || "Non imputé"}</p>
              <p><b>Date réception :</b> {courrier.date_reception}</p>
              <p><b>Canal :</b> {courrier.canal}</p>
              <p><b>Confidentialité :</b> {courrier.confidentialite}</p>
              <p><b>Priorité :</b> {courrier.priorite}</p>
            </Col>
          </Row>
        </div>
      ),
    });
  };

  const handleEdit = (courrier) => {
    setEditingId(courrier.id);
    setFormModalVisible(true);
    
    form.setFieldsValue({
      objet: courrier.objet,
      expediteur_nom: courrier.expediteur_nom,
      expediteur_email: courrier.expediteur_email,
      expediteur_adresse: courrier.expediteur_adresse || '',
      expediteur_telephone: courrier.expediteur_telephone,
      date_reception: courrier.date_reception ? dayjs(courrier.date_reception) : null,
      canal: courrier.canal,
      confidentialite: courrier.confidentialite,
      priorite: courrier.priorite,
      category: courrier.category?.id || courrier.category,
      service_id: courrier.service_impute?.id || courrier.service_impute,
    });
  };

  const handleDelete = async (id) => {
    Modal.confirm({
      title: "Confirmer la suppression",
      content: "Voulez-vous vraiment supprimer ce courrier ? Cette action est irréversible.",
      okText: "Oui",
      cancelText: "Non",
      okType: "danger",
      onOk: async () => {
        try {
          await deleteCourrier(id);
          message.success("Courrier supprimé");
          loadCourriers();
        } catch (error) {
          message.error("Erreur lors de la suppression");
        }
      },
    });
  };

  // ============================
  // COMPOSANTS D'AFFICHAGE
  // ============================

  const renderUploadStep = () => (
    <div style={{ textAlign: "center", padding: "40px 20px" }}>
      <UploadOutlined style={{ fontSize: 48, color: "#1890ff", marginBottom: 20 }} />
      <h3>Téléchargez votre document</h3>
      <p style={{ color: "#666", marginBottom: 30 }}>
        L'IA analysera automatiquement le contenu et remplira tous les champs pour vous
      </p>
      
      <Upload
        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
        fileList={fileList}
        beforeUpload={() => false}
        onChange={handleFileUpload}
        maxCount={1}
        showUploadList={true}
      >
        <Button type="primary" size="large" icon={<UploadOutlined />}>
          Sélectionner un fichier
        </Button>
      </Upload>
      
      <div style={{ marginTop: 20, fontSize: 12, color: "#999" }}>
        Formats supportés : PDF, JPG, PNG, DOC, DOCX
      </div>

      <div style={{ marginTop: 30 }}>
        <Alert
          message="Vous pouvez aussi saisir des informations complémentaires"
          description="Si vous connaissez certaines informations (objet, expéditeur, date), vous pouvez les saisir maintenant pour aider l'IA."
          type="info"
          showIcon
        />
      </div>
    </div>
  );

  const renderAnalysisStep = () => (
    <div style={{ textAlign: "center", padding: "40px 20px" }}>
      <RobotOutlined style={{ fontSize: 48, color: "#1890ff", marginBottom: 20 }} />
      <h3>Prêt à analyser</h3>
      <p style={{ color: "#666", marginBottom: 30 }}>
        Cliquez sur le bouton ci-dessous pour lancer l'analyse IA du document
      </p>
      
      <Button 
        type="primary" 
        size="large" 
        icon={<RobotOutlined />}
        onClick={analyzeWithAI}
        loading={aiProcessing}
        disabled={!uploadedFile}
        style={{ marginBottom: 20 }}
      >
        {aiProcessing ? "Analyse en cours..." : "Lancer l'analyse IA"}
      </Button>
      
      {aiProcessing && (
        <div style={{ marginTop: 20 }}>
          <Progress percent={aiConfidence * 100} status="active" />
          <p style={{ marginTop: 10, color: "#666" }}>
            Extraction OCR et analyse IA en cours...
          </p>
        </div>
      )}
      
      {uploadedFile && (
        <div style={{ marginTop: 20 }}>
          <Alert
            message={`Fichier sélectionné : ${uploadedFile.name}`}
            description={`Taille : ${(uploadedFile.size / 1024 / 1024).toFixed(2)} MB`}
            type="info"
            showIcon
          />
        </div>
      )}
    </div>
  );

  const renderValidationStep = () => (
    <div style={{ padding: "20px 0" }}>
      <div style={{ 
        backgroundColor: "#f0f9ff", 
        padding: 20, 
        borderRadius: 8,
        marginBottom: 20,
        border: "1px solid #91d5ff"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h4 style={{ margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
              <CheckCircleOutlined style={{ color: "#52c41a" }} />
              Analyse IA terminée
            </h4>
            <p style={{ margin: "8px 0 0 0", color: "#666" }}>
              Confiance de l'analyse : <strong>{Math.round(aiConfidence * 100)}%</strong>
            </p>
          </div>
          <Tag color={aiConfidence > 0.7 ? "success" : aiConfidence > 0.5 ? "warning" : "error"}>
            {aiConfidence > 0.7 ? "Élevée" : aiConfidence > 0.5 ? "Moyenne" : "Faible"}
          </Tag>
        </div>
        <Progress 
          percent={Math.round(aiConfidence * 100)} 
          status={aiConfidence > 0.7 ? "success" : "normal"}
          style={{ marginTop: 10 }}
        />
      </div>

      <Form form={form} layout="vertical">
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item 
              name="objet" 
              label="Objet du courrier"
              rules={[{ required: true, message: "L'objet est obligatoire" }]}
            >
              <Input 
                placeholder="Objet détecté par l'IA" 
                suffix={<Tag color="blue">IA</Tag>}
              />
            </Form.Item>
            <Form.Item 
              name="expediteur_nom" 
              label="Expéditeur"
              rules={[{ required: true, message: "L'expéditeur est obligatoire" }]}
            >
              <Input 
                placeholder="Expéditeur détecté par l'IA"
                suffix={<Tag color="blue">IA</Tag>}
              />
            </Form.Item>
            
            <Row gutter={8}>
              <Col span={12}>
                <Form.Item name="expediteur_email" label="Email">
                  <Input placeholder="Email détecté par l'IA" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="expediteur_telephone" label="Téléphone">
                  <Input placeholder="Téléphone détecté par l'IA" />
                </Form.Item>
              </Col>
            </Row>
            
            <Form.Item name="expediteur_adresse" label="Adresse">
              <TextArea rows={2} placeholder="Adresse détectée par l'IA" />
            </Form.Item>
          </Col>
          
          <Col span={12}>
            <Form.Item 
              name="date_reception" 
              label="Date de réception"
              rules={[{ required: true, message: "La date est obligatoire" }]}
            >
              <DatePicker 
                style={{ width: "100%" }} 
                format="DD/MM/YYYY"
                placeholder="Date détectée par l'IA"
              />
            </Form.Item>
            
            <Row gutter={8}>
              <Col span={12}>
                <Form.Item name="canal" label="Canal">
                  <Select placeholder="Canal détecté par l'IA">
                    <Option value="physique">📦 Physique</Option>
                    <Option value="email">📧 Email</Option>
                    <Option value="portail">🌐 Portail</Option>
                    <Option value="téléphone">📞 Téléphone</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="confidentialite" label="Confidentialité">
                  <Select placeholder="Confidentialité suggérée">
                    <Option value="normale">🟢 Normale</Option>
                    <Option value="restreinte">🟡 Restreinte</Option>
                    <Option value="confidentielle">🔴 Confidentielle</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
            
            <Row gutter={8}>
              <Col span={12}>
                <Form.Item name="priorite" label="Priorité">
                  <Select placeholder="Priorité suggérée">
                    <Option value="basse">⬇️ Basse</Option>
                    <Option value="normale">↔️ Normale</Option>
                    <Option value="haute">⬆️ Haute</Option>
                    <Option value="urgente">🚨 Urgente</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="category" label="Catégorie" rules={[{ required: true }]}>
                  <Select 
                    placeholder="Catégorie suggérée"
                    loading={categories.length === 0}
                  >
                    {categories.map(c => (
                      <Option key={c.id} value={c.id}>
                        {c.nom}
                        {aiResult?.category === c.id && <Tag color="green" style={{ marginLeft: 8 }}>IA</Tag>}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>
            
            <Form.Item name="service_id" label="Service imputé" rules={[{ required: true }]}>
              <Select 
                placeholder="Service suggéré"
                loading={services.length === 0}
              >
                {services.map(s => (
                  <Option key={s.id} value={s.id}>
                    {s.nom}
                    {aiResult?.service_id === s.id && <Tag color="green" style={{ marginLeft: 8 }}>IA</Tag>}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>
        
        {aiResult?.contenu_texte && (
          <Form.Item name="contenu_texte" label="Résumé généré par l'IA">
            <TextArea 
              rows={4} 
              value={aiResult.contenu_texte}
              readOnly
              style={{ backgroundColor: "#fafafa" }}
            />
          </Form.Item>
        )}
      </Form>
    </div>
  );

  // ============================
  // COLONNES DE LA TABLE
  // ============================

  const columns = [
    { 
      title: "Référence", 
      dataIndex: "reference", 
      render: (v) => v ? <Tag color="blue">{v}</Tag> : <Tag color="gray">N/A</Tag>
    },
    { 
      title: "Objet", 
      dataIndex: "objet", 
      ellipsis: true,
      render: (text) => <span style={{ fontWeight: 500 }}>{text || "Non spécifié"}</span>
    },
    { 
      title: "Expéditeur", 
      dataIndex: "expediteur_nom",
      render: (text, record) => (
        <div>
          <div>{text || "Non spécifié"}</div>
          {record.expediteur_email && (
            <div style={{ fontSize: '12px', color: '#666' }}>{record.expediteur_email}</div>
          )}
        </div>
      )
    },
    {
      title: "Service",
      render: (_, record) => {
        const service = services.find(s => s.id === record.service_impute);
        return service ? (
          <Tag color="green">{service.nom}</Tag>
        ) : (
          <Tag color="orange">Non imputé</Tag>
        );
      },
    },
    {
      title: "Priorité",
      dataIndex: "priorite",
      render: (v) => {
        const colors = {
          urgente: 'red',
          haute: 'orange',
          normale: 'blue',
          basse: 'gray'
        };
        const icons = {
          urgente: '🔥',
          haute: '⚠️',
          normale: '📄',
          basse: '📋'
        };
        return <Tag color={colors[v] || 'blue'}>{icons[v] || '📄'} {v || "normale"}</Tag>;
      },
    },
    { 
      title: "Date réception", 
      dataIndex: "date_reception",
      render: (v) => <span><ClockCircleOutlined /> {v || "Non spécifiée"}</span>
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space size="middle">
          <Tooltip title="Voir les détails">
            <EyeOutlined
              style={{ color: "#0d6d0d", cursor: "pointer", fontSize: "16px" }}
              onClick={() => handleView(record)}
            />
          </Tooltip>
          <Tooltip title="Modifier">
            <EditOutlined
              style={{ color: "#3f1fb4", cursor: "pointer", fontSize: "16px" }}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Tooltip title="Supprimer">
            <DeleteOutlined
              style={{ color: "#e7132f", cursor: "pointer", fontSize: "16px" }}
              onClick={() => handleDelete(record.id)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  // ============================
  // RENDU PRINCIPAL
  // ============================

  return (
    <Card
      title={
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <FileTextOutlined />
          <span>Courriers entrants</span>
          <Tag color="blue" style={{ marginLeft: "10px" }}>Total: {courriers.length}</Tag>
        </div>
      }
      extra={
        <Space>
          <Button 
            icon={<ReloadOutlined />} 
            onClick={loadCourriers}
            disabled={loading}
          >
            Actualiser
          </Button>
          <Button
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingId(null);
              setFormModalVisible(true);
              form.resetFields();
            }}
          >
            Créer manuellement
          </Button>
          <Button
            type="primary"
            icon={<RobotOutlined />}
            onClick={startAiWorkflow}
          >
            Nouveau avec IA
          </Button>
        </Space>
      }
    >
      {/* FILTRES */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Space wrap>
          <Input.Search
            placeholder="Rechercher par objet, référence, expéditeur..."
            allowClear
            onSearch={(v) => setFilters({ ...filters, search: v })}
            style={{ width: 250 }}
            enterButton
          />
          <Select
            placeholder="Filtrer par service"
            allowClear
            style={{ width: 200 }}
            onChange={(v) => setFilters({ ...filters, service: v })}
            loading={services.length === 0}
          >
            {services.map((s) => (
              <Option key={s.id} value={s.id}>{s.nom}</Option>
            ))}
          </Select>
          <Select
            placeholder="Filtrer par catégorie"
            allowClear
            style={{ width: 200 }}
            onChange={(v) => setFilters({ ...filters, category: v })}
            loading={categories.length === 0}
          >
            {categories.map((c) => (
              <Option key={c.id} value={c.id}>{c.nom}</Option>
            ))}
          </Select>
          <Select
            placeholder="Confidentialité"
            allowClear
            style={{ width: 180 }}
            onChange={(v) => setFilters({ ...filters, confidentialite: v })}
          >
            <Option value="normale">Normale</Option>
            <Option value="restreinte">Restreinte</Option>
            <Option value="confidentielle">Confidentielle</Option>
          </Select>
        </Space>
      </Card>

      {/* TABLEAU DES COURRIERS */}
      <Spin spinning={loading} tip="Chargement...">
        <Table
          rowKey="id"
          columns={columns}
          dataSource={courriers}
          pagination={{ 
            pageSize: 10, 
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} courriers`,
            showQuickJumper: true
          }}
          scroll={{ x: 1200 }}
          locale={{ emptyText: "Aucun courrier trouvé" }}
        />
      </Spin>

      {/* MODAL FORMULAIRE TRADITIONNEL */}
      <Modal
        title={editingId ? "✏️ Modifier le courrier" : "📝 Créer un courrier manuellement"}
        open={formModalVisible}
        onCancel={() => setFormModalVisible(false)}
        footer={null}
        width={800}
      >
        <Form
          layout="vertical"
          form={form}
          onFinish={handleCreate}
          initialValues={{
            canal: "physique",
            confidentialite: "normale",
            priorite: "normale"
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="objet"
                label="Objet du courrier"
                rules={[{ required: true, message: "L'objet est obligatoire" }]}
              >
                <TextArea rows={3} placeholder="Saisir l'objet du courrier..." />
              </Form.Item>

              <Form.Item
                name="expediteur_nom"
                label="Nom de l'expéditeur"
                rules={[{ required: true, message: "Le nom de l'expéditeur est obligatoire" }]}
              >
                <Input placeholder="Nom complet" />
              </Form.Item>

              <Form.Item
                name="date_reception"
                label="Date de réception"
                rules={[{ required: true, message: "La date est obligatoire" }]}
              >
                <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item name="confidentialite" label="Confidentialité">
                <Select>
                  <Option value="normale">🟢 Normale</Option>
                  <Option value="restreinte">🟡 Restreinte</Option>
                  <Option value="confidentielle">🔴 Confidentielle</Option>
                </Select>
              </Form.Item>

              <Form.Item name="priorite" label="Priorité">
                <Select>
                  <Option value="basse">⬇️ Basse</Option>
                  <Option value="normale">↔️ Normale</Option>
                  <Option value="haute">⬆️ Haute</Option>
                  <Option value="urgente">🚨 Urgente</Option>
                </Select>
              </Form.Item>

              <Form.Item name="category" label="Catégorie" rules={[{ required: true }]}>
                <Select loading={categories.length === 0}>
                  {categories.map(c => (
                    <Option key={c.id} value={c.id}>{c.nom}</Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item name="service_id" label="Service imputé" rules={[{ required: true }]}>
                <Select loading={services.length === 0}>
                  {services.map(s => (
                    <Option key={s.id} value={s.id}>{s.nom}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item style={{ textAlign: "right" }}>
            <Space>
              <Button onClick={() => setFormModalVisible(false)}>
                Annuler
              </Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                {editingId ? "Modifier" : "Créer"}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* MODAL WORKFLOW IA */}
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <RobotOutlined style={{ color: "#1890ff" }} />
            <span>Création automatique par Intelligence Artificielle</span>
          </div>
        }
        open={aiWorkflowVisible}
        onCancel={() => setAiWorkflowVisible(false)}
        width={900}
        footer={null}
      >
        <Steps current={aiWorkflowStep} style={{ marginBottom: 30 }}>
          <Step title="Upload" description="Télécharger le document" />
          <Step title="Analyse IA" description="Extraction et classification" />
          <Step title="Validation" description="Vérifier et enregistrer" />
        </Steps>

        {aiWorkflowStep === 0 && (
          <div>
            {renderUploadStep()}
            <div style={{ textAlign: "right", marginTop: 30 }}>
              <Button 
                type="primary" 
                onClick={() => setAiWorkflowStep(1)}
                disabled={!uploadedFile}
              >
                Continuer vers l'analyse
              </Button>
            </div>
          </div>
        )}

        {aiWorkflowStep === 1 && (
          <div>
            {renderAnalysisStep()}
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 30 }}>
              <Button onClick={() => setAiWorkflowStep(0)}>
                ← Retour à l'upload
              </Button>
            </div>
          </div>
        )}

        {aiWorkflowStep === 2 && (
          <div>
            {renderValidationStep()}
            <div style={{ 
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "center",
              padding: "20px 0",
              borderTop: "1px solid #f0f0f0",
              marginTop: 20
            }}>
              <div>
                <Button onClick={() => setAiWorkflowStep(0)}>
                  Recommencer
                </Button>
                <Button 
                  onClick={() => setAiWorkflowStep(1)} 
                  icon={<EditOutlined />}
                  style={{ marginLeft: 10 }}
                >
                  Refaire l'analyse
                </Button>
              </div>
              
              <Space>
                <Button 
                  onClick={() => setAiWorkflowVisible(false)}
                  icon={<CloseCircleOutlined />}
                >
                  Annuler
                </Button>
                <Button 
                  type="primary"
                  onClick={saveCourrierWithAI}
                  loading={loading}
                  icon={<CheckCircleOutlined />}
                >
                  Enregistrer le courrier
                </Button>
              </Space>
            </div>
          </div>
        )}
      </Modal>
    </Card>
  );
};

export default CourrierEntrants;