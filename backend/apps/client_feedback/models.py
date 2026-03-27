import secrets
import uuid

from django.db import models
from django.conf import settings
from django.utils import timezone


def _generate_token():
    return secrets.token_urlsafe(48)


# ─── Templates ────────────────────────────────────────────────────────────────

class ClientFeedbackTemplate(models.Model):
    id          = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name        = models.CharField(max_length=200)
    description = models.TextField(blank=True, default='')
    created_by  = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True,
        related_name='client_feedback_templates',
    )
    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'client_feedback_templates'
        ordering = ['-created_at']

    def __str__(self):
        return self.name


class ClientFeedbackSection(models.Model):
    id            = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    template      = models.ForeignKey(ClientFeedbackTemplate, on_delete=models.CASCADE, related_name='sections')
    title         = models.CharField(max_length=200)
    display_order = models.PositiveSmallIntegerField(default=1)

    class Meta:
        db_table = 'client_feedback_sections'
        ordering = ['display_order']

    def __str__(self):
        return f'{self.template.name} — {self.title}'


class ClientFeedbackQuestion(models.Model):
    QUESTION_TYPES = [
        ('RATING',            'Rating (1–5 stars)'),
        ('TEXT',              'Text (open-ended)'),
        ('RATING_WITH_TEXT',  'Rating + Text'),
        ('YES_NO',            'Yes / No'),
        ('NPS',               'NPS (0–10 scale)'),
    ]
    APPLIES_TO = [
        ('EACH_EMPLOYEE', 'Each Employee'),   # client answers per team member
        ('TEAM_OVERALL',  'Team Overall'),    # client answers once for the whole team
    ]

    id            = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    section       = models.ForeignKey(ClientFeedbackSection, on_delete=models.CASCADE, related_name='questions')
    question_text = models.TextField()
    type          = models.CharField(max_length=20, choices=QUESTION_TYPES, default='RATING')
    applies_to    = models.CharField(max_length=20, choices=APPLIES_TO, default='EACH_EMPLOYEE')
    helper_text   = models.CharField(max_length=400, blank=True, default='')
    is_required   = models.BooleanField(default=True)
    display_order = models.PositiveSmallIntegerField(default=1)

    class Meta:
        db_table = 'client_feedback_questions'
        ordering = ['display_order']

    def __str__(self):
        return f'{self.section.title} — {self.question_text[:60]}'


# ─── Requests ─────────────────────────────────────────────────────────────────

class ClientFeedbackRequest(models.Model):
    STATUS_CHOICES = [
        ('PENDING',   'Pending'),
        ('SUBMITTED', 'Submitted'),
        ('EXPIRED',   'Expired'),
    ]

    id           = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project_name = models.CharField(max_length=200)
    client_name  = models.CharField(max_length=200)
    client_email = models.EmailField()
    template     = models.ForeignKey(
        ClientFeedbackTemplate, on_delete=models.PROTECT, related_name='requests',
    )
    token        = models.CharField(max_length=100, unique=True, default=_generate_token, editable=False)
    expires_at   = models.DateTimeField()
    status       = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    employees    = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name='client_feedback_requests',
        blank=True,
    )
    created_by   = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True,
        related_name='created_client_feedback_requests',
    )
    created_at   = models.DateTimeField(auto_now_add=True)
    submitted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'client_feedback_requests'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.project_name} — {self.client_name} ({self.status})'

    def is_expired(self):
        return timezone.now() > self.expires_at

    def mark_expired_if_needed(self):
        if self.status == 'PENDING' and self.is_expired():
            self.status = 'EXPIRED'
            self.save(update_fields=['status'])


# ─── Answers ──────────────────────────────────────────────────────────────────

class ClientFeedbackAnswer(models.Model):
    """
    One answer per question per request.
    - EACH_EMPLOYEE questions: one row per (question, employee)
    - TEAM_OVERALL questions:  one row per (question), employee is null
    """
    id            = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    request       = models.ForeignKey(ClientFeedbackRequest, on_delete=models.CASCADE, related_name='answers')
    question      = models.ForeignKey(ClientFeedbackQuestion, on_delete=models.CASCADE, related_name='answers')
    employee      = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        null=True, blank=True, related_name='client_feedback_answers',
    )
    # Stores value depending on question type:
    rating_value  = models.PositiveSmallIntegerField(null=True, blank=True)  # RATING, RATING_WITH_TEXT, NPS
    text_value    = models.TextField(blank=True, default='')                  # TEXT, RATING_WITH_TEXT
    yes_no_value  = models.BooleanField(null=True, blank=True)                # YES_NO

    class Meta:
        db_table = 'client_feedback_answers'
        unique_together = [('request', 'question', 'employee')]

    def __str__(self):
        return f'{self.request} — Q:{self.question_id} — Emp:{self.employee_id}'
