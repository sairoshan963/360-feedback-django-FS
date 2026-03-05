"""
Tests: Announcements module
"""
import pytest
from rest_framework.test import APIClient
from apps.users.models import User, Department
from apps.announcements.models import Announcement


@pytest.fixture
def client():
    return APIClient()


@pytest.fixture
def dept(db):
    return Department.objects.create(name='Ann-Test')


def _create_user(email, role, dept):
    return User.objects.create_user(
        email=email, password='Test@1234',
        first_name='A', last_name='U', role=role, department=dept,
    )


def _login(client, user):
    resp = client.post('/api/v1/auth/login/', {'email': user.email, 'password': 'Test@1234'}, format='json')
    assert resp.status_code == 200
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {resp.data["access"]}')


class TestAnnouncements:
    def test_any_user_can_see_active_announcements(self, client, dept):
        emp = _create_user('ann_e@test.com', 'EMPLOYEE', dept)
        hr  = _create_user('ann_h@test.com', 'HR_ADMIN', dept)
        Announcement.objects.create(message='Hello all', type='info', created_by=hr)
        _login(client, emp)
        resp = client.get('/api/v1/announcements/')
        assert resp.status_code == 200
        assert len(resp.data['announcements']) >= 1

    def test_hr_can_create_announcement(self, client, dept):
        hr = _create_user('ann_h2@test.com', 'HR_ADMIN', dept)
        _login(client, hr)
        resp = client.post('/api/v1/announcements/all/', {
            'message': 'System maintenance tonight',
            'type': 'warning',
        }, format='json')
        assert resp.status_code == 201

    def test_employee_cannot_create_announcement(self, client, dept):
        emp = _create_user('ann_e2@test.com', 'EMPLOYEE', dept)
        _login(client, emp)
        resp = client.post('/api/v1/announcements/all/', {
            'message': 'Unauthorized post',
            'type': 'info',
        }, format='json')
        assert resp.status_code == 403

    def test_hr_can_deactivate_announcement(self, client, dept):
        hr   = _create_user('ann_h3@test.com', 'HR_ADMIN', dept)
        ann  = Announcement.objects.create(message='Old news', type='info', created_by=hr)
        _login(client, hr)
        resp = client.patch(f'/api/v1/announcements/{ann.id}/deactivate/')
        assert resp.status_code == 200
        ann.refresh_from_db()
        assert ann.is_active is False

    def test_super_admin_can_hard_delete(self, client, dept):
        hr    = _create_user('ann_h4@test.com', 'HR_ADMIN', dept)
        sadm  = _create_user('ann_s@test.com', 'SUPER_ADMIN', dept)
        ann   = Announcement.objects.create(message='Delete me', type='info', created_by=hr)
        _login(client, sadm)
        resp = client.delete(f'/api/v1/announcements/{ann.id}/')
        assert resp.status_code == 200
        assert not Announcement.objects.filter(id=ann.id).exists()

    def test_employee_cannot_hard_delete(self, client, dept):
        hr   = _create_user('ann_h5@test.com', 'HR_ADMIN', dept)
        emp  = _create_user('ann_e3@test.com', 'EMPLOYEE', dept)
        ann  = Announcement.objects.create(message='Cannot delete', type='info', created_by=hr)
        _login(client, emp)
        resp = client.delete(f'/api/v1/announcements/{ann.id}/')
        assert resp.status_code == 403
