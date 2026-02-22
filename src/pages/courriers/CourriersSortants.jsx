import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Table, Button, Space, Modal, Form, Input, Upload,
  DatePicker, Select, message, Spin, Card, Tag, Row, Col, Badge, Descriptions, Tooltip
} from "antd";
import {
  PlusOutlined, ReloadOutlined, UploadOutlined, SearchOutlined,
  EyeOutlined, EditOutlined, DeleteOutlined, FilterOutlined,
  SendOutlined, FileTextOutlined, MailOutlined, PhoneOutlined,
  EnvironmentOutlined, ClockCircleOutlined, TeamOutlined, UserOutlined
} from "@ant-design/icons";
import { getServices } from "../../api/service";
import { getCategories } from "../../api/categories";
import { 
  fetchCourriers, 
  createCourrier, 
  updateCourrier, 
  deleteCourrier,
  checkAuth 
} from "../../services/courrierService";
import dayjs from "dayjs";

const { Option } = Select;
const { TextArea } = Input;

const CourriersSortants = () => {
  const [courriers, setCourriers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState("");
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    service: null,
    category: null,
    priorite: null,
    statut: null,
  });

  // Fonction pour récupérer le nom de la catégorie
  const getCategorieName = (categoryData) => {
    if (!categoryData) return null;
    
    // Si c'est un objet avec 'name'
    if (typeof categoryData === 'object' && categoryData.name) {
      return categoryData.name;
    }
    
    // Si c'est un objet avec 'nom'
    if (typeof categoryData === 'object' && categoryData.nom) {
      return categoryData.nom;
    }
    
    // Si c'est un ID (nombre ou chaîne)
    if (typeof categoryData === 'number' || typeof categoryData === 'string') {
      const categorie = categories.find(c => c.name === Number(categoryData));
      return categorie ? categorie.nom : null;
    }
    
    return null;
  };

  // Fonction pour récupérer le nom du service
  const getServiceName = (serviceData) => {
    if (!serviceData) return null;
    
    if (typeof serviceData === 'object' && serviceData.nom) {
      return serviceData.nom;
    }
    
    if (typeof serviceData === 'number' || typeof serviceData === 'string') {
      const service = services.find(s => s.id === Number(serviceData));
      return service ? service.nom : null;
    }
    
    return null;
  };

  /* =======================
     CHARGEMENT DES DONNÉES
  ======================= */
  const loadCourriers = async () => {
    setLoading(true);
    try {
      const params = {
        type: "sortant",
        search: searchText,
        ...filters
      };
      
      const data = await fetchCourriers(params);
      setCourriers(data.results || data);
    } catch (error) {
      console.error("Erreur:", error);
      if (error.response?.status === 401) {
        message.error("Session expirée. Veuillez vous reconnecter");
      } else {
        message.error("Erreur lors du chargement des courriers");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!checkAuth()) {
      message.error("Veuillez vous connecter");
    }
    
    loadCourriers();
    
    // Charger services et catégories
    const loadReferences = async () => {
      try {
        const [servicesData, categoriesData] = await Promise.all([
          getServices(),
          getCategories()
        ]);
        setServices(servicesData);
        setCategories(categoriesData);
      } catch (error) {
        console.error("Erreur chargement références:", error);
      }
    };
    
    loadReferences();
  }, [filters]);

  /* =======================
     CRÉATION / MODIFICATION
  ======================= */
  const handleSaveCourrier = async (values) => {
    try {
      setLoading(true);

      const payload = {
        objet: values.objet,
        destinataire_nom: values.destinataire_nom,
        destinataire_adresse: values.destinataire_adresse || "",
        destinataire_email: values.destinataire_email || "",
        date_envoi: values.date_envoi.format("YYYY-MM-DD"),
        canal: values.canal,
        confidentialite: values.confidentialite,
        type: "sortant",
        category: values.category,
        service_impute: values.service_id,
        priorite: values.priorite,
        contenu_texte: values.contenu_texte || "",
      };

      if (editingId) {
        await updateCourrier(editingId, payload);
        message.success("Courrier modifié avec succès");
      } else {
        await createCourrier(payload);
        message.success("Courrier créé avec succès");
      }

      setOpenModal(false);
      setEditingId(null);
      form.resetFields();
      loadCourriers();
    } catch (error) {
      console.error("Erreur opération:", error);
      const errorMsg = error.response?.data?.detail || 
                      error.response?.data?.message || 
                      "Erreur lors de l'opération";
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  /* =======================
     SUPPRESSION
  ======================= */
  const handleDelete = async (id) => {
    Modal.confirm({
      title: "Confirmer la suppression",
      content: "Voulez-vous vraiment supprimer ce courrier ? Cette action est irréversible.",
      okText: "Oui, supprimer",
      cancelText: "Annuler",
      okType: "danger",
      maskClosable: true,
      onOk: async () => {
        try {
          await deleteCourrier(id);
          message.success("Courrier supprimé avec succès");
          loadCourriers();
        } catch (error) {
          message.error("Erreur lors de la suppression");
        }
      },
    });
  };

  /* =======================
     VISUALISATION DÉTAILLÉE
  ======================= */
  const handleView = (courrier) => {
    const categorieName = getCategorieName(courrier.category);
    const serviceName = getServiceName(courrier.service_impute);
    
    Modal.info({
      title: (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <SendOutlined />
          <span>Détails du courrier sortant</span>
          <Tag color="blue">{courrier.reference}</Tag>
        </div>
      ),
      width: 800,
      maskClosable: true,
      content: (
        <div style={{ marginTop: 20 }}>
          <Card size="small" style={{ marginBottom: 16 }}>
            <h4 style={{ marginBottom: 16, color: '#1890ff' }}>{courrier.objet}</h4>
            
            <Row gutter={16}>
              <Col span={12}>
                <Descriptions column={1} size="small">
                  <Descriptions.Item label={<><UserOutlined /> Destinataire</>}>
                    <b>{courrier.destinataire_nom}</b>
                  </Descriptions.Item>
                  {courrier.destinataire_email && (
                    <Descriptions.Item label={<><MailOutlined /> Email</>}>
                      <a href={`mailto:${courrier.destinataire_email}`}>
                        {courrier.destinataire_email}
                      </a>
                    </Descriptions.Item>
                  )}
                  {courrier.destinataire_telephone && (
                    <Descriptions.Item label={<><PhoneOutlined /> Téléphone</>}>
                      {courrier.destinataire_telephone}
                    </Descriptions.Item>
                  )}
                </Descriptions>
              </Col>
              
              <Col span={12}>
                <Descriptions column={1} size="small">
                  <Descriptions.Item label={<><ClockCircleOutlined /> Date envoi</>}>
                    {dayjs(courrier.date_envoi).format('DD/MM/YYYY')}
                  </Descriptions.Item>
                  <Descriptions.Item label={<><TeamOutlined /> Service</>}>
                    <Tag color="green">{serviceName || "Non imputé"}</Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Catégorie">
                    <Tag color="blue">{categorieName || "Non classé"}</Tag>
                  </Descriptions.Item>
                </Descriptions>
              </Col>
            </Row>
            
            {courrier.destinataire_adresse && (
              <div style={{ marginTop: 16 }}>
                <h5><EnvironmentOutlined /> Adresse</h5>
                <p style={{ margin: 0 }}>{courrier.destinataire_adresse}</p>
              </div>
            )}
            
            {courrier.contenu_texte && (
              <div style={{ marginTop: 16 }}>
                <h5><FileTextOutlined /> Contenu</h5>
                <div style={{ 
                  padding: 12, 
                  backgroundColor: '#fafafa', 
                  borderRadius: 4,
                  maxHeight: 200,
                  overflowY: 'auto'
                }}>
                  {courrier.contenu_texte}
                </div>
              </div>
            )}
            
            <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Tag color={
                courrier.priorite === 'urgente' ? 'red' :
                courrier.priorite === 'haute' ? 'orange' :
                courrier.priorite === 'normale' ? 'blue' : 'green'
              }>
                Priorité: {courrier.priorite}
              </Tag>
              <Tag color={
                courrier.statut === 'envoye' ? 'green' :
                courrier.statut === 'en_cours' ? 'blue' :
                courrier.statut === 'brouillon' ? 'gray' : 'orange'
              }>
                Statut: {courrier.statut}
              </Tag>
              <Tag color="purple">Canal: {courrier.canal}</Tag>
              <Tag color={
                courrier.confidentialite === 'confidentielle' ? 'red' :
                courrier.confidentialite === 'restreinte' ? 'orange' : 'blue'
              }>
                {courrier.confidentialite}
              </Tag>
            </div>
          </Card>
        </div>
      ),
    });
  };

  /* =======================
     MODIFICATION
  ======================= */
  const handleEdit = (courrier) => {
    setEditingId(courrier.id);
    setOpenModal(true);
    
    form.setFieldsValue({
      objet: courrier.objet,
      destinataire_nom: courrier.destinataire_nom,
      destinataire_adresse: courrier.destinataire_adresse,
      destinataire_email: courrier.destinataire_email,
      destinataire_telephone: courrier.destinataire_telephone,
      date_envoi: courrier.date_envoi ? dayjs(courrier.date_envoi) : null,
      canal: courrier.canal,
      confidentialite: courrier.confidentialite,
      priorite: courrier.priorite,
      category: courrier.category?.id || courrier.category,
      service_id: courrier.service_impute?.id || courrier.service_impute,
      contenu_texte: courrier.contenu_texte || "",
    });
  };

  /* =======================
     COLONNES DU TABLEAU
  ======================= */
  const columns = [
    {
      title: "Référence",
      dataIndex: "reference",
      render: (reference) => (
        <Tag color="blue" style={{ fontWeight: 500 }}>
          {reference}
        </Tag>
      ),
      sorter: (a, b) => a.reference.localeCompare(b.reference),
      width: 120,
    },
    {
      title: "Objet",
      dataIndex: "objet",
      ellipsis: true,
      render: (objet, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>{objet}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {record.destinataire_nom}
            {record.destinataire_email && ` • ${record.destinataire_email}`}
          </div>
        </div>
      ),
    },
    {
      title: "Catégorie",
      render: (_, record) => {
        const categorieName = getCategorieName(record.category);
        return (
          <Tag color="blue">
            {categorieName || "Non classé"}
          </Tag>
        );
      },
      width: 150,
      filters: categories.map(cat => ({ text: cat.nom, value: cat.id })),
      onFilter: (value, record) => {
        const categorieId = record.category?.id || record.category;
        return categorieId === value;
      },
    },
    {
      title: "Service",
      render: (_, record) => {
        const serviceName = getServiceName(record.service_impute);
        return (
          <Tag color="green">
            {serviceName || "Non imputé"}
          </Tag>
        );
      },
      width: 150,
      filters: services.map(service => ({ text: service.nom, value: service.id })),
      onFilter: (value, record) => {
        const serviceId = record.service_impute?.id || record.service_impute;
        return serviceId === value;
      },
    },
    {
      title: "Priorité",
      dataIndex: "priorite",
      render: (priorite) => {
        const config = {
          urgente: { color: 'red', icon: '🔥' },
          haute: { color: 'orange', icon: '⚠️' },
          normale: { color: 'blue', icon: '📄' },
          basse: { color: 'green', icon: '📋' }
        };
        const cfg = config[priorite] || config.normale;
        return (
          <Tag color={cfg.color}>
            {cfg.icon} {priorite}
          </Tag>
        );
      },
      width: 120,
      filters: [
        { text: 'Urgente', value: 'urgente' },
        { text: 'Haute', value: 'haute' },
        { text: 'Normale', value: 'normale' },
        { text: 'Basse', value: 'basse' }
      ],
      onFilter: (value, record) => record.priorite === value,
    },
    {
      title: "Date envoi",
      dataIndex: "date_envoi",
      render: (date) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <ClockCircleOutlined style={{ color: '#666' }} />
          {dayjs(date).format('DD/MM/YYYY')}
        </div>
      ),
      sorter: (a, b) => new Date(a.date_envoi) - new Date(b.date_envoi),
      width: 130,
    },
    {
      title: "Statut",
      dataIndex: "statut",
      render: (statut) => {
        const config = {
          envoye: { color: 'success', text: 'Envoyé' },
          en_cours: { color: 'processing', text: 'En cours' },
          brouillon: { color: 'default', text: 'Brouillon' },
          annule: { color: 'error', text: 'Annulé' }
        };
        const cfg = config[statut] || { color: 'default', text: statut };
        return <Tag color={cfg.color}>{cfg.text}</Tag>;
      },
      width: 120,
      filters: [
        { text: 'Envoyé', value: 'envoye' },
        { text: 'En cours', value: 'en_cours' },
        { text: 'Brouillon', value: 'brouillon' },
        { text: 'Annulé', value: 'annule' }
      ],
      onFilter: (value, record) => record.statut === value,
    },
    {
      title: "Actions",
      key: "actions",
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Voir détails">
            <Button
              size="small"
              type="text"
              icon={<EyeOutlined />}
              onClick={() => handleView(record)}
            />
          </Tooltip>
          <Tooltip title="Modifier">
            <Button
              size="small"
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Tooltip title="Supprimer">
            <Button
              size="small"
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record.id)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  /* =======================
     RENDU PRINCIPAL
  ======================= */
  return (
    <Card
      title={
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <SendOutlined />
          <span>Courriers sortants</span>
          <Badge 
            count={courriers.length} 
            style={{ backgroundColor: '#1890ff', marginLeft: 8 }}
            showZero 
          />
        </div>
      }
      extra={
        <Space>
          <Button 
            icon={<ReloadOutlined />} 
            onClick={loadCourriers}
            disabled={loading}
          >
            Actualiser
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate("/courriers-sortants/redaction")}  // ← REDIRECTION ICI
          >
            Nouveau courrier
          </Button>
        </Space>
      }
    >
      {/* BARRE DE FILTRES */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col flex="auto">
            <Input.Search
              placeholder="Rechercher par objet, référence, destinataire..."
              allowClear
              enterButton={<SearchOutlined />}
              onSearch={(value) => {
                setSearchText(value);
                loadCourriers();
              }}
              style={{ width: 400 }}
            />
          </Col>
          <Col>
            <Space wrap>
              <Select
                placeholder="Filtrer par catégorie"
                allowClear
                style={{ width: 180 }}
                onChange={(value) => setFilters({...filters, category: value})}
                loading={categories.length === 0}
              >
                {categories.map(c => (
                  <Option key={c.name} value={c.name}>{c.nom}</Option>
                ))}
              </Select>
              <Select
                placeholder="Filtrer par service"
                allowClear
                style={{ width: 180 }}
                onChange={(value) => setFilters({...filters, service: value})}
                loading={services.length === 0}
              >
                {services.map(s => (
                  <Option key={s.id} value={s.id}>{s.nom}</Option>
                ))}
              </Select>
              <Select
                placeholder="Filtrer par priorité"
                allowClear
                style={{ width: 150 }}
                onChange={(value) => setFilters({...filters, priorite: value})}
              >
                <Option value="urgente">Urgente</Option>
                <Option value="haute">Haute</Option>
                <Option value="normale">Normale</Option>
                <Option value="basse">Basse</Option>
              </Select>
              <Button
                icon={<FilterOutlined />}
                onClick={() => {
                  setFilters({ service: null, category: null, priorite: null, statut: null });
                  setSearchText("");
                }}
              >
                Réinitialiser
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* TABLEAU DES COURRIERS */}
      <Spin spinning={loading} tip="Chargement des courriers...">
        <Table
          rowKey="id"
          columns={columns}
          dataSource={courriers}
          pagination={{ 
            pageSize: 10, 
            showSizeChanger: true,
            showTotal: (total) => `Total: ${total} courriers`,
            showQuickJumper: true
          }}
          scroll={{ x: 1300 }}
          locale={{ emptyText: "Aucun courrier sortant trouvé" }}
        />
      </Spin>

      {/* MODAL DE CRÉATION/MODIFICATION */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {editingId ? <EditOutlined /> : <PlusOutlined />}
            <span>{editingId ? 'Modifier le courrier' : 'Nouveau courrier sortant'}</span>
          </div>
        }
        open={openModal}
        onCancel={() => {
          setOpenModal(false);
          setEditingId(null);
          form.resetFields();
        }}
        footer={null}
        width={800}
        destroyOnClose
      >
        <Form
          layout="vertical"
          form={form}
          onFinish={handleSaveCourrier}
          initialValues={{
            canal: "email",
            confidentialite: "normale",
            priorite: "normale"
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="objet"
                label="Objet du courrier"
                rules={[{ required: true, message: "L'objet est obligatoire" }]}
              >
                <Input placeholder="Saisir l'objet du courrier" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="destinataire_nom"
                label="Nom du destinataire"
                rules={[{ required: true, message: "Le destinataire est obligatoire" }]}
              >
                <Input placeholder="Nom complet du destinataire" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="destinataire_email"
                label="Email du destinataire"
                rules={[{ type: 'email', message: "Format d'email invalide" }]}
              >
                <Input placeholder="email@exemple.com" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="destinataire_telephone"
                label="Téléphone"
              >
                <Input placeholder="+226 XX XX XX XX" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="destinataire_adresse"
            label="Adresse complète"
          >
            <TextArea rows={2} placeholder="Adresse postale complète" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="date_envoi"
                label="Date d'envoi"
                rules={[{ required: true, message: "La date est obligatoire" }]}
              >
                <DatePicker 
                  style={{ width: "100%" }} 
                  format="DD/MM/YYYY"
                  placeholder="Sélectionner une date"
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="canal" label="Canal">
                <Select>
                  <Option value="email">Email</Option>
                  <Option value="physique">Physique</Option>
                  <Option value="portail">Portail</Option>
                  <Option value="telephone">Téléphone</Option>
                  <Option value="courrier">Courrier postal</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="confidentialite" label="Confidentialité">
                <Select>
                  <Option value="normale">Normale</Option>
                  <Option value="restreinte">Restreinte</Option>
                  <Option value="confidentielle">Confidentielle</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="priorite" label="Priorité">
                <Select>
                  <Option value="urgente">Urgente</Option>
                  <Option value="haute">Haute</Option>
                  <Option value="normale">Normale</Option>
                  <Option value="basse">Basse</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item 
                name="category" 
                label="Catégorie"
                rules={[{ required: true, message: "La catégorie est obligatoire" }]}
              >
                <Select 
                  placeholder="Sélectionner une catégorie"
                  loading={categories.length === 0}
                >
                  {categories.map((c) => (
                    <Option key={c.name} value={c.name}>
                      {c.nom}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="service_id"
                label="Service imputé"
                rules={[{ required: true, message: "Le service est obligatoire" }]}
              >
                <Select 
                  placeholder="Sélectionner un service"
                  loading={services.length === 0}
                >
                  {services.map(s => (
                    <Option key={s.id} value={s.id}>{s.nom}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="contenu_texte"
            label="Contenu du courrier"
          >
            <TextArea 
              rows={4} 
              placeholder="Résumé ou contenu du courrier..." 
              showCount 
              maxLength={1000}
            />
          </Form.Item>

          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Space>
              <Button 
                onClick={() => {
                  setOpenModal(false);
                  setEditingId(null);
                }}
              >
                Annuler
              </Button>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={loading}
                icon={editingId ? <EditOutlined /> : <SendOutlined />}
              >
                {editingId ? 'Modifier' : 'Enregistrer'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default CourriersSortants;