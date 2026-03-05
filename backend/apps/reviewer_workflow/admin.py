from django.contrib import admin
from .models import ReviewerTask, PeerNomination


@admin.register(ReviewerTask)
class ReviewerTaskAdmin(admin.ModelAdmin):
    list_display  = ('cycle', 'reviewer', 'reviewee', 'reviewer_type', 'status', 'created_at')
    list_filter   = ('reviewer_type', 'status')
    search_fields = ('reviewer__email', 'reviewee__email', 'cycle__name')
    readonly_fields = ('created_at', 'updated_at')


@admin.register(PeerNomination)
class PeerNominationAdmin(admin.ModelAdmin):
    list_display  = ('cycle', 'reviewee', 'peer', 'status', 'approved_by', 'created_at')
    list_filter   = ('status',)
    search_fields = ('reviewee__email', 'peer__email', 'cycle__name')
