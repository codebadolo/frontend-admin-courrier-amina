import React, { useState } from "react";
import { Modal, Form, Input, Upload, Button, message } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import axios from "axios";

const CourrierCreateModal = ({ open, onClose, onSuccess, defaultType }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values) => {
    const formData = new FormData();
    formData.append("file", values.file.file);
    formData.append("type", defaultType);
    formData.append("objet", values.objet);

    setLoading(true);
    try {
      await axios.post(
        "http://localhost:8000/api/courriers/create-with-ocr/",
        formData,
        {
          headers: {
            Authorization: `Token ${localStorage.getItem("auth_token")}`,
          },
        }
      );

      message.success("Courrier analysé et enregistré");
      form.resetFields();
      onSuccess();
      onClose();
    } catch (err) {
      message.error("Erreur lors du traitement du courrier");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      title="Nouveau courrier (OCR + IA)"
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={loading}
      destroyOnClose
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item
          name="objet"
          label="Objet"
          rules={[{ required: true, message: "Objet requis" }]}
        >
          <Input placeholder="Objet du courrier" />
        </Form.Item>

        <Form.Item
          name="file"
          label="Fichier PDF scanné"
          rules={[{ required: true, message: "PDF requis" }]}
        >
          <Upload beforeUpload={() => false} accept=".pdf">
            <Button icon={<UploadOutlined />}>Choisir un PDF</Button>
          </Upload>
        </Form.Item>
      </Form>
    </Modal>
  );
};
export default CourrierCreateModal;