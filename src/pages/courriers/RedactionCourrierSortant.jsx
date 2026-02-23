// src/pages/courriers/RedactionCourrierSortant.jsx
import React, { useState, useEffect } from "react";
import {
  Card, Form, Input, Button, Space, Select, DatePicker,
  Row, Col, Typography, Tabs, Upload, message, Divider,
  Checkbox, Radio, Tag, Modal, Descriptions, Alert
} from "antd";
import {
  SaveOutlined, SendOutlined, FilePdfOutlined,
  PrinterOutlined, EyeOutlined, RollbackOutlined,
  UploadOutlined, DeleteOutlined, CopyOutlined,
  SignatureOutlined, CheckCircleOutlined, HistoryOutlined,
  PlusOutlined, MinusOutlined
} from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import dayjs from "dayjs";
import axios from "axios";

const { Option } = Select;
const { TextArea } = Input;
const { Title, Text } = Typography;
const { TabPane } = Tabs;

const RedactionCourrierSortant = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewHtml, setPreviewHtml] = useState("");
  const [modeles, setModeles] = useState([]);
  const [signatureVisible, setSignatureVisible] = useState(false);
  const [validationHistory, setValidationHistory] = useState([]);
  const [fileList, setFileList] = useState([]);
  
  const navigate = useNavigate();
  const { id } = useParams();

  // ============================================
  // 1. CHARGEMENT DES MODÈLES DE COURRIER
  // ============================================
  useEffect(() => {
    loadModeles();
    if (id) loadCourrier();
  }, [id]);

  const loadModeles = async () => {
    try {
      const response = await axios.get("http://localhost:8000/api/courriers/modeles/");
      setModeles(response.data);
    } catch (error) {
      console.log("Pas de modèles disponibles");
    }
  };

  const loadCourrier = async () => {
    try {
      const response = await axios.get(`http://localhost:8000/api/courriers/courriers/${id}/`);
      const data = response.data;
      form.setFieldsValue({
        ...data,
        date_envoi: data.date_envoi ? dayjs(data.date_envoi) : null,
      });
      // Charger l'historique des validations
      setValidationHistory(data.validations || []);
    } catch (error) {
      message.error("Erreur chargement du courrier");
    }
  };

  // ============================================
  // 2. GÉNÉRATION DU DOCUMENT AVEC EN-TÊTE OFFICIEL
  // ============================================
  const genererDocument = (values) => {
    const date = dayjs(values.date_envoi).format("DD MMMM YYYY");
    const lieu = values.lieu || "Ouagadougou";
    
    // Construction de l'en-tête officiel
    const entete = `
      <div style="text-align: center; margin-bottom: 30px;">
        <h2 style="margin: 0; color: #003366;">MINISTÈRE DE L'ADMINISTRATION</h2>
        <h3 style="margin: 5px 0; color: #003366;">SECRÉTARIAT GÉNÉRAL</h3>
        <p style="margin: 10px 0; border-bottom: 2px solid #003366; padding-bottom: 10px;">
          N° Réf: ${values.reference || "_______/MEF/SG"}
        </p>
      </div>
    `;

    // Corps du document
    const corps = `
      <div style="margin-bottom: 30px;">
        <p style="text-align: right;"><strong>${lieu}, le ${date}</strong></p>
        
        <p><strong>À :</strong> ${values.destinataire_nom}</p>
        ${values.destinataire_fonction ? `<p><strong>Fonction :</strong> ${values.destinataire_fonction}</p>` : ""}
        ${values.destinataire_adresse ? `<p>${values.destinataire_adresse}</p>` : ""}
        
        <br/>
        
        <p><strong>Objet :</strong> ${values.objet}</p>
        
        <br/>
        
        <p>${values.contenu_texte || ""}</p>
        
        <br/>
        
        <p><strong>${values.formule_politesse || "Veuillez agréer, Monsieur, l'expression de mes salutations distinguées."}</strong></p>
        
        <br/>
        
        <p style="text-align: right;">
          <strong>${values.signataire || "Le Directeur Général"}</strong>
        </p>
      </div>
    `;

    // Pied de page officiel
    const pied = `
      <div style="margin-top: 30px; text-align: center; font-size: 11px; color: #666; border-top: 1px solid #ccc; padding-top: 10px;">
        <p>01 BP 1234 OUAGADOUGOU 01 - Tél: (+226) 25 30 00 00 - Email: contact@ministere.gov.bf</p>
        <p>www.ministere.gov.bf</p>
      </div>
    `;

    // Tampon et signature si présents
    const tampon = values.apposer_tampon ? `
      <div style="text-align: right; margin-top: 20px;">
        <img src="/images/tampon-officiel.png" style="width: 150px; opacity: 0.8;" />
      </div>
    ` : "";

    return entete + corps + pied + tampon;
  };

  // ============================================
  // 3. PRÉVISUALISATION DU DOCUMENT
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
      
      // Appel à l'API pour générer le PDF
      const response = await axios.post(
        "http://localhost:8000/api/courriers/generer-pdf/",
        {
          ...values,
          template: genererDocument(values)
        },
        { responseType: "blob" }
      );

      // Télécharger le PDF
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `courrier_${values.reference || "sortant"}.pdf`);
      document.body.appendChild(link);
      link.click();
      
      message.success("PDF généré avec succès");
    } catch (error) {
      message.error("Erreur lors de la génération du PDF");
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // 5. ENVOI POUR VALIDATION
  // ============================================
  const handleSubmitValidation = async () => {
    try {
      const values = await form.validateFields();
      
      Modal.confirm({
        title: "Soumettre pour validation",
        content: "Ce courrier sera soumis à votre chef de service pour validation.",
        okText: "Confirmer",
        cancelText: "Annuler",
        onOk: async () => {
          setLoading(true);
          try {
            // Sauvegarder d'abord
            await handleSave();
            
            // Envoyer pour validation
            await axios.post(
              `http://127.0.0.1:8000/api/courriers/courriers/${id || "nouveau"}/soumettre-validation/`,
              { commentaire: values.commentaire_validation }
            );
            
            message.success("Courrier soumis pour validation");
            navigate("/courriers-sortants");
          } catch (error) {
            message.error("Erreur lors de la soumission");
          } finally {
            setLoading(false);
          }
        }
      });
    } catch (error) {
      message.error("Veuillez remplir tous les champs");
    }
  };

  // ============================================
  // 6. SAUVEGARDE (BROUILLON)
  // ============================================
  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      
      const payload = {
        ...values,
        date_envoi: values.date_envoi?.format("YYYY-MM-DD"),
        type: "sortant",
        statut: "brouillon"
      };
      
      if (id) {
        await axios.put(`http://localhost:8000/api/courriers/courriers/${id}/`, payload);
        message.success("Courrier modifié avec succès");
      } else {
        const response = await axios.post("http://localhost:8000/api/courriers/courriers/", payload);
        navigate(`/courriers-sortants/${response.data.id}`);
        message.success("Courrier créé avec succès");
      }
    } catch (error) {
      message.error("Erreur lors de la sauvegarde");
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // 7. SIGNATURE ÉLECTRONIQUE
  // ============================================
  const handleSign = () => {
    setSignatureVisible(true);
  };

  const confirmSignature = () => {
    setSignatureVisible(false);
    setValidationHistory([
      ...validationHistory,
      {
        date: dayjs().format("DD/MM/YYYY HH:mm"),
        action: "Signature électronique",
        auteur: "Utilisateur courant",
        statut: "signé"
      }
    ]);
    message.success("Document signé électroniquement");
  };

  // ============================================
  // RENDU
  // ============================================
  return (
    <div style={{ padding: 24 }}>
      {/* En-tête avec progression */}
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={24} align="middle">
          <Col span={12}>
            <Title level={2} style={{ margin: 0 }}>
              <SendOutlined /> Rédaction de courrier
            </Title>
            <Text type="secondary">Créer un courrier officiel avec génération automatique</Text>
          </Col>
          <Col span={12} style={{ textAlign: "right" }}>
            <Space>
              <Button icon={<RollbackOutlined />} onClick={() => navigate(-1)}>
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
                type="primary"
                icon={<SendOutlined />}
                onClick={handleSubmitValidation}
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
            {/* Onglet Rédaction */}
            <TabPane tab="Rédaction" key="redaction">
              <Card>
                <Form form={form} layout="vertical">
                  {/* Référence et Date */}
                  <Row gutter={16}>
<<<<<<< HEAD
               
=======
>>>>>>> origin/main
                    <Col span={12}>
                      <Form.Item
                        name="date_envoi"
                        label="Date d'envoi"
                        rules={[{ required: true }]}
                      >
                        <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
                      </Form.Item>
                    </Col>
                  </Row>

                  {/* Destinataire */}
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        name="destinataire_nom"
                        label="Destinataire"
                        rules={[{ required: true }]}
                      >
                        <Input placeholder="Monsieur le Directeur..." />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="destinataire_fonction" label="Fonction">
                        <Input placeholder="Directeur Général..." />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Form.Item name="destinataire_adresse" label="Adresse">
                    <TextArea rows={2} placeholder="Adresse complète du destinataire" />
                  </Form.Item>

                  {/* Objet */}
                  <Form.Item
                    name="objet"
                    label="Objet"
                    rules={[{ required: true }]}
                  >
                    <Input placeholder="Objet du courrier" />
                  </Form.Item>

                  {/* Contenu avec modèle */}
                  <Row gutter={16}>
                    <Col span={24}>
                      <Form.Item label="Modèle de courrier">
                        <Select
                          placeholder="Choisir un modèle"
                          onChange={(val) => {
                            const modele = modeles.find(m => m.id === val);
                            if (modele) {
                              form.setFieldsValue({
                                contenu_texte: modele.contenu,
                                formule_politesse: modele.formule_politesse
                              });
                            }
                          }}
                        >
                          {modeles.map(m => (
                            <Option key={m.id} value={m.id}>{m.nom}</Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>

                  <Form.Item name="contenu_texte" label="Contenu">
                    <TextArea rows={8} placeholder="Rédigez le contenu de votre courrier ici..." />
                  </Form.Item> 

                  <Form.Item name="formule_politesse" label="Formule de politesse">
                    <Select>
                      <Option value="Veuillez agréer, Monsieur, l'expression de mes salutations distinguées.">
                        Formule standard
                      </Option>
                      <Option value="Je vous prie d'agréer, Monsieur, l'assurance de ma considération distinguée.">
                        Formule formelle
                      </Option>
                      <Option value="Dans l'attente de votre suite, veuillez recevoir mes salutations respectueuses.">
                        Formule avec attente
                      </Option>
                    </Select>
                  </Form.Item>

                  {/* Options supplémentaires */}
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

                  {/* Signature */}
                  <Form.Item name="signataire" label="Signataire">
                    <Input placeholder="Nom du signataire" />
                  </Form.Item>
                </Form>
              </Card>
            </TabPane>

            {/* Onglet Historique des validations */}
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

        {/* Colonne latérale */}
        <Col span={6}>
          {/* Actions rapides */}
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
              >
                Signer électroniquement
              </Button>
              <Button block icon={<PrinterOutlined />} onClick={() => window.print()}>
                Imprimer
              </Button>
            </Space>
          </Card>

          {/* Informations */}
          <Card title="Informations" style={{ marginBottom: 24 }}>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Statut">
                <Tag color="blue">Brouillon</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Créé le">
                {dayjs().format("DD/MM/YYYY HH:mm")}
              </Descriptions.Item>
              <Descriptions.Item label="Par">
                Utilisateur courant
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {/* Rappel des instructions */}
          <Card title="Instructions">
            <ul style={{ paddingLeft: 20 }}>
              <li>Remplissez tous les champs obligatoires</li>
              <li>Prévisualisez avant de générer le PDF</li>
              <li>Soumettez pour validation si besoin</li>
              <li>Signez électroniquement</li>
            </ul>
          </Card>
        </Col>
      </Row>

      {/* Modal de prévisualisation */}
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
            fontFamily: "Times New Roman, serif"
          }}
          dangerouslySetInnerHTML={{ __html: previewHtml }}
        />
      </Modal>

      {/* Modal de signature */}
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
          <Input.Password placeholder="Confirmez votre mot de passe" />
        </div>
      </Modal>
    </div>
  );
};

export default RedactionCourrierSortant;