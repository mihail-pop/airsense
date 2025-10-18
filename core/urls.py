from django.urls import path
from django.contrib.auth import logout
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('register/', views.register_view, name='register'),
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('gdpr/', views.gdpr_view, name='gdpr'),
    path('gdpr_ro/', views.gdpr_ro_view, name='gdpr_ro'),
    path('api/weather/', views.get_weather_data, name='weather_data'),
    path('api/sentiment/', views.get_rec_data, name='get_rec_data'),
    path('api/pollen-rec/', views.pollen_data_rec, name='pollen_data_rec'),
    path('api/pollen/', views.get_pollen_data, name='pollen_data'),
    path('api/allergies/', views.update_allergies, name='update_allergies'),
    path('profile/', views.profile_view, name='profile'),
    path('history/', views.history_view, name='history'),
]