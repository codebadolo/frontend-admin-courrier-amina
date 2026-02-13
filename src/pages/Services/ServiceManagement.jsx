// src/pages/Services/ServiceManagement.jsx
import React, { useState, useEffect } from "react";
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Tag,
  Space,
  notification,
  Row,
  Col,
  Statistic,
  Avatar,
  List,
  Popconfirm,
  Tabs,
  Descriptions,
  Badge,
  Tooltip,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  TeamOutlined,
  UserAddOutlined,
  UserDeleteOutlined,
  BarChartOutlined,
  EyeOutlined,
  MailOutlined,
  PhoneOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import {
  getServices,
  createService,
  updateService,
  deleteService,
  getServiceMembers,
  addServiceMember,
  removeServiceMember,
  getServiceStats,
} from "../../api/service";
import { getUsers } from "../../api/users";

const { Option } = Select;
const { TextArea } = Input;
const { TabPane } = Tabs;

const ServiceManagement = () => {
  const [services, setServices] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [manageModalVisible, setManageModalVisible] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [serviceMembers, setServiceMembers] = useState([]);
  const [serviceStats, setServiceStats] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchServices();
    fetchUsers();
  }, []);

  const fetchServices = async () => {
    setLoading(true);
    try {
      const data = await getServices();
      setServices(data);
    } catch (error) {
      notification.error({
        message: "Erreur",
        description: "Impossible de charger les services",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (error) {
      console.error("Erreur chargement utilisateurs:", error);
    }
  };

  const fetchServiceDetails = async (serviceId) => {
    try {
      const [members, stats] = await Promise.all([
        getServiceMembers(serviceId),
        getServiceStats(serviceId),
      ]);
      setServiceMembers(members);
      setServiceStats(stats);
    } catch (error) {
      notification.error({
        message: "Erreur",
        description: "Impossible de charger les détails du service",
      });
    }
  };

  const handleCreateService = async (values) => {
    try {
      await createService(values);
      notification.success({
        message: "Succès",
        description: "Service créé avec succès",
      });
      setModalVisible(false);
      form.resetFields();
      fetchServices();
    } catch (error) {
      notification.error({
        message: "Erreur",
        description: "Impossible de créer le service",
      });
    }
  };

  const handleUpdateService = async (values) => {
    try {
      await updateService(selectedService.id, values);
      notification.success({
        message: "Succès",
        description: "Service modifié avec succès",
      });
      setModalVisible(false);
      setSelectedService(null);
      fetchServices();
    } catch (error) {
      notification.error({
        message: "Erreur",
        description: "Impossible de modifier le service",
      });
    }
  };

  const handleDeleteService = async (id) => {
    try {
      await deleteService(id);
      notification.success({
        message: "Succès",
        description: "Service supprimé avec succès",
      });
      fetchServices();
    } catch (error) {
      notification.error({
        message: "Erreur",
        description: "Impossible de supprimer le service",
      });
    }
  };

  const handleAddMember = async (userId) => {
    try {
      await addServiceMember(selectedService.id, userId);
      notification.success({
        message: "Succès",
        description: "Utilisateur ajouté au service",
      });
      fetchServiceDetails(selectedService.id);
    } catch (error) {
      notification.error({
        message: "Erreur",
        description: "Impossible d'ajouter l'utilisateur",
      });
    }
  };

  const handleRemoveMember = async (userId) => {
    try {
      await removeServiceMember(selectedService.id, userId);
      notification.success({
        message: "Succès",
        description: "Utilisateur retiré du service",
      });
      fetchServiceDetails(selectedService.id);
    } catch (error) {
      notification.error({
        message: "Erreur",
        description: "Impossible de retirer l'utilisateur",
      });
    }
  };

  const openManageModal = (service) => {
    setSelectedService(service);
    setManageModalVisible(true);
    fetchServiceDetails(service.id);
  };

  const columns = [
    {
      title: "Nom du Service",
      dataIndex: "nom",
      key: "nom",
      render: (text) => <strong>{text}</strong>,
    },
    {
      title: "Chef de Service",
      key: "chef",
      render: (_, record) =>
        record.chef_detail ? (
          <Space>
            <Avatar
              size="small"
              style={{
                backgroundColor: "#1890ff",
              }}
            >
              {record.chef_detail.prenom?.[0]}
              {record.chef_detail.nom?.[0]}
            </Avatar>
            <span>
              {record.chef_detail.prenom} {record.chef_detail.nom}
            </span>
          </Space>
        ) : (
          <Tag color="default">Non assigné</Tag>
        ),
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      render: (text) =>
        text || <span style={{ color: "#999" }}>Aucune description</span>,
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Tooltip title="Gérer le service">
            <Button
              icon={<TeamOutlined />}
              onClick={() => openManageModal(record)}
            />
          </Tooltip>
          <Tooltip title="Modifier">
            <Button
              icon={<EditOutlined />}
              onClick={() => {
                setSelectedService(record);
                form.setFieldsValue({
                  nom: record.nom,
                  description: record.description,
                  chef: record.chef,
                });
                setModalVisible(true);
              }}
            />
          </Tooltip>
          <Tooltip title="Supprimer">
            <Popconfirm
              title="Supprimer ce service?"
              onConfirm={() => handleDeleteService(record.id)}
              okText="Oui"
              cancelText="Non"
            >
              <Button icon={<DeleteOutlined />} danger />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: "24px" }}>
      <Card
        title={
          <Space>
            <SettingOutlined />
            <span>Gestion des Services</span>
          </Space>
        }
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              form.resetFields();
              setSelectedService(null);
              setModalVisible(true);
            }}
          >
            Nouveau Service
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={services}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* Modal création/édition */}
      <Modal
        title={selectedService ? "Modifier le Service" : "Nouveau Service"}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={
            selectedService ? handleUpdateService : handleCreateService
          }
        >
          <Form.Item
            name="nom"
            label="Nom du Service"
            rules={[{ required: true, message: "Le nom est obligatoire" }]}
          >
            <Input placeholder="Ex: Service Informatique" />
          </Form.Item>

          <Form.Item name="description" label="Description">
            <TextArea rows={4} placeholder="Description du service..." />
          </Form.Item>

          <Form.Item name="chef" label="Chef de Service">
            <Select placeholder="Sélectionner un chef de service" allowClear>
              {users
                .filter((user) => user.actif)
                .map((user) => (
                  <Option key={user.id} value={user.id}>
                    {user.prenom} {user.nom} ({user.email})
                  </Option>
                ))}
            </Select>
          </Form.Item>

          <Form.Item style={{ textAlign: "right" }}>
            <Space>
              <Button onClick={() => setModalVisible(false)}>Annuler</Button>
              <Button type="primary" htmlType="submit">
                {selectedService ? "Modifier" : "Créer"}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal de gestion du service */}
      <Modal
        title={
          <Space>
            <TeamOutlined />
            <span>
              Gestion du Service: {selectedService?.nom || "Chargement..."}
            </span>
          </Space>
        }
        open={manageModalVisible}
        onCancel={() => setManageModalVisible(false)}
        width={800}
        footer={[
          <Button key="close" onClick={() => setManageModalVisible(false)}>
            Fermer
          </Button>,
        ]}
      >
        {selectedService && (
          <Tabs defaultActiveKey="1">
            <TabPane
              tab={
                <span>
                  <EyeOutlined />
                  Informations
                </span>
              }
              key="1"
            >
              <Card>
                <Descriptions column={2}>
                  <Descriptions.Item label="Nom">
                    <strong>{selectedService.nom}</strong>
                  </Descriptions.Item>
                  <Descriptions.Item label="Chef">
                    {selectedService.chef_detail ? (
                      <Space>
                        <Avatar
                          size="small"
                          style={{ backgroundColor: "#1890ff" }}
                        >
                          {selectedService.chef_detail.prenom?.[0]}
                          {selectedService.chef_detail.nom?.[0]}
                        </Avatar>
                        <span>
                          {selectedService.chef_detail.prenom}{" "}
                          {selectedService.chef_detail.nom}
                        </span>
                      </Space>
                    ) : (
                      <Tag color="warning">Non assigné</Tag>
                    )}
                  </Descriptions.Item>
                  <Descriptions.Item label="Description" span={2}>
                    {selectedService.description || "Aucune description"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Date de création">
                    {selectedService.created_at
                      ? new Date(selectedService.created_at).toLocaleDateString()
                      : "N/A"}
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            </TabPane>

            <TabPane
              tab={
                <span>
                  <TeamOutlined />
                  Membres{" "}
                  <Badge
                    count={serviceMembers.length}
                    style={{ backgroundColor: "#1890ff" }}
                  />
                </span>
              }
              key="2"
            >
              <Card>
                <div style={{ marginBottom: "16px" }}>
                  <h4>Ajouter un membre</h4>
                  <Select
                    style={{ width: "100%" }}
                    placeholder="Sélectionner un utilisateur à ajouter"
                    onChange={handleAddMember}
                  >
                    {users
                      .filter(
                        (user) =>
                          user.actif &&
                          user.id !== selectedService.chef &&
                          !serviceMembers.some((m) => m.id === user.id)
                      )
                      .map((user) => (
                        <Option key={user.id} value={user.id}>
                          {user.prenom} {user.nom} ({user.email})
                        </Option>
                      ))}
                  </Select>
                </div>

                <List
                  header={<h4>Membres actuels</h4>}
                  dataSource={serviceMembers}
                  renderItem={(member) => (
                    <List.Item
                      actions={[
                        <Tooltip title="Retirer du service">
                          <Button
                            icon={<UserDeleteOutlined />}
                            size="small"
                            danger
                            onClick={() => handleRemoveMember(member.id)}
                          />
                        </Tooltip>,
                      ]}
                    >
                      <List.Item.Meta
                        avatar={
                          <Avatar
                            style={{
                              backgroundColor:
                                member.role === "chef"
                                  ? "#fa8c16"
                                  : member.role === "agent_service"
                                  ? "#52c41a"
                                  : "#1890ff",
                            }}
                          >
                            {member.prenom?.[0]}
                            {member.nom?.[0]}
                          </Avatar>
                        }
                        title={`${member.prenom} ${member.nom}`}
                        description={
                          <Space direction="vertical" size={0}>
                            <span>
                              <MailOutlined /> {member.email}
                            </span>
                            <Tag
                              color={
                                member.role === "agent_service"
                                  ? "green"
                                  : "blue"
                              }
                            >
                              {member.role_display || member.role}
                            </Tag>
                          </Space>
                        }
                      />
                    </List.Item>
                  )}
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
              key="3"
            >
              <Card>
                {serviceStats ? (
                  <Row gutter={16}>
                    <Col span={8}>
                      <Statistic
                        title="Nombre de Membres"
                        value={serviceStats.nombre_membres || 0}
                        prefix={<TeamOutlined />}
                      />
                    </Col>
                    <Col span={8}>
                      <Statistic
                        title="Courriers Actifs"
                        value={serviceStats.nombre_courriers_actifs || 0}
                        prefix={<BarChartOutlined />}
                      />
                    </Col>
                    <Col span={8}>
                      <Statistic
                        title="Courriers en Retard"
                        value={serviceStats.nombre_courriers_en_retard || 0}
                        valueStyle={{ color: "#cf1322" }}
                      />
                    </Col>
                  </Row>
                ) : (
                  <p>Chargement des statistiques...</p>
                )}
              </Card>
            </TabPane>
          </Tabs>
        )}
      </Modal>
    </div>
  );
};

export default ServiceManagement;