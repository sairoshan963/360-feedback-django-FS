"""
Tests: Authentication module
"""
import pytest
from rest_framework.test import APIClient
from apps.users.models import User, Department


@pytest.fixture
def client():
    return APIClient()


@pytest.fixture
def dept(db):
    return Department.objects.create(name='Auth-Test')


@pytest.fixture
def user(db, dept):
    return User.objects.create_user(
        email='auth@test.com', password='Test@1234',
        first_name='Auth', last_name='User',
        role='EMPLOYEE', department=dept,
    )


def _auth(client, user):
    resp = client.post('/api/v1/auth/login/', {'email': user.email, 'password': 'Test@1234'}, format='json')
    assert resp.status_code == 200
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {resp.data["access"]}')


class TestLogin:
    def test_valid_credentials_return_tokens(self, client, user):
        resp = client.post('/api/v1/auth/login/', {'email': 'auth@test.com', 'password': 'Test@1234'}, format='json')
        assert resp.status_code == 200
        assert 'access' in resp.data
        assert 'refresh' in resp.data
        assert 'user' in resp.data

    def test_wrong_password_rejected(self, client, user):
        resp = client.post('/api/v1/auth/login/', {'email': 'auth@test.com', 'password': 'Wrong!'}, format='json')
        assert resp.status_code in (400, 401)

    def test_unknown_email_rejected(self, client, db):
        resp = client.post('/api/v1/auth/login/', {'email': 'nobody@test.com', 'password': 'Test@1234'}, format='json')
        assert resp.status_code in (400, 401)

    def test_inactive_user_rejected(self, client, user):
        user.status = 'INACTIVE'
        user.save()
        resp = client.post('/api/v1/auth/login/', {'email': 'auth@test.com', 'password': 'Test@1234'}, format='json')
        assert resp.status_code in (400, 401, 403)

    def test_missing_fields_rejected(self, client, db):
        resp = client.post('/api/v1/auth/login/', {'email': ''}, format='json')
        assert resp.status_code == 400


class TestTokenRefresh:
    def test_valid_refresh_token_returns_new_access(self, client, user):
        login = client.post('/api/v1/auth/login/', {'email': 'auth@test.com', 'password': 'Test@1234'}, format='json')
        resp  = client.post('/api/v1/auth/refresh/', {'refresh': login.data['refresh']}, format='json')
        assert resp.status_code == 200
        assert 'access' in resp.data

    def test_invalid_refresh_token_rejected(self, client, db):
        resp = client.post('/api/v1/auth/refresh/', {'refresh': 'not-a-token'}, format='json')
        assert resp.status_code == 401


class TestProfile:
    def test_get_profile(self, client, user):
        _auth(client, user)
        resp = client.get('/api/v1/auth/me/')
        assert resp.status_code == 200
        assert resp.data['user']['email'] == user.email

    def test_unauthenticated_profile_rejected(self, client, db):
        resp = client.get('/api/v1/auth/me/')
        assert resp.status_code == 401

    def test_update_profile_first_name(self, client, user):
        _auth(client, user)
        resp = client.patch('/api/v1/auth/me/profile/', {
            'first_name': 'Updated', 'last_name': 'User'
        }, format='json')
        assert resp.status_code == 200
        user.refresh_from_db()
        assert user.first_name == 'Updated'


class TestChangePassword:
    def test_change_password_success(self, client, user):
        _auth(client, user)
        resp = client.post('/api/v1/auth/me/password/', {
            'current_password': 'Test@1234',
            'new_password': 'NewPass@5678',
        }, format='json')
        assert resp.status_code == 200

    def test_wrong_current_password_rejected(self, client, user):
        _auth(client, user)
        resp = client.post('/api/v1/auth/me/password/', {
            'current_password': 'wrongpass',
            'new_password': 'NewPass@5678',
        }, format='json')
        assert resp.status_code in (400, 401)


class TestPasswordReset:
    def test_forgot_password_valid_email(self, client, user):
        resp = client.post('/api/v1/auth/forgot-password/', {'email': user.email}, format='json')
        assert resp.status_code == 200

    def test_forgot_password_unknown_email_still_200(self, client, db):
        resp = client.post('/api/v1/auth/forgot-password/', {'email': 'ghost@test.com'}, format='json')
        assert resp.status_code == 200
