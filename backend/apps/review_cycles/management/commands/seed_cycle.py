"""
Management command: seed_cycle
Creates a live demo cycle in NOMINATION state with a 10-minute nomination window.
Usage: python manage.py seed_cycle
Prerequisite: python manage.py seed_users  (users + template must exist first)
"""
from datetime import timedelta

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone
from django.contrib.auth import get_user_model

User = get_user_model()

CYCLE_NAME = 'Live Demo Cycle — Q1 2026'


class Command(BaseCommand):
    help = 'Create a live NOMINATION demo cycle with a 10-minute window'

    def handle(self, *args, **options):
        from apps.review_cycles.models import Template, ReviewCycle, CycleParticipant

        # 1. Find HR user
        try:
            hr_user = User.objects.get(email='hr@gamyam.com')
        except User.DoesNotExist:
            self.stdout.write(self.style.ERROR(
                'HR user not found. Run "python manage.py seed_users" first.'
            ))
            return

        # 2. Find template
        template = Template.objects.filter(name='Standard 360° Review').first()
        if not template:
            self.stdout.write(self.style.ERROR(
                'Template not found. Run "python manage.py seed_users" first.'
            ))
            return

        # 3. Guard against duplicates
        existing = ReviewCycle.objects.filter(name=CYCLE_NAME).first()
        if existing:
            remaining = (existing.nomination_deadline - timezone.now()).total_seconds()
            self.stdout.write(self.style.WARNING(f'\n⚠️  Demo cycle already exists (ID: {existing.id})'))
            if remaining > 0:
                self.stdout.write(f'   Nomination deadline: {existing.nomination_deadline.strftime("%H:%M:%S")} ({int(remaining)}s remaining)')
            else:
                self.stdout.write('   Nomination deadline has passed. Delete the cycle or rename to re-seed.')
            return

        with transaction.atomic():
            # 4. Create the cycle
            now = timezone.now()
            cycle = ReviewCycle.objects.create(
                name=CYCLE_NAME,
                state='NOMINATION',
                template=template,
                peer_enabled=True,
                peer_min_count=2,
                peer_max_count=5,
                peer_anonymity='ANONYMOUS',
                manager_anonymity='TRANSPARENT',
                self_anonymity='TRANSPARENT',
                nomination_deadline=now + timedelta(minutes=10),
                review_deadline=now + timedelta(days=7),
                quarter='Q1',
                quarter_year=2026,
                created_by=hr_user,
            )

            # 5. Add all active non-SUPER_ADMIN users as participants
            participants = User.objects.filter(status='ACTIVE').exclude(role='SUPER_ADMIN')
            for user in participants:
                CycleParticipant.objects.get_or_create(cycle=cycle, user=user)

        nom_deadline = cycle.nomination_deadline
        rev_deadline = cycle.review_deadline

        self.stdout.write(self.style.SUCCESS('\n✅  Demo cycle created successfully!\n'))
        self.stdout.write(f'   Cycle Name    : {CYCLE_NAME}')
        self.stdout.write(f'   Cycle ID      : {cycle.id}')
        self.stdout.write(f'   State         : NOMINATION (open now)')
        self.stdout.write(f'   Nom. Deadline : {nom_deadline.strftime("%Y-%m-%d %H:%M:%S")} (10 min from now)')
        self.stdout.write(f'   Rev. Deadline : {rev_deadline.strftime("%Y-%m-%d")}')
        self.stdout.write(f'   Participants  : {participants.count()} users added\n')
        self.stdout.write('── Login & nominate ──────────────────────────────────')
        self.stdout.write('   Employee : emp1@gamyam.com  /  Admin@123')
        self.stdout.write('   Manager  : manager1@gamyam.com  /  Admin@123')
        self.stdout.write('   HR Admin : hr@gamyam.com  /  Admin@123')
        self.stdout.write('   Go to → Nominations page\n')
