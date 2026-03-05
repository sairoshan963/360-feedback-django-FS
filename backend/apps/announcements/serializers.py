from rest_framework import serializers
from .models import Announcement


class AnnouncementSerializer(serializers.ModelSerializer):
    created_by_name = serializers.SerializerMethodField()

    class Meta:
        model  = Announcement
        fields = ['id', 'message', 'type', 'is_active', 'expires_at',
                  'created_by_name', 'created_at', 'updated_at']

    def get_created_by_name(self, obj):
        if obj.created_by:
            return obj.created_by.get_full_name()
        return None


class CreateAnnouncementSerializer(serializers.Serializer):
    message    = serializers.CharField(min_length=1)
    type       = serializers.ChoiceField(choices=['info', 'warning', 'success'], default='info')
    expires_at = serializers.DateTimeField(required=False, allow_null=True)
