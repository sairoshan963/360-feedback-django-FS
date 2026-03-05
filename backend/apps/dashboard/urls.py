from django.urls import path
from . import views

urlpatterns = [
    path('summary/',                   views.SummaryStatsView.as_view(),    name='dashboard-summary'),
    path('hr/<uuid:cycle_id>/',        views.HrDashboardView.as_view(),     name='dashboard-hr'),
    path('manager/<uuid:cycle_id>/',   views.ManagerDashboardView.as_view(), name='dashboard-manager'),
    path('heatmap/',                   views.OrgHeatmapView.as_view(),      name='dashboard-heatmap'),
]
