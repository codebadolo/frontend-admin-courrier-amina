import React from 'react';
import { Timeline, Card, Tag, Avatar, Typography, Space } from 'antd';
import {
  MailOutlined,
  UserOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  EditOutlined,
  SendOutlined,
  HistoryOutlined
} from '@ant-design/icons';

const { Text } = Typography;

const TraitementTimeline = ({ data = [], loading = false }) => {
  const getTimelineItem = (item) => {
    const iconMap = {
      reception: <MailOutlined style={{ color: '#1890ff' }} />,
      imputation: <UserOutlined style={{ color: '#722ed1' }} />,
      traitement: <FileTextOutlined style={{ color: '#52c41a' }} />,
      validation: <CheckCircleOutlined style={{ color: '#faad14' }} />,
      instruction: <EditOutlined style={{ color: '#13c2c2' }} />,
      reponse: <SendOutlined style={{ color: '#eb2f96' }} />
    };

    const statusColorMap = {
      termine: 'success',
      en_cours: 'processing',
      en_attente: 'default',
      valide: 'success',
      rejete: 'error',
      modification: 'warning',
      signe: 'success'
    };

    return {
      dot: iconMap[item.type] || <HistoryOutlined />,
      children: (
        <Card size="small" style={{ marginBottom: 8 }}>
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <Space justify="space-between" style={{ width: '100%' }}>
              <Text strong>{item.titre}</Text>
              {item.statut && (
                <Tag color={statusColorMap[item.statut] || 'default'}>
                  {item.statut?.replace('_', ' ')}
                </Tag>
              )}
            </Space>
            <Text type="secondary">{item.description}</Text>
            <Space size="middle">
              {item.auteur && (
                <Space size="small">
                  <Avatar size="small" icon={<UserOutlined />} />
                  <Text type="secondary">{item.auteur}</Text>
                </Space>
              )}
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {new Date(item.date).toLocaleString()}
              </Text>
            </Space>
          </Space>
        </Card>
      )
    };
  };

  if (loading) {
    return <Card loading={loading}><Timeline /></Card>;
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: 40 }}>
          <HistoryOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />
          <p style={{ color: '#999' }}>Aucun historique de traitement</p>
        </div>
      </Card>
    );
  }

  return (
    <Card title="Historique du traitement">
      <Timeline mode="left" items={data.map(getTimelineItem)} />
    </Card>
  );
};

export default TraitementTimeline;