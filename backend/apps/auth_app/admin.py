from django.contrib import admin
from .models import PasswordResetToken


@admin.register(PasswordResetToken)
class PasswordResetTokenAdmin(admin.ModelAdmin):
    list_display  = ('user', 'expires_at', 'used_at', 'created_at')
    list_filter   = ('used_at',)
    search_fields = ('user__email',)
    readonly_fields = ('token_hash', 'created_at')
