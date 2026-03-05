from django.contrib import admin
from .models import AuditLog


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display  = ('action_type', 'entity_type', 'actor', 'ip_address', 'created_at')
    list_filter   = ('action_type', 'entity_type')
    search_fields = ('actor__email', 'action_type', 'entity_type')
    readonly_fields = ('created_at',)
