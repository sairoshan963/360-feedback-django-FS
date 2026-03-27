from django.urls import path
from . import views

urlpatterns = [
    # Templates (HR Admin)
    path('templates/',           views.ClientFeedbackTemplateListCreateView.as_view(), name='cf-template-list'),
    path('templates/<uuid:pk>/', views.ClientFeedbackTemplateDetailView.as_view(),     name='cf-template-detail'),

    # Requests (HR Admin)
    path('',                  views.ClientFeedbackRequestListCreateView.as_view(), name='cf-request-list'),
    path('<uuid:pk>/',        views.ClientFeedbackRequestDetailView.as_view(),     name='cf-request-detail'),
    path('<uuid:pk>/resend/', views.ClientFeedbackResendView.as_view(),            name='cf-request-resend'),

    # Public — no auth
    path('form/<str:token>/',        views.PublicFormView.as_view(),       name='cf-form'),
    path('form/<str:token>/submit/', views.PublicFormSubmitView.as_view(), name='cf-form-submit'),
]
