import React, { useState } from "react";
import {
  Modal,
  Form,
  Input,
  Upload,
  Button,
  message,
  Select,
  DatePicker,
  Checkbox,
} from "antd";
import { UploadOutlined } from "@ant-design/icons";
import axios from "axios";
// import moment from "moment";

const { Option } = Select;

const CourrierCreateModal = ({
  open,
  onClose,
  onSuccess,
  defaultType,
  services = [],
  categories = [],
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [ocrChecked, setOcrChecked] = useState(true);

  const handleSubmit = async (values) => {
    if (!values.file || values.file.length === 0) {
      message.error("Veuillez sélectionner au moins un fichier !");
      return;
    }

    const formData = new FormData();
    values.file.forEach((file) => formData.append("file", file));

    formData.append("objet", values.objet);
    formData.append("type", defaultType);
    formData.append("confidentialite", values.confidentialite);
    formData.append(
      "date_reception",
      values.date_reception ? values.date_reception.format("YYYY-MM-DD") : ""
    );
    formData.append("expediteur_nom", values.expediteur_nom || "");
    formData.append("expediteur_adresse", values.expediteur_adresse || "");
    formData.append("expediteur_email", values.expediteur_email || "");
    formData.append("canal", values.canal || "");
    formData.append("category", values.category || "");
    formData.append("service_impute", values.service_impute || "");
    formData.append("ocr", ocrChecked ? "true" : "false");

    setLoading(true);
    try {
      await axios.post(
        "http://localhost:8000/api/courriers/entrant/",
        formData,
        {
          headers: {
            Authorization: `Token ${localStorage.getItem("auth_token")}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      message.success("Courrier enregistré avec succès !");
      form.resetFields();
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err.response?.data || err);
      message.error("Erreur lors de l'enregistrement du courrier");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      title="Nouveau courrier entrant"
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={loading}
      destroyOnClose
      width={700}
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
          name="expediteur_nom"
          label="Nom de l'expéditeur"
          rules={[{ required: true, message: "Nom requis" }]}
        >
          <Input placeholder="Nom de l'expéditeur" />
        </Form.Item>

        <Form.Item name="expediteur_adresse" label="Adresse">
          <Input placeholder="Adresse de l'expéditeur" />
        </Form.Item>

        <Form.Item name="expediteur_email" label="Email">
          <Input placeholder="Email de l'expéditeur" type="email" />
        </Form.Item>

        <Form.Item name="canal" label="Canal de réception">
          <Select placeholder="Sélectionnez le canal">
            <Option value="Physique">Physique</Option>
            <Option value="Email">Email</Option>
          </Select>
        </Form.Item>

        <Form.Item name="date_reception" label="Date de réception">
          <DatePicker style={{ width: "100%" }} />
        </Form.Item>

        <Form.Item name="confidentialite" label="Confidentialité">
          <Select placeholder="Sélectionnez la confidentialité">
            <Option value="normal">Normale</Option>
            <Option value="restreinte">Restreinte</Option>
            <Option value="confidentielle">Confidentielle</Option>
          </Select>
        </Form.Item>

        <Form.Item name="category" label="Catégorie">
          <Select placeholder="Sélectionnez une catégorie" allowClear>
            {categories.map((cat) => (
              <Option key={cat.id} value={cat.id}>
                {cat.nom}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item name="service_impute" label="Service imputé">
          <Select placeholder="Sélectionnez un service" allowClear>
            {services.map((srv) => (
              <Option key={srv.id} value={srv.id}>
                {srv.nom}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="file"
          label="Pièces jointes (PDF, images, docx)"
          valuePropName="fileList"
          getValueFromEvent={(e) =>
            e && e.fileList.map((file) => file.originFileObj)
          }
          rules={[{ required: true, message: "Fichier requis" }]}
        >
          <Upload beforeUpload={() => false} multiple accept=".pdf,.jpg,.png,.docx">
            <Button icon={<UploadOutlined />}>Choisir des fichiers</Button>
          </Upload>
        </Form.Item>

        <Form.Item name="ocr" valuePropName="checked">
          <Checkbox checked={ocrChecked} onChange={(e) => setOcrChecked(e.target.checked)}>
            Activer OCR automatique
          </Checkbox>
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} style={{ marginRight: 10 }}>
             Enregistrer
          </Button>
          <Button
            type="default"
            loading={loading}
            onClick={() => {
              form.setFieldsValue({ classifier: true });
              form.submit();
            }}
          >
             Enregistrer et classifier
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CourrierCreateModal;
