from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('api/weather/', views.get_weather_data, name='weather_data'),
    path('api/sentiment/', views.get_rec_data, name='get_rec_data'),
    path('api/pollen-rec/', views.pollen_data_rec, name='pollen_data_rec'),
]