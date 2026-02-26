import React, { useEffect, useState } from "react";
import {
  Table,
  Button,
  Space,
  Tag,
  Typography,
  message,
  Tooltip,
  Badge,
  Row,
  Col,
  Select,
  Input,
  Card
} from "antd";
import {
  PlusOutlined,
  EyeOutlined,
  ReloadOutlined,
  SearchOutlined,
  FilterOutlined,
  TeamOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { Option } = Select;
const { Search } = Input;

const API_URL = "http://localhost:8000/api/courriers/courriers/";

const CourriersInternes = () => {
  const [courriers, setCourriers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filteredCourriers, setFilteredCourriers] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [serviceFilter, setServiceFilter] = useState("");
  const [services, setServices] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    recu: 0,
    traitement: 0,
    repondu: 0,
    archive: 0
  });

  const navigate = useNavigate();

  // ----------------------------
  // Charger les services
  // ----------------------------
  const loadServices = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("http://localhost:8000/api/core/services/", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setServices(response.data);
    } catch (error) {
      console.error("Erreur chargement services:", error);
    }
  };

  // ----------------------------
  // Charger les courriers internes
  // ----------------------------
  const loadCourriers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(API_URL, {
        params: {
          type: "interne",
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      let data = [];
      if (Array.isArray(response.data)) {
        data = response.data;
      } else if (Array.isArray(response.data.results)) {
        data = response.data.results;
      }

      setCourriers(data);
      filterCourriers(data, searchText, statusFilter, serviceFilter);
      
      // Calculer les statistiques
      const stats = {
        total: data.length,
        recu: data.filter(c => c.statut === 'recu').length,
        traitement: data.filter(c => c.statut === 'traitement').length,
        repondu: data.filter(c => c.statut === 'repondu').length,
        archive: data.filter(c => c.statut === 'archive').length
      };
      setStats(stats);
      
    } catch (error) {
      console.error(error);
      message.error("Erreur lors du chargement des courriers internes");
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------
  // Filtrer les courriers
  // ----------------------------
  const filterCourriers = (data, search, status, service) => {
    let filtered = [...data];
    
    if (search) {
      filtered = filtered.filter(c => 
        c.objet?.toLowerCase().includes(search.toLowerCase()) ||
        c.reference?.toLowerCase().includes(search.toLowerCase()) ||
        c.contenu_texte?.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    if (status) {
      filtered = filtered.filter(c => c.statut === status);
    }
    
    if (service) {
      filtered = filtered.filter(c => 
        c.service_impute?.id === parseInt(service) ||
        c.service_actuel?.id === parseInt(service)
      );
    }
    
    setFilteredCourriers(filtered);
  };

  useEffect(() => {
    loadCourriers();
    loadServices();
  }, []);

  useEffect(() => {
    filterCourriers(courriers, searchText, statusFilter, serviceFilter);
  }, [searchText, statusFilter, serviceFilter, courriers]);

  // ----------------------------
  // Obtenir la couleur du statut
  // ----------------------------
  const getStatusColor = (statut) => {
    const colors = {
      recu: 'blue',
      traitement: 'orange',
      repondu: 'green',
      archive: 'gray',
      valide: 'purple',
      rejete: 'red'
    };
    return colors[statut] || 'default';
  };

  const getStatusIcon = (statut) => {
    const icons = {
      recu: <ClockCircleOutlined />,
      traitement: <ClockCircleOutlined />,
      repondu: <CheckCircleOutlined />,
      archive: <FileTextOutlined />,
      valide: <CheckCircleOutlined />
    };
    return icons[statut] || null;
  };

  const getStatusLabel = (statut) => {
    const labels = {
      recu: 'Reçu',
      traitement: 'En traitement',
      repondu: 'Traité',
      archive: 'Archivé',
      valide: 'Validé',
      rejete: 'Rejeté'
    };
    return labels[statut] || statut;
  };

  // ----------------------------
  // Colonnes du tableau
  // ----------------------------
  const columns = [
    {
      title: "Référence",
      dataIndex: "reference",
      key: "reference",
      width: 140,
      render: (v) => <Tag color="blue">{v || '-'}</Tag>,
      sorter: (a, b) => (a.reference || '').localeCompare(b.reference || ''),
    },
    {
      title: "Objet",
      dataIndex: "objet",
      key: "objet",
      ellipsis: true,
      render: (v, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{v || '-'}</Text>
          {record.created_by_detail && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              De: {record.created_by_detail.prenom} {record.created_by_detail.nom}
            </Text>
          )}
        </Space>
      ),
    },
    {
      title: "Service destinataire",
      dataIndex: ["service_impute", "nom"],
      key: "service",
      width: 180,
      render: (value, record) => (
        <Space>
          <TeamOutlined style={{ color: '#1890ff' }} />
          <span>{value || record.service_actuel?.nom || '-'}</span>
        </Space>
      ),
    },
    {
      title: "Statut",
      dataIndex: "statut",
      key: "statut",
      width: 130,
      render: (statut) => (
        <Tag color={getStatusColor(statut)} icon={getStatusIcon(statut)}>
          {getStatusLabel(statut)}
        </Tag>
      ),
      filters: [
        { text: 'Reçu', value: 'recu' },
        { text: 'En traitement', value: 'traitement' },
        { text: 'Traité', value: 'repondu' },
        { text: 'Archivé', value: 'archive' },
      ],
      onFilter: (value, record) => record.statut === value,
    },
    {
      title: "Priorité",
      dataIndex: "priorite",
      key: "priorite",
      width: 100,
      render: (priorite) => {
        const colors = {
          urgente: 'red',
          haute: 'orange',
          normale: 'blue',
          basse: 'green'
        };
        return <Tag color={colors[priorite] || 'default'}>{priorite || 'normale'}</Tag>;
      },
    },
    {
      title: "Date",
      dataIndex: "created_at",
      key: "date",
      width: 120,
      render: (date) => dayjs(date).format('DD/MM/YYYY'),
      sorter: (a, b) => dayjs(a.created_at).unix() - dayjs(b.created_at).unix(),
    },
    {
      title: "Échéance",
      dataIndex: "date_echeance",
      key: "echeance",
      width: 100,
      render: (date) => {
        if (!date) return '-';
        const isLate = dayjs(date).isBefore(dayjs());
        return (
          <Tag color={isLate ? 'red' : 'green'}>
            {dayjs(date).format('DD/MM')}
          </Tag>
        );
      },
    },
    {
      title: "Actions",
      key: "actions",
      width: 100,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Tooltip title="Voir les détails">
            <Button
              size="small"
              type="primary"
              icon={<EyeOutlined />}
              onClick={() => navigate(`/courriers-internes/${record.id}`)}
            />
          </Tooltip>
          {record.besoin_validation && record.statut === 'recu' && (
            <Tooltip title="À valider">
              <Badge dot color="orange">
                <Button size="small" icon={<CheckCircleOutlined />} />
              </Badge>
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      {/* Header avec statistiques */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col span={12}>
            <Space size="large">
              <Title level={3} style={{ margin: 0 }}>
                📄 Courriers internes
              </Title>
              <Tag color="blue" style={{ fontSize: 14, padding: '4px 12px' }}>
                Total: {stats.total}
              </Tag>
            </Space>
          </Col>
          <Col span={12} style={{ textAlign: 'right' }}>
            <Space>
              <Button 
                icon={<ReloadOutlined />} 
                onClick={loadCourriers}
              >
                Actualiser
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => navigate("/courriers-internes/creer")}
              >
                Nouveau courrier interne
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Filtres */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col flex="auto">
            <Search
              placeholder="Rechercher par objet, référence..."
              allowClear
              enterButton={<SearchOutlined />}
              onSearch={(value) => setSearchText(value)}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: '100%' }}
            />
          </Col>
          <Col>
            <Space>
              <Select
                placeholder="Filtrer par statut"
                allowClear
                style={{ width: 150 }}
                onChange={setStatusFilter}
              >
                <Option value="recu">Reçu</Option>
                <Option value="traitement">En traitement</Option>
                <Option value="repondu">Traité</Option>
                <Option value="archive">Archivé</Option>
              </Select>
              <Select
                placeholder="Filtrer par service"
                allowClear
                style={{ width: 200 }}
                onChange={setServiceFilter}
              >
                {services.map(s => (
                  <Option key={s.id} value={s.id}>{s.nom}</Option>
                ))}
              </Select>
              <Button 
                icon={<FilterOutlined />}
                onClick={() => {
                  setSearchText('');
                  setStatusFilter('');
                  setServiceFilter('');
                }}
              >
                Réinitialiser
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Tableau */}
     
        <Table
          rowKey="id"
          columns={columns}
          dataSource={filteredCourriers}
          loading={loading}
          bordered
          size="middle"
          locale={{ emptyText: "Aucun courrier interne trouvé" }}
          pagination={{ 
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total: ${total} courriers`,
            showQuickJumper: true
          }}
          scroll={{ x: 1200 }}
        />
    </div>
  );
};

export default CourriersInternes;