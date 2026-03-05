from django.contrib import admin
from .models import SupportTicket


@admin.register(SupportTicket)
class SupportTicketAdmin(admin.ModelAdmin):
    list_display  = ('submitted_by', 'type', 'page', 'created_at')
    list_filter   = ('type',)
    search_fields = ('submitted_by__email', 'message')
    readonly_fields = ('created_at',)
