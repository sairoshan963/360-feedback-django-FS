import logging
from celery import shared_task
from django.utils import timezone
from datetime import timedelta

logger = logging.getLogger(__name__)


@shared_task
def send_client_feedback_reminders():
    """
    Daily task: remind clients with PENDING requests expiring within 2 days.
    """
    from django.core.mail import send_mail
    from django.conf import settings
    from .models import ClientFeedbackRequest

    now = timezone.now()
    cutoff = now + timedelta(days=2)

    pending = ClientFeedbackRequest.objects.filter(
        status='PENDING',
        expires_at__gt=now,
        expires_at__lte=cutoff,
    ).select_related('template').prefetch_related('employees')

    for req in pending:
        employee_names = ', '.join(
            e.display_name or e.get_full_name() for e in req.employees.all()
        )
        form_url = f'{settings.FRONTEND_URL}/client-feedback/{req.token}'
        subject = f'Reminder: Your feedback is needed for {req.project_name}'
        body = (
            f'Dear {req.client_name},\n\n'
            f'This is a friendly reminder that your feedback for the project '
            f'"{req.project_name}" is due soon.\n\n'
            f'Team members: {employee_names}\n\n'
            f'Please submit your feedback before the link expires on '
            f'{req.expires_at.strftime("%B %d, %Y")}:\n\n'
            f'{form_url}\n\n'
            f'Thank you!\n— Gamyam 360\n'
        )
        try:
            send_mail(subject, body, settings.DEFAULT_FROM_EMAIL, [req.client_email], fail_silently=True)
            logger.info(f'[CF-REMINDER] Sent to {req.client_email} for project "{req.project_name}"')
        except Exception as e:
            logger.error(f'[CF-REMINDER] Failed for {req.client_email}: {e}')
