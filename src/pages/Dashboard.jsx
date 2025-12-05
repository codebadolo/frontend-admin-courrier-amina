import React, { useEffect, useState } from "react";
import { Card, Row, Col, Statistic, Spin, message } from "antd";
import { getStats } from "../services/dashboardService";

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await getStats();
        setStats(data);
      } catch (err) {
        message.error("Impossible de charger les statistiques");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <Spin />;

  return (
    <div>
      <h2>Tableau de bord</h2>
      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic title="Courriers reçus" value={stats?.received || 0} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="En traitement" value={stats?.in_progress || 0} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="Courriers en retard" value={stats?.late || 0} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="Archivés" value={stats?.archived || 0} />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
