// src/pages/Administrations.jsx
import React, { useEffect, useState } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Space,
  Popconfirm,
  notification,
  Card,
  Row,
  Col,
  Tag,
  Breadcrumb,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  UserOutlined,
} from "@ant-design/icons";

import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  partialUpdateUser,
} from "../api/auth";
import { getServices } from "../api/service"; // API pour récupérer les services

const { Option } = Select;

const roles = [
  { value: "admin", label: "Administrateur" },
  { value: "secretaire", label: "Secrétaire" },
  { value: "chef", label: "Chef de service" },
  { value: "collaborateur", label: "Collaborateur" },
  { value: "direction", label: "Direction" },
  { value: "archiviste", label: "Archiviste" },
  { value: "agent_service", label: "Agent de service" },
];

const Administrations = () => {
  const [users, setUsers] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form] = Form.useForm();

  const [filterRole, setFilterRole] = useState(null);
  const [filterStatus, setFilterStatus] = useState(null);
  const [filterService, setFilterService] = useState(null);

  // ------------------ Fetch users ------------------
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await getUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      notification.error({
        message: "Erreur",
        description: err.detail || "Impossible de récupérer les utilisateurs",
      });
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  // ------------------ Fetch services ------------------
  const fetchServices = async () => {
    try {
      const data = await getServices();
      setServices(Array.isArray(data) ? data : []);
    } catch (err) {
      notification.error({
        message: "Erreur",
        description: "Impossible de récupérer les services",
      });
      setServices([]);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchServices();
  }, []);

  // ------------------ Filters ------------------
  const filteredUsers = users.filter((user) => {
    const matchRole = filterRole ? user.role === filterRole : true;
    const matchStatus = filterStatus !== null ? user.actif === filterStatus : true;
    const matchService = filterService ? user.service === filterService : true;
    return matchRole && matchStatus && matchService;
  });

  const resetFilters = () => {
    setFilterRole(null);
    setFilterStatus(null);
    setFilterService(null);
  };

  // ------------------ Add ------------------
  const handleAdd = async (values) => {
    try {
      await createUser(values);
      notification.success({ message: "Utilisateur créé" });
      setOpenAdd(false);
      form.resetFields();
      fetchUsers();
    } catch (err) {
      notification.error({
        message: "Erreur",
        description: err.detail || "Impossible de créer l'utilisateur",
      });
    }
  };

  // ------------------ Edit ------------------
const handleEdit = async (values) => {
  try {
    // Assurez-vous que values.service contient l'id du service
    await updateUser(editingUser.id, {
      email: values.email,
      prenom: values.prenom,
      nom: values.nom,
      role: values.role,
      service: values.service || null,
      actif: values.actif,
    });
    notification.success({ message: "Utilisateur modifié" });
    setOpenEdit(false);
    setEditingUser(null);
    fetchUsers();
  } catch (err) {
    console.error(err.response?.data); // pour debug
    notification.error({
      message: "Erreur",
      description: err.response?.data.detail || "Impossible de modifier l'utilisateur",
    });
  }
};

  // ------------------ Delete ------------------
  const handleDelete = async (id) => {
    try {
      await deleteUser(id);
      notification.success({ message: "Utilisateur supprimé" });
      fetchUsers();
    } catch (err) {
      notification.error({
        message: "Erreur",
        description: err.detail || "Impossible de supprimer l'utilisateur",
      });
    }
  };

  // ------------------ Toggle status ------------------
  const toggleActive = async (record) => {
    try {
      await partialUpdateUser(record.id, { actif: !record.actif });
      notification.success({
        message: `Utilisateur ${!record.actif ? "activé" : "désactivé"}`,
      });
      fetchUsers();
    } catch (err) {
      notification.error({
        message: "Erreur",
        description: "Impossible de modifier le statut",
      });
    }
  };

  // ------------------ Table columns ------------------
  const columns = [
    {
      title: "Utilisateur",
      key: "user",
      render: (_, record) => (
        <Space>
          <UserOutlined style={{ fontSize: 18 }} />
          <div>
            <strong>{record.prenom} {record.nom}</strong>
            <div style={{ fontSize: 12, color: "#777" }}>{record.email}</div>
          </div>
        </Space>
      ),
    },
    { title: "Rôle", dataIndex: "role_display", key: "role_display" },
    { title: "Service", dataIndex: "service_name", key: "service_name", render: s => s || <i style={{color:"#aaa"}}>Non défini</i> },
    { title: "Téléphone", dataIndex: "telephone", key: "telephone", render: t => t || <span style={{color:"#aaa"}}>—</span> },
    {
      title: "Actif",
      dataIndex: "actif",
      key: "actif",
      render: (actif, record) =>
        actif ? (
          <Tag color="green" icon={<CheckCircleOutlined />} onClick={() => toggleActive(record)} style={{ cursor: "pointer" }}>
            Actif
          </Tag>
        ) : (
          <Tag color="red" icon={<CloseCircleOutlined />} onClick={() => toggleActive(record)} style={{ cursor: "pointer" }}>
            Inactif
          </Tag>
        ),
    },
    { title: "Dernier login", dataIndex: "last_login", key: "last_login", render: d => d ? new Date(d).toLocaleString() : "Jamais" },
    { title: "Créé le", dataIndex: "date_joined", key: "date_joined", render: d => d ? new Date(d).toLocaleDateString() : "" },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} size="small" onClick={() => { setEditingUser(record); form.setFieldsValue(record); setOpenEdit(true); }} />
          <Popconfirm title="Supprimer cet utilisateur ?" onConfirm={() => handleDelete(record.id)}>
            <Button icon={<DeleteOutlined />} danger size="small" />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      {/* Breadcrumbs */}
      <Breadcrumb style={{ marginBottom: 16 }}>
        <Breadcrumb.Item>Accueil</Breadcrumb.Item>
        <Breadcrumb.Item>Administration</Breadcrumb.Item>
      </Breadcrumb>

      <h2 style={{ marginBottom: 16 }}>Gestion des utilisateurs</h2>

      {/* Filters */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={8}>
          <Col xs={24} sm={6}>
            <Select size="small" value={filterRole} onChange={setFilterRole} allowClear placeholder="Rôle" style={{ width: "100%" }}>
              {roles.map(r => <Option key={r.value} value={r.value}>{r.label}</Option>)}
            </Select>
          </Col>
          <Col xs={24} sm={6}>
            <Select size="small" value={filterService} onChange={setFilterService} allowClear placeholder="Service" style={{ width: "100%" }}>
              {services.map(s => <Option key={s.id} value={s.id}>{s.nom}</Option>)}
            </Select>
          </Col>
          <Col xs={24} sm={6}>
            <Select size="small" value={filterStatus} onChange={setFilterStatus} allowClear placeholder="Statut" style={{ width: "100%" }}>
              <Option value={true}>Actif</Option>
              <Option value={false}>Inactif</Option>
            </Select>
          </Col>
          <Col xs={24} sm={6} style={{ display: "flex", alignItems: "center" }}>
            <Button size="small" onClick={resetFilters}>Réinitialiser</Button>
          </Col>
        </Row>
      </Card>

      {/* Add user button */}
      <Button type="primary" icon={<PlusOutlined />} size="small" onClick={() => setOpenAdd(true)} style={{ marginBottom: 16 }}>
        Ajouter
      </Button>

      {/* Users table */}
      <Table dataSource={filteredUsers} rowKey="id" size="small" columns={columns} loading={loading} bordered />

      {/* Modal Add */}
      <Modal title="Ajouter utilisateur" open={openAdd} onCancel={() => setOpenAdd(false)} footer={null}>
        <Form layout="vertical" form={form} onFinish={handleAdd}>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: "email" }]}><Input size="small" /></Form.Item>
          <Form.Item name="prenom" label="Prénom" rules={[{ required: true }]}><Input size="small" /></Form.Item>
          <Form.Item name="nom" label="Nom" rules={[{ required: true }]}><Input size="small" /></Form.Item>
          <Form.Item name="role" label="Rôle" rules={[{ required: true }]}>
            <Select size="small">{roles.map(r => <Option key={r.value} value={r.value}>{r.label}</Option>)}</Select>
          </Form.Item>
          <Form.Item name="service" label="Service">
            <Select size="small" allowClear placeholder="Sélectionner un service">
              {services.map(s => <Option key={s.id} value={s.id}>{s.nom}</Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="password" label="Mot de passe" rules={[{ required: true }]}><Input.Password size="small" /></Form.Item>
          <Form.Item>
            <Space>
              <Button size="small" onClick={() => setOpenAdd(false)}>Annuler</Button>
              <Button type="primary" size="small" htmlType="submit">Créer</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal Edit */}
      <Modal title="Modifier utilisateur" open={openEdit} onCancel={() => setOpenEdit(false)} footer={null}>
        <Form layout="vertical" form={form} onFinish={handleEdit}>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: "email" }]}><Input size="small" /></Form.Item>
          <Form.Item name="prenom" label="Prénom"><Input size="small" /></Form.Item>
          <Form.Item name="nom" label="Nom"><Input size="small" /></Form.Item>
          <Form.Item name="telephone" label="Téléphone"><Input size="small" /></Form.Item>
          <Form.Item name="role" label="Rôle">
            <Select size="small">{roles.map(r => <Option key={r.value} value={r.value}>{r.label}</Option>)}</Select>
          </Form.Item>
          <Form.Item name="service" label="Service">
            <Select size="small" allowClear placeholder="Sélectionner un service">
              {services.map(s => <Option key={s.id} value={s.id}>{s.nom}</Option>)}
            </Select>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button size="small" onClick={() => setOpenEdit(false)}>Annuler</Button>
              <Button type="primary" size="small" htmlType="submit">Enregistrer</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Administrations;
