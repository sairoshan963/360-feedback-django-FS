from django.urls import path
from . import views

urlpatterns = [
    # Login / OAuth
    path('login/',            views.LoginView.as_view(),          name='auth-login'),
    path('refresh/',          views.TokenRefreshView.as_view(),   name='auth-refresh'),
    path('google/',           views.GoogleAuthView.as_view(),     name='auth-google'),

    # Current user
    path('me/',               views.MeView.as_view(),             name='auth-me'),
    path('me/profile/',       views.UpdateProfileView.as_view(),  name='auth-profile'),
    path('me/password/',      views.ChangePasswordView.as_view(), name='auth-change-password'),
    path('me/avatar/',        views.AvatarUploadView.as_view(),   name='auth-avatar'),

    # Password reset
    path('forgot-password/',  views.ForgotPasswordView.as_view(), name='auth-forgot-password'),
    path('reset-password/',   views.ResetPasswordView.as_view(),  name='auth-reset-password'),
]
