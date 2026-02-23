import React, { useEffect, useState } from "react";
import {
  Table,
  Button,
  Space,
  Tag,
  Typography,
  message,
} from "antd";
import {
  PlusOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import CourrierCreateModal from "./CourrierCreateModal";

const { Title } = Typography;

const API_URL = "http://localhost:8000/api/courriers/";

const CourriersInternes = () => {
  const [courriers, setCourriers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openModal, setOpenModal] = useState(false);

  const navigate = useNavigate();

  // ----------------------------
  // Charger les courriers internes (filtrage BACKEND)
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

    // Si la réponse est un tableau
    if (Array.isArray(response.data)) {
      data = response.data;
    }
    // Si la réponse a un champ results (pagination DRF)
    else if (Array.isArray(response.data.results)) {
      data = response.data.results;
    } 
    // Sinon rien ou objet unique → ignorer

    setCourriers(data);
  } catch (error) {
    console.error(error);
    message.error("Erreur lors du chargement des courriers internes");
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    loadCourriers();
  }, []);

  // ----------------------------
  // Colonnes du tableau
  // ----------------------------
  const columns = [
    {
      title: "Référence",
      dataIndex: "reference",
      key: "reference",
      width: 160,
      render: (v) => v || "-",
    },
    {
      title: "Objet",
      dataIndex: "objet",
      key: "objet",
      ellipsis: true,
      render: (v) => v || "-",
    },
    {
      title: "Service",
      dataIndex: ["service_impute", "nom"],
      key: "service",
      render: (value) => value || "-",
    },
    {
      title: "Statut",
      dataIndex: "statut",
      key: "statut",
      width: 130,
      render: (statut) => {
        if (!statut) return <Tag>-</Tag>;

        let color = "default";
        if (statut === "recu") color = "blue";
        if (statut === "traitement") color = "orange";
        if (statut === "repondu") color = "green";
        if (statut === "archive") color = "gray";

        return <Tag color={color}>{statut.toUpperCase()}</Tag>;
      },
    },
    {
      title: "Date",
      dataIndex: "created_at",
      key: "date",
      width: 140,
      render: (date) =>
        date ? new Date(date).toLocaleDateString() : "-",
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
              navigate(`/courriers-internes/${record.id}`)
            }
          />
        </Space>
      ),
    },
  ];

  return (
    <>
      {/* Header */}
      <Space
        style={{
          width: "100%",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <Title level={4} style={{ margin: 0 }}>
          Courriers internes
        </Title>
<<<<<<< HEAD

     <Button
  type="primary"
  icon={<PlusOutlined />}
  onClick={() => navigate("/courriers-internes/creer")}
>
  Nouveau courrier interne
</Button>
=======
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setOpenModal(true)}
        >
          Nouveau courrier interne
        </Button>
>>>>>>> origin/main
      </Space>

      {/* Table */}
      <Table
        rowKey="id"
        columns={columns}
        dataSource={courriers}
        loading={loading}
        bordered
        size="middle"
        locale={{ emptyText: "Aucun courrier interne" }}
      />

      {/* Modal de création */}
      <CourrierCreateModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        onSuccess={() => {
          setOpenModal(false);
          loadCourriers();
        }}
        defaultType="interne"
      />
    </>
  );
};

export default CourriersInternes;