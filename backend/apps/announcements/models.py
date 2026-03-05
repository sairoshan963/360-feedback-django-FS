import uuid
from django.db import models
from django.conf import settings


class Announcement(models.Model):
    TYPE_CHOICES = [
        ('info',    'Info'),
        ('warning', 'Warning'),
        ('success', 'Success'),
    ]

    id         = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    message    = models.TextField()
    type       = models.CharField(max_length=10, choices=TYPE_CHOICES, default='info')
    is_active  = models.BooleanField(default=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='announcements')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'announcements'
        ordering = ['-created_at']

    def __str__(self):
        return f'[{self.type}] {self.message[:60]}'
