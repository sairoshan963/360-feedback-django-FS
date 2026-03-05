from django.urls import path
from . import views

urlpatterns = [
    # Tasks
    path('',              views.MyTasksView.as_view(),    name='task-list'),
    path('<uuid:pk>/',    views.TaskDetailView.as_view(), name='task-detail'),
    path('<uuid:pk>/draft/', views.SaveDraftView.as_view(), name='task-draft'),

    # Nominations — employee
    path('cycles/<uuid:cycle_id>/nominations/',          views.MyNominationsView.as_view(),    name='my-nominations'),

    # Nominations — HR view all
    path('cycles/<uuid:cycle_id>/nominations/all/',      views.AllNominationsView.as_view(),   name='all-nominations'),

    # Nominations — Manager/HR pending approvals
    path('cycles/<uuid:cycle_id>/nominations/pending/',  views.PendingApprovalsView.as_view(), name='pending-nominations'),

    # Nomination decision
    path('nominations/<uuid:pk>/decide/',                views.NominationDecisionView.as_view(), name='nomination-decide'),
]
