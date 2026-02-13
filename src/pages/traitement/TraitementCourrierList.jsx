import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card, Button, Input, Select, Table, Row, Col, Space, Tag, message, Spin, Alert
} from 'antd';
import {
  SearchOutlined,
  FilterOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { traitementService } from '../../services/traitementService';

const { Option } = Select;
const { Search } = Input;

const TraitementCourrierList = () => {
  const navigate = useNavigate();
  const [courriers, setCourriers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [filters, setFilters] = useState({
    statut: '',
    priorite: '',
    recherche: ''
  });

  useEffect(() => {
    fetchCourriers();
  }, [pagination.current, pagination.pageSize, filters]);

  const fetchCourriers = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page: pagination.current,
        page_size: pagination.pageSize,
        ...filters
      };

      const data = await traitementService.getCourriersTraitement(params);

      setCourriers(data.results || []);
      setPagination(prev => ({
        ...prev,
        total: data.count || 0
      }));
    } catch (err) {
      console.error('Erreur chargement liste traitement:', err);
      setError('Impossible de charger la liste des courriers. Veuillez réessayer.');
      setCourriers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTableChange = (newPagination) => {
    setPagination({
      ...pagination,
      current: newPagination.current || 1,
      pageSize: newPagination.pageSize || 10
    });
  };

  const handleSearch = (value) => {
    setFilters(prev => ({ ...prev, recherche: value }));
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const getStatusColor = (statut) => {
    const colors = {
      prise_en_charge: 'blue',
      analyse: 'processing',
      instruction: 'cyan',
      redaction: 'orange',
      validation: 'gold',
      signature: 'volcano',
      envoi: 'green',
      cloture: 'success'
    };
    return colors[statut] || 'default';
  };

  const getPriorityColor = (priorite) => {
    const colors = {
      urgente: 'red',
      haute: 'orange',
      normale: 'blue',
      basse: 'green'
    };
    return colors[priorite] || 'default';
  };

  const columns = [
    {
      title: 'Référence',
      dataIndex: 'reference',
      key: 'reference',
      render: (text) => <span style={{ fontFamily: 'monospace' }}>{text}</span>
    },
    {
      title: 'Objet',
      dataIndex: 'objet',
      key: 'objet',
      ellipsis: true
    },
    {
      title: 'Expéditeur',
      dataIndex: 'expediteur_nom',
      key: 'expediteur_nom'
    },
    {
      title: 'Statut traitement',
      dataIndex: 'traitement_statut',
      key: 'traitement_statut',
      render: (statut) => (
        <Tag color={getStatusColor(statut)}>
          {statut ? statut.replace('_', ' ').toUpperCase() : 'N/A'}
        </Tag>
      )
    },
    {
      title: 'Priorité',
      dataIndex: 'priorite',
      key: 'priorite',
      render: (priorite) => (
        <Tag color={getPriorityColor(priorite)}>
          {priorite ? priorite.toUpperCase() : 'N/A'}
        </Tag>
      )
    },
    {
      title: 'Date réception',
      dataIndex: 'date_reception',
      key: 'date_reception',
      render: (date) => date ? new Date(date).toLocaleDateString() : 'N/A'
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button
          type="primary"
          icon={<EyeOutlined />}
          onClick={() => navigate(`/traitement/courriers/${record.id}`)}
        >
          Traiter
        </Button>
      )
    }
  ];

  if (error) {
    return (
      <div style={{ padding: '24px' }}>
        <Alert
          message="Erreur de chargement"
          description={error}
          type="error"
          showIcon
          action={
            <Button type="primary" onClick={fetchCourriers}>
              Réessayer
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <Row justify="space-between" align="middle" style={{ marginBottom: '24px' }}>
          <Col>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>
              Liste des courriers à traiter
            </h1>
          </Col>
          <Col>
            <Button onClick={() => navigate('/traitement/dashboard')}>
              Retour au dashboard
            </Button>
          </Col>
        </Row>

        {/* Filtres */}
        <Card style={{ marginBottom: '24px' }}>
          <Row gutter={16}>
            <Col span={8}>
              <Search
                placeholder="Rechercher par référence ou objet..."
                allowClear
                onSearch={handleSearch}
                style={{ width: '100%' }}
                prefix={<SearchOutlined />}
              />
            </Col>
            <Col span={6}>
              <Select
                placeholder="Filtrer par statut"
                style={{ width: '100%' }}
                allowClear
                onChange={(value) => handleFilterChange('statut', value)}
              >
                <Option value="prise_en_charge">Prise en charge</Option>
                <Option value="analyse">Analyse</Option>
                <Option value="redaction">Rédaction</Option>
                <Option value="validation">Validation</Option>
                <Option value="cloture">Clôturé</Option>
              </Select>
            </Col>
            <Col span={6}>
              <Select
                placeholder="Filtrer par priorité"
                style={{ width: '100%' }}
                allowClear
                onChange={(value) => handleFilterChange('priorite', value)}
              >
                <Option value="urgente">Urgente</Option>
                <Option value="haute">Haute</Option>
                <Option value="normale">Normale</Option>
                <Option value="basse">Basse</Option>
              </Select>
            </Col>
            <Col span={4}>
              <Button
                icon={<FilterOutlined />}
                onClick={() => {
                  setFilters({ statut: '', priorite: '', recherche: '' });
                  setPagination(prev => ({ ...prev, current: 1 }));
                }}
                style={{ width: '100%' }}
              >
                Réinitialiser
              </Button>
            </Col>
          </Row>
        </Card>

        {/* Tableau */}
        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={courriers}
            rowKey="id"
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: pagination.total,
              showSizeChanger: true,
              showTotal: (total, range) => `${range[0]}-${range[1]} sur ${total} courriers`,
              pageSizeOptions: ['10', '20', '50', '100']
            }}
            onChange={handleTableChange}
            scroll={{ x: 'max-content' }}
            locale={{ emptyText: 'Aucun courrier trouvé' }}
          />
        </Spin>
      </Card>
    </div>
  );
};

export default TraitementCourrierList;