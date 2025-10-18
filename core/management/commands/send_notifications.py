from django.core.management.base import BaseCommand
from django.utils import timezone
from django.db import models
from core.models import User
import requests
import pytz
from datetime import datetime, timedelta

class Command(BaseCommand):
    help = 'Send notifications to users based on pollen levels'

    def handle(self, *args, **options):
        users = User.objects.filter(
            models.Q(email_reminders=True) | 
            models.Q(webhook_reminders=True) | 
            models.Q(telegram_reminders=True)
        )
        
        for user in users:
            try:
                # Get user's timezone
                user_tz = pytz.timezone(user.timezone)
                now = timezone.now().astimezone(user_tz)
                
                # Get pollen data for next 6 hours
                pollen_data = self.get_pollen_forecast(44.3302, 23.7949)  # Default location
                analysis = self.analyze_pollen_data(pollen_data, user.allergies)
                
                message = self.create_notification_message(analysis, user.full_name)
                
                # Send notifications based on user preferences
                if user.email_reminders:
                    self.send_email_notification(user.email, message)
                
                if user.webhook_reminders and user.webhook_url:
                    self.send_webhook_notification(user.webhook_url, message)
                
                if user.telegram_reminders:
                    self.send_telegram_notification(user, message)
                    
            except Exception as e:
                self.stdout.write(f"Error sending notification to {user.email}: {e}")

    def get_pollen_forecast(self, lat, lon):
        url = f'https://air-quality-api.open-meteo.com/v1/air-quality?latitude={lat}&longitude={lon}&hourly=alder_pollen,birch_pollen,grass_pollen,mugwort_pollen,olive_pollen,ragweed_pollen&forecast_hours=6'
        try:
            response = requests.get(url)
            return response.json()
        except:
            return {}

    def analyze_pollen_data(self, pollen_data, user_allergies):
        if not pollen_data.get('hourly'):
            return {'max_levels': {}, 'user_alerts': []}
        
        hourly = pollen_data['hourly']
        pollen_types = ['alder_pollen', 'birch_pollen', 'grass_pollen', 'mugwort_pollen', 'olive_pollen', 'ragweed_pollen']
        
        max_levels = {}
        for pollen_type in pollen_types:
            if pollen_type in hourly and hourly[pollen_type]:
                max_levels[pollen_type] = max(hourly[pollen_type][:6])
        
        # Check user allergies
        user_alerts = []
        for allergy in user_allergies:
            pollen_key = f"{allergy}_pollen"
            if pollen_key in max_levels and max_levels[pollen_key] > 10:
                user_alerts.append({
                    'type': allergy.title(),
                    'level': max_levels[pollen_key]
                })
        
        return {'max_levels': max_levels, 'user_alerts': user_alerts}

    def create_notification_message(self, analysis, user_name):
        message = f"Hello {user_name}!\n\nPollen Forecast for the next 6 hours:\n\n"
        
        # Add max levels
        if analysis['max_levels']:
            message += "Highest pollen levels:\n"
            for pollen_type, level in analysis['max_levels'].items():
                clean_name = pollen_type.replace('_pollen', '').title()
                message += f"• {clean_name}: {level}\n"
        
        # Add user-specific alerts
        if analysis['user_alerts']:
            message += f"\n⚠️ ALLERGY ALERTS for your selected allergies:\n"
            for alert in analysis['user_alerts']:
                message += f"• {alert['type']}: {alert['level']} (HIGH)\n"
        else:
            message += "\n✅ No high levels detected for your allergies.\n"
        
        message += "\nStay safe and take necessary precautions!"
        return message

    def send_email_notification(self, email, message):
        # Dummy email notification
        self.stdout.write(f"[EMAIL] Sent to {email}: {message[:50]}...")

    def send_webhook_notification(self, webhook_url, message):
        try:
            # Discord webhook format
            payload = {
                'content': message
            }
            response = requests.post(webhook_url, json=payload, timeout=10)
            self.stdout.write(f"[WEBHOOK] Sent to {webhook_url}: Status {response.status_code}")
        except Exception as e:
            self.stdout.write(f"[WEBHOOK] Failed to send to {webhook_url}: {e}")

    def send_telegram_notification(self, user, message):
        # Dummy telegram notification
        self.stdout.write(f"[TELEGRAM] Sent to {user.email}: {message[:50]}...")