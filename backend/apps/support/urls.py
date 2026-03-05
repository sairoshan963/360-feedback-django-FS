from django.urls import path
from . import views

urlpatterns = [
    path('report/', views.SupportReportView.as_view(), name='support-report'),
]
