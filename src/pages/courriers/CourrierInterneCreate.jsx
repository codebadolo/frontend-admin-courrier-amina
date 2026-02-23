import React, { useState, useEffect } from "react";
import { Form, Input, Button, Select, message, Typography, Space, Radio } from "antd";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const { Title } = Typography;
const { TextArea } = Input;
const API_URL = "http://localhost:8000/api/courriers/";
const API_SERVICES_URL = "http://localhost:8000/api/services/"; // si tu as un endpoint pour services

const CourrierInterneCreate = () => {
  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState([]);
  const navigate = useNavigate();

  const [form] = Form.useForm();

  // Charger les services depuis l'API
  useEffect(() => {
    const loadServices = async () => {
      try {
        const token = localStorage.getItem("token");
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const response = await axios.get(API_SERVICES_URL, config);
        setServices(response.data);
      } catch (error) {
        console.error(error);
        message.error("Impossible de charger les services");
      }
    };
    loadServices();
  }, []);

  const handleFinish = async (values) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };

      await axios.post(API_URL, values, config);

      message.success(`Courrier ${values.type} créé avec succès !`);

      form.resetFields();
      navigate("/courriers-internes"); // Retour à la liste
    } catch (error) {
      console.error(error);
      message.error("Erreur lors de la création du courrier");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 650, margin: "0 auto", padding: 24, background: "#fff", borderRadius: 8, boxShadow: "0 0 10px rgba(0,0,0,0.1)" }}>
      <Title level={3} style={{ marginBottom: 24 }}>📄 Créer un courrier</Title>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        initialValues={{ type: "interne" }}
      >
        {/* Type de courrier */}
        <Form.Item
          label="Type de courrier"
          name="type"
          rules={[{ required: true, message: "Le type est obligatoire" }]}
        >
          <Radio.Group>
            <Radio value="interne">Interne</Radio>
            <Radio value="sortant">Sortant</Radio>
          </Radio.Group>
        </Form.Item>

        {/* Référence */}
        <Form.Item
          label="Référence"
          name="reference"
          rules={[{ required: true, message: "La référence est obligatoire" }]}
        >
          <Input placeholder="Ex: CI-2026-001" />
        </Form.Item>

        {/* Objet */}
        <Form.Item
          label="Objet"
          name="objet"
          rules={[{ required: true, message: "L'objet est obligatoire" }]}
        >
          <Input placeholder="Ex: Demande de matériel" />
        </Form.Item>

        {/* Service imputé */}
        <Form.Item
          label="Service imputé"
          name="service_impute"
          rules={[{ required: true, message: "Le service est obligatoire" }]}
        >
          <Select placeholder="Sélectionnez un service" loading={services.length === 0}>
            {services.map((s) => (
              <Select.Option key={s.id} value={s.id}>
                {s.nom}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        {/* Contenu */}
        <Form.Item
          label="Contenu"
          name="contenu"
          rules={[{ required: true, message: "Le contenu est obligatoire" }]}
        >
          <TextArea rows={5} placeholder="Détail du courrier" />
        </Form.Item>

        {/* Actions */}
        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={loading}>
              Créer
            </Button>
            <Button onClick={() => navigate("/courriers-internes")}>
              Annuler
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </div>
  );
};

export default CourrierInterneCreate;