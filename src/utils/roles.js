// src/utils/roles.js
export const ROLE_PERMISSIONS = {
  admin: {
    name: 'Administrateur',
    color: '#f5222d',
    permissions: [
      'manage_users',
      'manage_services',
      'manage_all_courriers',
      'access_reports',
      'access_administration'
    ]
  },
  direction: {
    name: 'Direction',
    color: '#722ed1',
    permissions: [
      'view_all_courriers',
      'access_reports',
      'manage_services',
      'validate_courriers'
    ]
  },
  chef: {
    name: 'Chef de Service',
    color: '#fa8c16',
    permissions: [
      'manage_service_members',
      'view_service_courriers',
      'impute_courriers',
      'validate_courriers'
    ]
  },
  agent_service: {
    name: 'Agent de Service',
    color: '#52c41a',
    permissions: [
      'view_service_courriers',
      'take_courrier_charge',
      'process_courriers',
      'update_courrier_status'
    ]
  },
  collaborateur: {
    name: 'Collaborateur',
    color: '#1890ff',
    permissions: [
      'view_assigned_courriers',
      'create_courriers'
    ]
  },
  agent_courrier: {
    name: 'Agent Courrier',
    color: '#13c2c2',
    permissions: [
      'receive_courriers',
      'register_courriers',
      'distribute_courriers'
    ]
  },
  archiviste: {
    name: 'Archiviste',
    color: '#eb2f96',
    permissions: [
      'manage_archives',
      'access_archives',
      'export_courriers'
    ]
  }
};

export const hasPermission = (userRole, permission) => {
  const role = ROLE_PERMISSIONS[userRole];
  if (!role) return false;
  return role.permissions.includes(permission);
};

export const getRoleDisplay = (role) => {
  return ROLE_PERMISSIONS[role]?.name || role;
};

export const getRoleColor = (role) => {
  return ROLE_PERMISSIONS[role]?.color || '#8c8c8c';
};