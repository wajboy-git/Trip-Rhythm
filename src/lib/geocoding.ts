export interface CityLocation {
  name: string;
  country: string;
  country_code: string;
  latitude: number;
  longitude: number;
  admin1?: string;
}

interface GeocodingResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  country_code: string;
  admin1?: string;
}

interface GeocodingResponse {
  results?: GeocodingResult[];
  generationtime_ms?: number;
}

export async function searchCities(query: string): Promise<CityLocation[]> {
  if (!query || query.trim().length < 2) {
    return [];
  }

  try {
    const url = new URL('https://geocoding-api.open-meteo.com/v1/search');
    url.searchParams.append('name', query.trim());
    url.searchParams.append('count', '10');
    url.searchParams.append('language', 'en');
    url.searchParams.append('format', 'json');

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`Geocoding API error: ${response.status}`);
    }

    const data: GeocodingResponse = await response.json();

    if (!data.results || data.results.length === 0) {
      return [];
    }

    return data.results.map((result) => ({
      name: result.name,
      country: result.country,
      country_code: result.country_code,
      latitude: result.latitude,
      longitude: result.longitude,
      admin1: result.admin1,
    }));
  } catch (error) {
    console.error('Error fetching city data:', error);
    throw new Error('Failed to search for cities. Please try again.');
  }
}

export function formatCityDisplay(location: CityLocation): string {
  const parts = [location.name];

  if (location.admin1) {
    parts.push(location.admin1);
  }

  parts.push(location.country);

  return parts.join(', ');
}
