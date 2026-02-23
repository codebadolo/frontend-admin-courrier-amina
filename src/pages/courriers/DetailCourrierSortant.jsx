import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card, Spin, Tag, Button, Space, Descriptions, Row, Col, message
} from "antd";
import {
  ArrowLeftOutlined,
  EditOutlined,
  FilePdfOutlined,
  SendOutlined
} from "@ant-design/icons";
import dayjs from "dayjs";
import axios from "axios";

const DetailCourrierSortant = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [courrier, setCourrier] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCourrier = async () => {
      try {
        const res = await axios.get(
          `http://localhost:8000/api/courriers/courriers/${id}/`
        );
        setCourrier(res.data);
      } catch (err) {
        message.error("Impossible de charger le courrier");
      } finally {
        setLoading(false);
      }
    };

    loadCourrier();
  }, [id]);

  if (loading) {
    return <Spin tip="Chargement du courrier..." />;
  }

  if (!courrier) {
    return <p>Courrier introuvable</p>;
  }

  return (
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
            onClick={() =>
              navigate(`/courriers-sortants/redaction/${courrier.id}`)
            }
          >
            Modifier
          </Button>
          <Button
            type="primary"
            icon={<FilePdfOutlined />}
          >
            Générer PDF
          </Button>
        </Space>
      }
    >
      <Row gutter={24}>
        <Col span={12}>
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="Objet">
              {courrier.objet}
            </Descriptions.Item>
            <Descriptions.Item label="Destinataire">
              {courrier.destinataire_nom}
            </Descriptions.Item>
            <Descriptions.Item label="Adresse">
              {courrier.destinataire_adresse || "—"}
            </Descriptions.Item>
            <Descriptions.Item label="Date d'envoi">
              {dayjs(courrier.date_envoi).format("DD/MM/YYYY")}
            </Descriptions.Item>
          </Descriptions>
        </Col>

        <Col span={12}>
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="Statut">
              <Tag color="blue">{courrier.statut}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Priorité">
              <Tag color="red">{courrier.priorite}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Confidentialité">
              {courrier.confidentialite}
            </Descriptions.Item>
            <Descriptions.Item label="Canal">
              {courrier.canal}
            </Descriptions.Item>
          </Descriptions>
        </Col>
      </Row>

      <Card title="Contenu du courrier" style={{ marginTop: 24 }}>
        <div style={{ whiteSpace: "pre-line" }}>
          {courrier.contenu_texte || "Aucun contenu"}
        </div>
      </Card>
    </Card>
  );
};

export default DetailCourrierSortant;