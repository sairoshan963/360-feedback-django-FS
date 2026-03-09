from django.urls import path
from . import views

urlpatterns = [
    # Users (Super Admin)
    path('',             views.UserListCreateView.as_view(), name='user-list-create'),
    path('<uuid:pk>/',                    views.UserDetailView.as_view(),             name='user-detail'),
    path('<uuid:pk>/reset-password/',     views.AdminResetUserPasswordView.as_view(), name='user-reset-password'),
    path('import/',      views.UserBulkImportView.as_view(), name='user-bulk-import'),

    # Departments
    path('departments/',           views.DepartmentListCreateView.as_view(), name='department-list'),
    path('departments/<uuid:pk>/', views.DepartmentDetailView.as_view(),    name='department-detail'),

    # Org Hierarchy
    path('org/hierarchy/', views.OrgHierarchyView.as_view(), name='org-hierarchy'),
]
