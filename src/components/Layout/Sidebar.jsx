// src/components/Layout/Sidebar.jsx
import React, { useEffect, useState } from "react";
import { Layout, Menu, Avatar, Tooltip } from "antd";
import {
  DashboardOutlined,
  InboxOutlined,
  SendOutlined,
  SwapOutlined,
  RobotOutlined,
  FolderOpenOutlined,
  SettingOutlined,
  BarChartOutlined,
  HomeOutlined,
  TeamOutlined,
  AppstoreOutlined,
  CrownOutlined,
} from "@ant-design/icons";
import { useLocation, useNavigate } from "react-router-dom";

const { Sider } = Layout;

const Sidebar = ({ userRole, collapsed }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedKey, setSelectedKey] = useState("");

  useEffect(() => {
    setSelectedKey(location.pathname);
  }, [location.pathname]);

  // Permissions par rôle
  const rolePermissions = {
    admin: [
      "dashboard-admin",
      // "courriers",
      // "workflow",
      "ia",
      "archives",
      "services",
      "reports",
      "administration",
    ],
    chef: ["dashboard", "courriers", "workflow", "ia"],
    direction: ["dashboard", "courriers", "workflow", "ia", "reports", "archives"],
    collaborateur: ["dashboard", "courriers"],
    agent_courrier: ["dashboard", "courriers", "workflow", "ia"],
    archiviste: ["dashboard", "courriers", "archives", "reports"],
    
  };

  // Déterminer la couleur du rôle
  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return '#f5222d';
      case 'chef': return '#fa8c16';
      case 'direction': return '#722ed1';
      case 'collaborateur': return '#1890ff';
      case 'agent_courrier': return '#52c41a';
      case 'archiviste': return '#13c2c2';
      default: return '#8c8c8c';
    }
  };

  // Structure de menu
  const getMenuStructure = (role) => {
    const baseStructure = [
      {
        key: "dashboard",
        label: "Dashboard",
        icon: <DashboardOutlined />,
        path: "/",
      },
      {
        key: "courriers",
        label: "Gestion des Courriers",
        icon: <InboxOutlined />,
        children: [
          { key: "/courriers-entrants", label: "Courriers Entrants", icon: <InboxOutlined /> },
          { key: "/courriers-sortants", label: "Courriers Sortants", icon: <SendOutlined /> },
          { key: "/courriers-internes", label: "Courriers Internes", icon: <HomeOutlined /> },
          { key: "/imputation", label: "Imputation", icon: <SwapOutlined /> },
          { key: "/archives", label: "Archives", icon: <FolderOpenOutlined /> },
        ],
      },
      {
        key: "workflow",
        label: "Workflow",
        icon: <SwapOutlined />,
        path: "/workflow",
      },
      {
        key: "ia",
        label: "IA & Automatisation",
        icon: <RobotOutlined />,
        path: "/ia",
      },
      {
        key: "reports",
        label: "Rapports & Statistiques",
        icon: <BarChartOutlined />,
        path: "/reports",
      },
      {
        key: "administration",
        label: "Administration",
        icon: <SettingOutlined />,
        children: [
          { key: "/administration", label: "Utilisateurs", icon: <TeamOutlined /> },
          { key: "/services-admin", label: "Services", icon: <HomeOutlined /> },
          { key: "/categories", label: "Catégories", icon: <AppstoreOutlined /> },
          { key: "/rules", label: "Règles IA", icon: <RobotOutlined /> },
        ],
      },
    ];

    // Pour l'admin, ajouter dashboard admin
    if (role === "admin") {
      return [
        {
          key: "dashboard-admin",
          label: "Dashboard Admin",
          icon: <CrownOutlined style={{ color: getRoleColor(role) }} />,
          path: "/admin-dashboard",
        },
        ...baseStructure,
      ];
    }

    return baseStructure;
  };

  // Filtrer selon les permissions
  const allowedMenu = getMenuStructure(userRole).filter((item) =>
    rolePermissions[userRole]?.includes(item.key)
  );

  // Transformer en format Ant Design
  const buildMenuItems = (items) =>
    items.map((item) => {
      if (item.children) {
        return {
          key: item.key,
          icon: item.icon,
          label: item.label,
          children: item.children.map((child) => ({
            key: child.key,
            label: child.label,
            icon: child.icon,
            onClick: () => navigate(child.key),
          })),
        };
      }

      return {
        key: item.path,
        icon: item.icon,
        label: item.label,
        onClick: () => navigate(item.path),
      };
    });

  const items = buildMenuItems(allowedMenu);

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      width={250}
      collapsedWidth={80}
      style={{
        height: "100vh",
        position: "fixed",
        left: 0,
        top: 0,
        zIndex: 100,
        boxShadow: "2px 0 8px rgba(0,0,0,0.1)",
      }}
    >
      {/* Logo avec indication de rôle */}
      <div
        style={{
          height: 70,
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "space-between",
          padding: collapsed ? 0 : "0 20px",
          background: "rgba(255, 255, 255, 0.05)",
          borderBottom: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        {collapsed ? (
          <Tooltip 
            title={`${userRole?.charAt(0).toUpperCase() + userRole?.slice(1)}`} 
            placement="right"
          >
            <Avatar
              size="large"
              style={{
                backgroundColor: getRoleColor(userRole),
                cursor: "pointer",
              }}
              // icon={getRoleIcon(userRole)}
            />
          </Tooltip>
        ) : (
          <>
            <div style={{ color: "white", fontWeight: "bold", fontSize: 20 }}>
              MyCourrier
            </div>
          </>
        )}
      </div>

      {/* Indicateur de rôle en mode étendu */}
      {!collapsed && (
        <div
          style={{
            padding: "8px 20px",
            color: "rgba(255,255,255,0.8)",
            fontSize: 12,
            textTransform: "uppercase",
            borderBottom: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ 
              width: 8, 
              height: 8, 
              borderRadius: '50%', 
              backgroundColor: getRoleColor(userRole) 
            }} />
            <span>{userRole?.toUpperCase()}</span>
          </div>
        </div>
      )}

      {/* Menu principal */}
      <Menu
        theme="dark"
        mode="inline"
        items={items}
        selectedKeys={[selectedKey]}
        defaultOpenKeys={["courriers", "administration"]}
        style={{
          marginTop: 8,
          borderRight: 0,
        }}
      />
    </Sider>
  );
};

export default Sidebar;