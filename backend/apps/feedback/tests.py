"""
Tests: Feedback module
"""
import pytest
from rest_framework.test import APIClient
from apps.users.models import User, Department, OrgHierarchy
from apps.review_cycles.models import ReviewCycle, Template, TemplateSection, TemplateQuestion, CycleParticipant
from apps.reviewer_workflow.models import ReviewerTask
from apps.feedback.models import AggregatedResult


@pytest.fixture
def client():
    return APIClient()


@pytest.fixture
def dept(db):
    return Department.objects.create(name='FB-Test')


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


def _build_cycle_and_task(reviewer, reviewee, state='ACTIVE'):
    template = Template.objects.create(name='FB-T', is_active=True)
    section  = TemplateSection.objects.create(template=template, title='S', display_order=1)
    q_rating = TemplateQuestion.objects.create(
        section=section, question_text='Rate overall?', type='RATING', display_order=1, is_required=True
    )
    q_text   = TemplateQuestion.objects.create(
        section=section, question_text='Comments?', type='TEXT', display_order=2, is_required=False
    )
    cycle = ReviewCycle.objects.create(
        name='FB Cycle', template=template,
        review_deadline='2026-03-31 23:59:00+00:00',
        state=state,
    )
    CycleParticipant.objects.create(cycle=cycle, user=reviewee)
    task = ReviewerTask.objects.create(
        cycle=cycle, reviewer=reviewer, reviewee=reviewee,
        reviewer_type='MANAGER', status='PENDING',
    )
    return cycle, task, q_rating, q_text


class TestSubmitFeedback:
    def test_reviewer_can_submit_feedback(self, client, dept):
        reviewer = _make('fb_rev@test.com', 'MANAGER', dept)
        reviewee = _make('fb_emp@test.com', 'EMPLOYEE', dept)
        cycle, task, q_rating, q_text = _build_cycle_and_task(reviewer, reviewee)
        _login(client, reviewer)
        resp = client.post(f'/api/v1/feedback/tasks/{task.id}/submit/', {
            'answers': [
                {'question_id': str(q_rating.id), 'rating_value': 4},
                {'question_id': str(q_text.id),   'text_value': 'Good work'},
            ]
        }, format='json')
        assert resp.status_code == 200
        task.refresh_from_db()
        assert task.status == 'SUBMITTED'

    def test_cannot_submit_for_others_task(self, client, dept):
        reviewer = _make('fb_rev2@test.com', 'MANAGER', dept)
        other    = _make('fb_oth@test.com', 'MANAGER', dept)
        reviewee = _make('fb_emp2@test.com', 'EMPLOYEE', dept)
        cycle, task, q_rating, _ = _build_cycle_and_task(reviewer, reviewee)
        _login(client, other)
        resp = client.post(f'/api/v1/feedback/tasks/{task.id}/submit/', {
            'answers': [{'question_id': str(q_rating.id), 'rating_value': 3}]
        }, format='json')
        assert resp.status_code in (403, 404)

    def test_cannot_resubmit_submitted_task(self, client, dept):
        reviewer = _make('fb_rev3@test.com', 'MANAGER', dept)
        reviewee = _make('fb_emp3@test.com', 'EMPLOYEE', dept)
        cycle, task, q_rating, _ = _build_cycle_and_task(reviewer, reviewee)
        task.status = 'SUBMITTED'
        task.save()
        _login(client, reviewer)
        resp = client.post(f'/api/v1/feedback/tasks/{task.id}/submit/', {
            'answers': [{'question_id': str(q_rating.id), 'rating_value': 2}]
        }, format='json')
        assert resp.status_code in (400, 409)


class TestReports:
    def _setup_result(self, reviewee):
        template = Template.objects.create(name='Rpt-T', is_active=True)
        cycle    = ReviewCycle.objects.create(
            name='Rpt Cycle', template=template,
            review_deadline='2026-03-31 23:59:00+00:00',
            state='RESULTS_RELEASED',
        )
        CycleParticipant.objects.create(cycle=cycle, user=reviewee)
        AggregatedResult.objects.create(
            cycle=cycle, reviewee=reviewee,
            overall_score=4.0, self_score=3.5, manager_score=4.5, peer_score=4.0,
        )
        return cycle

    def test_employee_can_see_own_report(self, client, dept):
        emp   = _make('rpt_emp@test.com', 'EMPLOYEE', dept)
        cycle = self._setup_result(emp)
        _login(client, emp)
        resp = client.get(f'/api/v1/feedback/cycles/{cycle.id}/my-report/')
        assert resp.status_code == 200

    def test_manager_can_see_employee_report(self, client, dept):
        mgr = _make('rpt_mgr@test.com', 'MANAGER', dept)
        emp = _make('rpt_emp2@test.com', 'EMPLOYEE', dept)
        OrgHierarchy.objects.create(employee=emp, manager=mgr)
        cycle = self._setup_result(emp)
        _login(client, mgr)
        resp = client.get(f'/api/v1/feedback/cycles/{cycle.id}/reports/{emp.id}/')
        assert resp.status_code == 200

    def test_employee_cannot_see_peers_report(self, client, dept):
        emp1 = _make('rpt_e1@test.com', 'EMPLOYEE', dept)
        emp2 = _make('rpt_e2@test.com', 'EMPLOYEE', dept)
        cycle = self._setup_result(emp2)
        _login(client, emp1)
        resp = client.get(f'/api/v1/feedback/cycles/{cycle.id}/reports/{emp2.id}/')
        assert resp.status_code == 403
