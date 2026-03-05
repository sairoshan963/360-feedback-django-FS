from django.urls import path
from . import views

urlpatterns = [
    # Templates
    path('templates/',           views.TemplateListCreateView.as_view(), name='template-list'),
    path('templates/<uuid:pk>/', views.TemplateDetailView.as_view(),     name='template-detail'),

    # Cycles
    path('',                     views.CycleListCreateView.as_view(),    name='cycle-list'),
    path('mine/',                views.MyCyclesView.as_view(),           name='cycle-mine'),
    path('<uuid:pk>/',           views.CycleDetailView.as_view(),        name='cycle-detail'),

    # Participants
    path('<uuid:pk>/participants/', views.CycleParticipantsView.as_view(), name='cycle-participants'),

    # State transitions
    path('<uuid:pk>/activate/',        views.CycleActivateView.as_view(),       name='cycle-activate'),
    path('<uuid:pk>/finalize/',        views.CycleFinalizeView.as_view(),        name='cycle-finalize'),
    path('<uuid:pk>/close/',           views.CycleCloseView.as_view(),           name='cycle-close'),
    path('<uuid:pk>/release-results/', views.CycleReleaseResultsView.as_view(),  name='cycle-release'),
    path('<uuid:pk>/archive/',         views.CycleArchiveView.as_view(),         name='cycle-archive'),
    path('<uuid:pk>/override/',        views.CycleOverrideView.as_view(),        name='cycle-override'),

    # Progress & status
    path('<uuid:pk>/progress/',          views.CycleProgressView.as_view(),         name='cycle-progress'),
    path('<uuid:pk>/nomination-status/', views.NominationStatusView.as_view(),      name='cycle-nomination-status'),
    path('<uuid:pk>/task-status/',       views.ParticipantTaskStatusView.as_view(), name='cycle-task-status'),
]
