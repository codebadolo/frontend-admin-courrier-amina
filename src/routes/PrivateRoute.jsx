import React from 'react';
import { Navigate } from 'react-router-dom';
import { Spin } from 'antd';

const PrivateRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('userRole');
  const [loading, setLoading] = React.useState(true);
  const [isAuthorized, setIsAuthorized] = React.useState(false);

  React.useEffect(() => {
    const checkAuth = async () => {
      // Simuler une vérification
      await new Promise(resolve => setTimeout(resolve, 100));
      
      if (!token) {
        setIsAuthorized(false);
      } else if (allowedRoles && !allowedRoles.includes(userRole)) {
        setIsAuthorized(false);
      } else {
        setIsAuthorized(true);
      }
      setLoading(false);
    };
    
    checkAuth();
  }, [token, userRole, allowedRoles]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!isAuthorized) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default PrivateRoute;