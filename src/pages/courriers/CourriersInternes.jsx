import React, { useEffect, useState } from "react";
import { Table, Button, Space, Tag, Typography, message } from "antd";
import { PlusOutlined, EyeOutlined } from "@ant-design/icons";

import { getCourriers } from "../../api/courriers";
import CourrierCreateModal from "./CourrierCreateModal";

const { Title } = Typography;

const CourriersInternes = () => {
  const [courriers, setCourriers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openModal, setOpenModal] = useState(false);

  // ----------------------------
  // Charger les courriers internes
  // ----------------------------
  const loadCourriers = async () => {
    setLoading(true);
    try {
      const data = await getCourriers();

      // Filtrer uniquement les courriers internes
      const internes = data.filter(
        (c) => c.type === "interne"
      );

      setCourriers(internes);
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
    },
    {
      title: "Objet",
      dataIndex: "objet",
      key: "objet",
      ellipsis: true,
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
              message.info(`Voir courrier ${record.reference}`)
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
          📄 Courriers internes
        </Title>

        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setOpenModal(true)}
        >
          Nouveau courrier interne
        </Button>
      </Space>

      {/* Table */}
      <Table
        rowKey="id"
        columns={columns}
        dataSource={courriers}
        loading={loading}
        bordered
        size="middle"
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
