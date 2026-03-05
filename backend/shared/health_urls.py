from django.urls import path
from django.http import JsonResponse
from django.db import connection


def health(request):
    return JsonResponse({'success': True, 'status': 'ok'})


def health_db(request):
    try:
        connection.ensure_connection()
        return JsonResponse({'success': True, 'db': 'ok'})
    except Exception as e:
        return JsonResponse({'success': False, 'db': 'error', 'message': str(e)}, status=503)


urlpatterns = [
    path('',    health,    name='health'),
    path('db/', health_db, name='health-db'),
]
