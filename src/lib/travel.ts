import { City, TravelLeg, TravelMode, TravelModeOption } from '../types';

export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return Math.round(distance);
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

export function estimateTravelTime(distance: number, mode: TravelMode): number {
  const speeds = {
    flight: 800,
    train: 120,
    car: 80,
    bus: 60,
  };

  let effectiveDistance = distance;
  if (mode === 'flight') {
    effectiveDistance += 100;
  }

  const timeInHours = effectiveDistance / speeds[mode];
  return Math.round(timeInHours * 60);
}

export function recommendTravelMode(distance: number): TravelMode {
  if (distance < 100) {
    return 'car';
  } else if (distance < 400) {
    return 'train';
  } else if (distance < 1000) {
    return 'train';
  } else {
    return 'flight';
  }
}

export function getTravelOptions(distance: number): TravelModeOption[] {
  const recommendedMode = recommendTravelMode(distance);
  const modes: TravelMode[] = ['flight', 'train', 'car', 'bus'];

  const options: TravelModeOption[] = modes.map((mode) => ({
    mode,
    duration: estimateTravelTime(distance, mode),
    isRecommended: mode === recommendedMode,
  }));

  const relevantOptions = options.filter((option) => {
    if (distance < 100 && option.mode === 'flight') return false;
    if (distance > 1500 && (option.mode === 'car' || option.mode === 'bus')) return false;
    return true;
  });

  return relevantOptions.sort((a, b) => {
    if (a.isRecommended && !b.isRecommended) return -1;
    if (!a.isRecommended && b.isRecommended) return 1;
    return a.duration - b.duration;
  });
}

export function calculateTravelLegs(cities: City[], originCity?: City | null): TravelLeg[] {
  const legs: TravelLeg[] = [];

  if (!cities || cities.length === 0) {
    return legs;
  }

  const allCities = originCity ? [originCity, ...cities] : cities;

  for (let i = 0; i < allCities.length - 1; i++) {
    const fromCity = allCities[i];
    const toCity = allCities[i + 1];

    const distance = calculateDistance(
      fromCity.latitude,
      fromCity.longitude,
      toCity.latitude,
      toCity.longitude
    );

    const options = getTravelOptions(distance);

    legs.push({
      fromCity,
      toCity,
      distance,
      options,
    });
  }

  return legs;
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${mins}m`;
}
