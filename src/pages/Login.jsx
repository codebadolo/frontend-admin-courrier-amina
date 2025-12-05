import React, { useState, useContext } from "react";
import { Card, Form, Input, Button, Typography, message } from "antd";
import { useNavigate } from "react-router-dom";
import { login } from "../api/auth";
import { AuthContext } from "../contexts/AuthContext";

const { Title } = Typography;

const Login = () => {
  const [loading, setLoading] = useState(false);
  const { setUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const data = await login(values.email, values.password);
      setUser(data.user);
      message.success("Connexion réussie !");
      navigate("/");
    } catch (err) {
      message.error(err.detail || "Identifiants incorrects");
    }
    setLoading(false);
  };

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#f0f2f5",
      }}
    >
      <Card
        style={{ width: 400, padding: "20px 10px", borderRadius: 10 }}
        bordered={false}
      >
        <Title level={3} style={{ textAlign: "center", marginBottom: 30 }}>
          Connexion
        </Title>

        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: "Veuillez entrer votre email" },
              { type: "email", message: "Email invalide" },
            ]}
          >
            <Input placeholder="email@example.com" />
          </Form.Item>

          <Form.Item
            label="Mot de passe"
            name="password"
            rules={[{ required: true, message: "Veuillez entrer votre mot de passe" }]}
          >
            <Input.Password placeholder="Votre mot de passe" />
          </Form.Item>

          <Button
            type="primary"
            htmlType="submit"
            block
            loading={loading}
            style={{ marginTop: 10 }}
          >
            Se connecter
          </Button>
        </Form>
      </Card>
    </div>
  );
};

export default Login;
