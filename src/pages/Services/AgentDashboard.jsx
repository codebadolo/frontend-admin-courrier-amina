// src/pages/services/AgentDashboard.jsx
import React, { useEffect, useState } from "react";
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Button,
  Tag,
  Space,
  notification,
  Modal,
  Descriptions,
  Badge
} from "antd";
import {
  TeamOutlined,
  InboxOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  EyeOutlined,
  PlayCircleOutlined,
  UserOutlined,
  MailOutlined
} from "@ant-design/icons";
import { getAgentDashboard, prendreCourrierEnCharge } from "../../api/service";
import { useAuth } from "../../contexts/AuthContext";

const AgentDashboard = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [previewModal, setPreviewModal] = useState(false);
  const [selectedCourrier, setSelectedCourrier] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const data = await getAgentDashboard();
      setDashboardData(data);
    } catch (error) {
      notification.error({
        message: 'Erreur',
        description: 'Impossible de charger le dashboard'
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePrendreCourrier = async (courrierId) => {
    try {
      await prendreCourrierEnCharge(courrierId);
      notification.success({
        message: 'Succès',
        description: 'Courrier pris en charge avec succès'
      });
      fetchDashboardData();
    } catch (error) {
      notification.error({
        message: 'Erreur',
        description: 'Impossible de prendre ce courrier en charge'
      });
    }
  };

  const columns = [
    {
      title: 'Référence',
      dataIndex: 'reference',
      key: 'reference',
      render: (text) => <strong>{text}</strong>
    },
    {
      title: 'Objet',
      dataIndex: 'objet',
      key: 'objet',
      ellipsis: true
    },
    {
      title: 'Expéditeur',
      dataIndex: 'expediteur_nom',
      key: 'expediteur_nom'
    },
    {
      title: 'Date Réception',
      dataIndex: 'date_reception',
      key: 'date_reception',
      render: (date) => new Date(date).toLocaleDateString()
    },
    {
      title: 'Priorité',
      dataIndex: 'priorite',
      key: 'priorite',
      render: (priorite) => {
        const colors = {
          urgente: 'red',
          haute: 'orange',
          normale: 'blue',
          basse: 'green'
        };
        return <Tag color={colors[priorite]}>{priorite}</Tag>;
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            icon={<EyeOutlined />}
            size="small"
            onClick={() => {
              setSelectedCourrier(record);
              setPreviewModal(true);
            }}
          />
          <Button
            type="primary"
            icon={<PlayCircleOutlined />}
            size="small"
            onClick={() => handlePrendreCourrier(record.id)}
          >
            Prendre en charge
          </Button>
        </Space>
      )
    }
  ];

  if (!dashboardData) {
    return <div>Chargement...</div>;
  }

  return (
    <div style={{ padding: '24px' }}>
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Mes Courriers"
              value={dashboardData.stats.mes_courriers_total}
              prefix={<InboxOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="En Retard"
              value={dashboardData.stats.mes_courriers_en_retard}
              valueStyle={{ color: '#cf1322' }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Disponibles"
              value={dashboardData.stats.courriers_service_disponibles}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Service"
              value={dashboardData.stats.service_nom}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col span={12}>
          <Card title="Mes Courriers Assignés">
            <Table
              columns={columns}
              dataSource={dashboardData.mes_courriers}
              rowKey="id"
              size="small"
              pagination={{ pageSize: 5 }}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card 
            title={
              <Space>
                <TeamOutlined />
                <span>Courriers Disponibles dans le Service</span>
                <Badge count={dashboardData.stats.courriers_service_disponibles} />
              </Space>
            }
          >
            <Table
              columns={columns}
              dataSource={dashboardData.courriers_disponibles}
              rowKey="id"
              size="small"
              pagination={{ pageSize: 5 }}
            />
          </Card>
        </Col>
      </Row>

      {/* Modal de prévisualisation */}
      <Modal
        title="Détails du Courrier"
        open={previewModal}
        onCancel={() => setPreviewModal(false)}
        width={700}
        footer={[
          <Button key="close" onClick={() => setPreviewModal(false)}>
            Fermer
          </Button>
        ]}
      >
        {selectedCourrier && (
          <Descriptions column={2} bordered>
            <Descriptions.Item label="Référence">
              <strong>{selectedCourrier.reference}</strong>
            </Descriptions.Item>
            <Descriptions.Item label="Type">
              <Tag>{selectedCourrier.type_display}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Objet" span={2}>
              {selectedCourrier.objet}
            </Descriptions.Item>
            <Descriptions.Item label="Expéditeur">
              {selectedCourrier.expediteur_nom}
            </Descriptions.Item>
            <Descriptions.Item label="Email">
              <MailOutlined /> {selectedCourrier.expediteur_email}
            </Descriptions.Item>
            <Descriptions.Item label="Date Réception">
              {new Date(selectedCourrier.date_reception).toLocaleDateString()}
            </Descriptions.Item>
            <Descriptions.Item label="Priorité">
              <Tag color={
                selectedCourrier.priorite === 'urgente' ? 'red' :
                selectedCourrier.priorite === 'haute' ? 'orange' :
                selectedCourrier.priorite === 'normale' ? 'blue' : 'green'
              }>
                {selectedCourrier.priorite}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Confidentialité">
              {selectedCourrier.confidentialite}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default AgentDashboard;