from django.contrib import admin
from .models import Template, TemplateSection, TemplateQuestion, ReviewCycle, CycleParticipant


class TemplateSectionInline(admin.TabularInline):
    model = TemplateSection
    extra = 0


class TemplateQuestionInline(admin.TabularInline):
    model = TemplateQuestion
    extra = 0


@admin.register(Template)
class TemplateAdmin(admin.ModelAdmin):
    list_display  = ('name', 'is_active', 'created_by', 'created_at')
    list_filter   = ('is_active',)
    search_fields = ('name',)
    inlines       = [TemplateSectionInline]


@admin.register(ReviewCycle)
class ReviewCycleAdmin(admin.ModelAdmin):
    list_display  = ('name', 'state', 'template', 'review_deadline', 'peer_enabled', 'created_at')
    list_filter   = ('state', 'peer_enabled')
    search_fields = ('name',)
    readonly_fields = ('created_at', 'updated_at', 'results_released_at')


@admin.register(CycleParticipant)
class CycleParticipantAdmin(admin.ModelAdmin):
    list_display  = ('cycle', 'user', 'added_at')
    search_fields = ('cycle__name', 'user__email')
