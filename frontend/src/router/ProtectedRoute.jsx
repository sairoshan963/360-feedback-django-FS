import { Navigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';

export function RequireAuth({ children }) {
  const token = useAuthStore((s) => s.token);
  return token ? children : <Navigate to="/login" replace />;
}

export function RequireRole({ roles, children }) {
  const user = useAuthStore((s) => s.user);
  if (!user) return <Navigate to="/login" replace />;
  if (!roles.includes(user.role)) return <Navigate to="/unauthorized" replace />;
  return children;
}

export function roleDashboard(role) {
  switch (role) {
    case 'SUPER_ADMIN': return '/admin/users';
    case 'HR_ADMIN':    return '/hr/cycles';
    case 'MANAGER':     return '/manager/dashboard';
    case 'EMPLOYEE':    return '/employee/tasks';
    default:            return '/login';
  }
}
