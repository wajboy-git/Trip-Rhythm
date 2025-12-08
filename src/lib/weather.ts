import { OPEN_METEO_BASE_URL, WEATHER_CACHE_DURATION_MS, WEATHER_THRESHOLDS, WEATHER_CODES } from './constants';
import type { WeatherData, WeatherCategory, WeatherSuggestion, DayWeather } from '../types';

interface CachedWeatherData {
  data: WeatherData[];
  timestamp: number;
}

const weatherCache = new Map<string, CachedWeatherData>();

function getCacheKey(latitude: number, longitude: number, startDate: string, days: number): string {
  return `${latitude},${longitude},${startDate},${days}`;
}

export async function fetchDailyWeather(
  latitude: number,
  longitude: number,
  startDate: string,
  days: number
): Promise<WeatherData[] | null> {
  const cacheKey = getCacheKey(latitude, longitude, startDate, days);
  const cached = weatherCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < WEATHER_CACHE_DURATION_MS) {
    return cached.data;
  }

  try {
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + days - 1);
    const endDateStr = endDate.toISOString().split('T')[0];

    const url = `${OPEN_METEO_BASE_URL}/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code,wind_speed_10m_max&start_date=${startDate}&end_date=${endDateStr}&timezone=auto`;

    const response = await fetch(url);

    if (!response.ok) {
      console.error('Open-Meteo API error:', response.status, response.statusText);
      return null;
    }

    const data = await response.json();

    if (!data.daily) {
      console.error('Invalid response from Open-Meteo API');
      return null;
    }

    const weatherData: WeatherData[] = data.daily.time.map((date: string, index: number) => ({
      date,
      temperature_min: data.daily.temperature_2m_min[index],
      temperature_max: data.daily.temperature_2m_max[index],
      precipitation_probability: data.daily.precipitation_probability_max[index] || 0,
      weather_code: data.daily.weather_code[index],
      wind_speed: data.daily.wind_speed_10m_max[index],
    }));

    weatherCache.set(cacheKey, {
      data: weatherData,
      timestamp: Date.now(),
    });

    return weatherData;
  } catch (error) {
    console.error('Error fetching weather data:', error);
    return null;
  }
}

export function categorizeDayWeather(weather: WeatherData): WeatherCategory {
  const { precipitation_probability, temperature_max, weather_code } = weather;

  const isRainy = precipitation_probability >= WEATHER_THRESHOLDS.PRECIPITATION_MODERATE;
  const isHeavyRain = precipitation_probability >= WEATHER_THRESHOLDS.PRECIPITATION_HEAVY;
  const isSnow = WEATHER_CODES.SNOW.includes(weather_code);
  const isThunderstorm = WEATHER_CODES.THUNDERSTORM.includes(weather_code);
  const isCold = temperature_max < WEATHER_THRESHOLDS.TEMP_COLD;
  const isVeryHot = temperature_max > WEATHER_THRESHOLDS.TEMP_HOT;

  if (isHeavyRain || isSnow || isThunderstorm) {
    return 'indoor-focused';
  }

  if (isRainy || isCold || isVeryHot) {
    return 'mixed';
  }

  return 'good-outdoor';
}

export function getWeatherIcon(weather_code: number): string {
  if (WEATHER_CODES.CLEAR.includes(weather_code)) return 'sun';
  if (WEATHER_CODES.PARTLY_CLOUDY.includes(weather_code)) return 'cloud-sun';
  if (WEATHER_CODES.CLOUDY.includes(weather_code)) return 'cloud';
  if (WEATHER_CODES.FOGGY.includes(weather_code)) return 'cloud-fog';
  if (WEATHER_CODES.DRIZZLE.includes(weather_code)) return 'cloud-drizzle';
  if (WEATHER_CODES.RAIN.includes(weather_code)) return 'cloud-rain';
  if (WEATHER_CODES.SNOW.includes(weather_code)) return 'snowflake';
  if (WEATHER_CODES.THUNDERSTORM.includes(weather_code)) return 'cloud-lightning';
  return 'cloud';
}

export function suggestAccessoriesForWeather(weather: WeatherData): string[] {
  const accessories: string[] = [];
  const { precipitation_probability, temperature_min, temperature_max, weather_code } = weather;

  if (precipitation_probability >= WEATHER_THRESHOLDS.PRECIPITATION_LIGHT) {
    accessories.push('umbrella');
  }

  if (precipitation_probability >= WEATHER_THRESHOLDS.PRECIPITATION_MODERATE) {
    accessories.push('waterproof jacket');
  }

  if (WEATHER_CODES.SNOW.includes(weather_code)) {
    accessories.push('warm coat', 'gloves', 'winter boots');
  }

  if (temperature_min < WEATHER_THRESHOLDS.TEMP_COLD || temperature_max < WEATHER_THRESHOLDS.TEMP_COOL) {
    accessories.push('jacket');
  }

  if (temperature_min < WEATHER_THRESHOLDS.TEMP_COLD) {
    accessories.push('scarf');
  }

  if (temperature_max > WEATHER_THRESHOLDS.TEMP_WARM && WEATHER_CODES.CLEAR.includes(weather_code)) {
    accessories.push('sunglasses', 'sunscreen', 'hat');
  }

  if (temperature_max > WEATHER_THRESHOLDS.TEMP_HOT) {
    accessories.push('water bottle');
  }

  return [...new Set(accessories)];
}

export function generateWeatherSuggestion(weather: WeatherData): WeatherSuggestion {
  const category = categorizeDayWeather(weather);
  const accessories = suggestAccessoriesForWeather(weather);

  let message = '';

  switch (category) {
    case 'indoor-focused':
      message = 'Weather conditions favor indoor activities today';
      break;
    case 'mixed':
      message = 'Mixed weather conditions - plan for both indoor and outdoor activities';
      break;
    case 'good-outdoor':
      message = 'Great weather for outdoor activities';
      break;
  }

  return {
    category,
    message,
    suggested_accessories: accessories,
  };
}

export function enrichWeatherWithMetadata(weather: WeatherData): DayWeather {
  return {
    ...weather,
    category: categorizeDayWeather(weather),
    icon: getWeatherIcon(weather.weather_code),
  };
}

export function suggestIndoorActivities(city: string): string[] {
  return [
    'Visit museums and art galleries',
    'Explore indoor markets and shopping centers',
    'Try local cafes and restaurants',
    'Visit historical buildings and indoor attractions',
    'Attend a theater performance or cinema',
    'Explore libraries and bookshops',
    'Visit indoor observation decks',
  ];
}

export function adjustActivitiesForWeather(
  weatherData: WeatherData[],
  tripDays: number
): { day: number; suggestion: string }[] {
  const suggestions: { day: number; suggestion: string }[] = [];

  const dayCategories = weatherData.map((w, index) => ({
    day: index + 1,
    category: categorizeDayWeather(w),
    precipitation: w.precipitation_probability,
  }));

  const indoorDays = dayCategories.filter(d => d.category === 'indoor-focused');
  const goodDays = dayCategories.filter(d => d.category === 'good-outdoor');

  if (indoorDays.length > 0 && goodDays.length > 0) {
    indoorDays.forEach(badDay => {
      const bestAlternative = goodDays[0];
      if (bestAlternative) {
        suggestions.push({
          day: badDay.day,
          suggestion: `Consider moving outdoor activities from Day ${badDay.day} to Day ${bestAlternative.day} (better weather)`,
        });
      }
    });
  }

  return suggestions;
}

export function aggregatePackingList(weatherData: WeatherData[]): {
  [category: string]: string[];
} {
  const allAccessories = weatherData.flatMap(w => suggestAccessoriesForWeather(w));
  const uniqueAccessories = [...new Set(allAccessories)];

  const categories: { [key: string]: string[] } = {
    'Rain Protection': [],
    'Cold Weather': [],
    'Sun Protection': [],
    'General': [],
  };

  uniqueAccessories.forEach(item => {
    if (item.includes('umbrella') || item.includes('waterproof')) {
      categories['Rain Protection'].push(item);
    } else if (item.includes('coat') || item.includes('jacket') || item.includes('gloves') || item.includes('scarf') || item.includes('winter')) {
      categories['Cold Weather'].push(item);
    } else if (item.includes('sunglasses') || item.includes('sunscreen') || item.includes('hat')) {
      categories['Sun Protection'].push(item);
    } else {
      categories['General'].push(item);
    }
  });

  Object.keys(categories).forEach(key => {
    if (categories[key].length === 0) {
      delete categories[key];
    }
  });

  return categories;
}

export function formatWeatherForAI(weatherData: WeatherData[]): string {
  return weatherData.map((w, index) => {
    const category = categorizeDayWeather(w);
    const dayNum = index + 1;
    const date = new Date(w.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    let condition = '';
    if (w.precipitation_probability >= WEATHER_THRESHOLDS.PRECIPITATION_HEAVY) {
      condition = 'Heavy rain expected';
    } else if (w.precipitation_probability >= WEATHER_THRESHOLDS.PRECIPITATION_MODERATE) {
      condition = 'Rain likely';
    } else if (WEATHER_CODES.SNOW.includes(w.weather_code)) {
      condition = 'Snow expected';
    } else if (WEATHER_CODES.CLEAR.includes(w.weather_code)) {
      condition = 'Clear skies';
    } else {
      condition = 'Cloudy';
    }

    return `Day ${dayNum} (${date}): ${condition}, ${Math.round(w.temperature_min)}°C-${Math.round(w.temperature_max)}°C, ${w.precipitation_probability}% precipitation${category === 'indoor-focused' ? ' - FAVOR INDOOR ACTIVITIES' : category === 'good-outdoor' ? ' - GREAT FOR OUTDOOR ACTIVITIES' : ''}`;
  }).join('\n');
}
