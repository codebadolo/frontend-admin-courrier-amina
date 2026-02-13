import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card, Row, Col, Statistic, Button, List, Avatar, Tag,
  Progress, Badge, Timeline, Space, Alert, Spin, Typography
} from 'antd';
import {
  InboxOutlined, ClockCircleOutlined, CheckCircleOutlined,
  ExclamationCircleOutlined, FileTextOutlined, UserOutlined,
  ArrowRightOutlined, DashboardOutlined
} from '@ant-design/icons';
import { traitementService } from '../../services/traitementService';

const { Text } = Typography;

const TraitementDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [courriersRecents, setCourriersRecents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Appels parallèles aux endpoints réels
      const [statsData, courriersData] = await Promise.all([
        traitementService.getStatsTraitement(),
        traitementService.getCourriersTraitement({
          page_size: 5,
          ordering: '-date_reception'
        })
      ]);

      setStats(statsData);
      setCourriersRecents(courriersData.results || courriersData || []);
    } catch (err) {
      console.error('Erreur chargement dashboard traitement:', err);
      setError('Impossible de charger les données du dashboard. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '24px' }}>
        <Alert
          message="Erreur de chargement"
          description={error}
          type="error"
          showIcon
          action={
            <Button type="primary" onClick={fetchDashboardData}>
              Réessayer
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <Row gutter={24} style={{ marginBottom: '24px' }}>
        <Col span={24}>
          <Card>
            <Row align="middle" justify="space-between">
              <Col>
                <Space>
                  <DashboardOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
                  <h1 style={{ margin: 0 }}>Dashboard de Traitement</h1>
                </Space>
                <p style={{ color: '#666', marginTop: '8px' }}>
                  Vue d'ensemble des courriers en traitement
                </p>
              </Col>
              <Col>
                <Button
                  type="primary"
                  icon={<ArrowRightOutlined />}
                  onClick={() => navigate('/traitement/courriers')}
                >
                  Voir tous les courriers
                </Button>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* Statistiques */}
      <Row gutter={24} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="À traiter"
              value={stats?.total_courriers ?? 0}
              prefix={<InboxOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Mes courriers"
              value={stats?.mes_courriers ?? 0}
              prefix={<UserOutlined style={{ color: '#fa8c16' }} />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="En retard"
              value={stats?.en_retard ?? 0}
              prefix={<ExclamationCircleOutlined style={{ color: '#f5222d' }} />}
              valueStyle={{ color: '#f5222d' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="À valider"
              value={stats?.a_valider ?? 0}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={24}>
        <Col span={16}>
          {/* Courriers récents */}
          <Card
            title={
              <Space>
                <FileTextOutlined />
                Courriers récents nécessitant une action
              </Space>
            }
            style={{ marginBottom: '24px' }}
          >
            <List
              dataSource={courriersRecents}
              renderItem={(courrier) => (
                <List.Item
                  actions={[
                    <Button
                      type="link"
                      onClick={() => navigate(`/traitement/courriers/${courrier.id}`)}
                    >
                      Traiter
                    </Button>
                  ]}
                >
                  <List.Item.Meta
                    avatar={<Avatar icon={<FileTextOutlined />} />}
                    title={
                      <Space>
                        <span style={{ fontFamily: 'monospace' }}>{courrier.reference}</span>
                        <Tag color={courrier.priorite === 'urgente' ? 'red' : 'blue'}>
                          {courrier.priorite}
                        </Tag>
                      </Space>
                    }
                    description={
                      <Space direction="vertical" size={2}>
                        <div>{courrier.objet}</div>
                        <div>
                          <Text type="secondary">
                            Expéditeur: {courrier.expediteur_nom} •
                            Reçu: {courrier.date_reception ? new Date(courrier.date_reception).toLocaleDateString() : ''}
                          </Text>
                        </div>
                      </Space>
                    }
                  />
                </List.Item>
              )}
              locale={{ emptyText: 'Aucun courrier à traiter' }}
            />
          </Card>

          {/* Progression globale – si présente dans stats, sinon masqué */}
          {stats?.progression_globale !== undefined && (
            <Card title="Progression globale">
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <Text>Traitement des courriers</Text>
                  <Progress percent={stats.progression_globale} />
                </div>
                {stats?.respect_delais !== undefined && (
                  <div>
                    <Text>Respect des délais</Text>
                    <Progress
                      percent={stats.respect_delais}
                      status={stats.respect_delais > 80 ? 'success' : 'normal'}
                    />
                  </div>
                )}
              </Space>
            </Card>
          )}
        </Col>

        <Col span={8}>
          {/* Actions rapides */}
          <Card title="Actions rapides" style={{ marginBottom: '24px' }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button
                block
                type="primary"
                icon={<InboxOutlined />}
                onClick={() => navigate('/traitement/courriers')}
                size="large"
              >
                Voir tous les courriers
              </Button>
              <Button
                block
                icon={<UserOutlined />}
                onClick={() => navigate('/traitement/courriers?statut=mes_courriers')}
              >
                Mes courriers
              </Button>
              <Button
                block
                icon={<ExclamationCircleOutlined />}
                onClick={() => navigate('/traitement/courriers?statut=en_retard')}
              >
                Courriers en retard
              </Button>
              <Button
                block
                icon={<CheckCircleOutlined />}
                onClick={() => navigate('/traitement/courriers?statut=a_valider')}
              >
                Validations en attente
              </Button>
            </Space>
          </Card>

          {/* Activité récente – peut être alimentée par un endpoint dédié, ici timeline des derniers événements */}
          <Card title="Activité récente">
            <Timeline>
              {courriersRecents.slice(0, 3).map((courrier) => (
                <Timeline.Item
                  key={courrier.id}
                  dot={<FileTextOutlined style={{ color: '#1890ff' }} />}
                >
                  <div>
                    <Text strong>{courrier.reference}</Text>
                    <br />
                    <Text type="secondary">{courrier.objet}</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {courrier.date_reception ? new Date(courrier.date_reception).toLocaleDateString() : ''}
                    </Text>
                  </div>
                </Timeline.Item>
              ))}
            </Timeline>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default TraitementDashboard;