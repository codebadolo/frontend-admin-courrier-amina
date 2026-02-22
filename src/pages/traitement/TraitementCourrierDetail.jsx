// src/pages/traitement/TraitementCourrierDetail.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card, Tabs, Spin, message, Breadcrumb, Space, Button,
  Tag, Descriptions, Row, Col, Typography, Alert
} from "antd";
import {
  HomeOutlined, AppstoreOutlined, FileTextOutlined,
  ArrowLeftOutlined, ToolOutlined, FlagOutlined
} from "@ant-design/icons";
import dayjs from "dayjs";
import { getCourrierDetail } from "../../services/courrierService";
import AnalyseCourrier from "./AnalyseCourrier"; // Composant que nous allons créer
import InstructionCourrier from './InstructionCourrier';
// import InstructionCourrier from './InstructionCourrier';
import RedactionCourrier from './RedactionCourrier';


const { Title, Text } = Typography;
const { TabPane } = Tabs;

const TraitementCourrierDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [courrier, setCourrier] = useState(null);

  useEffect(() => {
    if (id) loadCourrier();
  }, [id]);

  const loadCourrier = async () => {
    try {
      setLoading(true);
      const data = await getCourrierDetail(id);
      setCourrier(data);
    } catch (error) {
      message.error("Erreur lors du chargement du courrier");
      navigate("/traitement/courriers");
    } finally {
      setLoading(false);
    }
  };

  const refreshData = () => {
    loadCourrier();
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <Spin size="large" tip="Chargement du courrier..." />
      </div>
    );
  }

  if (!courrier) {
    return (
      <Alert
        message="Courrier non trouvé"
        type="error"
        showIcon
        action={<Button onClick={() => navigate("/traitement/courriers")}>Retour</Button>}
      />
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      {/* Breadcrumb */}
      <Breadcrumb style={{ marginBottom: 20 }}>
        <Breadcrumb.Item onClick={() => navigate('/')}>
          <HomeOutlined /> Accueil
        </Breadcrumb.Item>
        <Breadcrumb.Item onClick={() => navigate('/traitement/courriers')}>
          <AppstoreOutlined /> Traitement
        </Breadcrumb.Item>
        <Breadcrumb.Item>
          <FileTextOutlined /> {courrier.reference}
        </Breadcrumb.Item>
      </Breadcrumb>

      {/* En-tête */}
      <Card style={{ marginBottom: 20 }}>
        <Row gutter={24} align="middle">
          <Col span={20}>
            <Space direction="vertical" size="small">
              <Space wrap>
                <Tag color="blue">{courrier.reference}</Tag>
                <Tag color={courrier.priorite === 'urgente' ? 'red' : 'blue'}>
                  {courrier.priorite?.toUpperCase()}
                </Tag>
                <Tag color="purple">{courrier.confidentialite}</Tag>
              </Space>
              <Title level={3} style={{ margin: 0 }}>{courrier.objet}</Title>
              <Text type="secondary">Expéditeur: {courrier.expediteur_nom}</Text>
            </Space>
          </Col>
          <Col span={4} style={{ textAlign: 'right' }}>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
              Retour
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Onglets de traitement */}
      <Card>
        <Tabs defaultActiveKey="analyse" type="card">
          {/* ⚡ ICI L'ONGLET ANALYSE ⚡ */}
          <TabPane
            tab={<span><FileTextOutlined /> Analyse</span>}
            key="analyse"
          >
            <AnalyseCourrier courrier={courrier} onComplete={refreshData} />
          </TabPane>

          <TabPane
            tab={<span><FlagOutlined /> Instruction</span>}
            key="instruction"
          >
            <InstructionCourrier courrier={courrier} onComplete={refreshData} />
          </TabPane>

          <TabPane
            tab={<span><FileTextOutlined /> Rédaction</span>}
            key="redaction"
          >
            <RedactionCourrier courrier={courrier} onComplete={refreshData} />
          </TabPane>

          <TabPane
            tab={<span><FileTextOutlined /> Validation</span>}
            key="validation"
          >
            <div style={{ padding: 20, textAlign: 'center' }}>
              <Text type="secondary">Module de validation en cours de développement</Text>
            </div>
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default TraitementCourrierDetail;