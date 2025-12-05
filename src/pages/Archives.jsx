import React, { useEffect, useState } from "react";
import { Card, Row, Col, message } from "antd";
import { getReports } from "../services/dashboardService";

const Reports = () => {
  const [reports, setReports] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const data = await getReports();
        setReports(data);
      } catch {
        message.error("Erreur chargement rapports");
      }
    })();
  }, []);

  return (
    <div>
      <h2>Rapports</h2>
      <Row gutter={16}>
        {reports.map((r) => (
          <Col span={8} key={r.id}>
            <Card title={r.titre}>
              <p>Période: {r.periode_debut} → {r.periode_fin}</p>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default Reports;
