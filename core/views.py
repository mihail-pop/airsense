from django.shortcuts import render, redirect
from django.http import JsonResponse
from django.contrib.auth import login, authenticate, logout
from django.contrib.auth.decorators import login_required
from django.contrib import messages
import requests
import json
from transformers import pipeline
from .forms import RegisterForm
from .models import User, UserInteraction

def get_client_ip(request):
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip

def get_location_from_ip(ip):
    try:
        response = requests.get(f'http://ip-api.com/json/{ip}')
        data = response.json()
        if data['status'] == 'success':
            return data['lat'], data['lon']
    except:
        pass
    return 44.3302, 23.7949  # Craiova coordinates as fallback

def home(request):
    ip = get_client_ip(request)
    lat, lon = get_location_from_ip(ip)
    
    # Get current weather
    weather_url = f'https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=temperature_2m,relative_humidity_2m,weather_code&hourly=temperature_2m,relative_humidity_2m,weather_code&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=auto&forecast_days=7'
    
    try:
        weather_response = requests.get(weather_url)
        weather_data = weather_response.json()
    except:
        weather_data = {}
    
    # Get pollen data
    pollen_url = f'https://air-quality-api.open-meteo.com/v1/air-quality?latitude={lat}&longitude={lon}&hourly=alder_pollen,birch_pollen,grass_pollen,mugwort_pollen,olive_pollen,ragweed_pollen&forecast_days=7'
    
    try:
        pollen_response = requests.get(pollen_url)
        pollen_data = pollen_response.json()
    except:
        pollen_data = {}
    
    # Get user allergies if logged in
    user_allergies = []
    if request.user.is_authenticated:
        user_allergies = request.user.allergies or []
    
    context = {
        'weather_data': json.dumps(weather_data),
        'pollen_data': json.dumps(pollen_data),
        'user_allergies': user_allergies,
        'lat': lat,
        'lon': lon
    }
    return render(request, 'home.html', context)

def get_pollen_data(request):
    lat = request.GET.get('lat')
    lon = request.GET.get('lon')
    date = request.GET.get('date')
    
    if not lat or not lon:
        ip = get_client_ip(request)
        lat, lon = get_location_from_ip(ip)
    
    if date:
        pollen_url = f'https://air-quality-api.open-meteo.com/v1/air-quality?latitude={lat}&longitude={lon}&hourly=alder_pollen,birch_pollen,grass_pollen,mugwort_pollen,olive_pollen,ragweed_pollen&start_date={date}&end_date={date}'
    else:
        pollen_url = f'https://air-quality-api.open-meteo.com/v1/air-quality?latitude={lat}&longitude={lon}&hourly=alder_pollen,birch_pollen,grass_pollen,mugwort_pollen,olive_pollen,ragweed_pollen&forecast_days=7'
    
    try:
        response = requests.get(pollen_url)
        data = response.json()
        return JsonResponse(data)
    except:
        return JsonResponse({'error': 'Failed to fetch pollen data'})

def get_weather_data(lat=None, lon=None, request=None):
    # When called as URL endpoint, request is the first parameter
    if lat is not None and hasattr(lat, 'GET'):
        request = lat
        lat = request.GET.get('lat')
        lon = request.GET.get('lon')
    elif request:
        lat = request.GET.get('lat')
        lon = request.GET.get('lon')
    
    if not lat or not lon:
        if request:
            ip = get_client_ip(request)
            lat, lon = get_location_from_ip(ip)
        else:
            return None
    
    weather_url = f'https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=temperature_2m,relative_humidity_2m,weather_code&hourly=temperature_2m,relative_humidity_2m,weather_code&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=auto&forecast_days=7'
    
    try:
        response = requests.get(weather_url)
        data = response.json()
        if request:
            return JsonResponse(data)
        return data
    except:
        if request:
            return JsonResponse({'error': 'Failed to fetch weather data'})
        return None

def pollen_data_rec(lat=None, lon=None, request=None):
    if request:
        lat = request.GET.get('lat')
        lon = request.GET.get('lon')
    
    if not lat or not lon:
        if request:
            ip = get_client_ip(request)
            lat, lon = get_location_from_ip(ip)
        else:
            return None
    
    # Air Quality API for pollen data
    pollen_url = f'https://air-quality-api.open-meteo.com/v1/air-quality?latitude={lat}&longitude={lon}&hourly=alder_pollen,birch_pollen,grass_pollen,mugwort_pollen,olive_pollen,ragweed_pollen&timezone=auto&forecast_days=1'
    
    try:
        response = requests.get(pollen_url)
        data = response.json()
        
        # Print pollen data to terminal
        print("=== POLLEN DATA ===")
        print(f"Location: {lat}, {lon}")
        if 'hourly' in data:
            hourly = data['hourly']
            print(f"Time: {hourly['time'][0] if hourly['time'] else 'N/A'}")
            print(f"Alder Pollen: {hourly['alder_pollen'][0] if hourly['alder_pollen'] else 'N/A'}")
            print(f"Birch Pollen: {hourly['birch_pollen'][0] if hourly['birch_pollen'] else 'N/A'}")
            print(f"Grass Pollen: {hourly['grass_pollen'][0] if hourly['grass_pollen'] else 'N/A'}")
            print(f"Mugwort Pollen: {hourly['mugwort_pollen'][0] if hourly['mugwort_pollen'] else 'N/A'}")
            print(f"Olive Pollen: {hourly['olive_pollen'][0] if hourly['olive_pollen'] else 'N/A'}")
            print(f"Ragweed Pollen: {hourly['ragweed_pollen'][0] if hourly['ragweed_pollen'] else 'N/A'}")
        print("===================")
        
        if request:
            return JsonResponse(data)
        return data
    except Exception as e:
        print(f"Error fetching pollen data: {e}")
        if request:
            return JsonResponse({'error': 'Failed to fetch pollen data'})
        return None

def make_recommendation(weather_code, pollen_levels, sentiment, selected_pollens):
    # Weather conditions
    rainy_codes = [51, 53, 55, 61, 63, 65]
    sunny_codes = [0, 1]
    windy_codes = [2, 3]
    
    is_rainy = weather_code in rainy_codes
    is_sunny = weather_code in sunny_codes
    is_windy = weather_code in windy_codes
    
    # Calculate average pollen level for selected allergies
    total_pollen = 0
    pollen_count = 0
    for pollen in selected_pollens:
        pollen_key = f"{pollen}_pollen"
        if pollen_key in pollen_levels and pollen_levels[pollen_key]:
            total_pollen += pollen_levels[pollen_key][0] or 0
            pollen_count += 1
    
    avg_pollen = total_pollen / pollen_count if pollen_count > 0 else 0
    
    # Pollen level categories
    pollen_low = avg_pollen < 10
    pollen_medium = 10 <= avg_pollen < 50
    pollen_high = avg_pollen >= 50
    
    # Generate recommendations
    if sentiment == 'POSITIVE' and is_rainy and pollen_low:
        return "You're feeling great and conditions are perfect! Rain keeps pollen low. Keep windows open and enjoy the fresh air."
    elif sentiment == 'POSITIVE' and is_sunny and pollen_low:
        return "Great day ahead! Low pollen levels and sunny weather. Perfect for outdoor activities without allergy concerns."
    elif sentiment == 'NEGATIVE' and pollen_high:
        return "You're not feeling well and pollen levels are high. Stay indoors, keep windows closed, and consider taking allergy medication."
    elif sentiment == 'NEGATIVE' and is_rainy:
        return "You're feeling unwell but rain should help reduce pollen. Rest indoors and let the weather work in your favor."
    elif pollen_high and is_sunny:
        return "High pollen levels with sunny weather. Limit outdoor exposure, wear sunglasses, and take preventive allergy medication."
    elif pollen_medium and is_windy:
        return "Moderate pollen with windy conditions may spread allergens. Consider staying indoors or wearing a mask if going out."
    elif pollen_low:
        return "Low pollen levels today! Good conditions for outdoor activities. Keep monitoring your symptoms."
    else:
        return "Mixed conditions today. Monitor your symptoms and adjust activities accordingly. Stay prepared with allergy medication."

def analyze_sentiment(feeling_text):
    sentiment = pipeline("sentiment-analysis", model="distilbert/distilbert-base-uncased-finetuned-sst-2-english")
    result = sentiment(feeling_text)[0]
    return result['label'], result['score']

def register_view(request):
    if request.method == 'POST':
        form = RegisterForm(request.POST)
        if form.is_valid():
            user = form.save()
            login(request, user)
            return redirect('/')
    else:
        form = RegisterForm()
    return render(request, 'register.html', {'form': form})

def login_view(request):
    if request.method == 'POST':
        email = request.POST['username']
        password = request.POST['password']
        user = authenticate(request, username=email, password=password)
        if user:
            login(request, user)
            return redirect('/')
        else:
            messages.error(request, 'Invalid credentials')
    return render(request, 'login.html')

def logout_view(request):
    logout(request)
    return redirect('/login/')

def gdpr_view(request):
    return render(request, 'gdpr.html')

def get_rec_data(request):
    if request.method == 'POST':
        feeling_text = request.POST.get('feeling')
        selected_pollens = request.POST.getlist('pollens')
        
        if feeling_text:
            try:
                # Get location
                ip = get_client_ip(request)
                lat, lon = get_location_from_ip(ip)
                
                # Get sentiment
                sentiment_label, sentiment_score = analyze_sentiment(feeling_text)
                
                # Get weather data
                weather_data = get_weather_data(lat, lon)
                weather_code = weather_data.get('current', {}).get('weather_code', 0) if weather_data else 0
                
                # Get pollen data
                pollen_data = pollen_data_rec(lat, lon)
                pollen_levels = pollen_data.get('hourly', {}) if pollen_data else {}
                
                # Generate recommendation
                recommendation = make_recommendation(weather_code, pollen_levels, sentiment_label, selected_pollens)
                
                # Save interaction if user is logged in
                if request.user.is_authenticated:
                    # Extract current hour data
                    current_weather = weather_data.get('current', {}) if weather_data else {}
                    current_pollen = {}
                    if pollen_data and 'hourly' in pollen_data:
                        from datetime import datetime
                        current_hour = datetime.now().hour
                        hourly = pollen_data['hourly']
                        if hourly.get('time') and len(hourly['time']) > current_hour:
                            current_pollen = {
                                'time': hourly['time'][current_hour],
                                'alder_pollen': hourly.get('alder_pollen', [None])[current_hour],
                                'birch_pollen': hourly.get('birch_pollen', [None])[current_hour],
                                'grass_pollen': hourly.get('grass_pollen', [None])[current_hour],
                                'mugwort_pollen': hourly.get('mugwort_pollen', [None])[current_hour],
                                'olive_pollen': hourly.get('olive_pollen', [None])[current_hour],
                                'ragweed_pollen': hourly.get('ragweed_pollen', [None])[current_hour]
                            }
                    
                    UserInteraction.objects.create(
                        user=request.user,
                        user_input=feeling_text,
                        selected_allergies=selected_pollens,
                        ai_output=recommendation,
                        weather_data=current_weather,
                        pollen_data=current_pollen
                    )
                
                return JsonResponse({
                    'sentiment': sentiment_label,
                    'confidence': sentiment_score,
                    'selected_pollens': selected_pollens,
                    'recommendation': recommendation
                })
            except Exception as e:
                return JsonResponse({'error': f'Failed to analyze: {str(e)}'})
    
    return JsonResponse({'error': 'Invalid request'})

def profile_view(request):
    if not request.user.is_authenticated:
        return redirect('/login/')
    
    if request.method == 'POST':
        action = request.POST.get('action')
        current_password = request.POST.get('current_password')
        
        # Verify current password
        if not request.user.check_password(current_password):
            messages.error(request, 'Current password is incorrect')
            return render(request, 'profile.html')
        
        if action == 'delete':
            request.user.delete()
            messages.success(request, 'Account deleted successfully')
            return redirect('/register/')
        
        elif action == 'delete_data':
            UserInteraction.objects.filter(user=request.user).delete()
            messages.success(request, 'AI interaction history deleted successfully')
            return render(request, 'profile.html')
        
        elif action == 'update':
            # Update user fields
            request.user.username = request.POST.get('username')
            request.user.email = request.POST.get('email')
            request.user.full_name = request.POST.get('full_name')
            # Handle date of birth
            day = request.POST.get('birth_day')
            month = request.POST.get('birth_month')
            year = request.POST.get('birth_year')
            if day and month and year:
                from datetime import date
                try:
                    request.user.date_of_birth = date(int(year), int(month), int(day))
                except ValueError:
                    request.user.date_of_birth = None
            else:
                request.user.date_of_birth = None
            request.user.allergies = request.POST.getlist('allergies')
            
            # Update password if provided
            new_password = request.POST.get('new_password')
            confirm_password = request.POST.get('confirm_password')
            if new_password:
                if new_password == confirm_password:
                    request.user.set_password(new_password)
                else:
                    messages.error(request, 'New passwords do not match')
                    return render(request, 'profile.html')
            
            request.user.save()
            messages.success(request, 'Profile updated successfully')
            
            # Re-login if password was changed
            if new_password:
                login(request, request.user)
    
    return render(request, 'profile.html')

def update_allergies(request):
    if request.method == 'POST' and request.user.is_authenticated:
        allergies = request.POST.getlist('allergies')
        request.user.allergies = allergies
        request.user.save()
        return JsonResponse({'success': True})
    return JsonResponse({'error': 'Invalid request'})

def history_view(request):
    if not request.user.is_authenticated:
        return redirect('/login/')
    
    interactions = UserInteraction.objects.filter(user=request.user).order_by('-timestamp')
    return render(request, 'history.html', {'interactions': interactions})
