// src/components/EnvoyerInterneModal.jsx (version améliorée)
import React, { useState, useEffect } from 'react';
import { Modal, Form, Select, Input, Button, Space, Tag, Table, message, Avatar, Input as SearchInput } from 'antd';
import { SendOutlined, UserOutlined, SwapOutlined, SearchOutlined } from '@ant-design/icons';
import { getDestinatairesDisponibles, envoyerCourrierA } from '../../services/courrierService';

const { Option } = Select;
const { TextArea } = Input;

const EnvoyerInterneModal = ({ visible, onCancel, courrierId, courrierInfo, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [destinataires, setDestinataires] = useState([]);
  const [filteredDestinataires, setFilteredDestinataires] = useState([]);
  const [selectedDestinataire, setSelectedDestinataire] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  useEffect(() => {
    if (visible && courrierId) {
      chargerDestinataires();
    }
  }, [visible, courrierId]);

  useEffect(() => {
    // Filtrer les destinataires
    let filtered = [...destinataires];
    
    if (searchText) {
      filtered = filtered.filter(d => 
        d.full_name?.toLowerCase().includes(searchText.toLowerCase()) ||
        d.email?.toLowerCase().includes(searchText.toLowerCase())
      );
    }
    
    if (roleFilter) {
      filtered = filtered.filter(d => d.role === roleFilter);
    }
    
    setFilteredDestinataires(filtered);
  }, [searchText, roleFilter, destinataires]);

  const chargerDestinataires = async () => {
    try {
      setLoading(true);
      const data = await getDestinatairesDisponibles(courrierId);
      setDestinataires(data.destinataires || []);
      setFilteredDestinataires(data.destinataires || []);
    } catch (error) {
      message.error("Erreur lors du chargement des destinataires");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      
      const result = await envoyerCourrierA(
        courrierId, 
        values.destinataire_id, 
        values.commentaire || ''
      );
      
      message.success(result.message);
      form.resetFields();
      onSuccess?.(result.courrier); // Passer le courrier mis à jour
      onCancel();
    } catch (error) {
      message.error(error.response?.data?.error || "Erreur lors de la transmission");
    } finally {
      setLoading(false);
    }
  };

  const getRoleColor = (role) => {
    const colors = {
      admin: 'red',
      chef: 'orange',
      direction: 'purple',
      collaborateur: 'blue',
      agent_courrier: 'green',
      agent_service: 'cyan',
      archiviste: 'pink'
    };
    return colors[role] || 'default';
  };

  const getRoleLabel = (role) => {
    const labels = {
      admin: 'Admin',
      chef: 'Chef de service',
      direction: 'Direction',
      collaborateur: 'Collaborateur',
      agent_courrier: 'Agent courrier',
      agent_service: 'Agent service',
      archiviste: 'Archiviste'
    };
    return labels[role] || role;
  };

  // Obtenir les rôles uniques pour le filtre
  const uniqueRoles = [...new Set(destinataires.map(d => d.role))];

  const columns = [
    {
      title: 'Utilisateur',
      key: 'user',
      render: (_, record) => (
        <Space>
          <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#1890ff' }} />
          <Space direction="vertical" size={0}>
            <span style={{ fontWeight: 500 }}>{record.prenom} {record.nom}</span>
            <small style={{ color: '#666' }}>{record.email}</small>
          </Space>
        </Space>
      )
    },
    {
      title: 'Rôle',
      dataIndex: 'role',
      width: 150,
      render: (role) => (
        <Tag color={getRoleColor(role)}>
          {getRoleLabel(role)}
        </Tag>
      )
    },
    {
      title: 'Service',
      dataIndex: 'service_nom',
      width: 150,
      render: (service) => service || '-'
    }
  ];

  return (
    <Modal
      title={
        <Space>
          <SwapOutlined style={{ color: '#1890ff' }} />
          <span>Transmettre le courrier à un utilisateur</span>
        </Space>
      }
      open={visible}
      onCancel={onCancel}
      width={800}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Annuler
        </Button>,
        <Button 
          key="submit" 
          type="primary" 
          icon={<SendOutlined />}
          loading={loading} 
          onClick={handleSubmit}
          disabled={!selectedDestinataire}
        >
          Transmettre
        </Button>
      ]}
    >
      {courrierInfo && (
        <div style={{ marginBottom: 20, padding: 16, background: '#f5f5f5', borderRadius: 4 }}>
          <h4>Courrier: {courrierInfo.reference}</h4>
          <p><strong>Objet:</strong> {courrierInfo.objet}</p>
          {courrierInfo.responsable_actuel && (
            <Tag color="blue">Actuellement avec: {courrierInfo.responsable_actuel}</Tag>
          )}
        </div>
      )}

      {/* Filtres */}
      <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
        <SearchInput
          placeholder="Rechercher par nom ou email"
          prefix={<SearchOutlined />}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 300 }}
          allowClear
        />
        <Select
          placeholder="Filtrer par rôle"
          style={{ width: 200 }}
          onChange={setRoleFilter}
          allowClear
        >
          {uniqueRoles.map(role => (
            <Option key={role} value={role}>{getRoleLabel(role)}</Option>
          ))}
        </Select>
      </div>

      <Table
        dataSource={filteredDestinataires}
        columns={columns}
        rowKey="id"
        size="middle"
        pagination={{ pageSize: 5 }}
        loading={loading}
        rowSelection={{
          type: 'radio',
          onChange: (selectedRowKeys, selectedRows) => {
            form.setFieldsValue({ destinataire_id: selectedRowKeys[0] });
            setSelectedDestinataire(selectedRows[0]);
          }
        }}
      />

      <Form
        form={form}
        layout="vertical"
        style={{ marginTop: 20 }}
      >
        <Form.Item
          name="destinataire_id"
          hidden
        />

        <Form.Item
          name="commentaire"
          label="Commentaire (optionnel)"
        >
          <TextArea 
            rows={3} 
            placeholder="Ajoutez un commentaire pour le destinataire..." 
          />
        </Form.Item>
      </Form>

      {selectedDestinataire && (
        <div style={{ marginTop: 16, padding: 12, background: '#e6f7ff', borderRadius: 4 }}>
          <Space>
            <UserOutlined style={{ color: '#1890ff' }} />
            <span>Le courrier sera transmis à <strong>{selectedDestinataire.prenom} {selectedDestinataire.nom}</strong></span>
            <Tag color={getRoleColor(selectedDestinataire.role)}>
              {getRoleLabel(selectedDestinataire.role)}
            </Tag>
          </Space>
        </div>
      )}
    </Modal>
  );
};

export default EnvoyerInterneModal;