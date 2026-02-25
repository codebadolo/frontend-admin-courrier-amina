// src/pages/courriers/DetailCourrierSortant.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card, Spin, Tag, Button, Space, Descriptions, Row, Col, message, Tabs, Timeline
} from "antd";
import {
  ArrowLeftOutlined,
  EditOutlined,
  FilePdfOutlined,
  SendOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  UserOutlined,
  TeamOutlined,
  MailOutlined,
  EnvironmentOutlined,
  HistoryOutlined
} from "@ant-design/icons";
import dayjs from "dayjs";
import axios from "axios";

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

const DetailCourrierSortant = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [courrier, setCourrier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeline, setTimeline] = useState([]);

  useEffect(() => {
    loadCourrier();
  }, [id]);

  const loadCourrier = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/courriers/courriers/${id}/`);
      setCourrier(res.data);
      
      // Charger l'historique
      if (res.data.historiques) {
        setTimeline(res.data.historiques.sort((a, b) => 
          new Date(b.date) - new Date(a.date)
        ));
      }
    } catch (err) {
      console.error("Erreur chargement:", err);
      if (err.response?.status === 404) {
        message.error("Courrier non trouvé");
        navigate("/courriers-sortants");
      } else {
        message.error("Impossible de charger le courrier");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePDF = async () => {
    try {
      const response = await axios.get(
        `${API_BASE}/courriers/courriers/${id}/export_pdf/`,
        { responseType: "blob" }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `courrier_${id}_${dayjs().format('YYYYMMDD')}.pdf`);
      document.body.appendChild(link);
      link.click();
      
      message.success("PDF généré avec succès");
    } catch (error) {
      console.error("Erreur PDF:", error);
      message.error("Erreur lors de la génération du PDF");
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: 50 }}>
        <Spin size="large" tip="Chargement du courrier..." />
      </div>
    );
  }

  if (!courrier) {
    return <p>Courrier introuvable</p>;
  }

  const getPriorityColor = (priorite) => {
    const colors = {
      urgente: 'red',
      haute: 'orange',
      normale: 'blue',
      basse: 'green'
    };
    return colors[priorite] || 'blue';
  };

  const getStatusColor = (statut) => {
    const colors = {
      envoye: 'green',
      en_cours: 'processing',
      brouillon: 'default',
      annule: 'error',
      valide: 'success'
    };
    return colors[statut] || 'default';
  };

  return (
    <div style={{ padding: 24 }}>
      <Card
        title={
          <Space>
            <SendOutlined />
            Détail du courrier sortant
            <Tag color="blue">{courrier.reference}</Tag>
          </Space>
        }
        extra={
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
              Retour
            </Button>
            <Button
              icon={<EditOutlined />}
              onClick={() => navigate(`/courriers-sortants/redaction/${id}`)}
            >
              Modifier
            </Button>
            <Button
              type="primary"
              icon={<FilePdfOutlined />}
              onClick={handleGeneratePDF}
            >
              Générer PDF
            </Button>
          </Space>
        }
      >
        <Tabs defaultActiveKey="details">
          <TabPane tab="Détails" key="details">
            <Row gutter={24}>
              <Col span={12}>
                <Descriptions column={1} bordered size="small" title="Informations générales">
                  <Descriptions.Item label="Objet">
                    <b>{courrier.objet}</b>
                  </Descriptions.Item>
                  <Descriptions.Item label="Destinataire">
                    <Space direction="vertical" size={0}>
                      <span><UserOutlined /> {courrier.destinataire_nom}</span>
                      {courrier.destinataire_fonction && (
                        <span><TeamOutlined /> {courrier.destinataire_fonction}</span>
                      )}
                    </Space>
                  </Descriptions.Item>
                  {courrier.destinataire_email && (
                    <Descriptions.Item label="Email">
                      <MailOutlined /> {courrier.destinataire_email}
                    </Descriptions.Item>
                  )}
                  {courrier.destinataire_adresse && (
                    <Descriptions.Item label="Adresse">
                      <EnvironmentOutlined /> {courrier.destinataire_adresse}
                    </Descriptions.Item>
                  )}
                </Descriptions>
              </Col>

              <Col span={12}>
                <Descriptions column={1} bordered size="small" title="Suivi">
                  <Descriptions.Item label="Statut">
                    <Tag color={getStatusColor(courrier.statut)}>
                      {courrier.statut}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Priorité">
                    <Tag color={getPriorityColor(courrier.priorite)}>
                      {courrier.priorite}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Date d'envoi">
                    <ClockCircleOutlined /> {dayjs(courrier.date_envoi).format('DD/MM/YYYY')}
                  </Descriptions.Item>
                  <Descriptions.Item label="Confidentialité">
                    <Tag color={courrier.confidentialite === 'confidentielle' ? 'red' : 'blue'}>
                      {courrier.confidentialite}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Canal">
                    {courrier.canal}
                  </Descriptions.Item>
                </Descriptions>
              </Col>
            </Row>

            <Row gutter={24} style={{ marginTop: 24 }}>
              <Col span={12}>
                <Descriptions column={1} bordered size="small" title="Classification">
                  <Descriptions.Item label="Catégorie">
                    {courrier.category_detail?.nom || 'Non classé'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Service imputé">
                    {courrier.service_impute_detail?.nom || 'Non imputé'}
                  </Descriptions.Item>
                </Descriptions>
              </Col>
            </Row>

            {courrier.contenu_texte && (
              <Card title="Contenu du courrier" style={{ marginTop: 24 }}>
                <div style={{ whiteSpace: "pre-line", padding: 16, background: '#fafafa', borderRadius: 4 }}>
                  {courrier.contenu_texte}
                </div>
              </Card>
            )}
          </TabPane>

          <TabPane tab="Historique" key="historique">
            <Timeline mode="left">
              {timeline.map((item, index) => (
                <Timeline.Item 
                  key={index}
                  label={dayjs(item.date).format('DD/MM/YYYY HH:mm')}
                  color={item.action.includes('VALIDATION') ? 'green' : 'blue'}
                >
                  <b>{item.action}</b>
                  {item.commentaire && <p>{item.commentaire}</p>}
                  <small>Par: {item.user_detail?.full_name || 'Système'}</small>
                </Timeline.Item>
              ))}
            </Timeline>
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default DetailCourrierSortant;