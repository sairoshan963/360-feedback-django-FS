"""
Tests: Support module
"""
import pytest
from rest_framework.test import APIClient
from apps.users.models import User, Department
from apps.support.models import SupportTicket


@pytest.fixture
def client():
    return APIClient()


@pytest.fixture
def dept(db):
    return Department.objects.create(name='Sup-Test')


def _create_user(email, role, dept):
    return User.objects.create_user(
        email=email, password='Test@1234',
        first_name='S', last_name='U', role=role, department=dept,
    )


def _login(client, user):
    resp = client.post('/api/v1/auth/login/', {'email': user.email, 'password': 'Test@1234'}, format='json')
    assert resp.status_code == 200
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {resp.data["access"]}')


class TestSupport:
    def test_any_user_can_submit_report(self, client, dept):
        emp = _create_user('sup_e@test.com', 'EMPLOYEE', dept)
        _login(client, emp)
        resp = client.post('/api/v1/support/report/', {
            'type': 'Bug',
            'message': 'The export button crashes.',
            'page': '/reports',
        }, format='json')
        assert resp.status_code == 200
        assert SupportTicket.objects.filter(submitted_by=emp).exists()

    def test_empty_message_rejected(self, client, dept):
        emp = _create_user('sup_e2@test.com', 'EMPLOYEE', dept)
        _login(client, emp)
        resp = client.post('/api/v1/support/report/', {'message': ''}, format='json')
        assert resp.status_code == 400

    def test_unauthenticated_cannot_submit(self, client, db):
        resp = client.post('/api/v1/support/report/', {'message': 'test'}, format='json')
        assert resp.status_code == 401

    def test_invalid_type_falls_back_to_general(self, client, dept):
        emp = _create_user('sup_e3@test.com', 'EMPLOYEE', dept)
        _login(client, emp)
        resp = client.post('/api/v1/support/report/', {
            'type': 'InvalidType',
            'message': 'This should still work.',
        }, format='json')
        assert resp.status_code == 200
        ticket = SupportTicket.objects.filter(submitted_by=emp).last()
        assert ticket.type == 'General'
