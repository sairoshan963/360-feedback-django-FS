"""
Shared fixtures used across all test modules.
"""
import pytest
from rest_framework.test import APIClient
from apps.users.models import User, Department


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def dept(db):
    return Department.objects.create(name='Engineering')


def _make_user(role, email, dept=None, **kwargs):
    user = User.objects.create_user(
        email=email,
        password='Test@1234',
        first_name='Test',
        last_name=role.capitalize(),
        role=role,
        department=dept,
        **kwargs,
    )
    return user


@pytest.fixture
def super_admin(db, dept):
    return _make_user('SUPER_ADMIN', 'super@test.com', dept)


@pytest.fixture
def hr_admin(db, dept):
    return _make_user('HR_ADMIN', 'hr@test.com', dept)


@pytest.fixture
def manager(db, dept):
    return _make_user('MANAGER', 'manager@test.com', dept)


@pytest.fixture
def employee(db, dept):
    return _make_user('EMPLOYEE', 'employee@test.com', dept)


def auth(client, user):
    """Log in and attach JWT token to the client."""
    resp = client.post('/api/v1/auth/login/', {'email': user.email, 'password': 'Test@1234'}, format='json')
    assert resp.status_code == 200, f'Login failed: {resp.data}'
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {resp.data["access_token"]}')
    return client
