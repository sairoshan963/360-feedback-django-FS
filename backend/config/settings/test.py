"""
Test settings — uses SQLite in-memory so tests run without a real PostgreSQL server.
"""
from .base import *  # noqa: F401, F403

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',
    }
}

# Speed up password hashing in tests
PASSWORD_HASHERS = ['django.contrib.auth.hashers.MD5PasswordHasher']

# Disable email sending during tests
EMAIL_BACKEND = 'django.core.mail.backends.locmem.EmailBackend'

# Silence Celery during tests
CELERY_TASK_ALWAYS_EAGER = True
CELERY_TASK_EAGER_PROPAGATES = True

# Disable throttling during tests — all 74 tests share the same client IP,
# which exhausts the 10/min login rate limit and causes cascading 429 failures.
REST_FRAMEWORK = {
    **REST_FRAMEWORK,  # noqa: F405
    'DEFAULT_THROTTLE_CLASSES': [],
    'DEFAULT_THROTTLE_RATES': {
        'anon':           '10000/minute',
        'user':           '10000/minute',
        'login':          '10000/minute',
        'password_reset': '10000/minute',
    },
}
