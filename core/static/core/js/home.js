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
    if (!window.weatherData.current) return;
    
    document.getElementById('current-temp').textContent = Math.round(window.weatherData.current.temperature_2m) + '°C';
    document.getElementById('current-condition').textContent = getWeatherDescription(window.weatherData.current.weather_code);
    document.getElementById('current-humidity').textContent = 'Humidity: ' + window.weatherData.current.relative_humidity_2m + '%';
}

function updateDailyWeather(dayIndex) {
    if (!window.weatherData.daily) return;
    
    const maxTemp = Math.round(window.weatherData.daily.temperature_2m_max[dayIndex]);
    const minTemp = Math.round(window.weatherData.daily.temperature_2m_min[dayIndex]);
    const condition = getWeatherDescription(window.weatherData.daily.weather_code[dayIndex]);
    
    document.getElementById('daily-temp').textContent = `Max: ${maxTemp}°C | Min: ${minTemp}°C`;
    document.getElementById('daily-condition').textContent = condition;
}

function updateHourlyWeather(dayIndex) {
    if (!window.weatherData.hourly) return;
    
    const container = document.getElementById('hourly-container');
    container.innerHTML = '';
    
    const currentHour = new Date().getHours();
    const startHour = dayIndex * 24;
    const endHour = startHour + 24;
    
    for (let i = startHour; i < endHour && i < window.weatherData.hourly.time.length; i++) {
        const time = new Date(window.weatherData.hourly.time[i]);
        const hour = time.getHours();
        const temp = Math.round(window.weatherData.hourly.temperature_2m[i]);
        const humidity = Math.round(window.weatherData.hourly.relative_humidity_2m[i]);
        const windSpeed = Math.round(window.weatherData.hourly.wind_speed_10m[i] || 0);
        const condition = getWeatherDescription(window.weatherData.hourly.weather_code[i]);
        
        const row = document.createElement('tr');
        if (dayIndex === 0 && hour === currentHour) {
            row.className = 'current-hour';
        }
        row.innerHTML = `
            <td>${hour}:00</td>
            <td>${temp}°C</td>
            <td>${humidity}%</td>
            <td>${windSpeed} km/h</td>
            <td>${condition}</td>
        `;
        container.appendChild(row);
    }
    
    updateWeatherChart(dayIndex);
}

function updateWeatherChart(dayIndex) {
    if (!window.weatherData.hourly) return;
    
    const startHour = dayIndex * 24;
    const endHour = startHour + 24;
    const labels = [];
    const temperatures = [];
    const humidity = [];
    const windSpeed = [];
    const datasets = [];
    
    for (let i = startHour; i < endHour && i < window.weatherData.hourly.time.length; i++) {
        const time = new Date(window.weatherData.hourly.time[i]);
        labels.push(time.getHours() + ':00');
        temperatures.push(Math.round(window.weatherData.hourly.temperature_2m[i]));
        humidity.push(Math.round(window.weatherData.hourly.relative_humidity_2m[i]));
        windSpeed.push(Math.round(window.weatherData.hourly.wind_speed_10m[i] || 0));
    }
    
    if (document.getElementById('temperature-chart').checked) {
        datasets.push({
            label: 'Temperature (°C)',
            data: temperatures,
            borderColor: '#007bff',
            backgroundColor: 'rgba(0, 123, 255, 0.1)',
            tension: 0.4,
            yAxisID: 'y'
        });
    }
    
    if (document.getElementById('humidity-chart').checked) {
        datasets.push({
            label: 'Humidity (%)',
            data: humidity,
            borderColor: '#28a745',
            backgroundColor: 'rgba(40, 167, 69, 0.1)',
            tension: 0.4,
            yAxisID: 'y1'
        });
    }
    
    if (document.getElementById('windspeed-chart').checked) {
        datasets.push({
            label: 'Wind Speed (km/h)',
            data: windSpeed,
            borderColor: '#ffc107',
            backgroundColor: 'rgba(255, 193, 7, 0.1)',
            tension: 0.4,
            yAxisID: 'y'
        });
    }
    
    if (weatherChart) {
        weatherChart.destroy();
    }
    
    const ctx = document.getElementById('weatherChart').getContext('2d');
    weatherChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    beginAtZero: false
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    min: 0,
                    max: 100,
                    grid: {
                        drawOnChartArea: false
                    }
                }
            }
        }
    });
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
        dayItem.className = 'day-item';
        if (i === 0) {
            dayItem.classList.add('active');
        }
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
let weatherChart = null;
let pollenChart = null;
//Optiune get Pollen Level pentru alt tip
function getPollenLevel(value, type) {
    const val = value || 0;
    if (type === 'grass') {
        if (val >= 200) return 'pollen-very-high';
        if (val >= 20) return 'pollen-high';
        if (val >= 5) return 'pollen-medium';
        return 'pollen-low';
    } else if (type === 'weed') {
        if (val >= 500) return 'pollen-very-high';
        if (val >= 50) return 'pollen-high';
        if (val >= 10) return 'pollen-medium';
        return 'pollen-low';
    } else { // tree
        if (val >= 1500) return 'pollen-very-high';
        if (val >= 90) return 'pollen-high';
        if (val >= 15) return 'pollen-medium';
        return 'pollen-low';
    }
}

function updateHourlyPollen(dayIndex, data = currentPollenData) {
    if (!data.hourly) return;
    
    const container = document.getElementById('pollen-hourly-container');
    container.innerHTML = '';
    
    const startHour = dayIndex * 24;
    const endHour = startHour + 24;
    const currentHour = new Date().getHours();
    
    // Check if we're viewing today's data
    const isToday = document.querySelector('#pollenDayBar .day-item.active')?.dataset.dayOffset === '0';
    
    for (let i = startHour; i < endHour && i < data.hourly.time.length; i++) {
        const time = new Date(data.hourly.time[i]);
        const hour = time.getHours();
        
        const alder = data.hourly.alder_pollen[i] || 0;
        const birch = data.hourly.birch_pollen[i] || 0;
        const grass = data.hourly.grass_pollen[i] || 0;
        const mugwort = data.hourly.mugwort_pollen[i] || 0;
        const olive = data.hourly.olive_pollen[i] || 0;
        const ragweed = data.hourly.ragweed_pollen[i] || 0;
        
        const row = document.createElement('tr');
        if (isToday && hour === currentHour) {
            row.className = 'current-hour';
        }
        row.innerHTML = `
            <td>${hour}:00</td>
            <td>${getPollenLevel(alder)}</td>
            <td>${getPollenLevel(birch)}</td>
            <td>${getPollenLevel(grass)}</td>
            <td>${getPollenLevel(mugwort)}</td>
            <td>${getPollenLevel(olive)}</td>
            <td>${getPollenLevel(ragweed)}</td>
        `;
        container.appendChild(row);
    }
    
    updatePollenChart(dayIndex, data);
}

function updatePollenChart(dayIndex, data = currentPollenData) {
    if (!data.hourly) return;
    
    const startHour = dayIndex * 24;
    const endHour = startHour + 24;
    const labels = [];
    const datasets = [];
    
    const pollenTypes = [
        { name: 'alder', label: 'Alder', color: '#ff6384' },
        { name: 'birch', label: 'Birch', color: '#36a2eb' },
        { name: 'grass', label: 'Grass', color: '#4bc0c0' },
        { name: 'mugwort', label: 'Mugwort', color: '#9966ff' },
        { name: 'olive', label: 'Olive', color: '#ff9f40' },
        { name: 'ragweed', label: 'Ragweed', color: '#ff6384' }
    ];
    
    for (let i = startHour; i < endHour && i < data.hourly.time.length; i++) {
        const time = new Date(data.hourly.time[i]);
        labels.push(time.getHours() + ':00');
    }
    
    pollenTypes.forEach(pollen => {
        const checkbox = document.getElementById(`${pollen.name}-chart`);
        if (checkbox && checkbox.checked) {
            const pollenData = [];
            for (let i = startHour; i < endHour && i < data.hourly.time.length; i++) {
                pollenData.push(data.hourly[`${pollen.name}_pollen`][i] || 0);
            }
            datasets.push({
                label: pollen.label,
                data: pollenData,
                borderColor: pollen.color,
                backgroundColor: pollen.color + '20',
                tension: 0.4
            });
        }
    });
    
    if (pollenChart) {
        pollenChart.destroy();
    }
    
    const ctx = document.getElementById('pollenChart').getContext('2d');
    pollenChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function fetchPollenForDate(date, dayIndex = 0) {
    const url = `/api/pollen/?date=${date}`;
    
    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (!data.error) {
                currentPollenData = data;
                updateHourlyPollen(dayIndex);
            }
        })
        .catch(error => console.error('Error fetching pollen data:', error));
}

function getPollenLevel(value) {
    const val = value || 0;
    if (val == 0) return 'Clean';
    if (val <= 10 && val >=0) return 'Low';
    if (val < 50) return 'Medium';
    return 'High';
}

function createPollenDayBar() {
    const pollenDayBar = document.getElementById('pollenDayBar');
    const today = new Date();
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    for (let i = -4; i <= 4; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        const dayName = i === 0 ? 'Today' : dayNames[date.getDay()];
        
        const dayItem = document.createElement('div');
        dayItem.className = 'day-item' + (i === 0 ? ' active' : '');
        dayItem.textContent = dayName;
        dayItem.dataset.dayOffset = i;
        
        dayItem.addEventListener('click', function() {
            document.querySelectorAll('#pollenDayBar .day-item').forEach(item => item.classList.remove('active'));
            this.classList.add('active');
            const dayOffset = parseInt(this.dataset.dayOffset);
            
            const targetDate = new Date(today);
            targetDate.setDate(today.getDate() + dayOffset);
            const dateString = targetDate.toISOString().split('T')[0];
            
            if (dayOffset === 0) {
                currentPollenData = pollenData;
                updateHourlyPollen(0);
            } else {
                fetchPollenForDate(dateString, 0);
            }
        });
        
        pollenDayBar.appendChild(dayItem);
    }
}

function getCurrentCityName(lat, lon) {
    fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`)
        .then(response => response.json())
        .then(data => {
            const cityName = data.city || data.locality || 'Unknown Location';
            const country = data.countryName || '';
            document.getElementById('currentCityName').textContent = `${cityName}${country ? ', ' + country : ''}`;
        })
        .catch(() => {
            document.getElementById('currentCityName').textContent = 'Current Location';
        });
}

function showCitySuggestions(query) {
    if (query.length < 2) {
        document.getElementById('cityDropdown').style.display = 'none';
        return;
    }
    
    fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json`)
        .then(response => response.json())
        .then(data => {
            const dropdown = document.getElementById('cityDropdown');
            dropdown.innerHTML = '';
            
            if (data.results && data.results.length > 0) {
                data.results.forEach(city => {
                    const option = document.createElement('div');
                    option.className = 'city-option';
                    option.textContent = `${city.name}, ${city.country}`;
                    option.addEventListener('click', () => selectCity(city));
                    dropdown.appendChild(option);
                });
                dropdown.style.display = 'block';
            } else {
                dropdown.style.display = 'none';
            }
        })
        .catch(() => {
            document.getElementById('cityDropdown').style.display = 'none';
        });
}

function selectCity(city) {
    document.getElementById('cityInput').value = `${city.name}, ${city.country}`;
    document.getElementById('cityDropdown').style.display = 'none';
    
    document.getElementById('selectedCity').textContent = `${city.name}, ${city.country}`;
    document.getElementById('currentCityName').textContent = `${city.name}, ${city.country}`;
    
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${city.latitude}&longitude=${city.longitude}&current=temperature_2m,relative_humidity_2m,weather_code&hourly=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=auto&forecast_days=7`;
    const pollenUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${city.latitude}&longitude=${city.longitude}&hourly=alder_pollen,birch_pollen,grass_pollen,mugwort_pollen,olive_pollen,ragweed_pollen&forecast_days=7`;
    
    Promise.all([fetch(weatherUrl), fetch(pollenUrl)])
        .then(responses => Promise.all(responses.map(r => r.json())))
        .then(([weatherData, pollenData]) => {
            document.getElementById('hourly-container').innerHTML = '';
            document.getElementById('dayBar').innerHTML = '';
            document.getElementById('pollen-hourly-container').innerHTML = '';
            document.getElementById('pollenDayBar').innerHTML = '';
            
            window.weatherData = weatherData;
            window.pollenData = pollenData;
            currentPollenData = pollenData;
            
            updateCurrentWeather();
            updateDailyWeather(0);
            updateHourlyWeather(0);
            createDayBar();
            createPollenDayBar();
            updateHourlyPollen(0);
        })
        .catch(error => {
            alert('Error fetching weather or pollen data');
        });
}

function searchCityWeather(cityName) {
    fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1&language=en&format=json`)
        .then(response => response.json())
        .then(data => {
            if (data.results && data.results.length > 0) {
                selectCity(data.results[0]);
            } else {
                alert('City not found');
            }
        })
        .catch(error => {
            alert('Error searching for city');
        });
}

document.addEventListener('DOMContentLoaded', function() {
    window.weatherData = weatherData;
    window.pollenData = pollenData;
    currentPollenData = pollenData;
    
    if (window.weatherData) {
        updateCurrentWeather();
        updateDailyWeather(0);
        updateHourlyWeather(0);
        getCurrentCityName(currentLat, currentLon);
    }
    
    createDayBar();
    createPollenDayBar();
    if (window.pollenData) {
        updateHourlyPollen(0);
    }
    
    document.getElementById('searchCity').addEventListener('click', function() {
        const cityName = document.getElementById('cityInput').value.trim();
        if (cityName) {
            searchCityWeather(cityName);
        }
    });
    
    document.getElementById('cityInput').addEventListener('input', function() {
        showCitySuggestions(this.value.trim());
    });
    
    document.getElementById('cityInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            const cityName = this.value.trim();
            if (cityName) {
                searchCityWeather(cityName);
            }
        }
    });
    
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.city-input-container')) {
            document.getElementById('cityDropdown').style.display = 'none';
        }
    });
    
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    const maxDate = new Date(today);
    maxDate.setDate(today.getDate() + 4);
    const maxDateString = maxDate.toISOString().split('T')[0];
    const minDate = new Date(today);
    minDate.setMonth(today.getMonth() - 3);
    const minDateString = minDate.toISOString().split('T')[0];
    
    const pollenDateSelect = document.getElementById('pollenDateSelect');
    pollenDateSelect.value = todayString;
    pollenDateSelect.min = minDateString;
    pollenDateSelect.max = maxDateString;
    
    pollenDateSelect.addEventListener('change', function() {
        const selectedDate = this.value;
        if (selectedDate) {
            fetchPollenForDate(selectedDate, 0);
        }
    });
    
    // Add event listeners for weather chart checkboxes
    const weatherCheckboxes = ['temperature-chart', 'humidity-chart', 'windspeed-chart'];
    weatherCheckboxes.forEach(id => {
        document.getElementById(id).addEventListener('change', function() {
            const activeDay = document.querySelector('#dayBar .day-item.active');
            const dayIndex = activeDay ? parseInt(activeDay.dataset.dayIndex) : 0;
            updateWeatherChart(dayIndex);
        });
    });
    
    // Add event listeners for pollen chart checkboxes
    const pollenCheckboxes = ['alder-chart', 'birch-chart', 'grass-chart', 'mugwort-chart', 'olive-chart', 'ragweed-chart'];
    pollenCheckboxes.forEach(id => {
        document.getElementById(id).addEventListener('change', function() {
            const activeDay = document.querySelector('#pollenDayBar .day-item.active');
            const dayOffset = activeDay ? parseInt(activeDay.dataset.dayOffset) : 0;
            updatePollenChart(0, currentPollenData);
        });
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
    const today = new Date().toISOString().split('T')[0];
    const pollenDateSelect = document.getElementById('pollenDateSelect');
    
    if (pollenDateSelect) {
        pollenDateSelect.value = today;
        
        pollenDateSelect.addEventListener('change', function() {
            const selectedDate = this.value;
            if (selectedDate) {
                fetchPollenForDate(selectedDate, 0);
            }
        });
    }
    
    // Update allergies when checkboxes change (only if user is authenticated)
    if (window.userAuthenticated) {
        document.querySelectorAll('input[name="pollens"]').forEach(checkbox => {
            checkbox.addEventListener('change', function() {
                const allergies = Array.from(document.querySelectorAll('input[name="pollens"]:checked')).map(cb => cb.value);
                
                const formData = new FormData();
                allergies.forEach(allergy => formData.append('allergies', allergy));
                
                fetch('/api/allergies/', {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]')?.value || ''
                    }
                })
                .catch(error => console.error('Error updating allergies:', error));
            });
        });
    }
    
    const feelingForm = document.getElementById('feelingForm');
    if (feelingForm) {
        feelingForm.addEventListener('submit', function(e) {
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
    }
});