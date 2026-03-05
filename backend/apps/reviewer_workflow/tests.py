"""
Tests: Reviewer Workflow module
"""
import pytest
from rest_framework.test import APIClient
from apps.users.models import User, Department
from apps.review_cycles.models import ReviewCycle, Template, TemplateSection, TemplateQuestion, CycleParticipant
from apps.reviewer_workflow.models import ReviewerTask, PeerNomination


@pytest.fixture
def client():
    return APIClient()


@pytest.fixture
def dept(db):
    return Department.objects.create(name='RW-Test')


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


def _build_active_cycle(reviewer, reviewee):
    template = Template.objects.create(name='T', is_active=True)
    section  = TemplateSection.objects.create(template=template, title='S', display_order=1)
    q        = TemplateQuestion.objects.create(
        section=section, question_text='Rate?', type='RATING', display_order=1, is_required=True
    )
    cycle = ReviewCycle.objects.create(
        name='Test Cycle', template=template,
        review_deadline='2026-03-31 23:59:00+00:00',
        state='ACTIVE',
    )
    CycleParticipant.objects.create(cycle=cycle, user=reviewee)
    task = ReviewerTask.objects.create(
        cycle=cycle, reviewer=reviewer, reviewee=reviewee,
        reviewer_type='MANAGER', status='PENDING',
    )
    return cycle, task, q


class TestTaskList:
    def test_reviewer_can_see_own_tasks(self, client, dept):
        reviewer = _make('reviewer@test.com', 'MANAGER', dept)
        reviewee = _make('reviewee@test.com', 'EMPLOYEE', dept)
        _build_active_cycle(reviewer, reviewee)
        _login(client, reviewer)
        resp = client.get('/api/v1/tasks/')
        assert resp.status_code == 200
        assert len(resp.data['tasks']) >= 1

    def test_user_does_not_see_others_tasks(self, client, dept):
        reviewer  = _make('rev2@test.com', 'MANAGER', dept)
        reviewer2 = _make('rev3@test.com', 'MANAGER', dept)
        reviewee  = _make('rev4@test.com', 'EMPLOYEE', dept)
        _build_active_cycle(reviewer, reviewee)
        _login(client, reviewer2)
        resp = client.get('/api/v1/tasks/')
        assert resp.status_code == 200
        assert len(resp.data['tasks']) == 0


class TestDraftSave:
    def test_reviewer_can_save_draft(self, client, dept):
        reviewer = _make('rev_d@test.com', 'MANAGER', dept)
        reviewee = _make('rev_e@test.com', 'EMPLOYEE', dept)
        cycle, task, q = _build_active_cycle(reviewer, reviewee)
        _login(client, reviewer)
        resp = client.post(f'/api/v1/tasks/{task.id}/draft/', {
            'answers': [{'question_id': str(q.id), 'rating_value': 4}]
        }, format='json')
        assert resp.status_code == 200
        task.refresh_from_db()
        assert task.status == 'IN_PROGRESS'


class TestPeerNominations:
    def _peer_cycle(self, reviewee, peer):
        template = Template.objects.create(name='PT', is_active=True)
        section  = TemplateSection.objects.create(template=template, title='S', display_order=1)
        TemplateQuestion.objects.create(section=section, question_text='Q?', type='RATING', display_order=1)
        cycle = ReviewCycle.objects.create(
            name='Peer Cycle', template=template,
            review_deadline='2026-03-31 23:59:00+00:00',
            state='NOMINATION', peer_enabled=True, peer_min_count=1,
        )
        CycleParticipant.objects.create(cycle=cycle, user=reviewee)
        CycleParticipant.objects.create(cycle=cycle, user=peer)
        return cycle

    def test_employee_can_nominate_peer(self, client, dept):
        reviewee = _make('nom_e@test.com', 'EMPLOYEE', dept)
        peer     = _make('nom_p@test.com', 'EMPLOYEE', dept)
        cycle    = self._peer_cycle(reviewee, peer)
        _login(client, reviewee)
        resp = client.post(f'/api/v1/tasks/cycles/{cycle.id}/nominations/', {
            'peer_ids': [str(peer.id)]
        }, format='json')
        assert resp.status_code in (200, 201)
        assert PeerNomination.objects.filter(cycle=cycle, reviewee=reviewee, peer=peer).exists()

    def test_hr_can_approve_nomination(self, client, dept):
        hr       = _make('nom_hr@test.com', 'HR_ADMIN', dept)
        reviewee = _make('nom_e2@test.com', 'EMPLOYEE', dept)
        peer     = _make('nom_p2@test.com', 'EMPLOYEE', dept)
        cycle    = self._peer_cycle(reviewee, peer)
        nom = PeerNomination.objects.create(cycle=cycle, reviewee=reviewee, peer=peer, status='PENDING')
        _login(client, hr)
        resp = client.patch(f'/api/v1/tasks/nominations/{nom.id}/decide/', {
            'status': 'APPROVED'
        }, format='json')
        assert resp.status_code == 200
        nom.refresh_from_db()
        assert nom.status == 'APPROVED'

    def test_hr_can_reject_nomination(self, client, dept):
        hr       = _make('nom_hr2@test.com', 'HR_ADMIN', dept)
        reviewee = _make('nom_e3@test.com', 'EMPLOYEE', dept)
        peer     = _make('nom_p3@test.com', 'EMPLOYEE', dept)
        cycle    = self._peer_cycle(reviewee, peer)
        nom = PeerNomination.objects.create(cycle=cycle, reviewee=reviewee, peer=peer, status='PENDING')
        _login(client, hr)
        resp = client.patch(f'/api/v1/tasks/nominations/{nom.id}/decide/', {
            'status': 'REJECTED', 'rejection_note': 'Not a direct peer'
        }, format='json')
        assert resp.status_code == 200
        nom.refresh_from_db()
        assert nom.status == 'REJECTED'
