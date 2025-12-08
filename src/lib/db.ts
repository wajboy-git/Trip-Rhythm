import { supabase } from './supabase';
import type { Trip, Itinerary, TripFormData, DayPlan, City, DeletedTripData } from '../types';

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
      consider_weather: tripData.consider_weather ?? true,
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

export async function deleteTripCities(tripId: string): Promise<void> {
  const { error } = await supabase
    .from('trip_cities')
    .delete()
    .eq('trip_id', tripId);

  if (error) {
    throw new Error(`Failed to delete trip cities: ${error.message}`);
  }
}

export async function deleteTrip(tripId: string): Promise<DeletedTripData> {
  const trip = await getTripById(tripId);
  if (!trip) {
    throw new Error('Trip not found');
  }

  const itineraries = await getItinerariesForTrip(tripId);
  const cities = trip.cities?.map(c => c.id) || [];

  await deleteItinerariesForTrip(tripId);
  await deleteTripCities(tripId);

  const { error } = await supabase
    .from('trips')
    .delete()
    .eq('id', tripId);

  if (error) {
    throw new Error(`Failed to delete trip: ${error.message}`);
  }

  return {
    trip,
    cities,
    itineraries,
    timestamp: Date.now(),
  };
}

export async function bulkDeleteTrips(tripIds: string[]): Promise<DeletedTripData[]> {
  const deletedData: DeletedTripData[] = [];

  for (const tripId of tripIds) {
    try {
      const data = await deleteTrip(tripId);
      deletedData.push(data);
    } catch (error) {
      console.error(`Failed to delete trip ${tripId}:`, error);
      throw error;
    }
  }

  return deletedData;
}

export async function restoreTripCities(tripId: string, cityIds: string[]): Promise<void> {
  if (cityIds.length === 0) return;

  const tripCities = cityIds.map((cityId, index) => ({
    trip_id: tripId,
    city_id: cityId,
    order_index: index + 1,
  }));

  const { error } = await supabase
    .from('trip_cities')
    .insert(tripCities);

  if (error) {
    throw new Error(`Failed to restore trip cities: ${error.message}`);
  }
}

export async function restoreItineraries(itineraries: Itinerary[]): Promise<void> {
  if (itineraries.length === 0) return;

  const { error } = await supabase
    .from('itineraries')
    .insert(itineraries.map(i => ({
      id: i.id,
      trip_id: i.trip_id,
      day_index: i.day_index,
      ai_plan_json: i.ai_plan_json,
      created_at: i.created_at,
    })));

  if (error) {
    throw new Error(`Failed to restore itineraries: ${error.message}`);
  }
}

export async function restoreTrip(deletedData: DeletedTripData): Promise<Trip> {
  const { trip, cities, itineraries } = deletedData;

  const { data, error } = await supabase
    .from('trips')
    .insert({
      id: trip.id,
      destination: trip.destination,
      start_date: trip.start_date,
      days: trip.days,
      travel_style: trip.travel_style,
      walking_tolerance: trip.walking_tolerance,
      wake_time: trip.wake_time,
      sleep_time: trip.sleep_time,
      must_see_places: trip.must_see_places,
      consider_weather: trip.consider_weather,
      origin_city_id: trip.origin_city_id,
      created_at: trip.created_at,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to restore trip: ${error.message}`);
  }

  await restoreTripCities(trip.id, cities);
  await restoreItineraries(itineraries);

  return data;
}

export async function bulkRestoreTrips(deletedDataArray: DeletedTripData[]): Promise<Trip[]> {
  const restoredTrips: Trip[] = [];

  for (const deletedData of deletedDataArray) {
    try {
      const trip = await restoreTrip(deletedData);
      restoredTrips.push(trip);
    } catch (error) {
      console.error(`Failed to restore trip ${deletedData.trip.id}:`, error);
      throw error;
    }
  }

  return restoredTrips;
}
