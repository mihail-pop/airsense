from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('api/weather/', views.get_weather_data, name='weather_data'),
    path('api/pollen/', views.get_pollen_data, name='pollen_data'),
    path('api/sentiment/', views.analyze_sentiment, name='analyze_sentiment'),
]