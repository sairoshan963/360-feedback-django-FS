import uuid
from django.db import models
from django.conf import settings


class SupportTicket(models.Model):
    TYPE_CHOICES = [
        ('Bug',        'Bug'),
        ('Suggestion', 'Suggestion'),
        ('General',    'General'),
    ]

    id         = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    submitted_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='support_tickets')
    type       = models.CharField(max_length=20, choices=TYPE_CHOICES, default='General')
    message    = models.TextField()
    page       = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'support_tickets'
        ordering = ['-created_at']

    def __str__(self):
        return f'[{self.type}] {self.submitted_by} — {self.created_at.date()}'
