import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { RequireAuth, RequireRole, roleDashboard } from './ProtectedRoute';
import useAuthStore from '../store/authStore';

import LoginPage           from '../pages/auth/LoginPage';
import AuthCallbackPage    from '../pages/auth/AuthCallbackPage';
import ResetPasswordPage   from '../pages/auth/ResetPasswordPage';
import UnauthorizedPage    from '../pages/auth/UnauthorizedPage';
import ForgotPasswordPage  from '../pages/auth/ForgotPasswordPage';
import AppLayout        from '../layouts/AppLayout';

import UsersPage        from '../pages/admin/UsersPage';
import OrgPage          from '../pages/admin/OrgPage';
import AuditPage        from '../pages/admin/AuditPage';

import CyclesPage       from '../pages/hr/CyclesPage';
import CycleDetailPage  from '../pages/hr/CycleDetailPage';
import CreateCyclePage  from '../pages/hr/CreateCyclePage';
import TemplatesPage    from '../pages/hr/TemplatesPage';
import CreateTemplatePage from '../pages/hr/CreateTemplatePage';
import EditTemplatePage   from '../pages/hr/EditTemplatePage';
import HrDashboardPage    from '../pages/hr/HrDashboardPage';
import ViewReportsPage    from '../pages/hr/ViewReportsPage';
import AnnouncementsPage  from '../pages/hr/AnnouncementsPage';
import EmployeeReportPage from '../pages/hr/EmployeeReportPage';

import ManagerDashboardPage    from '../pages/manager/ManagerDashboardPage';
import ManagerTasksPage        from '../pages/manager/ManagerTasksPage';
import ManagerNominationsPage  from '../pages/manager/ManagerNominationsPage';

import EmployeeTasksPage from '../pages/employee/EmployeeTasksPage';
import FeedbackFormPage  from '../pages/employee/FeedbackFormPage';
import NominationsPage   from '../pages/employee/NominationsPage';
import MyReportPage      from '../pages/employee/MyReportPage';

import ProfilePage from '../pages/shared/ProfilePage';
import ClientFeedbackPage                    from '../pages/hr/ClientFeedbackPage';
import ClientFeedbackDetailPage             from '../pages/hr/ClientFeedbackDetailPage';
import ClientFeedbackTemplatesPage          from '../pages/hr/ClientFeedbackTemplatesPage';
import CreateClientFeedbackTemplatePage     from '../pages/hr/CreateClientFeedbackTemplatePage';
import EditClientFeedbackTemplatePage       from '../pages/hr/EditClientFeedbackTemplatePage';
import ClientFeedbackFormPage               from '../pages/public/ClientFeedbackFormPage';
import ClientFeedbackDemoPage              from '../pages/public/ClientFeedbackDemoPage';

function RootRedirect() {
  const user = useAuthStore((s) => s.user);
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={roleDashboard(user.role)} replace />;
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login"            element={<LoginPage />} />
        <Route path="/forgot-password"  element={<ForgotPasswordPage />} />
        <Route path="/auth/callback"    element={<AuthCallbackPage />} />
        <Route path="/reset-password"   element={<ResetPasswordPage />} />
        <Route path="/unauthorized"     element={<UnauthorizedPage />} />
        <Route path="/client-feedback/:token" element={<ClientFeedbackFormPage />} />
        <Route path="/client-feedback-demo"   element={<ClientFeedbackDemoPage />} />
        <Route path="/"               element={<RootRedirect />} />

        {/* Protected */}
        <Route element={<RequireAuth><AppLayout /></RequireAuth>}>

          {/* Super Admin */}
          <Route path="/admin/users"
            element={<RequireRole roles={['SUPER_ADMIN']}><UsersPage /></RequireRole>} />
          <Route path="/admin/org"
            element={<RequireRole roles={['SUPER_ADMIN','HR_ADMIN','MANAGER','EMPLOYEE']}><OrgPage /></RequireRole>} />
          <Route path="/admin/audit"
            element={<RequireRole roles={['SUPER_ADMIN']}><AuditPage /></RequireRole>} />

          {/* HR Admin */}
          <Route path="/hr/cycles"
            element={<RequireRole roles={['HR_ADMIN','SUPER_ADMIN']}><CyclesPage /></RequireRole>} />
          <Route path="/hr/cycles/new"
            element={<RequireRole roles={['HR_ADMIN','SUPER_ADMIN']}><CreateCyclePage /></RequireRole>} />
          <Route path="/hr/cycles/:id"
            element={<RequireRole roles={['HR_ADMIN','SUPER_ADMIN']}><CycleDetailPage /></RequireRole>} />
          <Route path="/hr/templates"
            element={<RequireRole roles={['HR_ADMIN','SUPER_ADMIN']}><TemplatesPage /></RequireRole>} />
          <Route path="/hr/templates/new"
            element={<RequireRole roles={['HR_ADMIN','SUPER_ADMIN']}><CreateTemplatePage /></RequireRole>} />
          <Route path="/hr/templates/:id/edit"
            element={<RequireRole roles={['HR_ADMIN','SUPER_ADMIN']}><EditTemplatePage /></RequireRole>} />
          <Route path="/hr/dashboard"
            element={<RequireRole roles={['HR_ADMIN','SUPER_ADMIN']}><HrDashboardPage /></RequireRole>} />
          <Route path="/hr/reports"
            element={<RequireRole roles={['HR_ADMIN','SUPER_ADMIN']}><ViewReportsPage /></RequireRole>} />
          <Route path="/hr/announcements"
            element={<RequireRole roles={['HR_ADMIN','SUPER_ADMIN']}><AnnouncementsPage /></RequireRole>} />
          <Route path="/hr/client-feedback-templates"
            element={<RequireRole roles={['HR_ADMIN','SUPER_ADMIN']}><ClientFeedbackTemplatesPage /></RequireRole>} />
          <Route path="/hr/client-feedback-templates/new"
            element={<RequireRole roles={['HR_ADMIN','SUPER_ADMIN']}><CreateClientFeedbackTemplatePage /></RequireRole>} />
          <Route path="/hr/client-feedback-templates/:id/edit"
            element={<RequireRole roles={['HR_ADMIN','SUPER_ADMIN']}><EditClientFeedbackTemplatePage /></RequireRole>} />
          <Route path="/hr/client-feedback"
            element={<RequireRole roles={['HR_ADMIN','SUPER_ADMIN']}><ClientFeedbackPage /></RequireRole>} />
          <Route path="/hr/client-feedback/:id"
            element={<RequireRole roles={['HR_ADMIN','SUPER_ADMIN']}><ClientFeedbackDetailPage /></RequireRole>} />

          {/* Manager */}
          <Route path="/manager/dashboard"
            element={<RequireRole roles={['MANAGER','SUPER_ADMIN']}><ManagerDashboardPage /></RequireRole>} />
          <Route path="/manager/tasks"
            element={<RequireRole roles={['MANAGER','SUPER_ADMIN']}><ManagerTasksPage /></RequireRole>} />
          <Route path="/manager/nominations"
            element={<RequireRole roles={['MANAGER','SUPER_ADMIN']}><ManagerNominationsPage /></RequireRole>} />

          {/* Employee */}
          <Route path="/employee/tasks"
            element={<RequireRole roles={['EMPLOYEE','MANAGER','HR_ADMIN','SUPER_ADMIN']}><EmployeeTasksPage /></RequireRole>} />
          <Route path="/employee/tasks/:id"
            element={<RequireRole roles={['EMPLOYEE','MANAGER','HR_ADMIN','SUPER_ADMIN']}><FeedbackFormPage /></RequireRole>} />
          <Route path="/employee/nominations"
            element={<RequireRole roles={['EMPLOYEE','MANAGER','HR_ADMIN','SUPER_ADMIN']}><NominationsPage /></RequireRole>} />
          <Route path="/employee/report"
            element={<RequireRole roles={['EMPLOYEE','MANAGER','HR_ADMIN','SUPER_ADMIN']}><MyReportPage /></RequireRole>} />

          {/* Cross-role */}
          <Route path="/reports/:cycleId/:employeeId"
            element={<RequireRole roles={['SUPER_ADMIN','HR_ADMIN','MANAGER']}><EmployeeReportPage /></RequireRole>} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
