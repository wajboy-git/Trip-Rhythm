import { supabase } from './supabase';
import type { Trip, Itinerary, TripFormData, DayPlan, City } from '../types';

export async function createOrGetCity(cityData: {
  name: string;
  country: string;
  country_code?: string;
  latitude: number;
  longitude: number;
}): Promise<City> {
  const { data: existingCity, error: searchError } = await supabase
    .from('cities')
    .select('*')
    .eq('name', cityData.name)
    .eq('country', cityData.country)
    .maybeSingle();

  if (searchError) {
    throw new Error(`Failed to search for city: ${searchError.message}`);
  }

  if (existingCity) {
    return existingCity;
  }

  const { data, error } = await supabase
    .from('cities')
    .insert({
      name: cityData.name,
      country: cityData.country,
      country_code: cityData.country_code || null,
      latitude: cityData.latitude,
      longitude: cityData.longitude,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create city: ${error.message}`);
  }

  return data;
}

export async function linkCitiesToTrip(
  tripId: string,
  cityIds: string[]
): Promise<void> {
  const tripCities = cityIds.map((cityId, index) => ({
    trip_id: tripId,
    city_id: cityId,
    order_index: index + 1,
  }));

  const { error } = await supabase.from('trip_cities').insert(tripCities);

  if (error) {
    throw new Error(`Failed to link cities to trip: ${error.message}`);
  }
}

export async function createTrip(tripData: TripFormData): Promise<Trip> {
  let originCityId: string | null = null;

  if (tripData.originCity) {
    const originCity = await createOrGetCity(tripData.originCity);
    originCityId = originCity.id;
  }

  const { data, error } = await supabase
    .from('trips')
    .insert({
      destination: tripData.destination,
      start_date: tripData.start_date,
      days: tripData.days,
      travel_style: tripData.travel_style,
      walking_tolerance: tripData.walking_tolerance,
      wake_time: tripData.wake_time,
      sleep_time: tripData.sleep_time,
      must_see_places: tripData.must_see_places || null,
      origin_city_id: originCityId,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create trip: ${error.message}`);
  }

  if (tripData.cities && tripData.cities.length > 0) {
    const cityRecords = await Promise.all(
      tripData.cities.map((city) => createOrGetCity(city))
    );
    const cityIds = cityRecords.map((city) => city.id);
    await linkCitiesToTrip(data.id, cityIds);
  }

  return data;
}

export async function getCitiesForTrip(tripId: string): Promise<City[]> {
  const { data, error } = await supabase
    .from('trip_cities')
    .select('city_id, order_index, cities(*)')
    .eq('trip_id', tripId)
    .order('order_index', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch cities for trip: ${error.message}`);
  }

  return (data || []).map((tc: any) => tc.cities).filter(Boolean);
}

export async function getTripById(tripId: string): Promise<Trip | null> {
  const { data, error } = await supabase
    .from('trips')
    .select('*')
    .eq('id', tripId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch trip: ${error.message}`);
  }

  if (data) {
    const cities = await getCitiesForTrip(tripId);
    data.cities = cities;

    if (data.origin_city_id) {
      const { data: originCity, error: originError } = await supabase
        .from('cities')
        .select('*')
        .eq('id', data.origin_city_id)
        .maybeSingle();

      if (!originError && originCity) {
        data.originCity = originCity;
      }
    }
  }

  return data;
}

export async function getRecentTrips(limit: number = 10): Promise<Trip[]> {
  const { data, error } = await supabase
    .from('trips')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to fetch recent trips: ${error.message}`);
  }

  const trips = data || [];

  const tripsWithCities = await Promise.all(
    trips.map(async (trip) => {
      const cities = await getCitiesForTrip(trip.id);
      let originCity = null;

      if (trip.origin_city_id) {
        const { data: origin, error: originError } = await supabase
          .from('cities')
          .select('*')
          .eq('id', trip.origin_city_id)
          .maybeSingle();

        if (!originError && origin) {
          originCity = origin;
        }
      }

      return { ...trip, cities, originCity };
    })
  );

  return tripsWithCities;
}

export async function createItineraryDay(
  tripId: string,
  dayIndex: number,
  dayPlan: DayPlan
): Promise<Itinerary> {
  const { data, error } = await supabase
    .from('itineraries')
    .insert({
      trip_id: tripId,
      day_index: dayIndex,
      ai_plan_json: dayPlan,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create itinerary day: ${error.message}`);
  }

  return data;
}

export async function getItinerariesForTrip(tripId: string): Promise<Itinerary[]> {
  const { data, error } = await supabase
    .from('itineraries')
    .select('*')
    .eq('trip_id', tripId)
    .order('day_index', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch itineraries: ${error.message}`);
  }

  return data || [];
}

export async function updateItineraryDay(
  tripId: string,
  dayIndex: number,
  newDayPlan: DayPlan
): Promise<Itinerary> {
  const { data, error } = await supabase
    .from('itineraries')
    .update({ ai_plan_json: newDayPlan })
    .eq('trip_id', tripId)
    .eq('day_index', dayIndex)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update itinerary day: ${error.message}`);
  }

  return data;
}

export async function deleteItinerariesForTrip(tripId: string): Promise<void> {
  const { error } = await supabase
    .from('itineraries')
    .delete()
    .eq('trip_id', tripId);

  if (error) {
    throw new Error(`Failed to delete itineraries: ${error.message}`);
  }
}
