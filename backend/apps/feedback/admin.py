from django.contrib import admin
from .models import FeedbackResponse, FeedbackAnswer, AggregatedResult


class FeedbackAnswerInline(admin.TabularInline):
    model = FeedbackAnswer
    extra = 0


@admin.register(FeedbackResponse)
class FeedbackResponseAdmin(admin.ModelAdmin):
    list_display  = ('task', 'submitted_by', 'submitted_at')
    search_fields = ('task__reviewer__email', 'task__reviewee__email')
    inlines       = [FeedbackAnswerInline]


@admin.register(AggregatedResult)
class AggregatedResultAdmin(admin.ModelAdmin):
    list_display  = ('cycle', 'reviewee', 'overall_score', 'self_score', 'manager_score', 'peer_score', 'computed_at')
    search_fields = ('reviewee__email', 'cycle__name')
    list_filter   = ('cycle',)
