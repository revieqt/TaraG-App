// Weather code to image mapping
export const getWeatherImage = (weatherCode: number) => {
  // Clear sky (0-3)
  if (weatherCode >= 0 && weatherCode <= 3) {
    // Check if it's day or night based on current time
    const currentHour = new Date().getHours();
    const isDay = currentHour >= 6 && currentHour < 18; // Day is 6 AM to 6 PM
    
    if (isDay) {
      return require('@/assets/images/weather-sunny-min.png');
    } else {
      return require('@/assets/images/weather-night.png');
    }
  }
  
  // Rain and drizzle (51-82)
  if (weatherCode >= 51 && weatherCode <= 82) {
    return require('@/assets/images/weather-rainy-min.png');
  }
  
  // Snow (71-77, 85-86)
  if ((weatherCode >= 71 && weatherCode <= 77) || (weatherCode >= 85 && weatherCode <= 86)) {
    return require('@/assets/images/weather-rainy-min.png'); // Using rainy image for snow
  }
  
  // Thunderstorm (95-99)
  if (weatherCode >= 95 && weatherCode <= 99) {
    return require('@/assets/images/weather-rainy-min.png');
  }
  
  // Fog (45, 48)
  if (weatherCode === 45 || weatherCode === 48) {
    return require('@/assets/images/weather-cloudy-min.png');
  }
  
  // Default to cloudy for unknown codes
  return require('@/assets/images/weather-cloudy-min.png');
};

// Weather code to description mapping
export const getWeatherDescription = (weatherCode: number) => {
  const weatherDescriptions: Record<number, string> = {
    0: 'Clear sky',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Clouds',
    45: 'Fog',
    48: 'Depositing rime fog',
    51: 'Light drizzle',
    53: 'Moderate drizzle',
    55: 'Dense drizzle',
    56: 'Light freezing drizzle',
    57: 'Dense freezing drizzle',
    61: 'Slight rain',
    63: 'Moderate rain',
    65: 'Heavy rain',
    66: 'Light freezing rain',
    67: 'Heavy freezing rain',
    71: 'Slight snow fall',
    73: 'Moderate snow fall',
    75: 'Heavy snow fall',
    77: 'Snow grains',
    80: 'Slight rain showers',
    81: 'Moderate rain showers',
    82: 'Violent rain showers',
    85: 'Slight snow showers',
    86: 'Heavy snow showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with slight hail',
    99: 'Thunderstorm with heavy hail',
  };
  
  return weatherDescriptions[weatherCode] || 'Unknown';
};
