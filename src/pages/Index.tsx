import { Navigate } from 'react-router-dom';
import { isAuthenticated } from '@/utils/auth';
import { getNormalizedUserRole } from '@/utils/userRole';

const Index = () => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  const role = getNormalizedUserRole();
  if (role === 'ADMIN') {
    return <Navigate to="/dashboard" replace />;
  }
  if (role === 'SUB_ADMIN') {
    return <Navigate to="/buyer" replace />;
  }

  return <Navigate to="/login" replace />;
};

export default Index;
