// src/components/Layout/Header.jsx
import React, { useState } from "react";
import { 
  Layout, Button, Avatar, Dropdown, Space, Modal, Form, 
  Input, message, Badge, Tag
} from "antd";
import { 
  MenuFoldOutlined, MenuUnfoldOutlined, UserOutlined,
  LogoutOutlined, SettingOutlined, BellOutlined,
  SafetyOutlined, TeamOutlined, MailOutlined,
  PhoneOutlined, CalendarOutlined, EditOutlined
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../contexts/AuthContext";
import { useContext } from "react";
import { Descriptions, Row, Col } from "antd";

const { Header: AntHeader } = Layout;

const Header = ({ collapsed, setCollapsed, user }) => {
  const navigate = useNavigate();
  const { logout } = useContext(AuthContext);
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [form] = Form.useForm();
  
  
  // Formater le rôle pour l'affichage
  const getRoleDisplay = (role) => {
    const roleMap = {
      admin: { text: "Administrateur", color: "red" },
      chef: { text: "Chef de Service", color: "orange" },
      direction: { text: "Direction", color: "purple" },
      collaborateur: { text: "Collaborateur", color: "blue" },
      agent_courrier: { text: "Agent Courrier", color: "green" }
    };
    return roleMap[role] || { text: role, color: "default" };
  };
  
  const roleDisplay = getRoleDisplay(user?.role);

  // Menu déroulant du profil
  const profileMenuItems = [
    {
      key: 'profile',
      label: 'Mon Profil',
      icon: <UserOutlined />,
      onClick: () => setProfileModalVisible(true)
    },
    {
      type: 'divider'
    },
    {
      key: 'logout',
      label: 'Déconnexion',
      icon: <LogoutOutlined />,
      danger: true,
      onClick: () => {
        Modal.confirm({
          title: 'Déconnexion',
          content: 'Êtes-vous sûr de vouloir vous déconnecter ?',
          okText: 'Oui',
          cancelText: 'Non',
          onOk: () => {
            logout();
            navigate('/login');
          }
        });
      }
    }
  ];

  // Gérer la mise à jour du profil
  const handleProfileUpdate = async (values) => {
    try {
      // Ici vous appelleriez votre API pour mettre à jour le profil
      message.success('Profil mis à jour avec succès');
      setEditMode(false);
    } catch (error) {
      message.error('Erreur lors de la mise à jour du profil');
    }
  };

  return (
    <>
      <AntHeader
        style={{
          background: "#fff",
          height: 64,
          padding: "0 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          position: "sticky",
          top: 0,
          zIndex: 1000,
          width: "100%",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: "20px" }}
          />
          <div style={{ fontSize: 18, fontWeight: 500 }}>
            Bonjour, <span style={{ color: "#1890ff" }}>{user?.prenom}</span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          {/* Badge de notifications */}
          <Badge count={5} size="small">
            <Button
              type="text"
              icon={<BellOutlined style={{ fontSize: 18 }} />}
              shape="circle"
            />
          </Badge>

          {/* Affichage du rôle */}
          <Tag 
            color={roleDisplay.color} 
            icon={<SafetyOutlined />}
            style={{ 
              margin: 0,
              fontWeight: 500,
              padding: "4px 10px",
              borderRadius: 12
            }}
          >
            {roleDisplay.text}
          </Tag>

          {/* Menu déroulant du profil */}
          <Dropdown
            menu={{ items: profileMenuItems }}
            placement="bottomRight"
            trigger={['click']}
          >
            <Space style={{ cursor: "pointer", padding: "4px 8px", borderRadius: 8 }}>
              <Avatar 
                src="/../images.png" 
                icon={<UserOutlined />}
                size="default"
                style={{ 
                  backgroundColor: user?.role === 'admin' ? '#f5222d' : '#1890ff',
                  border: `2px solid ${user?.role === 'admin' ? '#ff7875' : '#69c0ff'}`
                }}
              />
              <div style={{ textAlign: "left" }}>
                <div style={{ fontWeight: 500, fontSize: 14 }}>
                  {user?.prenom} {user?.nom}
                </div>
                <div style={{ fontSize: 12, color: "#8c8c8c", marginTop: -40 }}>
                  {user?.email}
                </div>
              </div>
            </Space>
          </Dropdown>
        </div>
      </AntHeader>

      {/* Modal de profil */}
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <UserOutlined />
            <span>Mon Profil</span>
            {!editMode && (
              <Button 
                type="link" 
                icon={<EditOutlined />} 
                onClick={() => setEditMode(true)}
                style={{ marginLeft: 'auto' }}
              >
                Modifier
              </Button>
            )}
          </div>
        }
        open={profileModalVisible}
        onCancel={() => {
          setProfileModalVisible(false);
          setEditMode(false);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            prenom: user?.prenom,
            nom: user?.nom,
            email: user?.email,
            telephone: user?.telephone,
            service: user?.service?.nom
          }}
          onFinish={handleProfileUpdate}
        >
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
              <Avatar 
                size={80} 
                src="/../images.png"
                icon={<UserOutlined />}
                style={{ 
                  backgroundColor: user?.role === 'admin' ? '#f5222d' : '#1890ff',
                  fontSize: 32
                }}
              />
              <div>
                <h3 style={{ margin: 0 }}>
                  {user?.prenom} {user?.nom}
                </h3>
                <Tag 
                  color={roleDisplay.color} 
                  icon={<SafetyOutlined />}
                  style={{ marginTop: 2 }}
                >
                  {roleDisplay.text}
                </Tag>
              </div>
            </div>
          </div>

          {editMode ? (
            <>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="prenom"
                    label="Prénom"
                    rules={[{ required: true, message: 'Le prénom est requis' }]}
                  >
                    <Input prefix={<UserOutlined />} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="nom"
                    label="Nom"
                    rules={[{ required: true, message: 'Le nom est requis' }]}
                  >
                    <Input prefix={<UserOutlined />} />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                name="email"
                label="Email"
                rules={[
                  { required: true, message: "L'email est requis" },
                  { type: 'email', message: "Email invalide" }
                ]}
              >
                <Input prefix={<MailOutlined />} disabled />
              </Form.Item>

              <Form.Item
                name="telephone"
                label="Téléphone"
              >
                <Input prefix={<PhoneOutlined />} />
              </Form.Item>

              <Form.Item
                name="service"
                label="Service"
              >
                <Input prefix={<TeamOutlined />} disabled />
              </Form.Item>

              <div style={{ textAlign: "right", marginTop: 24 }}>
                <Space>
                  <Button onClick={() => setEditMode(false)}>
                    Annuler
                  </Button>
                  <Button type="primary" htmlType="submit">
                    Enregistrer
                  </Button>
                </Space>
              </div>
            </>
          ) : (
            <Descriptions column={1} bordered>
              <Descriptions.Item label="Prénom">
                <UserOutlined style={{ marginRight: 8 }} />
                {user?.prenom}
              </Descriptions.Item>
              <Descriptions.Item label="Nom">
                <UserOutlined style={{ marginRight: 8 }} />
                {user?.nom}
              </Descriptions.Item>
              <Descriptions.Item label="Email">
                <MailOutlined style={{ marginRight: 8 }} />
                {user?.email}
              </Descriptions.Item>
              <Descriptions.Item label="Rôle">
                <SafetyOutlined style={{ marginRight: 8 }} />
                <Tag color={roleDisplay.color}>
                  {roleDisplay.text}
                </Tag>
              </Descriptions.Item>
              {user?.telephone && (
                <Descriptions.Item label="Téléphone">
                  <PhoneOutlined style={{ marginRight: 8 }} />
                  {user?.telephone}
                </Descriptions.Item>
              )}
              {user?.service?.nom && (
                <Descriptions.Item label="Service">
                  <TeamOutlined style={{ marginRight: 8 }} />
                  {user?.service.nom}
                </Descriptions.Item>
              )}
              <Descriptions.Item label="Date d'inscription">
                <CalendarOutlined style={{ marginRight: 8 }} />
                {user?.date_joined ? new Date(user.date_joined).toLocaleDateString() : 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="Dernière connexion">
                <CalendarOutlined style={{ marginRight: 8 }} />
                {user?.last_login ? new Date(user.last_login).toLocaleString() : 'Jamais'}
              </Descriptions.Item>
            </Descriptions>
          )}
        </Form>
      </Modal>
    </>
  );
};

export default Header;