import React, { useEffect, useState } from "react";
import { Table, message } from "antd";
import { getCourriers } from "../services/courrierService";

const CourriersInternes = () => {
  const [list, setList] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const data = await getCourriers({ type: "interne" });
        setList(data);
      } catch {
        message.error("Erreur");
      }
    })();
  }, []);

  const columns = [
    { title: "Réf.", dataIndex: "reference", key: "reference" },
    { title: "Objet", dataIndex: "objet", key: "objet" },
    { title: "Service", dataIndex: ["service_impute", "nom"], key: "service" },
    { title: "Statut", dataIndex: "statut", key: "statut" },
  ];

  return (
    <div>
      <h2>Courriers internes</h2>
      <Table dataSource={list} rowKey="id" columns={columns} />
    </div>
  );
};

export default CourriersInternes;
