import React, { useEffect, useState } from "react";
import {
  Table,
  Button,
  Space,
  Tag,
  Input,
  Select,
  DatePicker,
  Card,
  message,
} from "antd";
import {
  PlusOutlined,
  ReloadOutlined,
  EyeOutlined,
} from "@ant-design/icons";

// import { fetchCourriers } from "../../api/courriers";
import { getServices } from "../../api/service";
import { getCategories } from "../../api/categories";
import CourrierCreateModal from "./CourrierCreateModal";
import {getCourriers} from "../../api/courriers";

const { Option } = Select;

const CourrierEntrants = () => {
  const [courriers, setCourriers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openCreate, setOpenCreate] = useState(false);

  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);

  const [filters, setFilters] = useState({
    search: "",
    service: null,
    category: null,
    statut: null,
  });

 const loadCourriers = async () => {
  setLoading(true);
  try {
    const data = await getCourriers({
      type: "entrant",
      search: filters.search,
      service: filters.service,
      category: filters.category,
      statut: filters.statut,
    });

    setCourriers(data.results || data);
  } catch (e) {
    message.error("Erreur lors du chargement des courriers");
  } finally {
    setLoading(false);
  }
};


  useEffect(() => {
    getCourriers();
  }, [filters]);

  useEffect(() => {
    getServices().then(setServices);
    getCategories().then(setCategories);
  }, []);

  const columns = [
    {
      title: "Référence",
      dataIndex: "reference",
      key: "reference",
      render: (v) => <b>{v}</b>,
    },
    {
      title: "Objet",
      dataIndex: "objet",
      key: "objet",
      ellipsis: true,
    },
    {
      title: "Service",
      dataIndex: "service_impute_name",
      key: "service",
      render: (v) => v || <Tag color="orange">Non imputé</Tag>,
    },
    {
      title: "Statut",
      dataIndex: "statut",
      key: "statut",
      render: (s) => {
        const colors = {
          recu: "blue",
          impute: "orange",
          traitement: "purple",
          repondu: "green",
          archive: "gray",
        };
        return <Tag color={colors[s]}>{s?.toUpperCase()}</Tag>;
      },
    },
    {
      title: "Reçu le",
      dataIndex: "date_reception",
      key: "date_reception",
    },
    {
      title: "Actions",
      key: "actions",
      width: 120,
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() =>
              message.info(`Voir courrier ${record.reference}`)
            }
          />
        </Space>
      ),
    },
  ];

  return (
    <Card
      title="Courriers entrants"
      extra={
        <Space>
          <Button
            icon={<ReloadOutlined />}
            onClick={getCourriers}
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setOpenCreate(true)}
          >
            Nouveau
          </Button>
        </Space>
      }
    >
      {/* FILTRES */}
      <Space style={{ marginBottom: 16 }} wrap>
        <Input.Search
          placeholder="Recherche référence / objet"
          allowClear
          onSearch={(v) =>
            setFilters({ ...filters, search: v })
          }
          style={{ width: 220 }}
        />

        <Select
          placeholder="Service"
          allowClear
          style={{ width: 180 }}
          onChange={(v) =>
            setFilters({ ...filters, service: v })
          }
        >
          {services.map((s) => (
            <Option key={s.id} value={s.id}>
              {s.nom}
            </Option>
          ))}
        </Select>

        <Select
          placeholder="Catégorie"
          allowClear
          style={{ width: 180 }}
          onChange={(v) =>
            setFilters({ ...filters, category: v })
          }
        >
          {categories.map((c) => (
            <Option key={c.id} value={c.id}>
              {c.nom}
            </Option>
          ))}
        </Select>

        <Select
          placeholder="Statut"
          allowClear
          style={{ width: 150 }}
          onChange={(v) =>
            setFilters({ ...filters, statut: v })
          }
        >
          <Option value="recu">Reçu</Option>
          <Option value="impute">Imputé</Option>
          <Option value="traitement">Traitement</Option>
          <Option value="repondu">Répondu</Option>
          <Option value="archive">Archivé</Option>
        </Select>
      </Space>

      {/* TABLE */}
      <Table
        columns={columns}
        dataSource={courriers}
        loading={loading}
        rowKey="id"
        pagination={{ pageSize: 10 }}
      />

      {/* MODAL CREATION */}
      <CourrierCreateModal
        open={openCreate}
        onClose={() => setOpenCreate(false)}
        onSuccess={getCourriers}
      />
    </Card>
  );
};

export default CourrierEntrants;
