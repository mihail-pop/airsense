// Simple translation system
const translations = {
    en: {
        'Weather & Pollen Tracker': 'Weather & Pollen Tracker',
        'Weather Forecast': 'Weather Forecast',
        'Pollen Forecast': 'Pollen Forecast',
        'Pollen Allergies': 'Pollen Allergies',
        'How do you feel today?': 'How do you feel today?',
        'Enter city name...': 'Enter city name...',
        'Search': 'Search',
        'Submit': 'Submit',
        'Describe how you feel today...': 'Describe how you feel today...',
        'Your History': 'Your History',
        'Feeling:': 'Feeling:',
        'Recommendations:': 'Recommendations:',
        'No interactions found. Start using the app to see your history here!': 'No interactions found. Start using the app to see your history here!',
        'Hourly Forecast': 'Hourly Forecast',
        'Hour': 'Hour',
        'Temperature': 'Temperature',
        'Humidity': 'Humidity',
        'Wind Speed': 'Wind Speed',
        'Condition': 'Condition',
        'Hourly Pollen Forecast': 'Hourly Pollen Forecast',
        'Alder': 'Alder',
        'Birch': 'Birch',
        'Grass': 'Grass',
        'Mugwort': 'Mugwort',
        'Olive': 'Olive',
        'Ragweed': 'Ragweed',
        'Alder Pollen': 'Alder Pollen',
        'Birch Pollen': 'Birch Pollen',
        'Grass Pollen': 'Grass Pollen',
        'Mugwort Pollen': 'Mugwort Pollen',
        'Olive Pollen': 'Olive Pollen',
        'Ragweed Pollen': 'Ragweed Pollen',
        'Today': 'Today',
        'Sun': 'Sun',
        'Mon': 'Mon',
        'Tue': 'Tue',
        'Wed': 'Wed',
        'Thu': 'Thu',
        'Fri': 'Fri',
        'Sat': 'Sat',
        'Clear sky': 'Clear sky',
        'Mainly clear': 'Mainly clear',
        'Partly cloudy': 'Partly cloudy',
        'Overcast': 'Overcast',
        'Fog': 'Fog',
        'Light drizzle': 'Light drizzle',
        'Moderate drizzle': 'Moderate drizzle',
        'Dense drizzle': 'Dense drizzle',
        'Slight rain': 'Slight rain',
        'Moderate rain': 'Moderate rain',
        'Heavy rain': 'Heavy rain',
        'Clean': 'Clean',
        'Low': 'Low',
        'Medium': 'Medium',
        'High': 'High'
    },
    ro: {
        'Weather & Pollen Tracker': 'Monitorizare Vreme & Polen',
        'Weather Forecast': 'Prognoza Meteo',
        'Pollen Forecast': 'Prognoza Polen',
        'Pollen Allergies': 'Alergii la Polen',
        'How do you feel today?': 'Cum te simti astazi?',
        'Enter city name...': 'Introdu numele orasului...',
        'Search': 'Cauta',
        'Submit': 'Trimite',
        'Describe how you feel today...': 'Descrie cum te simti astazi...',
        'Your History': 'Istoricul Tau',
        'Feeling:': 'Stare:',
        'Recommendations:': 'Recomandari:',
        'No interactions found. Start using the app to see your history here!': 'Nu s-au gasit interactiuni. Incepe sa folosesti aplicatia pentru a-ti vedea istoricul aici!',
        'Hourly Forecast': 'Prognoza pe Ore',
        'Hour': 'Ora',
        'Temperature': 'Temperatura',
        'Humidity': 'Umiditate',
        'Wind Speed': 'Viteza Vantului',
        'Condition': 'Conditii',
        'Hourly Pollen Forecast': 'Prognoza Polen pe Ore',
        'Alder': 'Arin',
        'Birch': 'Mesteacan',
        'Grass': 'Iarba',
        'Mugwort': 'Pelin',
        'Olive': 'Maslin',
        'Ragweed': 'Ambrozie',
        'Alder Pollen': 'Polen Arin',
        'Birch Pollen': 'Polen Mesteacan',
        'Grass Pollen': 'Polen Iarba',
        'Mugwort Pollen': 'Polen Pelin',
        'Olive Pollen': 'Polen Maslin',
        'Ragweed Pollen': 'Polen Ambrozie',
        'Today': 'Astazi',
        'Sun': 'Dum',
        'Mon': 'Lun',
        'Tue': 'Mar',
        'Wed': 'Mie',
        'Thu': 'Joi',
        'Fri': 'Vin',
        'Sat': 'Sam',
        'Clear sky': 'Cer senin',
        'Mainly clear': 'Predominant senin',
        'Partly cloudy': 'Partial innorat',
        'Overcast': 'Innorat',
        'Fog': 'Ceata',
        'Light drizzle': 'Burniță ușoară',
        'Moderate drizzle': 'Burniță moderată',
        'Dense drizzle': 'Burniță densă',
        'Slight rain': 'Ploaie ușoară',
        'Moderate rain': 'Ploaie moderată',
        'Heavy rain': 'Ploaie torențială',
        'Clean': 'Curat',
        'Low': 'Scazut',
        'Medium': 'Mediu',
        'High': 'Ridicat'
    }
};

let currentLang = localStorage.getItem('language') || 'en';

function translateText(text) {
    if (translations[currentLang] && translations[currentLang][text]) {
        return translations[currentLang][text];
    }
    return text;
}

function translatePage() {
    const elements = document.querySelectorAll('[data-translate]');
    elements.forEach(element => {
        const key = element.getAttribute('data-translate');
        if (translations[currentLang] && translations[currentLang][key]) {
            if (element.tagName === 'INPUT' && element.type === 'text') {
                element.placeholder = translations[currentLang][key];
            } else if (element.tagName === 'TEXTAREA') {
                element.placeholder = translations[currentLang][key];
            } else {
                element.textContent = translations[currentLang][key];
            }
        }
    });
    
    // Translate dynamic content
    translateDynamicContent();
    
    // Update language toggle button
    const langToggle = document.getElementById('langToggle');
    if (langToggle) {
        langToggle.textContent = currentLang === 'en' ? 'RO' : 'EN';
    }
}

function translateDynamicContent() {
    // Translate day names in day bar
    document.querySelectorAll('.day-item').forEach(item => {
        const text = item.textContent.trim();
        item.textContent = translateText(text);
    });
    
    // Translate weather conditions in tables
    document.querySelectorAll('#hourly-table td:last-child').forEach(cell => {
        const text = cell.textContent.trim();
        cell.textContent = translateText(text);
    });
    
    // Translate current weather condition
    const currentCondition = document.getElementById('current-condition');
    if (currentCondition) {
        const text = currentCondition.textContent.trim();
        if (text !== 'Loading...') {
            currentCondition.textContent = translateText(text);
        }
    }
    
    // Translate pollen levels
    document.querySelectorAll('#pollen-hourly-table td').forEach(cell => {
        const text = cell.textContent.trim();
        if (['Clean', 'Low', 'Medium', 'High'].includes(text)) {
            cell.textContent = translateText(text);
        }
    });
}

function switchLanguage() {
    currentLang = currentLang === 'en' ? 'ro' : 'en';
    localStorage.setItem('language', currentLang);
    translatePage();
}

// Make translateText globally available
window.translateText = translateText;

// Initialize translations when page loads
document.addEventListener('DOMContentLoaded', function() {
    translatePage();
    
    const langToggle = document.getElementById('langToggle');
    if (langToggle) {
        langToggle.addEventListener('click', switchLanguage);
    }
});