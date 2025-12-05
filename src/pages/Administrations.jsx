import React, { useEffect, useState, useContext } from "react";
import { Table, Button, Modal, Form, Input, Select, Space, Popconfirm, notification, Switch } from "antd";
import { getUsers, createUser, updateUser, deleteUser, partialUpdateUser } from "../services/userService";
import { AuthContext } from "../contexts/AuthContext";

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
  const { user: me } = useContext(AuthContext);

const fetch = async () => {
  setLoading(true);
  try {
    const data = await getUsers();
    // Assure que data est un tableau
    setUsers(Array.isArray(data) ? data : []);
  } catch (err) {
    notification.error({ message: "Erreur", description: "Impossible de récupérer les utilisateurs" });
    setUsers([]); // fallback
  } finally {
    setLoading(false);
  }
};


  useEffect(() => { fetch(); }, []);

  // Création
  const onAdd = async (values) => {
    try {
      await createUser(values);
      notification.success({ message: "Utilisateur créé" });
      setOpenAdd(false);
      fetch();
    } catch (err) {
      notification.error({ message: "Erreur", description: err.detail || "Impossible de créer" });
    }
  };

  // Edition
  const onEdit = async (values) => {
    try {
      await updateUser(editingUser.id, values);
      notification.success({ message: "Utilisateur modifié" });
      setOpenEdit(false);
      setEditingUser(null);
      fetch();
    } catch (err) {
      notification.error({ message: "Erreur", description: err.detail || "Impossible de modifier" });
    }
  };

  // Suppression
  const onDelete = async (id) => {
    try {
      await deleteUser(id);
      notification.success({ message: "Utilisateur supprimé" });
      fetch();
    } catch (err) {
      notification.error({ message: "Erreur", description: err.detail || "Impossible de supprimer" });
    }
  };

  // Activer / Désactiver
  const onToggleActive = async (record) => {
    try {
      await partialUpdateUser(record.id, { actif: !record.actif });
      notification.success({ message: `Utilisateur ${!record.actif ? "activé" : "désactivé"}` });
      fetch();
    } catch (err) {
      notification.error({ message: "Erreur", description: "Impossible de modifier le statut" });
    }
  };

  const columns = [
    { title: "Nom", dataIndex: "nom", key: "nom" },
    { title: "Prénom", dataIndex: "prenom", key: "prenom" },
    { title: "Email", dataIndex: "email", key: "email" },
    { title: "Rôle", dataIndex: "role_display", key: "role_display" },
    {
      title: "Actif",
      dataIndex: "actif",
      key: "actif",
      render: (actif, record) => (
        <Switch checked={actif} onChange={() => onToggleActive(record)} />
      ),
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

          <Popconfirm title="Supprimer ?" onConfirm={() => onDelete(record.id)}>
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
        <Form layout="vertical" onFinish={onAdd}>
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
        <Form layout="vertical" form={form} onFinish={onEdit}>
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
