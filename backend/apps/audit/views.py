from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from shared.permissions import IsSuperAdmin
from .models import AuditLog
from .serializers import AuditLogSerializer


class AuditLogListView(APIView):
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    def get(self, request):
        qs = AuditLog.objects.select_related('actor').order_by('-created_at')

        # Filters
        action      = request.query_params.get('action')
        entity_type = request.query_params.get('entity_type')
        actor_id    = request.query_params.get('actor_id')

        if action:
            qs = qs.filter(action_type__icontains=action)
        if entity_type:
            qs = qs.filter(entity_type=entity_type)
        if actor_id:
            qs = qs.filter(actor_id=actor_id)

        # Paginate manually — return latest 100
        qs = qs[:100]
        return Response({'success': True, 'logs': AuditLogSerializer(qs, many=True).data})
