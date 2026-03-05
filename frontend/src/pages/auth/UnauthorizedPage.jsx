import { Result, Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { roleDashboard } from '../../router/ProtectedRoute';

export default function UnauthorizedPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Result
        status="403"
        title="Access Denied"
        subTitle="You don't have permission to view this page."
        extra={
          <Button type="primary" onClick={() => navigate(user ? roleDashboard(user.role) : '/login')}>
            Go to Dashboard
          </Button>
        }
      />
    </div>
  );
}
