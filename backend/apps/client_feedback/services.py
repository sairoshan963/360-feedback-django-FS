from django.utils import timezone
from datetime import timedelta
from django.core.mail import send_mail
from django.conf import settings
from rest_framework.exceptions import NotFound, ValidationError

from apps.users.models import User
from .models import (
    ClientFeedbackTemplate, ClientFeedbackSection, ClientFeedbackQuestion,
    ClientFeedbackRequest, ClientFeedbackAnswer,
)


# ─── Templates ────────────────────────────────────────────────────────────────

def list_templates():
    return ClientFeedbackTemplate.objects.prefetch_related('sections__questions').all()


def get_template(pk):
    try:
        return ClientFeedbackTemplate.objects.prefetch_related('sections__questions').get(pk=pk)
    except ClientFeedbackTemplate.DoesNotExist:
        raise NotFound('Client feedback template not found.')


def create_template(data, created_by):
    template = ClientFeedbackTemplate.objects.create(
        name=data['name'],
        description=data.get('description', ''),
        created_by=created_by,
    )
    for sec_data in data['sections']:
        section = ClientFeedbackSection.objects.create(
            template=template,
            title=sec_data['title'],
            display_order=sec_data.get('display_order', 1),
        )
        for q_data in sec_data['questions']:
            ClientFeedbackQuestion.objects.create(
                section=section,
                question_text=q_data['question_text'],
                type=q_data['type'],
                applies_to=q_data.get('applies_to', 'EACH_EMPLOYEE'),
                helper_text=q_data.get('helper_text', ''),
                is_required=q_data.get('is_required', True),
                display_order=q_data.get('display_order', 1),
            )
    return template


def update_template(pk, data, updated_by):
    template = get_template(pk)
    if ClientFeedbackRequest.objects.filter(template=template).exists():
        raise ValidationError('Cannot edit a template that has already been used in a request.')
    template.name = data['name']
    template.description = data.get('description', '')
    template.save()
    template.sections.all().delete()
    for sec_data in data['sections']:
        section = ClientFeedbackSection.objects.create(
            template=template,
            title=sec_data['title'],
            display_order=sec_data.get('display_order', 1),
        )
        for q_data in sec_data['questions']:
            ClientFeedbackQuestion.objects.create(
                section=section,
                question_text=q_data['question_text'],
                type=q_data['type'],
                applies_to=q_data.get('applies_to', 'EACH_EMPLOYEE'),
                helper_text=q_data.get('helper_text', ''),
                is_required=q_data.get('is_required', True),
                display_order=q_data.get('display_order', 1),
            )
    return template


def delete_template(pk):
    template = get_template(pk)
    if ClientFeedbackRequest.objects.filter(template=template).exists():
        raise ValidationError('Cannot delete a template that has been used in a request.')
    template.delete()


# ─── Requests ─────────────────────────────────────────────────────────────────

def list_requests():
    return ClientFeedbackRequest.objects.select_related('template').prefetch_related(
        'employees',
        'answers__question',
        'answers__employee',
    ).all()


def create_request(data, created_by):
    try:
        template = ClientFeedbackTemplate.objects.prefetch_related('sections__questions').get(pk=data['template_id'])
    except ClientFeedbackTemplate.DoesNotExist:
        raise ValidationError('Selected template does not exist.')

    employees = User.objects.filter(id__in=data['employee_ids'])
    if employees.count() != len(data['employee_ids']):
        raise ValidationError('One or more employee IDs are invalid.')

    req = ClientFeedbackRequest.objects.create(
        project_name=data['project_name'],
        client_name=data['client_name'],
        client_email=data['client_email'],
        template=template,
        expires_at=timezone.now() + timedelta(days=data['expires_days']),
        created_by=created_by,
    )
    req.employees.set(employees)
    _send_client_email(req)
    return req


def _send_client_email(req):
    employee_names = ', '.join(e.get_full_name() for e in req.employees.all())
    form_url = f'{settings.FRONTEND_URL}/client-feedback/{req.token}'
    subject  = f'Feedback Request for {req.project_name}'
    body = (
        f'Dear {req.client_name},\n\n'
        f'We would appreciate your feedback on the work delivered by our team '
        f'for {req.project_name}.\n\n'
        f'Team members: {employee_names}\n\n'
        f'Please click the link below to fill out the feedback form '
        f'(no login required):\n\n'
        f'{form_url}\n\n'
        f'This link will expire on {req.expires_at.strftime("%B %d, %Y")}.\n\n'
        f'Thank you for your time!\n'
    )
    try:
        send_mail(subject, body, settings.DEFAULT_FROM_EMAIL, [req.client_email], fail_silently=True)
    except Exception:
        pass


def get_request_by_token(token):
    try:
        req = ClientFeedbackRequest.objects.select_related('template').prefetch_related(
            'template__sections__questions',
            'employees',
            'answers__question',
            'answers__employee',
        ).get(token=token)
    except ClientFeedbackRequest.DoesNotExist:
        raise NotFound('Feedback request not found.')
    req.mark_expired_if_needed()
    return req


def delete_request(pk):
    try:
        req = ClientFeedbackRequest.objects.get(pk=pk)
    except ClientFeedbackRequest.DoesNotExist:
        raise NotFound('Request not found.')
    if req.status == 'SUBMITTED':
        raise ValidationError('Cannot delete a submitted feedback request.')
    req.delete()


# ─── Submit ───────────────────────────────────────────────────────────────────

def submit_feedback(token, answers_data):
    req = get_request_by_token(token)

    if req.status == 'SUBMITTED':
        raise ValidationError('This feedback form has already been submitted.')
    if req.status == 'EXPIRED':
        raise ValidationError('This feedback link has expired.')

    # Build lookup maps
    all_questions = {
        str(q.id): q
        for s in req.template.sections.all()
        for q in s.questions.all()
    }
    employee_ids = {str(e.id) for e in req.employees.all()}

    for item in answers_data:
        q_id = str(item['question_id'])
        if q_id not in all_questions:
            raise ValidationError(f'Question {q_id} does not belong to this template.')
        question = all_questions[q_id]
        emp_id = str(item.get('employee_id') or '')
        if question.applies_to == 'EACH_EMPLOYEE' and emp_id not in employee_ids:
            raise ValidationError(f'Employee {emp_id} is not part of this request.')

    for item in answers_data:
        question   = all_questions[str(item['question_id'])]
        employee_id = item.get('employee_id') if question.applies_to == 'EACH_EMPLOYEE' else None
        ClientFeedbackAnswer.objects.update_or_create(
            request=req,
            question=question,
            employee_id=employee_id,
            defaults={
                'rating_value': item.get('rating_value'),
                'text_value':   item.get('text_value', ''),
                'yes_no_value': item.get('yes_no_value'),
            },
        )

    req.status = 'SUBMITTED'
    req.submitted_at = timezone.now()
    req.save(update_fields=['status', 'submitted_at'])
    _notify_hr_on_submit(req)
    return req


def _notify_hr_on_submit(req):
    hr_emails = list(
        User.objects.filter(role__in=['HR_ADMIN', 'SUPER_ADMIN'], is_active=True)
        .values_list('email', flat=True)
    )
    if not hr_emails:
        return
    subject = f'[Client Feedback] {req.client_name} submitted feedback for {req.project_name}'
    body = (
        f'Hello,\n\n'
        f'{req.client_name} has just submitted their feedback for the project '
        f'"{req.project_name}".\n\n'
        f'View the full report at:\n'
        f'{settings.FRONTEND_URL}/hr/client-feedback/{req.id}\n\n'
        f'— Gamyam 360\n'
    )
    try:
        send_mail(subject, body, settings.DEFAULT_FROM_EMAIL, hr_emails, fail_silently=True)
    except Exception:
        pass


def resend_request(pk, extend_days=None):
    try:
        req = ClientFeedbackRequest.objects.select_related('template').prefetch_related('employees').get(pk=pk)
    except ClientFeedbackRequest.DoesNotExist:
        raise NotFound('Request not found.')
    if req.status == 'SUBMITTED':
        raise ValidationError('Cannot resend a completed feedback request.')
    if extend_days:
        req.expires_at = timezone.now() + timedelta(days=extend_days)
        req.status = 'PENDING'
        req.save(update_fields=['expires_at', 'status'])
    _send_client_email(req)
    return req
