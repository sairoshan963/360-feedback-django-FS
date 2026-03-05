from django.urls import path
from . import views

urlpatterns = [
    path('',                    views.NotificationListView.as_view(), name='notification-list'),
    path('unread-count/',       views.UnreadCountView.as_view(),      name='notification-unread-count'),
    path('mark-all-read/',      views.MarkAllReadView.as_view(),      name='notification-mark-all-read'),
    path('<uuid:pk>/read/',     views.MarkReadView.as_view(),         name='notification-mark-read'),
]
