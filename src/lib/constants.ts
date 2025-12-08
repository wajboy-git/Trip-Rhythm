export const UNDO_TIMEOUT_MS = 10000;

export const WEATHER_CACHE_DURATION_MS = 3600000;

export const OPEN_METEO_BASE_URL = 'https://api.open-meteo.com/v1';

export const WEATHER_THRESHOLDS = {
  PRECIPITATION_LIGHT: 30,
  PRECIPITATION_MODERATE: 60,
  PRECIPITATION_HEAVY: 80,
  TEMP_COLD: 10,
  TEMP_COOL: 15,
  TEMP_WARM: 25,
  TEMP_HOT: 30,
} as const;

export const WEATHER_CODES = {
  CLEAR: [0, 1],
  PARTLY_CLOUDY: [2],
  CLOUDY: [3],
  FOGGY: [45, 48],
  DRIZZLE: [51, 53, 55],
  RAIN: [61, 63, 65, 80, 81, 82],
  SNOW: [71, 73, 75, 77, 85, 86],
  THUNDERSTORM: [95, 96, 99],
} as const;
