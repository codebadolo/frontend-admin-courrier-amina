// src/pages/courriers/TraitementCourrierInterne.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card, Descriptions, Tag, Space, Button, Spin, message, Tabs, Row, Col,
  Input, Form, Upload, Divider, Typography
} from "antd";
import {
  ArrowLeftOutlined, SaveOutlined, CheckCircleOutlined,
  UploadOutlined, FileTextOutlined, UserOutlined, TeamOutlined
} from "@ant-design/icons";
import dayjs from "dayjs";
import axios from "axios";

const { TextArea } = Input;
const { Text } = Typography;

const API_BASE = "http://localhost:8000/api";

const TraitementCourrierInterne = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [courrier, setCourrier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    loadCourrier();
  }, [id]);

  const loadCourrier = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("auth_token") || localStorage.getItem("token");
      const response = await axios.get(
        `${API_BASE}/courriers/courriers/${id}/`,
        { headers: { Authorization: `Token ${token}` } }
      );
      setCourrier(response.data);
    } catch (error) {
      message.error("Erreur chargement courrier");
      navigate("/courriers-internes");
    } finally {
      setLoading(false);
    }
  };

  const handleTraiter = async (values) => {
    setSubmitting(true);
    try {
      const token = localStorage.getItem("auth_token") || localStorage.getItem("token");
      // Appel à l'API pour mettre à jour le statut et ajouter un commentaire
      // Utilisons l'endpoint `traiter` existant ou créons-en un nouveau
      await axios.post(
        `${API_BASE}/courriers/courriers/${id}/traiter/`,
        { commentaire: values.commentaire },
        { headers: { Authorization: `Token ${token}` } }
      );
      message.success("Courrier traité avec succès");
      navigate(`/courriers-internes/${id}`); // retour au détail
    } catch (error) {
      message.error("Erreur lors du traitement");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Spin size="large" style={{ margin: "50px auto", display: "block" }} />;

  return (
    <div style={{ padding: 24 }}>
      <Card
        title={
          <Space>
            <FileTextOutlined />
            <span>Traitement du courrier interne</span>
            <Tag color="purple">{courrier.reference}</Tag>
          </Space>
        }
        extra={
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
            Retour
          </Button>
        }
      >
        <Row gutter={24}>
          <Col span={12}>
            <Descriptions bordered column={1} size="small" title="Informations">
              <Descriptions.Item label="Objet">
                <Text strong>{courrier.objet}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Expéditeur">
                {courrier.created_by_detail?.prenom} {courrier.created_by_detail?.nom}
              </Descriptions.Item>
              <Descriptions.Item label="Service destinataire">
                {courrier.service_actuel_detail?.nom || courrier.service_impute_detail?.nom || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Statut">
                <Tag color={courrier.statut === 'repondu' ? 'green' : 'orange'}>
                  {courrier.statut}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Priorité">
                <Tag color={courrier.priorite === 'urgente' ? 'red' : 'blue'}>
                  {courrier.priorite}
                </Tag>
              </Descriptions.Item>
            </Descriptions>
          </Col>
          <Col span={12}>
            <Descriptions bordered column={1} size="small" title="Dates">
              <Descriptions.Item label="Date création">
                {dayjs(courrier.created_at).format('DD/MM/YYYY HH:mm')}
              </Descriptions.Item>
              {courrier.date_echeance && (
                <Descriptions.Item label="Échéance">
                  {dayjs(courrier.date_echeance).format('DD/MM/YYYY')}
                </Descriptions.Item>
              )}
            </Descriptions>
          </Col>
        </Row>

        <Divider />

        <Form form={form} layout="vertical" onFinish={handleTraiter}>
          <Form.Item
            name="commentaire"
            label="Commentaire / Note de traitement"
          >
            <TextArea rows={6} placeholder="Ajoutez vos observations, décisions..." />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SaveOutlined />}
                loading={submitting}
              >
                Marquer comme traité
              </Button>
              <Button onClick={() => navigate(-1)}>
                Annuler
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default TraitementCourrierInterne;