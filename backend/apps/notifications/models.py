import uuid
from django.db import models
from django.conf import settings


class Notification(models.Model):
    TYPE_CHOICES = [
        ('CYCLE_ACTIVATED',  'Cycle Activated'),
        ('NOMINATION_OPEN',  'Nomination Open'),
        ('CYCLE_CLOSED',     'Cycle Closed'),
        ('RESULTS_RELEASED', 'Results Released'),
        ('REMINDER',         'Reminder'),
        ('GENERAL',          'General'),
    ]

    id         = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user       = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    type       = models.CharField(max_length=30, choices=TYPE_CHOICES, default='GENERAL')
    title      = models.CharField(max_length=255)
    message    = models.TextField()
    link       = models.CharField(max_length=255, blank=True, null=True)
    is_read    = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'notifications'
        ordering = ['-created_at']

    def __str__(self):
        return f'[{self.type}] {self.title} → {self.user.email}'
