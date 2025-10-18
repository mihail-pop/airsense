const weatherCodes = {
    0: '<img src="/static/core/icons/clear_sky.png" class="weather-icon"> Clear sky',
    1: '<img src="/static/core/icons/mainly_clear.png" class="weather-icon"> Mainly clear',
    2: '<img src="/static/core/icons/partly_cloudy.png" class="weather-icon"> Partly cloudy',
    3: '<img src="/static/core/icons/overcast.png" class="weather-icon"> Overcast',
    45: '<img src="/static/core/icons/fog.png" class="weather-icon"> Fog',
    48: '<img src="/static/core/icons/fog.png" class="weather-icon"> Depositing rime fog',
    51: '<img src="/static/core/icons/drizzle.png" class="weather-icon"> Light drizzle',
    53: '<img src="/static/core/icons/drizzle.png" class="weather-icon"> Moderate drizzle',
    55: '<img src="/static/core/icons/drizzle.png" class="weather-icon"> Dense drizzle',
    61: '<img src="/static/core/icons/rain.png" class="weather-icon"> Slight rain',
    63: '<img src="/static/core/icons/rain.png" class="weather-icon"> Moderate rain',
    65: '<img src="/static/core/icons/rain.png" class="weather-icon"> Heavy rain',
    71: '<img src="/static/core/icons/snow.png" class="weather-icon"> Slight snow',
    73: '<img src="/static/core/icons/snow.png" class="weather-icon"> Moderate snow',
    75: '<img src="/static/core/icons/heavy_snow.png" class="weather-icon"> Heavy snow',
    95: '<img src="/static/core/icons/thunderstorm.png" class="weather-icon"> Thunderstorm'
};

function getWeatherDescription(code) {
    const baseDescription = weatherCodes[code] || '<img src="/static/core/icons/overcast.png" class="weather-icon"> Unknown';
    
    if (!window.translateText) return baseDescription;
    
    // Extract icon and text parts
    const iconMatch = baseDescription.match(/(<img[^>]*>)\s*(.+)/);
    if (iconMatch) {
        const icon = iconMatch[1];
        const text = iconMatch[2];
        const translatedText = window.translateText(text);
        return `${icon} ${translatedText}`;
    }
    
    return window.translateText(baseDescription);
}

function updateCurrentWeather() {
    if (!window.weatherData.current) return;
    
    document.getElementById('current-temp').textContent = formatTemperature(window.weatherData.current.temperature_2m);
    document.getElementById('current-condition').innerHTML = getWeatherDescription(window.weatherData.current.weather_code);
    document.getElementById('current-humidity').textContent = 'Humidity: ' + window.weatherData.current.relative_humidity_2m + '%';
}

function updateDailyWeather(dayIndex) {
    if (!window.weatherData.daily) return;
    
    const maxTemp = formatTemperature(window.weatherData.daily.temperature_2m_max[dayIndex]);
    const minTemp = formatTemperature(window.weatherData.daily.temperature_2m_min[dayIndex]);
    const condition = getWeatherDescription(window.weatherData.daily.weather_code[dayIndex]);
    
    document.getElementById('daily-temp').textContent = `Max: ${maxTemp} | Min: ${minTemp}`;
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
        const temp = formatTemperature(window.weatherData.hourly.temperature_2m[i]);
        const humidity = Math.round(window.weatherData.hourly.relative_humidity_2m[i]);
        const windSpeed = Math.round(window.weatherData.hourly.wind_speed_10m[i] || 0);
        const condition = getWeatherDescription(window.weatherData.hourly.weather_code[i]);
        
        const row = document.createElement('tr');
        if (dayIndex === 0 && hour === currentHour) {
            row.className = 'current-hour';
        }
        row.innerHTML = `
            <td>${hour}:00</td>
            <td>${temp}</td>
            <td>💧 ${humidity}%</td>
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
        const tempValue = isFahrenheit ? celsiusToFahrenheit(window.weatherData.hourly.temperature_2m[i]) : Math.round(window.weatherData.hourly.temperature_2m[i]);
        temperatures.push(tempValue);
        humidity.push(Math.round(window.weatherData.hourly.relative_humidity_2m[i]));
        windSpeed.push(Math.round(window.weatherData.hourly.wind_speed_10m[i] || 0));
    }
    
    if (document.getElementById('temperature-chart').checked) {
        datasets.push({
            label: `Temperature (°${isFahrenheit ? 'F' : 'C'})`,
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
                    beginAtZero: false,
                    title: {
                        display: true,
                        text: `Temperature (°${isFahrenheit ? 'F' : 'C'}) / Wind Speed (km/h)`
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    min: 0,
                    max: 100,
                    grid: {
                        drawOnChartArea: false
                    },
                    title: {
                        display: true,
                        text: 'Humidity (%)'
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
        dayItem.textContent = window.translateText ? window.translateText(dayName) : dayName;
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

let currentPollenData;
let weatherChart = null;
let pollenChart = null;
let isFahrenheit = false;

function celsiusToFahrenheit(celsius) {
    return Math.round((celsius * 9/5) + 32);
}

function formatTemperature(celsius) {
    if (isFahrenheit) {
        return celsiusToFahrenheit(celsius) + '°F';
    }
    return Math.round(celsius) + '°C';
}
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
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Pollen Concentration (grains/m³)'
                    }
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
    let text, bgColor, textColor;
    
    if (val == 0) {
        text = window.translateText ? window.translateText('Zero') : 'Zero';
        bgColor = '#4caf50'; textColor = 'white';
    } else if (val <= 10) {
        text = window.translateText ? window.translateText('Low') : 'Low';
        bgColor = '#8bc34a'; textColor = 'white';
    } else if (val < 50) {
        text = window.translateText ? window.translateText('Medium') : 'Medium';
        bgColor = '#ffeb3b'; textColor = 'black';
    } else {
        text = window.translateText ? window.translateText('High') : 'High';
        bgColor = '#f44336'; textColor = 'white';
    }
    
    return `<span style="background: ${bgColor}; color: ${textColor}; padding: 2px 6px; border-radius: 3px;">${text}</span>`;
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
                currentPollenData = window.pollenData;
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
        .then(([newWeatherData, newPollenData]) => {
            // Clear existing data
            document.getElementById('hourly-container').innerHTML = '';
            document.getElementById('dayBar').innerHTML = '';
            document.getElementById('pollen-hourly-container').innerHTML = '';
            document.getElementById('pollenDayBar').innerHTML = '';
            
            // Destroy existing charts
            if (weatherChart) {
                weatherChart.destroy();
                weatherChart = null;
            }
            if (pollenChart) {
                pollenChart.destroy();
                pollenChart = null;
            }
            
            // Update global data
            window.weatherData = newWeatherData;
            window.pollenData = newPollenData;
            currentPollenData = newPollenData;
            
            // Rebuild all components
            if (newWeatherData && newWeatherData.current) {
                updateCurrentWeather();
                updateDailyWeather(0);
                updateHourlyWeather(0);
                createDayBar();
            }
            
            if (newPollenData && newPollenData.hourly) {
                createPollenDayBar();
                updateHourlyPollen(0);
            }
        })
        .catch(error => {
            console.error('Error fetching data:', error);
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
    // Initialize global variables
    if (typeof weatherData !== 'undefined') {
        window.weatherData = weatherData;
    }
    if (typeof pollenData !== 'undefined') {
        window.pollenData = pollenData;
        currentPollenData = pollenData;
    }
    
    // Initialize weather components
    if (window.weatherData && window.weatherData.current) {
        try {
            updateCurrentWeather();
            updateDailyWeather(0);
            updateHourlyWeather(0);
            createDayBar();
            
            if (typeof currentLat !== 'undefined' && typeof currentLon !== 'undefined') {
                getCurrentCityName(currentLat, currentLon);
            }
        } catch (error) {
            console.error('Error initializing weather:', error);
        }
    } else {
        console.log('No weather data available');
    }
    
    // Initialize pollen components
    if (window.pollenData && window.pollenData.hourly) {
        try {
            createPollenDayBar();
            updateHourlyPollen(0);
        } catch (error) {
            console.error('Error initializing pollen:', error);
        }
    } else {
        console.log('No pollen data available');
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
    
    const todayDate = new Date();
    const todayString = todayDate.toISOString().split('T')[0];
    const maxDate = new Date(todayDate);
    maxDate.setDate(todayDate.getDate() + 4);
    const maxDateString = maxDate.toISOString().split('T')[0];
    const minDate = new Date(todayDate);
    minDate.setMonth(todayDate.getMonth() - 3);
    const minDateString = minDate.toISOString().split('T')[0];
    
    const pollenDateSelector = document.getElementById('pollenDateSelect');
    pollenDateSelector.value = todayString;
    pollenDateSelector.min = minDateString;
    pollenDateSelector.max = maxDateString;
    
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
                
                let alertHtml = '';
                if (data.alert_level) {
                    const tipsText = window.translateText ? window.translateText('Tips') : 'Tips';
                    const translatedTips = data.alert_level.tips.map(tip => {
                        let translatedTip = tip;
                        if (window.translateText) {
                            // Try to translate common phrases in tips
                            Object.keys(window.translateText.translations ? window.translateText.translations[window.translateText.currentLang] || {} : {}).forEach(key => {
                                if (translatedTip.includes(key)) {
                                    translatedTip = translatedTip.replace(key, window.translateText(key));
                                }
                            });
                        }
                        return translatedTip;
                    });
                    
                    alertHtml = `
                        <br><div style="margin: 15px 0; padding: 15px; background: #e8f4fd; border-left: 4px solid #007bff; border-radius: 5px;">
                            <strong>${data.alert_level.icon} ${window.translateText ? window.translateText(data.alert_level.title) : data.alert_level.title}</strong><br>
                            <strong>${tipsText}:</strong>
                            <ol style="margin: 10px 0; padding-left: 20px;">
                                ${translatedTips.map(tip => `<li>${tip}</li>`).join('')}
                            </ol>
                        </div>
                    `;
                }
                
                let combinedHtml = '';
                if (data.risk_analysis && Object.keys(data.risk_analysis).length > 0) {
                    const analysisText = window.translateText ? window.translateText('Analysis & Recommendations') : 'Analysis & Recommendations';
                    combinedHtml = `<br><strong>${analysisText}:</strong><br>`;
                    Object.keys(data.risk_analysis).forEach(pollen => {
                        const analysis = data.risk_analysis[pollen];
                        const recommendation = data.recommendations ? data.recommendations.find(rec => rec.toLowerCase().includes(pollen.toLowerCase())) : null;
                        
                        const pollenName = window.translateText ? window.translateText(pollen.charAt(0).toUpperCase() + pollen.slice(1)) : pollen.charAt(0).toUpperCase() + pollen.slice(1);
                        const recommendationsText = window.translateText ? window.translateText('Pollen Recommendations') : 'Pollen Recommendations';
                        const todayText = window.translateText ? window.translateText('Today') : 'Today';
                        const tomorrowText = window.translateText ? window.translateText('Tomorrow') : 'Tomorrow';
                        const riskText = window.translateText ? window.translateText('risk') : 'risk';
                        const avgText = window.translateText ? window.translateText('avg') : 'avg';
                        const peakText = window.translateText ? window.translateText('Peak at') : 'Peak at';
                        
                        let translatedRecommendation = recommendation;
                        if (recommendation && window.translateText) {
                            // Try to translate the recommendation text
                            translatedRecommendation = recommendation;
                            Object.keys(window.translateText.translations ? window.translateText.translations[window.translateText.currentLang] || {} : {}).forEach(key => {
                                if (translatedRecommendation.includes(key)) {
                                    translatedRecommendation = translatedRecommendation.replace(key, window.translateText(key));
                                }
                            });
                        }
                        
                        combinedHtml += `
                            <div style="margin: 10px 0; padding: 10px; background: #f9f9f9; border-radius: 5px;">
                                <strong>${pollenName} ${recommendationsText}:</strong><br>
                                ${translatedRecommendation ? `<p style="margin: 5px 0; font-style: italic;">${translatedRecommendation}</p>` : ''}
                                <strong>${todayText}:</strong> ${analysis.today.risk} ${riskText} (${avgText}: ${analysis.today.avg}), ${peakText} ${analysis.today.peak_time} (${analysis.today.peak_value})<br>
                                <strong>${tomorrowText}:</strong> ${analysis.tomorrow.risk} ${riskText} (${avgText}: ${analysis.tomorrow.avg}), ${peakText} ${analysis.tomorrow.peak_time} (${analysis.tomorrow.peak_value})
                            </div>
                        `;
                    });
                } else {
                    let recommendationsHtml = '';
                    if (data.recommendations && data.recommendations.length > 0) {
                        recommendationsHtml = data.recommendations.map(rec => {
                            let translatedRec = rec;
                            if (window.translateText) {
                                Object.keys(window.translateText.translations ? window.translateText.translations[window.translateText.currentLang] || {} : {}).forEach(key => {
                                    if (translatedRec.includes(key)) {
                                        translatedRec = translatedRec.replace(key, window.translateText(key));
                                    }
                                });
                            }
                            return `<p>${translatedRec}</p>`;
                        }).join('');
                    } else {
                        const noRecsText = window.translateText ? window.translateText('No recommendations available') : 'No recommendations available';
                        recommendationsHtml = `<p>${noRecsText}</p>`;
                    }
                    const recommendationsText = window.translateText ? window.translateText('Recommendations') : 'Recommendations';
                    combinedHtml = `<br><strong>${recommendationsText}:</strong><br>` + recommendationsHtml;
                }
                
                const sentimentText = window.translateText ? window.translateText('Sentiment') : 'Sentiment';
                const confidenceText = window.translateText ? window.translateText('confidence') : 'confidence';
                
                resultDiv.innerHTML = `
                    <div>
                        ${sentimentText}: ${data.sentiment} (${Math.round(data.confidence * 100)}% ${confidenceText})
                        ${alertHtml}
                        ${combinedHtml}
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

    
    // Temperature toggle functionality
    document.getElementById('tempToggle').addEventListener('click', function() {
        isFahrenheit = !isFahrenheit;
        this.textContent = isFahrenheit ? '°C' : '°F';
        
        // Update all temperature displays
        updateCurrentWeather();
        const activeDay = document.querySelector('.day-item.active');
        const dayIndex = activeDay ? parseInt(activeDay.dataset.dayIndex) : 0;
        updateDailyWeather(dayIndex);
        updateHourlyWeather(dayIndex);
    });
    

    
    // Prevent unchecking the last pollen option and update allergies
    document.querySelectorAll('input[name="pollens"]').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const checkedBoxes = document.querySelectorAll('input[name="pollens"]:checked');
            
            // If trying to uncheck and it's the last one, prevent it
            if (!this.checked && checkedBoxes.length === 0) {
                this.checked = true;
                return;
            }
            
            // Update allergies if user is authenticated
            if (window.userAuthenticated) {
                const allergies = Array.from(checkedBoxes).map(cb => cb.value);
                
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
            }
        });
    });
    

});