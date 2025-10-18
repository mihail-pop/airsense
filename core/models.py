from django.contrib.auth.models import AbstractUser
from django.db import models
import json

class User(AbstractUser):
    email = models.EmailField(unique=True)
    full_name = models.CharField(max_length=255)
    date_of_birth = models.DateField(null=True, blank=True)
    allergies = models.JSONField(default=list, blank=True)
    gdpr_consent = models.BooleanField(default=False)
    timezone = models.CharField(max_length=50, default='UTC')
    webhook_url = models.URLField(blank=True, null=True)
    email_reminders = models.BooleanField(default=False)
    webhook_reminders = models.BooleanField(default=False)
    telegram_reminders = models.BooleanField(default=False)
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'full_name']

class UserInteraction(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    timestamp = models.DateTimeField(auto_now_add=True)
    user_input = models.TextField()
    selected_allergies = models.JSONField(default=list)
    ai_output = models.TextField()
    short_summary = models.TextField(blank=True, null=True)
    tips = models.TextField(blank=True, null=True)
    sentiment_label = models.CharField(max_length=20, null=True, blank=True)
    sentiment_confidence = models.FloatField(null=True, blank=True)
    weather_data = models.JSONField()
    pollen_data = models.JSONField()
    
    class Meta:
        ordering = ['-timestamp']