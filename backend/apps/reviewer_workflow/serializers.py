from rest_framework import serializers
from .models import ReviewerTask, PeerNomination


class ReviewerTaskSerializer(serializers.ModelSerializer):
    cycle_name       = serializers.CharField(source='cycle.name',            read_only=True)
    cycle_state      = serializers.CharField(source='cycle.state',           read_only=True)
    review_deadline  = serializers.DateTimeField(source='cycle.review_deadline', read_only=True)
    template_id      = serializers.UUIDField(source='cycle.template_id',     read_only=True)
    reviewee_first   = serializers.CharField(source='reviewee.first_name',   read_only=True)
    reviewee_last    = serializers.CharField(source='reviewee.last_name',    read_only=True)
    reviewee_email   = serializers.EmailField(source='reviewee.email',       read_only=True)

    class Meta:
        model  = ReviewerTask
        fields = [
            'id', 'cycle', 'cycle_name', 'cycle_state', 'review_deadline', 'template_id',
            'reviewee', 'reviewee_first', 'reviewee_last', 'reviewee_email',
            'reviewer_type', 'anonymity_mode', 'status', 'draft_answers',
            'created_at', 'updated_at',
        ]


class SaveDraftSerializer(serializers.Serializer):
    answers = serializers.ListField(
        child=serializers.DictField(),
        min_length=1,
    )


class NominationSerializer(serializers.ModelSerializer):
    peer_first    = serializers.CharField(source='peer.first_name',    read_only=True)
    peer_last     = serializers.CharField(source='peer.last_name',     read_only=True)
    peer_email    = serializers.EmailField(source='peer.email',        read_only=True)
    reviewee_first = serializers.CharField(source='reviewee.first_name', read_only=True)
    reviewee_last  = serializers.CharField(source='reviewee.last_name',  read_only=True)

    class Meta:
        model  = PeerNomination
        fields = [
            'id', 'cycle', 'reviewee', 'reviewee_first', 'reviewee_last',
            'peer', 'peer_first', 'peer_last', 'peer_email',
            'status', 'rejection_note', 'approved_at', 'created_at',
        ]


class SubmitNominationsSerializer(serializers.Serializer):
    peer_ids = serializers.ListField(
        child=serializers.UUIDField(),
        min_length=1,
    )


class NominationDecisionSerializer(serializers.Serializer):
    status         = serializers.ChoiceField(choices=['APPROVED', 'REJECTED'])
    rejection_note = serializers.CharField(required=False, allow_blank=True)
