import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Select, message } from 'antd';
import { traitementService } from '../../services/traitementService';

const { Option } = Select;
const { TextArea } = Input;

const RedactionReponseModal = ({ open, onOpenChange, onSubmit, courrier }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [modeles, setModeles] = useState([]);

  useEffect(() => {
    if (open) {
      fetchModeles();
      // Pré‑remplir l'objet avec "RE: ..." si disponible
      form.setFieldsValue({
        objet: `RE: ${courrier?.objet || ''}`,
        destinataires: courrier?.expediteur_nom ? [courrier.expediteur_nom] : [],
        copies: [],
        type_reponse: 'lettre',
        canal_envoi: 'email'
      });
    }
  }, [open, courrier, form]);

  const fetchModeles = async () => {
    try {
      const data = await traitementService.getModelesReponse();
      setModeles(data.results || data);
    } catch (error) {
      console.error('Erreur chargement modèles:', error);
      message.warning('Impossible de charger les modèles de réponse');
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onOpenChange(false);
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      // Transformer les listes séparées par virgules en tableaux
      const payload = {
        ...values,
        destinataires: values.destinataires
          .split(',')
          .map(d => d.trim())
          .filter(d => d),
        copies: values.copies
          ? values.copies.split(',').map(c => c.trim()).filter(c => c)
          : []
      };
      setLoading(true);
      await onSubmit(payload);
      form.resetFields();
      onOpenChange(false);
    } catch (error) {
      if (error.errorFields) return;
      message.error('Erreur lors de la soumission');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Rédiger une réponse"
      open={open}
      onCancel={handleCancel}
      onOk={handleOk}
      confirmLoading={loading}
      okText="Enregistrer et continuer"
      cancelText="Annuler"
      width={800}
      style={{ top: 20 }}
    >
      <div style={{ marginBottom: 16, color: '#666' }}>
        Réponse au courrier : {courrier?.reference}
      </div>

      <Form
        form={form}
        layout="vertical"
      >
        <Form.Item
          name="type_reponse"
          label="Type de réponse"
          rules={[{ required: true, message: 'Champ requis' }]}
        >
          <Select placeholder="Sélectionnez un type">
            <Option value="lettre">Lettre officielle</Option>
            <Option value="email">Email</Option>
            <Option value="note_interne">Note interne</Option>
            <Option value="decision">Décision</Option>
            <Option value="avis_technique">Avis technique</Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="modele_id"
          label="Modèle"
        >
          <Select
            placeholder="Sélectionner un modèle (optionnel)"
            allowClear
          >
            {modeles.map(modele => (
              <Option key={modele.id} value={modele.id}>
                {modele.nom}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="objet"
          label="Objet"
          rules={[{ required: true, message: 'Champ requis' }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          name="destinataires"
          label="Destinataires (séparés par des virgules)"
          rules={[{ required: true, message: 'Au moins un destinataire requis' }]}
        >
          <Input placeholder="nom@exemple.com, autre@exemple.com" />
        </Form.Item>

        <Form.Item
          name="copies"
          label="Copies (séparées par des virgules, optionnel)"
        >
          <Input placeholder="email1@exemple.com, email2@exemple.com" />
        </Form.Item>

        <Form.Item
          name="contenu"
          label="Contenu"
          rules={[{ required: true, message: 'Champ requis' }]}
        >
          <TextArea rows={10} placeholder="Contenu de la réponse..." />
        </Form.Item>

        <Form.Item
          name="canal_envoi"
          label="Canal d'envoi"
          rules={[{ required: true, message: 'Champ requis' }]}
        >
          <Select>
            <Option value="email">Email</Option>
            <Option value="courrier">Courrier physique</Option>
            <Option value="portail">Portail web</Option>
            <Option value="fax">Fax</Option>
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default RedactionReponseModal;