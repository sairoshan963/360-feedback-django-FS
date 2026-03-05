"""
Tests: Review Cycles module
"""
import pytest
from rest_framework.test import APIClient
from apps.users.models import User, Department
from apps.review_cycles.models import ReviewCycle


@pytest.fixture
def client():
    return APIClient()


@pytest.fixture
def dept(db):
    return Department.objects.create(name='RC-Test')


def _make(email, role, dept):
    return User.objects.create_user(
        email=email, password='Test@1234',
        first_name='Test', last_name=role.title(),
        role=role, department=dept,
    )


def _login(client, user):
    resp = client.post('/api/v1/auth/login/', {'email': user.email, 'password': 'Test@1234'}, format='json')
    assert resp.status_code == 200
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {resp.data["access"]}')


def _make_template(client):
    payload = {
        'name': 'Test Template',
        'sections': [{
            'title': 'Core Competencies',
            'display_order': 1,
            'questions': [
                {'question_text': 'How well does this person communicate?', 'type': 'RATING', 'display_order': 1, 'is_required': True},
                {'question_text': 'Describe their strengths.', 'type': 'TEXT', 'display_order': 2, 'is_required': False},
            ]
        }]
    }
    resp = client.post('/api/v1/cycles/templates/', payload, format='json')
    assert resp.status_code == 201, resp.data
    return resp.data['template']['id']


def _make_cycle(client, template_id):
    payload = {
        'name': 'Q1 2026 Review',
        'template_id': template_id,
        'review_deadline': '2026-03-31T23:59:00Z',
        'peer_enabled': False,
    }
    resp = client.post('/api/v1/cycles/', payload, format='json')
    assert resp.status_code == 201, resp.data
    return resp.data['cycle']['id']


class TestTemplates:
    def test_hr_can_create_template(self, client, dept):
        hr = _make('hr_t@test.com', 'HR_ADMIN', dept)
        _login(client, hr)
        tid = _make_template(client)
        assert tid is not None

    def test_hr_can_list_templates(self, client, dept):
        hr = _make('hr_t2@test.com', 'HR_ADMIN', dept)
        _login(client, hr)
        _make_template(client)
        resp = client.get('/api/v1/cycles/templates/')
        assert resp.status_code == 200
        assert len(resp.data['templates']) >= 1

    def test_employee_cannot_create_template(self, client, dept):
        emp = _make('emp_t@test.com', 'EMPLOYEE', dept)
        _login(client, emp)
        resp = client.post('/api/v1/cycles/templates/', {'name': 'X', 'sections': []}, format='json')
        assert resp.status_code == 403


class TestReviewCycleCRUD:
    def test_hr_can_create_cycle(self, client, dept):
        hr = _make('hr_c@test.com', 'HR_ADMIN', dept)
        _login(client, hr)
        cid = _make_cycle(client, _make_template(client))
        assert cid is not None

    def test_cycle_starts_in_draft(self, client, dept):
        hr = _make('hr_c2@test.com', 'HR_ADMIN', dept)
        _login(client, hr)
        cid = _make_cycle(client, _make_template(client))
        assert ReviewCycle.objects.get(id=cid).state == 'DRAFT'

    def test_hr_can_list_cycles(self, client, dept):
        hr = _make('hr_c3@test.com', 'HR_ADMIN', dept)
        _login(client, hr)
        resp = client.get('/api/v1/cycles/')
        assert resp.status_code == 200

    def test_employee_cannot_create_cycle(self, client, dept):
        emp = _make('emp_c@test.com', 'EMPLOYEE', dept)
        _login(client, emp)
        resp = client.post('/api/v1/cycles/', {}, format='json')
        assert resp.status_code == 403


class TestCycleStateMachine:
    def _setup(self, client, dept):
        hr  = _make('hr_sm@test.com', 'HR_ADMIN', dept)
        emp = _make('emp_sm@test.com', 'EMPLOYEE', dept)
        _login(client, hr)
        cid = _make_cycle(client, _make_template(client))
        client.post(f'/api/v1/cycles/{cid}/participants/', {'participant_ids': [str(emp.id)]}, format='json')
        return cid

    def test_activate_cycle(self, client, dept):
        cid = self._setup(client, dept)
        resp = client.post(f'/api/v1/cycles/{cid}/activate/')
        assert resp.status_code == 200
        assert ReviewCycle.objects.get(id=cid).state == 'ACTIVE'

    def test_cannot_activate_twice(self, client, dept):
        cid = self._setup(client, dept)
        client.post(f'/api/v1/cycles/{cid}/activate/')
        resp = client.post(f'/api/v1/cycles/{cid}/activate/')
        assert resp.status_code in (400, 409)

    def test_finalize_peer_cycle(self, client, dept):
        """Peer cycle: DRAFT → NOMINATION (activate) → ACTIVE (finalize)."""
        from apps.reviewer_workflow.models import PeerNomination
        from apps.review_cycles.models import CycleParticipant
        hr   = _make('hr_sm2@test.com', 'HR_ADMIN', dept)
        emp  = _make('emp_sm2@test.com', 'EMPLOYEE', dept)
        peer = _make('peer_sm2@test.com', 'EMPLOYEE', dept)
        _login(client, hr)
        tid = _make_template(client)
        payload = {
            'name': 'Peer Cycle Test',
            'template_id': tid,
            'review_deadline': '2026-04-30T23:59:00Z',
            'nomination_deadline': '2026-04-01T23:59:00Z',
            'peer_enabled': True,
            'peer_min_count': 1,
            'peer_max_count': 3,
        }
        r = client.post('/api/v1/cycles/', payload, format='json')
        assert r.status_code == 201, r.data
        cid   = r.data['cycle']['id']
        cycle = ReviewCycle.objects.get(id=cid)
        client.post(f'/api/v1/cycles/{cid}/participants/', {'participant_ids': [str(emp.id), str(peer.id)]}, format='json')
        # DRAFT → NOMINATION
        r1 = client.post(f'/api/v1/cycles/{cid}/activate/')
        assert r1.status_code == 200
        assert ReviewCycle.objects.get(id=cid).state == 'NOMINATION'
        # Each participant needs ≥1 approved nomination
        PeerNomination.objects.create(cycle=cycle, reviewee=emp,  peer=peer, status='APPROVED')
        PeerNomination.objects.create(cycle=cycle, reviewee=peer, peer=emp,  status='APPROVED')
        # NOMINATION → ACTIVE
        r2 = client.post(f'/api/v1/cycles/{cid}/finalize/')
        assert r2.status_code == 200
        assert ReviewCycle.objects.get(id=cid).state == 'ACTIVE'

    def test_close_cycle(self, client, dept):
        cid = self._setup(client, dept)
        client.post(f'/api/v1/cycles/{cid}/activate/')
        resp = client.post(f'/api/v1/cycles/{cid}/close/')
        assert resp.status_code == 200
        assert ReviewCycle.objects.get(id=cid).state == 'CLOSED'

    def test_invalid_transition_rejected(self, client, dept):
        cid = self._setup(client, dept)
        resp = client.post(f'/api/v1/cycles/{cid}/close/')
        assert resp.status_code in (400, 409)
