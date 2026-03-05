"""
Tests: Audit module
"""
import pytest
from rest_framework.test import APIClient
from apps.users.models import User, Department
from apps.audit.models import AuditLog


@pytest.fixture
def client():
    return APIClient()


@pytest.fixture
def dept(db):
    return Department.objects.create(name='Aud-Test')


def _create_user(email, role, dept):
    return User.objects.create_user(
        email=email, password='Test@1234',
        first_name='A', last_name='U', role=role, department=dept,
    )


def _login(client, user):
    resp = client.post('/api/v1/auth/login/', {'email': user.email, 'password': 'Test@1234'}, format='json')
    assert resp.status_code == 200
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {resp.data["access"]}')


class TestAudit:
    def test_super_admin_can_view_logs(self, client, dept):
        sadm = _create_user('aud_s@test.com', 'SUPER_ADMIN', dept)
        AuditLog.log(sadm, 'USER_CREATED', 'User', str(sadm.id))
        _login(client, sadm)
        resp = client.get('/api/v1/audit/')
        assert resp.status_code == 200
        assert len(resp.data['logs']) >= 1

    def test_hr_cannot_view_audit_logs(self, client, dept):
        hr = _create_user('aud_h@test.com', 'HR_ADMIN', dept)
        _login(client, hr)
        resp = client.get('/api/v1/audit/')
        assert resp.status_code == 403

    def test_employee_cannot_view_audit_logs(self, client, dept):
        emp = _create_user('aud_e@test.com', 'EMPLOYEE', dept)
        _login(client, emp)
        resp = client.get('/api/v1/audit/')
        assert resp.status_code == 403

    def test_audit_log_model_creates_record(self, db, dept):
        user = _create_user('aud_m@test.com', 'SUPER_ADMIN', dept)
        AuditLog.log(user, 'LOGIN', 'User', str(user.id), new_value={'ip': '127.0.0.1'})
        assert AuditLog.objects.filter(actor=user, action_type='LOGIN').exists()
