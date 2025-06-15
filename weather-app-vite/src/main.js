const apiKey = import.meta.env.VITE_API_KEY;

// DOM Elements
const cityInput = document.getElementById('cityInput');
const weatherResult = document.getElementById('weatherResult');
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
      showError('City not found. Please try another location.');
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
  const feelsLikeDiff = data.main.feels_like - data.main.temp;
  const feelsLikeText = feelsLikeDiff > 2 ? ' (Much warmer)' : 
                        feelsLikeDiff < -2 ? ' (Much cooler)' : 
                        feelsLikeDiff > 0 ? ' (Warmer)' : 
                        feelsLikeDiff < 0 ? ' (Cooler)' : '';
  
  const result = `
    <div class="weather-icon">
      <i class="fas ${weatherIcon}"></i>
    </div>
    <h2>${data.name}, ${data.sys.country}</h2>
    <div class="temp-display">${Math.round(data.main.temp)}°C</div>
    <p>${data.weather[0].main} - ${data.weather[0].description}</p>
    
    <div class="details">
      <div class="detail-item">
        <i class="fas fa-temperature-low"></i>
        <p>Feels Like: ${Math.round(data.main.feels_like)}°C${feelsLikeText}</p>
      </div>
      <div class="detail-item">
        <i class="fas fa-tint"></i>
        <p>Humidity: ${data.main.humidity}%</p>
      </div>
      <div class="detail-item">
        <i class="fas fa-wind"></i>
        <p>Wind: ${Math.round(data.wind.speed * 3.6)} km/h</p>
      </div>
      <div class="detail-item">
        <i class="fas fa-compress-alt"></i>
        <p>Pressure: ${data.main.pressure} hPa</p>
      </div>
    </div>
  `;
  
  weatherResult.innerHTML = result;
}

// Display 5-day forecast
function displayForecast(data) {
  // Group forecast by day
  const dailyForecast = {};
  data.list.forEach(item => {
    const date = new Date(item.dt * 1000).toLocaleDateString('en-US', { weekday: 'short' });
    if (!dailyForecast[date]) {
      dailyForecast[date] = {
        temp: [],
        weather: item.weather[0],
        date: date
      };
    }
    dailyForecast[date].temp.push(item.main.temp);
  });
  
  // Calculate average temp for each day
  const forecastItems = Object.values(dailyForecast).slice(0, 5).map(day => {
    const avgTemp = day.temp.reduce((sum, temp) => sum + temp, 0) / day.temp.length;
    const weatherIcon = weatherIcons[day.weather.main.toLowerCase()] || 'fa-cloud';
    
    return `
      <div class="forecast-card">
        <h3>${day.date}</h3>
        <div class="forecast-icon">
          <i class="fas ${weatherIcon}"></i>
        </div>
        <p>${Math.round(avgTemp)}°C</p>
        <p>${day.weather.main}</p>
      </div>
    `;
  });
  
  forecastCards.innerHTML = forecastItems.join('');
  forecastContainer.style.display = 'block';
}

function showLoading() {
  loadingElement.style.display = 'block';
  weatherResult.style.display = 'none';
  forecastContainer.style.display = 'none';
}

function hideLoading() {
  loadingElement.style.display = 'none';
  weatherResult.style.display = 'block';
}

function showError(message) {
  hideLoading();
  weatherResult.innerHTML = `<p class="error">${message}</p>`;
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