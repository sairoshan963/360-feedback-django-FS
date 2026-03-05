from django.contrib import admin
from .models import Announcement


@admin.register(Announcement)
class AnnouncementAdmin(admin.ModelAdmin):
    list_display  = ('message', 'type', 'is_active', 'expires_at', 'created_by', 'created_at')
    list_filter   = ('type', 'is_active')
    search_fields = ('message',)
