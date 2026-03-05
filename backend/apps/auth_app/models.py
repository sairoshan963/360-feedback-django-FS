import uuid
from django.db import models
from django.conf import settings


class PasswordResetToken(models.Model):
    """
    Stores hashed password reset tokens.
    Raw token is emailed to user — only the SHA-256 hash is stored (never the raw token).
    """
    id         = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user       = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='reset_tokens')
    token_hash = models.CharField(max_length=64, unique=True)
    expires_at = models.DateTimeField()
    used_at    = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'password_reset_tokens'

    def __str__(self):
        return f'PasswordResetToken for {self.user.email}'
