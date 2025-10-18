#!/usr/bin/env python
import os
import sys
import django
from datetime import datetime

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'airsense.settings')
django.setup()

from django.core.management import call_command

def should_send_notification():
    """Check if current time matches notification schedule"""
    now = datetime.now()
    hour = now.hour
    
    # 6 AM, 12 PM (noon), 5 PM
    notification_hours = [6, 12, 17]
    return hour in notification_hours

if __name__ == "__main__":
    if should_send_notification():
        print(f"Sending notifications at {datetime.now()}")
        call_command('send_notifications')
    else:
        print(f"Not notification time. Current hour: {datetime.now().hour}")