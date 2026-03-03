// src/pages/courriers/RedactionCourrierSortant.jsx
import React, { useState, useEffect } from "react";
import {
  Card, Form, Input, Button, Space, Select, DatePicker,
  Row, Col, Typography, Tabs, message, Tag,
  Checkbox, Modal, Descriptions, Alert
} from "antd";
import {
  SaveOutlined, SendOutlined, FilePdfOutlined,
  PrinterOutlined, EyeOutlined, RollbackOutlined,
  SignatureOutlined, ArrowLeftOutlined
} from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import dayjs from "dayjs";
import axios from "axios";
import { Editor } from "react-draft-wysiwyg";
import { EditorState, ContentState, convertToRaw, convertFromHTML, onEditorStateChange } from "draft-js";
import draftToHtml from "draftjs-to-html";
// import Editor from 'react-draft-wysiwyg';
import "react-draft-wysiwyg/dist/react-draft-wysiwyg.css";
import DOMPurify from "dompurify";


const { Option } = Select;
const { TextArea } = Input;
const { Title, Text } = Typography;
const { TabPane } = Tabs;

const API_BASE = "http://localhost:8000/api";

axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("auth_token") || localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Token ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

const RedactionCourrierSortant = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewHtml, setPreviewHtml] = useState("");
  const [modeles, setModeles] = useState([]);
  const [signatureVisible, setSignatureVisible] = useState(false);
  const [validationHistory, setValidationHistory] = useState([]);
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [editorState, setEditorState] = useState(EditorState.createEmpty());
  
  const navigate = useNavigate();
  const { id } = useParams();

  // ============================================
  // 1. CHARGEMENT DES DONNÉES
  // ============================================
  useEffect(() => {
    loadReferences();
    loadModeles();
    loadCurrentUser();
    if (id) loadCourrier();
  }, [id]);

  useEffect(() => {
    // Synchroniser le contenu de l'éditeur avec le formulaire
    const contentState = editorState.getCurrentContent();
    const html = draftToHtml(convertToRaw(contentState));
    form.setFieldsValue({ contenu_texte: html });
  }, [editorState, form]);

  const loadCurrentUser = async () => {
    try {
      const response = await axios.get(`${API_BASE}/users/me/`);
      setCurrentUser(response.data);
    } catch (error) {
      console.error("Erreur chargement utilisateur:", error);
    }
  };

  const loadReferences = async () => {
    try {
      const [servicesRes, categoriesRes] = await Promise.all([
        axios.get(`${API_BASE}/core/services/`),
        axios.get(`${API_BASE}/core/categories/`)
      ]);
      setServices(servicesRes.data);
      setCategories(categoriesRes.data);
    } catch (error) {
      console.error("Erreur chargement références:", error);
    }
  };

  const loadModeles = async () => {
    try {
      const response = await axios.get(`${API_BASE}/courriers/modeles/`);
      setModeles(response.data);
    } catch (error) {
      console.log("Pas de modèles disponibles");
    }
  };

  const loadCourrier = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE}/courriers/courriers/${id}/`);
      const data = response.data;
      
      form.setFieldsValue({
        objet: data.objet,
        destinataire_nom: data.destinataire_nom,
        destinataire_adresse: data.destinataire_adresse,
        destinataire_email: data.destinataire_email,
        date_envoi: data.date_envoi ? dayjs(data.date_envoi) : null,
        canal: data.canal || "email",
        confidentialite: data.confidentialite || "normale",
        priorite: data.priorite || "normale",
        category: data.category?.id || data.category,
        service_id: data.service_impute?.id || data.service_impute,
        contenu_texte: data.contenu_texte || "",
        signataire: data.signataire || "",
      });

      // Initialiser l'éditeur avec le contenu HTML existant
      if (data.contenu_texte) {
        const blocksFromHTML = convertFromHTML(data.contenu_texte);
        const contentState = ContentState.createFromBlockArray(
          blocksFromHTML.contentBlocks,
          blocksFromHTML.entityMap
        );
        setEditorState(EditorState.createWithContent(contentState));
      }
      
      setValidationHistory(data.validations || []);
    } catch (error) {
      console.error("Erreur chargement:", error);
      message.error("Erreur chargement du courrier");
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // 2. GÉNÉRATION DU DOCUMENT
  // ============================================
  const genererDocument = (values) => {
    const date = values.date_envoi 
      ? dayjs(values.date_envoi).format("DD MMMM YYYY") 
      : dayjs().format("DD MMMM YYYY");
    const lieu = values.lieu || "Ouagadougou";
    
    const entete = `
      <div style="text-align: center; margin-bottom: 30px;">
        <h2 style="margin: 0; color: #003366;">ZEPINTEL</h2>
        <h3 style="margin: 5px 0; color: #003366;">Innovation & Technologies</h3>
        <p style="margin: 10px 0; border-bottom: 2px solid #003366; padding-bottom: 10px;">
          N/Réf: ${values.reference || id ? `CS/${dayjs().year()}/${id || 'XXXXXX'}` : "_______"}
        </p>
      </div>
    `;

    const corps = `
      <div style="margin-bottom: 30px;">
        <p style="text-align: right;"><strong>${lieu}, le ${date}</strong></p>
        
        <p><strong>À :</strong> ${values.destinataire_nom || "____________________"}</p>
        ${values.destinataire_fonction ? `<p><strong>Fonction :</strong> ${values.destinataire_fonction}</p>` : ""}
        ${values.destinataire_adresse ? `<p>${values.destinataire_adresse}</p>` : ""}
        
        <br/>
        
        <p><strong>Objet :</strong> ${values.objet || "____________________"}</p>
        
        <br/>
        
        <div style="white-space: pre-wrap; line-height: 1.6;">
          ${values.contenu_texte || "______________________________________________________________________\n______________________________________________________________________"}
        </div>
        
        <br/>
        
        <p><strong>${values.formule_politesse || "Veuillez agréer, Monsieur, l'expression de nos salutations distinguées."}</strong></p>
        
        <br/>
        
        <p style="text-align: right;">
          <strong>${values.signataire || currentUser?.full_name || "Le Directeur Général"}</strong>
        </p>
      </div>
    `;

    const pied = `
      <div style="margin-top: 30px; text-align: center; font-size: 11px; color: #666; border-top: 1px solid #ccc; padding-top: 10px;">
        <p>1200 Logements, Ouagadougou, Burkina Faso</p>
        <p>Tél: +226 25 46 36 86 | +226 60 60 60 19</p>
        <p>www.zepintel.com | contact@zepintel.com</p>
        <p style="font-size: 9px;">RCCM BF OUA 2016 B 8874 IFU 00085089D</p>
      </div>
    `;

    const tampon = values.apposer_tampon ? `
      <div style="text-align: right; margin-top: 20px;">
        <div style="border: 2px solid #003366; width: 150px; height: 150px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; opacity: 0.8;">
          <span style="font-weight: bold;">TAMPON OFFICIEL</span>
        </div>
      </div>
    ` : "";

    return entete + corps + pied + tampon;
  };

  // ============================================
  // 3. PRÉVISUALISATION
  // ============================================
  const handlePreview = async () => {
    try {
      const values = await form.validateFields();
      const html = genererDocument(values);
      setPreviewHtml(html);
      setPreviewVisible(true);
    } catch (error) {
      message.error("Veuillez remplir tous les champs obligatoires");
    }
  };

  // ============================================
  // 4. GÉNÉRATION PDF
  // ============================================
  const handleGeneratePDF = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();
      
      let courrierId = id;
      if (!courrierId) {
        const savedCourrier = await handleSaveAndGetId();
        if (!savedCourrier) {
          message.error("Impossible de sauvegarder le courrier avant génération PDF");
          setLoading(false);
          return;
        }
        courrierId = savedCourrier.id;
      }
      
      const response = await axios.get(
        `${API_BASE}/courriers/courriers/${courrierId}/export_pdf/`,
        { responseType: "blob" }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `courrier_${courrierId}_${dayjs().format('YYYYMMDD')}.pdf`);
      document.body.appendChild(link);
      link.click();
      
      message.success("PDF généré avec succès");
    } catch (error) {
      console.error("Erreur PDF:", error);
      message.error("Erreur lors de la génération du PDF");
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // 5. SAUVEGARDE
  // ============================================
  const handleSaveAndGetId = async () => {
    try {
      const values = await form.validateFields();
      
      const payload = {
        objet: values.objet,
        destinataire_nom: values.destinataire_nom,
        destinataire_adresse: values.destinataire_adresse || "",
        destinataire_email: values.destinataire_email || "",
        date_envoi: values.date_envoi?.format("YYYY-MM-DD") || dayjs().format("YYYY-MM-DD"),
        canal: values.canal || "email",
        confidentialite: values.confidentialite || "normale",
        type: "sortant",
        category: values.category,
        service_impute: values.service_id,
        priorite: values.priorite || "normale",
        contenu_texte: values.contenu_texte || "",
        signataire: values.signataire || currentUser?.full_name,
        statut: "brouillon"
      };
      
      const response = await axios.post(`${API_BASE}/courriers/courriers/`, payload);
      message.success("Courrier créé avec succès");
      return response.data;
    } catch (error) {
      console.error("Erreur sauvegarde:", error);
      const errorMsg = error.response?.data?.error || "Erreur lors de la sauvegarde";
      message.error(errorMsg);
      return null;
    }
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      
      const payload = {
        objet: values.objet,
        destinataire_nom: values.destinataire_nom,
        destinataire_adresse: values.destinataire_adresse || "",
        destinataire_email: values.destinataire_email || "",
        date_envoi: values.date_envoi?.format("YYYY-MM-DD") || dayjs().format("YYYY-MM-DD"),
        canal: values.canal || "email",
        confidentialite: values.confidentialite || "normale",
        type: "sortant",
        category: values.category,
        service_impute: values.service_id,
        priorite: values.priorite || "normale",
        contenu_texte: values.contenu_texte || "",
        signataire: values.signataire || currentUser?.full_name,
        statut: "brouillon"
      };
      
      if (id) {
        await axios.put(`${API_BASE}/courriers/courriers/${id}/`, payload);
        message.success("Courrier modifié avec succès");
      } else {
        const response = await axios.post(`${API_BASE}/courriers/courriers/`, payload);
        navigate(`/courriers-sortants/redaction/${response.data.id}`);
        message.success("Courrier créé avec succès");
      }
    } catch (error) {
      console.error("Erreur sauvegarde:", error);
      message.error("Erreur lors de la sauvegarde");
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // 6. SOUMISSION POUR VALIDATION
  // ============================================
  const handleSubmitValidation = async () => {
    try {
      const values = await form.validateFields();
      
      if (!id) {
        message.warning("Veuillez d'abord sauvegarder le courrier avant de le soumettre pour validation");
        return;
      }
      
      Modal.confirm({
        title: "Soumettre pour validation",
        content: "Ce courrier sera soumis à votre chef de service pour validation.",
        okText: "Confirmer",
        cancelText: "Annuler",
        onOk: async () => {
          setLoading(true);
          try {
            await axios.post(
              `${API_BASE}/courriers/courriers/${id}/soumettre-validation/`,
              { commentaire: values.commentaire_validation || "Soumis pour validation" }
            );
            message.success("Courrier soumis pour validation avec succès");
            navigate("/courriers-sortants");
          } catch (error) {
            console.error("Erreur validation:", error);
            message.error("Erreur lors de la soumission: " + (error.response?.data?.error || error.message));
          } finally {
            setLoading(false);
          }
        }
      });
    } catch (error) {
      message.error("Veuillez remplir tous les champs obligatoires");
    }
  };

  // ============================================
  // 7. SIGNATURE ÉLECTRONIQUE
  // ============================================
  const handleSign = async () => {
    if (!id) {
      message.warning("Veuillez d'abord sauvegarder le courrier avant de le signer");
      return;
    }
    setSignatureVisible(true);
  };

  const confirmSignature = async () => {
    setSignatureVisible(false);
    setLoading(true);
    
    try {
      await axios.post(
        `${API_BASE}/courriers/courriers/${id}/signer/`,
        { signature_data: { date: dayjs().format(), method: "electronique" } }
      );
      
      setValidationHistory([
        ...validationHistory,
        {
          date: dayjs().format("DD/MM/YYYY HH:mm"),
          action: "Signature électronique",
          auteur: currentUser?.full_name || "Utilisateur",
          statut: "signé"
        }
      ]);
      
      message.success("Document signé électroniquement");
    } catch (error) {
      message.error("Erreur lors de la signature");
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // RENDU
  // ============================================
  return (
    <div style={{ padding: 24 }}>
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={24} align="middle">
          <Col span={12}>
            <Title level={2} style={{ margin: 0 }}>
              <SendOutlined /> Rédaction de courrier {id ? `#${id}` : ''}
            </Title>
            <Text type="secondary">Créer un courrier officiel avec génération automatique</Text>
          </Col>
          <Col span={12} style={{ textAlign: "right" }}>
            <Space>
              <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
                Retour
              </Button>
              <Button icon={<EyeOutlined />} onClick={handlePreview}>
                Prévisualiser
              </Button>
              <Button
                type="primary"
                icon={<FilePdfOutlined />}
                onClick={handleGeneratePDF}
                loading={loading}
              >
                Générer PDF
              </Button>
              <Button
                icon={<SendOutlined />}
                onClick={handleSubmitValidation}
                disabled={!id}
                ghost
              >
                Soumettre validation
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Row gutter={24}>
        <Col span={18}>
          <Tabs defaultActiveKey="redaction" type="card">
            <TabPane tab="✍️ Rédaction" key="redaction">
              <Card>
                <Form form={form} layout="vertical">
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        name="destinataire_nom"
                        label="Destinataire"
                        rules={[{ required: true, message: "Le destinataire est obligatoire" }]}
                      >
                        <Input placeholder="Nom du destinataire" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="destinataire_fonction"
                        label="Fonction"
                      >
                        <Input placeholder="Fonction du destinataire" />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Form.Item
                    name="destinataire_adresse"
                    label="Adresse"
                  >
                    <TextArea rows={2} placeholder="Adresse complète du destinataire" />
                  </Form.Item>

                  <Form.Item
                    name="destinataire_email"
                    label="Email"
                    rules={[{ type: 'email', message: "Email invalide" }]}
                  >
                    <Input placeholder="email@exemple.com" />
                  </Form.Item>

                  <Form.Item
                    name="objet"
                    label="Objet"
                    rules={[{ required: true, message: "L'objet est obligatoire" }]}
                  >
                    <Input placeholder="Objet du courrier" />
                  </Form.Item>

                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        name="date_envoi"
                        label="Date d'envoi"
                        rules={[{ required: true }]}
                      >
                        <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="canal" label="Canal">
                        <Select>
                          <Option value="email">Email</Option>
                          <Option value="physique">Physique</Option>
                          <Option value="courrier">Courrier postal</Option>
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item name="category" label="Catégorie">
                        <Select placeholder="Sélectionner une catégorie">
                          {categories.map(c => (
                            <Option key={c.id} value={c.id}>{c.nom}</Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="service_id" label="Service imputé">
                        <Select placeholder="Sélectionner un service">
                          {services.map(s => (
                            <Option key={s.id} value={s.id}>{s.nom}</Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={16}>
                    <Col span={8}>
                      <Form.Item name="priorite" label="Priorité">
                        <Select>
                          <Option value="urgente">Urgente</Option>
                          <Option value="haute">Haute</Option>
                          <Option value="normale">Normale</Option>
                          <Option value="basse">Basse</Option>
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item name="confidentialite" label="Confidentialité">
                        <Select>
                          <Option value="normale">Normale</Option>
                          <Option value="restreinte">Restreinte</Option>
                          <Option value="confidentielle">Confidentielle</Option>
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>

                  <Form.Item label="Modèle de courrier">
                    <Select
                      placeholder="Choisir un modèle"
                      onChange={(val) => {
                        const modele = modeles.find(m => m.id === val);
                        if (modele) {
                          // Convertir le contenu HTML du modèle en EditorState
                          const blocksFromHTML = convertFromHTML(modele.contenu);
                          const contentState = ContentState.createFromBlockArray(
                            blocksFromHTML.contentBlocks,
                            blocksFromHTML.entityMap
                          );
                          setEditorState(EditorState.createWithContent(contentState));
                          form.setFieldsValue({ contenu_texte: modele.contenu });
                        }
                      }}
                    >
                      {modeles.map(m => (
                        <Option key={m.id} value={m.id}>{m.nom}</Option>
                      ))}
                    </Select>
                  </Form.Item>
                  <Form.Item name="contenu_texte" label="Contenu du courrier"
                    required placeholder="Rédigez le contenu du courrier..."
                    rules={[{ required: true, message: "Le contenu est obligatoire" }]}
                    valuePropName="value"
                    getValueFromEvent={(content) => content}
                    style={{height : 500}}
                    >
                    <div style={{ border: '1px solid #d9d9d9', borderRadius: 6, height: 300, overflow: 'auto' }}>
                      <Editor
                        editorState={editorState}
                        onEditorStateChange={setEditorState}
                      />
                    </div>
                  </Form.Item>

                  {/* <Form.Item name="contenu_texte" hidden>
                    <Input />
                  </Form.Item> */}

                  <Form.Item name="formule_politesse" label="Formule de politesse">
                    <Select>
                      <Option value="Veuillez agréer, Monsieur, l'expression de mes salutations distinguées.">
                        Formule standard
                      </Option>
                      <Option value="Je vous prie d'agréer, Monsieur, l'assurance de ma considération distinguée.">
                        Formule formelle
                      </Option>
                    </Select>
                  </Form.Item>

                  <Card title="Options" size="small">
                    <Row gutter={16}>
                      <Col span={8}>
                        <Form.Item name="apposer_tampon" valuePropName="checked">
                          <Checkbox>Apposer le tampon officiel</Checkbox>
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item name="inclure_mention_ci" valuePropName="checked">
                          <Checkbox>Inclure mention "Confidentiel"</Checkbox>
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item name="inclure_mention_urgent" valuePropName="checked">
                          <Checkbox>Inclure mention "Urgent"</Checkbox>
                        </Form.Item>
                      </Col>
                    </Row>
                  </Card>

                  <Form.Item name="signataire" label="Signataire">
                    <Input placeholder="Nom du signataire" />
                  </Form.Item>
                </Form>
              </Card>
            </TabPane>

            <TabPane tab="📋 Validations" key="validations">
              <Card>
                {validationHistory.length > 0 ? (
                  validationHistory.map((item, idx) => (
                    <div key={idx} style={{ marginBottom: 16 }}>
                      <Tag color="green">{item.date}</Tag>
                      <Text strong>{item.action}</Text>
                      <br />
                      <Text type="secondary">Par: {item.auteur}</Text>
                    </div>
                  ))
                ) : (
                  <Alert
                    message="Aucune validation"
                    description="Ce courrier n'a pas encore été soumis pour validation"
                    type="info"
                  />
                )}
              </Card>
            </TabPane>
          </Tabs>
        </Col>

        <Col span={6}>
          <Card title="Actions" style={{ marginBottom: 24 }}>
            <Space direction="vertical" style={{ width: "100%" }}>
              <Button
                block
                icon={<SaveOutlined />}
                onClick={handleSave}
                loading={loading}
              >
                Sauvegarder brouillon
              </Button>
              <Button
                block
                type="primary"
                icon={<SignatureOutlined />}
                onClick={handleSign}
                disabled={!id}
              >
                Signer électroniquement
              </Button>
              <Button block icon={<PrinterOutlined />} onClick={() => window.print()}>
                Imprimer
              </Button>
            </Space>
          </Card>

          <Card title="Informations" style={{ marginBottom: 24 }}>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Statut">
                <Tag color="blue">{id ? "Brouillon" : "Nouveau"}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Créé le">
                {dayjs().format("DD/MM/YYYY HH:mm")}
              </Descriptions.Item>
              <Descriptions.Item label="Par">
                {currentUser?.full_name || "Utilisateur"}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          <Card title="Instructions">
            <ul style={{ paddingLeft: 20 }}>
              <li>Remplissez tous les champs obligatoires</li>
              <li>Prévisualisez avant de générer le PDF</li>
              <li>Sauvegardez d'abord pour soumettre à validation</li>
              <li>Signez électroniquement avant envoi</li>
            </ul>
          </Card>
        </Col>
      </Row>

      <Modal
        title="Prévisualisation du courrier"
        open={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        width={800}
        footer={[
          <Button key="close" onClick={() => setPreviewVisible(false)}>
            Fermer
          </Button>,
          <Button
            key="pdf"
            type="primary"
            icon={<FilePdfOutlined />}
            onClick={handleGeneratePDF}
          >
            Générer PDF
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

      <Modal
        title="Signature électronique"
        open={signatureVisible}
        onCancel={() => setSignatureVisible(false)}
        onOk={confirmSignature}
        okText="Signer"
        cancelText="Annuler"
      >
        <div style={{ textAlign: "center", padding: 20 }}>
          <SignatureOutlined style={{ fontSize: 48, color: "#1890ff" }} />
          <p style={{ marginTop: 20 }}>
            Vous allez apposer votre signature électronique sur ce document.
          </p>
          <p>Cette action est irréversible et engagera votre responsabilité.</p>
        </div>
      </Modal>
    </div>
  );
};

export default RedactionCourrierSortant;