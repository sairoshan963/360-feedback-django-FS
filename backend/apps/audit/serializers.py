from rest_framework import serializers
from .models import AuditLog


class AuditLogSerializer(serializers.ModelSerializer):
    actor_name  = serializers.SerializerMethodField()
    actor_email = serializers.EmailField(source='actor.email', read_only=True, default=None)

    class Meta:
        model  = AuditLog
        fields = [
            'id', 'actor', 'actor_name', 'actor_email',
            'action_type', 'entity_type', 'entity_id',
            'old_value', 'new_value',
            'ip_address', 'user_agent', 'created_at',
        ]

    def get_actor_name(self, obj):
        if obj.actor:
            return obj.actor.get_full_name()
        return 'System'
