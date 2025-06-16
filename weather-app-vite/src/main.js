const apiKey = import.meta.env.VITE_API_KEY;

// DOM Elements
const cityInput = document.getElementById('cityInput');
const weatherResult = document.getElementById('weatherResult');
const weatherDetails = document.getElementById('weatherDetails');
const loadingElement = document.getElementById('loading');
const forecastContainer = document.getElementById('forecastContainer');
const forecastCards = document.getElementById('forecastCards');

// Weather icons mapping
const weatherIcons = {
  'clear': 'fa-sun',
  'clouds': 'fa-cloud',
  'rain': 'fa-cloud-rain',
  'snow': 'fa-snowflake',
  'thunderstorm': 'fa-bolt',
  'drizzle': 'fa-cloud-rain',
  'mist': 'fa-smog',
  'smoke': 'fa-smog',
  'haze': 'fa-smog',
  'fog': 'fa-smog'
};

// Get weather for current location
async function getCurrentLocationWeather() {
  if (navigator.geolocation) {
    showLoading();
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const url = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=metric`;
        
        try {
          const response = await fetch(url);
          const data = await response.json();
          displayWeather(data);
          getForecast(data.coord.lat, data.coord.lon);
        } catch (error) {
          showError('Error fetching your location weather');
        }
      },
      (error) => {
        showError('Geolocation permission denied. Please search for a city.');
      }
    );
  } else {
    showError('Geolocation is not supported by your browser.');
  }
}

// Get weather by city name
async function getWeather() {
  const city = cityInput.value.trim();
  
  if (!city) {
    showError('Please enter a city name');
    return;
  }
  
  showLoading();
  
  const currentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;
  try {
    const response = await fetch(currentWeatherUrl);
    const data = await response.json();
    
    if (data.cod === 200) {
      displayWeather(data);
      getForecast(data.coord.lat, data.coord.lon);
    } else {
      showError(data.message || 'City not found. Please try another location.');
    }
  } catch (error) {
    showError('Error fetching weather data. Please try again.');
  }
}

// Get 5-day forecast
async function getForecast(lat, lon) {
  const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
  
  try {
    const response = await fetch(forecastUrl);
    const data = await response.json();
    
    if (data.cod === "200") {
      displayForecast(data);
    }
  } catch (error) {
    console.error('Error fetching forecast:', error);
  }
}

// Display current weather
function displayWeather(data) {
  hideLoading();
  
  const weatherIcon = weatherIcons[data.weather[0].main.toLowerCase()] || 'fa-cloud';
  const temp = Math.round(data.main.temp);
  const feelsLike = Math.round(data.main.feels_like);
  const tempDiff = feelsLike - temp;
  
  let tempDiffText = '';
  if (tempDiff > 2) tempDiffText = `<div class="feels-warmer"><i class="fas fa-temperature-arrow-up"></i> Feels warmer</div>`;
  else if (tempDiff < -2) tempDiffText = `<div class="feels-cooler"><i class="fas fa-temperature-arrow-down"></i> Feels cooler</div>`;
  
  // Get current time and date
  const now = new Date();
  const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dateString = now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
  
  // Main weather display
  const result = `
    <div class="weather-header">
      <div class="weather-icon">
        <i class="fas ${weatherIcon}"></i>
      </div>
      <div class="time-info">
        <div class="current-time">${timeString}</div>
        <div class="current-date">${dateString}</div>
      </div>
    </div>
    
    <div class="weather-info">
      <h2>${data.name}, ${data.sys.country}</h2>
      <div class="current-temp">${temp}</div>
      <p class="weather-desc">${capitalizeFirstLetter(data.weather[0].description)}</p>
      ${tempDiffText}
    </div>
  `;
  
  weatherResult.innerHTML = result;
  
  // Weather details
  const details = `
    <div class="detail-item">
      <i class="fas fa-temperature-low"></i>
      <p>Feels Like</p>
      <div class="value">${feelsLike}°C</div>
    </div>
    <div class="detail-item">
      <i class="fas fa-tint"></i>
      <p>Humidity</p>
      <div class="value">${data.main.humidity}%</div>
    </div>
    <div class="detail-item">
      <i class="fas fa-wind"></i>
      <p>Wind Speed</p>
      <div class="value">${Math.round(data.wind.speed * 3.6)} km/h</div>
    </div>
    <div class="detail-item">
      <i class="fas fa-compress-alt"></i>
      <p>Pressure</p>
      <div class="value">${data.main.pressure} hPa</div>
    </div>
    <div class="detail-item">
      <i class="fas fa-eye"></i>
      <p>Visibility</p>
      <div class="value">${data.visibility / 1000} km</div>
    </div>
    <div class="detail-item">
      <i class="fas fa-cloud"></i>
      <p>Cloudiness</p>
      <div class="value">${data.clouds.all}%</div>
    </div>
  `;
  
  weatherDetails.innerHTML = details;
}

// Display 5-day forecast
function displayForecast(data) {
  // Group forecast by day
  const dailyForecast = {};
  data.list.forEach(item => {
    const date = new Date(item.dt * 1000);
    const dateStr = date.toLocaleDateString('en-US', { weekday: 'short' });
    
    if (!dailyForecast[dateStr]) {
      dailyForecast[dateStr] = {
        date: dateStr,
        temp: [],
        weather: item.weather[0],
        items: []
      };
    }
    
    dailyForecast[dateStr].temp.push(item.main.temp);
    dailyForecast[dateStr].items.push(item);
  });
  
  // Calculate average temp for each day and find midday forecast
  const forecastItems = Object.values(dailyForecast).slice(0, 5).map(day => {
    const avgTemp = Math.round(day.temp.reduce((sum, temp) => sum + temp, 0) / day.temp.length);
    
    // Find a midday forecast item for better representation
    const middayItem = day.items.find(item => {
      const hour = new Date(item.dt * 1000).getHours();
      return hour >= 11 && hour <= 14;
    }) || day.items[Math.floor(day.items.length / 2)];
    
    const weatherIcon = weatherIcons[middayItem.weather.main.toLowerCase()] || 'fa-cloud';
    
    return `
      <div class="forecast-card">
        <h3>${day.date}</h3>
        <div class="forecast-icon">
          <i class="fas ${weatherIcon}"></i>
        </div>
        <div class="forecast-temp">${avgTemp}°C</div>
        <p class="forecast-desc">${capitalizeFirstLetter(middayItem.weather.description)}</p>
      </div>
    `;
  });
  
  forecastCards.innerHTML = forecastItems.join('');
  forecastContainer.style.display = 'block';
}

// Helper function to capitalize first letter
function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function showLoading() {
  loadingElement.style.display = 'flex';
  weatherResult.style.display = 'none';
  weatherDetails.innerHTML = '';
  forecastContainer.style.display = 'none';
}

function hideLoading() {
  loadingElement.style.display = 'none';
  weatherResult.style.display = 'block';
}

function showError(message) {
  hideLoading();
  weatherResult.innerHTML = `<p class="error-message">${message}</p>`;
  weatherDetails.innerHTML = '';
  forecastContainer.style.display = 'none';
}

// Initialize app
function init() {
  // Add event listener for Enter key
  cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      getWeather();
    }
  });
  
  // Try to get current location weather on load
  getCurrentLocationWeather();
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);

// Make functions available globally
window.getWeather = getWeather;
window.getCurrentLocationWeather = getCurrentLocationWeather;