import React, { useEffect, useState, useMemo, useCallback } from "react";
import { 
  Card, Row, Col, Statistic, Spin, message, 
  Select, DatePicker, Button, Tooltip, Progress,
  Table, Tag, Space, Timeline, Alert, Empty
} from "antd";
import {
  RiseOutlined, FallOutlined, ClockCircleOutlined,
  FileDoneOutlined, InboxOutlined, CheckCircleOutlined,
  WarningOutlined, ReloadOutlined, FilterOutlined,
  TeamOutlined, BarChartOutlined, DownloadOutlined,
  EyeOutlined, CalendarOutlined, ThunderboltOutlined
} from "@ant-design/icons";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { getStats, getCourrierTrends, getServicePerformance } from "../services/dashboardService";

dayjs.extend(relativeTime);

const { RangePicker } = DatePicker;
const { Option } = Select;

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [trends, setTrends] = useState(null);
  const [performance, setPerformance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    period: 'today',
    startDate: dayjs().startOf('month'),
    endDate: dayjs().endOf('month'),
    service: 'all'
  });
  const [services, setServices] = useState([]);

  // Mémoized calculations for better performance
  const calculatedStats = useMemo(() => {
    if (!stats) return null;
    
    return {
      traitementRate: stats.received > 0 
        ? Math.round(((stats.received - stats.in_progress - stats.late) / stats.received) * 100) 
        : 0,
      averageProcessingTime: stats.average_processing_time || 0,
      urgentPercentage: stats.received > 0 
        ? Math.round((stats.urgent || 0) / stats.received * 100) 
        : 0
    };
  }, [stats]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsData, trendsData, perfData] = await Promise.all([
        getStats(filters),
        getCourrierTrends(filters),
        getServicePerformance(filters)
      ]);
      
      setStats(statsData);
      setTrends(trendsData);
      setPerformance(perfData);
      
      // Extract unique services for filter
      const uniqueServices = [...new Set(perfData.map(p => p.service))];
      setServices(uniqueServices);
      
    } catch (err) {
      console.error("Erreur chargement dashboard:", err);
      message.error("Impossible de charger les statistiques");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadData();
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(loadData, 300000);
    return () => clearInterval(interval);
  }, [loadData]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleExport = () => {
    // Export functionality
    message.success("Export en cours...");
    // Implement export logic here
  };

  const columns = [
    {
      title: 'Service',
      dataIndex: 'service',
      key: 'service',
      render: (text) => <span style={{ fontWeight: 500 }}>{text}</span>,
    },
    {
      title: 'Courriers traités',
      dataIndex: 'processed',
      key: 'processed',
      sorter: (a, b) => a.processed - b.processed,
      render: (value) => <Tag color="blue">{value}</Tag>,
    },
    {
      title: 'En retard',
      dataIndex: 'late',
      key: 'late',
      sorter: (a, b) => a.late - b.late,
      render: (value) => value > 0 
        ? <Tag color="red">{value}</Tag> 
        : <Tag color="green">{value}</Tag>,
    },
    {
      title: 'Taux de traitement',
      dataIndex: 'completionRate',
      key: 'completionRate',
      sorter: (a, b) => a.completionRate - b.completionRate,
      render: (value) => (
        <Progress 
          percent={value} 
          size="small" 
          status={value > 80 ? "success" : value > 60 ? "normal" : "exception"}
        />
      ),
    },
    {
      title: 'Délai moyen',
      dataIndex: 'averageTime',
      key: 'averageTime',
      render: (value) => `${value} jours`,
    },
  ];

  const recentActivities = [
    { time: 'Il y a 2 minutes', action: 'Nouveau courrier entrant', user: 'Admin', type: 'entrant' },
    { time: 'Il y a 15 minutes', action: 'Courrier imputé au service RH', user: 'Secrétariat', type: 'imputation' },
    { time: 'Il y a 30 minutes', action: 'Courrier traité', user: 'Service Technique', type: 'traitement' },
    { time: 'Il y a 2 heures', action: 'Analyse IA effectuée', user: 'Système IA', type: 'ia' },
  ];

  if (loading && !stats) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <Spin size="large" tip="Chargement du dashboard..." />
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      {/* Header with filters */}
      <Card 
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <BarChartOutlined />
            <span>Tableau de bord - Gestion des courriers</span>
            <Tag color="blue">{dayjs().format('DD/MM/YYYY')}</Tag>
          </div>
        }
        extra={
          <Space>
            <Select
              defaultValue="today"
              style={{ width: 120 }}
              onChange={(value) => handleFilterChange('period', value)}
            >
              <Option value="today">Aujourd'hui</Option>
              <Option value="week">Cette semaine</Option>
              <Option value="month">Ce mois</Option>
              <Option value="quarter">Ce trimestre</Option>
              <Option value="custom">Période personnalisée</Option>
            </Select>
            
            {filters.period === 'custom' && (
              <RangePicker
                value={[filters.startDate, filters.endDate]}
                onChange={(dates) => {
                  if (dates) {
                    handleFilterChange('startDate', dates[0]);
                    handleFilterChange('endDate', dates[1]);
                  }
                }}
              />
            )}
            
            <Select
              placeholder="Filtrer par service"
              style={{ width: 200 }}
              onChange={(value) => handleFilterChange('service', value)}
              allowClear
            >
              <Option value="all">Tous les services</Option>
              {services.map(service => (
                <Option key={service} value={service}>{service}</Option>
              ))}
            </Select>
            
            <Tooltip title="Actualiser">
              <Button 
                icon={<ReloadOutlined />} 
                onClick={loadData}
                loading={loading}
              />
            </Tooltip>
            
            <Tooltip title="Exporter les données">
              <Button 
                icon={<DownloadOutlined />} 
                onClick={handleExport}
              />
            </Tooltip>
          </Space>
        }
        style={{ marginBottom: 24 }}
      >
        <Alert
          title={
            <span>
              <ThunderboltOutlined /> Statistiques en temps réel - Dernière mise à jour : {dayjs().fromNow()}
            </span>
          }
          type="info"
          showIcon
        />
      </Card>

      {/* Main Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card hoverable>
            <Statistic
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <InboxOutlined />
                  <span>Courriers reçus</span>
                </div>
              }
              value={stats?.received || 0}
              prefix={<RiseOutlined style={{ color: '#1890ff' }} />}
              styles={{
                content: { 
                  color: '#1890ff', 
                  fontSize: '28px' 
                }
              }}
              suffix={
                trends?.receivedTrend && (
                  <Tag color={trends.receivedTrend > 0 ? "green" : "red"}>
                    {trends.receivedTrend > 0 ? '+' : ''}{trends.receivedTrend}%
                  </Tag>
                )
              }
            />
            <div style={{ marginTop: 8, fontSize: '12px', color: '#666' }}>
              Dont {stats?.urgent || 0} urgents
            </div>
          </Card>
        </Col>
        
        <Col xs={24} sm={12} md={6}>
          <Card hoverable>
            <Statistic
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FileDoneOutlined />
                  <span>En traitement</span>
                </div>
              }
              value={stats?.in_progress || 0}
              prefix={<ClockCircleOutlined style={{ color: '#faad14' }} />}
              styles={{
                content: { 
                  color: '#faad14', 
                  fontSize: '28px' 
                }
              }}
            />
            <div style={{ marginTop: 8 }}>
              <Progress 
                percent={calculatedStats?.traitementRate || 0} 
                size="small" 
                status="active"
              />
            </div>
          </Card>
        </Col>
        
        <Col xs={24} sm={12} md={6}>
          <Card hoverable style={{ borderColor: stats?.late > 0 ? '#ff4d4f' : undefined }}>
            <Statistic
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <WarningOutlined />
                  <span>En retard</span>
                </div>
              }
              value={stats?.late || 0}
              prefix={<WarningOutlined style={{ color: '#ff4d4f' }} />}
              styles={{
                content: { 
                  color: '#ff4d4f', 
                  fontSize: '28px' 
                }
              }}
            />
            {stats?.late > 0 && (
              <div style={{ marginTop: 8, fontSize: '12px', color: '#ff4d4f' }}>
                ⚠️ Nécessite une attention immédiate
              </div>
            )}
          </Card>
        </Col>
        
        <Col xs={24} sm={12} md={6}>
          <Card hoverable>
            <Statistic
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircleOutlined />
                  <span>Archivés</span>
                </div>
              }
              value={stats?.archived || 0}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              styles={{
                content: { 
                  color: '#52c41a', 
                  fontSize: '28px' 
                }
              }}
              suffix={
                <div style={{ fontSize: '12px', color: '#666' }}>
                  {stats?.total > 0 ? `${Math.round((stats.archived / stats.total) * 100)}%` : '0%'}
                </div>
              }
            />
          </Card>
        </Col>
      </Row>

      {/* Performance and Details Row */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={16}>
          <Card 
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <TeamOutlined />
                <span>Performance par service</span>
              </div>
            }
            extra={
              <Button type="link" icon={<EyeOutlined />}>
                Voir détails
              </Button>
            }
          >
            {performance.length > 0 ? (
              <Table 
                dataSource={performance} 
                columns={columns} 
                pagination={false}
                size="small"
                rowKey="service"
              />
            ) : (
              <Empty description="Aucune donnée de performance disponible" />
            )}
          </Card>
        </Col>
        
        <Col xs={24} lg={8}>
          <Card 
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CalendarOutlined />
                <span>Activités récentes</span>
              </div>
            }
          >
            <Timeline
              items={recentActivities.map((activity, index) => ({
                key: index,
                color: activity.type === 'entrant' ? 'blue' :
                       activity.type === 'imputation' ? 'green' :
                       activity.type === 'traitement' ? 'orange' : 'purple',
                children: (
                  <div>
                    <div style={{ fontWeight: 500 }}>{activity.action}</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      {activity.time} • Par {activity.user}
                    </div>
                  </div>
                )
              }))}
            />
          </Card>
        </Col>
      </Row>

      {/* Additional Insights */}
      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card title="Délai moyen de traitement">
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#1890ff' }}>
                {calculatedStats?.averageProcessingTime || 0}
              </div>
              <div style={{ fontSize: '14px', color: '#666' }}>jours</div>
              <Progress 
                percent={Math.min((calculatedStats?.averageProcessingTime || 0) * 10, 100)} 
                status="active"
                style={{ marginTop: 16 }}
              />
            </div>
          </Card>
        </Col>
        
        <Col xs={24} md={8}>
          <Card title="Répartition par type">
            <Row gutter={[8, 8]} style={{ marginTop: 16 }}>
              <Col span={8}>
                <Card size="small">
                  <Statistic
                    title="Entrants"
                    value={stats?.entrants || 0}
                    styles={{
                      content: { 
                        fontSize: '20px', 
                        textAlign: 'center' 
                      }
                    }}
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small">
                  <Statistic
                    title="Sortants"
                    value={stats?.sortants || 0}
                    styles={{
                      content: { 
                        fontSize: '20px', 
                        textAlign: 'center' 
                      }
                    }}
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small">
                  <Statistic
                    title="Internes"
                    value={stats?.internes || 0}
                    styles={{
                      content: { 
                        fontSize: '20px', 
                        textAlign: 'center' 
                      }
                    }}
                  />
                </Card>
              </Col>
            </Row>
          </Card>
        </Col>
        
        <Col xs={24} md={8}>
          <Card title="Indicateurs clés">
            <Space orientation="vertical" style={{ width: '100%' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Taux de traitement</span>
                  <span>{calculatedStats?.traitementRate || 0}%</span>
                </div>
                <Progress percent={calculatedStats?.traitementRate || 0} size="small" />
              </div>
              
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Courriers urgents</span>
                  <span>{calculatedStats?.urgentPercentage || 0}%</span>
                </div>
                <Progress percent={calculatedStats?.urgentPercentage || 0} size="small" status="exception" />
              </div>
              
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Satisfaction IA</span>
                  <span>92%</span>
                </div>
                <Progress percent={92} size="small" status="success" />
              </div>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Quick Actions */}
      <Card 
        title="Actions rapides" 
        style={{ marginTop: 24 }}
      >
        <Row gutter={[16, 16]}>
          <Col xs={12} sm={6}>
            <Button 
              type="primary" 
              block 
              icon={<InboxOutlined />}
              href="/courriers/entrants"
            >
              Voir entrants
            </Button>
          </Col>
          <Col xs={12} sm={6}>
            <Button 
              block 
              icon={<TeamOutlined />}
              href="/imputation"
            >
              Tableau d'imputation
            </Button>
          </Col>
          <Col xs={12} sm={6}>
            <Button 
              block 
              icon={<WarningOutlined />}
              href="/courriers?en_retard=true"
            >
              Voir retards
            </Button>
          </Col>
          <Col xs={12} sm={6}>
            <Button 
              block 
              icon={<FileDoneOutlined />}
              href="/reports"
            >
              Générer rapport
            </Button>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default Dashboard;