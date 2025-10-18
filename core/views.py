from django.shortcuts import render
from django.http import JsonResponse
import requests
import json
from transformers import pipeline

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
    
    context = {
        'weather_data': json.dumps(weather_data),
        'pollen_data': json.dumps(pollen_data),
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

def make_recommendation(weather_data, pollen_levels, sentiment, selected_pollens):
    # Weather conditions
    rainy_codes = [51, 53, 55, 61, 63, 65]
    sunny_codes = [0, 1]
    windy_codes = [2, 3]
    
    # Check weather for the rest of the day (next 12 hours)
    will_rain = False
    is_sunny = False
    is_windy = False
    
    if weather_data and 'hourly' in weather_data:
        # Check next 12 hours for weather patterns
        for i in range(min(12, len(weather_data['hourly']['weather_code']))):
            code = weather_data['hourly']['weather_code'][i]
            if code in rainy_codes:
                will_rain = True
            if code in sunny_codes:
                is_sunny = True
            if code in windy_codes:
                is_windy = True
    
    # Calculate average pollen level for selected allergies for the day
    total_pollen = 0
    pollen_count = 0
    
    for pollen in selected_pollens:
        pollen_key = f"{pollen}_pollen"
        if pollen_key in pollen_levels and pollen_levels[pollen_key]:
            # Calculate average for the day (all 24 hours)
            daily_values = [val for val in pollen_levels[pollen_key] if val is not None]
            if daily_values:
                avg_for_pollen = sum(daily_values) / len(daily_values)
                total_pollen += avg_for_pollen
                pollen_count += 1
    
    avg_pollen = total_pollen / pollen_count if pollen_count > 0 else 0
    
    # Pollen level categories
    pollen_low = avg_pollen < 21
    pollen_medium = 21 <= avg_pollen < 51
    pollen_high = avg_pollen >= 51
    
    # Debug print
    print(f"DEBUG: sentiment={sentiment}, avg_pollen={avg_pollen}")
    print(f"DEBUG: will_rain={will_rain}, is_sunny={is_sunny}, is_windy={is_windy}")
    print(f"DEBUG: pollen_low={pollen_low}, pollen_medium={pollen_medium}, pollen_high={pollen_high}")
    
    # Generate recommendations
    if sentiment == 'POSITIVE':
        if pollen_high:
            tip = "You are feeling well today, but there are high level of pollen today in the air, take precautions."
        elif pollen_medium:
            tip = "You are feeling well today, but there are moderate levels of pollen today in the air, take precautions."
        else:  # low
            tip = "Low levels of pollen today and you are feeling well, there should be no issues today!"

    elif sentiment == 'NEGATIVE':
        if pollen_high:
            tip = "Feeling unwell and high pollen today. Avoid going outside and take medication if needed."
        elif pollen_medium:
            tip = "Feeling unwell and moderate pollen today. Avoid going outside and take care."
        else:  # low
            tip = "Feeling unwell but pollen is low. Should be safe outside and symptoms should get better."

    # Optional: fine-tune based on weather
    if is_windy and pollen_medium or pollen_high:
        tip += " Windy conditions may spread pollen, keep your windows closed."

    if will_rain and pollen_high or pollen_medium:
        tip += " Rain will help reduce pollen exposure."

    if is_sunny and pollen_high or pollen_medium:
        tip += " It will be sunny today, keep your windows closed."

    return tip

def analyze_sentiment(feeling_text):
    sentiment = pipeline("sentiment-analysis", model="distilbert/distilbert-base-uncased-finetuned-sst-2-english")
    result = sentiment(feeling_text)[0]
    return result['label'], result['score']

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
                
                # Get pollen data
                pollen_data = pollen_data_rec(lat, lon)
                pollen_levels = pollen_data.get('hourly', {}) if pollen_data else {}
                
                # Generate recommendation
                recommendation = make_recommendation(weather_data, pollen_levels, sentiment_label, selected_pollens)
                
                return JsonResponse({
                    'sentiment': sentiment_label,
                    'confidence': sentiment_score,
                    'selected_pollens': selected_pollens,
                    'recommendation': recommendation
                })
            except Exception as e:
                return JsonResponse({'error': f'Failed to analyze: {str(e)}'})
    
    return JsonResponse({'error': 'Invalid request'})
