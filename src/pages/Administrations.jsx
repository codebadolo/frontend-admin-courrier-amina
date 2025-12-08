// src/pages/Administrations.jsx
import React, { useEffect, useState } from "react";
import { Table, Button, Modal, Form, Input, Select, Space, Popconfirm, notification, Switch } from "antd";
import { getUsers, createUser, updateUser, deleteUser, partialUpdateUser } from "../api/auth";

const { Option } = Select;

const roles = [
  { value: "admin", label: "Administrateur" },
  { value: "secretaire", label: "Secrétaire" },
  { value: "chef", label: "Chef de service" },
  { value: "agent", label: "Agent" },
  { value: "direction", label: "Direction" },
  { value: "archiviste", label: "Archiviste" },
];

const Administrations = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form] = Form.useForm();

  // --- Fetch Users ---
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await getUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      notification.error({ message: "Erreur", description: err.detail || "Impossible de récupérer les utilisateurs" });
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // --- Ajouter ---
  const handleAdd = async (values) => {
    try {
      await createUser(values);
      notification.success({ message: "Utilisateur créé" });
      setOpenAdd(false);
      form.resetFields();
      fetchUsers();
    } catch (err) {
      notification.error({ message: "Erreur", description: err.detail || "Impossible de créer l'utilisateur" });
    }
  };

  // --- Modifier ---
  const handleEdit = async (values) => {
    try {
      await updateUser(editingUser.id, values);
      notification.success({ message: "Utilisateur modifié" });
      setOpenEdit(false);
      setEditingUser(null);
      fetchUsers();
    } catch (err) {
      notification.error({ message: "Erreur", description: err.detail || "Impossible de modifier l'utilisateur" });
    }
  };

  // --- Supprimer ---
  const handleDelete = async (id) => {
    try {
      await deleteUser(id);
      notification.success({ message: "Utilisateur supprimé" });
      fetchUsers();
    } catch (err) {
      notification.error({ message: "Erreur", description: err.detail || "Impossible de supprimer l'utilisateur" });
    }
  };

  // --- Activer / Désactiver ---
  const handleToggleActive = async (record) => {
    try {
      await partialUpdateUser(record.id, { actif: !record.actif });
      notification.success({ message: `Utilisateur ${!record.actif ? "activé" : "désactivé"}` });
      fetchUsers();
    } catch (err) {
      notification.error({ message: "Erreur", description: "Impossible de modifier le statut" });
    }
  };

  // --- Table Columns ---
  const columns = [
    { title: "Prénom", dataIndex: "prenom", key: "prenom" },
    { title: "Nom", dataIndex: "nom", key: "nom" },
    { title: "Email", dataIndex: "email", key: "email" },
    { title: "Rôle", dataIndex: "role_display", key: "role_display" },
    {
      title: "Actif",
      dataIndex: "actif",
      key: "actif",
      render: (actif, record) => <Switch checked={actif} onChange={() => handleToggleActive(record)} />,
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button
            onClick={() => {
              setEditingUser(record);
              form.setFieldsValue(record);
              setOpenEdit(true);
            }}
          >
            Modifier
          </Button>
          <Popconfirm title="Supprimer ?" onConfirm={() => handleDelete(record.id)}>
            <Button danger>Supprimer</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <h2>Administration - Gestion des utilisateurs</h2>

      <Button type="primary" onClick={() => setOpenAdd(true)} style={{ marginBottom: 16 }}>
        Ajouter un utilisateur
      </Button>

      <Table dataSource={users} rowKey="id" columns={columns} loading={loading} />

      {/* Modal Ajouter */}
      <Modal title="Ajouter utilisateur" open={openAdd} onCancel={() => setOpenAdd(false)} footer={null}>
        <Form layout="vertical" onFinish={handleAdd} form={form}>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: "email" }]}>
            <Input />
          </Form.Item>
          <Form.Item name="prenom" label="Prénom" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="nom" label="Nom" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="role" label="Rôle" rules={[{ required: true }]}>
            <Select>
              {roles.map((r) => (
                <Option key={r.value} value={r.value}>
                  {r.label}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="password" label="Mot de passe" rules={[{ required: true }]}>
            <Input.Password />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button onClick={() => setOpenAdd(false)}>Annuler</Button>
              <Button type="primary" htmlType="submit">
                Créer
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal Modifier */}
      <Modal title="Modifier utilisateur" open={openEdit} onCancel={() => setOpenEdit(false)} footer={null}>
        <Form layout="vertical" form={form} onFinish={handleEdit}>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: "email" }]}>
            <Input />
          </Form.Item>
          <Form.Item name="prenom" label="Prénom">
            <Input />
          </Form.Item>
          <Form.Item name="nom" label="Nom">
            <Input />
          </Form.Item>
          <Form.Item name="role" label="Rôle">
            <Select>
              {roles.map((r) => (
                <Option key={r.value} value={r.value}>
                  {r.label}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button onClick={() => setOpenEdit(false)}>Annuler</Button>
              <Button type="primary" htmlType="submit">
                Enregistrer
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Administrations;
