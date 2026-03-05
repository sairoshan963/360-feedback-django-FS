from rest_framework.permissions import BasePermission


class IsSuperAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'SUPER_ADMIN'


class IsHRAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ['HR_ADMIN', 'SUPER_ADMIN']


class IsManager(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ['MANAGER', 'SUPER_ADMIN']


class IsEmployee(BasePermission):
    """Any authenticated user can access employee-level routes."""
    def has_permission(self, request, view):
        return request.user.is_authenticated


class IsHROrManager(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ['HR_ADMIN', 'MANAGER', 'SUPER_ADMIN']
