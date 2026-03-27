from django.contrib import admin
from .models import (
    ClientFeedbackTemplate, ClientFeedbackSection, ClientFeedbackQuestion,
    ClientFeedbackRequest, ClientFeedbackAnswer,
)


class ClientFeedbackSectionInline(admin.TabularInline):
    model  = ClientFeedbackSection
    extra  = 1
    fields = ('title', 'display_order')


class ClientFeedbackQuestionInline(admin.TabularInline):
    model  = ClientFeedbackQuestion
    extra  = 1
    fields = ('question_text', 'type', 'applies_to', 'is_required', 'display_order')


@admin.register(ClientFeedbackTemplate)
class ClientFeedbackTemplateAdmin(admin.ModelAdmin):
    list_display    = ('name', 'description', 'created_by', 'created_at')
    readonly_fields = ('created_at', 'updated_at')
    inlines         = [ClientFeedbackSectionInline]


@admin.register(ClientFeedbackRequest)
class ClientFeedbackRequestAdmin(admin.ModelAdmin):
    list_display    = ('project_name', 'client_name', 'client_email', 'template', 'status', 'expires_at', 'created_at')
    list_filter     = ('status',)
    search_fields   = ('project_name', 'client_name', 'client_email')
    readonly_fields = ('token', 'created_at', 'submitted_at')
