import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface RestaurantSearchRequest {
  location: string;
  cityName?: string;
}

interface RestaurantResult {
  name: string;
  rating: number;
  userRatingsTotal: number;
  address: string;
  phoneNumber?: string;
  priceLevel?: number;
  openNow?: boolean;
  placeId: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const apiKey = Deno.env.get("GOOGLE_PLACES_API_KEY");

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "Google Places API key not configured" }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const { location, cityName }: RestaurantSearchRequest = await req.json();

    const searchQuery = cityName
      ? `restaurants near ${location} ${cityName}`
      : `restaurants near ${location}`;

    const textSearchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchQuery)}&key=${apiKey}`;

    const response = await fetch(textSearchUrl);

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch restaurant data" }),
        {
          status: response.status,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const data = await response.json();

    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      return new Response(
        JSON.stringify({ error: `Google Places API error: ${data.status}` }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (!data.results || data.results.length === 0) {
      return new Response(
        JSON.stringify({ results: [] }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const results: RestaurantResult[] = data.results
      .slice(0, 10)
      .map((place: any) => ({
        name: place.name,
        rating: place.rating || 0,
        userRatingsTotal: place.user_ratings_total || 0,
        address: place.formatted_address || "",
        phoneNumber: place.formatted_phone_number,
        priceLevel: place.price_level,
        openNow: place.opening_hours?.open_now,
        placeId: place.place_id,
      }))
      .sort((a: RestaurantResult, b: RestaurantResult) => {
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
          console.error("Failed to fetch phone number:", err);
        }
        return result;
      })
    );

    return new Response(
      JSON.stringify({ results: detailedResults }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Restaurant search error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Internal server error" }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
