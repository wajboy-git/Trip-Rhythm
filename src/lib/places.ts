export interface RestaurantResult {
  name: string;
  rating: number;
  userRatingsTotal: number;
  address: string;
  phoneNumber?: string;
  priceLevel?: number;
  openNow?: boolean;
  placeId: string;
}

export function extractLocationFromMeal(activityName: string): string {
  const patterns = [
    /(?:lunch|dinner|breakfast|brunch|meal)\s+(?:at|in|near)\s+(.+)/i,
    /(?:at|in|near)\s+(.+?)(?:\s+for\s+(?:lunch|dinner|breakfast|brunch))?$/i,
  ];

  for (const pattern of patterns) {
    const match = activityName.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  return activityName;
}

export async function searchRestaurants(
  location: string,
  time: string,
  cityName?: string
): Promise<RestaurantResult[]> {
  const apiKey = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;

  if (!apiKey) {
    throw new Error('Google Places API key not configured');
  }

  const searchQuery = cityName
    ? `restaurants near ${location} ${cityName}`
    : `restaurants near ${location}`;

  try {
    const textSearchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchQuery)}&key=${apiKey}`;

    const response = await fetch(textSearchUrl);

    if (!response.ok) {
      throw new Error('Failed to fetch restaurant data');
    }

    const data = await response.json();

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      throw new Error(`Google Places API error: ${data.status}`);
    }

    if (!data.results || data.results.length === 0) {
      return [];
    }

    const results: RestaurantResult[] = data.results
      .slice(0, 10)
      .map((place: any) => ({
        name: place.name,
        rating: place.rating || 0,
        userRatingsTotal: place.user_ratings_total || 0,
        address: place.formatted_address || '',
        phoneNumber: place.formatted_phone_number,
        priceLevel: place.price_level,
        openNow: place.opening_hours?.open_now,
        placeId: place.place_id,
      }))
      .sort((a, b) => {
        if (b.rating !== a.rating) {
          return b.rating - a.rating;
        }
        return b.userRatingsTotal - a.userRatingsTotal;
      });

    const detailedResults = await Promise.all(
      results.map(async (result) => {
        try {
          const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${result.placeId}&fields=formatted_phone_number&key=${apiKey}`;
          const detailsResponse = await fetch(detailsUrl);

          if (detailsResponse.ok) {
            const detailsData = await detailsResponse.json();
            if (detailsData.result?.formatted_phone_number) {
              result.phoneNumber = detailsData.result.formatted_phone_number;
            }
          }
        } catch (err) {
          console.error('Failed to fetch phone number:', err);
        }
        return result;
      })
    );

    return detailedResults;
  } catch (error) {
    console.error('Restaurant search error:', error);
    throw error;
  }
}
