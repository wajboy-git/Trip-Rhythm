import { supabase } from './supabase';
import type { Trip, Itinerary, TripFormData, DayPlan } from '../types';

export async function createTrip(tripData: TripFormData): Promise<Trip> {
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
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create trip: ${error.message}`);
  }

  return data;
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

  return data || [];
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
