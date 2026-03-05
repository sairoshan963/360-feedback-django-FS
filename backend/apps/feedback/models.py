import uuid
from django.db import models
from django.conf import settings


class FeedbackResponse(models.Model):
    id         = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    task       = models.OneToOneField('reviewer_workflow.ReviewerTask', on_delete=models.CASCADE, related_name='response')
    submitted_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    submitted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'feedback_responses'

    def __str__(self):
        return f'Response for task {self.task_id}'


class FeedbackAnswer(models.Model):
    id           = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    response     = models.ForeignKey(FeedbackResponse, on_delete=models.CASCADE, related_name='answers')
    question     = models.ForeignKey('review_cycles.TemplateQuestion', on_delete=models.CASCADE)
    rating_value = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    text_value   = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'feedback_answers'


class AggregatedResult(models.Model):
    id             = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    cycle          = models.ForeignKey('review_cycles.ReviewCycle', on_delete=models.CASCADE, related_name='aggregated_results')
    reviewee       = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='aggregated_results')
    overall_score  = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    self_score     = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    manager_score  = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    peer_score     = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    computed_at    = models.DateTimeField(auto_now=True)

    class Meta:
        db_table        = 'aggregated_results'
        unique_together = ('cycle', 'reviewee')

    def __str__(self):
        return f'Result: {self.reviewee} in {self.cycle}'
