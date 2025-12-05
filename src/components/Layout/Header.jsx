import React from "react";
import { Layout, Button, Avatar } from "antd";
import { MenuFoldOutlined, MenuUnfoldOutlined } from "@ant-design/icons";

const { Header: AntHeader } = Layout;

const Header = ({ collapsed, setCollapsed, user }) => {
  return (
    <AntHeader
      style={{
        background: "#fff",
        height: 64,
        padding: "0 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        position: "fixed",
        width: "100%",
        zIndex: 1000,
      }}
    >
      <Button
        type="text"
        icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        onClick={() => setCollapsed(!collapsed)}
        style={{
          fontSize: "20px",
        }}
      />

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontWeight: 600 }}>{user?.prenom} {user?.nom}</span>
        <Avatar src="/profile.png" />
      </div>
    </AntHeader>
  );
};

export default Header;
