const weatherCodes = {
    0: 'Clear sky',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Fog',
    48: 'Depositing rime fog',
    51: 'Light drizzle',
    53: 'Moderate drizzle',
    55: 'Dense drizzle',
    61: 'Slight rain',
    63: 'Moderate rain',
    65: 'Heavy rain',
    71: 'Slight snow',
    73: 'Moderate snow',
    75: 'Heavy snow',
    95: 'Thunderstorm'
};

function getWeatherDescription(code) {
    return weatherCodes[code] || 'Unknown';
}

function updateCurrentWeather() {
    if (!weatherData.current) return;
    
    document.getElementById('current-temp').textContent = Math.round(weatherData.current.temperature_2m) + '°C';
    document.getElementById('current-condition').textContent = getWeatherDescription(weatherData.current.weather_code);
    document.getElementById('current-humidity').textContent = 'Humidity: ' + weatherData.current.relative_humidity_2m + '%';
}

function updateDailyWeather(dayIndex) {
    if (!weatherData.daily) return;
    
    const maxTemp = Math.round(weatherData.daily.temperature_2m_max[dayIndex]);
    const minTemp = Math.round(weatherData.daily.temperature_2m_min[dayIndex]);
    const condition = getWeatherDescription(weatherData.daily.weather_code[dayIndex]);
    
    document.getElementById('daily-temp').textContent = `Max: ${maxTemp}°C | Min: ${minTemp}°C`;
    document.getElementById('daily-condition').textContent = condition;
}

function updateHourlyWeather(dayIndex) {
    if (!weatherData.hourly) return;
    
    const container = document.getElementById('hourly-container');
    container.innerHTML = '';
    
    const startHour = dayIndex * 24;
    const endHour = startHour + 24;
    
    for (let i = startHour; i < endHour && i < weatherData.hourly.time.length; i++) {
        const time = new Date(weatherData.hourly.time[i]);
        const hour = time.getHours();
        const temp = Math.round(weatherData.hourly.temperature_2m[i]);
        const condition = getWeatherDescription(weatherData.hourly.weather_code[i]);
        
        const hourItem = document.createElement('div');
        hourItem.className = 'hour-item';
        hourItem.innerHTML = `
            <div class="hour-time">${hour}:00</div>
            <div class="hour-temp">${temp}°C</div>
            <div class="hour-condition">${condition}</div>
        `;
        container.appendChild(hourItem);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    if (weatherData) {
        updateCurrentWeather();
        updateDailyWeather(0);
        updateHourlyWeather(0);
    }
    
    document.getElementById('daySelect').addEventListener('change', function() {
        const dayIndex = parseInt(this.value);
        updateDailyWeather(dayIndex);
        updateHourlyWeather(dayIndex);
    });
    
    document.getElementById('feelingForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const feelingText = document.getElementById('feelingText').value;
        const selectedPollens = Array.from(document.querySelectorAll('input[name="pollens"]:checked')).map(cb => cb.value);
        
        if (!feelingText.trim()) {
            alert('Please describe how you feel today.');
            return;
        }
        
        const formData = new FormData();
        formData.append('feeling', feelingText);
        selectedPollens.forEach(pollen => formData.append('pollens', pollen));
        
        fetch('/api/sentiment/', {
            method: 'POST',
            body: formData,
            headers: {
                'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]')?.value || ''
            }
        })
        .then(response => response.json())
        .then(data => {
            const resultDiv = document.getElementById('sentimentResult');
            if (data.sentiment) {
                const sentimentClass = data.sentiment.toLowerCase() === 'positive' ? 'sentiment-positive' : 
                                     data.sentiment.toLowerCase() === 'negative' ? 'sentiment-negative' : 'sentiment-neutral';
                
                resultDiv.innerHTML = `
                    <div class="${sentimentClass}">
                        Sentiment: ${data.sentiment} (${Math.round(data.confidence * 100)}% confidence)
                        <br>Selected allergies: ${data.selected_pollens.join(', ') || 'None'}
                        <br><br><strong>Recommendation:</strong><br>${data.recommendation}
                    </div>
                `;
            } else {
                resultDiv.innerHTML = '<div class="sentiment-neutral">Error analyzing sentiment</div>';
            }
        })
        .catch(error => {
            document.getElementById('sentimentResult').innerHTML = '<div class="sentiment-neutral">Error analyzing sentiment</div>';
        });
    });
});