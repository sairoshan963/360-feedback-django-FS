"""
Management command: init_superadmin
Creates the initial SUPER_ADMIN user from environment variables.
Idempotent — safe to run on every container startup.
"""
from django.conf import settings
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()


class Command(BaseCommand):
    help = 'Create the initial super admin user if it does not exist'

    def handle(self, *args, **options):
        from decouple import config

        email     = config('SUPERADMIN_EMAIL',      default='admin@gamyam.com')
        password  = config('SUPERADMIN_PASSWORD',   default='Admin@123')
        first_name = config('SUPERADMIN_FIRST_NAME', default='Super')
        last_name  = config('SUPERADMIN_LAST_NAME',  default='Admin')

        if User.objects.filter(email=email).exists():
            self.stdout.write(self.style.WARNING(f'Super admin already exists: {email}'))
            return

        User.objects.create_user(
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
            role='SUPER_ADMIN',
            is_staff=True,
            is_superuser=True,
        )
        self.stdout.write(self.style.SUCCESS(f'Super admin created: {email}'))
