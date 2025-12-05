import React from "react";
import { Layout, Menu } from "antd";
import {
  DashboardOutlined,
  InboxOutlined,
  SendOutlined,
  SwapOutlined,
  RobotOutlined,
  FolderOpenOutlined,
  SettingOutlined,
  BarChartOutlined
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

const { Sider } = Layout;

const Sidebar = ({ userRole, collapsed }) => {
  const navigate = useNavigate();

  const menuItems = {
    admin: [
      { label: "Dashboard", icon: <DashboardOutlined />, path: "/" },
      { label: "Courriers Entrants", icon: <InboxOutlined />, path: "/courriers-entrants" },
      { label: "Courriers Sortants", icon: <SendOutlined />, path: "/courriers-sortants" },
      { label: "Workflow", icon: <SwapOutlined />, path: "/workflow" },
      { label: "IA", icon: <RobotOutlined />, path: "/ia" },
      { label: "Archives", icon: <FolderOpenOutlined />, path: "/archives" },
      { label: "Administration", icon: <SettingOutlined />, path: "/administration" },
      { label: "Rapports", icon: <BarChartOutlined />, path: "/reports" },
    ],
  };

  const items = (menuItems[userRole] || []).map((item, index) => ({
    key: index,
    icon: item.icon,
    label: item.label,
    onClick: () => navigate(item.path),
  }));

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      width={240}
      collapsedWidth={80}
      style={{ height: "100vh", position: "fixed", left: 0, top: 0 }}
    >
      <div
        className="logo"
        style={{
          height: 64,
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "flex-start",
          paddingLeft: collapsed ? 0 : 20,
          fontSize: collapsed ? 20 : 22,
          transition: "all 0.2s ease",
        }}
      >
        {collapsed ? "C" : "CourrierApp"}
      </div>

      <Menu theme="dark" mode="inline" items={items} />
    </Sider>
  );
};

export default Sidebar;
