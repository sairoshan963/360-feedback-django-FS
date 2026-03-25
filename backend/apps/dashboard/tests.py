"""
Tests: Dashboard module
"""
import pytest
from rest_framework.test import APIClient
from apps.users.models import User, Department
from apps.review_cycles.models import ReviewCycle, Template, TemplateSection, CycleParticipant
from apps.reviewer_workflow.models import ReviewerTask


@pytest.fixture
def client():
    return APIClient()


@pytest.fixture
def dept(db):
    return Department.objects.create(name='Dash-Test')


def _create_user(email, role, dept):
    return User.objects.create_user(
        email=email, password='Test@1234',
        first_name='D', last_name='U', role=role, department=dept,
    )


def _login(client, user):
    resp = client.post('/api/v1/auth/login/', {'email': user.email, 'password': 'Test@1234'}, format='json')
    assert resp.status_code == 200
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {resp.data["access"]}')


def _make_cycle_with_tasks(reviewee, reviewer):
    template = Template.objects.create(name='Dash-T', is_active=True)
    TemplateSection.objects.create(template=template, title='S', display_order=1)
    cycle = ReviewCycle.objects.create(
        name='Dash Cycle', template=template,
        review_deadline='2026-03-31 23:59:00+00:00',
        state='ACTIVE',
    )
    CycleParticipant.objects.create(cycle=cycle, user=reviewee)
    ReviewerTask.objects.create(
        cycle=cycle, reviewer=reviewer, reviewee=reviewee,
        reviewer_type='MANAGER', status='SUBMITTED',
    )
    return cycle


class TestDashboard:
    def test_hr_can_see_summary_stats(self, client, dept):
        hr = _create_user('dash_hr@test.com', 'HR_ADMIN', dept)
        _login(client, hr)
        resp = client.get('/api/v1/dashboard/summary/')
        assert resp.status_code == 200
        assert 'total_users' in resp.data

    def test_hr_can_see_cycle_dashboard(self, client, dept):
        hr  = _create_user('dash_hr2@test.com', 'HR_ADMIN', dept)
        emp = _create_user('dash_emp@test.com', 'EMPLOYEE', dept)
        cycle = _make_cycle_with_tasks(emp, hr)
        _login(client, hr)
        resp = client.get(f'/api/v1/dashboard/hr/{cycle.id}/')
        assert resp.status_code == 200
        assert 'participation_rate' in resp.data['dashboard']
        assert 'submission_stats' in resp.data['dashboard']

    def test_manager_can_see_team_dashboard(self, client, dept):
        mgr = _create_user('dash_mgr@test.com', 'MANAGER', dept)
        emp = _create_user('dash_emp2@test.com', 'EMPLOYEE', dept)
        cycle = _make_cycle_with_tasks(emp, mgr)
        _login(client, mgr)
        resp = client.get(f'/api/v1/dashboard/manager/{cycle.id}/')
        assert resp.status_code == 200
        assert 'team' in resp.data['dashboard']

    def test_employee_cannot_see_hr_dashboard(self, client, dept):
        emp = _create_user('dash_emp3@test.com', 'EMPLOYEE', dept)
        hr  = _create_user('dash_hr3@test.com', 'HR_ADMIN', dept)
        cycle = _make_cycle_with_tasks(emp, hr)
        _login(client, emp)
        resp = client.get(f'/api/v1/dashboard/hr/{cycle.id}/')
        assert resp.status_code == 403

    def test_hr_can_see_heatmap(self, client, dept):
        hr = _create_user('dash_hr4@test.com', 'HR_ADMIN', dept)
        _login(client, hr)
        resp = client.get('/api/v1/dashboard/heatmap/')
        assert resp.status_code == 200
        assert 'heatmap' in resp.data
