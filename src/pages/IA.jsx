import React, { useEffect, useState } from "react";
import { Table, Button, message } from "antd";
import { getIAResults, processCourrier } from "../services/iaService";

const IA = () => {
  const [results, setResults] = useState([]);

  const fetch = async () => {
    try {
      const data = await getIAResults();
      setResults(data);
    } catch {
      message.error("Erreur IA");
    }
  };

  useEffect(() => { fetch(); }, []);

  const handleProcess = async (courrierId) => {
    try {
      await processCourrier(courrierId);
      message.success("Traitement lancé");
      fetch();
    } catch {
      message.error("Erreur traitement");
    }
  };

  const columns = [
    { title: "Courrier", dataIndex: ["courrier", "reference"], key: "courrier" },
    { title: "Catégorie prédite", dataIndex: ["categorie_predite", "name"], key: "categorie" },
    { title: "Service suggéré", dataIndex: ["service_suggere", "nom"], key: "service" },
    { title: "Fiabilité", dataIndex: "fiabilite", key: "fiabilite" },
    {
      title: "Actions",
      key: "actions",
      render: (_, row) => <Button onClick={() => handleProcess(row.courrier.id)}>Relancer</Button>,
    },
  ];

  return (
    <div>
      <h2>IA - résultats</h2>
      <Table dataSource={results} rowKey={(r) => r.id || r.courrier.id} columns={columns} />
    </div>
  );
};

export default IA;
