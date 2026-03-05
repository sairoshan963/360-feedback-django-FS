"""
Tests: Notifications module
"""
import pytest
from rest_framework.test import APIClient
from apps.users.models import User, Department
from apps.notifications.models import Notification


@pytest.fixture
def client():
    return APIClient()


@pytest.fixture
def dept(db):
    return Department.objects.create(name='Notif-Test')


def _create_user(email, role, dept):
    return User.objects.create_user(
        email=email, password='Test@1234',
        first_name='N', last_name='U', role=role, department=dept,
    )


def _login(client, user):
    resp = client.post('/api/v1/auth/login/', {'email': user.email, 'password': 'Test@1234'}, format='json')
    assert resp.status_code == 200
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {resp.data["access"]}')


class TestNotifications:
    def test_user_can_list_notifications(self, client, dept):
        user = _create_user('notif1@test.com', 'EMPLOYEE', dept)
        Notification.objects.create(user=user, type='INFO', title='Hello', message='World')
        _login(client, user)
        resp = client.get('/api/v1/notifications/')
        assert resp.status_code == 200
        assert len(resp.data['notifications']) == 1

    def test_unread_count(self, client, dept):
        user = _create_user('notif2@test.com', 'EMPLOYEE', dept)
        Notification.objects.create(user=user, type='INFO', title='A', message='M')
        Notification.objects.create(user=user, type='INFO', title='B', message='M', is_read=True)
        _login(client, user)
        resp = client.get('/api/v1/notifications/unread-count/')
        assert resp.status_code == 200
        assert resp.data['count'] == 1

    def test_mark_single_read(self, client, dept):
        user  = _create_user('notif3@test.com', 'EMPLOYEE', dept)
        notif = Notification.objects.create(user=user, type='INFO', title='C', message='M')
        _login(client, user)
        resp = client.put(f'/api/v1/notifications/{notif.id}/read/')
        assert resp.status_code == 200
        notif.refresh_from_db()
        assert notif.is_read is True

    def test_mark_all_read(self, client, dept):
        user = _create_user('notif4@test.com', 'EMPLOYEE', dept)
        Notification.objects.create(user=user, type='INFO', title='D', message='M')
        Notification.objects.create(user=user, type='INFO', title='E', message='M')
        _login(client, user)
        resp = client.put('/api/v1/notifications/mark-all-read/')
        assert resp.status_code == 200
        assert Notification.objects.filter(user=user, is_read=False).count() == 0

    def test_cannot_read_others_notification(self, client, dept):
        user1  = _create_user('notif5@test.com', 'EMPLOYEE', dept)
        user2  = _create_user('notif6@test.com', 'EMPLOYEE', dept)
        notif  = Notification.objects.create(user=user2, type='INFO', title='X', message='M')
        _login(client, user1)
        resp = client.put(f'/api/v1/notifications/{notif.id}/read/')
        assert resp.status_code == 404
