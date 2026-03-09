from django.db.models import Avg, Count, Q
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from shared.permissions import IsHRAdmin, IsManager, IsHROrManager
from apps.review_cycles.models import ReviewCycle, CycleParticipant
from apps.reviewer_workflow.models import ReviewerTask, PeerNomination
from apps.feedback.models import AggregatedResult
from apps.users.models import OrgHierarchy


def _get_cycle_or_404(cycle_id):
    try:
        return ReviewCycle.objects.get(id=cycle_id)
    except ReviewCycle.DoesNotExist:
        from rest_framework.exceptions import NotFound
        raise NotFound('Review cycle not found')


# ─── HR Dashboard ─────────────────────────────────────────────────────────────

class HrDashboardView(APIView):
    permission_classes = [IsAuthenticated, IsHRAdmin]

    def get(self, request, cycle_id):
        cycle = _get_cycle_or_404(cycle_id)

        # Submission stats by reviewer type
        submission_stats = list(
            ReviewerTask.objects.filter(cycle=cycle)
            .values('reviewer_type')
            .annotate(
                total=Count('id'),
                submitted=Count('id', filter=Q(status='SUBMITTED')),
                locked=Count('id', filter=Q(status='LOCKED')),
                pending=Count('id', filter=Q(status__in=['CREATED', 'PENDING', 'IN_PROGRESS'])),
            )
        )

        # Participation rate
        total_tasks     = sum(s['total'] for s in submission_stats)
        completed_tasks = sum(s['submitted'] + s['locked'] for s in submission_stats)
        participation_rate = round((completed_tasks / total_tasks) * 100) if total_tasks else 0

        # Nomination stats (peer-enabled cycles)
        nomination_stats = None
        if cycle.peer_enabled:
            participants = CycleParticipant.objects.filter(cycle=cycle).values_list('user_id', flat=True)
            total = len(participants)
            complete = sum(
                1 for uid in participants
                if PeerNomination.objects.filter(cycle=cycle, reviewee_id=uid, status='APPROVED').count()
                >= (cycle.peer_min_count or 0)
            )
            nomination_stats = {'total': total, 'complete': complete, 'incomplete': total - complete}

        # Department score distribution (post-closure)
        dept_scores = list(
            AggregatedResult.objects.filter(cycle=cycle)
            .select_related('reviewee__department')
            .values('reviewee__department__name')
            .annotate(
                avg_overall=Avg('overall_score'),
                avg_peer=Avg('peer_score'),
                avg_manager=Avg('manager_score'),
                participant_count=Count('id'),
            )
        )

        # Remap Django ORM annotation field name to clean 'department' key for frontend
        clean_dept_scores = [
            {
                'department':        row.get('reviewee__department__name') or 'Unknown',
                'avg_overall':       row.get('avg_overall'),
                'avg_peer':          row.get('avg_peer'),
                'avg_manager':       row.get('avg_manager'),
                'participant_count': row.get('participant_count'),
            }
            for row in dept_scores
        ]

        return Response({
            'success': True,
            'dashboard': {
                'cycle_id':           str(cycle_id),
                'cycle_name':         cycle.name,
                'cycle_state':        cycle.state,
                'participation_rate': participation_rate,
                'submission_stats':   submission_stats,
                'nomination_stats':   nomination_stats,
                'department_scores':  clean_dept_scores,
            },
        })


# ─── Manager Dashboard ────────────────────────────────────────────────────────

class ManagerDashboardView(APIView):
    permission_classes = [IsAuthenticated, IsHROrManager]

    def get(self, request, cycle_id):
        cycle = _get_cycle_or_404(cycle_id)

        # Get direct reports
        if request.user.role == 'MANAGER':
            direct_ids = list(
                OrgHierarchy.objects.filter(manager=request.user)
                .values_list('employee_id', flat=True)
            )
        else:
            # HR/Super Admin sees all participants
            direct_ids = list(
                CycleParticipant.objects.filter(cycle=cycle).values_list('user_id', flat=True)
            )

        if not direct_ids:
            return Response({'success': True, 'dashboard': {'cycle_id': str(cycle_id), 'cycle_name': cycle.name, 'team': []}})

        from apps.users.models import User
        directs = User.objects.filter(id__in=direct_ids, status='ACTIVE')

        # Task completion per direct report
        task_stats = {
            str(row['reviewee_id']): row
            for row in ReviewerTask.objects.filter(cycle=cycle, reviewee_id__in=direct_ids)
            .values('reviewee_id')
            .annotate(
                total_tasks=Count('id'),
                submitted=Count('id', filter=Q(status='SUBMITTED')),
            )
        }

        # Scores (only if results released)
        scores_map = {}
        if cycle.state in ['RESULTS_RELEASED', 'ARCHIVED']:
            scores_map = {
                str(r.reviewee_id): r
                for r in AggregatedResult.objects.filter(cycle=cycle, reviewee_id__in=direct_ids)
            }

        team = []
        for emp in directs:
            uid  = str(emp.id)
            stat = task_stats.get(uid, {'total_tasks': 0, 'submitted': 0})
            scr  = scores_map.get(uid)
            team.append({
                'id':         uid,
                'user_id':    uid,
                'first_name': emp.first_name,
                'last_name':  emp.last_name,
                'email':      emp.email,
                'department': emp.department.name if emp.department_id else None,
                'task_completion': {
                    'total_tasks': stat.get('total_tasks', 0),
                    'submitted':   stat.get('submitted', 0),
                },
                'scores': {
                    'overall_score':  float(scr.overall_score)  if scr and scr.overall_score  else None,
                    'self_score':     float(scr.self_score)     if scr and scr.self_score     else None,
                    'manager_score':  float(scr.manager_score)  if scr and scr.manager_score  else None,
                    'peer_score':     float(scr.peer_score)     if scr and scr.peer_score     else None,
                } if scr else None,
            })

        return Response({
            'success': True,
            'dashboard': {
                'cycle_id':    str(cycle_id),
                'cycle_name':  cycle.name,
                'cycle_state': cycle.state,
                'team':        team,
            },
        })


# ─── Org Heatmap (HR / Super Admin) ──────────────────────────────────────────

class OrgHeatmapView(APIView):
    permission_classes = [IsAuthenticated, IsHRAdmin]

    def get(self, request):
        rows = (
            AggregatedResult.objects
            .select_related('cycle', 'reviewee__department')
            .values('cycle__id', 'cycle__name', 'reviewee__department__name')
            .annotate(
                avg_overall=Avg('overall_score'),
                avg_manager=Avg('manager_score'),
                avg_peer=Avg('peer_score'),
                participants=Count('id'),
            )
            .order_by('-cycle__created_at', 'reviewee__department__name')
        )
        return Response({'success': True, 'heatmap': list(rows)})


# ─── Summary Stats (used on HR Dashboard home) ───────────────────────────────

class SummaryStatsView(APIView):
    permission_classes = [IsAuthenticated, IsHRAdmin]

    def get(self, request):
        from apps.users.models import User
        total_users    = User.objects.filter(status='ACTIVE').count()
        total_cycles   = ReviewCycle.objects.count()
        active_cycles  = ReviewCycle.objects.filter(state='ACTIVE').count()
        pending_tasks  = ReviewerTask.objects.filter(status__in=['CREATED', 'PENDING', 'IN_PROGRESS']).count()

        return Response({
            'success': True,
            'total_users':   total_users,
            'total_cycles':  total_cycles,
            'active_cycles': active_cycles,
            'pending_tasks': pending_tasks,
        })
