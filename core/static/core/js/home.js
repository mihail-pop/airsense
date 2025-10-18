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
    
    if (dayIndex === 0) {
        fetch('/api/weather/')
            .then(response => response.json())
            .then(data => {
                const currentTime = data.current ? data.current.time : new Date().toISOString();
                const currentHour = new Date(currentTime).getHours();
                displayHours(0, 24, currentHour);
            })
            .catch(() => {
                const currentHour = new Date().getHours();
                displayHours(0, 24, currentHour);
            });
    } else {
        displayHours(dayIndex * 24, dayIndex * 24 + 24);
    }
    
    function displayHours(start, end, highlightHour = -1) {
        for (let i = start; i < end && i < weatherData.hourly.time.length; i++) {
            const time = new Date(weatherData.hourly.time[i]);
            const hour = time.getHours();
            const temp = Math.round(weatherData.hourly.temperature_2m[i]);
            const condition = getWeatherDescription(weatherData.hourly.weather_code[i]);
            
            const row = document.createElement('tr');
            if (hour === highlightHour) {
                row.className = 'current-hour';
            }
            row.innerHTML = `
                <td>${hour}:00</td>
                <td>${temp}°C</td>
                <td>${condition}</td>
            `;
            container.appendChild(row);
        }
    }
}

function createDayBar() {
    const dayBar = document.getElementById('dayBar');
    const today = new Date();
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        const dayName = i === 0 ? 'Today' : dayNames[date.getDay()];
        
        const dayItem = document.createElement('div');
        dayItem.className = 'day-item' + (i === 0 ? ' active' : '');
        dayItem.textContent = dayName;
        dayItem.dataset.dayIndex = i;
        
        dayItem.addEventListener('click', function() {
            document.querySelectorAll('.day-item').forEach(item => item.classList.remove('active'));
            this.classList.add('active');
            const dayIndex = parseInt(this.dataset.dayIndex);
            updateDailyWeather(dayIndex);
            updateHourlyWeather(dayIndex);
        });
        
        dayBar.appendChild(dayItem);
    }
}

let currentPollenData = pollenData;

function updateHourlyPollen(dayIndex, data = currentPollenData) {
    if (!data.hourly) return;
    
    const container = document.getElementById('pollen-hourly-container');
    container.innerHTML = '';
    
    const startHour = dayIndex * 24;
    const endHour = startHour + 24;
    
    for (let i = startHour; i < endHour && i < data.hourly.time.length; i++) {
        const time = new Date(data.hourly.time[i]);
        const hour = time.getHours();
        
        const hourItem = document.createElement('div');
        hourItem.className = 'pollen-hour-item';
        hourItem.innerHTML = `
            <div class="pollen-hour-time">${hour}:00</div>
            <div class="pollen-levels-small">
                <div>A: ${data.hourly.alder_pollen[i] || 0}</div>
                <div>B: ${data.hourly.birch_pollen[i] || 0}</div>
                <div>G: ${data.hourly.grass_pollen[i] || 0}</div>
                <div>M: ${data.hourly.mugwort_pollen[i] || 0}</div>
                <div>O: ${data.hourly.olive_pollen[i] || 0}</div>
                <div>R: ${data.hourly.ragweed_pollen[i] || 0}</div>
            </div>
        `;
        container.appendChild(hourItem);
    }
}

function fetchPollenForDate(date) {
    const url = `/api/pollen/?date=${date}`;
    
    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (!data.error) {
                currentPollenData = data;
                updateHourlyPollen(0);
                document.getElementById('pollenDaySelect').value = '0';
            }
        })
        .catch(error => console.error('Error fetching pollen data:', error));
}

function updateDateFromDaySelector(dayIndex) {
    const today = new Date();
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + dayIndex);
    
    const dateString = targetDate.toISOString().split('T')[0];
    document.getElementById('pollenDateSelect').value = dateString;
    
    if (dayIndex === 0) {
        currentPollenData = pollenData;
        updateHourlyPollen(0);
    } else {
        fetchPollenForDate(dateString);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    if (weatherData) {
        updateCurrentWeather();
        updateDailyWeather(0);
        updateHourlyWeather(0);
    }
    
    createDayBar();
    if (pollenData) {
        updateHourlyPollen(0);
    }
    

    
    document.getElementById('pollenDaySelect').addEventListener('change', function() {
        const dayIndex = parseInt(this.value);
        updateDateFromDaySelector(dayIndex);
    });
    
    document.getElementById('pollenDateSelect').addEventListener('change', function() {
        const selectedDate = this.value;
        if (selectedDate) {
            fetchPollenForDate(selectedDate);
            document.getElementById('pollenDaySelect').value = '0';
        }
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