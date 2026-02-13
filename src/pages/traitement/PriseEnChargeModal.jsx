import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, InputNumber, message } from 'antd';

const PriseEnChargeModal = ({ open, onOpenChange, onSubmit, courrier }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleCancel = () => {
    form.resetFields();
    onOpenChange(false);
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      await onSubmit(values);
      form.resetFields();
      onOpenChange(false);
    } catch (error) {
      if (error.errorFields) {
        // Erreur de validation du formulaire
        return;
      }
      message.error('Erreur lors de la soumission');
    } finally {
      setLoading(false);
    }
  };

  // Réinitialiser le formulaire à l'ouverture
  useEffect(() => {
    if (open) {
      form.setFieldsValue({
        delai_jours: 5,
        commentaire: ''
      });
    }
  }, [open, form]);

  return (
    <Modal
      title="Prendre en charge le courrier"
      open={open}
      onCancel={handleCancel}
      onOk={handleOk}
      confirmLoading={loading}
      okText="Prendre en charge"
      cancelText="Annuler"
      width={600}
    >
      <div style={{ marginBottom: 16 }}>
        <span style={{ fontWeight: 500 }}>{courrier?.reference}</span> – {courrier?.objet}
      </div>

      <Form
        form={form}
        layout="vertical"
        initialValues={{
          delai_jours: 5,
          commentaire: ''
        }}
      >
        <Form.Item
          name="delai_jours"
          label="Délai de traitement (jours)"
          rules={[{ required: true, message: 'Veuillez saisir un délai' }]}
        >
          <InputNumber min={1} max={30} style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item
          name="commentaire"
          label="Commentaire (optionnel)"
        >
          <Input.TextArea rows={4} placeholder="Notes ou instructions..." />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default PriseEnChargeModal;