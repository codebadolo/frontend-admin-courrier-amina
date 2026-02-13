// src/pages/Services/ServiceDetail.jsx - Version Ant Design
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  Button,
  Tabs,
  Table,
  Tag,
  Input,
  Modal,
  Select,
  Space,
  Row,
  Col,
  Statistic,
  Avatar,
  Divider,
  notification,
  Spin,
  Descriptions,
} from "antd";
import {
  ArrowLeftOutlined,
  UserAddOutlined,
  UserDeleteOutlined,
  BarChartOutlined,
  InfoCircleOutlined,
  MailOutlined,
  TeamOutlined,
} from "@ant-design/icons";

import {
  getServiceById,
  getServiceMembers,
  addServiceMember,
  removeServiceMember,
  getServiceStats,
} from "../../api/service";
import { getUsers } from "../../api/auth";

const { TabPane } = Tabs;
const { Option } = Select;

const ServiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [service, setService] = useState(null);
  const [members, setMembers] = useState([]);
  const [stats, setStats] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [openAddMember, setOpenAddMember] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchServiceDetails = async () => {
    setLoading(true);
    try {
      const serviceData = await getServiceById(id);
      setService(serviceData);
      
      const membersData = await getServiceMembers(id);
      setMembers(membersData);
      
      const statsData = await getServiceStats(id);
      setStats(statsData);
      
      const usersData = await getUsers();
      setAllUsers(usersData);
    } catch (error) {
      notification.error({
        message: "Erreur",
        description: "Impossible de charger les détails du service",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServiceDetails();
  }, [id]);

  const handleAddMember = async () => {
    if (!selectedUserId) {
      notification.warning({
        message: "Attention",
        description: "Veuillez sélectionner un utilisateur",
      });
      return;
    }

    try {
      await addServiceMember(id, selectedUserId);
      notification.success({
        message: "Succès",
        description: "Membre ajouté au service",
      });
      setOpenAddMember(false);
      setSelectedUserId(null);
      fetchServiceDetails();
    } catch (error) {
      notification.error({
        message: "Erreur",
        description: "Impossible d'ajouter le membre",
      });
    }
  };

  const handleRemoveMember = async (userId) => {
    Modal.confirm({
      title: "Confirmation",
      content: "Voulez-vous vraiment retirer cet utilisateur du service ?",
      onOk: async () => {
        try {
          await removeServiceMember(id, userId);
          notification.success({
            message: "Succès",
            description: "Membre retiré du service",
          });
          fetchServiceDetails();
        } catch (error) {
          notification.error({
            message: "Erreur",
            description: "Impossible de retirer le membre",
          });
        }
      },
    });
  };

  const getRoleColor = (role) => {
    const colors = {
      admin: "red",
      chef: "purple",
      agent_service: "blue",
      collaborateur: "green",
      direction: "gold",
      agent_courrier: "cyan",
      archiviste: "orange",
    };
    return colors[role] || "default";
  };

  const columns = [
    {
      title: "Nom",
      dataIndex: ["prenom", "nom"],
      key: "name",
      render: (_, record) => `${record.prenom} ${record.nom}`,
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Rôle",
      dataIndex: "role",
      key: "role",
      render: (role, record) => (
        <Tag color={getRoleColor(role)}>
          {record.role_display || role}
        </Tag>
      ),
    },
    {
      title: "Statut",
      dataIndex: "actif",
      key: "actif",
      render: (actif) => (
        <Tag color={actif ? "success" : "default"}>
          {actif ? "Actif" : "Inactif"}
        </Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Button
          danger
          icon={<UserDeleteOutlined />}
          onClick={() => handleRemoveMember(record.id)}
          disabled={record.id === service?.chef?.id}
        >
          Retirer
        </Button>
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "50vh" }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!service) {
    return (
      <div style={{ padding: 24 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate("/services")}>
          Retour
        </Button>
        <Card style={{ marginTop: 16 }}>
          <p style={{ textAlign: "center", color: "#999" }}>Service non trouvé</p>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      {/* En-tête */}
      <div style={{ marginBottom: 24 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate("/services")}>
          Retour aux services
        </Button>
        <h1 style={{ fontSize: 24, fontWeight: "bold", marginTop: 16 }}>
          {service.nom}
        </h1>
        {service.description && (
          <p style={{ color: "#666", marginTop: 8 }}>{service.description}</p>
        )}
        
        <div style={{ marginTop: 16, display: "flex", justifyContent: "space-between" }}>
          <div>
            <span style={{ color: "#999" }}>Chef de service: </span>
            <span style={{ fontWeight: 500 }}>
              {service.chef_detail
                ? `${service.chef_detail.prenom} ${service.chef_detail.nom}`
                : "Non assigné"}
            </span>
          </div>
          <div>
            <span style={{ color: "#999" }}>Créé le: </span>
            <span style={{ fontWeight: 500 }}>
              {new Date(service.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultActiveKey="members">
        <TabPane
          tab={
            <span>
              <TeamOutlined />
              Membres ({members.length})
            </span>
          }
          key="members"
        >
          <Card
            title="Membres du service"
            extra={
              <Button
                type="primary"
                icon={<UserAddOutlined />}
                onClick={() => setOpenAddMember(true)}
              >
                Ajouter un membre
              </Button>
            }
          >
            <Table
              columns={columns}
              dataSource={members}
              rowKey="id"
              pagination={{ pageSize: 10 }}
              locale={{ emptyText: "Aucun membre dans ce service" }}
            />
          </Card>
        </TabPane>

        <TabPane
          tab={
            <span>
              <BarChartOutlined />
              Statistiques
            </span>
          }
          key="stats"
        >
          {stats ? (
            <Row gutter={16}>
              <Col span={8}>
                <Card>
                  <Statistic
                    title="Membres"
                    value={stats.nombre_membres || members.length}
                    prefix={<TeamOutlined />}
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card>
                  <Statistic
                    title="Courriers actifs"
                    value={stats.nombre_courriers_actifs || 0}
                    prefix={<MailOutlined />}
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card>
                  <Statistic
                    title="Courriers en retard"
                    value={stats.nombre_courriers_en_retard || 0}
                    valueStyle={{ color: "#cf1322" }}
                    prefix={<MailOutlined />}
                  />
                </Card>
              </Col>
            </Row>
          ) : (
            <Card>
              <p style={{ textAlign: "center", color: "#999" }}>
                Chargement des statistiques...
              </p>
            </Card>
          )}
        </TabPane>

        <TabPane
          tab={
            <span>
              <InfoCircleOutlined />
              Informations
            </span>
          }
          key="info"
        >
          <Card title="Informations générales">
            <Descriptions column={1}>
              <Descriptions.Item label="Nom du service">
                {service.nom}
              </Descriptions.Item>
              <Descriptions.Item label="Description">
                {service.description || "Non renseignée"}
              </Descriptions.Item>
              <Descriptions.Item label="Chef de service">
                {service.chef_detail
                  ? `${service.chef_detail.prenom} ${service.chef_detail.nom}`
                  : "Non assigné"}
              </Descriptions.Item>
              <Descriptions.Item label="Date de création">
                {new Date(service.created_at).toLocaleDateString()}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </TabPane>
      </Tabs>

      {/* Modal pour ajouter un membre */}
      <Modal
        title="Ajouter un membre au service"
        open={openAddMember}
        onCancel={() => setOpenAddMember(false)}
        onOk={handleAddMember}
        okText="Ajouter"
        cancelText="Annuler"
      >
        <Select
          placeholder="Sélectionner un utilisateur"
          style={{ width: "100%" }}
          value={selectedUserId}
          onChange={setSelectedUserId}
          showSearch
          optionFilterProp="children"
        >
          {allUsers
            .filter(
              (user) =>
                !members.some((m) => m.id === user.id) &&
                user.id !== service.chef?.id
            )
            .map((user) => (
              <Option key={user.id} value={user.id}>
                {user.prenom} {user.nom} ({user.email}) - {user.role}
              </Option>
            ))}
        </Select>
      </Modal>
    </div>
  );
};

export default ServiceDetail;