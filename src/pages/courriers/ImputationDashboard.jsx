import React, { useState, useEffect } from 'react';
import {
  Table, Card, Tag, Button, Modal, Select, Input, Space,
  Alert, Row, Col, Statistic, Tabs, Badge, Tooltip, Spin,
  Popconfirm, message
} from 'antd';
import {
  SendOutlined, RobotOutlined, CheckCircleOutlined,
  ClockCircleOutlined, TeamOutlined, FileTextOutlined,
  EyeOutlined, FilterOutlined, ReloadOutlined,
  ThunderboltOutlined, PercentageOutlined
} from '@ant-design/icons';

import {
  fetchCourriersEnAttente,
  getImputationStats,
  imputerCourrierRapide,
  imputerCourrier,
  getCourrierDetail  // CORRECTION : getCourrierDetail au lieu de fetchCourrierDetail
} from '../../services/courrierService';

import { getServices } from '../../api/service';
import { getCategories } from '../../api/categories';

const { Option } = Select;
const { TextArea } = Input;
const { TabPane } = Tabs;

const ImputationDashboard = () => {
  const [courriers, setCourriers] = useState([]);
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [selectedCourrier, setSelectedCourrier] = useState(null);
  const [imputationModal, setImputationModal] = useState(false);
  const [detailModal, setDetailModal] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [commentaire, setCommentaire] = useState('');
  // 🔒 Sécurisation des services
  const safeServices = Array.isArray(services) ? services : [];

  const [filters, setFilters] = useState({
    search: '',
    type: null,
    category: null,
    hasSuggestion: null
  });
  const [imputationMode, setImputationMode] = useState('manual'); // 'manual' ou 'auto'

  // Charger les données
  const loadData = async () => {
    setLoading(true);
    try {
      // Charger les courriers en attente
      const data = await fetchCourriersEnAttente(filters);
      setCourriers(data);
      
      // Charger les statistiques
      const statsData = await getImputationStats();
      setStats(statsData);
      
      // Charger les services
      const servicesData = await getServices();
      setServices(servicesData);
      
      // Charger les catégories
      const categoriesData = await getCategories();
      setCategories(categoriesData);
    } catch (error) {
      message.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filters]);

  const handleViewDetails = async (courrierId) => {
    try {
      const details = await getCourrierDetail(courrierId);
      setSelectedCourrier(details);
      setDetailModal(true);
    } catch (error) {
      message.error('Erreur lors du chargement des détails');
    }
  };

  const handleImputer = async (courrier, useAiSuggestion = false) => {
    setSelectedCourrier(courrier);
    
    if (useAiSuggestion && courrier.has_ia_suggestion && courrier.suggestions_ia?.length > 0) {
      // Utiliser la suggestion IA
      const suggestion = courrier.suggestions_ia[0];
      setSelectedService(suggestion.service_id);
      setImputationMode('auto');
    } else {
      setImputationMode('manual');
    }
    
    setImputationModal(true);
  };

  const submitImputation = async () => {
    if (!selectedCourrier || !selectedService) {
      message.error('Veuillez sélectionner un service');
      return;
    }

    try {
      if (imputationMode === 'auto') {
        await imputerCourrierRapide(selectedCourrier.id, selectedService, commentaire);
      } else {
        await imputerCourrier(selectedCourrier.id, selectedService, commentaire);
      }
      
      message.success('Courrier imputé avec succès');
      setImputationModal(false);
      setSelectedCourrier(null);
      setSelectedService(null);
      setCommentaire('');
      
      // Recharger les données
      loadData();
    } catch (error) {
      message.error('Erreur lors de l\'imputation');
    }
  };

  // Colonnes du tableau
  const columns = [
    {
      title: 'Référence',
      dataIndex: 'reference',
      render: (text, record) => (
        <div>
          <Tag color={
            record.type === 'entrant' ? 'blue' : 
            record.type === 'sortant' ? 'green' : 'purple'
          }>
            {text}
          </Tag>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {record.type_display}
          </div>
        </div>
      ),
      sorter: (a, b) => a.reference.localeCompare(b.reference),
    },
    {
      title: 'Objet',
      dataIndex: 'objet',
      ellipsis: true,
      render: (text) => <span style={{ fontWeight: 500 }}>{text}</span>,
    },
    {
      title: 'Expéditeur',
      dataIndex: 'expediteur_nom',
      render: (text, record) => (
        <div>
          <div>{text}</div>
          {record.expediteur_email && (
            <div style={{ fontSize: '12px', color: '#666' }}>{record.expediteur_email}</div>
          )}
        </div>
      ),
    },
    {
      title: 'Catégorie',
      dataIndex: 'category_nom',
      render: (text) => text || <Tag color="default">Non catégorisé</Tag>,
      filters: categories.map(cat => ({ text: cat.nom, value: cat.id })),
      onFilter: (value, record) => record.category_id === value,
    },
    {
      title: 'Date réception',
      dataIndex: 'date_reception',
      render: (text) => <span><ClockCircleOutlined /> {text}</span>,
      sorter: (a, b) => new Date(a.date_reception) - new Date(b.date_reception),
    },
    {
      title: 'Priorité',
      dataIndex: 'priorite',
      render: (text) => {
        const colors = {
          urgente: 'red',
          haute: 'orange',
          normale: 'blue',
          basse: 'gray'
        };
        return <Tag color={colors[text] || 'blue'}>{text}</Tag>;
      },
    },
    {
      title: 'IA',
      render: (_, record) => {
        if (!record.has_ia_suggestion) {
          return <Tag color="default">Pas de suggestion</Tag>;
        }
        
        const suggestion = record.suggestions_ia?.[0];
        if (!suggestion) return null;
        
        const confiance = Math.round(suggestion.confiance * 100);
        let color = 'green';
        if (confiance < 50) color = 'orange';
        if (confiance < 30) color = 'red';
        
        return (
          <Tooltip title={`Suggestion IA: ${suggestion.service_nom} (${confiance}% de confiance)`}>
            <Tag color={color}>
              <RobotOutlined /> {confiance}%
            </Tag>
          </Tooltip>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Voir détails">
            <Button
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleViewDetails(record.id)}
            />
          </Tooltip>
          
          {record.has_ia_suggestion && (
            <Tooltip title="Valider suggestion IA">
              <Button
                size="small"
                type="primary"
                icon={<CheckCircleOutlined />}
                onClick={() => handleImputer(record, true)}
              >
                Valider IA
              </Button>
            </Tooltip>
          )}
          
          <Tooltip title="Imputer manuellement">
            <Button
              size="small"
              type="default"
              icon={<SendOutlined />}
              onClick={() => handleImputer(record, false)}
            >
              Imputer
            </Button>
          </Tooltip>
        </Space>
      ),
    },
  ];

  // Statistiques
  const renderStats = () => {
    if (!stats) return null;
    
    return (
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="Total en attente"
              value={stats.total_en_attente}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="Entrants"
              value={stats.entrants_en_attente}
              prefix={<FileTextOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="Sortants"
              value={stats.sortants_en_attente}
              prefix={<FileTextOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="Avec suggestion IA"
              value={stats.avec_suggestion_ia}
              prefix={<RobotOutlined />}
              suffix={<PercentageOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>
    );
  };

  return (
    <div style={{ padding: 24 }}>
      {/* Titre et filtres */}
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <TeamOutlined />
            <span>Tableau d'imputation</span>
            <Badge
              count={stats?.total_en_attente || 0}
              style={{ backgroundColor: '#1890ff', marginLeft: 10 }}
            />
          </div>
        }
        extra={
          <Button
            icon={<ReloadOutlined />}
            onClick={loadData}
            loading={loading}
          >
            Actualiser
          </Button>
        }
        style={{ marginBottom: 24 }}
      >
        {/* Filtres */}
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <Input.Search
              placeholder="Rechercher par référence, objet, expéditeur..."
              allowClear
              onSearch={(value) => setFilters({ ...filters, search: value })}
              enterButton
            />
          </Col>
          <Col span={4}>
            <Select
              placeholder="Type de courrier"
              allowClear
              style={{ width: '100%' }}
              onChange={(value) => setFilters({ ...filters, type: value })}
            >
              <Option value="entrant">Entrants</Option>
              <Option value="sortant">Sortants</Option>
              <Option value="interne">Internes</Option>
            </Select>
          </Col>
          <Col span={4}>
            <Select
              placeholder="Catégorie"
              allowClear
              style={{ width: '100%' }}
              onChange={(value) => setFilters({ ...filters, category: value })}
            >
              {categories.map(cat => (
                <Option key={cat.id} value={cat.id}>{cat.nom}</Option>
              ))}
            </Select>
          </Col>
          <Col span={4}>
            <Select
              placeholder="Suggestion IA"
              allowClear
              style={{ width: '100%' }}
              onChange={(value) => setFilters({ ...filters, hasSuggestion: value })}
            >
              <Option value="true">Avec suggestion IA</Option>
              <Option value="false">Sans suggestion IA</Option>
            </Select>
          </Col>
        </Row>

        {/* Statistiques */}
        {renderStats()}
      </Card>

      {/* Tableau des courriers */}
      <Card>
        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={courriers}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `${total} courriers en attente`,
            }}
            expandable={{
              expandedRowRender: (record) => (
                <div style={{ margin: 0 }}>
                  {record.meta_analyse?.resume && (
                    <Alert
                      message="Résumé IA"
                      description={record.meta_analyse.resume}
                      type="info"
                      showIcon
                      style={{ marginBottom: 8 }}
                    />
                  )}
                  <p><strong>Confidentialité:</strong> {record.confidentialite}</p>
                  {record.category_nom && (
                    <p><strong>Catégorie:</strong> {record.category_nom}</p>
                  )}
                </div>
              ),
              rowExpandable: (record) => record.meta_analyse?.resume || record.category_nom,
            }}
          />
        </Spin>
      </Card>

      {/* Modal d'imputation */}
      <Modal
        title={
          <div>
            {imputationMode === 'auto' ? (
              <>
                <RobotOutlined /> Valider la suggestion IA
              </>
            ) : (
              <>
                <SendOutlined /> Imputer le courrier
              </>
            )}
          </div>
        }
        open={imputationModal}
        onCancel={() => {
          setImputationModal(false);
          setSelectedCourrier(null);
          setSelectedService(null);
          setCommentaire('');
        }}
        onOk={submitImputation}
        okText={imputationMode === 'auto' ? "Valider la suggestion" : "Imputer"}
        width={600}
      >
        {selectedCourrier && (
          <div style={{ marginBottom: 20 }}>
            <h4>Courrier: {selectedCourrier.reference}</h4>
            <p><strong>Objet:</strong> {selectedCourrier.objet}</p>
            <p><strong>Expéditeur:</strong> {selectedCourrier.expediteur_nom}</p>
            <p><strong>Date réception:</strong> {selectedCourrier.date_reception}</p>
            
            {imputationMode === 'auto' && selectedCourrier.suggestions_ia?.[0] && (
              <Alert
                type="info"
                message="Suggestion IA détectée"
                description={
                  <div>
                    <p><strong>Service suggéré:</strong> {selectedCourrier.suggestions_ia[0].service_nom}</p>
                    <p><strong>Confiance:</strong> {Math.round(selectedCourrier.suggestions_ia[0].confiance * 100)}%</p>
                  </div>
                }
                style={{ marginTop: 10 }}
              />
            )}
          </div>
        )}

        <Select
          placeholder="Sélectionner un service"
          style={{ width: '100%', marginBottom: 16 }}
          value={selectedService}
          onChange={setSelectedService}
          showSearch
          optionFilterProp="children"
        >
          {safeServices.map(service => (
              <Option key={service.id} value={service.id}>
                {service.nom}
                {service.chef && ` (Chef: ${service.chef.username})`}
              </Option>
            ))}
        </Select>

        <TextArea
          placeholder="Commentaire ou note interne (optionnel)"
          rows={3}
          value={commentaire}
          onChange={(e) => setCommentaire(e.target.value)}
        />
      </Modal>

      {/* Modal de détails */}
      <Modal
        title="Détails du courrier"
        open={detailModal}
        onCancel={() => {
          setDetailModal(false);
          setSelectedCourrier(null);
        }}
        footer={[
          <Button key="close" onClick={() => setDetailModal(false)}>
            Fermer
          </Button>,
          <Button
            key="imputer"
            type="primary"
            onClick={() => {
              setDetailModal(false);
              handleImputer(selectedCourrier, false);
            }}
          >
            Imputer ce courrier
          </Button>
        ]}
        width={700}
      >
        {selectedCourrier && (
          <div>
            <Row gutter={16}>
              <Col span={12}>
                <p><strong>Référence:</strong> {selectedCourrier.reference}</p>
                <p><strong>Type:</strong> {selectedCourrier.type_display}</p>
                <p><strong>Objet:</strong> {selectedCourrier.objet}</p>
                <p><strong>Expéditeur:</strong> {selectedCourrier.expediteur_nom}</p>
                <p><strong>Email:</strong> {selectedCourrier.expediteur_email || 'Non renseigné'}</p>
              </Col>
              <Col span={12}>
                <p><strong>Date réception:</strong> {selectedCourrier.date_reception}</p>
                <p><strong>Priorité:</strong> {selectedCourrier.priorite}</p>
                <p><strong>Confidentialité:</strong> {selectedCourrier.confidentialite}</p>
                <p><strong>Catégorie:</strong> {selectedCourrier.category_nom || 'Non catégorisé'}</p>
                <p><strong>Statut:</strong> {selectedCourrier.statut}</p>
              </Col>
            </Row>
            
            {selectedCourrier.meta_analyse && (
              <Alert
                type="info"
                message="Analyse IA"
                description={
                  <div>
                    {selectedCourrier.meta_analyse.resume && (
                      <p><strong>Résumé:</strong> {selectedCourrier.meta_analyse.resume}</p>
                    )}
                    {selectedCourrier.meta_analyse.classification && (
                      <>
                        <p><strong>Catégorie suggérée:</strong> {selectedCourrier.meta_analyse.classification.categorie_suggeree}</p>
                        <p><strong>Service suggéré:</strong> {selectedCourrier.meta_analyse.classification.service_suggere}</p>
                      </>
                    )}
                  </div>
                }
                style={{ marginTop: 16 }}
              />
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ImputationDashboard;