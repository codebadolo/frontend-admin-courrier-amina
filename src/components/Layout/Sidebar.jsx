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
  UserOutlined,
  FileTextOutlined,
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

  // Déterminer la couleur du rôle
  const getRoleColor = (role) => {
    switch (role) {
      case "admin": return "#f5222d";
      case "chef": return "#fa8c16";
      case "direction": return "#722ed1";
      case "collaborateur": return "#1890ff";
      case "agent_courrier": return "#52c41a";
      case "agent_service": return "#13c2c2";
      case "archiviste": return "#eb2f96";
      default: return "#8c8c8c";
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
      { key: "workflow", label: "Workflow", icon: <SwapOutlined />, path: "/workflow" },
      // { key: "ia", label: "IA & Automatisation", icon: <RobotOutlined />, path: "/ia" },
    ];

    if (["agent_service", "collaborateur", "chef", "direction", "admin"].includes(role)) {
      baseStructure.push({
        key: "traitement",
        label: "Traitement",
        icon: <FileTextOutlined />,
        path: "/traitement/dashboard",
      });
    }

    if (["admin"].includes(role)) {
      baseStructure.push({
        key: "services",
        label: "Gestion des Services",
        icon: <TeamOutlined />,
        path: "/services",
      });
    }

    if (role === "chef") {
      baseStructure.push({
        key: "chef-dashboard",
        label: "Dashboard Chef",
        icon: <CrownOutlined style={{ color: getRoleColor(role) }} />,
        path: "/chef-service/dashboard",
      });
    }

    if (role === "agent_service") {
      baseStructure.push({
        key: "agent-dashboard",
        label: "Mon Dashboard",
        icon: <UserOutlined />,
        path: "/agent-dashboard",
      });
    }

    if (["direction", "admin"].includes(role)) {
      baseStructure.push({
        key: "reports",
        label: "Rapports & Statistiques",
        icon: <BarChartOutlined />, 
        path: "/reports",
      });
    }

    if (role === 'agent_service' || role === 'collaborateur') {
      baseStructure.push({
        key: "mes-courriers",
        label: "Mes courriers à traiter",
        icon: <FileTextOutlined />,
        path: "/mes-courriers-a-traiter",
      });
    }

    if (["admin"].includes(role)) {
      baseStructure.push(
        {
          key: "administration",
          label: "Administration",
          icon: <SettingOutlined />,
          children: [
            { key: "/administration", label: "Utilisateurs", icon: <TeamOutlined /> },
            { key: "services", label: "Services", icon: <TeamOutlined />, path: "/services" },
            { key: "/categories", label: "Catégories", icon: <AppstoreOutlined /> },
            { key: "/rules", label: "Règles IA", icon: <RobotOutlined /> },
          ],
        }
      );
    }

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
        key: item.path || item.key,
        icon: item.icon,
        label: item.label,
        onClick: () => navigate(item.path || item.key),
      };
    });

  const items = buildMenuItems(getMenuStructure(userRole));

  // Hauteur des éléments fixes
  const headerHeight = 70; // Logo
  const roleHeight = collapsed ? 0 : 44; // Badge de rôle
  const footerHeight = collapsed ? 0 : 45; // Footer version
  const totalFixedHeight = headerHeight + roleHeight + footerHeight;

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      width={250}
      collapsedWidth={80}
      theme="dark"
      style={{
        height: "100vh",
        position: "fixed",
        left: 0,
        top: 0,
        bottom: 0,
        zIndex: 100,
        boxShadow: "2px 0 8px rgba(0,0,0,0.1)",
        overflow: "hidden", // Empêche le défilement sur le Sider lui-même
      }}
    >
      {/* Logo - FIXE */}
      <div
        style={{
          height: headerHeight,
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "space-between",
          padding: collapsed ? 0 : "0 20px",
          background: "#001529",
          borderBottom: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        {collapsed ? (
          <Tooltip title={userRole} placement="right">
            <Avatar
              size="large"
              style={{ backgroundColor: getRoleColor(userRole), cursor: "pointer" }}
            />
          </Tooltip>
        ) : (
          <div style={{ color: "white", fontWeight: "bold", fontSize: 20 }}>
            MyCourrier
          </div>
        )}
      </div>

      {/* Badge de rôle - FIXE (si non collapsed) */}
      {!collapsed && (
        <div
          style={{
            height: roleHeight,
            padding: "8px 20px",
            color: "rgba(255,255,255,0.8)",
            fontSize: 12,
            textTransform: "uppercase",
            borderBottom: "1px solid rgba(255,255,255,0.1)",
            background: "#001529",
            display: "flex",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: getRoleColor(userRole) }} />
            <span>{userRole?.toUpperCase()}</span>
          </div>
        </div>
      )}

      {/* Menu - SCROLLABLE */}
      <div
        style={{
          height: `calc(100vh - ${totalFixedHeight}px)`,
          overflowY: "auto",
          overflowX: "hidden",
          background: "#001529",
        }}
        className="sidebar-menu-container"
      >
        <Menu
          theme="dark"
          mode="inline"
          items={items}
          selectedKeys={[selectedKey]}
          defaultOpenKeys={["courriers", "administration"]}
          style={{
            borderRight: 0,
            background: "transparent",
          }}
        />
      </div>

      {/* Footer - FIXE (si non collapsed) */}
      {!collapsed && (
        <div
          style={{
            height: footerHeight,
            padding: "12px 16px",
            borderTop: "1px solid rgba(255,255,255,0.1)",
            color: "rgba(255,255,255,0.5)",
            fontSize: 12,
            textAlign: "center",
            background: "#001529",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          Version 1.0.0
        </div>
      )}
    </Sider>
  );
};

export default Sidebar;