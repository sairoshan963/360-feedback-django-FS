from rest_framework import serializers
from .models import AuditLog


class AuditLogSerializer(serializers.ModelSerializer):
    actor_name  = serializers.SerializerMethodField()
    actor_email = serializers.EmailField(source='actor.email', read_only=True, default=None)
    entity_name = serializers.SerializerMethodField()

    class Meta:
        model  = AuditLog
        fields = [
            'id', 'actor', 'actor_name', 'actor_email',
            'action_type', 'entity_type', 'entity_id', 'entity_name',
            'old_value', 'new_value',
            'created_at',
        ]

    def get_actor_name(self, obj):
        if obj.actor:
            return obj.actor.get_full_name()
        return 'System'

    def get_entity_name(self, obj):
        """Resolve entity_id to a human-readable name for the monitor table."""
        if not obj.entity_id:
            return None
        try:
            if obj.entity_type in ('review_cycle', 'cycle'):
                from apps.review_cycles.models import ReviewCycle
                cycle = ReviewCycle.objects.filter(id=obj.entity_id).only('name').first()
                return cycle.name if cycle else None
            if obj.entity_type == 'reviewer_task':
                from apps.reviewer_workflow.models import ReviewerTask
                task = ReviewerTask.objects.select_related('reviewee', 'cycle').filter(id=obj.entity_id).first()
                if task:
                    return f'{task.reviewee.get_full_name()} ({task.reviewer_type})'
            if obj.entity_type == 'peer_nomination':
                from apps.reviewer_workflow.models import PeerNomination
                nom = PeerNomination.objects.select_related('reviewee', 'peer').filter(id=obj.entity_id).first()
                if nom:
                    return f'{nom.peer.get_full_name()} → {nom.reviewee.get_full_name()}'
        except Exception:
            pass
        return None
