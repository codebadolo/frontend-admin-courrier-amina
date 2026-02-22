// components/ChefServiceDashboard.jsx
import React, { useEffect, useState } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Modal,
  Select,
  Tag,
  Badge,
  Tooltip,
  message,
  Statistic,
  Row,
  Col,
  Descriptions,
  Timeline,
  Tabs,
  Input,
  DatePicker,
  Avatar,
  List,
  Typography,
  Progress,
  Form,
} from 'antd';
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  TeamOutlined,
  FileDoneOutlined,
  CarryOutOutlined,
  UserSwitchOutlined,
  CommentOutlined,
  SendOutlined,
} from '@ant-design/icons';
import axios from 'axios';
import moment from 'moment';

const { Option } = Select;
const { TabPane } = Tabs;
const { TextArea } = Input;
const { Text } = Typography;

const ChefServiceDashboard = () => {
  const [loading, setLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    a_assigner: [],
    assignes: [],
    agents_stats: [],
    total_a_assigner: 0,
    total_assignes: 0,
  });

  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [selectedCourrier, setSelectedCourrier] = useState(null);
  const [agentsDisponibles, setAgentsDisponibles] = useState([]);
  const [assignForm, setAssignForm] = useState({
    agent_id: null,
    priorite_assignation: 'normale',
    commentaire: '',
    instructions: '',
    delai_traitement: 5,
  });

  // Charger le tableau de bord
  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        'http://localhost:8000/api/courriers/courriers/tableau_bord_assignation/'
      );
      setDashboardData(response.data);
    } catch (error) {
      message.error('Erreur lors du chargement du tableau de bord');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  // Ouvrir la modale d'assignation
  const showAssignModal = async (courrier) => {
    setSelectedCourrier(courrier);
    setAssignForm({
      agent_id: null,
      priorite_assignation: 'normale',
      commentaire: '',
      instructions: '',
      delai_traitement: 5,
    });

    try {
      const response = await axios.get(
        `http://localhost:8000/api/courriers/courriers/${courrier.id}/agents_disponibles/`
      );
      setAgentsDisponibles(response.data.agents || []);
      setAssignModalVisible(true);
    } catch (error) {
      message.error('Erreur lors du chargement des agents');
    }
  };

  // Assigner le courrier
  const handleAssign = async () => {
    if (!assignForm.agent_id) {
      message.warning('Veuillez sélectionner un agent');
      return;
    }

    try {
      setLoading(true);
      await axios.post(
        `http://localhost:8000/api/courriers/courriers/${selectedCourrier.id}/assignation_multi_criteres/`,
        assignForm
      );
      message.success('Courrier assigné avec succès');
      setAssignModalVisible(false);
      fetchDashboard();
    } catch (error) {
      message.error("Erreur lors de l'assignation");
    } finally {
      setLoading(false);
    }
  };

  // Obtenir la couleur de priorité
  const getPriorityColor = (priority) => {
    const colors = {
      urgente: 'red',
      haute: 'orange',
      normale: 'blue',
      basse: 'green',
    };
    return colors[priority] || 'default';
  };

  // Obtenir le tag de priorité
  const getPriorityTag = (priority) => {
    const labels = {
      urgente: 'URGENT',
      haute: 'Haute',
      normale: 'Normale',
      basse: 'Basse',
    };
    return (
      <Tag color={getPriorityColor(priority)}>
        {labels[priority] || priority}
      </Tag>
    );
  };

  // Colonnes pour les courriers à assigner
  const columnsAAssigner = [
    {
      title: 'Référence',
      dataIndex: 'reference',
      key: 'reference',
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: 'Objet',
      dataIndex: 'objet',
      key: 'objet',
      ellipsis: true,
    },
    {
      title: 'Expéditeur',
      dataIndex: 'expediteur_nom',
      key: 'expediteur_nom',
      render: (text) => text || 'N/A',
    },
    {
      title: 'Priorité',
      dataIndex: 'priorite',
      key: 'priorite',
      render: (priority) => getPriorityTag(priority),
    },
    {
      title: 'Date réception',
      dataIndex: 'date_reception',
      key: 'date_reception',
      render: (date) => moment(date).format('DD/MM/YYYY'),
    },
    {
      title: 'Date échéance',
      dataIndex: 'date_echeance',
      key: 'date_echeance',
      render: (date) => {
        if (!date) return 'N/A';
        const isLate = moment(date).isBefore(moment());
        return (
          <Badge
            status={isLate ? 'error' : 'processing'}
            text={moment(date).format('DD/MM/YYYY')}
          />
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button
          type="primary"
          icon={<UserSwitchOutlined />}
          onClick={() => showAssignModal(record)}
        >
          Assigner
        </Button>
      ),
    },
  ];

  // Colonnes pour les courriers assignés
  const columnsAssignes = [
    {
      title: 'Référence',
      dataIndex: 'reference',
      key: 'reference',
    },
    {
      title: 'Objet',
      dataIndex: 'objet',
      key: 'objet',
      ellipsis: true,
    },
    {
      title: 'Agent',
      key: 'agent',
      render: (_, record) => (
        <Space>
          <Avatar icon={<UserOutlined />} size="small" />
          <span>{record.responsable_actuel?.prenom} {record.responsable_actuel?.nom}</span>
        </Space>
      ),
    },
    {
      title: 'Priorité',
      dataIndex: 'priorite',
      key: 'priorite',
      render: (priority) => getPriorityTag(priority),
    },
    {
      title: 'Statut traitement',
      dataIndex: 'traitement_statut',
      key: 'traitement_statut',
      render: (statut) => {
        const statusMap = {
          prise_en_charge: { color: 'blue', text: 'Prise en charge' },
          analyse: { color: 'orange', text: 'Analyse' },
          instruction: { color: 'purple', text: 'Instruction' },
          redaction: { color: 'cyan', text: 'Rédaction' },
          validation: { color: 'gold', text: 'Validation' },
          signature: { color: 'green', text: 'Signature' },
          envoi: { color: 'geekblue', text: 'Envoi' },
          cloture: { color: 'default', text: 'Clôturé' },
        };
        const status = statusMap[statut] || { color: 'default', text: statut };
        return <Tag color={status.color}>{status.text}</Tag>;
      },
    },
    {
      title: 'Échéance',
      dataIndex: 'date_echeance',
      key: 'date_echeance',
      render: (date) => {
        if (!date) return 'N/A';
        const isLate = moment(date).isBefore(moment());
        return (
          <Badge
            status={isLate ? 'error' : 'success'}
            text={moment(date).format('DD/MM/YYYY')}
          />
        );
      },
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      {/* Statistiques */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Courriers à assigner"
              value={dashboardData.total_a_assigner}
              prefix={<FileDoneOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Courriers en cours"
              value={dashboardData.total_assignes}
              prefix={<CarryOutOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Agents actifs"
              value={dashboardData.agents_stats?.length || 0}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Charge moyenne"
              value={
                dashboardData.agents_stats?.length
                  ? (
                      dashboardData.total_assignes /
                      dashboardData.agents_stats.length
                    ).toFixed(1)
                  : 0
              }
              suffix="courriers/agent"
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Onglets principaux */}
      <Tabs defaultActiveKey="1">
        <TabPane
          tab={
            <span>
              <FileDoneOutlined />
              À assigner ({dashboardData.total_a_assigner})
            </span>
          }
          key="1"
        >
          <Card>
            <Table
              columns={columnsAAssigner}
              dataSource={dashboardData.a_assigner}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 10 }}
            />
          </Card>
        </TabPane>

        <TabPane
          tab={
            <span>
              <CarryOutOutlined />
              En cours ({dashboardData.total_assignes})
            </span>
          }
          key="2"
        >
          <Card>
            <Table
              columns={columnsAssignes}
              dataSource={dashboardData.assignes}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 10 }}
            />
          </Card>
        </TabPane>

        <TabPane
          tab={
            <span>
              <TeamOutlined />
              Agents
            </span>
          }
          key="3"
        >
          <Row gutter={16}>
            {dashboardData.agents_stats?.map((agent) => (
              <Col span={8} key={agent.id} style={{ marginBottom: 16 }}>
                <Card
                  title={
                    <Space>
                      <Avatar icon={<UserOutlined />} />
                      <span>{agent.prenom} {agent.nom}</span>
                    </Space>
                  }
                  extra={
                    <Badge
                      status={agent.courriers_en_retard > 0 ? 'error' : 'success'}
                      text={agent.courriers_en_retard > 0 ? 'Retard' : 'OK'}
                    />
                  }
                >
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="Email">
                      <MailOutlined /> {agent.email}
                    </Descriptions.Item>
                    <Descriptions.Item label="Courriers en cours">
                      <Badge count={agent.courriers_assignes} showZero />
                    </Descriptions.Item>
                    <Descriptions.Item label="Terminés">
                      <CheckCircleOutlined /> {agent.courriers_termines || 0}
                    </Descriptions.Item>
                    <Descriptions.Item label="En retard">
                      {agent.courriers_en_retard > 0 ? (
                        <Tag color="red">{agent.courriers_en_retard}</Tag>
                      ) : (
                        <Tag color="green">0</Tag>
                      )}
                    </Descriptions.Item>
                  </Descriptions>
                  <Progress
                    percent={
                      agent.courriers_assignes + agent.courriers_termines > 0
                        ? Math.round(
                            (agent.courriers_termines /
                              (agent.courriers_assignes + agent.courriers_termines)) *
                              100
                          )
                        : 0
                    }
                    size="small"
                    status="active"
                  />
                </Card>
              </Col>
            ))}
          </Row>
        </TabPane>
      </Tabs>

      {/* Modal d'assignation */}
      <Modal
        title={
          <Space>
            <UserSwitchOutlined />
            Assigner le courrier
          </Space>
        }
        open={assignModalVisible}
        onCancel={() => setAssignModalVisible(false)}
        onOk={handleAssign}
        okText="Assigner"
        cancelText="Annuler"
        confirmLoading={loading}
        width={700}
      >
        {selectedCourrier && (
          <>
            {/* Informations du courrier */}
            <Card size="small" style={{ marginBottom: 16 }}>
              <Descriptions title="Courrier à assigner" column={2} size="small">
                <Descriptions.Item label="Référence">
                  <Text strong>{selectedCourrier.reference}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Priorité">
                  {getPriorityTag(selectedCourrier.priorite)}
                </Descriptions.Item>
                <Descriptions.Item label="Objet" span={2}>
                  {selectedCourrier.objet}
                </Descriptions.Item>
                <Descriptions.Item label="Expéditeur">
                  {selectedCourrier.expediteur_nom || 'N/A'}
                </Descriptions.Item>
                <Descriptions.Item label="Date échéance">
                  {selectedCourrier.date_echeance
                    ? moment(selectedCourrier.date_echeance).format('DD/MM/YYYY')
                    : 'N/A'}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            {/* Formulaire d'assignation */}
            <Form layout="vertical">
              <Form.Item label="Agent à assigner" required>
                <Select
                  placeholder="Sélectionner un agent"
                  onChange={(value) =>
                    setAssignForm({ ...assignForm, agent_id: value })
                  }
                  value={assignForm.agent_id}
                  showSearch
                  optionFilterProp="children"
                >
                  {agentsDisponibles.map((agent) => (
                    <Option key={agent.id} value={agent.id}>
                      <Space direction="vertical" size={0}>
                        <Text strong>
                          {agent.prenom} {agent.nom}
                          {agent.recommande && (
                            <Tag color="green" style={{ marginLeft: 8 }}>
                              Recommandé
                            </Tag>
                          )}
                        </Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {agent.email} • {agent.courriers_en_cours} en cours
                          {agent.courriers_en_retard > 0 && (
                            <Badge
                              status="error"
                              text={`${agent.courriers_en_retard} en retard`}
                              style={{ marginLeft: 8 }}
                            />
                          )}
                        </Text>
                      </Space>
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="Priorité d'assignation">
                    <Select
                      value={assignForm.priorite_assignation}
                      onChange={(value) =>
                        setAssignForm({ ...assignForm, priorite_assignation: value })
                      }
                    >
                      <Option value="basse">Basse</Option>
                      <Option value="normale">Normale</Option>
                      <Option value="haute">Haute</Option>
                      <Option value="urgente">Urgente</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Délai de traitement (jours)">
                    <Input
                      type="number"
                      min={1}
                      max={30}
                      value={assignForm.delai_traitement}
                      onChange={(e) =>
                        setAssignForm({
                          ...assignForm,
                          delai_traitement: parseInt(e.target.value) || 5,
                        })
                      }
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item label="Instructions pour l'agent">
                <TextArea
                  rows={4}
                  placeholder="Instructions détaillées pour le traitement de ce courrier..."
                  value={assignForm.instructions}
                  onChange={(e) =>
                    setAssignForm({ ...assignForm, instructions: e.target.value })
                  }
                />
              </Form.Item>

              <Form.Item label="Commentaire (interne)">
                <Input
                  placeholder="Commentaire pour le suivi..."
                  value={assignForm.commentaire}
                  onChange={(e) =>
                    setAssignForm({ ...assignForm, commentaire: e.target.value })
                  }
                />
              </Form.Item>
            </Form>

            {/* Aperçu de la charge */}
            {assignForm.agent_id && (
              <Card size="small" style={{ marginTop: 16 }}>
                <Space align="center">
                  <ClockCircleOutlined />
                  <Text type="secondary">
                    Après assignation, cet agent aura{' '}
                    {agentsDisponibles.find((a) => a.id === assignForm.agent_id)
                      ?.courriers_en_cours + 1 || 0}{' '}
                    courriers en cours.
                  </Text>
                </Space>
              </Card>
            )}
          </>
        )}
      </Modal>
    </div>
  );
};

export default ChefServiceDashboard;