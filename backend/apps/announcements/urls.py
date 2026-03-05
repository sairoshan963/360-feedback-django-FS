from django.urls import path
from . import views

urlpatterns = [
    path('',                        views.AnnouncementListView.as_view(),        name='announcement-list'),
    path('all/',                    views.AnnouncementAdminListView.as_view(),   name='announcement-admin-list'),
    path('<uuid:pk>/deactivate/',   views.AnnouncementDeactivateView.as_view(),  name='announcement-deactivate'),
    path('<uuid:pk>/',              views.AnnouncementDeleteView.as_view(),      name='announcement-delete'),
]
