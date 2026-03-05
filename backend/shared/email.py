from django.core.mail import send_mail
from django.conf import settings


def send_password_reset(to_email, first_name, reset_link):
    subject = 'Reset your Gamyam 360° Feedback password'
    message = (
        f'Hi {first_name},\n\n'
        f'Click the link below to reset your password:\n{reset_link}\n\n'
        f'This link expires in 1 hour.\n\n'
        f'If you did not request this, ignore this email.'
    )
    try:
        send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [to_email], fail_silently=False)
        return True
    except Exception:
        return False


def send_reminder(to_email, first_name, cycle_name, deadline_str):
    subject = f'Reminder: Pending feedback for "{cycle_name}"'
    message = (
        f'Hi {first_name},\n\n'
        f'You have pending feedback tasks in the review cycle "{cycle_name}".\n'
        f'Deadline: {deadline_str}\n\n'
        f'Please complete your feedback at your earliest.\n\n'
        f'Log in: {settings.FRONTEND_URL}/employee/tasks'
    )
    try:
        send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [to_email], fail_silently=False)
        return True
    except Exception:
        return False


def send_cycle_notification(to_email, first_name, subject, body):
    try:
        send_mail(subject, f'Hi {first_name},\n\n{body}', settings.DEFAULT_FROM_EMAIL, [to_email], fail_silently=False)
        return True
    except Exception:
        return False
