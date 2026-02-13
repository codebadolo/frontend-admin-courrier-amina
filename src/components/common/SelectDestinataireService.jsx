import React, { useState, useEffect } from 'react';
import { Select, Spin } from 'antd';
import { getUsersByService } from '../../services/userService';

const { Option } = Select;

const SelectDestinataireService = ({
  serviceId,
  roles = ['agent_service', 'collaborateur'],
  placeholder = 'Sélectionner un destinataire',
  value,
  onChange,
  ...props
}) => {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (serviceId) {
      fetchUsers();
    }
  }, [serviceId]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getUsersByService(serviceId, roles);
      setUsers(data);
    } catch (err) {
      console.error('Erreur chargement destinataires:', err);
      setError('Impossible de charger la liste des destinataires');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Select
      placeholder={loading ? 'Chargement...' : placeholder}
      loading={loading}
      value={value}
      onChange={onChange}
      allowClear
      showSearch
      filterOption={(input, option) =>
        option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
      }
      {...props}
    >
      {error && (
        <Option value="" disabled>
          {error}
        </Option>
      )}
      {users.map(user => (
        <Option key={user.id} value={user.id}>
          {user.full_name} ({user.role_display})
        </Option>
      ))}
    </Select>
  );
};

export default SelectDestinataireService;