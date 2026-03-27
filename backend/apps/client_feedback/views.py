from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from shared.permissions import IsHRAdmin
from .serializers import (
    ClientFeedbackTemplateSerializer,
    CreateClientFeedbackTemplateSerializer,
    ClientFeedbackRequestSerializer,
    CreateClientFeedbackRequestSerializer,
    SubmitClientFeedbackSerializer,
)
from . import services


# ─── Templates ────────────────────────────────────────────────────────────────

class ClientFeedbackTemplateListCreateView(APIView):
    permission_classes = [IsAuthenticated, IsHRAdmin]

    def get(self, request):
        templates = services.list_templates()
        return Response({'success': True, 'templates': ClientFeedbackTemplateSerializer(templates, many=True).data})

    def post(self, request):
        s = CreateClientFeedbackTemplateSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        template = services.create_template(s.validated_data, request.user)
        return Response({'success': True, 'template': ClientFeedbackTemplateSerializer(template).data}, status=201)


class ClientFeedbackTemplateDetailView(APIView):
    permission_classes = [IsAuthenticated, IsHRAdmin]

    def get(self, request, pk):
        template = services.get_template(pk)
        return Response({'success': True, 'template': ClientFeedbackTemplateSerializer(template).data})

    def put(self, request, pk):
        s = CreateClientFeedbackTemplateSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        template = services.update_template(pk, s.validated_data, request.user)
        return Response({'success': True, 'template': ClientFeedbackTemplateSerializer(template).data})

    def delete(self, request, pk):
        services.delete_template(pk)
        return Response({'success': True, 'message': 'Template deleted'})


# ─── Requests ─────────────────────────────────────────────────────────────────

class ClientFeedbackRequestListCreateView(APIView):
    permission_classes = [IsAuthenticated, IsHRAdmin]

    def get(self, request):
        reqs = services.list_requests()
        return Response({'success': True, 'requests': ClientFeedbackRequestSerializer(reqs, many=True).data})

    def post(self, request):
        s = CreateClientFeedbackRequestSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        req = services.create_request(s.validated_data, request.user)
        return Response({'success': True, 'request': ClientFeedbackRequestSerializer(req).data}, status=201)


class ClientFeedbackRequestDetailView(APIView):
    permission_classes = [IsAuthenticated, IsHRAdmin]

    def get(self, request, pk):
        from django.shortcuts import get_object_or_404
        from apps.client_feedback.models import ClientFeedbackRequest
        req = get_object_or_404(ClientFeedbackRequest, pk=pk)
        return Response({'success': True, 'request': ClientFeedbackRequestSerializer(req).data})

    def delete(self, request, pk):
        services.delete_request(pk)
        return Response({'success': True, 'message': 'Deleted'})


class ClientFeedbackResendView(APIView):
    permission_classes = [IsAuthenticated, IsHRAdmin]

    def post(self, request, pk):
        extend_days = request.data.get('extend_days')
        req = services.resend_request(pk, extend_days=extend_days)
        return Response({'success': True, 'message': 'Email resent to client.',
                         'request': ClientFeedbackRequestSerializer(req).data})


# ─── Public (no auth) ─────────────────────────────────────────────────────────

class PublicFormView(APIView):
    permission_classes     = [AllowAny]
    authentication_classes = []

    def get(self, request, token):
        req = services.get_request_by_token(token)
        sections = []
        for sec in req.template.sections.all():
            questions = []
            for q in sec.questions.all():
                questions.append({
                    'id':           str(q.id),
                    'question_text': q.question_text,
                    'type':         q.type,
                    'applies_to':   q.applies_to,
                    'helper_text':  q.helper_text,
                    'is_required':  q.is_required,
                })
            sections.append({'title': sec.title, 'questions': questions})

        data = {
            'project_name': req.project_name,
            'client_name':  req.client_name,
            'status':       req.status,
            'expires_at':   req.expires_at,
            'sections':     sections,
            'employees': [
                {
                    'id':           str(e.id),
                    'first_name':   e.first_name,
                    'last_name':    e.last_name,
                    'display_name': e.display_name or '',
                    'department':   e.department.name if e.department else None,
                }
                for e in req.employees.all()
            ],
        }
        return Response({'success': True, 'form': data})


class PublicFormSubmitView(APIView):
    permission_classes     = [AllowAny]
    authentication_classes = []

    def post(self, request, token):
        s = SubmitClientFeedbackSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        services.submit_feedback(token, s.validated_data['answers'])
        return Response({'success': True, 'message': 'Thank you! Your feedback has been submitted.'})
