import React, { useEffect, useState } from "react";
import { Table, Button, Space, Modal, Form, Input, DatePicker, Select, Upload, message, Spin } from "antd";
import { getCourriers, createCourrier, uploadPieceJointe } from "../services/courrierService";
import { UploadOutlined } from "@ant-design/icons";

const { RangePicker } = DatePicker;

const CourrierEntrants = () => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();

  const fetch = async () => {
    setLoading(true);
    try {
      const data = await getCourriers({ type: "entrant" });
      setList(data);
    } catch {
      message.error("Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetch(); }, []);

  const handleCreate = async (values) => {
    try {
      const payload = {
        ...values,
        date_reception: values.date_reception.format("YYYY-MM-DD"),
      };
      const created = await createCourrier(payload);
      // upload piece if present
      setOpen(false);
      form.resetFields();
      fetch();
      message.success("Courrier créé");
    } catch (err) {
      message.error("Erreur création courrier");
    }
  };

  const columns = [
    { title: "Réf.", dataIndex: "reference", key: "reference" },
    { title: "Objet", dataIndex: "objet", key: "objet" },
    { title: "Expéditeur", dataIndex: "expediteur_nom", key: "expediteur_nom" },
    { title: "Service", dataIndex: ["service_impute", "nom"], key: "service" },
    { title: "Statut", dataIndex: "statut", key: "statut" },
    {
      title: "Actions",
      key: "actions",
      render: (_, row) => (
        <Space>
          <Button type="link" onClick={() => Modal.info({ title: "Détail", content: JSON.stringify(row, null, 2), width: 700 })}>Voir</Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <h2>Courriers entrants</h2>
      <Button type="primary" onClick={() => setOpen(true)} style={{ marginBottom: 16 }}>Nouveau Courrier</Button>
      {loading ? <Spin /> : <Table dataSource={list} rowKey="id" columns={columns} />}

      <Modal title="Nouveau courrier" open={open} onCancel={() => setOpen(false)} footer={null}>
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="reference" label="Référence" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="objet" label="Objet" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="expediteur_nom" label="Expéditeur">
            <Input />
          </Form.Item>
          <Form.Item name="date_reception" label="Date réception" rules={[{ required: true }]}>
            <DatePicker />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button onClick={() => setOpen(false)}>Annuler</Button>
              <Button type="primary" htmlType="submit">Enregistrer</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CourrierEntrants;
