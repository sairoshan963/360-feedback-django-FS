"""
Management command: seed_demo
Creates 4 cycles frozen at different stages so every feature can be shown live.
Safe to re-run — cleans old demo data then recreates everything.

Usage: python manage.py seed_demo
Prerequisite: python manage.py seed_users  (users + template must exist first)

Cycles created:
  [DEMO] Q4 2026 — Draft            → DRAFT             (show cycle creation options)
  [DEMO] Q3 2026 — Nominations      → NOMINATION        (show peer nomination + approval flow)
  [DEMO] Q2 2026 — Active           → ACTIVE            (show pending tasks + partial progress)
  [DEMO] Q1 2026 — Results Released → RESULTS_RELEASED  (show 360 report with real scores)
"""
from datetime import timedelta
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone
from django.contrib.auth import get_user_model

User = get_user_model()


# ── Answer templates per reviewer type ────────────────────────────────────────

ANSWERS = {
    'SELF': {
        'ratings': {'tech': 4, 'comm': 4, 'collab': 4},
        'texts': {
            'tech':   'I have strong experience with backend systems and cloud architecture.',
            'comm':   'I communicate clearly in meetings and always follow up in writing.',
            'collab': 'I work well across teams and enjoy pair programming sessions.',
            'str':    'Problem-solving and staying calm under pressure.',
            'imp':    'Can improve on documentation and more proactive knowledge sharing.',
        },
    },
    'MANAGER': {
        'ratings': {'tech': 3, 'comm': 4, 'collab': 4},
        'texts': {
            'tech':   'Consistently delivers high-quality work and takes ownership of complex problems.',
            'comm':   'Communicates blockers early and gives clear status updates.',
            'collab': 'A reliable team member who supports colleagues beyond their own scope.',
            'str':    'Technical depth and commitment to quality.',
            'imp':    'Could mentor junior members more proactively.',
        },
    },
    'PEER': {
        'ratings': {'tech': 4, 'comm': 5, 'collab': 5},
        'texts': {
            'tech':   'Strong technical skills, especially in debugging and system design.',
            'comm':   'Always approachable and explains complex topics in simple terms.',
            'collab': 'One of the best collaborators I have worked with — always willing to help.',
            'str':    'Collaborative spirit and positive attitude.',
            'imp':    'Sometimes takes too long to delegate — could trust others more.',
        },
    },
    'DIRECT_REPORT': {
        'ratings': {'tech': 4, 'comm': 3, 'collab': 4},
        'texts': {
            'tech':   'Has great technical knowledge and guides us when we are stuck.',
            'comm':   'Sets clear expectations and is easy to approach with questions.',
            'collab': 'Encourages team input and values different perspectives.',
            'str':    'Supportive leadership and clear goal-setting.',
            'imp':    'More regular one-on-ones would be appreciated.',
        },
    },
}


class Command(BaseCommand):
    help = 'Seed 4 demo cycles covering all lifecycle states for live demonstrations'

    def handle(self, *args, **options):
        from apps.review_cycles.models import Template

        self.stdout.write('\n🚀  Demo Seed Script — 360 Feedback System\n')

        # Resolve users by email (no hardcoded UUIDs)
        self.U = self._load_users()
        if self.U is None:
            return

        # Resolve template
        self.template = Template.objects.filter(name='Standard 360° Review').first()
        if not self.template:
            self.stdout.write(self.style.ERROR(
                'Template not found. Run "python manage.py seed_users" first.'
            ))
            return

        # Resolve question IDs by text
        self.Q = self._load_questions()
        if self.Q is None:
            return

        with transaction.atomic():
            self.stdout.write('🧹  Cleaning up old demo cycles...')
            self._cleanup_demo_cycles()

            self._seed_draft_cycle()
            self._seed_nomination_cycle()
            self._seed_active_cycle()
            self._seed_results_cycle()

        self._print_summary()

    # ── User loader ───────────────────────────────────────────────────────────

    def _load_users(self):
        emails = [
            'hr@gamyam.com',
            'admin@gamyam.com',
            'manager1@gamyam.com',
            'manager2@gamyam.com',
            'emp1@gamyam.com',
            'emp2@gamyam.com',
            'emp3@gamyam.com',
            'emp4@gamyam.com',
            'emp5@gamyam.com',
        ]
        users = {}
        missing = []
        for email in emails:
            try:
                users[email] = User.objects.get(email=email)
            except User.DoesNotExist:
                missing.append(email)

        if missing:
            self.stdout.write(self.style.ERROR(
                f'Missing users: {missing}\nRun "python manage.py seed_users" first.'
            ))
            return None
        return users

    # ── Question loader ───────────────────────────────────────────────────────

    def _load_questions(self):
        from apps.review_cycles.models import TemplateQuestion

        question_texts = {
            'tech_r':   'How would you rate the technical expertise?',
            'tech_t':   'What technical strengths have you observed?',
            'comm_r':   'How effective is the communication?',
            'comm_t':   'Provide examples of good communication.',
            'collab_r': 'How well does this person collaborate?',
            'collab_t': 'Describe their contribution to team success.',
            'str_t':    'What are the key strengths?',
            'imp_t':    'What areas need improvement?',
        }
        Q = {}
        missing = []
        for key, text in question_texts.items():
            qs = TemplateQuestion.objects.filter(
                question_text=text, section__template=self.template
            ).first()
            if qs:
                Q[key] = qs
            else:
                missing.append(text)

        if missing:
            self.stdout.write(self.style.ERROR(
                f'Missing template questions:\n' + '\n'.join(f'  - {t}' for t in missing)
            ))
            return None
        return Q

    # ── Participant list ───────────────────────────────────────────────────────

    @property
    def _participants(self):
        """
        Returns list of dicts: {user, manager} mirroring the Node.js PARTICIPANTS array.
        """
        U = self.U
        return [
            {'user': U['emp1@gamyam.com'],     'manager': U['manager1@gamyam.com']},
            {'user': U['emp2@gamyam.com'],     'manager': U['manager1@gamyam.com']},
            {'user': U['emp3@gamyam.com'],     'manager': U['manager1@gamyam.com']},
            {'user': U['manager1@gamyam.com'], 'manager': None},
            {'user': U['emp4@gamyam.com'],     'manager': U['manager2@gamyam.com']},
            {'user': U['emp5@gamyam.com'],     'manager': U['manager2@gamyam.com']},
            {'user': U['manager2@gamyam.com'], 'manager': None},
        ]

    # ── Cleanup ───────────────────────────────────────────────────────────────

    def _cleanup_demo_cycles(self):
        from apps.review_cycles.models import ReviewCycle, CycleParticipant
        from apps.reviewer_workflow.models import ReviewerTask, PeerNomination
        from apps.feedback.models import FeedbackResponse, FeedbackAnswer, AggregatedResult

        demo_cycles = ReviewCycle.objects.filter(name__startswith='[DEMO]')
        count = demo_cycles.count()
        if not count:
            self.stdout.write('  No existing demo cycles to clean up')
            return

        task_ids = list(ReviewerTask.objects.filter(cycle__in=demo_cycles).values_list('id', flat=True))
        if task_ids:
            FeedbackAnswer.objects.filter(response__task_id__in=task_ids).delete()
            FeedbackResponse.objects.filter(task_id__in=task_ids).delete()

        AggregatedResult.objects.filter(cycle__in=demo_cycles).delete()
        ReviewerTask.objects.filter(cycle__in=demo_cycles).delete()
        PeerNomination.objects.filter(cycle__in=demo_cycles).delete()
        CycleParticipant.objects.filter(cycle__in=demo_cycles).delete()
        demo_cycles.delete()

        self.stdout.write(f'  Cleaned up {count} existing demo cycle(s)')

    # ── Helpers ───────────────────────────────────────────────────────────────

    def _add_participants(self, cycle, participants):
        from apps.review_cycles.models import CycleParticipant

        for p in participants:
            CycleParticipant.objects.get_or_create(cycle=cycle, user=p['user'])

    def _build_tasks(self, cycle, participants, approved_nominations=None):
        """Mirrors the Node.js buildTasks logic."""
        approved_nominations = approved_nominations or []
        tasks = []
        participant_ids = {p['user'].id for p in participants}

        for reviewee in participants:
            # SELF
            tasks.append({
                'reviewee': reviewee['user'],
                'reviewer': reviewee['user'],
                'reviewer_type': 'SELF',
                'anonymity_mode': cycle.self_anonymity,
            })

            # MANAGER
            if reviewee['manager'] and reviewee['manager'].id in participant_ids:
                tasks.append({
                    'reviewee': reviewee['user'],
                    'reviewer': reviewee['manager'],
                    'reviewer_type': 'MANAGER',
                    'anonymity_mode': cycle.manager_anonymity,
                })

            # DIRECT_REPORTS (current reviewee is a manager for someone)
            for dr in [p for p in participants if p['manager'] and p['manager'].id == reviewee['user'].id]:
                tasks.append({
                    'reviewee': reviewee['user'],
                    'reviewer': dr['user'],
                    'reviewer_type': 'DIRECT_REPORT',
                    'anonymity_mode': 'TRANSPARENT',
                })

            # PEERS (from approved nominations)
            if cycle.peer_enabled:
                for nom in [n for n in approved_nominations if n['reviewee_id'] == reviewee['user'].id]:
                    if nom['peer_id'] in participant_ids:
                        tasks.append({
                            'reviewee': reviewee['user'],
                            'reviewer': User.objects.get(id=nom['peer_id']),
                            'reviewer_type': 'PEER',
                            'anonymity_mode': cycle.peer_anonymity,
                        })

        return tasks

    def _insert_tasks(self, cycle, tasks, status='PENDING'):
        from apps.reviewer_workflow.models import ReviewerTask

        for t in tasks:
            ReviewerTask.objects.get_or_create(
                cycle=cycle,
                reviewee=t['reviewee'],
                reviewer=t['reviewer'],
                defaults={
                    'reviewer_type': t['reviewer_type'],
                    'anonymity_mode': t['anonymity_mode'],
                    'status': status,
                },
            )

    def _submit_task(self, task):
        """Creates a FeedbackResponse + FeedbackAnswers and marks the task SUBMITTED."""
        from apps.feedback.models import FeedbackResponse, FeedbackAnswer

        response, _ = FeedbackResponse.objects.get_or_create(
            task=task,
            defaults={'submitted_by': task.reviewer},
        )

        answers_data = self._get_answers(task.reviewer_type)
        for ans in answers_data:
            FeedbackAnswer.objects.get_or_create(
                response=response,
                question=ans['question'],
                defaults={
                    'rating_value': ans['rating_value'],
                    'text_value':   ans['text_value'],
                },
            )

        task.status = 'SUBMITTED'
        task.save(update_fields=['status', 'updated_at'])

    def _get_answers(self, reviewer_type):
        Q = self.Q
        data = ANSWERS.get(reviewer_type, ANSWERS['SELF'])
        r = data['ratings']
        t = data['texts']
        return [
            {'question': Q['tech_r'],   'rating_value': Decimal(r['tech']),   'text_value': None},
            {'question': Q['tech_t'],   'rating_value': None,                  'text_value': t['tech']},
            {'question': Q['comm_r'],   'rating_value': Decimal(r['comm']),   'text_value': None},
            {'question': Q['comm_t'],   'rating_value': None,                  'text_value': t['comm']},
            {'question': Q['collab_r'], 'rating_value': Decimal(r['collab']), 'text_value': None},
            {'question': Q['collab_t'], 'rating_value': None,                  'text_value': t['collab']},
            {'question': Q['str_t'],    'rating_value': None,                  'text_value': t['str']},
            {'question': Q['imp_t'],    'rating_value': None,                  'text_value': t['imp']},
        ]

    def _compute_aggregation(self, cycle, peer_threshold=2):
        """Mirrors the Node.js computeAggregation logic."""
        from apps.reviewer_workflow.models import ReviewerTask
        from apps.feedback.models import FeedbackAnswer, AggregatedResult

        reviewee_ids = (
            ReviewerTask.objects
            .filter(cycle=cycle)
            .values_list('reviewee_id', flat=True)
            .distinct()
        )

        for reviewee_id in reviewee_ids:
            scores = {'SELF': None, 'MANAGER': None, 'PEER': None, 'DIRECT_REPORT': None}

            for rtype in ['SELF', 'MANAGER', 'PEER', 'DIRECT_REPORT']:
                submitted_tasks = ReviewerTask.objects.filter(
                    cycle=cycle,
                    reviewee_id=reviewee_id,
                    reviewer_type=rtype,
                    status='SUBMITTED',
                )
                if rtype == 'PEER' and submitted_tasks.count() < peer_threshold:
                    continue
                if not submitted_tasks.exists():
                    continue

                ratings = FeedbackAnswer.objects.filter(
                    response__task__in=submitted_tasks,
                    rating_value__isnull=False,
                ).values_list('rating_value', flat=True)

                if ratings:
                    avg = sum(Decimal(str(v)) for v in ratings) / len(ratings)
                    scores[rtype] = round(float(avg), 2)

            non_null = [s for s in scores.values() if s is not None]
            overall = round(sum(non_null) / len(non_null), 2) if non_null else None

            AggregatedResult.objects.update_or_create(
                cycle=cycle,
                reviewee_id=reviewee_id,
                defaults={
                    'overall_score': overall,
                    'self_score':    scores['SELF'],
                    'manager_score': scores['MANAGER'],
                    'peer_score':    scores['PEER'],
                },
            )

    # ── CYCLE 1 — DRAFT ───────────────────────────────────────────────────────

    def _seed_draft_cycle(self):
        from apps.review_cycles.models import ReviewCycle

        self.stdout.write('\n📋  Creating [DEMO] Draft cycle (Q4 2026)...')
        cycle = ReviewCycle.objects.create(
            name='[DEMO] Q4 2026 — Draft',
            description='Upcoming Leadership Effectiveness Review for Q4 2026. Peer review will be enabled.',
            state='DRAFT',
            template=self.template,
            peer_enabled=False,
            manager_anonymity='TRANSPARENT',
            self_anonymity='TRANSPARENT',
            review_deadline=timezone.now().replace(year=2026, month=12, day=31, hour=23, minute=59, second=59),
            quarter='Q4',
            quarter_year=2026,
            created_by=self.U['hr@gamyam.com'],
        )
        self._add_participants(cycle, self._participants)
        self.stdout.write('  ✓ Draft cycle — 9 participants added, no tasks yet')

    # ── CYCLE 2 — NOMINATION ──────────────────────────────────────────────────

    def _seed_nomination_cycle(self):
        from apps.review_cycles.models import ReviewCycle
        from apps.reviewer_workflow.models import PeerNomination

        self.stdout.write('\n🗳️   Creating [DEMO] Nomination cycle (Q3 2026)...')
        U = self.U
        cycle = ReviewCycle.objects.create(
            name='[DEMO] Q3 2026 — Nominations',
            description='Mid-year 360° peer review for Q3 2026. Employees nominate peers; managers approve.',
            state='NOMINATION',
            template=self.template,
            peer_enabled=True,
            peer_min_count=2,
            peer_max_count=4,
            peer_anonymity='ANONYMOUS',
            manager_anonymity='TRANSPARENT',
            self_anonymity='TRANSPARENT',
            nomination_deadline=timezone.now() + timedelta(hours=2),
            review_deadline=timezone.now().replace(year=2026, month=9, day=30, hour=23, minute=59, second=59),
            nomination_approval_mode='MANUAL',
            quarter='Q3',
            quarter_year=2026,
            created_by=U['hr@gamyam.com'],
        )
        self._add_participants(cycle, self._participants)

        nominations = [
            # emp1 (Michael Brown) — 2 approved → DONE
            {'reviewee': U['emp1@gamyam.com'], 'peer': U['emp2@gamyam.com'], 'by': U['emp1@gamyam.com'], 'status': 'APPROVED', 'approved_by': U['manager1@gamyam.com']},
            {'reviewee': U['emp1@gamyam.com'], 'peer': U['emp3@gamyam.com'], 'by': U['emp1@gamyam.com'], 'status': 'APPROVED', 'approved_by': U['manager1@gamyam.com']},
            # emp2 (Jessica Wilson) — 0 nominations → NOT_STARTED (no rows)
            # emp3 (David Martinez) — only 1 approved → INCOMPLETE
            {'reviewee': U['emp3@gamyam.com'], 'peer': U['emp1@gamyam.com'], 'by': U['emp3@gamyam.com'], 'status': 'APPROVED', 'approved_by': U['manager1@gamyam.com']},
            # emp4 (Lisa Anderson) — 2 approved → DONE
            {'reviewee': U['emp4@gamyam.com'], 'peer': U['emp5@gamyam.com'], 'by': U['emp4@gamyam.com'], 'status': 'APPROVED', 'approved_by': U['manager2@gamyam.com']},
            {'reviewee': U['emp4@gamyam.com'], 'peer': U['emp1@gamyam.com'], 'by': U['emp4@gamyam.com'], 'status': 'APPROVED', 'approved_by': U['manager2@gamyam.com']},
            # emp5 (Robert Taylor) — 1 approved, 1 rejected → INCOMPLETE
            {'reviewee': U['emp5@gamyam.com'], 'peer': U['emp4@gamyam.com'], 'by': U['emp5@gamyam.com'], 'status': 'APPROVED', 'approved_by': U['manager2@gamyam.com']},
            {'reviewee': U['emp5@gamyam.com'], 'peer': U['emp1@gamyam.com'], 'by': U['emp5@gamyam.com'], 'status': 'REJECTED', 'approved_by': U['manager2@gamyam.com'], 'rejection_note': 'Conflict of interest identified'},
            # manager1 (John Smith) — 2 approved → DONE
            {'reviewee': U['manager1@gamyam.com'], 'peer': U['manager2@gamyam.com'], 'by': U['manager1@gamyam.com'], 'status': 'APPROVED', 'approved_by': U['admin@gamyam.com']},
            {'reviewee': U['manager1@gamyam.com'], 'peer': U['emp1@gamyam.com'],     'by': U['manager1@gamyam.com'], 'status': 'APPROVED', 'approved_by': U['admin@gamyam.com']},
            # manager2 and emp2 have 0 nominations → NOT_STARTED
        ]

        now = timezone.now()
        for n in nominations:
            PeerNomination.objects.get_or_create(
                cycle=cycle,
                reviewee=n['reviewee'],
                peer=n['peer'],
                defaults={
                    'nominated_by':   n['by'],
                    'status':         n['status'],
                    'approved_by':    n.get('approved_by'),
                    'approved_at':    now if n.get('approved_by') else None,
                    'rejection_note': n.get('rejection_note'),
                },
            )

        self.stdout.write('  ✓ Nomination cycle — mixed nomination statuses seeded')
        self.stdout.write('    emp1 → DONE | emp2 → NOT_STARTED | emp3 → INCOMPLETE')

    # ── CYCLE 3 — ACTIVE ──────────────────────────────────────────────────────

    def _seed_active_cycle(self):
        from apps.review_cycles.models import ReviewCycle
        from apps.reviewer_workflow.models import ReviewerTask, PeerNomination

        self.stdout.write('\n⚡  Creating [DEMO] Active cycle (Q2 2026)...')
        U = self.U
        now = timezone.now()

        cycle = ReviewCycle.objects.create(
            name='[DEMO] Q2 2026 — Active',
            description='Q2 2026 360° Review — currently open for feedback submissions.',
            state='ACTIVE',
            template=self.template,
            peer_enabled=True,
            peer_min_count=2,
            peer_max_count=4,
            peer_anonymity='ANONYMOUS',
            manager_anonymity='TRANSPARENT',
            self_anonymity='TRANSPARENT',
            nomination_deadline=now - timedelta(days=3),
            review_deadline=now + timedelta(days=5),
            nomination_approval_mode='AUTO',
            peer_threshold=2,
            quarter='Q2',
            quarter_year=2026,
            created_by=U['hr@gamyam.com'],
        )
        self._add_participants(cycle, self._participants)

        approved_noms = [
            {'reviewee_id': U['emp1@gamyam.com'].id,     'peer_id': U['emp2@gamyam.com'].id,     'reviewee': U['emp1@gamyam.com'],     'peer': U['emp2@gamyam.com']},
            {'reviewee_id': U['emp1@gamyam.com'].id,     'peer_id': U['emp3@gamyam.com'].id,     'reviewee': U['emp1@gamyam.com'],     'peer': U['emp3@gamyam.com']},
            {'reviewee_id': U['emp2@gamyam.com'].id,     'peer_id': U['emp1@gamyam.com'].id,     'reviewee': U['emp2@gamyam.com'],     'peer': U['emp1@gamyam.com']},
            {'reviewee_id': U['emp2@gamyam.com'].id,     'peer_id': U['emp3@gamyam.com'].id,     'reviewee': U['emp2@gamyam.com'],     'peer': U['emp3@gamyam.com']},
            {'reviewee_id': U['emp3@gamyam.com'].id,     'peer_id': U['emp1@gamyam.com'].id,     'reviewee': U['emp3@gamyam.com'],     'peer': U['emp1@gamyam.com']},
            {'reviewee_id': U['emp3@gamyam.com'].id,     'peer_id': U['emp2@gamyam.com'].id,     'reviewee': U['emp3@gamyam.com'],     'peer': U['emp2@gamyam.com']},
            {'reviewee_id': U['emp4@gamyam.com'].id,     'peer_id': U['emp5@gamyam.com'].id,     'reviewee': U['emp4@gamyam.com'],     'peer': U['emp5@gamyam.com']},
            {'reviewee_id': U['emp4@gamyam.com'].id,     'peer_id': U['emp1@gamyam.com'].id,     'reviewee': U['emp4@gamyam.com'],     'peer': U['emp1@gamyam.com']},
            {'reviewee_id': U['emp5@gamyam.com'].id,     'peer_id': U['emp4@gamyam.com'].id,     'reviewee': U['emp5@gamyam.com'],     'peer': U['emp4@gamyam.com']},
            {'reviewee_id': U['emp5@gamyam.com'].id,     'peer_id': U['emp1@gamyam.com'].id,     'reviewee': U['emp5@gamyam.com'],     'peer': U['emp1@gamyam.com']},
        ]

        now_ts = timezone.now()
        for n in approved_noms:
            PeerNomination.objects.get_or_create(
                cycle=cycle,
                reviewee=n['reviewee'],
                peer=n['peer'],
                defaults={
                    'nominated_by': n['reviewee'],
                    'status': 'APPROVED',
                    'approved_at': now_ts,
                },
            )

        tasks = self._build_tasks(cycle, self._participants, approved_noms)
        self._insert_tasks(cycle, tasks, status='PENDING')

        # Submit a realistic subset — emp1's SELF and DIRECT_REPORT-for-manager1 are done,
        # emp2 self done, manager1 self + manager reviews, emp4 self, manager2 self + manager review
        submit_pairs = [
            {'reviewee': U['emp1@gamyam.com'],     'reviewer': U['emp1@gamyam.com'],     'type': 'SELF'},
            {'reviewee': U['manager1@gamyam.com'], 'reviewer': U['emp1@gamyam.com'],     'type': 'DIRECT_REPORT'},
            {'reviewee': U['emp2@gamyam.com'],     'reviewer': U['emp2@gamyam.com'],     'type': 'SELF'},
            {'reviewee': U['manager1@gamyam.com'], 'reviewer': U['manager1@gamyam.com'], 'type': 'SELF'},
            {'reviewee': U['emp1@gamyam.com'],     'reviewer': U['manager1@gamyam.com'], 'type': 'MANAGER'},
            {'reviewee': U['emp2@gamyam.com'],     'reviewer': U['manager1@gamyam.com'], 'type': 'MANAGER'},
            {'reviewee': U['emp4@gamyam.com'],     'reviewer': U['emp4@gamyam.com'],     'type': 'SELF'},
            {'reviewee': U['manager2@gamyam.com'], 'reviewer': U['manager2@gamyam.com'], 'type': 'SELF'},
            {'reviewee': U['emp4@gamyam.com'],     'reviewer': U['manager2@gamyam.com'], 'type': 'MANAGER'},
        ]

        for sp in submit_pairs:
            task = ReviewerTask.objects.filter(
                cycle=cycle,
                reviewee=sp['reviewee'],
                reviewer=sp['reviewer'],
                reviewer_type=sp['type'],
            ).first()
            if task:
                self._submit_task(task)

        self.stdout.write('  ✓ Active cycle — tasks generated, partial submissions seeded')
        self.stdout.write('    emp3, emp5, manager2-peers all still pending')

    # ── CYCLE 4 — RESULTS_RELEASED ────────────────────────────────────────────

    def _seed_results_cycle(self):
        from apps.review_cycles.models import ReviewCycle
        from apps.reviewer_workflow.models import ReviewerTask, PeerNomination

        self.stdout.write('\n📊  Creating [DEMO] Results Released cycle (Q1 2026)...')
        U = self.U
        now = timezone.now()

        cycle = ReviewCycle.objects.create(
            name='[DEMO] Q1 2026 — Results Released',
            description='Q1 2026 Annual 360° Review — results are now available to all participants.',
            state='RESULTS_RELEASED',
            template=self.template,
            peer_enabled=True,
            peer_min_count=2,
            peer_max_count=4,
            peer_anonymity='ANONYMOUS',
            manager_anonymity='TRANSPARENT',
            self_anonymity='TRANSPARENT',
            nomination_deadline=now - timedelta(days=45),
            review_deadline=now - timedelta(days=20),
            results_released_at=now - timedelta(days=7),
            nomination_approval_mode='AUTO',
            peer_threshold=2,
            quarter='Q1',
            quarter_year=2026,
            created_by=U['hr@gamyam.com'],
        )
        self._add_participants(cycle, self._participants)

        result_noms = [
            {'reviewee_id': U['emp1@gamyam.com'].id,     'peer_id': U['emp2@gamyam.com'].id,     'reviewee': U['emp1@gamyam.com'],     'peer': U['emp2@gamyam.com']},
            {'reviewee_id': U['emp1@gamyam.com'].id,     'peer_id': U['emp3@gamyam.com'].id,     'reviewee': U['emp1@gamyam.com'],     'peer': U['emp3@gamyam.com']},
            {'reviewee_id': U['emp2@gamyam.com'].id,     'peer_id': U['emp1@gamyam.com'].id,     'reviewee': U['emp2@gamyam.com'],     'peer': U['emp1@gamyam.com']},
            {'reviewee_id': U['emp2@gamyam.com'].id,     'peer_id': U['emp3@gamyam.com'].id,     'reviewee': U['emp2@gamyam.com'],     'peer': U['emp3@gamyam.com']},
            {'reviewee_id': U['emp3@gamyam.com'].id,     'peer_id': U['emp1@gamyam.com'].id,     'reviewee': U['emp3@gamyam.com'],     'peer': U['emp1@gamyam.com']},
            {'reviewee_id': U['emp3@gamyam.com'].id,     'peer_id': U['emp2@gamyam.com'].id,     'reviewee': U['emp3@gamyam.com'],     'peer': U['emp2@gamyam.com']},
            {'reviewee_id': U['emp4@gamyam.com'].id,     'peer_id': U['emp5@gamyam.com'].id,     'reviewee': U['emp4@gamyam.com'],     'peer': U['emp5@gamyam.com']},
            {'reviewee_id': U['emp4@gamyam.com'].id,     'peer_id': U['emp1@gamyam.com'].id,     'reviewee': U['emp4@gamyam.com'],     'peer': U['emp1@gamyam.com']},
            {'reviewee_id': U['emp5@gamyam.com'].id,     'peer_id': U['emp4@gamyam.com'].id,     'reviewee': U['emp5@gamyam.com'],     'peer': U['emp4@gamyam.com']},
            {'reviewee_id': U['emp5@gamyam.com'].id,     'peer_id': U['emp1@gamyam.com'].id,     'reviewee': U['emp5@gamyam.com'],     'peer': U['emp1@gamyam.com']},
            {'reviewee_id': U['manager1@gamyam.com'].id, 'peer_id': U['manager2@gamyam.com'].id, 'reviewee': U['manager1@gamyam.com'], 'peer': U['manager2@gamyam.com']},
            {'reviewee_id': U['manager1@gamyam.com'].id, 'peer_id': U['emp1@gamyam.com'].id,     'reviewee': U['manager1@gamyam.com'], 'peer': U['emp1@gamyam.com']},
            {'reviewee_id': U['manager2@gamyam.com'].id, 'peer_id': U['manager1@gamyam.com'].id, 'reviewee': U['manager2@gamyam.com'], 'peer': U['manager1@gamyam.com']},
            {'reviewee_id': U['manager2@gamyam.com'].id, 'peer_id': U['emp4@gamyam.com'].id,     'reviewee': U['manager2@gamyam.com'], 'peer': U['emp4@gamyam.com']},
        ]

        now_ts = timezone.now()
        for n in result_noms:
            PeerNomination.objects.get_or_create(
                cycle=cycle,
                reviewee=n['reviewee'],
                peer=n['peer'],
                defaults={
                    'nominated_by': n['reviewee'],
                    'status': 'APPROVED',
                    'approved_at': now_ts,
                },
            )

        tasks = self._build_tasks(cycle, self._participants, result_noms)
        self._insert_tasks(cycle, tasks, status='PENDING')

        # Submit every single task
        all_tasks = ReviewerTask.objects.filter(cycle=cycle)
        for task in all_tasks:
            self._submit_task(task)

        # Compute aggregated scores
        self._compute_aggregation(cycle, peer_threshold=2)

        # Lock all submitted tasks (cycle is effectively closed)
        ReviewerTask.objects.filter(cycle=cycle, status='SUBMITTED').update(status='LOCKED')

        self.stdout.write('  ✓ Results cycle — all tasks submitted + locked, scores computed')

    # ── Summary ───────────────────────────────────────────────────────────────

    def _print_summary(self):
        self.stdout.write(self.style.SUCCESS("""
✅  Demo seed complete!

┌─────────────────────────────────────────────────────────────────────┐
│  4 DEMO CYCLES READY                                                │
├──────────────────────────────────┬──────────────────────────────────┤
│  [DEMO] Q4 2026 — Draft          │  state: DRAFT                    │
│  [DEMO] Q3 2026 — Nominations    │  state: NOMINATION               │
│  [DEMO] Q2 2026 — Active         │  state: ACTIVE                   │
│  [DEMO] Q1 2026 — Results        │  state: RESULTS_RELEASED         │
├──────────────────────────────────┴──────────────────────────────────┤
│  ALL PASSWORDS: Admin@123                                           │
├─────────────────────────────────────────────────────────────────────┤
│  emp1@gamyam.com    → My Tasks (Q2), Nominations (Q3), Report (Q1) │
│  manager1@gamyam.com → approve nominations in Q3                   │
│  hr@gamyam.com      → HR dashboard, all cycle views                │
│  admin@gamyam.com   → Super Admin, override + audit logs           │
└─────────────────────────────────────────────────────────────────────┘

  DEMO FLOW (suggested order):
  1. HR login   → Cycles page → show all 4 demo cycles at a glance
  2. HR login   → Click [DEMO] Q4 Draft → show cycle config options
  3. HR login   → Click [DEMO] Q3 Nominations → Nomination Status table
  4. Emp login  → My Nominations → see Q3, mixed statuses
  5. Mgr login  → Approve/reject nominations from their queue
  6. Emp login  → My Tasks → see Q2 pending tasks, submit one live
  7. HR login   → Click [DEMO] Q2 Active → Submission Status table
  8. Emp login  → My Report → select Q1 → see full 360 scores
  9. HR login   → View Reports → see all employees' scores for Q1
"""))
