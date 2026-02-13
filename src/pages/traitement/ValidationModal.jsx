import React, { useState, useEffect } from 'react';
import { Modal, Form, Select, Checkbox, Input, Space, message } from 'antd';
import { traitementService } from '../../services/traitementService';
import { getUsers } from '../../services/userService'; // ✅ Import direct de la fonction

const { Option } = Select;
const { TextArea } = Input;

const ValidationModal = ({ open, onOpenChange, onSubmit, courrier }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [validateurs, setValidateurs] = useState([]);
  const [selectedValidateurs, setSelectedValidateurs] = useState([]);

  useEffect(() => {
    if (open && courrier?.service_impute) {
      fetchValidateurs(courrier.service_impute);
      form.setFieldsValue({
        type_validation: 'hierarchique',
        niveau_validation: 1,
        commentaire: ''
      });
      setSelectedValidateurs([]);
    }
  }, [open, courrier, form]);

  const fetchValidateurs = async (serviceId) => {
    try {
      // Tentative : récupérer les validateurs spécifiques au service
      const data = await traitementService.getValidateurs(serviceId);
      setValidateurs(data);
    } catch (error) {
      console.error('Erreur chargement validateurs:', error);
      // Fallback : récupérer tous les utilisateurs avec rôle de validation
      try {
        const allUsers = await getUsers(); // ✅ Appel correct
        // Adapter le filtre selon la structure de votre API
        const chiefs = allUsers.filter(user => {
          const role = user.role?.nom || user.role || ''; // selon que role est un objet ou une string
          return ['chef', 'direction', 'admin'].includes(role.toLowerCase?.() || role);
        });
        setValidateurs(chiefs);
      } catch (e) {
        console.error('Fallback échoué:', e);
        message.warning('Impossible de charger la liste des validateurs');
        setValidateurs([]);
      }
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setSelectedValidateurs([]);
    onOpenChange(false);
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      if (selectedValidateurs.length === 0) {
        message.error('Veuillez sélectionner au moins un validateur');
        return;
      }
      const payload = {
        ...values,
        validateurs: selectedValidateurs
      };
      setLoading(true);
      await onSubmit(payload);
      form.resetFields();
      setSelectedValidateurs([]);
      onOpenChange(false);
    } catch (error) {
      if (error.errorFields) return;
      message.error('Erreur lors de la soumission');
    } finally {
      setLoading(false);
    }
  };

  const toggleValidateur = (id) => {
    setSelectedValidateurs(prev =>
      prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]
    );
  };

  return (
    <Modal
      title="Soumettre pour validation"
      open={open}
      onCancel={handleCancel}
      onOk={handleOk}
      confirmLoading={loading}
      okText="Soumettre"
      cancelText="Annuler"
      width={600}
    >
      <div style={{ marginBottom: 16, color: '#666' }}>
        {courrier?.reference} – {courrier?.objet}
      </div>

      <Form form={form} layout="vertical">
        <Form.Item
          name="type_validation"
          label="Type de validation"
          rules={[{ required: true, message: 'Champ requis' }]}
        >
          <Select>
            <Option value="hierarchique">Validation hiérarchique</Option>
            <Option value="technique">Validation technique</Option>
            <Option value="juridique">Validation juridique</Option>
            <Option value="financiere">Validation financière</Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="niveau_validation"
          label="Niveau de validation"
          rules={[{ required: true, message: 'Champ requis' }]}
        >
          <Select>
            <Option value={1}>Niveau 1 (Chef de service)</Option>
            <Option value={2}>Niveau 2 (Direction)</Option>
            <Option value={3}>Niveau 3 (Direction générale)</Option>
          </Select>
        </Form.Item>

        <Form.Item
          label="Validateurs"
          required
          tooltip="Sélectionnez un ou plusieurs validateurs"
        >
          <div
            style={{
              maxHeight: 200,
              overflowY: 'auto',
              border: '1px solid #d9d9d9',
              borderRadius: 6,
              padding: 8
            }}
          >
            {validateurs.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#999', padding: 16 }}>
                Aucun validateur disponible
              </div>
            ) : (
              validateurs.map(validateur => (
                <div
                  key={validateur.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '8px 12px',
                    borderRadius: 4,
                    marginBottom: 4,
                    backgroundColor: selectedValidateurs.includes(validateur.id)
                      ? '#e6f7ff'
                      : 'transparent',
                    transition: 'background-color 0.2s',
                    cursor: 'pointer'
                  }}
                  onClick={() => toggleValidateur(validateur.id)}
                >
                  <Checkbox
                    checked={selectedValidateurs.includes(validateur.id)}
                    onChange={(e) => {
                      e.stopPropagation();
                      toggleValidateur(validateur.id);
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 500 }}>
                        {validateur.nom || validateur.username || validateur.email}
                      </span>
                      <span style={{ fontSize: 12, color: '#666' }}>
                        {validateur.role_display ||
                          validateur.role?.nom ||
                          validateur.role ||
                          'Utilisateur'}{' '}
                        • {validateur.service_nom || validateur.service?.nom || '—'}
                      </span>
                    </div>
                  </Checkbox>
                </div>
              ))
            )}
          </div>
        </Form.Item>

        <Form.Item name="commentaire" label="Commentaire (optionnel)">
          <TextArea rows={4} placeholder="Instructions pour les validateurs..." />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ValidationModal;