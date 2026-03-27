from rest_framework import serializers
from .models import (
    ClientFeedbackTemplate, ClientFeedbackSection, ClientFeedbackQuestion,
    ClientFeedbackRequest, ClientFeedbackAnswer,
)


# ─── Template builder ─────────────────────────────────────────────────────────

class QuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model  = ClientFeedbackQuestion
        fields = ['id', 'question_text', 'type', 'applies_to',
                  'helper_text', 'is_required', 'display_order']


class SectionSerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True, read_only=True)

    class Meta:
        model  = ClientFeedbackSection
        fields = ['id', 'title', 'display_order', 'questions']


class ClientFeedbackTemplateSerializer(serializers.ModelSerializer):
    sections        = SectionSerializer(many=True, read_only=True)
    created_by_name = serializers.SerializerMethodField()
    question_count  = serializers.SerializerMethodField()

    class Meta:
        model  = ClientFeedbackTemplate
        fields = ['id', 'name', 'description', 'sections',
                  'question_count', 'created_by_name', 'created_at', 'updated_at']

    def get_created_by_name(self, obj):
        return obj.created_by.get_full_name() if obj.created_by else None

    def get_question_count(self, obj):
        return sum(s.questions.count() for s in obj.sections.all())


# ─── Template input serializers ───────────────────────────────────────────────

class QuestionInputSerializer(serializers.Serializer):
    question_text = serializers.CharField()
    type          = serializers.ChoiceField(choices=['RATING', 'TEXT', 'RATING_WITH_TEXT', 'YES_NO', 'NPS'])
    applies_to    = serializers.ChoiceField(choices=['EACH_EMPLOYEE', 'TEAM_OVERALL'], default='EACH_EMPLOYEE')
    helper_text   = serializers.CharField(allow_blank=True, default='')
    is_required   = serializers.BooleanField(default=True)
    display_order = serializers.IntegerField(min_value=1, default=1)


class SectionInputSerializer(serializers.Serializer):
    title         = serializers.CharField(max_length=200)
    display_order = serializers.IntegerField(min_value=1, default=1)
    questions     = serializers.ListField(child=QuestionInputSerializer(), min_length=1)


class CreateClientFeedbackTemplateSerializer(serializers.Serializer):
    name        = serializers.CharField(max_length=200)
    description = serializers.CharField(allow_blank=True, default='')
    sections    = serializers.ListField(child=SectionInputSerializer(), min_length=1)


# ─── Requests ─────────────────────────────────────────────────────────────────

class EmployeeBriefSerializer(serializers.Serializer):
    id           = serializers.UUIDField()
    first_name   = serializers.CharField()
    last_name    = serializers.CharField()
    display_name = serializers.CharField(allow_blank=True, default='')
    email        = serializers.EmailField()
    department   = serializers.SerializerMethodField()

    def get_department(self, obj):
        return obj.department.name if obj.department else None


class AnswerSerializer(serializers.ModelSerializer):
    question_text  = serializers.CharField(source='question.question_text', read_only=True)
    question_type  = serializers.CharField(source='question.type', read_only=True)
    applies_to     = serializers.CharField(source='question.applies_to', read_only=True)
    employee_name  = serializers.SerializerMethodField()

    class Meta:
        model  = ClientFeedbackAnswer
        fields = ['question_text', 'question_type', 'applies_to',
                  'employee_name', 'rating_value', 'text_value', 'yes_no_value']

    def get_employee_name(self, obj):
        if obj.employee:
            return obj.employee.display_name or obj.employee.get_full_name()
        return None


class ClientFeedbackRequestSerializer(serializers.ModelSerializer):
    employees       = EmployeeBriefSerializer(many=True, read_only=True)
    answers         = AnswerSerializer(many=True, read_only=True)
    created_by_name = serializers.SerializerMethodField()
    template_name   = serializers.CharField(source='template.name', read_only=True)
    form_url        = serializers.SerializerMethodField()

    class Meta:
        model  = ClientFeedbackRequest
        fields = ['id', 'project_name', 'client_name', 'client_email',
                  'template_name', 'status', 'expires_at', 'employees', 'answers',
                  'created_by_name', 'form_url', 'created_at', 'submitted_at']

    def get_created_by_name(self, obj):
        return obj.created_by.get_full_name() if obj.created_by else None

    def get_form_url(self, obj):
        from django.conf import settings as django_settings
        return f'{django_settings.FRONTEND_URL}/client-feedback/{obj.token}'


class CreateClientFeedbackRequestSerializer(serializers.Serializer):
    project_name = serializers.CharField(max_length=200)
    client_name  = serializers.CharField(max_length=200)
    client_email = serializers.EmailField()
    template_id  = serializers.UUIDField()
    employee_ids = serializers.ListField(child=serializers.UUIDField(), min_length=1)
    expires_days = serializers.IntegerField(min_value=1, max_value=90, default=7)


# ─── Public form submit ────────────────────────────────────────────────────────

class AnswerInputSerializer(serializers.Serializer):
    question_id   = serializers.UUIDField()
    employee_id   = serializers.UUIDField(required=False, allow_null=True)
    rating_value  = serializers.IntegerField(min_value=0, max_value=10, required=False, allow_null=True)
    text_value    = serializers.CharField(allow_blank=True, default='', required=False)
    yes_no_value  = serializers.BooleanField(required=False, allow_null=True)


class SubmitClientFeedbackSerializer(serializers.Serializer):
    answers = serializers.ListField(child=AnswerInputSerializer(), min_length=1)
