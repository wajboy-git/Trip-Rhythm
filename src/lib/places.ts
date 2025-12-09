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
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase configuration missing');
  }

  try {
    const edgeFunctionUrl = `${supabaseUrl}/functions/v1/restaurant-search`;

    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        location,
        cityName,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || 'Failed to fetch restaurant data');
    }

    const data = await response.json();

    if (!data.results) {
      return [];
    }

    return data.results;
  } catch (error) {
    console.error('Restaurant search error:', error);
    throw error;
  }
}
