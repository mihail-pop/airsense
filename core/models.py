from django.contrib.auth.models import AbstractUser
from django.db import models
import json

class User(AbstractUser):
    email = models.EmailField(unique=True)
    full_name = models.CharField(max_length=255)
    age = models.PositiveIntegerField(null=True, blank=True)
    allergies = models.JSONField(default=list, blank=True)
    gdpr_consent = models.BooleanField(default=False)
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'full_name']

class UserInteraction(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    timestamp = models.DateTimeField(auto_now_add=True)
    user_input = models.TextField()
    selected_allergies = models.JSONField(default=list)
    ai_output = models.TextField()
    weather_data = models.JSONField()
    pollen_data = models.JSONField()
    
    class Meta:
        ordering = ['-timestamp']