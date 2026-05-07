import { Navigate } from 'react-router-dom';
import { getNormalizedUserRole, type UserRole } from '@/utils/userRole';

type RequireRoleProps = {
  allowed: UserRole[];
  children: React.ReactNode;
};

/** Ensures the current user has one of the allowed roles; otherwise redirects. */
const RequireRole = ({ allowed, children }: RequireRoleProps) => {
  const role = getNormalizedUserRole();

  if (!role) {
    return <Navigate to="/login" replace />;
  }

  if (!allowed.includes(role)) {
    const fallback = role === 'ADMIN' ? '/dashboard' : '/buyer';
    return <Navigate to={fallback} replace />;
  }

  return <>{children}</>;
};

export default RequireRole;
