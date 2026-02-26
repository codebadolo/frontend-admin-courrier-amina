// src/pages/chefServices/AffectationMembreModal.jsx
import React, { useState, useEffect } from 'react';
import { Modal, Form, Select, Input, Button, Space, Tag, Table, message, Tabs } from 'antd';
import { UserOutlined, TeamOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { getMembresService, affecterMembre } from '../../services/courrierService';  // ← CHEMIN CORRIGÉ

const { Option } = Select;
const { TextArea } = Input;
const { TabPane } = Tabs;

const AffectationMembreModal = ({ visible, onCancel, courrierId, courrierInfo, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [collaborateurs, setCollaborateurs] = useState([]);
  const [agents, setAgents] = useState([]);
  const [selectedTab, setSelectedTab] = useState('collaborateurs');

  useEffect(() => {
    if (visible && courrierId) {
      chargerMembres();
    }
  }, [visible, courrierId]);

  const chargerMembres = async () => {
    try {
      setLoading(true);
      const data = await getMembresService(courrierId);
      setCollaborateurs(data.collaborateurs || []);
      setAgents(data.agents || []);
    } catch (error) {
      message.error("Erreur lors du chargement des membres");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      
      const result = await affecterMembre(courrierId, values.membre_id, {
        commentaire: values.commentaire,
        instructions: values.instructions,
        delai_jours: values.delai_jours
      });
      
      message.success(result.message);
      form.resetFields();
      onSuccess?.();
      onCancel();
    } catch (error) {
      message.error(error.response?.data?.error || "Erreur lors de l'affectation");
    } finally {
      setLoading(false);
    }
  };

  const renderMembreTable = (membres, role) => (
    <Table
      dataSource={membres}
      rowKey="id"
      size="small"
      pagination={false}
      loading={loading}
      rowSelection={{
        type: 'radio',
        onChange: (selectedRowKeys) => {
          form.setFieldsValue({ membre_id: selectedRowKeys[0] });
        }
      }}
      columns={[
        {
          title: 'Nom',
          key: 'nom',
          render: (_, record) => (
            <Space>
              <UserOutlined />
              <span>{record.prenom} {record.nom}</span>
            </Space>
          )
        },
        {
          title: 'Email',
          dataIndex: 'email',
          key: 'email',
        },
        {
          title: 'Rôle',
          key: 'role',
          render: () => (
            <Tag color={role === 'collaborateur' ? 'blue' : 'green'}>
              {role === 'collaborateur' ? 'Collaborateur' : 'Agent service'}
            </Tag>
          )
        }
      ]}
    />
  );

  return (
    <Modal
      title="Affecter le courrier à un membre du service"
      open={visible}
      onCancel={onCancel}
      width={700}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Annuler
        </Button>,
        <Button 
          key="submit" 
          type="primary" 
          loading={loading} 
          onClick={handleSubmit}
        >
          Affecter
        </Button>
      ]}
    >
      {courrierInfo && (
        <div style={{ marginBottom: 20, padding: 16, background: '#f5f5f5', borderRadius: 4 }}>
          <h4>Courrier: {courrierInfo.reference}</h4>
          <p><strong>Objet:</strong> {courrierInfo.objet}</p>
          <p>
            <Tag color={courrierInfo.priorite === 'urgente' ? 'red' : 'blue'}>
              Priorité: {courrierInfo.priorite}
            </Tag>
            {courrierInfo.date_echeance && (
              <Tag icon={<ClockCircleOutlined />}>
                Échéance: {new Date(courrierInfo.date_echeance).toLocaleDateString()}
              </Tag>
            )}
          </p>
        </div>
      )}

      <Tabs activeKey={selectedTab} onChange={setSelectedTab}>
        <TabPane 
          tab={<span><TeamOutlined /> Collaborateurs ({collaborateurs.length})</span>} 
          key="collaborateurs"
        >
          {renderMembreTable(collaborateurs, 'collaborateur')}
        </TabPane>
        <TabPane 
          tab={<span><UserOutlined /> Agents ({agents.length})</span>} 
          key="agents"
        >
          {renderMembreTable(agents, 'agent_service')}
        </TabPane>
      </Tabs>

      <Form
        form={form}
        layout="vertical"
        style={{ marginTop: 20 }}
      >
        <Form.Item
          name="membre_id"
          hidden
        />

        <Form.Item
          name="delai_jours"
          label="Délai de traitement (jours)"
          initialValue={5}
          rules={[{ required: true }]}
        >
          <Select>
            <Option value={3}>3 jours</Option>
            <Option value={5}>5 jours</Option>
            <Option value={7}>7 jours</Option>
            <Option value={10}>10 jours</Option>
            <Option value={15}>15 jours</Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="instructions"
          label="Instructions spécifiques"
        >
          <TextArea rows={3} placeholder="Instructions pour le traitement..." />
        </Form.Item>

        <Form.Item
          name="commentaire"
          label="Commentaire"
        >
          <Input placeholder="Commentaire (optionnel)" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AffectationMembreModal;