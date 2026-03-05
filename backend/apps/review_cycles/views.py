from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from shared.permissions import IsHRAdmin, IsSuperAdmin, IsEmployee
from . import services
from .serializers import (
    TemplateSerializer, TemplateListSerializer,
    ReviewCycleSerializer, CycleParticipantSerializer,
    AddParticipantsSerializer, CycleStateOverrideSerializer,
)


# ─── Templates ────────────────────────────────────────────────────────────────

class TemplateListCreateView(APIView):
    permission_classes = [IsAuthenticated, IsHRAdmin]

    def get(self, request):
        templates = services.list_templates()
        return Response({'success': True, 'templates': TemplateListSerializer(templates, many=True).data})

    def post(self, request):
        name     = request.data.get('name')
        desc     = request.data.get('description')
        sections = request.data.get('sections', [])
        template = services.create_template(name, desc, sections, request.user)
        return Response({'success': True, 'template': TemplateSerializer(template).data}, status=201)


class TemplateDetailView(APIView):
    permission_classes = [IsAuthenticated, IsHRAdmin]

    def get(self, request, pk):
        template = services.get_template(pk)
        return Response({'success': True, 'template': TemplateSerializer(template).data})

    def put(self, request, pk):
        name     = request.data.get('name')
        sections = request.data.get('sections', [])
        template = services.update_template(pk, name, sections, request.user)
        return Response({'success': True, 'template': TemplateSerializer(template).data})


# ─── Cycles ───────────────────────────────────────────────────────────────────

class CycleListCreateView(APIView):
    permission_classes = [IsAuthenticated, IsHRAdmin]

    def get(self, request):
        state  = request.query_params.get('state')
        cycles = services.list_cycles(state=state)
        return Response({'success': True, 'cycles': ReviewCycleSerializer(cycles, many=True).data})

    def post(self, request):
        cycle = services.create_cycle(request.data, request.user)
        return Response({'success': True, 'cycle': ReviewCycleSerializer(cycle).data}, status=201)


class MyCyclesView(APIView):
    """Employee: list cycles I am a participant of."""
    permission_classes = [IsAuthenticated, IsEmployee]

    def get(self, request):
        cycles = services.get_my_cycles(request.user)
        return Response({'success': True, 'cycles': ReviewCycleSerializer(cycles, many=True).data})


class CycleDetailView(APIView):
    permission_classes = [IsAuthenticated, IsHRAdmin]

    def get(self, request, pk):
        cycle = services.get_cycle(pk)
        return Response({'success': True, 'cycle': ReviewCycleSerializer(cycle).data})

    def patch(self, request, pk):
        cycle = services.update_cycle(pk, request.data, request.user)
        return Response({'success': True, 'cycle': ReviewCycleSerializer(cycle).data})


# ─── Participants ─────────────────────────────────────────────────────────────

class CycleParticipantsView(APIView):
    permission_classes = [IsAuthenticated, IsHRAdmin]

    def get(self, request, pk):
        participants = services.get_participants(pk)
        return Response({'success': True, 'participants': CycleParticipantSerializer(participants, many=True).data})

    def post(self, request, pk):
        serializer = AddParticipantsSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        participants = services.add_participants(
            pk, serializer.validated_data['participant_ids'], request.user
        )
        return Response({'success': True, 'participants': CycleParticipantSerializer(participants, many=True).data})


# ─── State Transitions ────────────────────────────────────────────────────────

class CycleActivateView(APIView):
    permission_classes = [IsAuthenticated, IsHRAdmin]

    def post(self, request, pk):
        cycle = services.activate_cycle(pk, request.user)
        return Response({'success': True, 'cycle': ReviewCycleSerializer(cycle).data})


class CycleFinalizeView(APIView):
    permission_classes = [IsAuthenticated, IsHRAdmin]

    def post(self, request, pk):
        cycle = services.finalize_cycle(pk, request.user)
        return Response({'success': True, 'cycle': ReviewCycleSerializer(cycle).data})


class CycleCloseView(APIView):
    permission_classes = [IsAuthenticated, IsHRAdmin]

    def post(self, request, pk):
        cycle = services.close_cycle(pk, request.user)
        return Response({'success': True, 'cycle': ReviewCycleSerializer(cycle).data})


class CycleReleaseResultsView(APIView):
    permission_classes = [IsAuthenticated, IsHRAdmin]

    def post(self, request, pk):
        cycle = services.release_results(pk, request.user)
        return Response({'success': True, 'cycle': ReviewCycleSerializer(cycle).data})


class CycleArchiveView(APIView):
    permission_classes = [IsAuthenticated, IsHRAdmin]

    def post(self, request, pk):
        cycle = services.archive_cycle(pk, request.user)
        return Response({'success': True, 'cycle': ReviewCycleSerializer(cycle).data})


class CycleOverrideView(APIView):
    """Super Admin only — emergency state override."""
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    def post(self, request, pk):
        serializer = CycleStateOverrideSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        cycle = services.override_cycle(
            pk,
            serializer.validated_data['target_state'],
            serializer.validated_data['reason'],
            request.user,
        )
        return Response({'success': True, 'cycle': ReviewCycleSerializer(cycle).data})


# ─── Progress & Status ────────────────────────────────────────────────────────

class CycleProgressView(APIView):
    permission_classes = [IsAuthenticated, IsHRAdmin]

    def get(self, request, pk):
        progress = services.get_cycle_progress(pk)
        return Response({'success': True, 'progress': list(progress)})


class NominationStatusView(APIView):
    permission_classes = [IsAuthenticated, IsHRAdmin]

    def get(self, request, pk):
        status = services.get_nomination_status(pk)
        return Response({'success': True, 'nomination_status': status})


class ParticipantTaskStatusView(APIView):
    permission_classes = [IsAuthenticated, IsHRAdmin]

    def get(self, request, pk):
        status = services.get_participant_task_status(pk)
        return Response({'success': True, 'task_status': status})
