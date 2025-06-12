const apiKey = import.meta.env.VITE_API_KEY;

async function getWeather() {
  const city = document.getElementById('cityInput').value.trim();
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    console.log(data);

    if (data.cod === 200) {
      const result = `
        <h2>${data.name}, ${data.sys.country}</h2>
        <p>Temperature: ${data.main.temp} °C</p>
        <p>Weather: ${data.weather[0].main}</p>
      `;
      document.getElementById('weatherResult').innerHTML = result;
    } else {
      document.getElementById('weatherResult').innerText = 'City not found!';
    }
  } catch (error) {
    console.error('Fetch Error:', error);
    document.getElementById('weatherResult').innerText = 'Error fetching weather data.';
  }
}

// ✅ This line is needed so your HTML button can access the function
window.getWeather = getWeather;
