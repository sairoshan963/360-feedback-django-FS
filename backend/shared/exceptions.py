from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status


ERROR_CODE_MAP = {
    'authentication_failed':    ('UNAUTHORIZED',        status.HTTP_401_UNAUTHORIZED),
    'not_authenticated':        ('UNAUTHORIZED',        status.HTTP_401_UNAUTHORIZED),
    'permission_denied':        ('FORBIDDEN',           status.HTTP_403_FORBIDDEN),
    'not_found':                ('NOT_FOUND',           status.HTTP_404_NOT_FOUND),
    'method_not_allowed':       ('METHOD_NOT_ALLOWED',  status.HTTP_405_METHOD_NOT_ALLOWED),
    'validation_error':         ('VALIDATION_ERROR',    status.HTTP_400_BAD_REQUEST),
    'throttled':                ('RATE_LIMITED',        status.HTTP_429_TOO_MANY_REQUESTS),
}


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)

    if response is not None:
        code_key = getattr(exc, 'default_code', 'error')
        error_code, _ = ERROR_CODE_MAP.get(code_key, ('ERROR', response.status_code))

        detail = response.data
        if isinstance(detail, dict) and 'detail' in detail:
            message = str(detail['detail'])
        elif isinstance(detail, list):
            message = ' '.join(str(e) for e in detail)
        else:
            message = str(detail)

        response.data = {
            'success': False,
            'error':   error_code,
            'message': message,
        }

    return response
