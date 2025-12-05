import React, { useContext, useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { AuthContext } from "../../contexts/AuthContext";
import { Layout as AntLayout } from "antd";

const { Content } = AntLayout;

const LayoutApp = () => {
  const { user } = useContext(AuthContext);

  // Toggle sidebar
  const [collapsed, setCollapsed] = useState(false);

  return (
    <AntLayout style={{ minHeight: "100vh" }}>
      {/* Sidebar collapsable */}
      <Sidebar collapsed={collapsed} userRole={user?.role} />

      <AntLayout
        style={{
          marginLeft: collapsed ? 80 : 240, // adaptation du content
          transition: "all 0.2s ease",
        }}
      >
        {/* Header avec bouton toggle */}
        <Header collapsed={collapsed} setCollapsed={setCollapsed} user={user} />

        <Content style={{ margin: "90px 20px 20px 20px" }}>
          <Outlet />
        </Content>
      </AntLayout>
    </AntLayout>
  );
};

export default LayoutApp;
